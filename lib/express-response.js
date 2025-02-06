module.exports = class ExpressResponse {
  constructor () {
    this.response = null
    this.statusCode = 200
    this.headers = new Headers()
    this.headersSent = false
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
    } else {
      throw new Error('Data not supported')
    }
  }

  json (data) {
    this.headersSent = true
    this.response = Response.json(data, this.responseOptions())
  }

  end () {
    if (this.response) {
      return
    }

    this.headersSent = true
    this.response = Response.json(null, this.responseOptions())
  }

  responseOptions () {
    return {
      status: this.statusCode,
      headers: this.headers
    }
  }
}
