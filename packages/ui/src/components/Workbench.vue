<script setup lang="ts">
import { computed } from 'vue';
import { state, gameReady, getGame, doAction, advanceFrame, pushLog, switchFrame, useMemoryHint, frameLabel, startReception, resolveActionScene, closeActionScene, pickStudyAnswer, checkStudyAnswer } from '../state';
import { ACTION_NAMES, ACTION_DESC, fmtMoney, type ActionType, type TimeFrame } from '@fm/core';

const g = computed(() => (gameReady.value ? getGame() : null));

const actions: ActionType[] = ['lobby', 'outreach', 'study', 'review', 'aftersale', 'social', 'rest'];

const apLeft = computed(() => Math.max(0, state.apMax - state.apUsed));

const curFrame = computed<TimeFrame>(() => getGame()?.frame ?? 'day');

const frames: Array<{ id: TimeFrame; label: string }> = [
  { id: 'day', label: '日帧' },
  { id: 'week', label: '周帧' },
  { id: 'month', label: '月帧' },
];

const advanceLabel = computed(() => {
  if (apLeft.value > 0) return `${frameLabel()}还有 ${apLeft.value} 点行动未用`;
  return curFrame.value === 'day' ? '下班结算 → 下一个交易日' : curFrame.value === 'week' ? '周末结算 → 下一周' : '月末结算 → 下个月';
});

/** 主线进度（图鉴馆/工作台共用） */
const questProgress = computed(() => {
  const qe = state.questEngine;
  if (!qe) return null;
  return qe.volumeProgress(1);
});

/** 按玩家当前进度推算所在卷（卷一 2006-2009 / 卷二 2010-2015 / 卷三 2016-2020 / 卷四 2021-2023 / 卷五 2024-2025 / 卷六 2025 彩蛋卷：终章完成后） */
const currentVolume = computed(() => {
  const game = gameReady.value ? getGame() : null;
  const y = Number(game?.date?.slice(0, 4) ?? 2006);
  const qe = state.questEngine;
  // 卷六只在日期到达彩蛋窗口（2025-03 起）且卷五终章完成后接管
  if (qe && (game?.date ?? '') >= '2025-03-05' && qe.completed.has('q5_12_vol5_end')) return 6;
  if (y <= 2009) return 1;
  if (y <= 2015) return 2;
  if (y <= 2020) return 3;
  if (y <= 2023) return 4;
  return 5;
});
const questProgressCur = computed(() => {
  const qe = state.questEngine;
  if (!qe) return null;
  return qe.volumeProgress(currentVolume.value);
});

const kpi = computed(() => {
  const k = g.value?.kpi;
  if (!k) return [];
  return [
    { label: '存款', done: k.deposit_done, target: k.deposit_target },
    { label: '理财', done: k.wm_done, target: k.wm_target },
    { label: '基金', done: k.fund_done, target: k.fund_target },
    { label: '保险', done: k.ins_done, target: k.ins_target },
  ];
});

const currentObjective = computed(() => {
  if (state.appointments.length > 0) return { title: '优先接待预约客户', text: `${state.appointments[0].clientName}正在等候，完成接待可推进客户关系。`, action: '接待客户' };
  if (apLeft.value <= 0) return { title: '完成本帧结算', text: '行动点已经用完，结算后市场、客户和剧情会继续推进。', action: '点击底部结算' };
  const gaps = kpi.value.filter((item) => item.target > 0).map((item) => ({ ...item, ratio: item.done / item.target })).sort((a, b) => a.ratio - b.ratio);
  const weakest = gaps[0];
  if (weakest && weakest.ratio < .8) return { title: `本月重点：补足${weakest.label}`, text: `当前完成 ${Math.round(weakest.ratio * 100)}%，可通过接待、外拓和客户经营寻找机会。`, action: '建议接待或外拓' };
  return { title: '经营长期信任', text: 'KPI进度平稳，可学习、复盘或售后，积累专业与客户口碑。', action: '自由安排' };
});

function onAct(a: ActionType) {
  doAction(a, ACTION_NAMES[a]);
}

/** 接待改为对话玩法 */
function onReception() {
  if (startReception()) {
    state.apUsed += 0; // AP 在对话成交/送客时统一结算
  }
}

