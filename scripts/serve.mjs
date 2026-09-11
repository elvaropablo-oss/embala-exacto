import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const port = Number(process.env.PORT || 4175);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml' };

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    let pathname = decodeURIComponent(url.pathname).replace(/^\/embala-exacto\/?/, '');
    let file = path.join(root, pathname || 'index.html');
    if ((await stat(file).catch(() => null))?.isDirectory()) file = path.join(file, 'index.html');
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(port, () => console.log(`EmbalaExacto disponible en http://localhost:${port}/embala-exacto/`));
