<script setup lang="ts">
import { computed } from 'vue';
import { state, gameReady, getGame } from '../state';
import { PROMOTION_PATH } from '@fm/core';
import { fmtMoney } from '@fm/core';

const g = computed(() => (gameReady.value ? getGame() : null));
const results = computed(() => (g.value ? g.value.promotionCheck() : []));
</script>

<template>
  <div v-if="g" class="mask">
    <div class="panel promo">
      <div class="head"><h3>职业发展 · 晋升评审</h3><span class="dim">当前职级：{{ g.gradeName() }}</span></div>
      <div class="reqs">
        <div v-for="r in results" :key="r.req.grade" class="req" :class="{ done: g.player.grade >= r.req.grade }">
          <div class="l1">
            <b>{{ r.req.name }}</b>
            <span v-if="g.player.grade >= r.req.grade" class="gold">已达成 ✓</span>
            <span v-else-if="r.eligible" class="down">可提交评审 →（工作台"晋升评审"按钮）</span>
          </div>
          <p class="dim desc">{{ r.req.desc }}</p>
          <p v-if="!r.eligible && g.player.grade < r.req.grade" class="missing">
            <span v-for="(m, i) in r.missing" :key="i" class="m-item">{{ m }}</span>
          </p>
        </div>
      </div>
      <div class="foot">
        <span class="dim">AUM {{ fmtMoney(g.player.aum) }} · 贵宾客户 {{ g.vipClientCount() }} 户 · 私行客户 {{ g.privateClientCount() }} 户 · 近{{ g.monthScores.length }}月均分 {{ g.recentSeasonScore().toFixed(0) }}</span>
        <button @click="state.modal = null">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center; z-index: 50; }
.promo { width: 620px; max-height: 84vh; padding: 16px 20px; display: flex; flex-direction: column; overflow: hidden; }
.head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
.reqs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.req { background: var(--bg2); border: 1px solid var(--line); border-radius: 8px; padding: 10px 14px; }
.req.done { opacity: 0.55; }
.l1 { display: flex; justify-content: space-between; align-items: center; }
.desc { font-size: 12px; margin: 4px 0; }
.missing { font-size: 12px; color: var(--warn); }
.m-item { display: inline-block; margin-right: 10px; }
.foot { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
</style>