/** 行动小剧场：学习刷题的答案显示 */
function studyOptText(i: number): string {
  const q = state.studyQuestion?.q;
  return q ? `${String.fromCharCode(65 + i)}. ${q.options[i]}` : '';
}
function studyPicked(i: number): boolean {
  const sq = state.studyQuestion;
  if (!sq) return false;
  if (sq.q.type === 'multiple') return (sq.picked as number[]).includes(i);
  return sq.picked === i;
}
function studyToggle(i: number) {
  const sq = state.studyQuestion;
  if (!sq || sq.checked) return;
  if (sq.q.type === 'multiple') {
    const arr = sq.picked as number[];
    pickStudyAnswer(arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]);
  } else {
    pickStudyAnswer(i);
  }
}
const studyFeedback = computed(() => {
  const sq = state.studyQuestion;
  if (!sq?.checked) return '';
  return sq.correct
    ? `✓ 答对了！解析：${sq.q.explanation}`
    : `✗ 答错了，正确答案：${sq.q.type === 'multiple' ? (sq.q.answer as number[]).map((x) => String.fromCharCode(65 + x)).join('、') : String.fromCharCode(65 + (sq.q.answer as number))}。解析：${sq.q.explanation}`;
});
function studyCheck() {
  checkStudyAnswer();
}


/** B1 日志归档：工作台日志面板只显示最近 6 个月的日志，完整历史去档案馆看 */
const visibleLog = computed(() => {
  const months = state.settings.logArchiveMonths;
  if (months <= 0 || !g.value) return state.log;
  const cur = state.gameDate.slice(0, 7);
  let y = Number(cur.slice(0, 4)), m = Number(cur.slice(5, 7));
  m -= months;
  while (m <= 0) { m += 12; y -= 1; }
  const floor = `${y}-${String(m).padStart(2, '0')}`;
  return state.log.filter((l) => l.date >= `${floor}-01`);
});

function endFrame() {
  if (!g.value) return;
  const n = advanceFrame();
  pushLog(`【结算】${frameLabel()}推进 ${n} 个交易日：AUM ${fmtMoney(g.value.player.aum)}。`);
}

function onMemory() {
  useMemoryHint();
}

/** 晋升评审 */
function openPromotion() {
  const next = g.value?.promotionCheck().find((r) => r.req.grade === (g.value?.player.grade ?? 0) + 1);
  if (!next) return;
  if (next.eligible && g.value!.applyPromotion()) {
    pushLog(`【晋升】评审通过！现任命为「${next.req.name}」。`);
  }
  state.modal = { kind: 'promotion' };
}
</script>

