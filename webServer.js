const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/code', (req, res) => {
  const { code } = req.query;
  if (code == 'A') {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

function startWebServer() {
  app.listen(port, () => {
    console.log(`Web server is running at http://localhost:${port}`);
  });

  return app;
}

module.exports = startWebServer;
