import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export function apiOrigin(value) {
  if (!value?.trim()) throw new Error('Configurar VITE_API_URL durante el build: https://BACKEND/api')
  const url = new URL(value.trim())
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    throw new Error('VITE_API_URL debe usar HTTPS; HTTP solo se admite para pruebas en localhost.')
  }
  if (url.username || url.password || url.search || url.hash || url.pathname.replace(/\/+$/, '') !== '/api') {
    throw new Error('VITE_API_URL debe terminar en /api, sin credenciales, query ni fragmento.')
  }
  if (!/^[a-z0-9.[\]:-]+$/i.test(url.hostname)) throw new Error('Host de VITE_API_URL inválido.')
  return url.origin
}

export function nginxConfig(template, apiUrl) {
  return template.replaceAll('__API_ORIGIN__', apiOrigin(apiUrl))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const template = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8')
  const output = process.argv[2]
  if (!output) throw new Error('Indicar la ruta de salida de nginx.conf.')
  writeFileSync(output, nginxConfig(template, process.env.VITE_API_URL))
}
