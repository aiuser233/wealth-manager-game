<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, newGame } from './state';
import TopBar from './components/TopBar.vue';
import Workbench from './components/Workbench.vue';
import MarketTerminal from './components/MarketTerminal.vue';
import ClientsPanel from './components/ClientsPanel.vue';
import ExamPanel from './components/ExamPanel.vue';
import GalleryPanel from './components/GalleryPanel.vue';
import ReceptionDialog from './components/ReceptionDialog.vue';
import PromotionPanel from './components/PromotionPanel.vue';
import SystemPanel from './components/SystemPanel.vue';
import EventDialog from './components/EventDialog.vue';
import QuestDialog from './components/QuestDialog.vue';
import LifeNodeDialog from './components/LifeNodeDialog.vue';
import TutorialOverlay from './components/TutorialOverlay.vue';
import StartScreen from './components/StartScreen.vue';

const seed = ref(42);
const name = ref('林奇安');
const gender = ref<'m' | 'f'>('m');

const screenTitle = computed(() => {
  switch (state.screen) {
    case 'market': return '汇诚行情通';
    case 'clients': return '客户档案';
    case 'exam': return '考试中心';
    case 'gallery': return '图鉴馆';
    case 'system': return '系统';
    case 'help': return '新人手册';
    default: return '工作台';
  }
});

const tabs = [
  { id: 'workbench', label: '工作台' },
  { id: 'market', label: '行情终端' },
  { id: 'clients', label: '客户档案' },
  { id: 'exam', label: '考试中心' },
  { id: 'gallery', label: '图鉴馆' },
  { id: 'system', label: '系统' },
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
      <GalleryPanel v-else-if="state.screen === 'gallery'" />
      <SystemPanel v-else-if="state.screen === 'system'" />
      <div v-else class="panel help">
        <h3>新人手册</h3>
        <p>· <b>接待客户</b>是对话玩法：先挖潜（选话题了解真实需求），再从当期货架推荐产品。适当性不符客户会拒签，金额超资金池会被拒绝。</p>
        <p>· 每天有 4 点行动力（AP）；职级晋升后解锁周帧（10 AP）与月帧（36 AP）。重大事件会强制切回日帧。</p>
        <p>· 行动用尽后点结算推进时间。月度 KPI 评级 S/A/B+/B/C/D 影响绩效奖金，近 6 月均分是晋升硬指标。</p>
        <p>· 考试中心每年 3/6/9/12 月开考，证书是晋升硬门槛。图鉴馆收录知识词条、行情复盘卡与原型对照。</p>
        <p>· "重启记忆"调用前世记忆获得方向性提示——每次调用都会加速失准，2018 年后彻底归零。</p>
        <p>· 客户持仓按盯市计值：浮亏侵蚀信任，浮盈带来转介绍。长线经营才是王道。</p>
        <p class="dim">· 免责声明：本游戏为虚构作品，所有机构、人物、行情均为架空创作，不构成任何投资建议。</p>
      </div>
    </main>
    <ReceptionDialog />
    <EventDialog />
    <QuestDialog />
    <LifeNodeDialog />
    <TutorialOverlay />
    <PromotionPanel v-if="state.modal?.kind === 'promotion'" />
    <SystemPanel v-if="state.modal?.kind === 'system'" />
  </div>
</template>

<style scoped>
.start-wrap { height: 100%; display: flex; align-items: center; justify-content: center; }
.app { height: 100%; display: flex; flex-direction: column; }
.main { flex: 1; min-height: 0; padding: 10px 14px 14px; }
.help { padding: 16px 20px; line-height: 2; }
</style>


