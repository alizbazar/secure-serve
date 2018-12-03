# Serve local file securely online in enrypted form

Serve a file using [localtunnel](https://github.com/localtunnel/localtunnel) encrypted with randomly generated authorization token.

This allows downloading the file elsewhere on the internet with `Authorization` header or `?t=...` query parameter. Useful for passing content to a server or to another user on the internet without uploading the file.

**NOTE:** DO NOT USE `url-token` or `auth-token` options for highly sensitive content. Using these options payload is transferred plain text through localtunnel.me.

## Installation:

```
$ npm install -g secure-serve
```

## Usage:

```
Usage
  $ secure-serve <file>

Options
  --port, -p        Port number to serve through on localhost
  --url-token, -u   Allow authorizing via ?t=... URL parameter. Disables file encryption.
  --auth-token, -a  Allow authorizing using header 'Authorization: Bearer xxx'. Disables file encryption.

Examples
  $ secure-serve content.json
```
