<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, getGame, myCerts, startExam, submitExam, quitExam, answerSingle, toggleMulti, wrongBook, dailyQuestion, finishDaily, weakSpotRadar, cramForExam, cramActive, checkPracticeAnswer, clearPracticeFeedback, lastPracticePaper, startWrongRedo, redoAnswerSingle, redoToggleMulti, redoCheck, redoNext, quitRedo, redoHistory } from '../state';
import { storage } from '../storage';
import { EXAM_DEFS } from '@fm/core';
import { examBankAll } from '@fm/content';
import { passesReviewGate } from '../packs';

const g = computed(() => (gameReady.value ? getGame() : null));
const certs = computed(() => myCerts());
function approvedCount(subject: string) { return examBankAll.filter((q) => q.subject === subject && passesReviewGate(q)).length; }
function formalReady(subject: string, minimum: number) { return approvedCount(subject) >= minimum; }

const paper = computed(() => state.examPaper);
const q = computed(() => paper.value?.questions[state.examIdx]);
const total = computed(() => paper.value?.questions.length ?? 0);
const answeredCount = computed(() =>
  state.examAnswers.filter((a) => (Array.isArray(a) ? a.length > 0 : a >= 0)).length,
);

/** 错题本 / 弱项雷达 / 冲刺 */
const wrongList = ref(wrongBook());
const showWrong = ref(false);
const radar = computed(() => weakSpotRadar());
const daily = computed(() => dailyQuestion());
const dailyAnswer = ref<number | null>(null);
const dailyFeedback = ref('');

/** C1 错题重练 */
const redoMsg = ref('');
const rs = computed(() => state.redoSession);
const redoQ = computed(() => rs.value?.questions[rs.value.idx]);
const redoTotal = computed(() => rs.value?.questions.length ?? 0);
/** C2 考试历史 + 重练历史 */
const history = ref<ReturnType<typeof import('../lms').examHistory>>([]);
const historyOpen = ref(false);
const rehist = ref(redoHistory());

function openHistory() {
  rehist.value = redoHistory();
  import('../lms').then((m) => { history.value = m.examHistory(); historyOpen.value = !historyOpen.value; });
}

function refreshWrong() {
  wrongList.value = wrongBook();
  rehist.value = redoHistory();
}

/** 错题数响应式：押题池版本号变化/页面切换时同步（wrongList ref 初始为 0 的兜底） */
const wrongCount = computed(() => {
  void lastPracticePaper()?.wrongCount; // 建立对最近一套卷的依赖（交卷后错题本必更新）
  return wrongBook().length;
});

function beginRedo() {
  // startWrongRedo 读的是即时 storage；重练计数用响应式 wrongCount，无需预刷新
  redoMsg.value = startWrongRedo();
  refreshWrong();
  setTimeout(() => (redoMsg.value = ''), 3500);
}

function redoPicked(oi: number): boolean {
  const s = rs.value;
  if (!s) return false;
  const a = s.answers[s.idx];
  return Array.isArray(a) ? a.includes(oi) : a === oi;
}
function redoRight(oi: number): boolean {
  const s = rs.value;
  if (!s || !s.checked[s.idx]) return false;
  const qq = s.questions[s.idx];
  return qq.type === 'multiple' ? (qq.answer as number[]).includes(oi) : qq.answer === oi;
}
function redoWrong(oi: number): boolean {
  const s = rs.value;
  if (!s || !s.checked[s.idx] || s.correct[s.idx]) return false;
  const a = s.answers[s.idx];
  return Array.isArray(a) ? a.includes(oi) : a === oi;
}
const redoFeedback = computed(() => {
  const s = rs.value;
  if (!s || !s.checked[s.idx]) return '';
  const qq = s.questions[s.idx];
  return s.correct[s.idx]
    ? `✓ 答对了！解析：${qq.explanation}`
    : `✗ 答错了，正确答案：${formatAnswer(qq)}。解析：${qq.explanation}`;
});
const redoAnswered = computed(() => {
  const s = rs.value;
  if (!s) return false;
  const a = s.answers[s.idx];
  return Array.isArray(a) ? a.length > 0 : a >= 0;
});

function redoJump(i: number) { if (rs.value && !rs.value.finished) rs.value.idx = i; }

