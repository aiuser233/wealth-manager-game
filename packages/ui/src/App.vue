<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { state, gameReady, newGame, loadGameFromSave, validateSaveData } from './state';
import { storage } from './storage';
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
import TrainerPanel from './components/TrainerPanel.vue';
import LecturerMode from './components/LecturerMode.vue';
import TeamPanel from './components/TeamPanel.vue';
import AchievementPanel from './components/AchievementPanel.vue';
import ArchivePanel from './components/ArchivePanel.vue';
import AnnualReportDialog from './components/AnnualReportDialog.vue';

const seed = ref(42);
const name = ref('林奇安');
const gender = ref<'m' | 'f'>('m');
const loading = ref(false);
const startError = ref('');

function readAutoSave() {
  const raw = storage.get('fm_save_0');
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const check = validateSaveData(data);
    return check.ok ? { raw, data, label: `${data.player?.name ?? '未命名'} · ${data.date}` } : null;
  } catch { return null; }
}
const autoSave = ref(readAutoSave());

const screenTitle = computed(() => {
  switch (state.screen) {
    case 'market': return '汇诚行情通';
    case 'clients': return '客户档案';
    case 'exam': return '考试中心';
    case 'gallery': return '图鉴馆';
    case 'system': return '系统';
    case 'archive': return '日志档案馆';
    case 'trainer': return '培训后台';
    case 'lecturer': return '讲师模式大屏';
    case 'team': return '团队管理';
    case 'ach': return '成就馆';
    case 'help': return '新人手册';
    default: return '工作台';
  }
});

const tabs = [
  { id: 'workbench', label: '工作台' },
  { id: 'clients', label: '客户' },
  { id: 'market', label: '行情' },
  { id: 'exam', label: '学习' },
  { id: 'system', label: '生涯', systemView: 'dossier' },
] as const;

const trainingMode = new URLSearchParams(location.search).get('mode') === 'training';
const moreTabs = computed(() => {
  const items: Array<{ id: string; label: string; systemView?: 'save' | 'settings' | 'dossier' }> = [
    { id: 'gallery', label: '知识图鉴' }, { id: 'ach', label: '成就馆' }, { id: 'archive', label: '日志档案' },
  ];
  if (Number(state.gameDate.slice(0, 4)) >= 2023) items.push({ id: 'team', label: '团队管理' });
  items.push({ id: 'system', label: '存档与报告', systemView: 'save' }, { id: 'system', label: '设置', systemView: 'settings' }, { id: 'help', label: '新人手册' });
  if (trainingMode) items.push({ id: 'trainer', label: '培训后台' }, { id: 'lecturer', label: '讲师模式' });
  return items;
});

