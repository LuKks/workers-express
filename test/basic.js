const path = require('path')
const test = require('brittle')
const wranglerWorker = require('wrangler-worker')
const express = require('../index.js')

test('wrangler', async function (t) {
  const worker = await wranglerWorker({
    t,
    filename: path.join(__dirname, 'worker.mjs')
  })

  const response = await worker.fetch(worker.$url + '/echo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ msg: 'Hello World!' })
  })

  t.is(response.status, 200)
  t.alike(await response.json(), 'Hello World!')
})

test('basic', async function (t) {
  const app = express()

  app.get('/', function (req, res) {
    res.json('Hello World!')
  })

  const response = await app.fetch(new Request('http://localhost/'))

  t.is(response.status, 200)
  t.alike(await response.json(), 'Hello World!')
})

test('stream response - background - worker', async function (t) {
  t.plan(3)

  const worker = await wranglerWorker({
    t,
    filename: path.join(__dirname, 'worker.mjs')
  })

  const response = await worker.fetch(worker.$url + '/stream-background', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ msg: 'Hello World!' })
  })

  t.is(response.status, 200)

  const decoder = new TextDecoder('utf-8')
  const chunks = []
  const expected = ['Hello', ' ', 'World', '!']

  for await (const chunk of response.body) {
    const value = decoder.decode(chunk)

    chunks.push(value)
  }

  t.is(chunks.length, 4)
  t.is(chunks.join(''), expected.join(''))
})

test('stream response - async - worker', async function (t) {
  t.plan(3)

  const worker = await wranglerWorker({
    t,
    filename: path.join(__dirname, 'worker.mjs')
  })

  const response = await worker.fetch(worker.$url + '/stream-async', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ msg: 'Hello World!' })
  })

  t.is(response.status, 200)

  const decoder = new TextDecoder('utf-8')
  const chunks = []
  const expected = ['Hello', ' ', 'World', '!']

  for await (const chunk of response.body) {
    const value = decoder.decode(chunk)

    chunks.push(value)
  }

  t.is(chunks.length, 4)
  t.is(chunks.join(''), expected.join(''))
})

test('routing', async function (t) {
  t.plan(5)

  let plan = 0

  const app = express()

  app.use(function (req, res, next) {
    t.is(++plan, 1)

    next()
  })

  app.use(function (req, res, next) {
    t.is(++plan, 2)

    next()
  })

  app.get('/', function (req, res) {
    t.fail()

    res.json(null)
  })

  app.get('/example', function (req, res) {
    t.is(++plan, 3)

    res.status(404).json(null)
  })

  const response = await app.fetch(new Request('http://localhost/example'))

  t.is(response.status, 404)
  t.alike(await response.json(), null)
})

test('middleware responds early', async function (t) {
  const app = express()

  app.use(function (req, res, next) {
    res.json('Early!')
  })

  app.get('/', function (req, res) {
    res.json('Hello World!')
  })

  const response = await app.fetch(new Request('http://localhost/'))

  t.is(response.status, 200)
  t.alike(await response.json(), 'Early!')
})

test('error', async function (t) {
  t.plan(3)

  const app = express()

  app.get('/', function (req, res) {
    throw new Error('Something went wrong')
  })

  app.use(function (err, req, res, next) {
    t.is(err.message, 'Something went wrong')

    next()
  })

  app.use(function (err, req, res, next) {
    res.json({ error: err.message })
  })

  const response = await app.fetch(new Request('http://localhost/'))

  t.is(response.status, 200)
  t.alike(await response.json(), { error: 'Something went wrong' })
})

test('error without response', async function (t) {
  t.plan(3)

  const app = express()

  app.get('/', function (req, res) {
    throw new Error('Something went wrong')
  })

  app.use(function (err, req, res, next) {
    t.is(err.message, 'Something went wrong')

    next()
  })

  const response = await app.fetch(new Request('http://localhost/'))

  t.is(response.status, 500)
  t.is(await response.text(), '')
})

test('body json', async function (t) {
  t.plan(3)

  const app = express()

  app.use(express.json())

  app.post('/signup', function (req, res) {
    t.alike(req.body, {
      key1: 'value1'
    })

    res.json(null)
  })

  const response = await app.fetch(new Request('http://localhost/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key1: 'value1' })
  }))

  t.is(response.status, 200)
  t.alike(await response.json(), null)
})

test('cookies', async function (t) {
  const app = express()

  // (Don't depend on this middleware.)
  app.use(express.cookies())

  app.get('/', function (req, res) {
    t.alike(req.cookies, {
      key1: 'value1',
      key2: 'value2'
    })

    res.json(null)
  })

  const response = await app.fetch(new Request('http://localhost/', {
    headers: {
      cookie: 'key1=value1; key2=value2'
    }
  }))

  t.is(response.status, 200)
  t.alike(await response.json(), null)
})
