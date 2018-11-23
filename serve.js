const express = require('express')
const localtunnel = require('localtunnel')
const uuid = require('uuid/v4')
const fs = require('fs')
const path = require('path')
const meow = require('meow')

const cli = meow(`
  Usage
    $ node serve.js <file>

  Options
    --port, -p  Port number to serve through on localhost

  Examples
    $ node serve.js content.json
`, {
  flags: {
    port: {
      type: 'string',
      alias: 'p',
    },
  },
})

function exitWithErrors (...errors) {
  errors.forEach(err => {
    console.error(err)
  })
  process.exit(1)
}

const authorizationKey = uuid()
const [filename] = cli.input
const port = cli.flags.port || 5002

if (!filename) {
  exitWithErrors('Error: <targetFile> was empty.\n\nLaunch with node serve.js <targetFile>')
}

const fileContent = fs.readFileSync(path.resolve(filename), 'utf8')
if (!fileContent) {
  exitWithErrors('File content was empty or file did not exist')
}

const app = express()
app.use(loggerMiddleware)
app.get('/get', authorize, getFile)

const server = app.listen(port, startTunnel)

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0)
  })
})

function startTunnel () {
  localtunnel(port, (err, tunnel) => {
    if (err) {
      exitWithErrors('Tunnel could not be established', err)
    }

    console.log('\nServing file successfully. To download elsewhere, run:\n')
    console.log(`\tcurl -H "Authorization: Bearer ${authorizationKey}" ${tunnel.url}/get > "${path.basename(filename)}"\n`)
  })
}

function loggerMiddleware (req, res, next) {
  const t = process.hrtime()
  const logRequest = (code = '?') => {
    const time = process.hrtime(t)
    const timeInMS = (time[0] * 1000 + time[1] / 1000000).toFixed(0)
    console.log(`${req.method} ${req.originalUrl} -> ${code} (${timeInMS}ms)`)
  }
  // Make sure requests lasting too long are logged
  const timeout = setTimeout(logRequest, 2000)

  const loggerOnFinish = () => {
    clearTimeout(timeout)
    res.removeListener('finish', loggerOnFinish)
    logRequest(res.statusCode)
  }

  res.on('finish', loggerOnFinish)

  next()
}

const authorizationPattern = /^Bearer (.+)$/i
function authorize (req, res, next) {
  const m = authorizationPattern.exec(req.headers.authorization || '')
  const receivedKey = m && m[1]
  if (receivedKey && receivedKey === authorizationKey) {
    return next()
  }
  res.status(401).send('Unauthorized')
}

function getFile (res, res) {
  res.send(fileContent)
}
