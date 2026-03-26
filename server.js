const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const CRAWL_PATHS = ['/page-1', '/page-2', '/page-3'];

// Estado persistente en memoria para simular fallos por ruta.
const failState = {
  '/page-1': false,
  '/page-2': false,
  '/page-3': false,
};

function renderLayout(title, bodyHtml) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.5; }
      nav ul { padding-left: 1.25rem; }
      code { background: #f4f4f4; padding: 0.1rem 0.3rem; border-radius: 4px; }
      .box { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
      button { margin-right: 0.5rem; }
      .ok { color: #0a7f34; }
      .fail { color: #b10000; }
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`;
}

function linksHtml(currentPath) {
  const links = CRAWL_PATHS.map((path) => {
    const marker = currentPath === path ? ' (actual)' : '';
    return `<li><a href="${path}">${path}</a>${marker}</li>`;
  }).join('');

  return `<nav>
    <strong>Enlaces de descubrimiento:</strong>
    <ul>${links}</ul>
  </nav>`;
}

function shouldFail(reqPath, query) {
  // Modo puntual: ?force500=1
  if (query.force500 === '1') return true;

  // Modo persistente: controlado por /api/fail
  return Boolean(failState[reqPath]);
}

function pageHandler(pagePath, pageTitle) {
  return (req, res) => {
    if (shouldFail(pagePath, req.query)) {
      return res.status(500).send(
        renderLayout(`500 en ${pagePath}`, `
          <h1>Error 500 simulado</h1>
          <p>Esta respuesta fue forzada para <code>${pagePath}</code>.</p>
          <p>Puedes quitar el modo puntual removiendo <code>?force500=1</code> o desactivar el fallo persistente en <a href="/admin">/admin</a>.</p>
          ${linksHtml(pagePath)}
          <p><a href="/">Volver al inicio</a></p>
        `)
      );
    }

    return res.status(200).send(
      renderLayout(pageTitle, `
        <h1>${pageTitle}</h1>
        <p>Estás viendo <code>${pagePath}</code>.</p>
        <p>Esta página responde con HTTP 200 por defecto.</p>
        ${linksHtml(pagePath)}
        <p><a href="/admin">Ir a admin</a> | <a href="/">Ir al inicio</a></p>
      `)
    );
  };
}

app.get('/', (req, res) => {
  res.status(200).send(
    renderLayout('Inicio crawler test', `
      <h1>Mini web para pruebas de crawler</h1>
      <p>Desde aquí puedes acceder a las 3 páginas de prueba.</p>
      ${linksHtml('/')}
      <div class="box">
        <p><strong>Fallo puntual por query param:</strong></p>
        <ul>
          <li><a href="/page-1?force500=1">/page-1?force500=1</a></li>
          <li><a href="/page-2?force500=1">/page-2?force500=1</a></li>
          <li><a href="/page-3?force500=1">/page-3?force500=1</a></li>
        </ul>
      </div>
      <p><a href="/admin">Abrir panel /admin</a></p>
    `)
  );
});

app.get('/page-1', pageHandler('/page-1', 'Página 1'));
app.get('/page-2', pageHandler('/page-2', 'Página 2'));
app.get('/page-3', pageHandler('/page-3', 'Página 3'));

app.post('/api/fail', (req, res) => {
  const { path, enabled } = req.body || {};

  if (!CRAWL_PATHS.includes(path)) {
    return res.status(400).json({
      error: 'Path inválido. Usa /page-1, /page-2 o /page-3.',
    });
  }

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({
      error: 'El campo "enabled" debe ser boolean (true/false).',
    });
  }

  failState[path] = enabled;
  return res.status(200).json({
    ok: true,
    path,
    enabled,
    state: failState,
  });
});

app.get('/api/state', (req, res) => {
  res.status(200).json({
    failState,
  });
});

app.get('/admin', (req, res) => {
  res.status(200).send(
    renderLayout('Admin fail state', `
      <h1>Panel administrativo</h1>
      <p>Activa o desactiva el HTTP 500 persistente por página.</p>
      <div id="status" class="box">Cargando estado...</div>
      <div class="box">
        <h2>Controles</h2>
        ${CRAWL_PATHS.map(
          (path) => `
            <div style="margin-bottom: 0.8rem;">
              <strong>${path}</strong><br />
              <button onclick="setFail('${path}', true)">Activar 500</button>
              <button onclick="setFail('${path}', false)">Desactivar 500</button>
              <a href="${path}" target="_blank" rel="noreferrer">Abrir</a>
            </div>
          `
        ).join('')}
      </div>
      <p><a href="/">Volver al inicio</a></p>
      <script>
        async function loadState() {
          const res = await fetch('/api/state');
          const data = await res.json();
          const rows = Object.entries(data.failState)
            .map(([path, enabled]) => {
              const cls = enabled ? 'fail' : 'ok';
              const label = enabled ? 'ACTIVO (500)' : 'inactivo (200)';
              return '<li><code>' + path + '</code>: <span class=\"' + cls + '\">' + label + '</span></li>';
            })
            .join('');

          document.getElementById('status').innerHTML =
            '<h2>Estado actual</h2><ul>' + rows + '</ul>';
        }

        async function setFail(path, enabled) {
          const res = await fetch('/api/fail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, enabled }),
          });

          if (!res.ok) {
            const errorText = await res.text();
            alert('Error al actualizar estado: ' + errorText);
            return;
          }

          await loadState();
        }

        loadState();
      </script>
    `)
  );
});

app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
