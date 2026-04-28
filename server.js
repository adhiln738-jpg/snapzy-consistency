const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.mp4':  'video/mp4',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('404 Not Found: ' + urlPath);
    } else {
      res.writeHead(200, {'Content-Type': contentType});
      res.end(data);
    }
  });
}).listen(PORT, () => {
  console.log('✅ Snapzy Consistency running at http://localhost:' + PORT);
  console.log('   Landing page : http://localhost:' + PORT + '/index.html');
  console.log('   App          : http://localhost:' + PORT + '/app.html');
  console.log('\nPress Ctrl+C to stop the server.');
});
