<script setup lang="ts">
import { state, gameReady, getGame, unreadNews } from '../state';
import { GRADE_NAMES } from '@fm/core';

const g = computed(() => (gameReady.value ? getGame() : null));
// 日期绑定 state.gameDate 镜像（Game 实例字段非响应式，直接读 g.value.date 不会触发重算）
const dateStr = computed(() => (gameReady.value ? state.gameDate : '----'));
const grade = computed(() => (g.value ? GRADE_NAMES[g.value.player.grade] : ''));

defineProps<{
  tabs: ReadonlyArray<{ id: string; label: string }>;
  title: string;
}>();

/**
 * 工作台标签上的红点/数字徽章 = 未读市场新闻数。
 * 有新行情新闻时出现；点击进入「行情终端」页签即全部已读、红点消失。
 */
const unread = computed(() => unreadNews());

function switchTab(id: string) {
  state.screen = id as typeof state.screen;
}
</script>

<script lang="ts">
import { computed } from 'vue';
export default {};
</script>

<template>
  <header class="top">
    <div class="brand">汇诚银行 · 城东支行</div>
    <nav class="tabs topbar-tabs">
      <button
        v-for="t in tabs" :key="t.id"
        :class="{ active: state.screen === t.id }"
        @click="switchTab(t.id)"
      >{{ t.label }}<span v-if="t.id === 'workbench' && unread" class="badge" title="有未读的市场新闻，点击「行情终端」页签即可读完并消除">{{ unread > 9 ? '9+' : unread }}</span></button>
    </nav>
    <div class="right">
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
@media (max-width: 767px) {
  .top { gap: 8px; padding: 6px 8px; flex-wrap: wrap; }
  .brand { font-size: 12px; width: 100%; padding-bottom: 4px; border-bottom: 1px dashed var(--line); }
  .tabs { order: 2; flex: 1 0 100%; }
  .right { order: 1; margin-left: auto; }
  .tabs button { padding: 8px 12px; min-height: 44px; }
}
.brand { font-weight: 700; color: var(--gold); letter-spacing: 1px; white-space: nowrap; }
.tabs { display: flex; gap: 6px; flex: 1; }
.tabs button { border: none; background: transparent; padding: 6px 14px; border-radius: 6px; position: relative; }
.tabs button.active { background: var(--panel2); color: #fff; }
.badge {
  position: absolute; top: -4px; right: -2px;
  background: var(--up); color: #fff; font-size: 10px;
  border-radius: 8px; padding: 0 5px; line-height: 14px;
  cursor: pointer;
}
.right { display: flex; align-items: center; gap: 10px; white-space: nowrap; }
.date { font-variant-numeric: tabular-nums; color: var(--accent); font-weight: 600; }
</style>
