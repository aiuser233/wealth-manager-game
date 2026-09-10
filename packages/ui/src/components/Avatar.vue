<script setup lang="ts">
/**
 * 内联 SVG 头像（无外部资源，保持零依赖与体积预算）：
 * 以"发型+肤色+表情+职业配色"组合生成角色视觉标识。
 */
const props = defineProps<{
  /** 角色 id 或名字哈希源 */
  seed: string;
  /** 头像直径 px */
  size?: number;
}>();

// 稳定哈希：同 seed 同头像
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const h = hash(props.seed);

// 发型（0-5）：不同 path 覆盖
const hairstyles = [
  'M14 12 Q24 2 34 12 L34 16 Q24 8 14 16 Z',             // 短发
  'M12 14 Q24 0 36 14 L36 20 Q30 10 24 10 Q18 10 12 20 Z', // 齐刘海
  'M13 12 Q24 3 35 12 L37 22 Q35 14 24 12 Q13 14 11 22 Z', // 侧分
  'M14 10 Q24 1 34 10 L35 26 Q24 20 13 26 Z',             // 长发
  'M14 13 Q24 4 34 13 L34 14 Q29 8 24 8 Q19 8 14 14 Z',   // 寸头（细弧）
  'M12 13 Q24 2 36 13 L38 24 Q36 12 24 11 Q12 12 10 24 Z', // 卷发蓬松
];
const hairIdx = h % hairstyles.length;

// 肤色（0-4）
const skins = ['#f5d5b8', '#f0c8a0', '#e8b88a', '#dcc09a', '#f7e0c8'];
const skin = skins[(h >> 4) % skins.length];

// 发色（0-5）
const hairs = ['#2b2b33', '#4a3b2a', '#1a1a22', '#5a4a3a', '#33302a', '#6a5a4a'];
const hairColor = hairs[(h >> 8) % hairs.length];

// 衣着配色（0-7）：职业感主色
const clothes = ['#4f8cff', '#5a8a4a', '#b5893c', '#8b6fb5', '#c0665a', '#4a8a8a', '#7a6a5a', '#3a5a8a'];
const clothColor = clothes[(h >> 12) % clothes.length];

// 表情（0-2）：微笑/平静/认真
const exprIdx = (h >> 16) % 3;
const mouths = [
  'M20 30 Q24 34 28 30',   // 微笑
  'M20 31 L28 31',         // 平静
  'M20 31 Q24 30 28 31',   // 认真
];
const glasses = (h >> 20) % 4 === 0; // 1/4 概率戴眼镜
</script>

<template>
  <svg :width="size ?? 40" :height="size ?? 40" viewBox="0 0 48 48" class="avatar" aria-hidden="true">
    <!-- 身体 -->
    <path d="M10 48 Q10 36 24 36 Q38 36 38 48 Z" :fill="clothColor" />
    <!-- 头 -->
    <circle cx="24" cy="22" r="11" :fill="skin" />
    <!-- 头发 -->
    <path :d="hairstyles[hairIdx]" :fill="hairColor" />
    <!-- 眼睛 -->
    <circle cx="20" cy="22" r="1.4" fill="#2b2b33" />
    <circle cx="28" cy="22" r="1.4" fill="#2b2b33" />
    <!-- 眼镜 -->
    <g v-if="glasses" stroke="#3a4a5a" stroke-width="1" fill="none">
      <circle cx="20" cy="22" r="3.4" />
      <circle cx="28" cy="22" r="3.4" />
      <line x1="23.4" y1="22" x2="24.6" y2="22" />
    </g>
    <!-- 嘴 -->
    <path :d="mouths[exprIdx]" stroke="#a06a5a" stroke-width="1.4" fill="none" stroke-linecap="round" />
  </svg>
</template>

<style scoped>
.avatar { display: inline-block; vertical-align: middle; border-radius: 50%; background: var(--bg2, #f2ead8); }
</style>
