<script setup lang="ts">
/**
 * D2 年度总结报告：跨年首日弹出上一年度的收官数据（AUM/成交/客户/转介绍/流失/证书/违规）。
 * 数据源：game.stats.yearly（12 月末快照），由 hooks.onYearTurn 生成 state.annualReport。
 */
import { computed } from 'vue';
import { state, getGame } from '../state';

const rep = computed(() => state.annualReport);

function close() {
  state.annualReport = null;
}
</script>

<template>
  <div v-if="rep" class="mask" role="dialog" aria-modal="true" aria-label="年度总结" @click.self="close">
    <div class="report panel">
      <div class="head">
        <span class="firework">🎆</span>
        <h3>{{ rep.year }} 年度总结报告</h3>
      </div>
      <div class="lines">
        <p v-for="(l, i) in rep.lines" :key="i" :class="{ first: i === 0 }">{{ l }}</p>
      </div>
      <p class="dim epilogue">新的一年，客户的信任又要重新挣起。行长在新年寄语里写道：「业绩会波动，口碑不会。」</p>
      <button class="primary" @click="close">翻开新的一页（{{ rep.year }} 年）</button>
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(5, 8, 16, 0.72);
  display: flex; align-items: center; justify-content: center;
}
.report { width: 520px; max-width: 92vw; padding: 22px 26px; border-color: var(--gold); }
.head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
h3 { font-size: 17px; color: var(--gold); }
.firework { font-size: 24px; }
.lines p { line-height: 2; }
.lines p.first { font-weight: 600; margin-bottom: 4px; }
.epilogue { margin: 12px 0 16px; line-height: 1.8; font-size: 12px; border-top: 1px dashed var(--line); padding-top: 10px; }
.report button { width: 100%; padding: 10px; }
</style>
