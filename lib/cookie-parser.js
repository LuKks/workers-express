const cookie = require('cookie')

module.exports = function cookieParser () {
  return cookies
}

function cookies (req, res, next) {
  if (req.cookies) {
    return
  }

  req.cookies = Object.assign({}, cookie.parse(req.headers.get('Cookie') || ''))

  next()
}
