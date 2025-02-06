const express = require('../index.js')

const app = express()

app.use(express.json())

app.post('/echo', function (req, res) {
  res.json(req.body.msg)
})

export default app
