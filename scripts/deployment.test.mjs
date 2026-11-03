import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apiOrigin, nginxConfig } from './configure-nginx.mjs'

test('la CSP permite únicamente el origen de la API configurada', () => {
  const template = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8')
  const config = nginxConfig(template, 'https://api-hogares.example.uy:8443/api/')
  assert.ok(config.includes("connect-src 'self' https://api-hogares.example.uy:8443;"))
  assert.ok(!config.includes('__API_ORIGIN__'))
  assert.ok(!config.includes('proxy_pass'))
})

test('la API exige una URL pública explícita y HTTPS fuera de pruebas locales', () => {
  for (const value of ['', '/api', 'http://api.example.uy/api', 'ftp://api.example.uy/api']) {
    assert.throws(() => apiOrigin(value))
  }
  assert.equal(apiOrigin('http://127.0.0.1:5000/api'), 'http://127.0.0.1:5000')
})

test('rechaza credenciales, rutas equivocadas y contenido que alteraría Nginx', () => {
  for (const value of [
    'https://user:password@api.example.uy/api', 'https://api.example.uy/',
    'https://api.example.uy/api?x=1', 'https://api.example.uy/api#x',
    'https://api.example.uy;invalid/api',
  ]) assert.throws(() => apiOrigin(value))
})