<template>
  <div v-if="g" class="grid">
    <!-- 左：行动区 -->
    <section class="panel act">
      <div class="head">
        <h3>{{ frameLabel() }}行动</h3>
        <div class="frame-ctrl">
          <button
            v-for="f in frames" :key="f.id"
            :class="{ active: curFrame === f.id }"
            :disabled="!getGame().canSetFrame(f.id)"
            @click="switchFrame(f.id)"
          >{{ f.label }}</button>
        </div>
        <span class="ap">AP <b>{{ apLeft }}</b> / {{ state.apMax }}</span>
      </div>
      <div class="objective"><div><span class="objective-label">当前目标</span><b>{{ currentObjective.title }}</b><p>{{ currentObjective.text }}</p></div><span class="objective-action">{{ currentObjective.action }}</span></div>
      <div class="actions">
        <button class="reception-btn" :disabled="apLeft <= 0 || !!state.reception" title="面对面接待客户：挖潜需求、推荐产品" @click="onReception">
          🤝 接待客户（对话）
        </button>
        <button v-for="a in actions" :key="a" :disabled="apLeft <= 0" :title="ACTION_DESC[a]" @click="onAct(a)">
          {{ ACTION_NAMES[a] }}
        </button>
      </div>
      <div class="memory" v-if="state.memoryHint">
        <p class="mem-hint">{{ state.memoryHint }}</p>
      </div>
      <div class="result">
        <p v-if="state.todayActions.length === 0" class="dim">本帧还没有行动。选择上方的行动开始。</p>
        <p v-for="(t, i) in state.todayActions" :key="i" :class="{ latest: i === state.todayActions.length - 1 }">{{ t.text }}</p>
      </div>

      <!-- 行动小剧场：具体交互场景（除接待外的一次性行动都会弹） -->
      <div v-if="state.actionScene" class="scene">
        <p class="scene-narr">{{ state.actionScene.narration }}</p>
        <!-- 学习刷题：真实题目作答 -->
        <template v-if="state.actionScene.kind === 'study' && state.studyQuestion">
          <div class="study-q">
            <p class="q-stem">{{ state.studyQuestion.q.stem }}<span v-if="state.studyQuestion.q.type === 'multiple'" class="dim">（多选）</span></p>
            <div class="q-opts">
              <button
                v-for="(opt, oi) in state.studyQuestion.q.options" :key="oi"
                class="q-opt" :class="{ picked: studyPicked(oi), right: state.studyQuestion!.checked && studyPicked(oi) && state.studyQuestion!.correct, wrong: state.studyQuestion!.checked && studyPicked(oi) && !state.studyQuestion!.correct }"
                :disabled="state.studyQuestion.checked"
                @click="studyToggle(oi)"
              >{{ studyOptText(oi) }}</button>
            </div>
            <p v-if="studyFeedback" class="q-fb" :class="{ ok: state.studyQuestion.correct }">{{ studyFeedback }}</p>
            <button v-if="!state.studyQuestion.checked" class="primary" :disabled="state.studyQuestion.q.type === 'multiple' ? (state.studyQuestion.picked as number[]).length === 0 : state.studyQuestion.picked === null" @click="studyCheck">核对答案</button>
            <button v-else class="ghost" @click="closeActionScene">继续工作</button>
          </div>
        </template>
        <!-- 其他行动：选择应对方式 -->
        <template v-else-if="state.actionScene.options && state.actionScene.picked === undefined">
          <p class="scene-ask">你会怎么做？</p>
          <div class="scene-opts">
            <button v-for="(o, oi) in state.actionScene.options" :key="oi" @click="resolveActionScene(oi)">{{ o.text }}</button>
          </div>
        </template>
        <template v-else-if="state.actionScene.picked !== undefined && state.actionScene.options">
          <p class="scene-reply">{{ state.actionScene.options[state.actionScene.picked].reply }}</p>
          <button class="ghost" @click="closeActionScene">继续工作</button>
        </template>
      </div>

      <div class="foot">
        <button class="ghost" @click="onMemory" title="调用前世记忆（方向性提示，越用越失准）">重启记忆</button>
        <button class="promo-btn" :disabled="!g" @click="openPromotion" title="查看晋升条件，满足时可提交评审">晋升评审</button>
        <button class="primary grow" :disabled="apLeft > 0" @click="endFrame">
          {{ advanceLabel }}
        </button>
      </div>
    </section>

    <!-- 右上：角色状态 -->
    <section class="panel me">
      <div class="head"><h3>{{ g.player.name }} · 状态</h3></div>
      <div class="stats">
        <div class="row"><span>职级</span><b>{{ g.gradeName() }}</b></div>
        <div class="row"><span>AUM</span><b class="gold">{{ fmtMoney(g.player.aum) }}</b></div>
        <div class="row"><span>精力</span><b>{{ Math.round(g.player.energy) }}</b></div>
        <div class="row"><span>压力</span><b :class="{ warn: g.player.attrs.stress > 60 }">{{ Math.round(g.player.attrs.stress) }}</b></div>
        <div class="row"><span>专业力</span><b>{{ g.player.attrs.pro.toFixed(0) }}</b></div>
        <div class="row"><span>沟通力</span><b>{{ g.player.attrs.comm.toFixed(0) }}</b></div>
        <div class="row"><span>销售力</span><b>{{ g.player.attrs.sales.toFixed(0) }}</b></div>
        <div class="row"><span>知名度</span><b>{{ g.player.attrs.fame.toFixed(0) }}</b></div>
      </div>
    </section>

    <!-- 右中：KPI -->
    <section class="panel kpi">
      <div class="head"><h3>本月 KPI（{{ g.kpi.year }}年{{ g.kpi.month }}月）</h3></div>
      <div v-for="item in kpi" :key="item.label" class="kpi-row">
        <span class="kpi-label">{{ item.label }}</span>
        <div class="bar">
          <div class="fill" :style="{ width: Math.min(100, (item.target > 0 ? item.done / item.target : 0) * 100) + '%' }" />
        </div>
        <span class="kpi-num dim">{{ item.target > 0 ? fmtMoney(item.done) + ' / ' + fmtMoney(item.target) : '本年代无此类' }}</span>
      </div>
      <div v-if="questProgressCur" class="quest-prog">
        <span class="dim">{{ currentVolume === 6 ? '卷六·彩蛋' : `卷${['一', '二', '三', '四', '五'][currentVolume - 1]}主线` }}：{{ questProgressCur.done }} / {{ questProgressCur.total }} 章</span>
      </div>
    </section>

    <!-- 右下：日志（最近 N 个月，B1 完整历史走「档案」页） -->
    <section class="panel logs">
      <div class="head">
        <h3>日志</h3>
        <button class="archive-btn" @click="state.screen = 'archive'" title="查看完整历史日志（按年月归档）">📜 档案馆</button>
      </div>
      <div class="log-list">
        <p v-for="(l, i) in visibleLog" :key="i"><span class="dim">{{ l.date }}</span> {{ l.text }}</p>
        <p v-if="visibleLog.length === 0" class="dim">暂无日志。</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.grid {
  height: 100%;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  grid-template-rows: auto auto 1fr;
  gap: 12px;
}
.panel { padding: 14px 16px; overflow: hidden; display: flex; flex-direction: column; }
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
h3 { font-size: 15px; }

