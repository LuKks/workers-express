// TODO: Cors is not being used right now

module.exports = function cors (opts = {}) {
  const origin = opts.origin || '*'
  const maxAge = opts.maxAge || 86400

  return function middleware (req, res, next) {
    if (req.method === 'OPTIONS') {
      res.headers.set('Access-Control-Allow-Origin', origin)
      res.headers.set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
      res.headers.set('Access-Control-Allow-Headers', '*')
      res.headers.set('Access-Control-Max-Age', maxAge)

      res.headers.set('Content-Length', '0')
      res.statusCode = 204
      res.end()

      return
    }

    res.headers.set('Access-Control-Allow-Origin', origin)

    next()
  }
}
