<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, newGame } from './state';
import TopBar from './components/TopBar.vue';
import Workbench from './components/Workbench.vue';
import MarketTerminal from './components/MarketTerminal.vue';
import ClientsPanel from './components/ClientsPanel.vue';
import ExamPanel from './components/ExamPanel.vue';
import StartScreen from './components/StartScreen.vue';

const seed = ref(42);
const name = ref('林奇安');
const gender = ref<'m' | 'f'>('m');

const screenTitle = computed(() => {
  switch (state.screen) {
    case 'market': return '汇诚行情通';
    case 'clients': return '客户档案';
    case 'exam': return '考试中心';
    case 'help': return '新人手册';
    default: return '工作台';
  }
});

const tabs = [
  { id: 'workbench', label: '工作台' },
  { id: 'market', label: '行情终端' },
  { id: 'clients', label: '客户档案' },
  { id: 'exam', label: '考试中心' },
  { id: 'help', label: '手册' },
] as const;

function start() {
  newGame(seed.value, name.value.trim(), gender.value);
}
</script>

<template>
  <div v-if="!gameReady" class="start-wrap">
    <StartScreen v-model:seed="seed" v-model:name="name" v-model:gender="gender" @start="start" />
  </div>
  <div v-else class="app">
    <TopBar :tabs="tabs" :title="screenTitle" />
    <main class="main">
      <Workbench v-if="state.screen === 'workbench'" />
      <MarketTerminal v-else-if="state.screen === 'market'" />
      <ClientsPanel v-else-if="state.screen === 'clients'" />
      <ExamPanel v-else-if="state.screen === 'exam'" />
      <div v-else class="panel help">
        <h3>新人手册</h3>
        <p>· 每天有 4 点行动力（AP）：接待客户、厅堂轮值、外拓拜访、学习刷题、复盘行情、售后处理、同事互动、休息。</p>
        <p>· 职级晋升后解锁更粗的时间帧：普通理财经理可用周帧（10 AP/周），私行理财经理可用月帧（36 AP/月）。重大事件会强制切回日帧。</p>
        <p>· 行动用尽后点"下班结算"推进时间；周帧结算一周，月帧结算到月末。</p>
        <p>· 考试中心每年 3/6/9/12 月开考。证书是晋升硬门槛，通过考试还会提升专业力。</p>
        <p>· "重启记忆"按钮可以调用前世记忆获得方向性提示——但每次调用都会加速记忆失准，2018 年后彻底归零。</p>
        <p>· 每月 KPI 会在月初重置并上涨：存款、理财、基金、保险四项。</p>
        <p class="dim">· 免责声明：本游戏为虚构作品，所有机构、人物、行情均为架空创作，不构成任何投资建议。</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.start-wrap { height: 100%; display: flex; align-items: center; justify-content: center; }
.app { height: 100%; display: flex; flex-direction: column; }
.main { flex: 1; min-height: 0; padding: 10px 14px 14px; }
.help { padding: 16px 20px; line-height: 2; }
</style>