function submitDaily() {
  if (daily.value && dailyAnswer.value !== null) {
    dailyFeedback.value = finishDaily(dailyAnswer.value === daily.value.q.answer);
  }
}

function clearWrong() {
  storage.remove('fm_wrong_book');
  refreshWrong();
}

function doCram() {
  dailyFeedback.value = cramForExam();
}

/** 冲刺押题数据源（考前最后做的一套卷） */
const lastPaper = computed(() => lastPracticePaper());

function prevQ() { if (state.examIdx > 0) { clearPracticeFeedback(); state.examIdx -= 1; } }
function nextQ() { if (state.examIdx < total.value - 1) { clearPracticeFeedback(); state.examIdx += 1; } }

function quitExamLocal() {
  clearPracticeFeedback();
  quitExam();
}

function mmss(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function jump(i: number) { state.examIdx = i; }

/** ===== 练习模式辅助 ===== */
const practiceChecked = computed(() => !!state.practiceFeedback && state.practiceFeedback.idx === state.examIdx);
const answeredCurrent = computed(() => {
  const a = state.examAnswers[state.examIdx];
  return Array.isArray(a) ? a.length > 0 : a >= 0;
});

function checkCurrent() {
  checkPracticeAnswer(state.examIdx);
}

/** 练习模式已核对时：正确选项标绿、误选标红 */
function practiceRight(oi: number): boolean {
  const fb = state.practiceFeedback;
  if (!fb || fb.idx !== state.examIdx) return false;
  const qv = paper.value!.questions[fb.idx];
  return qv.type === 'multiple' ? (qv.answer as number[]).includes(oi) : qv.answer === oi;
}
function practiceWrong(oi: number): boolean {
  const fb = state.practiceFeedback;
  if (!fb || fb.idx !== state.examIdx || fb.correct) return false;
  const a = state.examAnswers[fb.idx];
  return Array.isArray(a) ? a.includes(oi) : a === oi;
}
function isPracticeCorrect(i: number): boolean {
  const fb = state.practiceFeedback;
  return !!fb && fb.idx === i && fb.correct;
}

function formatAnswer(qv: { type: string; answer: number | number[] }): string {
  return qv.type === 'multiple'
    ? (qv.answer as number[]).map((x) => String.fromCharCode(65 + x)).join('、')
    : String.fromCharCode(65 + (qv.answer as number));
}
</script>

<template>
  <div v-if="g" class="wrap">
    <!-- 考试列表 -->
    <div v-if="state.examScreen === 'list'" class="panel list full">
      <div class="head"><h3>考试中心</h3><span class="dim">每年 3 / 6 / 9 / 12 月开考 · 报名费从工资扣除</span></div>
      <div class="review-notice">公测说明：正式考只使用人工双审通过的题目；审校完成前请使用模考或练习，不影响学习记录。</div>
      <div class="certs">
        <h4>已持证书（{{ certs.length }}）</h4>
        <p v-if="certs.length === 0" class="dim">还没有证书。证书是晋升硬门槛，加油！</p>
        <p v-for="c in certs" :key="c"><span class="tag gold" style="color:var(--gold)">{{ c }}</span></p>
      </div>

      <!-- 每日一题 -->
      <div v-if="daily" class="daily">
        <h4>每日一题 <span v-if="daily.done" class="gold">今日已完成 ✓</span></h4>
        <template v-if="!daily.done">
          <p class="stem">{{ daily.q.stem }}</p>
          <div class="daily-opts">
            <button v-for="(opt, oi) in daily.q.options" :key="oi" class="opt" :class="{ picked: dailyAnswer === oi }" @click="dailyAnswer = oi">
              {{ String.fromCharCode(65 + oi) }}. {{ opt }}
            </button>
          </div>
          <button class="primary" :disabled="dailyAnswer === null" @click="submitDaily">提交（答对压力 -2）</button>
        </template>
        <p v-if="dailyFeedback" class="gold">{{ dailyFeedback }}</p>
      </div>

      <div class="tools">
        <button @click="showWrong = !showWrong; refreshWrong()">错题本（{{ wrongCount }}）</button>
        <button class="ghost-btn" :disabled="wrongCount === 0" @click="beginRedo" title="从错题本组卷（至多 10 题）重做，即时反馈；全对即从错题本毕业">重练错题</button>
        <button :disabled="state.apUsed >= state.apMax" @click="doCram" title="消耗 1 AP：下一次正式考试会把考前最后做的一套卷中 20% 错题押进考卷（规划书 7.5）">考前冲刺（1 AP）</button>
        <button @click="openHistory" title="历次正式考成绩与重练记录">历史成绩</button>
        <span v-if="cramActive()" class="gold" title="押题 buff：下一次正式考试的卷子里，会带上考前最后做的一套卷中 20% 的错题">✦ 押题 buff 生效中（下次正式考试押中最近一套卷 20% 错题）</span>
        <span v-if="lastPaper" class="dim" title="冲刺押题的数据来源">押题池：{{ lastPaper.label }}（{{ lastPaper.wrongCount }} 道错题）</span>
      </div>

      <p v-if="redoMsg" class="gold">{{ redoMsg }}</p>

      <!-- C1 错题重练界面（覆盖在列表之上） -->
      <div v-if="rs && !rs.finished" class="redo-taking">
        <div class="exam-head">
          <b>错题重练<span class="mode-tag practice">第 {{ rs.idx + 1 }} / {{ redoTotal }} 题</span></b>
          <button class="ghost-btn" @click="quitRedo">放弃</button>
        </div>
        <p class="stem">{{ redoQ!.stem }}</p>
        <div class="opts">
          <button
            v-for="(opt, oi) in redoQ!.options" :key="oi"
            class="opt"
            :class="{
              picked: redoPicked(oi),
              right: redoRight(oi),
              wrong: redoWrong(oi),
            }"
            @click="redoQ!.type === 'multiple' ? redoToggleMulti(rs!.idx, oi) : redoAnswerSingle(rs!.idx, oi)"
          >{{ String.fromCharCode(65 + oi) }}. {{ opt }}</button>
        </div>
        <p v-if="redoFeedback" class="p-feedback" :class="rs.correct[rs.idx] ? 'ok' : 'no'">{{ redoFeedback }}</p>
        <div class="redo-foot">
          <button v-if="!rs.checked[rs.idx]" class="primary" :disabled="!redoAnswered" @click="redoCheck()">核对本题</button>
          <button v-else class="primary" @click="redoNext">{{ rs.idx < redoTotal - 1 ? '下一题' : '收卷' }}</button>
          <span class="dim">做对 {{ rs.correct.filter(Boolean).length }} / {{ redoTotal }}</span>
        </div>
      </div>
      <div v-else-if="rs?.finished" class="redo-done">
        <h4>重练完成 ✓</h4>
        <p>成绩：{{ rs.correct.filter(Boolean).length }} / {{ redoTotal }}。<span v-if="rs.correct.filter(Boolean).length === redoTotal" class="gold">全对！这批题已从错题本毕业。</span><span v-else class="dim">做错的题留在错题本里，下次再战。</span></p>
        <button class="ghost-btn" @click="quitRedo">关闭</button>
      </div>

      <!-- C2 历史成绩 -->
      <div v-if="historyOpen" class="wrong-book">
        <div class="head"><h4>历史成绩（正式考 + 错题重练）</h4></div>
        <div v-for="(h, i) in history" :key="'h' + i" class="wrong-item">
          <p class="stem"><span class="dim">{{ h.at }}</span> {{ h.examName }} — <b :class="h.passed ? 'down' : 'up'">{{ h.scorePct.toFixed(1) }} 分 {{ h.passed ? '通过 ✓' : '未过' }}</b></p>
        </div>
        <div v-for="(r, i) in rehist" :key="'r' + i" class="wrong-item">
          <p class="stem"><span class="dim">{{ r.at }}</span> 错题重练 — {{ r.right }}/{{ r.total }} 题</p>
        </div>
        <p v-if="history.length === 0 && rehist.length === 0" class="dim">还没有考试与重练记录。</p>
      </div>

      <!-- 弱项雷达 -->
      <div v-if="radar.length > 0" class="radar">
        <h4>弱项知识点雷达（错题聚合 TOP10）</h4>
        <div v-for="r in radar" :key="r.tag" class="radar-row">
          <span class="tag">{{ r.tag }}</span>
          <div class="bar"><div class="fill" :style="{ width: Math.min(100, r.count * 20) + '%' }" /></div>
          <span class="dim num">{{ r.count }}</span>
        </div>
      </div>

      <div v-if="showWrong" class="wrong-book">
        <div class="head"><h4>错题回顾</h4><button @click="clearWrong">清空</button></div>
        <div v-for="w in wrongList" :key="w.questionId" class="wrong-item">
          <p class="stem"><span class="dim">{{ w.examName }} · {{ w.wrongAt }}</span></p>
          <p class="stem">{{ w.stem }}</p>
          <p class="down">正确答案：{{ w.correctAnswer }}</p>
          <p class="dim">{{ w.explanation }}</p>
        </div>
        <p v-if="wrongList.length === 0" class="dim">错题本空空如也，继续保持！</p>
      </div>

      <div class="exams">
        <div v-for="e in EXAM_DEFS" :key="e.id" class="exam-card">
          <div class="info">
            <b>{{ e.name }}</b>
            <p class="dim">{{ e.desc }}</p>
            <p class="meta dim">及格 {{ Math.round(e.pass_mark * 100) }} 分 · {{ e.question_count[0] }}–{{ e.question_count[1] }} 题 · 正式考限时 {{ Math.round(e.time_limit_sec / 60) }} 分钟（练习/模考不限时）</p>
          </div>
          <div class="op">
            <span v-if="certs.includes(e.name)" class="gold">已通过 ✓</span>
            <button v-if="!certs.includes(e.name) && formalReady(e.id, e.question_count[0])" class="primary" @click="startExam(e.id, 'formal')">进入考场</button>
            <span v-else-if="!certs.includes(e.name)" class="reviewing">正式题审校中</span>
            <button class="ghost-btn" @click="startExam(e.id, 'mock')" title="不限时模拟：与正式考同卷同判分但不发证书、不耗精力，成绩作为冲刺押题来源">模考</button>
            <button class="ghost-btn" @click="startExam(e.id, 'practice')" title="不限时练习：每题即时判对错并看解析，刷题减压，错题入错题本">练习</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 答题界面（模拟机考） -->
    <div v-else-if="state.examScreen === 'taking' && paper" class="panel taking full">
      <div class="exam-head">
        <b>{{ EXAM_DEFS.find((e) => e.id === paper.examId)?.name }}<span class="mode-tag" :class="state.examMode">{{ state.examMode === 'formal' ? '正式考' : state.examMode === 'mock' ? '模考' : '练习' }}</span></b>
        <span v-if="state.examSecondsLeft >= 0" class="timer" :class="{ urgent: state.examSecondsLeft < 60 }">{{ mmss(state.examSecondsLeft) }}</span>
        <span v-else class="dim">{{ state.examMode === 'mock' ? '模考 · 不限时' : '练习模式 · 不限时' }}</span>
      </div>
      <div class="q-body">
        <p class="q-stem">第 {{ state.examIdx + 1 }} / {{ total }} 题（{{ q!.type === 'single' ? '单选' : q!.type === 'multiple' ? '多选' : '判断' }}）<span class="dim" v-if="q!.type === 'multiple'">（漏选得一半分）</span></p>
        <p class="stem">{{ q!.stem }}</p>
        <div class="opts">
          <button
            v-for="(opt, oi) in q!.options" :key="oi"
            class="opt"
            :class="{
              picked: q!.type === 'multiple' ? (state.examAnswers[state.examIdx] as number[]).includes(oi) : state.examAnswers[state.examIdx] === oi,
              right: practiceRight(oi),
              wrong: practiceWrong(oi),
            }"
            @click="q!.type === 'multiple' ? toggleMulti(state.examIdx, oi) : answerSingle(state.examIdx, oi)"
          >{{ String.fromCharCode(65 + oi) }}. {{ opt }}</button>
        </div>
        <!-- 练习模式即时反馈 -->
        <div v-if="state.practiceFeedback && state.practiceFeedback.idx === state.examIdx" class="p-feedback" :class="state.practiceFeedback.correct ? 'ok' : 'no'">
          <p class="verdict-line">{{ state.practiceFeedback.correct ? '✓ 答对了！' : '✗ 答错了。' }}</p>
          <p class="dim">正确答案：{{ formatAnswer(q!) }}</p>
          <p class="dim expl">{{ q!.explanation }}</p>
        </div>
      </div>
      <div class="q-foot">
        <button :disabled="state.examIdx === 0" @click="prevQ">上一题</button>
        <div class="dots">
          <button
            v-for="(a, i) in state.examAnswers" :key="i"
            class="dot" :class="{ done: Array.isArray(a) ? a.length > 0 : a >= 0, cur: i === state.examIdx, rightDot: isPracticeCorrect(i), wrongDot: state.practiceFeedback?.idx === i && !state.practiceFeedback.correct }"
            @click="jump(i)"
          >{{ i + 1 }}</button>
        </div>
        <!-- 练习模式：先"核对本题"再翻页 -->
        <template v-if="state.examMode === 'practice'">
          <button v-if="!practiceChecked" class="primary" :disabled="!answeredCurrent" @click="checkCurrent">核对本题</button>
          <button v-else-if="state.examIdx < total - 1" class="primary" @click="nextQ">下一题</button>
          <button v-else class="warn" @click="submitExam">完成练习（已答 {{ answeredCount }}/{{ total }}）</button>
        </template>
        <template v-else>
          <button v-if="state.examIdx < total - 1" class="primary" @click="nextQ">下一题</button>
          <button v-else class="warn" @click="submitExam">交卷（已答 {{ answeredCount }}/{{ total }}）</button>
        </template>
      </div>
    </div>

    <!-- 成绩页 -->
    <div v-else-if="state.examScreen === 'result' && state.examResult" class="panel result full">
      <h3>{{ state.examMode === 'formal' ? '考试结果' : state.examMode === 'mock' ? '模考结果' : '练习成绩' }}</h3>
      <p class="score" :class="state.examResult.passed ? 'gold' : 'dim'">
        {{ state.examResult.scorePct.toFixed(1) }} 分
      </p>
      <p class="verdict" :class="state.examResult.passed ? 'gold' : 'dim'">
        {{ state.examMode === 'formal'
          ? (state.examResult.passed ? '恭喜通过！证书已入库，专业力 +5。' : '很遗憾，未通过。复盘错题，下季度再战。（陈曼：年轻人，急什么）')
          : state.examMode === 'mock'
            ? '全真模考完成：不发证书不耗精力，临场经验 +1。正式考遇到原题时，冲刺押题会帮你。'
            : '练习完成：错题已入错题本，专业力 +0.5、压力 -1。考前最后做的一套卷将成为冲刺押题池。' }}
      </p>
      <p class="dim">答对 {{ state.examResult.correctCount }} / {{ state.examResult.totalScore > 0 ? state.examPaper!.questions.length : 0 }} 题</p>
      <div class="review">
        <div v-for="(qq, i) in state.examPaper!.questions" :key="i" class="rev-item">
          <p class="stem"><span class="dim">第 {{ i + 1 }} 题</span> {{ qq.stem }}</p>
          <p :class="state.examResult!.perQuestion[i] === 1 ? 'down' : 'up'">
            {{ state.examResult!.perQuestion[i] === 1 ? '✓' : '✗' }} 正确答案：
            {{ qq.type === 'multiple' ? qq.answer.map((x: number) => String.fromCharCode(65 + x)).join('、') : String.fromCharCode(65 + (qq.answer as number)) }}
          </p>
          <p class="dim expl">{{ qq.explanation }}</p>
        </div>
      </div>
      <button class="primary" @click="quitExamLocal">返回考试中心</button>
    </div>
  </div>
