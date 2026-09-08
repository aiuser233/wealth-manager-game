<script setup lang="ts">
/**
 * P4 培训后台 · 讲师模式大屏（课堂投影页）：
 * - 关键行情日清单（force_day / black_swan 导演事件）：讲师点开一幕，全班同步讨论
 * - 每幕展示：新闻原文 / 市场冲击 / 可讨论问题 / 建议教学点（unlock_knowledge 关联词条名）
 * - 班级投票：讲师对每个讨论题收集 A/B 举手人数（本地计数，实时显示分支分布）
 * - 离线优先：不依赖网络，投影浏览器全屏即可开课
 */
import { ref, computed } from 'vue';
import { contentBundle, KNOWLEDGE_ALL } from '@fm/content';
import type { GameEventDef } from '@fm/core';

/** 关键行情日：强制日帧处理的事件 + 黑天鹅（教学价值最高） */
const keyDays = computed(() =>
  contentBundle.events
    .filter((e) => e.force_day || e.type === 'black_swan')
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
);

const selected = ref<GameEventDef | null>(null);
function pick(e: GameEventDef) {
  selected.value = e;
  votes.value = { a: 0, b: 0 };
}

const impactText = (e: GameEventDef): string => {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(e.shocks ?? {})) {
    const dirn = v > 0 ? '+' : '';
    parts.push(`${k} ${dirn}${(v * 100).toFixed(1)}%`);
  }
  if (e.sentiment) parts.push(`情绪 ${e.sentiment > 0 ? '+' : ''}${e.sentiment}`);
  return parts.join(' · ') || '—';
};

const knowledgeNames = computed(() =>
  (selected.value?.unlock_knowledge ?? [])
    .map((id) => KNOWLEDGE_ALL.find((k) => k.id === id)?.title ?? id),
);

/** 讨论题（按事件类型给固定框架 + 事件素材） */
const discussion = computed(() => {
  const e = selected.value;
  if (!e) return [];
  const title = e.title;
  if (e.type === 'black_swan') {
    return [
      { q: `黑天鹅「${title}」发生当天，如果你正在厅堂值班，第一批冲进来的客户会问什么？`, options: ['A. 慌了，想全部赎回止损', 'B. 想抄底加仓'] },
      { q: `面对「全部赎回」的请求，你的应对话术是什么？哪些步骤是合规必须的？`, options: ['A. 先安抚再谈配置，全程双录', 'B. 按客户要求直接办理'] },
    ];
  }
  return [
    { q: `政策冲击「${title}」之后 3 个交易日，持仓客户浮亏 8%，你会主动联系还是等客户来电？`, options: ['A. 主动批量关怀（先重仓+高龄优先）', 'B. 等客户来问再说'] },
    { q: `这轮冲击对哪类客户影响最大？适合推什么应对方案？`, options: ['A. 高龄保守客户→稳健再平衡', 'B. 年轻客户→定投摊薄'] },
  ];
});

/** 班级投票（讲师举手统计） */
const votes = ref<{ a: number; b: number }>({ a: 0, b: 0 });
const voteTotal = computed(() => votes.value.a + votes.value.b);
const pctA = computed(() => (voteTotal.value ? Math.round((votes.value.a / voteTotal.value) * 100) : 0));
const pctB = computed(() => (voteTotal.value ? 100 - pctA.value : 0));
const voteHistory = ref<Array<{ title: string; a: number; b: number }>>([]);
function closeVote() {
  if (!selected.value || voteTotal.value === 0) return;
  voteHistory.value.unshift({ title: selected.value.title, a: votes.value.a, b: votes.value.b });
  votes.value = { a: 0, b: 0 };
}
</script>

