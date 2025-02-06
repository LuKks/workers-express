# simple-express

Express router for CloudFlare Workers

```
npm i simple-express
```

The routing behaviour compared to Express is not the exactly same.

Open an issue if a missing feature is needed.

## Usage

```js
const express = require('simple-express')

const app = express()

app.use(express.json())

app.get('/', function (req, res) {
  res.json('Hello World!')
})

export default app
```

CloudFlare will use the fetch method, for example:

```js
const response = await app.fetch(new Request('http://localhost/'))

console.log(response.status) // => 200
console.log(await response.json()) // => 'Hello World!'
```

## License

MIT