</template>

<style scoped>
.wrap { height: 100%; display: flex; }
.panel { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
h3 { font-size: 15px; }
h4 { font-size: 13px; color: var(--text-dim); margin-bottom: 6px; }

.list { overflow-y: auto; padding: 14px 16px; }
.certs { margin-bottom: 14px; }
.exams { display: flex; flex-direction: column; gap: 8px; }
.daily { background: rgba(240, 180, 41, 0.06); border: 1px dashed var(--gold); border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; }
.daily .stem { font-size: 13px; line-height: 1.7; margin: 6px 0; }
.daily-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 6px 0; }
.daily-opts .opt { padding: 6px 10px; font-size: 12px; text-align: left; }
.daily-opts .opt.picked { border-color: var(--accent); background: rgba(79, 140, 255, 0.15); }
.tools { margin-bottom: 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
/* C1 错题重练 */
.redo-taking { background: var(--bg2); border: 1px solid var(--accent); border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; }
.redo-taking .exam-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 8px; margin-bottom: 10px; }
.redo-foot { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
.redo-done { background: var(--bg2); border: 1px dashed var(--down); border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; line-height: 1.8; }
.radar { background: var(--bg2); border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; }
.radar h4 { font-size: 13px; color: var(--text-dim); margin-bottom: 6px; }
.radar-row { display: grid; grid-template-columns: 150px 1fr 30px; align-items: center; gap: 8px; margin: 4px 0; }
.radar-row .bar { height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; }
.radar-row .fill { height: 100%; background: var(--warn); }
.radar-row .num { font-size: 11px; text-align: right; }
.wrong-book { background: var(--bg2); border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; max-height: 260px; overflow-y: auto; }
.wrong-item { border-bottom: 1px solid var(--bg2); padding: 6px 0; }
.wrong-item .stem { font-size: 12px; line-height: 1.6; }
.exam-card { display: flex; justify-content: space-between; gap: 16px; background: var(--bg2); border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; }
.exam-card.locked { opacity: 0.5; }
.info b { font-size: 14px; }
.info p { margin-top: 4px; font-size: 12px; }
.meta { font-size: 11px; }
.op { display: flex; align-items: center; white-space: nowrap; }

.taking { padding: 14px 16px; }
.exam-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 8px; }
.timer { font-variant-numeric: tabular-nums; font-size: 18px; color: var(--accent); }
.timer.urgent { color: var(--up); animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.4; } }
.q-body { flex: 1; overflow-y: auto; padding: 14px 4px; }
.q-stem { color: var(--text-dim); margin-bottom: 8px; }
.stem { font-size: 15px; line-height: 1.7; margin-bottom: 14px; }
.opts { display: flex; flex-direction: column; gap: 8px; }
.opt { text-align: left; padding: 10px 14px; border-radius: 8px; line-height: 1.5; }
.opt.picked { border-color: var(--accent); background: rgba(79, 140, 255, 0.15); }
/* 练习模式即时反馈配色 */
.opt.right { border-color: var(--down); background: rgba(61, 207, 142, 0.12); }
.opt.wrong { border-color: var(--up); background: rgba(255, 90, 90, 0.12); }
.p-feedback { margin-top: 12px; background: var(--bg2); border-radius: 8px; padding: 10px 14px; line-height: 1.7; }
.p-feedback.ok { border-left: 3px solid var(--down); }
.p-feedback.no { border-left: 3px solid var(--up); }
.verdict-line { font-weight: 600; }
.expl { font-size: 12px; }
.mode-tag { display: inline-block; font-size: 11px; padding: 1px 8px; border-radius: 4px; margin-left: 8px; vertical-align: middle; }
.mode-tag.formal { background: rgba(240, 180, 41, 0.15); color: var(--gold); }
.review-notice { padding: 8px 11px; border: 1px solid rgba(240, 180, 41, .3); border-radius: 7px; background: rgba(240, 180, 41, .07); color: #c8ad68; font-size: 11px; line-height: 1.55; }
.reviewing { padding: 4px 7px; border-radius: 5px; background: rgba(139, 152, 184, .1); color: var(--text-dim); font-size: 10px; }
.mode-tag.mock { background: rgba(79, 140, 255, 0.15); color: var(--accent); }
.mode-tag.practice { background: rgba(61, 207, 142, 0.15); color: var(--down); }
.dot.rightDot { background: var(--down); border-color: var(--down); color: #fff; }
.dot.wrongDot { background: var(--up); border-color: var(--up); color: #fff; }
.ghost-btn { border-color: var(--accent); color: var(--accent); background: transparent; }
.ghost-btn:hover { background: rgba(79, 140, 255, 0.12); }
.q-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 1px solid var(--line); padding-top: 10px; }
.dots { flex: 1; display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
.dot { width: 26px; height: 26px; padding: 0; font-size: 11px; border-radius: 50%; }
.dot.done { background: var(--accent); color: #fff; border-color: var(--accent); }
.dot.cur { outline: 2px solid var(--gold); }

.result { overflow-y: auto; padding: 16px 20px; }
.score { font-size: 42px; text-align: center; margin: 12px 0; }
.verdict { text-align: center; margin-bottom: 8px; }
.review { margin: 14px 0; display: flex; flex-direction: column; gap: 12px; }
.rev-item { background: var(--bg2); border-radius: 8px; padding: 10px 12px; }
.rev-item .stem { font-size: 13px; }
.expl { font-size: 12px; line-height: 1.6; }
</style>
