const { pathToRegexp } = require('path-to-regexp')
const ExpressRequest = require('./lib/express-request.js')
const ExpressResponse = require('./lib/express-response.js')
const bodyParser = require('./lib/body-parser.js')
const cookieParser = require('./lib/cookie-parser.js')

// Compatibility with Express
module.exports = express

function express () {
  return new Express()
}

express.json = bodyParser.json
express.text = bodyParser.text
express.urlencoded = bodyParser.form
express.cookies = cookieParser

class Express {
  constructor () {
    this.middlewares = []
    this.routes = []
    this.errors = []
  }

  async fetch (request, env) {
    const req = new ExpressRequest(request, env)
    const res = new ExpressResponse()

    // Sequential route ordering and matching
    // Intended to be simpler, thus incompatible with Express
    for (const route of this.routes) {
      const matchMethod = !route.method || req.method === route.method
      const matchPath = route.pathname ? req.pathname.match(route.pathname) : null

      if (matchMethod && (!route.pathname || matchPath)) {
        await this._run(req, res, route.callback)
      }

      if (res.headersSent || res.response) {
        break
      }
    }

    if (!res.response) {
      return new Response(null, { status: 500 })
    }

    return res.response
  }

  async _run (req, res, callback) {
    const resolver = promiseWithResolvers()

    try {
      await callback(req, res, resolver.resolve)
    } catch (err) {
      if (this.errors.length === 0) {
        throw err
      }

      for (const route of this.errors) {
        await route.callback(err, req, res, resolver.resolve)
      }
    }

    // Maybe a middleware responded earlier
    if (res.headersSent || res.response) {
      resolver.resolve()
    }

    await resolver.promise
  }

  _add (method, pathname, callback) {
    if (typeof method === 'function') {
      callback = method
      method = null
    } else if (typeof pathname === 'function') {
      callback = pathname
      pathname = null
    }

    if (typeof pathname === 'function') {
      callback = pathname
      pathname = null
    }

    if (callback.length === 4) {
      this.errors.push({ callback })
      return
    }

    const pathParsed = pathname ? pathToRegexp(pathname) : null
    const isMiddleware = callback.length === 3

    this.routes.push({
      method: isMiddleware ? null : method,
      pathname: pathParsed?.regexp || null,
      params: pathParsed?.keys || null,
      callback
    })
  }

  use (pathname, callback) {
    this._add(null, pathname, callback)
  }

  get (pathname, callback) {
    this._add('GET', pathname, callback)
  }

  post (pathname, callback) {
    this._add('POST', pathname, callback)
  }
}

function promiseWithResolvers () {
  let resolve = null
  let reject = null

  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  return { promise, resolve, reject }
}
