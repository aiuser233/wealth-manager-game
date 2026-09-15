/**
 * 交叉引用完整性检查（CI 红灯条件之一）：
 * - 人生线/主线任务的 unlockKnowledge 引用按「词条 id 或词条 tag」解析，
 *   解析不到任何词条即失败（剧情奖励说"解锁知识"，玩家进图鉴馆必须能看到东西）
 * - 人生线 client / 任务 client（如填）必须指向存在的客户档案
 * - 知识库/题库 id 唯一；人生线节点（客户+年+月）唯一
 */
import { LIFELINES_ALL, QUESTS_ALL, KNOWLEDGE_ALL, examBankAll, contentBundle } from '../../../content/src/index.ts';

let bad = 0;
const kIds = new Set(KNOWLEDGE_ALL.map((k) => k.id));
const kTags = new Set(KNOWLEDGE_ALL.flatMap((k) => k.tags));
const cIds = new Set(contentBundle.clients.map((c) => c.id));

/** unlockKnowledge 引用既可为词条 id 也可为词条 tag（按 tag 解析时取首个匹配词条；允许省略 k_ 前缀） */
function resolveKnowledge(ref: string): string | null {
  if (kIds.has(ref)) return ref;
  if (kIds.has('k_' + ref)) return 'k_' + ref;
  if (kTags.has(ref)) return KNOWLEDGE_ALL.find((k) => k.tags.includes(ref))!.id;
  return null;
}
const knownUnresolvable = new Set<string>();

for (const l of LIFELINES_ALL) {
  if (!cIds.has(l.client)) { console.log(`[E] 人生线客户不存在: ${l.client} <- ${l.title}`); bad++; }
  for (const k of l.effects.unlockKnowledge ?? []) {
    if (!resolveKnowledge(k)) { knownUnresolvable.add(k); console.log(`[E] 知识引用不存在(id/tag 均无): ${k} <- ${l.title}`); bad++; }
  }
}
for (const q of QUESTS_ALL) {
  if (q.client && !cIds.has(q.client)) { console.log(`[E] 任务客户不存在: ${q.client} <- ${q.id}`); bad++; }
  for (const ch of q.choices) {
    for (const k of ch.effects?.unlockKnowledge ?? []) {
      if (!resolveKnowledge(k)) { knownUnresolvable.add(k); console.log(`[E] 任务知识引用不存在: ${k} <- ${q.id}`); bad++; }
    }
  }
}
// 题库-词条缝合红线（R4）：每题 knowledge_tags 至少一个命中词条 tag/id，否则即"孤儿题"——红灯
let orphans = 0;
const tagPool = new Set(KNOWLEDGE_ALL.flatMap((k) => k.tags));
const idPool = new Set(KNOWLEDGE_ALL.map((k) => k.id));
for (const q of examBankAll) {
  const ts = q.knowledge_tags ?? [];
  if (ts.length === 0 || !ts.some((t) => tagPool.has(t) || idPool.has(t))) {
    if (orphans < 8) console.log(`[E] 孤儿题（tags 未命中词条体系）: ${q.id} [${ts.join(',')}]`);
    orphans++;
  }
}
if (orphans > 0) { console.log(`✗ 题库缝合失败：${orphans} 道孤儿题`); bad += orphans; }

// 词条反向覆盖（R5 双向缝合）：每个词条应至少被一题引用——题目 tags 含词条 id，
// 或含解析到本词条的 tag（按 KNOWLEDGE_ALL 顺序取首个匹配，与 resolveKnowledge 同口径）。
// 全量统计入报表；>红线即黄线警告 / 红灯（词条写了没人考 = 图鉴馆与题库两张皮的另一半）。
const firstOwner = new Map<string, string>();
for (const k of KNOWLEDGE_ALL) for (const t of k.tags) if (!firstOwner.has(t)) firstOwner.set(t, k.id);
const usedTags = new Set<string>();
for (const q of examBankAll) for (const t of q.knowledge_tags ?? []) usedTags.add(t);
const unquizzed = KNOWLEDGE_ALL.filter((k) =>
  !usedTags.has(k.id) && !k.tags.some((t) => firstOwner.get(t) === k.id && usedTags.has(t)));
const R5_YELLOW = 60, R5_RED = 90;
if (unquizzed.length > R5_RED) { console.log(`✗ 词条反向覆盖红灯：${unquizzed.length} 个词条零题目引用（红线 ${R5_RED}）`); bad += unquizzed.length; }
else if (unquizzed.length > R5_YELLOW) console.log(`[W] 词条反向覆盖黄线：${unquizzed.length} 个词条零题目引用（黄线 ${R5_YELLOW}）`);
else console.log(`✓ 词条反向覆盖：零引用词条 ${unquizzed.length}/${KNOWLEDGE_ALL.length}（黄线 ${R5_YELLOW} 内）`);

// 任务 id 全局唯一（跨卷）
const qidSeen = new Set<string>();
for (const q of QUESTS_ALL) { if (qidSeen.has(q.id)) { console.log(`[E] 任务 id 重复: ${q.id}`); bad++; } qidSeen.add(q.id); }
const kSeen = new Set<string>();
for (const k of KNOWLEDGE_ALL) { if (kSeen.has(k.id)) { console.log(`[E] 知识词条 id 重复: ${k.id}`); bad++; } kSeen.add(k.id); }
const qSeen = new Set<string>();
for (const q of examBankAll) { if (qSeen.has(q.id)) { console.log(`[E] 题目 id 重复: ${q.id}`); bad++; } qSeen.add(q.id); }
const lSeen = new Set<string>();
for (const l of LIFELINES_ALL) {
  const key = `${l.client}-${l.year}-${l.month ?? 0}`;
  if (lSeen.has(key)) { console.log(`[E] 人生线节点重复: ${key} <- ${l.title}`); bad++; }
  lSeen.add(key);
}
console.log(bad === 0
  ? `✓ 引用完整性通过：词条 ${KNOWLEDGE_ALL.length}，题库 ${examBankAll.length}，人生线 ${LIFELINES_ALL.length}，任务 ${QUESTS_ALL.length}（卷一 ${QUESTS_ALL.filter(q => q.volume === 1).length}+卷二 ${QUESTS_ALL.filter(q => q.volume === 2).length}）`
  : `✗ 引用完整性失败：${bad} 个问题（涉及引用：${[...knownUnresolvable].join('、')}）`);
if (bad > 0) process.exit(1);
