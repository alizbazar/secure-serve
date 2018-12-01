#!/usr/bin/env node
const express = require('express')
const localtunnel = require('localtunnel')
const uuid = require('uuid/v4')
const fs = require('fs')
const path = require('path')
const meow = require('meow')
const crypto = require('crypto')

const cli = meow(`
  Usage
    $ secure-serve <file>

  Options
    --port, -p       Port number to serve through on localhost
    --url-token, -u  Allow passing authorization token via ?t=... URL parameter

  Examples
    $ secure-serve content.json
`, {
  flags: {
    port: {
      type: 'string',
      alias: 'p',
    },
    'url-token': {
      type: 'boolean',
      alias: 'u',
    },
    'auth-token': {
      type: 'boolean',
      alias: 'a',
    },
  },
})

const authorizationKey = uuid()
const encryptionKey = uuid()
const [filename] = cli.input
const port = cli.flags.port || 5002

if (!filename) {
  exitWithErrors('Error: <targetFile> was empty.\n\nLaunch with node serve.js <targetFile>')
}

let fileContent = fs.readFileSync(path.resolve(filename), 'utf8')
if (!fileContent) {
  exitWithErrors('File content was empty or file did not exist')
}

if (!cli.flags.urlToken && !cli.authToken) {
  // encrypt content
  const cipher = crypto.createCipher('aes-256-cbc', encryptionKey)
  const encrypted = Buffer.concat([cipher.update(new Buffer(fileContent, "utf8")), cipher.final()])
  fileContent = encrypted.toString('base64')
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

    if (cli.flags.urlToken) {
      console.log('\nServing file successfully using least secure option.\n\nTo download elsewhere, use:\n')
      console.log(`\t${tunnel.url}/get?t=${authorizationKey}\n`)
    } else if (cli.flags.authToken) {
      console.log('\nServing file successfully. Note: plain text content is visible to localtunnel.me.\n\nTo download elsewhere, run:\n')
      console.log(`\tcurl -H "Authorization: Bearer ${authorizationKey}" ${tunnel.url}/get > "${path.basename(filename)}"\n`)
    } else {
      console.log('\nServing file successfully. Content is encrypted.\n\nTo download elsewhere, run:\n')
      console.log(`
--------
const crypto = require('crypto')
const request = require('request')

// NOTE: pass keys through cli argument process.argv[2]
//       or via environment variable
const [authorizationKey, encryptionKey] = '${authorizationKey}:${encryptionKey}'.split(':')

request({
  url: '${tunnel.url}/get',
  headers: {
    'Authorization': ['Bearer', authorizationKey].join(' '),
  },
}, function (err, res, body) {
  if (err) {
    return console.log('Error occurred', err)
  }
  const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey)
  const decrypted = Buffer.concat([decipher.update(Buffer.from(body, 'base64')), decipher.final()])
  const content = decrypted.toString('utf8')

  console.log('Decrypted content - do what you want:')
  console.log(content)
})
--------
      `)
    }
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
  if (cli.flags.urlToken && req.query.t && req.query.t === authorizationKey) {
    return next()
  }
  res.status(401).send('Unauthorized')
}

function getFile (res, res) {
  res.send(fileContent)
}

function exitWithErrors (...errors) {
  errors.forEach(err => {
    console.error(err)
  })
  process.exit(1)
}
