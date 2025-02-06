module.exports = class ExpressRequest {
  constructor (request, env) {
    this._request = request

    this.env = env
    this.cf = request.cf

    const url = new URL(request.url)

    this.method = request.method
    this.url = request.url
    this.pathname = url.pathname
    this.headers = request.headers
    this.cookies = null
    this.body = undefined

    this.connection = {
      // TODO: This is assuming CloudFlare
      remoteAddress: request.headers.get('cf-connecting-ip')
    }
  }
}
