<script setup lang="ts">
import { computed } from 'vue';
import { state, gameReady, getGame, doAction, advanceFrame, pushLog, switchFrame, useMemoryHint, frameLabel, startReception } from '../state';
import { ACTION_NAMES, ACTION_DESC, fmtMoney, type ActionType, type TimeFrame } from '@fm/core';

const g = computed(() => (gameReady.value ? getGame() : null));

const actions: ActionType[] = ['lobby', 'outreach', 'study', 'review', 'aftersale', 'social', 'rest'];

const apLeft = computed(() => Math.max(0, state.apMax - state.apUsed));

const curFrame = computed<TimeFrame>(() => getGame()?.frame ?? 'day');

const frames: Array<{ id: TimeFrame; label: string }> = [
  { id: 'day', label: '日帧' },
  { id: 'week', label: '周帧' },
  { id: 'month', label: '月帧' },
];

const advanceLabel = computed(() => {
  if (apLeft.value > 0) return `${frameLabel()}还有 ${apLeft.value} 点行动未用`;
  return curFrame.value === 'day' ? '下班结算 → 下一个交易日' : curFrame.value === 'week' ? '周末结算 → 下一周' : '月末结算 → 下个月';
});

/** 主线进度（图鉴馆/工作台共用） */
const questProgress = computed(() => {
  const qe = state.questEngine;
  if (!qe) return null;
  return qe.volumeProgress(1);
});

const kpi = computed(() => {
  const k = g.value?.kpi;
  if (!k) return [];
  return [
    { label: '存款', done: k.deposit_done, target: k.deposit_target },
    { label: '理财', done: k.wm_done, target: k.wm_target },
    { label: '基金', done: k.fund_done, target: k.fund_target },
    { label: '保险', done: k.ins_done, target: k.ins_target },
  ];
});

function onAct(a: ActionType) {
  doAction(a, ACTION_NAMES[a]);
}

/** 接待改为对话玩法 */
function onReception() {
  if (startReception()) {
    state.apUsed += 0; // AP 在对话成交/送客时统一结算
  }
}

function endFrame() {
  if (!g.value) return;
  const n = advanceFrame();
  pushLog(`【结算】${frameLabel()}推进 ${n} 个交易日：AUM ${fmtMoney(g.value.player.aum)}。`);
}

function onMemory() {
  useMemoryHint();
}

/** 晋升评审 */
function openPromotion() {
  const next = g.value?.promotionCheck().find((r) => r.req.grade === (g.value?.player.grade ?? 0) + 1);
  if (!next) return;
  if (next.eligible && g.value!.applyPromotion()) {
    pushLog(`【晋升】评审通过！现任命为「${next.req.name}」。`);
  }
  state.modal = { kind: 'promotion' };
}
</script>

