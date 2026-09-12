<script setup lang="ts">
import { computed } from 'vue';
import { state, gameReady, getGame, inviteClient } from '../state';
import { TIER_NAMES, RISK_LEVEL_NAMES, fmtMoney } from '@fm/core';
import Avatar from './Avatar.vue';

const g = computed(() => (gameReady.value ? getGame() : null));

const selected = computed(() => g.value?.clients.find((c) => c.id === state.selectedClientId));

function riskClass(level: number): string {
  return level >= 4 ? 'risk' : '';
}

/** B2 客户盈亏/生命周期可视化：每个客户的持仓浮动盈亏（%） */
function pnlOf(c: { id: string }): number | null {
  const game = g.value!;
  if (!c || c.holdings.length === 0) return null;
  return game.clientPnlPct(c as any);
}

/** B2 生命周期徽章：active/dormant/lost + 流失预警（信任<30 且浮亏>10%） */
function lifeTag(c: { id: string; status: string; trust: number }): { label: string; cls: string } | null {
  if (c.status === 'dormant') return { label: '休眠·可召回', cls: 'dorm' };
  if (c.status === 'lost') return { label: '已流失', cls: 'lost' };
  const pnl = pnlOf(c);
  if (c.trust < 30 && pnl !== null && pnl < -10) return { label: '⚠ 流失预警', cls: 'warn' };
  if (pnl !== null && pnl > 5 && c.trust >= 70) return { label: '✦ 满意客户', cls: 'happy' };
  return null;
}

/** 排序：预警客户置顶 > 一般按信任降序 */
const sortedClients = computed(() => {
  const list = [...(g.value?.clients ?? [])];
  const score = (c: any): number => {
    const pnl = pnlOf(c);
    if (c.status !== 'active') return -1000;
    if (c.trust < 30 && pnl !== null && pnl < -10) return 1000 + c.trust;
    return c.trust;
  };
  return list.sort((a, b) => score(b) - score(a));
});

const inviteMsg = computed(() => state.clientMsg);

function onInvite() {
  if (!selected.value) return;
  state.clientMsg = inviteClient(selected.value.id);
  setTimeout(() => (state.clientMsg = ''), 3500);
}
</script>

