<script setup lang="ts">
import { computed } from 'vue';
import { state, gameReady, getGame, confirmLifeNode } from '../state';

const node = computed(() => state.lifeDialog);
const clientName = computed(() => {
  if (!node.value) return '';
  return getGame()?.clients.find((c) => c.id === node.value!.client)?.name ?? '';
});
</script>

<template>
  <div v-if="node" class="mask">
    <div class="panel life">
      <div class="head">
        <span class="tag">客户人生线</span>
        <h3>{{ node.title }}</h3>
      </div>
      <p class="client-line"><b class="gold">{{ clientName }}</b></p>
      <p class="text">{{ node.text }}</p>
      <p class="dim effect">
        <span v-if="node.effects.trust">信任 +{{ node.effects.trust }} </span>
        <span v-if="node.effects.unlockKnowledge">解锁知识：{{ node.effects.unlockKnowledge.join('、') }}</span>
      </p>
      <button class="primary" @click="confirmLifeNode">记下了</button>
    </div>
  </div>
</template>

<style scoped>
.mask { position: fixed; inset: 0; background: rgba(4, 6, 14, 0.7); display: flex; align-items: center; justify-content: center; z-index: 65; }
.life { width: 540px; padding: 20px 24px; text-align: center; }
.head { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px; }
h3 { font-size: 16px; }
.client-line { margin: 8px 0; font-size: 15px; }
.text { line-height: 2; margin-bottom: 10px; text-align: left; }
.effect { margin-bottom: 14px; font-size: 12px; }
</style>
