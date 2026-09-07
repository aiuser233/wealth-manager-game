<script setup lang="ts">
import { computed } from 'vue';
import { state, gameReady, getGame } from '../state';
import { TIER_NAMES, RISK_LEVEL_NAMES, fmtMoney } from '@fm/core';

const g = computed(() => (gameReady.value ? getGame() : null));

const selected = computed(() => g.value?.clients.find((c) => c.id === state.selectedClientId));

function riskClass(level: number): string {
  return level >= 4 ? 'risk' : '';
}
</script>

<template>
  <div v-if="g" class="wrap">
    <!-- 左：客户列表 -->
    <section class="panel list">
      <h3>客户（{{ g.clients.length }}）</h3>
      <div class="items">
        <button
          v-for="c in g.clients" :key="c.id"
          class="cli" :class="{ active: state.selectedClientId === c.id }"
          @click="state.selectedClientId = c.id"
        >
          <div class="l1">
            <b>{{ c.name }}</b>
            <span class="tag">{{ TIER_NAMES[c.tier] }}</span>
          </div>
          <div class="l2 dim">
            <span>{{ c.occupation }}</span>
            <span>信任 {{ Math.round(c.trust) }}</span>
          </div>
        </button>
      </div>
    </section>

    <!-- 右：档案详情 -->
    <section v-if="selected" class="panel detail">
      <h3>{{ selected.name }} 的档案</h3>
      <div class="cols">
        <div class="col">
          <h4>基本信息</h4>
          <p><span class="dim">年龄(2006)</span> {{ selected.age_2006 }} 岁</p>
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
          <h4>在我行持仓（{{ selected.holdings.length }}）</h4>
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
.panel { padding: 14px 16px; overflow: hidden; display: flex; flex-direction: column; }
h3 { font-size: 15px; margin-bottom: 10px; }
h4 { font-size: 13px; color: var(--text-dim); margin: 12px 0 6px; }

.list { min-height: 0; }
.items { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.cli { text-align: left; padding: 8px 12px; border-radius: 8px; }
.cli.active { border-color: var(--accent); background: var(--panel2); }
.l1 { display: flex; align-items: center; gap: 8px; }
.l2 { display: flex; justify-content: space-between; font-size: 12px; margin-top: 2px; }

.detail { overflow-y: auto; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
p { line-height: 1.9; }
.dim { color: var(--text-dim); margin-right: 6px; }
table { width: 100%; border-collapse: collapse; }
td { padding: 3px 4px; border-bottom: 1px solid var(--bg2); }
.num { text-align: right; font-variant-numeric: tabular-nums; }
</style>
