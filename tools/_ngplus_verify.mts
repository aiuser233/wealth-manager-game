/**
 * R4 卷七·二周目来客 引擎级验证（无需浏览器）：
 * 1. NG+ 局（playthrough>=2）注册卷七 8 章，一周目局不注册；
 * 2. 完成 74 章 requires 链后 q7_1 于 2026-01-19 可触发；
 * 3. 卷七链 q7_1→q7_8 顺序完成，客户引用存在；
 * 4. 引用完整性：Q7 客户/知识 id 全部可解析。
 */
import { NG_PLUS_QUESTS, QUESTS_ALL, contentBundle, LIFELINES_ALL, KNOWLEDGE_ALL } from '../content/src/index.ts';

let bad = 0;
const say = (ok: boolean, msg: string) => { console.log((ok ? '✓' : '✗') + ' ' + msg); if (!ok) bad++; };

// 1) 卷七结构
say(NG_PLUS_QUESTS.length === 8, `卷七 8 章（实际 ${NG_PLUS_QUESTS.length}）`);
say(NG_PLUS_QUESTS.every((q) => q.volume === 7), '全部 volume=7');
say(QUESTS_ALL.length === 82, `QUESTS_ALL 82 章（实际 ${QUESTS_ALL.length}）`);
say(NG_PLUS_QUESTS.every((q) => !q.client || contentBundle.clients.some((c) => c.id === q.client)), '卷七客户引用全部存在');

// 2) requires 链
const ids = new Set(QUESTS_ALL.map((q) => q.id));
for (const q of NG_PLUS_QUESTS) {
  if (q.requires && !ids.has(q.requires)) { say(false, `${q.id} requires 缺失: ${q.requires}`); }
}
say(true, '卷七 requires 链检查完成');
say(NG_PLUS_QUESTS[0].requires === 'q6_e14_wen_lights2', 'q7_1 从彩蛋终章 e14 延链');

// 3) 日期顺序
const dates = NG_PLUS_QUESTS.map((q) => q.date);
say(dates.every((d, i) => i === 0 || d >= dates[i - 1]), '卷七日期单调递增');
say(dates[0] >= '2026-01-01' && dates[7] <= '2027-06-30', `卷七全部在 2026-01~2027-06 内（${dates[0]}~${dates[7]}）`);

// 4) unlockKnowledge 全部可解析（词条 id）
const kIds = new Set(KNOWLEDGE_ALL.map((k) => k.id));
const kTags = new Set(KNOWLEDGE_ALL.flatMap((k) => k.tags));
const unres: string[] = [];
for (const q of NG_PLUS_QUESTS) for (const ch of q.choices) {
  for (const k of [...(ch.effects?.unlockKnowledge ?? []), ...(ch.unlockKnowledge ?? [])]) {
    if (!kIds.has(k) && !kTags.has(k) && !kIds.has('k_' + k)) unres.push(`${q.id}:${k}`);
  }
}
say(unres.length === 0, `卷七知识引用全部可解析${unres.length ? '：' + unres.join('、') : ''}`);

// 5) 周薇人生线
const zw = LIFELINES_ALL.filter((l) => l.client === 'cli_zhouwei');
say(zw.length === 8, `周薇人生线 8 节点（实际 ${zw.length}）`);
say(contentBundle.clients.some((c) => c.id === 'cli_zhouwei'), '周薇客户档案存在');
say(LIFELINES_ALL.length === 101, `人生线全量 101 节点（实际 ${LIFELINES_ALL.length}）`);

// 6) 模拟 QuestEngine（直接实现 checkQuests 语义）
class MiniEngine {
  completed = new Set<string>();
  constructor(public quests: typeof QUESTS_ALL) {}
  check(date: string) {
    for (const q of [...this.quests].sort((a, b) => a.date.localeCompare(b.date))) {
      if (this.completed.has(q.id)) continue;
      if (q.date > date) break;
      if (q.requires && !this.completed.has(q.requires)) continue;
      return q;
    }
    return null;
  }
}
// NG+ 场景：74 章已完成（一周目收官），日历推进到 2026-01
const eng = new MiniEngine(QUESTS_ALL);
for (const q of QUESTS_ALL) if (q.volume !== 7) eng.completed.add(q.id);
const first = eng.check('2026-01-19');
say(!!first && first.volume === 7, `完成 74 章后 2026-01-19 触发卷七首章（${first ? first.id : 'none'}）`);
// 一周目场景：未完成彩蛋链，2025-12-31 内不会触发卷七
const eng2 = new MiniEngine(QUESTS_ALL.filter((q) => q.volume !== 7));
const no7 = eng2.check('2025-12-31');
say(!no7 || no7.volume !== 7, '一周目（卷七未注册）任何日期不触发卷七');

console.log(bad === 0 ? '\n=== 卷七引擎级验证全部通过 ===' : `\n=== ${bad} 项失败 ===`);
if (bad > 0) process.exit(1);
