<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, getGame, unreadNews } from '../state';
import { GRADE_NAMES } from '@fm/core';

type NavItem = { id: string; label: string; systemView?: 'save' | 'settings' | 'dossier' };
defineProps<{ tabs: ReadonlyArray<NavItem>; moreTabs: ReadonlyArray<NavItem>; title: string }>();
const g = computed(() => (gameReady.value ? getGame() : null));
const dateStr = computed(() => (gameReady.value ? state.gameDate : '----'));
const grade = computed(() => (g.value ? GRADE_NAMES[g.value.player.grade] : ''));
const unread = computed(() => unreadNews());
const more = ref<HTMLDetailsElement | null>(null);
function isActive(item: NavItem) { return state.screen === item.id && (item.id !== 'system' || !item.systemView || state.systemView === item.systemView); }
function switchTab(item: NavItem) { state.screen = item.id as typeof state.screen; if (item.systemView) state.systemView = item.systemView; if (more.value) more.value.open = false; }
</script>

<template>
  <header class="top">
    <div class="brand"><span class="brand-mark">汇</span><span>汇诚银行</span><small>城东支行</small></div>
    <nav class="tabs topbar-tabs" aria-label="主要功能">
      <button v-for="tab in tabs" :key="tab.id" :class="{ active: isActive(tab) }" @click="switchTab(tab)">
        {{ tab.label }}<span v-if="tab.id === 'market' && unread" class="badge" title="未读市场快讯">{{ unread > 9 ? '9+' : unread }}</span>
      </button>
      <details ref="more" class="more-menu">
        <summary :class="{ active: moreTabs.some(isActive) }">更多 <span>⌄</span></summary>
        <div class="menu-panel">
          <button v-for="item in moreTabs" :key="`${item.id}-${item.systemView ?? ''}`" :class="{ active: isActive(item) }" @click="switchTab(item)">{{ item.label }}</button>
        </div>
      </details>
    </nav>
    <div class="right"><span class="tag">{{ grade }}</span><span class="date">{{ dateStr }}</span></div>
  </header>
</template>

<style scoped>
.top{position:relative;z-index:20;display:flex;align-items:center;gap:24px;padding:8px 14px;background:rgba(16,23,39,.98);border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:8px;color:var(--gold);font-weight:700;letter-spacing:.04em;white-space:nowrap}.brand-mark{display:grid;place-items:center;width:27px;height:27px;border:1px solid rgba(240,180,41,.48);border-radius:7px;background:rgba(240,180,41,.09);font-size:13px}.brand small{color:#687797;font-size:10px;font-weight:400}.tabs{display:flex;align-items:center;gap:3px;flex:1}.tabs>button,.more-menu summary{position:relative;display:block;padding:6px 13px;border:0;border-radius:6px;background:transparent;color:var(--text-dim);font:inherit;font-size:12px;cursor:pointer;list-style:none}.more-menu summary::-webkit-details-marker{display:none}.tabs>button.active,.more-menu summary.active{background:var(--panel2);color:#fff}.badge{position:absolute;top:-3px;right:-2px;min-width:15px;padding:0 4px;border-radius:8px;background:var(--up);color:#fff;font-size:9px;line-height:14px}.more-menu{position:relative}.menu-panel{position:absolute;top:calc(100% + 7px);left:0;display:grid;grid-template-columns:repeat(2,130px);gap:3px;padding:7px;border:1px solid var(--line);border-radius:9px;background:#151e31;box-shadow:0 14px 40px rgba(0,0,0,.35)}.menu-panel button{text-align:left;padding:7px 9px;border-color:transparent;background:transparent;color:var(--text-dim);font-size:12px}.menu-panel button.active{background:rgba(79,140,255,.14);color:#b2cdff}.right{display:flex;align-items:center;gap:9px;white-space:nowrap}.date{color:var(--accent);font-weight:600;font-variant-numeric:tabular-nums}
@media(max-width:767px){.top{gap:7px;padding:6px 8px;flex-wrap:wrap}.brand{width:100%}.brand small{margin-left:auto}.right{position:absolute;right:8px;top:9px}.tabs{order:2;flex:1 0 100%;overflow:visible}.tabs>button,.more-menu summary{min-height:40px;padding:8px 11px}.menu-panel{left:auto;right:0;grid-template-columns:145px}.brand-mark{display:none}}
</style>
