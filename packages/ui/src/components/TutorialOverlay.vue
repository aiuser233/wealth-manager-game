<script setup lang="ts">
import { computed } from 'vue';
import { state, tutorial, tutorialNext } from '../state';

/**
 * 新手强制引导（P2）：前 3 个交易日逐点教学。
 * 步骤状态机在 state.ts 的 tutorial 模块；本组件只渲染遮罩 + 指向说明。
 */
const step = computed(() => tutorial.value);
</script>

<template>
  <div v-if="step" class="mask" role="dialog" aria-modal="true" aria-label="新手引导" @click.stop>
    <div class="box panel">
      <div class="head">
        <span class="idx">{{ step.idx + 1 }} / 5</span>
        <h3>{{ step.title }}</h3>
      </div>
      <p class="body">{{ step.text }}</p>
      <p class="hint dim">{{ step.hint }}</p>
      <button class="primary" @click="tutorialNext()">{{ step.idx >= 4 ? '开始营业' : '知道了' }}</button>
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: fixed; inset: 0; z-index: 90;
  background: rgba(5, 8, 16, 0.72);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.box { width: min(480px, 94vw); padding: 20px 22px; display: flex; flex-direction: column; gap: 12px; }
.head { display: flex; align-items: baseline; gap: 10px; }
.head h3 { font-size: 16px; color: var(--gold); }
.idx { font-size: 12px; color: var(--text-dim); font-variant-numeric: tabular-nums; }
.body { line-height: 1.9; font-size: 14px; white-space: pre-line; }
.hint { font-size: 12px; line-height: 1.7; }
button { min-height: 44px; font-size: 14px; }
</style>
