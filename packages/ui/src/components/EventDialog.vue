<script setup lang="ts">
import { computed } from 'vue';
import { state, gameReady, getGame, resolveEventChoice } from '../state';
import type { RandomEventInstance } from '@fm/core';

const ev = computed(() => state.modal?.payload as RandomEventInstance | undefined);

function riskTag(risk?: string): string {
  switch (risk) {
    case 'red': return '红线';
    case 'grey': return '灰色';
    default: return '稳妥';
  }
}
</script>

<template>
  <div v-if="state.modal?.kind === 'event' && ev" class="mask">
    <div class="panel ev">
      <div class="head">
        <span class="tag">随机事件</span>
        <h3>{{ ev.title }}</h3>
      </div>
      <p class="text">{{ ev.text }}</p>
      <div v-if="ev.choices && ev.choices.length" class="choices">
        <button v-for="(c, i) in ev.choices" :key="i" class="choice" @click="resolveEventChoice(i)">
          <span class="risk-tag" :class="c.risk ?? 'comply'">{{ riskTag(c.risk) }}</span>
          {{ c.text }}
        </button>
      </div>
      <div v-else class="choices">
        <button class="choice primary" @click="resolveEventChoice()">知道了</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center; z-index: 60; }
.ev { width: 560px; padding: 18px 22px; }
.head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
h3 { font-size: 16px; }
.text { line-height: 1.8; margin-bottom: 14px; }
.choices { display: flex; flex-direction: column; gap: 8px; }
.choice { text-align: left; padding: 10px 14px; line-height: 1.5; }
.risk-tag { display: inline-block; font-size: 11px; padding: 1px 6px; border-radius: 4px; margin-right: 8px; }
.risk-tag.comply { background: rgba(61, 207, 142, 0.15); color: var(--down); }
.risk-tag.grey { background: rgba(240, 180, 41, 0.15); color: var(--gold); }
.risk-tag.red { background: rgba(255, 90, 90, 0.15); color: var(--up); }
</style>
