#!/usr/bin/env node
/* 本地预览：node tools/serve.mjs  然后开 http://127.0.0.1:8088
 *
 * 为什么不能直接双击 index.html：页面用 XMLHttpRequest 读 data/versions.json，
 * 而 file:// 协议下那是跨域请求，会被浏览器拦掉，页面会显示"读不到清单"。
 * 所以必须走一个 HTTP 服务。 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 8088);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon'
};

createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = join(ROOT, normalize(p).replace(/^([/\\])+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 ' + p);
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log('TNDDOS 官网预览: http://127.0.0.1:' + PORT);
});
