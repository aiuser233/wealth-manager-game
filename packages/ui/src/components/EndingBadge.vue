<script setup lang="ts">
/**
 * 结局徽章（内联 SVG，按结局 id 给出独立图形与配色）：
 * investigation 天平倾斜 / burnout 心电 / plain_retire 绿植 / branch_manager 门牌
 * division_gm 王冠 / independent 印章 / reborn_investor 星轨
 */
import { computed } from 'vue';

const props = defineProps<{ id: string; size?: number }>();

const meta: Record<string, { color: string; bg: string; label: string }> = {
  investigation: { color: '#c0665a', bg: '#3a2320', label: '终' },
  burnout: { color: '#d0705a', bg: '#33221f', label: '警' },
  plain_retire: { color: '#7da65a', bg: '#22301c', label: '凡' },
  branch_manager: { color: '#4f8cff', bg: '#1c2740', label: '行' },
  division_gm: { color: '#e0b64a', bg: '#3a3115', label: '总' },
  independent: { color: '#8a6fb5', bg: '#2a2138', label: '立' },
  reborn_investor: { color: '#f0b429', bg: '#3a2d10', label: '隐' },
};
const m = computed(() => meta[props.id] ?? meta.plain_retire);
</script>

<template>
  <svg :width="size ?? 88" :height="size ?? 88" viewBox="0 0 100 100" class="ending-badge" aria-hidden="true">
    <defs>
      <radialGradient :id="`eg-${id}`" cx="50%" cy="38%" r="70%">
        <stop offset="0%" :stop-color="m.color" stop-opacity="0.35" />
        <stop offset="100%" :stop-color="m.bg" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="46" :fill="`url(#eg-${id})`" :stroke="m.color" stroke-width="2.5" />
    <circle cx="50" cy="50" r="40" fill="none" :stroke="m.color" stroke-width="0.8" opacity="0.5" />

    <!-- 各结局主图形 -->
    <g v-if="id === 'investigation'" :stroke="m.color" stroke-width="3" fill="none" stroke-linecap="round">
      <line x1="50" y1="28" x2="50" y2="66" /><line x1="34" y1="34" x2="66" y2="34" />
      <path d="M22 50 L34 34 L46 50 Z" /><path d="M54 44 L66 34 L78 44 Z" />
      <line x1="38" y1="66" x2="62" y2="66" />
    </g>
    <g v-else-if="id === 'burnout'">
      <polyline points="24,50 38,50 44,34 52,66 58,50 76,50" :stroke="m.color" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    </g>
    <g v-else-if="id === 'plain_retire'">
      <path d="M50 66 Q50 48 50 40" :stroke="m.color" stroke-width="3" fill="none" />
      <path d="M50 48 Q38 44 36 32 Q48 34 50 46" :fill="m.color" opacity="0.85" />
      <path d="M50 48 Q62 44 64 32 Q52 34 50 46" :fill="m.color" opacity="0.6" />
      <path d="M38 68 L62 68" :stroke="m.color" stroke-width="3" stroke-linecap="round" />
    </g>
    <g v-else-if="id === 'branch_manager'">
      <rect x="30" y="32" width="40" height="26" rx="4" fill="none" :stroke="m.color" stroke-width="3" />
      <line x1="36" y1="42" x2="56" y2="42" :stroke="m.color" stroke-width="2.5" />
      <line x1="36" y1="50" x2="50" y2="50" :stroke="m.color" stroke-width="2.5" />
      <circle cx="50" cy="66" r="4" :fill="m.color" />
    </g>
    <g v-else-if="id === 'division_gm'">
      <path d="M30 58 L34 36 L44 48 L50 32 L56 48 L66 36 L70 58 Z" :fill="m.color" opacity="0.9" />
      <circle cx="34" cy="33" r="3" :fill="m.color" /><circle cx="50" cy="26" r="3" :fill="m.color" /><circle cx="66" cy="33" r="3" :fill="m.color" />
      <line x1="32" y1="66" x2="68" y2="66" :stroke="m.color" stroke-width="3" stroke-linecap="round" />
    </g>
    <g v-else-if="id === 'independent'">
      <rect x="32" y="32" width="36" height="36" rx="6" fill="none" :stroke="m.color" stroke-width="3" />
      <text x="50" y="58" text-anchor="middle" :fill="m.color" font-size="24" font-weight="800" font-family="serif">立</text>
    </g>
    <g v-else>
      <ellipse cx="50" cy="50" rx="32" ry="13" fill="none" :stroke="m.color" stroke-width="1.5" opacity="0.6" transform="rotate(-24 50 50)" />
      <ellipse cx="50" cy="50" rx="32" ry="13" fill="none" :stroke="m.color" stroke-width="1.5" opacity="0.6" transform="rotate(30 50 50)" />
      <ellipse cx="50" cy="50" rx="32" ry="13" fill="none" :stroke="m.color" stroke-width="1.5" opacity="0.6" transform="rotate(84 50 50)" />
      <circle cx="50" cy="50" r="6" :fill="m.color" />
    </g>

    <!-- 中央汉字角标（叠于图形下方居中） -->
    <text x="50" y="92" text-anchor="middle" :fill="m.color" font-size="12" font-weight="700">{{ m.label }}</text>
  </svg>
</template>

<style scoped>
.ending-badge { filter: drop-shadow(0 0 12px rgba(240, 180, 41, 0.15)); }
</style>
