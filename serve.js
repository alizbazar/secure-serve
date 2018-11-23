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

const authorizationKey = uuid()
const [filename] = cli.input
const port = cli.flags.port || 5002

if (!filename) {
  console.log('Error: <targetFile> was empty.\n\nLaunch with node serve.js <targetFile>')
  process.exit()
}

const fileContent = fs.readFileSync(path.resolve(filename), 'utf8')
if (!fileContent) {
  console.log('File content was empty or file did not exist')
  process.exit()
}

const app = express()

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
      console.log('Tunnel could not be established')
      console.log(err)
      process.exit()
    }

    console.log('\nServing file successfully. To download elsewhere, run:\n')
    console.log(`\tcurl -H "Authorization: Bearer ${authorizationKey}" ${tunnel.url}/get > "${path.basename(filename)}"`)
  })
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
