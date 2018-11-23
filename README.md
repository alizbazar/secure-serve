# Serve local file securely online

Serve a file using [localtunnel](https://github.com/localtunnel/localtunnel) with randomly generated authorization token.

This allows downloading the file elsewhere on the internet with `Authorization` header or `t=...` query parameter. Useful for passing content to a server or to another user on the internet without uploading the file.

Note: Do not use for highly sensitive content as the traffic is routed through [localtunnel.me](https://localtunnel.me), which may pose a security risk.

## Installation:

```
$ npm install -g secure-serve
```

## Usage:

```
Usage
  $ secure-serve <file>

Options
  --port, -p       Port number to serve through on localhost
  --url-token, -u  Allow authorizing via ?t=... URL parameter

Examples
  $ node secure-serve content.json
```