<template>
  <div v-if="g" class="grid">
    <!-- 左：行动区 -->
    <section class="panel act">
      <div class="head">
        <h3>{{ frameLabel() }}行动</h3>
        <div class="frame-ctrl">
          <button
            v-for="f in frames" :key="f.id"
            :class="{ active: curFrame === f.id }"
            :disabled="!getGame().canSetFrame(f.id)"
            @click="switchFrame(f.id)"
          >{{ f.label }}</button>
        </div>
        <span class="ap">AP <b>{{ apLeft }}</b> / {{ state.apMax }}</span>
      </div>
      <div class="actions">
        <button class="reception-btn" :disabled="apLeft <= 0 || !!state.reception" title="面对面接待客户：挖潜需求、推荐产品" @click="onReception">
          🤝 接待客户（对话）
        </button>
        <button v-for="a in actions" :key="a" :disabled="apLeft <= 0" :title="ACTION_DESC[a]" @click="onAct(a)">
          {{ ACTION_NAMES[a] }}
        </button>
      </div>
      <div class="memory" v-if="state.memoryHint">
        <p class="mem-hint">{{ state.memoryHint }}</p>
      </div>
      <div class="result">
        <p v-if="state.todayActions.length === 0" class="dim">本帧还没有行动。选择上方的行动开始。</p>
        <p v-for="(t, i) in state.todayActions" :key="i" :class="{ latest: i === state.todayActions.length - 1 }">{{ t.text }}</p>
      </div>
      <div class="foot">
        <button class="ghost" @click="onMemory" title="调用前世记忆（方向性提示，越用越失准）">重启记忆</button>
        <button class="promo-btn" :disabled="!g" @click="openPromotion" title="查看晋升条件，满足时可提交评审">晋升评审</button>
        <button class="primary grow" :disabled="apLeft > 0" @click="endFrame">
          {{ advanceLabel }}
        </button>
      </div>
    </section>

    <!-- 右上：角色状态 -->
    <section class="panel me">
      <div class="head"><h3>{{ g.player.name }} · 状态</h3></div>
      <div class="stats">
        <div class="row"><span>职级</span><b>{{ g.gradeName() }}</b></div>
        <div class="row"><span>AUM</span><b class="gold">{{ fmtMoney(g.player.aum) }}</b></div>
        <div class="row"><span>精力</span><b>{{ Math.round(g.player.energy) }}</b></div>
        <div class="row"><span>压力</span><b :class="{ warn: g.player.attrs.stress > 60 }">{{ Math.round(g.player.attrs.stress) }}</b></div>
        <div class="row"><span>专业力</span><b>{{ g.player.attrs.pro.toFixed(0) }}</b></div>
        <div class="row"><span>沟通力</span><b>{{ g.player.attrs.comm.toFixed(0) }}</b></div>
        <div class="row"><span>销售力</span><b>{{ g.player.attrs.sales.toFixed(0) }}</b></div>
        <div class="row"><span>知名度</span><b>{{ g.player.attrs.fame.toFixed(0) }}</b></div>
      </div>
    </section>

    <!-- 右中：KPI -->
    <section class="panel kpi">
      <div class="head"><h3>本月 KPI（{{ g.kpi.year }}年{{ g.kpi.month }}月）</h3></div>
      <div v-for="item in kpi" :key="item.label" class="kpi-row">
        <span class="kpi-label">{{ item.label }}</span>
        <div class="bar">
          <div class="fill" :style="{ width: Math.min(100, (item.target > 0 ? item.done / item.target : 0) * 100) + '%' }" />
        </div>
        <span class="kpi-num dim">{{ item.target > 0 ? fmtMoney(item.done) + ' / ' + fmtMoney(item.target) : '本年代无此类' }}</span>
      </div>
      <div v-if="questProgress" class="quest-prog">
        <span class="dim">卷一主线：{{ questProgress.done }} / {{ questProgress.total }} 章</span>
      </div>
    </section>

    <!-- 右下：日志 -->
    <section class="panel logs">
      <div class="head"><h3>日志</h3></div>
      <div class="log-list">
        <p v-for="(l, i) in state.log" :key="i"><span class="dim">{{ l.date }}</span> {{ l.text }}</p>
        <p v-if="state.log.length === 0" class="dim">暂无日志。</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.grid {
  height: 100%;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 12px;
}
.panel { padding: 14px 16px; overflow: hidden; display: flex; flex-direction: column; }
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
h3 { font-size: 15px; }

.act { grid-row: 1 / 3; }
.ap b { color: var(--accent); font-size: 16px; }
.actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
.result { flex: 1; overflow-y: auto; border-top: 1px dashed var(--line); padding-top: 10px; line-height: 1.7; }
.result p.latest { color: #fff; }
.frame-ctrl { display: flex; gap: 4px; }
.frame-ctrl button { padding: 3px 10px; font-size: 12px; }
.frame-ctrl button.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.memory { background: rgba(124, 92, 255, 0.12); border: 1px solid var(--accent2); border-radius: 8px; padding: 8px 12px; margin-bottom: 10px; }
.mem-hint { color: #c9b8ff; line-height: 1.6; font-size: 13px; }
.ghost { border-color: var(--accent2); color: #c9b8ff; background: transparent; }
.ghost:hover:not(:disabled) { background: rgba(124, 92, 255, 0.12); }
.promo-btn { border-color: var(--gold); color: var(--gold); background: transparent; }
.promo-btn:hover:not(:disabled) { background: rgba(240, 180, 41, 0.12); }
.reception-btn { grid-column: 1 / 3; background: rgba(240, 180, 41, 0.1); border-color: var(--gold); color: var(--gold); font-weight: 600; }
.foot { margin-top: 12px; display: flex; gap: 8px; }
.grow { flex: 1; }
.foot button { width: 100%; padding: 10px; }

.me .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
.row { display: flex; justify-content: space-between; line-height: 2; }
.row span { color: var(--text-dim); }
.warn { color: var(--warn); }

.kpi-row { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 10px; margin: 8px 0; }
.quest-prog { margin-top: 8px; font-size: 12px; border-top: 1px dashed var(--line); padding-top: 8px; }
.bar { height: 8px; background: var(--bg2); border-radius: 4px; overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 4px; transition: width 0.4s; }
.kpi-num { font-size: 12px; white-space: nowrap; }

.logs { min-height: 0; }
.log-list { flex: 1; overflow-y: auto; line-height: 1.9; font-size: 13px; }
</style>