async function letLoadingPaint() {
  loading.value = true;
  startError.value = '';
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function start() {
  if (autoSave.value && !confirm('开始新生涯不会立即删除旧档，但下一次自动保存会覆盖它。建议先从原进度导出备份。仍要继续吗？')) return;
  await letLoadingPaint();
  try { newGame(seed.value, name.value.trim(), gender.value); }
  catch (error) { startError.value = error instanceof Error ? error.message : '新游戏初始化失败。'; }
  finally { loading.value = false; }
}

async function continueGame() {
  if (!autoSave.value) return;
  await letLoadingPaint();
  try { loadGameFromSave(autoSave.value.data); }
  catch (error) { startError.value = error instanceof Error ? error.message : '自动存档无法读取。'; }
  finally { loading.value = false; }
}
function reloadApp() { window.location.reload(); }
function exportExistingSave() {
  const raw = autoSave.value?.raw;
  if (!raw) return;
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `理财经理存档_${autoSave.value?.data?.date ?? 'backup'}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div v-if="!gameReady" class="start-wrap">
    <StartScreen v-model:seed="seed" v-model:name="name" v-model:gender="gender" :has-save="!!autoSave" :save-label="autoSave?.label" :loading="loading" :error="startError" @start="start" @continue="continueGame" @export-save="exportExistingSave" />
  </div>
  <div v-else class="app">
    <TopBar :tabs="tabs" :more-tabs="moreTabs" :title="screenTitle" />
    <main class="main">
      <Workbench v-if="state.screen === 'workbench'" />
      <MarketTerminal v-else-if="state.screen === 'market'" />
      <ClientsPanel v-else-if="state.screen === 'clients'" />
      <ExamPanel v-else-if="state.screen === 'exam'" />
      <GalleryPanel v-else-if="state.screen === 'gallery'" />
      <SystemPanel v-else-if="state.screen === 'system'" />
      <ArchivePanel v-else-if="state.screen === 'archive'" />
      <TeamPanel v-else-if="state.screen === 'team'" />
      <AchievementPanel v-else-if="state.screen === 'ach'" />
      <TrainerPanel v-else-if="state.screen === 'trainer'" />
      <LecturerMode v-else-if="state.screen === 'lecturer'" />
      <div v-else class="panel help">
        <h3>新人手册</h3>
        <p>· <b>接待客户</b>是对话玩法：先挖潜（选话题了解真实需求），再从当期货架推荐产品。适当性不符客户会拒签，金额超资金池会被拒绝。</p>
        <p>· 每天有 4 点行动力（AP）；职级晋升后解锁周帧（10 AP）与月帧（36 AP）。重大事件会强制切回日帧。</p>
        <p>· 行动用尽后点结算推进时间。月度 KPI 评级 S/A/B+/B/C/D 影响绩效奖金，近 6 月均分是晋升硬指标。</p>
        <p>· <b>主线剧情</b>单周目 82 章覆盖 2006–2027，日期到点自动弹出；每次抉择（最佳/良好/平平/隐患）都会写入生涯档案，卷末按"业绩/专业/红线/信任"给三维终评。</p>
        <p>· <b>客户人生线</b>：信任达标后触发 20 年长线节点（王秀兰/李建国/周宏图/吴建国），你 2007 年的选择会在 2015 年找到你。</p>
        <p>· <b>团队管理</b>（卷四起）：顶栏「团队」页管理下属——辅导投入决定成长速度与士气，士气过低会闯祸甚至离职；分大客户提振个人但损伤公平感；出师人数是晋升"私行团队主管"的硬条件。</p>
        <p>· <b>结局</b>：卷五终章按二十年数据判结局——零违规高信任通向独立顾问/家办；管理路线通向支行行长/总经理；违规 3 次调查立案（Bad End）；压力爆表触发过劳警示。隐藏结局"重返投资界"需二周目 + 全主线 + 零违规 + 信任 ≥55。</p>
        <p>· <b>二周目</b>：达成隐藏结局后解锁。新一局主线事件时间 ±1 季度漂移——背答案没用了，靠专业。</p>
        <p>· 考试中心每年 3/6/9/12 月开考，证书是晋升硬门槛。图鉴馆收录知识词条、行情复盘卡与原型对照，还有财务计算器（复利/定投/房贷/养老缺口）。</p>
        <p>· "重启记忆"调用前世记忆获得方向性提示——每次调用都会加速失准，2018 年后彻底归零。</p>
        <p>· 客户持仓按盯市计值：浮亏侵蚀信任，浮盈带来转介绍。长线经营才是王道。</p>
        <p class="dim">· 免责声明：本游戏为虚构作品，所有机构、人物、行情均为架空创作，不构成任何投资建议。</p>
      </div>
    </main>
    <ReceptionDialog />
    <EventDialog />
    <QuestDialog />
    <LifeNodeDialog />
    <AnnualReportDialog />
    <TutorialOverlay />
    <PromotionPanel v-if="state.modal?.kind === 'promotion'" />
    <SystemPanel v-if="state.modal?.kind === 'system'" />
    <div v-if="state.runtimeError" class="runtime-error" role="alert">
      <div><b>游戏遇到了一点问题</b><p>{{ state.runtimeError }}</p><small>自动存档通常仍在当前浏览器中，可先刷新页面并选择“继续上次进度”。</small></div>
      <button @click="state.runtimeError = ''">暂时关闭</button><button class="primary" @click="reloadApp">刷新恢复</button>
    </div>
  </div>
</template>

<style scoped>
.start-wrap { height: 100%; display: flex; align-items: center; justify-content: center; }
.app { height: 100%; display: flex; flex-direction: column; }
.main { flex: 1; min-height: 0; padding: 10px 14px 14px; }
.help { padding: 16px 20px; line-height: 2; }
.runtime-error { position: fixed; z-index: 120; right: 18px; bottom: 18px; width: min(520px, calc(100vw - 36px)); display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 10px; padding: 13px 14px; border: 1px solid var(--warn); border-radius: 10px; background: #231b21; box-shadow: 0 18px 50px rgba(0,0,0,.45); }
.runtime-error p { margin-top: 3px; color: #ffb09b; font-size: 12px; }.runtime-error small { color: var(--text-dim); font-size: 10px; }
@media (max-width: 767px) { .runtime-error { grid-template-columns: 1fr 1fr; }.runtime-error>div { grid-column: 1 / 3; } }
</style>