<template>
  <div v-if="g" class="wrap">
    <!-- 左：客户列表 -->
    <section class="panel list">
      <h3>客户（{{ g.clients.length }}）<span class="dim head-tip">⚠预警置顶 · 点击头像/姓名看档案</span></h3>
      <div class="items">
        <button
          v-for="c in sortedClients" :key="c.id"
          class="cli" :class="{ active: state.selectedClientId === c.id }"
          @click="state.selectedClientId = c.id"
        >
          <Avatar :seed="c.id" :size="38" />
          <div class="cli-text">
            <div class="l1">
              <b>{{ c.name }}</b>
              <span class="tag">{{ TIER_NAMES[c.tier] }}</span>
              <span v-if="lifeTag(c)" class="life" :class="lifeTag(c)!.cls">{{ lifeTag(c)!.label }}</span>
            </div>
            <div class="l2 dim">
              <span>{{ c.occupation }}</span>
              <span :class="(pnlOf(c) ?? 0) >= 0 ? 'up' : 'down'">{{ pnlOf(c) !== null ? `持仓 ${(pnlOf(c)! >= 0 ? '+' : '') + pnlOf(c)!.toFixed(1)}%` : `信任 ${Math.round(c.trust)}` }}</span>
            </div>
          </div>
        </button>
      </div>
    </section>

    <!-- 右：档案详情 -->
    <section v-if="selected" class="panel detail">
      <div class="detail-head">
        <Avatar :seed="selected.id" :size="56" />
        <h3>{{ selected.name }} 的档案</h3>
        <span v-if="lifeTag(selected)" class="life big" :class="lifeTag(selected)!.cls">{{ lifeTag(selected)!.label }}</span>
        <button class="invite-btn" @click="onInvite" title="消耗 1 AP 电话邀约：客户答应后进入本月预约队列，接待时优先到访">📞 电话邀约（1 AP）</button>
      </div>
      <p v-if="inviteMsg" class="gold msg">{{ inviteMsg }}</p>
      <div class="cols">
        <div class="col">
          <h4>基本信息</h4>
          <p><span class="dim">{{ selected.age_2006 > 0 ? '年龄(2006)' : '出生年份' }}</span> {{ selected.age_2006 > 0 ? selected.age_2006 + ' 岁' : 2006 - selected.age_2006 + ' 年生' }}</p>
          <p><span class="dim">职业</span> {{ selected.occupation }}</p>
          <p><span class="dim">家庭</span> {{ selected.family }}</p>
          <p>
            <span class="dim">风险测评</span>
            <span class="tag" :class="riskClass(selected.risk.level)">{{ RISK_LEVEL_NAMES[selected.risk.level] }}</span>
            <span class="dim">（{{ selected.risk.tested_at }} 测评）</span>
          </p>
          <h4>行为标签</h4>
          <p><span v-for="b in selected.behaviors" :key="b" class="tag">{{ b }}</span></p>
          <h4>教学要点</h4>
          <p><span v-for="t in selected.teach_tags" :key="t" class="tag">{{ t }}</span></p>
        </div>
        <div class="col">
          <h4>财务概况（元）</h4>
          <table>
            <tbody>
              <tr><td class="dim">存款</td><td class="num">{{ fmtMoney(selected.finance.deposits) }}</td></tr>
              <tr><td class="dim">理财</td><td class="num">{{ fmtMoney(selected.finance.wealth_mgmt) }}</td></tr>
              <tr><td class="dim">基金</td><td class="num">{{ fmtMoney(selected.finance.funds) }}</td></tr>
              <tr><td class="dim">保险</td><td class="num">{{ fmtMoney(selected.finance.insurance) }}</td></tr>
              <tr><td class="dim">贷款</td><td class="num">{{ fmtMoney(selected.finance.loans) }}</td></tr>
              <tr><td class="dim">年现金流</td><td class="num">{{ fmtMoney(selected.finance.annual_cashflow) }}</td></tr>
            </tbody>
          </table>
          <h4>在我行持仓（{{ selected.holdings.length }}）<span v-if="pnlOf(selected) !== null" :class="(pnlOf(selected) ?? 0) >= 0 ? 'up' : 'down'">合计浮动 {{ (pnlOf(selected)! >= 0 ? '+' : '') + pnlOf(selected)!.toFixed(1) }}%</span></h4>
          <table v-if="selected.holdings.length">
            <tbody>
              <tr v-for="(h, i) in selected.holdings" :key="i">
                <td>{{ g.products.find((p) => p.id === h.productId)?.name ?? h.productId }}</td>
                <td class="num">{{ fmtMoney(h.amount) }}</td>
                <td class="dim">{{ h.bought_at }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="dim">暂无持仓。通过"接待客户"行动推荐产品成交后显示。</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.wrap { height: 100%; display: grid; grid-template-columns: 300px 1fr; gap: 12px; }
.cli { display: flex; gap: 10px; align-items: center; text-align: left; }
.cli-text { flex: 1; min-width: 0; }
.detail-head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.panel { padding: 14px 16px; overflow: hidden; display: flex; flex-direction: column; }
h3 { font-size: 15px; margin-bottom: 10px; }
h4 { font-size: 13px; color: var(--text-dim); margin: 12px 0 6px; }
.head-tip { font-size: 11px; font-weight: 400; margin-left: 8px; }

.list { min-height: 0; }
.items { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.cli { text-align: left; padding: 8px 12px; border-radius: 8px; }
.cli.active { border-color: var(--accent); background: var(--panel2); }
.l1 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.l2 { display: flex; justify-content: space-between; font-size: 12px; margin-top: 2px; }

/* B2 生命周期徽章 */
.life { font-size: 11px; padding: 0 6px; border-radius: 8px; border: 1px solid var(--line); }
.life.warn { color: var(--warn); border-color: var(--warn); background: rgba(255, 122, 69, 0.1); }
.life.dorm { color: var(--text-dim); border-style: dashed; }
.life.lost { color: var(--up); border-color: var(--up); }
.life.happy { color: var(--gold); border-color: var(--gold); background: rgba(240, 180, 41, 0.08); }
.life.big { font-size: 12px; padding: 2px 8px; }
.invite-btn { margin-left: auto; font-size: 12px; border-color: var(--accent); color: var(--accent); background: transparent; }
.invite-btn:hover { background: rgba(79, 140, 255, 0.12); }
.msg { margin: 0 0 8px; font-size: 13px; }

.detail { overflow-y: auto; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
p { line-height: 1.9; }
.dim { color: var(--text-dim); margin-right: 6px; }
table { width: 100%; border-collapse: collapse; }
td { padding: 3px 4px; border-bottom: 1px solid var(--bg2); }
.num { text-align: right; font-variant-numeric: tabular-nums; }
</style>
