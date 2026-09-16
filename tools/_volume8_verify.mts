/**
 * R5 卷八·薪火引擎级验证（无需浏览器）：
 * 1. 全库 90 章，一周目注册卷八、NG+ 注册卷七，单周目均为 82 章；
 * 2. 卷八 8 章从卷六终章延链，按日期/requires 顺序触发；
 * 3. 程季青客户、人生线和卷八知识引用全部可解析。
 */
import { QuestEngine, type QuestDef } from '../packages/core/src/quest.ts';
import {
  CHENGJIQING_LIFELINE,
  EASTER_QUESTS,
  KNOWLEDGE_ALL,
  LIFELINES_ALL,
  NG_PLUS_QUESTS,
  QUESTS_ALL,
  VOLUME1_QUESTS,
  VOLUME2_QUESTS,
  VOLUME3_QUESTS,
  VOLUME4_QUESTS,
  VOLUME5_QUESTS,
  VOLUME8_QUESTS,
  contentBundle,
} from '../content/src/index.ts';

let bad = 0;
const say = (ok: boolean, msg: string) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) bad++;
};

const base = [
  ...VOLUME1_QUESTS,
  ...VOLUME2_QUESTS,
  ...VOLUME3_QUESTS,
  ...VOLUME4_QUESTS,
  ...VOLUME5_QUESTS,
  ...EASTER_QUESTS,
] as QuestDef[];
const firstRun = [...base, ...VOLUME8_QUESTS] as QuestDef[];
const ngPlus = [...base, ...NG_PLUS_QUESTS] as QuestDef[];

// 1) 全库与周目注册口径
say(QUESTS_ALL.length === 90, `QUESTS_ALL 全库 90 章（实际 ${QUESTS_ALL.length}）`);
say(new Set(QUESTS_ALL.map((q) => q.id)).size === 90, '全库任务 id 无重复');
say(firstRun.length === 82, `一周目注册 82 章（实际 ${firstRun.length}）`);
say(ngPlus.length === 82, `NG+ 注册 82 章（实际 ${ngPlus.length}）`);
say(firstRun.every((q) => q.volume !== 7), '一周目不注册卷七');
say(ngPlus.every((q) => q.volume !== 8), 'NG+ 不注册卷八');

// 2) 卷八结构和引用
say(VOLUME8_QUESTS.length === 8, `卷八 8 章（实际 ${VOLUME8_QUESTS.length}）`);
say(VOLUME8_QUESTS.every((q) => q.volume === 8), '卷八全部 volume=8');
say(VOLUME8_QUESTS[0].requires === 'q6_e14_wen_lights2', '卷八首章从卷六彩蛋终章延链');
say(
  VOLUME8_QUESTS.every((q, i) => i === 0 || q.requires === VOLUME8_QUESTS[i - 1].id),
  '卷八 q8_1→q8_8 requires 链连续',
);
say(
  VOLUME8_QUESTS.every((q, i) => i === 0 || q.date >= VOLUME8_QUESTS[i - 1].date),
  '卷八日期单调递增',
);
say(
  VOLUME8_QUESTS.every((q) => !q.client || contentBundle.clients.some((c) => c.id === q.client)),
  '卷八客户引用全部存在',
);

const knowledgeIds = new Set(KNOWLEDGE_ALL.map((k) => k.id));
const knowledgeTags = new Set(KNOWLEDGE_ALL.flatMap((k) => k.tags));
const unresolved: string[] = [];
for (const q of VOLUME8_QUESTS) {
  for (const choice of q.choices) {
    const refs = [...(choice.effects?.unlockKnowledge ?? []), ...(choice.unlockKnowledge ?? [])];
    for (const ref of refs) {
      if (!knowledgeIds.has(ref) && !knowledgeTags.has(ref) && !knowledgeIds.has(`k_${ref}`)) {
        unresolved.push(`${q.id}:${ref}`);
      }
    }
  }
}
say(unresolved.length === 0, `卷八知识引用全部可解析${unresolved.length ? `：${unresolved.join('、')}` : ''}`);

// 3) 程季青人生线
say(contentBundle.clients.some((c) => c.id === 'cli_chengjq'), '程季青客户档案存在');
say(CHENGJIQING_LIFELINE.length === 8, `程季青人生线 8 节点（实际 ${CHENGJIQING_LIFELINE.length}）`);
say(LIFELINES_ALL.length === 109, `人生线全量 109 节点（实际 ${LIFELINES_ALL.length}）`);
say(
  CHENGJIQING_LIFELINE.every((node, i) => i === 0 || (node.trustReq ?? 0) >= (CHENGJIQING_LIFELINE[i - 1].trustReq ?? 0)),
  '程季青 trustReq 梯度不回退',
);

// 4) 真实 QuestEngine 验证一周目卷八触发与顺序完成
const firstEngine = new QuestEngine(firstRun, LIFELINES_ALL);
for (const q of base) firstEngine.completed.add(q.id);
say(firstEngine.volumeProgress(7).total === 0, '一周目引擎卷七总数为 0');
say(firstEngine.volumeProgress(8).total === 8, '一周目引擎卷八总数为 8');
for (const expected of VOLUME8_QUESTS) {
  const actual = firstEngine.checkQuests(expected.date);
  say(actual?.id === expected.id, `触发 ${expected.id}`);
  if (actual) firstEngine.complete(0);
}
say(firstEngine.volumeProgress(8).done === 8, '一周目卷八 8/8 完成');

// 5) NG+ 引擎反向互斥校验
const ngEngine = new QuestEngine(ngPlus, LIFELINES_ALL);
for (const q of base) ngEngine.completed.add(q.id);
say(ngEngine.volumeProgress(7).total === 8, 'NG+ 引擎卷七总数为 8');
say(ngEngine.volumeProgress(8).total === 0, 'NG+ 引擎卷八总数为 0');
const ngFirst = ngEngine.checkQuests(NG_PLUS_QUESTS[0].date);
say(ngFirst?.volume === 7, `NG+ 首个追加任务来自卷七（${ngFirst?.id ?? 'none'}）`);

console.log(bad === 0 ? '\n=== 卷八引擎级验证全部通过 ===' : `\n=== ${bad} 项失败 ===`);
if (bad > 0) process.exit(1);
