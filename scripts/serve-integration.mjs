// Isolated local test server. Production uses the Nginx image, not this script.
import http from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { nginxConfig } from './configure-nginx.mjs'

const root = resolve('dist')
const port = Number(process.env.INTEGRATION_FRONTEND_PORT || 4173)
const api = process.env.PLAYWRIGHT_API_URL || 'http://127.0.0.1:5001/api'
const configuration = nginxConfig(readFileSync('nginx.conf', 'utf8'), api)
const policy = configuration.match(/Content-Security-Policy "([^"]+)"/)[1]
const types = { '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.webp': 'image/webp', '.ico': 'image/x-icon', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml' }

http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    let file = resolve(root, `.${pathname}`)
    if (file !== root && !file.startsWith(`${root}${sep}`)) { response.writeHead(400); response.end(); return }
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (pathname.startsWith('/assets/')) { response.writeHead(404); response.end(); return }
      file = resolve(root, 'index.html')
    }
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Content-Security-Policy': policy, 'Cache-Control': 'no-store' })
    response.end(request.method === 'HEAD' ? undefined : readFileSync(file))
  } catch { response.writeHead(400); response.end() }
}).listen(port, '127.0.0.1', () => process.stdout.write(`Frontend de pruebas con CSP activo en http://127.0.0.1:${port}\n`))
