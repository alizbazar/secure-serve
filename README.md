# Serve local file securely online

Serve a file using [localtunnel](https://github.com/localtunnel/localtunnel) with randomly generated authorization token.

This allows downloading the file elsewhere on the internet with `Authorization` header. Useful for example for passing content to a server or to another user on the internet.

Note: Do not use for highly sensitive content as the traffic is routed through [localtunnel.me](https://localtunnel.me), which may pose a security risk.

```
Usage
  $ node serve.js <file>

Options
  --port, -p  Port number to serve through on localhost

Examples
  $ node serve.js content.json 
```
