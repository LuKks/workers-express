module.exports = {
  json: () => json,
  form: () => form,
  text: () => text
}

async function json (req, res, next) {
  const type = req.headers.get('content-type') || ''

  if (type.includes('application/json')) {
    req.body = await req._request.json()
  }

  next()
}

async function form (req, res, next) {
  const type = req.headers.get('content-type') || ''

  // TODO: Double check with application/x-www-form-urlencoded
  if (type.includes('form')) {
    const formData = await req._request.formData()

    req.body = {}

    for (const entry of formData.entries()) {
      req.body[entry[0]] = entry[1]
    }
  }

  next()
}

async function text (req, res, next) {
  const type = req.headers.get('content-type') || ''

  if (type.includes('application/text') || type.includes('text/html')) {
    req.body = await req._request.text()
  }

  next()
}