.act { grid-column: 1; grid-row: 1 / 4; }
.me { grid-column: 2; grid-row: 1; }
.kpi { grid-column: 2; grid-row: 2; }
.logs { grid-column: 2; grid-row: 3; }
.ap b { color: var(--accent); font-size: 16px; }
.actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
.objective { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 11px; padding: 9px 11px; border: 1px solid rgba(79, 140, 255, .28); border-radius: 8px; background: rgba(79, 140, 255, .07); }
.objective-label { display: block; margin-bottom: 2px; color: #7797ce; font-size: 9px; font-weight: 700; letter-spacing: .12em; }
.objective b { font-size: 12px; }.objective p { margin-top: 2px; color: var(--text-dim); font-size: 10px; line-height: 1.45; }.objective-action { flex: 0 0 auto; color: #9ebcff; font-size: 10px; }
.result { flex: 1; overflow-y: auto; border-top: 1px dashed var(--line); padding-top: 10px; line-height: 1.7; }
.result p.latest { color: #fff; }
.frame-ctrl { display: flex; gap: 4px; }
.frame-ctrl button { padding: 3px 10px; font-size: 12px; }
.frame-ctrl button.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.memory { background: rgba(124, 92, 255, 0.12); border: 1px solid var(--accent2); border-radius: 8px; padding: 8px 12px; margin-bottom: 10px; }
.scene { background: rgba(79, 140, 255, 0.08); border: 1px solid var(--accent); border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; }
.scene-narr { line-height: 1.7; margin-bottom: 8px; }
.scene-ask { font-size: 12px; color: var(--text-dim); margin-bottom: 6px; }
.scene-opts { display: flex; flex-direction: column; gap: 6px; }
.scene-opts button { text-align: left; padding: 8px 12px; line-height: 1.5; }
.scene-reply { color: var(--gold); line-height: 1.7; margin-bottom: 8px; }
.study-q .q-stem { font-weight: 600; line-height: 1.7; margin-bottom: 6px; }
.q-opts { display: flex; flex-direction: column; gap: 5px; margin-bottom: 8px; }
.q-opt { text-align: left; padding: 7px 10px; line-height: 1.5; }
.q-opt.picked { border-color: var(--accent); }
.q-opt.right { border-color: var(--down); color: var(--down); }
.q-opt.wrong { border-color: var(--up); color: var(--up); }
.q-fb { line-height: 1.7; margin-bottom: 8px; }
.q-fb.ok { color: var(--down); }
.mem-hint { color: #c9b8ff; line-height: 1.6; font-size: 13px; }
.ghost { border-color: var(--accent2); color: #c9b8ff; background: transparent; }
.ghost:hover:not(:disabled) { background: rgba(124, 92, 255, 0.12); }
.promo-btn { border-color: var(--gold); color: var(--gold); background: transparent; }
.promo-btn:hover:not(:disabled) { background: rgba(240, 180, 41, 0.12); }
.reception-btn { grid-column: 1 / 3; background: rgba(240, 180, 41, 0.1); border-color: var(--gold); color: var(--gold); font-weight: 600; }
.foot { margin-top: 12px; display: flex; gap: 8px; }
.grow { flex: 1; }
.foot button { width: 100%; padding: 10px; }

.me .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
.row { display: flex; justify-content: space-between; line-height: 2; }
.row span { color: var(--text-dim); }
.warn { color: var(--warn); }

.kpi-row { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 10px; margin: 8px 0; }
.quest-prog { margin-top: 8px; font-size: 12px; border-top: 1px dashed var(--line); padding-top: 8px; }
.bar { height: 8px; background: var(--bg2); border-radius: 4px; overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 4px; transition: width 0.4s; }
.kpi-num { font-size: 12px; white-space: nowrap; }


.log-list { flex: 1; overflow-y: auto; line-height: 1.9; font-size: 13px; }
.archive-btn { font-size: 12px; padding: 3px 10px; border-color: var(--accent2); color: #c9b8ff; background: transparent; }
.archive-btn:hover { background: rgba(124, 92, 255, 0.12); }
</style>
