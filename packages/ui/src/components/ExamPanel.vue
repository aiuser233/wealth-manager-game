<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, getGame, availableExams, myCerts, startExam, submitExam, quitExam, answerSingle, toggleMulti, wrongBook, dailyQuestion, finishDaily } from '../state';
import { EXAM_DEFS } from '@fm/core';

const g = computed(() => (gameReady.value ? getGame() : null));
const certs = computed(() => myCerts());

const paper = computed(() => state.examPaper);
const q = computed(() => paper.value?.questions[state.examIdx]);
const total = computed(() => paper.value?.questions.length ?? 0);
const answeredCount = computed(() =>
  state.examAnswers.filter((a) => (Array.isArray(a) ? a.length > 0 : a >= 0)).length,
);

/** 错题本与每日一题 */
const wrongList = ref(wrongBook());
const showWrong = ref(false);
const daily = computed(() => dailyQuestion());
const dailyAnswer = ref<number | null>(null);
const dailyFeedback = ref('');

function refreshWrong() {
  wrongList.value = wrongBook();
}

function submitDaily() {
  if (daily.value && dailyAnswer.value !== null) {
    dailyFeedback.value = finishDaily(dailyAnswer.value === daily.value.q.answer);
  }
}

function clearWrong() {
  localStorage.removeItem('fm_wrong_book');
  refreshWrong();
}

function prevQ() { if (state.examIdx > 0) state.examIdx -= 1; }
function nextQ() { if (state.examIdx < total.value - 1) state.examIdx += 1; }

function mmss(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function jump(i: number) { state.examIdx = i; }
</script>

<template>
  <div v-if="g" class="wrap">
    <!-- 考试列表 -->
    <div v-if="state.examScreen === 'list'" class="panel list full">
      <div class="head"><h3>考试中心</h3><span class="dim">每年 3 / 6 / 9 / 12 月开考 · 报名费从工资扣除</span></div>
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
        <button @click="showWrong = !showWrong; refreshWrong()">错题本（{{ wrongList.length }}）</button>
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
        <div v-for="e in EXAM_DEFS" :key="e.id" class="exam-card" :class="{ locked: !availableExams().some((a) => a.id === e.id) }">
          <div class="info">
            <b>{{ e.name }}</b>
            <p class="dim">{{ e.desc }}</p>
            <p class="meta dim">及格 {{ Math.round(e.pass_mark * 100) }} 分 · {{ e.question_count[0] }}–{{ e.question_count[1] }} 题 · 限时 {{ Math.round(e.time_limit_sec / 60) }} 分钟</p>
          </div>
          <div class="op">
            <span v-if="certs.includes(e.name)" class="gold">已通过 ✓</span>
            <button v-else-if="availableExams().some((a) => a.id === e.id)" class="primary" @click="startExam(e.id)">进入考场</button>
            <span v-else class="dim">{{ e.unlock_year }} 年解锁</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 答题界面（模拟机考） -->
    <div v-else-if="state.examScreen === 'taking' && paper" class="panel taking full">
      <div class="exam-head">
        <b>{{ EXAM_DEFS.find((e) => e.id === paper.examId)?.name }}</b>
        <span class="timer" :class="{ urgent: state.examSecondsLeft < 60 }">{{ mmss(state.examSecondsLeft) }}</span>
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
            }"
            @click="q!.type === 'multiple' ? toggleMulti(state.examIdx, oi) : answerSingle(state.examIdx, oi)"
          >{{ String.fromCharCode(65 + oi) }}. {{ opt }}</button>
        </div>
      </div>
      <div class="q-foot">
        <button :disabled="state.examIdx === 0" @click="prevQ">上一题</button>
        <div class="dots">
          <button
            v-for="(a, i) in state.examAnswers" :key="i"
            class="dot" :class="{ done: Array.isArray(a) ? a.length > 0 : a >= 0, cur: i === state.examIdx }"
            @click="jump(i)"
          >{{ i + 1 }}</button>
        </div>
        <button v-if="state.examIdx < total - 1" class="primary" @click="nextQ">下一题</button>
        <button v-else class="warn" @click="submitExam">交卷（已答 {{ answeredCount }}/{{ total }}）</button>
      </div>
    </div>

    <!-- 成绩页 -->
    <div v-else-if="state.examScreen === 'result' && state.examResult" class="panel result full">
      <h3>考试结果</h3>
      <p class="score" :class="state.examResult.passed ? 'gold' : 'dim'">
        {{ state.examResult.scorePct.toFixed(1) }} 分
      </p>
      <p class="verdict" :class="state.examResult.passed ? 'gold' : 'dim'">
        {{ state.examResult.passed ? '恭喜通过！证书已入库，专业力 +5。' : '很遗憾，未通过。复盘错题，下季度再战。（陈曼：年轻人，急什么）' }}
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
      <button class="primary" @click="quitExam">返回考试中心</button>
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
.tools { margin-bottom: 10px; }
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
