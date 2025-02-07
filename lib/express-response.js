const promiseWithResolvers = require('./promise-resolvers.js')

module.exports = class ExpressResponse {
  constructor (ctx) {
    this.statusCode = 200
    this.headers = new Headers()
    this.headersSent = false

    this._resolverHeaders = promiseWithResolvers()
    this._data = null

    this._streaming = false
    this._controller = null
    this._readable = new ReadableStream({
      start: controller => {
        this._controller = controller
      }
    })
    this._resolverStream = promiseWithResolvers()

    this._encoder = new TextEncoder()
  }

  setHeader (name, value) {
    this.headers.set(name, value)
  }

  status (code) {
    this.statusCode = code

    return this
  }

  send (data) {
    if (typeof data === 'object') {
      this.json(data)
      return
    }

    if (typeof data === 'string') {
      this.headersSent = true

      this.headers.set('Content-Type', 'application/json')

      this._data = data

      this._resolverHeaders.resolve()

      return
    }

    throw new Error('Data not supported')
  }

  json (data) {
    this.headersSent = true

    this.headers.set('Content-Type', 'application/json')

    this._data = JSON.stringify(data)

    this._resolverHeaders.resolve()
  }

  write (data) {
    this._streaming = true
    this.headersSent = true

    this.headers.set('Transfer-Encoding', 'chunked')
    this.headers.set('Content-Encoding', 'identity')

    if (typeof data === 'string') {
      this._controller.enqueue(this._encoder.encode(data))
    } else {
      this._controller.enqueue(data)
    }

    this._resolverHeaders.resolve()
  }

  end (data) {
    if (data) {
      this.write(data)
    }

    this._streaming = true
    this.headersSent = true

    this.headers.set('Transfer-Encoding', 'chunked')
    this.headers.set('Content-Encoding', 'identity')

    this._controller.close()
    this._resolverStream.resolve()

    this._resolverHeaders.resolve()
  }

  responseOptions () {
    return {
      status: this.statusCode,
      headers: this.headers
    }
  }
}
