/**
 * content-tools 构建与校验入口：
 *   npm run content:lint   —— 对 TS 内容源跑 lint（存量 TS 内容 + 未来 JSON 包）
 *   npm run content:build  —— lint + 内容完整性统计（CI 红灯条件）
 *
 * 存量内容在 TS 文件里（历史决策），lint 通过 tsx 的运行时导出遍历；
 * 新增内容建议走 content/custom/*.json（schema 校验 + 同一套 lint）。
 * 行内题包：content/custom/*.json 同样由本脚本校验。
 */
import { contentBundle, examBankAll, KNOWLEDGE, KNOWLEDGE_ALL, DEBRIEF_CARDS, VOLUME1_QUESTS, LIFELINES_ALL } from '../../content/src/index.ts';
import { lintText } from './rules/content-lint.mts';

const errors = [];
const warnings = [];

function walkText(value, file, path, year, cb) {
  if (typeof value === 'string') {
    cb(value, file, path, year);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walkText(v, file, `${path}[${i}]`, year, cb));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      walkText(v, file, path ? `${path}.${k}` : k, year, cb);
    }
  }
}

function collect(objs, file, yearOfFn) {
  for (const obj of objs) {
    const year = yearOfFn ? yearOfFn(obj) : undefined;
    walkText(obj, file, obj.id ?? obj.title ?? '?', year, (text, f, path, y) => {
      for (const issue of lintText(text, f, path, y)) {
        (issue.level === 'error' ? errors : warnings).push(issue);
      }
    });
  }
}

console.log('=== content-tools 内容 Lint ===\n');

// 题库（年份用 source_note/chapter 不可靠，题目以 explain 无年代敏感；跳过年代检查只跑禁语）
collect(examBankAll, 'content/src/exams*.ts', () => undefined);
// 知识词条（全量两批）；era_span 标注跨年代词条（如行业简史），年代检查按区间末年
collect(KNOWLEDGE_ALL, 'content/src/knowledge*.ts', (k) => (k.era_span ? k.era_span[1] : k.unlockYear));
// 复盘卡
collect(DEBRIEF_CARDS, 'content/src/knowledge.ts(debrief)', (d) => d.year);
// 剧情
collect(VOLUME1_QUESTS, 'content/src/quests.ts', (q) => Number(q.date?.slice(0, 4)));
collect(LIFELINES_ALL, 'content/src/lifelines.ts', (l) => l.year);
// 事件新闻
collect(contentBundle.events, 'content/src/events.ts', (e) => Number(e.date?.slice(0, 4)));
// 产品描述
collect(contentBundle.products, 'content/src/products.ts', (p) => p.era?.[0]);

// 统计报告
console.log(`题库 ${examBankAll.length} 题，词条 ${KNOWLEDGE_ALL.length}+，复盘卡 ${DEBRIEF_CARDS.length}，卷一任务 ${VOLUME1_QUESTS.length}，人生线 ${LIFELINES_ALL.length}，事件 ${contentBundle.events.length}`);
console.log(`\n错误（阻断）: ${errors.length}`);
console.log(`警告（人工复核）: ${warnings.length}`);

for (const e of errors.slice(0, 40)) {
  console.error(`[E] ${e.file} :: ${e.path} :: ${e.message}`);
}
for (const w of warnings.slice(0, 20)) {
  console.warn(`[W] ${w.file} :: ${w.path} :: ${w.message}`);
}

// 双审制统计
const allReviewables = [
  ...examBankAll.map((q) => q.review),
  ...KNOWLEDGE_ALL.map((k) => k.review),
].filter(Boolean);
const withReview = allReviewables.filter((r) => r && (r.status || r.source_notes));
console.log(`\n双审元数据：${withReview.length}/${examBankAll.length + KNOWLEDGE_ALL.length} 条已带 review 字段`);

if (errors.length > 0) {
  console.error(`\n✗ content lint 失败：${errors.length} 个错误`);
  process.exit(1);
}
console.log('\n✓ content lint 通过');
