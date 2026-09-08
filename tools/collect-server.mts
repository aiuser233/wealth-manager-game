/**
 * P4 可选收集端点（银行内网私有化）：
 * - 零依赖 Node HTTP 服务，接收学员学习记录 POST（fm-student-record schema）
 * - 落盘为 JSON Lines（每行一条），讲师可直接拷走或用 TrainerPanel 分析
 * - 仅监听 127.0.0.1 默认（内网部署时用 --host 0.0.0.0）
 * - 无数据库、无外联、记录匿名——满足"数据不出本机/不出内网"
 *
 * 用法：
 *   npm run collect            # 监听 127.0.0.1:8787，数据落 collect-data/
 *   npm run collect -- --host 0.0.0.0 --port 8787 --out D:/fm-records
 * 学员端配置：培训后台 → 收集端点 http://<内网IP>:8787/collect
 */
import http from 'node:http';
import { appendFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
function arg(name: string, def: string): string {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}
const HOST = arg('--host', '127.0.0.1');
const PORT = Number(arg('--port', '8787'));
const OUT_DIR = arg('--out', join(dirname(fileURLToPath(import.meta.url)), 'collect-data'));

mkdirSync(OUT_DIR, { recursive: true });
const DATA_FILE = join(OUT_DIR, `records-${new Date().toISOString().slice(0, 10)}.jsonl`);

function todayFile(): string {
  return join(OUT_DIR, `records-${new Date().toISOString().slice(0, 10)}.jsonl`);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'POST' && (req.url === '/collect' || req.url === '/')) {
    let body = '';
    req.on('data', (c: Buffer) => {
      body += c.toString();
      if (body.length > 1_000_000) req.destroy(); // 单条记录上限 1MB
    });
    req.on('end', () => {
      try {
        const rec = JSON.parse(body);
        if (rec?.schema !== 'fm-student-record') throw new Error('schema mismatch');
        appendFileSync(todayFile(), JSON.stringify(rec) + '\n');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        console.log(`[collect] ${rec.studentId} @ ${rec.gameDate} (certs:${rec.certs?.length ?? 0})`);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: (e as Error).message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, out: OUT_DIR }));
    return;
  }

  if (req.method === 'GET' && req.url === '/stats') {
    // 快速统计：讲师浏览器可直接打开
    let total = 0;
    const students = new Set<string>();
    if (existsSync(OUT_DIR)) {
      for (const f of files()) {
        for (const line of readFileSync(f, 'utf8').split('\n')) {
          if (!line.trim()) continue;
          try {
            const r = JSON.parse(line);
            total += 1;
            students.add(r.studentId);
          } catch { /* 跳过坏行 */ }
        }
      }
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<html><head><meta charset="utf-8"><title>收集端点统计</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:40px auto">
<h2>学习记录收集端点</h2>
<p>已收集 <b>${total}</b> 条记录，来自 <b>${students.size}</b> 名学员。</p>
<p>数据目录：<code>${OUT_DIR}</code></p>
<p>把 JSONL 文件里的每行 JSON 分别保存为 .json 文件即可在「培训后台 → 讲师工作台」导入聚合。</p>
</body></html>`);
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

function files(): string[] {
  try {
    return readdirSync(OUT_DIR).filter((f) => f.endsWith('.jsonl')).map((f) => join(OUT_DIR, f));
  } catch {
    return [];
  }
}

server.listen(PORT, HOST, () => {
  console.log(`[collect] 监听 http://${HOST}:${PORT}`);
  console.log(`[collect] 学员端配置收集端点: http://<内网IP>:${PORT}/collect`);
  console.log(`[collect] 统计页: http://${HOST}:${PORT}/stats`);
  console.log(`[collect] 数据落盘: ${OUT_DIR}`);
});
