const express = require('../index.js')

const app = express()

app.use(express.json())

app.post('/echo', function (req, res) {
  res.json(req.body.msg)
})

app.post('/stream-background', async function (req, res) {
  setTimeout(async () => {
    const data = ['Hello', ' ', 'World', '!']

    for (const chunk of data) {
      res.write(chunk)

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    res.end()
  }, 100)
})

app.post('/stream-async', async function (req, res) {
  const data = ['Hello', ' ', 'World', '!']

  for (const chunk of data) {
    res.write(chunk)

    await new Promise(resolve => setTimeout(resolve, 100))
  }

  res.end()
})

export default app
