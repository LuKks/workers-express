const { pathToRegexp } = require('path-to-regexp')
const ExpressRequest = require('./lib/express-request.js')
const ExpressResponse = require('./lib/express-response.js')
const bodyParser = require('./lib/body-parser.js')
const cookieParser = require('./lib/cookie-parser.js')
const promiseWithResolvers = require('./lib/promise-resolvers.js')

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

  async fetch (request, env, ctx) {
    const req = new ExpressRequest(request, env)
    const res = new ExpressResponse()

    // TODO: This easy fix allows real-time streaming of small chunks of data
    // Ideally, should find a better way to handle the async/stream flow
    this._routing(req, res).catch(err => {
      throw err
    })

    // Maybe a route handler is doing background operations
    if (!res.headersSent) {
      // TODO: Maybe timeout?
      await res._resolverHeaders.promise
    }

    if (ctx && res._streaming) {
      ctx.waitUntil(res._resolverStream.promise)
    }

    return new Response(res._streaming ? res._readable : res._data, res.responseOptions())
  }

  async _routing (req, res) {
    let found = false

    // Sequential route ordering and matching
    // Intended to be simpler, thus incompatible with Express
    for (const route of this.routes) {
      const matchMethod = !route.method || req.method === route.method
      const matchPath = route.pathname ? req.pathname.match(route.pathname) : null

      if (matchMethod && (!route.pathname || matchPath)) {
        await this._run(req, res, route.callback)

        // Found a matching route or middleware responded earlier
        if (route.callback.length === 2 || res.headersSent) {
          found = true
          break
        }
      }
    }

    if (!found) {
      res.statusCode = 404

      res.headersSent = true
      res._resolverHeaders.resolve()
    }
  }

  async _run (req, res, callback) {
    const resolver = promiseWithResolvers()

    try {
      if (callback.length === 3) {
        await callback(req, res, resolver.resolve)
      } else {
        await callback(req, res)
      }
    } catch (err) {
      if (this.errors.length === 0) {
        throw err
      }

      for (const route of this.errors) {
        await route.callback(err, req, res, resolver.resolve)
      }

      // Error happened but no response
      if (!res.headersSent) {
        res.statusCode = 500
        res.headersSent = true
        res._data = null
        res._resolverHeaders.resolve()
      }
    }

    // Maybe a middleware responded earlier
    if (res.headersSent) {
      resolver.resolve()
    }

    // Normal route so we auto-resolve
    if (callback.length === 2) {
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
