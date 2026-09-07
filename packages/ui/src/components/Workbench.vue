<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, getGame, doAction, advanceDays, pushLog } from '../state';
import { ACTION_NAMES, ACTION_DESC, fmtMoney, type ActionType } from '@fm/core';

const g = computed(() => (gameReady.value ? getGame() : null));

const actions: ActionType[] = ['reception', 'lobby', 'outreach', 'study', 'review', 'aftersale', 'social', 'rest'];

const apLeft = computed(() => Math.max(0, state.apMax - state.apUsed));

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

function endDay() {
  if (!g.value) return;
  pushLog(`【下班】${g.value.date} 结算：AUM ${fmtMoney(g.value.player.aum)}，今日行动 ${state.todayActions.length} 项。`);
  advanceDays(1);
}
</script>

<template>
  <div v-if="g" class="grid">
    <!-- 左：行动区 -->
    <section class="panel act">
      <div class="head">
        <h3>今日行动</h3>
        <span class="ap">AP <b>{{ apLeft }}</b> / {{ state.apMax }}</span>
      </div>
      <div class="actions">
        <button v-for="a in actions" :key="a" :disabled="apLeft <= 0" :title="ACTION_DESC[a]" @click="onAct(a)">
          {{ ACTION_NAMES[a] }}
        </button>
      </div>
      <div class="result">
        <p v-if="state.todayActions.length === 0" class="dim">今天还没有行动。选择上方的行动开始一天的工作。</p>
        <p v-for="(t, i) in state.todayActions" :key="i" :class="{ latest: i === state.todayActions.length - 1 }">{{ t.text }}</p>
      </div>
      <div class="foot">
        <button class="primary" :disabled="apLeft > 0" @click="endDay">
          {{ apLeft > 0 ? `还有 ${apLeft} 点行动未用` : '下班结算 → 下一个交易日' }}
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
          <div class="fill" :style="{ width: Math.min(100, (item.done / Math.max(1, item.target)) * 100) + '%' }" />
        </div>
        <span class="kpi-num dim">{{ fmtMoney(item.done) }} / {{ fmtMoney(item.target) }}</span>
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
.foot { margin-top: 12px; }
.foot button { width: 100%; padding: 10px; }

.me .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
.row { display: flex; justify-content: space-between; line-height: 2; }
.row span { color: var(--text-dim); }
.warn { color: var(--warn); }

.kpi-row { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 10px; margin: 8px 0; }
.bar { height: 8px; background: var(--bg2); border-radius: 4px; overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 4px; transition: width 0.4s; }
.kpi-num { font-size: 12px; white-space: nowrap; }

.logs { min-height: 0; }
.log-list { flex: 1; overflow-y: auto; line-height: 1.9; font-size: 13px; }
</style>
