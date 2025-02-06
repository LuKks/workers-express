module.exports = function promiseWithResolvers () {
  let resolve = null
  let reject = null

  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  return { promise, resolve, reject }
}
