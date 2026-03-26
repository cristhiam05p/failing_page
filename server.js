const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const CRAWL_PATHS = ['/page-1', '/page-2', '/page-3'];

// In-memory persistent state used to simulate route-specific failures.
const failState = {
  '/page-1': false,
  '/page-2': false,
  '/page-3': false,
};

function renderLayout(title, bodyHtml) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 2rem;
        line-height: 1.7;
        max-width: 920px;
      }
      nav ul { padding-left: 1.25rem; }
      code {
        background: #f4f4f4;
        padding: 0.1rem 0.3rem;
        border-radius: 4px;
      }
      .box {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
      }
      button { margin-right: 0.5rem; }
      .ok { color: #0a7f34; }
      .fail { color: #b10000; }
      .muted { color: #666; }
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`;
}

function linksHtml(currentPath) {
  const links = CRAWL_PATHS.map((path) => {
    const marker = currentPath === path ? ' (current)' : '';
    return `<li><a href="${path}">${path}</a>${marker}</li>`;
  }).join('');

  return `<nav>
    <strong>Discovery links:</strong>
    <ul>${links}</ul>
  </nav>`;
}

function shouldFail(reqPath, query) {
  if (query.force500 === '1') return true;
  return Boolean(failState[reqPath]);
}

function crashRoute(pagePath) {
  // Deliberately throws to produce a real runtime failure.
  throw new Error(`Intentional failure triggered for ${pagePath}`);
}

function pageOneContent() {
  return `
    <h1>Urban Gardening Blog: Building a Balcony Harvest</h1>
    <p>
      Welcome to our urban gardening notebook, where small spaces become productive,
      beautiful, and surprisingly peaceful ecosystems. If you only have a balcony,
      a bright window, or a compact patio, you can still grow herbs, leafy greens,
      and even fruiting vegetables. The goal is not perfection; the goal is a repeatable
      routine that keeps plants healthy and keeps gardening enjoyable.
    </p>

    <h2>Start with light, not with seeds</h2>
    <p>
      Many beginners buy seeds first and only later discover that their space receives
      two hours of direct sun. That usually leads to disappointment. Instead, observe your
      location for a week: morning sun, midday heat, afternoon shade, and wind intensity.
      Once you map the light, choose crops that fit reality. Mint, parsley, and lettuce can
      do well in partial sun, while tomatoes and peppers generally need stronger, longer
      direct light.
    </p>

    <h2>Soil quality is your hidden advantage</h2>
    <p>
      In containers, soil is not just dirt; it is the full support system for roots,
      moisture retention, and nutrient access. Use a quality potting mix with compost,
      and avoid dense garden soil that compacts quickly. A lightweight, well-draining mix
      lets roots breathe, reduces fungal stress, and helps you recover faster from overwatering.
      Think of potting mix as infrastructure: if infrastructure is weak, everything else becomes harder.
    </p>

    <h2>Watering rhythm beats watering volume</h2>
    <p>
      New gardeners often overwater because they care. A better pattern is to check soil moisture
      by touch and water deeply only when needed. In warm months, containers can dry quickly,
      especially in terracotta pots or windy balconies. During cooler weeks, the same container
      may stay moist for days. Build a rhythm with your climate instead of following a rigid calendar.
      Plants reward consistency much more than intensity.
    </p>
  `;
}

function pageTwoContent() {
  return `
    <h1>Personal Finance Blog: A Practical Budgeting System</h1>
    <p>
      Good budgeting is not about punishment. It is about clarity, options, and reducing stress.
      A practical budget should help you make decisions quickly and confidently, especially when
      life gets unpredictable. If your current system feels heavy or fragile, a simpler structure
      can improve consistency and long-term results.
    </p>

    <h2>Use categories that reflect real behavior</h2>
    <p>
      Extremely detailed budgets can look impressive and still fail in practice. Start with a small
      set of meaningful categories: housing, food, transportation, utilities, health, savings,
      debt payments, and lifestyle spending. Clear categories make trade-offs visible. When spending
      drifts, you can correct quickly without auditing fifty tiny lines.
    </p>

    <h2>Separate fixed, flexible, and future money</h2>
    <p>
      Fixed expenses are predictable obligations like rent and subscriptions. Flexible expenses vary,
      such as groceries or entertainment. Future money includes emergency savings, annual costs,
      and long-term goals. This separation prevents a common mistake: using future money to cover
      today’s convenience. If every dollar has a role, your plan becomes stable under pressure.
    </p>

    <h2>Automate what should be non-negotiable</h2>
    <p>
      Savings contributions, debt payments, and core bills should be automated when possible.
      Automation lowers decision fatigue and protects your priorities from mood-based spending.
      Keep manual decisions for things that truly benefit from intention, such as gifts,
      travel, or hobby purchases. The right split between automatic and manual decisions
      creates both discipline and flexibility.
    </p>
  `;
}

function pageThreeContent() {
  return `
    <h1>Trail Running Blog: Training for Endurance and Recovery</h1>
    <p>
      Trail running combines cardiovascular effort, technical focus, and time in nature.
      Compared with flat road running, trails demand more from your balance, ankle stability,
      and pacing strategy. A smart plan builds endurance gradually while keeping injury risk low.
      The objective is long-term consistency, not short bursts of extreme mileage.
    </p>

    <h2>Train by effort, not only by pace</h2>
    <p>
      Trail elevation and terrain variability make pace an unreliable indicator.
      A moderate effort uphill can be excellent training even when your pace appears slow.
      Use perceived effort or heart-rate zones to keep easy days truly easy and hard sessions
      appropriately hard. This approach produces better adaptation and less overtraining.
    </p>

    <h2>Protect recovery as part of training</h2>
    <p>
      Recovery is where adaptation happens. Sleep quality, hydration, and nutrition in the
      first hours after a run influence how ready you are for the next session. Include low-impact
      mobility work for calves, hips, and ankles, especially after long descents. If soreness
      lingers, reduce load early instead of waiting for pain to become an injury.
    </p>

    <h2>Prepare for terrain and weather</h2>
    <p>
      Trail conditions can shift quickly with rain, heat, or wind. Choose shoes with reliable grip,
      carry basic hydration, and know your route before heading out. For longer runs, test your fuel
      strategy in training rather than experimenting on race day. Preparation turns uncertainty
      into manageable decisions and makes each run safer and more enjoyable.
    </p>
  `;
}

function pageHandler(pagePath, pageTitle, pageContent) {
  return (req, res) => {
    if (shouldFail(pagePath, req.query)) {
      crashRoute(pagePath);
    }

    return res.status(200).send(
      renderLayout(pageTitle, `
        ${pageContent}
        ${linksHtml(pagePath)}
        <p><a href="/admin">Open admin</a> | <a href="/">Back to home</a></p>
      `)
    );
  };
}

app.get('/', (req, res) => {
  res.status(200).send(
    renderLayout('Crawler test site home', `
      <h1>Mini website for crawler testing</h1>
      <p>
        This site includes three content-heavy blog pages with distinct topics,
        plus controls to intentionally trigger real server-side failures and HTTP 500 responses.
      </p>
      ${linksHtml('/')}
      <div class="box">
        <p><strong>One-off 500 mode via query param:</strong></p>
        <ul>
          <li><a href="/page-1?force500=1">/page-1?force500=1</a></li>
          <li><a href="/page-2?force500=1">/page-2?force500=1</a></li>
          <li><a href="/page-3?force500=1">/page-3?force500=1</a></li>
        </ul>
      </div>
      <p><a href="/admin">Open /admin panel</a></p>
    `)
  );
});

app.get('/page-1', pageHandler('/page-1', 'Page 1 - Urban Gardening Blog', pageOneContent()));
app.get('/page-2', pageHandler('/page-2', 'Page 2 - Personal Finance Blog', pageTwoContent()));
app.get('/page-3', pageHandler('/page-3', 'Page 3 - Trail Running Blog', pageThreeContent()));

app.post('/api/fail', (req, res) => {
  const { path, enabled } = req.body || {};

  if (!CRAWL_PATHS.includes(path)) {
    return res.status(400).json({
      error: 'Invalid path. Use /page-1, /page-2, or /page-3.',
    });
  }

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({
      error: 'The "enabled" field must be boolean (true/false).',
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
  res.status(200).json({ failState });
});

app.get('/admin', (req, res) => {
  res.status(200).send(
    renderLayout('Admin fail state', `
      <h1>Administrative panel</h1>
      <p>Enable or disable persistent HTTP 500 behavior per page.</p>
      <div id="status" class="box">Loading state...</div>
      <div class="box">
        <h2>Controls</h2>
        ${CRAWL_PATHS.map(
          (path) => `
            <div style="margin-bottom: 0.8rem;">
              <strong>${path}</strong><br />
              <button onclick="setFail('${path}', true)">Enable 500</button>
              <button onclick="setFail('${path}', false)">Disable 500</button>
              <a href="${path}" target="_blank" rel="noreferrer">Open page</a>
            </div>
          `,
        ).join('')}
      </div>
      <p><a href="/">Back to home</a></p>
      <script>
        async function loadState() {
          const res = await fetch('/api/state');
          const data = await res.json();
          const rows = Object.entries(data.failState)
            .map(([path, enabled]) => {
              const cls = enabled ? 'fail' : 'ok';
              const label = enabled ? 'ENABLED (500)' : 'disabled (200)';
              return '<li><code>' + path + '</code>: <span class="' + cls + '">' + label + '</span></li>';
            })
            .join('');

          document.getElementById('status').innerHTML =
            '<h2>Current state</h2><ul>' + rows + '</ul>';
        }

        async function setFail(path, enabled) {
          const res = await fetch('/api/fail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, enabled }),
          });

          if (!res.ok) {
            const errorText = await res.text();
            alert('Error updating state: ' + errorText);
            return;
          }

          await loadState();
        }

        loadState();
      </script>
    `),
  );
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error('Unhandled route failure:', err.message);
  return res.status(500).send(
    renderLayout(`500 on ${req.path}`, `
      <h1>500 Internal Server Error</h1>
      <p>The page failed due to an actual server-side runtime error.</p>
      <p><code>${err.message}</code></p>
      <p>You can remove one-off mode by deleting <code>?force500=1</code> or disable persistent mode in <a href="/admin">/admin</a>.</p>
      ${linksHtml(req.path)}
      <p><a href="/">Back to home</a></p>
    `),
  );
});

app.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
});