<template>
  <div class="panel sys full lect">
    <div class="lect-cols">
      <!-- 左：关键行情日列表 -->
      <section class="panel listcol">
        <h4>关键行情日（{{ keyDays.length }} 幕）</h4>
        <p class="dim">点选一幕，全班同步看新闻、做抉择、投票讨论。</p>
        <div class="daylist">
          <button
            v-for="e in keyDays" :key="e.id"
            class="dayitem" :class="{ active: selected?.id === e.id, swan: e.type === 'black_swan' }"
            @click="pick(e)"
          >
            <span class="d">{{ e.date }}</span>
            <span class="t">{{ e.title }}</span>
          </button>
        </div>
      </section>

      <!-- 右：当前幕 + 投票 -->
      <section class="panel stagecol">
        <template v-if="selected">
          <h3 class="stage-title">
            <span class="date-chip">{{ selected.date }}</span>
            {{ selected.title }}
            <span v-if="selected.type === 'black_swan'" class="swan-chip">黑天鹅</span>
          </h3>
          <blockquote class="news">{{ selected.news || '（无新闻稿）' }}</blockquote>
          <p class="dim">市场冲击：{{ impactText(selected) }} ｜ 持续 {{ selected.duration_days ?? 1 }} 个交易日</p>
          <p v-if="knowledgeNames.length" class="dim">关联教学点：{{ knowledgeNames.join('、') }}</p>

          <div v-for="(d, i) in discussion" :key="i" class="disc">
            <p class="q">{{ d.q }}</p>
            <div class="vote-row">
              <button class="votea" @click="votes.a++">{{ d.options[0] }}（{{ votes.a }}）</button>
              <button class="voteb" @click="votes.b++">{{ d.options[1] }}（{{ votes.b }}）</button>
            </div>
            <div class="bar-row" v-if="voteTotal">
              <span class="bar a" :style="{ flex: pctA }">{{ pctA }}%</span>
              <span class="bar b" :style="{ flex: pctB }">{{ pctB }}%</span>
            </div>
          </div>
          <button class="gold-btn" :disabled="!voteTotal" @click="closeVote">记录本轮投票并开下一题</button>

          <div v-if="voteHistory.length" class="vh">
            <h5>已记录 {{ voteHistory.length }} 轮</h5>
            <p v-for="(v, i) in voteHistory" :key="i" class="dim">
              {{ v.title }} — A {{ v.a }} : B {{ v.b }}（{{ Math.round((v.a / (v.a + v.b)) * 100) }}% 选 A）
            </p>
          </div>
        </template>
        <p v-else class="dim big-hint">← 从左侧选一个关键行情日开始上课</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.lect-cols { display: grid; grid-template-columns: 320px 1fr; gap: 12px; align-items: start; }
.daylist { max-height: 60vh; overflow: auto; display: flex; flex-direction: column; gap: 4px; }
.dayitem { display: flex; flex-direction: column; align-items: flex-start; text-align: left; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--line, #ddd); background: transparent; cursor: pointer; }
.dayitem.active { background: var(--panel2, #f5efe2); border-color: var(--gold, #b5893c); }
.dayitem .d { font-size: 11px; color: var(--dim, #888); font-variant-numeric: tabular-nums; }
.dayitem.swan .t { color: #c0665a; }
.stage-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.date-chip { background: var(--gold, #b5893c); color: #fff; border-radius: 4px; padding: 2px 8px; font-size: 13px; font-variant-numeric: tabular-nums; }
.swan-chip { background: #c0665a; color: #fff; border-radius: 4px; padding: 2px 8px; font-size: 12px; }
.news { margin: 10px 0; padding: 10px 14px; border-left: 4px solid var(--gold, #b5893c); background: var(--panel2, #f8f4ea); line-height: 1.8; }
.disc { margin: 14px 0; padding: 10px; border: 1px dashed var(--line, #ccc); border-radius: 8px; }
.disc .q { font-weight: 600; margin-bottom: 8px; }
.vote-row { display: flex; gap: 8px; }
.vote-row button { flex: 1; min-height: 40px; }
.votea { border-color: #6f8fb5; }
.voteb { border-color: #c9a227; }
.bar-row { display: flex; height: 22px; border-radius: 4px; overflow: hidden; margin-top: 8px; font-size: 12px; color: #fff; }
.bar { display: flex; align-items: center; justify-content: center; }
.bar.a { background: #6f8fb5; }
.bar.b { background: #c9a227; }
.vh { margin-top: 10px; }
.big-hint { margin-top: 30vh; text-align: center; }
@media (max-width: 767px) { .lect-cols { grid-template-columns: 1fr; } }
</style>
