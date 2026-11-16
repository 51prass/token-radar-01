// Tiny static server for local testing: serves a directory (default out/) so the
// dashboard can load its data.js beside it, exactly as the grader's /output
// lays them out. Usage: node serve.ts [dir] [port]
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const dir = process.argv[2] ?? 'out';
const port = Number(process.argv[3] ?? 8902);
const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const file = join(dir, path === '/' ? 'dashboard/index.html' : path);
  if (!file.startsWith(dir) || !existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, () => process.stdout.write(`serving ${dir} on http://127.0.0.1:${port}/\n`));
