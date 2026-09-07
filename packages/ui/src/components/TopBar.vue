<script setup lang="ts">
import { computed } from 'vue';
import { state, gameReady, getGame } from '../state';
import { GRADE_NAMES } from '@fm/core';

const g = computed(() => (gameReady.value ? getGame() : null));
const dateStr = computed(() => g.value?.date ?? '----');
const grade = computed(() => (g.value ? GRADE_NAMES[g.value.player.grade] : ''));

const tabs = [
  { id: 'workbench', label: '工作台' },
  { id: 'market', label: '行情终端' },
  { id: 'clients', label: '客户档案' },
  { id: 'help', label: '手册' },
] as const;

const newsCount = computed(() => state.news.length);

function switchTab(id: string) {
  state.screen = id;
}
</script>

<template>
  <header class="top">
    <div class="brand">汇诚银行 · 城东支行</div>
    <nav class="tabs">
      <button
        v-for="t in tabs" :key="t.id"
        :class="{ active: state.screen === t.id }"
        @click="switchTab(t.id)"
      >{{ t.label }}<span v-if="t.id === 'workbench' && newsCount" class="badge">{{ newsCount }}</span></button>
    </nav>
    <div class="right">
      <span class="dim">{{ g?.player.name }}</span>
      <span class="tag">{{ grade }}</span>
      <span class="date">{{ dateStr }}</span>
    </div>
  </header>
</template>

<style scoped>
.top {
  display: flex; align-items: center; gap: 22px;
  padding: 10px 16px;
  background: var(--bg2);
  border-bottom: 1px solid var(--line);
}
.brand { font-weight: 700; color: var(--gold); letter-spacing: 1px; white-space: nowrap; }
.tabs { display: flex; gap: 6px; flex: 1; }
.tabs button { border: none; background: transparent; padding: 6px 14px; border-radius: 6px; position: relative; }
.tabs button.active { background: var(--panel2); color: #fff; }
.badge {
  position: absolute; top: -4px; right: -2px;
  background: var(--up); color: #fff; font-size: 10px;
  border-radius: 8px; padding: 0 5px; line-height: 14px;
}
.right { display: flex; align-items: center; gap: 10px; white-space: nowrap; }
.date { font-variant-numeric: tabular-nums; color: var(--accent); font-weight: 600; }
</style>
