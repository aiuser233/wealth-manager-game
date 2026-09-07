<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, getGame, probeReception, cancelReception, recommendReception } from '../state';
import { productOnShelf } from '@fm/core';
import { fmtMoney } from '@fm/core';

const g = computed(() => (gameReady.value ? getGame() : null));
const s = computed(() => state.reception);
const amountInput = ref(0);

const shelf = computed(() => {
  if (!g.value) return [];
  return g.value.products.filter((p) => productOnShelf(p, g.value!.date));
});

const client = computed(() => {
  if (!g.value || !s.value) return null;
  return g.value.clients.find((c) => c.id === s.value!.clientId) ?? null;
});

function setAmount(v: number) {
  amountInput.value = Math.max(0, Math.round(v));
  state.receptionAmount = amountInput.value;
}

function riskClass(level: number): string {
  return level >= 4 ? 'risk' : '';
}
</script>

<template>
  <div v-if="s && g" class="mask">
    <div class="panel dialog">
      <div class="head">
        <h3>接待中：{{ s.clientName }}<span v-if="client" class="tag" :class="riskClass(client.risk.level)">R{{ client.risk.level }}</span></h3>
        <span class="dim">可投资池约 {{ fmtMoney(s.pool) }} · 意向 {{ fmtMoney(state.receptionAmount) }}</span>
      </div>

      <div class="log">
        <p v-for="(l, i) in state.receptionLog" :key="i" :class="l.who">
          <template v-if="l.who === 'client'"><b class="cname">{{ s.clientName }}：</b>{{ l.text }}</template>
          <template v-else-if="l.who === 'me'"><b class="mname">我：</b>{{ l.text }}</template>
          <template v-else>{{ l.text }}</template>
        </p>
      </div>

      <!-- 阶段一：挖潜 -->
      <div v-if="!s.revealed" class="stage">
        <p class="dim tip">选择两个切入话题，了解客户的真实需求（挖潜越充分，成交率越高）：</p>
        <div class="opts">
          <button v-for="(p, i) in s.need.probes" :key="i" @click="probeReception(i)">{{ p.text }}</button>
        </div>
        <button class="warn" @click="cancelReception">客户流失风险，先送客</button>
      </div>

      <!-- 阶段二：推荐 -->
      <div v-else class="stage">
        <div class="amount-row">
          <span>建议投入</span>
          <input type="number" :value="state.receptionAmount" step="10000" @input="setAmount(Number(($event.target as HTMLInputElement).value))" />
          <button @click="setAmount(Math.round(s.pool * 0.3 / 10000) * 10000)">30%</button>
          <button @click="setAmount(Math.round(s.pool * 0.6 / 10000) * 10000)">60%</button>
          <button @click="setAmount(Math.round(s.pool * 0.85 / 10000) * 10000)">85%</button>
        </div>
        <p class="dim tip">从当期货架选择产品（点击推荐）：</p>
        <div class="products">
          <button
            v-for="p in shelf" :key="p.id"
            class="prod" :class="{ mismatch: p.risk_level > (client?.risk.level ?? 5) }"
            :title="`R${p.risk_level} · 起购 ${fmtMoney(p.min_amount)} · 基准 ${(p.benchmark_pa * 100).toFixed(2)}%`"
            @click="recommendReception(p.id)"
          >
            <b>{{ p.name }}</b>
            <span class="dim">R{{ p.risk_level }} · {{ fmtMoney(p.min_amount) }} 起</span>
            <span v-if="p.risk_level > (client?.risk.level ?? 5)" class="mismatch-tag">不适当</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 50;
}
.dialog { width: 680px; max-height: 84vh; display: flex; flex-direction: column; padding: 16px 20px; }
.head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
h3 { font-size: 15px; }
.log { flex: 1; min-height: 180px; overflow-y: auto; background: var(--bg2); border-radius: 8px; padding: 10px 14px; line-height: 1.8; font-size: 13px; }
.cname { color: var(--gold); }
.mname { color: var(--accent); }
.log p.sys { color: var(--text-dim); font-style: italic; }

.stage { margin-top: 12px; }
.tip { font-size: 12px; margin-bottom: 8px; }
.opts { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.opts button { text-align: left; padding: 8px 12px; }
.amount-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.amount-row input { width: 140px; }
.amount-row button { padding: 3px 10px; font-size: 12px; }
.products { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-height: 240px; overflow-y: auto; }
.prod { display: flex; flex-direction: column; align-items: flex-start; text-align: left; padding: 8px 10px; font-size: 12px; gap: 2px; }
.prod b { font-size: 12px; line-height: 1.4; }
.prod.mismatch { opacity: 0.55; }
.mismatch-tag { color: var(--warn); font-size: 10px; }
.warn { margin-top: 8px; }
</style>
