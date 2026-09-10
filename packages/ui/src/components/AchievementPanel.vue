<script setup lang="ts">
/** 成就馆：全部成就徽章墙（达成金色点亮，未达成灰态+进度） */
import { computed } from 'vue';
import { achievementStates } from '../achievements';

const list = computed(() => achievementStates());
const achievedCount = computed(() => list.value.filter((a) => a.achieved).length);
const tierName: Record<string, string> = { bronze: '铜', silver: '银', gold: '金', hidden: '隐' };
const tierColor: Record<string, string> = { bronze: '#b5893c', silver: '#9aa5b1', gold: '#e0b64a', hidden: '#b589d8' };
</script>

<template>
  <div class="ach">
    <div class="head">
      <h3>成就馆</h3>
      <span class="dim">已达成 {{ achievedCount }} / {{ list.length }}</span>
    </div>
    <div class="grid">
      <div
        v-for="a in list" :key="a.def.id"
        class="card" :class="{ done: a.achieved, hidden: a.def.tier === 'hidden' && !a.achieved }"
      >
        <span class="icon">{{ a.def.tier === 'hidden' && !a.achieved ? '❓' : a.def.icon }}</span>
        <b>{{ a.def.tier === 'hidden' && !a.achieved ? '???' : a.def.name }}</b>
        <p class="dim">{{ a.def.tier === 'hidden' && !a.achieved ? '隐藏成就，达成后揭晓' : a.def.desc }}</p>
        <p v-if="!a.achieved && a.progress" class="progress dim">{{ a.progress }}</p>
        <span class="tier" :style="{ color: tierColor[a.def.tier] }">{{ tierName[a.def.tier] }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ach { padding: 4px; }
.head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 12px; }
h3 { font-size: 16px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.card { position: relative; background: var(--bg1); border: 1px solid var(--line); border-radius: 10px; padding: 12px; text-align: center; opacity: 0.55; }
.card.done { opacity: 1; border-color: var(--gold); background: linear-gradient(160deg, var(--bg1), rgba(224, 182, 74, 0.08)); }
.card.hidden { opacity: 0.4; }
.icon { font-size: 30px; display: block; margin-bottom: 6px; }
b { font-size: 13px; display: block; }
p { font-size: 11px; line-height: 1.5; margin: 4px 0 0; }
.progress { color: var(--gold); }
.tier { position: absolute; top: 8px; right: 10px; font-size: 11px; font-weight: 800; opacity: 0.8; }
</style>
