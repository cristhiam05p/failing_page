# Mini web local para pruebas de crawler

Aplicación Node.js + Express con 3 páginas HTML enlazadas entre sí y mecanismos para forzar errores HTTP 500 (puntual y persistente).

## Requisitos

- Node.js 18+ (recomendado)
- npm

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm start
```

Servidor por defecto en:

- http://localhost:3000

## Rutas principales

- `GET /` → Página principal con enlaces a `/page-1`, `/page-2`, `/page-3`
- `GET /page-1`
- `GET /page-2`
- `GET /page-3`
- `GET /admin` → Panel simple para activar/desactivar fallos persistentes

## Forzar HTTP 500

### 1) Modo puntual (query param)

Añade `?force500=1` a cualquiera de las páginas:

- `/page-1?force500=1`
- `/page-2?force500=1`
- `/page-3?force500=1`

Esto solo afecta esa petición.

### 2) Modo persistente (API)

#### Activar/desactivar fallo

`POST /api/fail`

Body JSON:

```json
{ "path": "/page-2", "enabled": true }
```

Para desactivar:

```json
{ "path": "/page-2", "enabled": false }
```

#### Consultar estado actual

`GET /api/state`

Respuesta ejemplo:

```json
{
  "failState": {
    "/page-1": false,
    "/page-2": true,
    "/page-3": false
  }
}
```

## Ejemplos con curl

```bash
# Ver estado
curl http://localhost:3000/api/state

# Activar fallo persistente en /page-2
curl -X POST http://localhost:3000/api/fail \
  -H 'Content-Type: application/json' \
  -d '{"path":"/page-2","enabled":true}'

# Comprobar que ahora responde 500
curl -i http://localhost:3000/page-2

# Desactivar fallo
curl -X POST http://localhost:3000/api/fail \
  -H 'Content-Type: application/json' \
  -d '{"path":"/page-2","enabled":false}'
```
