# Hogares Estudiantiles · Frontend

Landing institucional, formulario de inscripción y consulta de estado de la Intendencia de Lavalleja.
React, TypeScript y Vite. Conserva el formulario, los borradores locales y el comprobante.

Backend y panel administrativo: [hogares-backend](https://github.com/IntendenciaDeLavalleja/hogares-backend).

## Desarrollo

Node.js 24 y npm:

```bash
npm ci
cp .env.example .env
npm run dev
```

Con `VITE_API_URL=/api`, Vite redirige las llamadas al backend local en `http://127.0.0.1:5000`.
También se puede configurar una URL absoluta, incluyendo `/api`, si el backend permite el origen local por CORS.

```bash
npm run check
```

Ejecuta pruebas unitarias, configuración de despliegue, lint, TypeScript, compilación y navegador móvil/escritorio.
Instalar los motores con `npx playwright install chromium webkit` antes de la primera prueba de navegador.
La matriz incluye escritorio, Android Chromium e iPhone WebKit, con verificaciones de modo oscuro,
contraste, PDFs, fotos y recuperación de errores. Son pruebas de navegador emulado, no dispositivos físicos.
Playwright se fija en `1.63.0` mientras se corrige la [regresión de CSP de WebKit en 1.64](https://github.com/microsoft/playwright/issues/43497);
las pruebas siguen rechazando cualquier violación CSP y la política de producción se conserva.

## Actualización del formulario en producción

Desplegar primero el backend y después reconstruir este frontend, conservando las variables de ambos.
Los borradores existentes mantienen su identificador y las solicitudes enviadas no se modifican.
Quienes estaban completando una solicitud deben recargar la página en el mismo navegador;
**no borrar el almacenamiento del sitio ni iniciar una solicitud nueva para resolver un error de carga**.
Las respuestas locales se conservan y el formulario comprueba los adjuntos guardados en el servidor.

El formulario guarda el avance cifrado antes del envío y muestra el comprobante únicamente cuando
la API confirma la solicitud. Las cargas se procesan en cola y admiten reintento sin seleccionar
el archivo otra vez mientras se conserve esa pestaña. Si se pierde una respuesta, se consulta
el borrador para recuperar el resultado. El tema claro se mantiene legible cuando el teléfono usa
modo oscuro. No es necesario cambiar claves de cifrado ni ejecutar migraciones para esta actualización.

## Inscripción completa con API real aislada

Desde el repositorio backend, con sus dependencias de desarrollo instaladas:

```bash
python tests/browser_server.py
```

Usa una base SQLite temporal y archivos en memoria; no usa datos ni correo de producción.
Desde este frontend, en otra terminal:

```bash
VITE_API_URL=http://127.0.0.1:5001/api VITE_APPLICATION_YEAR=2027 npm run build
node scripts/serve-integration.mjs
```

Con ambos procesos activos, ejecutar `npm run test:integration`. El servidor del frontend aplica
la CSP de producción con el origen de esa API local. Se recorren los ocho pasos, guardado de avance,
JPEG/PDF, recarga, captcha, envío, comprobante, idempotencia y seguimiento en tres motores/dispositivos
emulados. Los tests rechazan URLs de producción. CI repite este flujo contra el backend de `main`.

## Coolify: recurso independiente

1. Crear una aplicación desde este repositorio, rama `main`, build pack **Dockerfile**.
2. Base Directory `/`, Dockerfile Location `/Dockerfile`, puerto interno **8080**.
3. Asignar un dominio HTTPS, por ejemplo `https://hogares.example.uy`.
4. Agregar las variables de `.env.coolify.example`, disponibles **durante el build**:

```dotenv
VITE_API_URL=https://api-hogares.example.uy/api
VITE_APPLICATION_YEAR=2027
```

5. En el backend, configurar `CORS_ORIGINS=https://hogares.example.uy` y `APPLICATION_YEAR=2027`.
6. Desplegar y comprobar `/`, `/solicitud`, `/comprobante` y `/health`.

`VITE_API_URL` es la URL pública HTTPS del backend **terminada en `/api`**. No usar nombres internos
de contenedores: las solicitudes salen del navegador del visitante. Cambiar estas variables requiere
recompilar y volver a desplegar. Son valores públicos; no colocar contraseñas en variables `VITE_*`.

El build configura automáticamente `connect-src` de la CSP con el origen exacto de la API.
Nginx sirve los archivos y las rutas de React sin depender de un contenedor llamado `backend`.
El panel está en `https://api-hogares.example.uy/admin/login` y se sirve íntegramente desde Flask.

Healthcheck de Coolify: HTTP GET `/health`, puerto 8080, estado 200.
No se necesitan volúmenes en el frontend. TLS lo termina el proxy de Coolify.

## Verificación de la conexión

En el navegador, crear una inscripción de prueba y consultar su código/correo desde la landing.
Si aparece un error CORS, comparar exactamente el protocolo, dominio y puerto de `CORS_ORIGINS`
con los del frontend; no incluir rutas ni el puerto interno de Coolify. Si cambia el dominio de la API,
actualizar `VITE_API_URL` y reconstruir el frontend.

## Diseño

Landing basada en [hogares-landing-temp](https://github.com/IntendenciaDeLavalleja/hogares-landing-temp),
commit `b936b6a1dd38dd365629d91e5cf9027f11567351`. Fuentes locales Archivo, IBM Plex Mono e Instrument Serif;
tema aislado en `src/features/landing` para conservar el estilo del formulario.

## Referencias de despliegue

- [Dockerfile en Coolify](https://coolify.io/docs/applications/builds/dockerfile).
- [Variables y alcance build/runtime en Coolify](https://coolify.io/docs/applications/configuration/environment-variables).
- [Variables compiladas de Vite](https://vite.dev/guide/env-and-mode.html).
