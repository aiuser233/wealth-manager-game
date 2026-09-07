<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, getGame } from '../state';
import { KNOWLEDGE, DEBRIEF_CARDS } from '@fm/content';
import { contentBundle } from '@fm/content';

type Tab = 'knowledge' | 'debrief' | 'gallery';
const tab = ref<Tab>('knowledge');

const g = computed(() => (gameReady.value ? getGame() : null));
const year = computed(() => Number(g.value?.date.slice(0, 4) ?? 2006));

const unlockedKnowledge = computed(() => KNOWLEDGE.filter((k) => k.unlockYear <= year.value));
const lockedKnowledge = computed(() => KNOWLEDGE.filter((k) => k.unlockYear > year.value));

const selectedK = ref<string>('');
const selectedD = ref<string>('');
const activeK = computed(() => KNOWLEDGE.find((k) => k.id === selectedK.value));
const activeD = computed(() => DEBRIEF_CARDS.find((d) => d.id === selectedD.value));

/** 已触发事件的复盘卡（历史复盘室） */
const triggeredDebriefs = computed(() => {
  const fired = new Set(getGame()?.sim.firedEvents.map((f) => f.ev.id) ?? []);
  return DEBRIEF_CARDS.filter((d) => !d.eventRef || fired.has(d.eventRef) || d.year < year.value);
});

const catNames: Record<string, string> = {
  basics: '基础', product: '产品', market: '市场', compliance: '合规', planning: '规划', behavior: '行为金融',
};

/** 原型图鉴：已触发事件的现实原型对照 */
const galleryItems = computed(() => {
  const fired = new Set(getGame()?.sim.firedEvents.map((f) => f.ev.id) ?? []);
  return DEBRIEF_CARDS.filter((d) => !d.eventRef || fired.has(d.eventRef)).map((d) => ({
    id: d.id, title: d.title, prototype: d.prototype, prototypeDesc: d.prototypeDesc, year: d.year,
  }));
});

/** 财务计算器 */
const calcTab = ref<'compound' | 'annuity' | 'mortgage' | 'retire'>('compound');
const c1 = ref({ principal: 100000, rate: 6, years: 10 });
const c2 = ref({ monthly: 2000, rate: 6, years: 20 });
const c3 = ref({ loan: 1000000, rate: 4.2, years: 30 });
const c4 = ref({ age: 30, retireAge: 60, monthlyExpense: 8000, saved: 200000, rate: 5, infl: 2.5 });

function compoundFV(p: number, r: number, y: number): number {
  return p * Math.pow(1 + r / 100, y);
}
function annuityFV(m: number, r: number, y: number): number {
  const i = r / 100 / 12;
  const n = y * 12;
  return i === 0 ? m * n : m * ((Math.pow(1 + i, n) - 1) / i);
}
function mortgageMonthly(loan: number, r: number, y: number): { monthly: number; total: number } {
  const i = r / 100 / 12;
  const n = y * 12;
  const monthly = i === 0 ? loan / n : loan * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);
  return { monthly, total: monthly * n };
}
function retireGap(c: typeof c4.value): { need: number; gap: number; saveMonthly: number } {
  const years = Math.max(1, c.retireAge - c.age);
  const infl = c.infl / 100;
  const r = c.rate / 100;
  const expenseAtRetire = c.monthlyExpense * Math.pow(1 + infl, years);
  // 退休后 25 年总需求（现值→终值简化）
  const needPV = expenseAtRetire * 12 * 25 * 0.7;
  const savedFV = c.saved * Math.pow(1 + r, years);
  const gap = Math.max(0, needPV - savedFV);
  const i = r / 12;
  const n = years * 12;
  const saveMonthly = gap > 0 && i > 0 ? gap / ((Math.pow(1 + i, n) - 1) / i) : 0;
  return { need: needPV, gap, saveMonthly };
}
</script>

<template>
  <div class="wrap">
    <div class="tabs">
      <button :class="{ active: tab === 'knowledge' }" @click="tab = 'knowledge'">知识库（{{ KNOWLEDGE.length }}）</button>
      <button :class="{ active: tab === 'debrief' }" @click="tab = 'debrief'">历史复盘室（{{ triggeredDebriefs.length }}）</button>
      <button :class="{ active: tab === 'gallery' }" @click="tab = 'gallery'">原型图鉴（{{ galleryItems.length }}）</button>
    </div>

    <!-- 知识库 -->
    <div v-if="tab === 'knowledge'" class="cols">
      <div class="panel list">
        <p v-for="k in unlockedKnowledge" :key="k.id" class="k-item" :class="{ active: selectedK === k.id }" @click="selectedK = k.id">
          <span class="tag">{{ catNames[k.category] }}</span>{{ k.title }}
        </p>
        <p v-for="k in lockedKnowledge" :key="k.id" class="k-item locked">
          <span class="tag">{{ catNames[k.category] }}</span>{{ k.title }} <span class="dim">（{{ k.unlockYear }} 年解锁）</span>
        </p>
      </div>
      <div v-if="activeK" class="panel detail">
        <h3>{{ activeK.title }}</h3>
        <h4>是什么</h4><p>{{ activeK.what }}</p>
        <h4>为什么重要</h4><p>{{ activeK.why }}</p>
        <h4>怎么用</h4><p>{{ activeK.how }}</p>
        <h4>常见坑</h4><p class="warn-text">{{ activeK.pitfall }}</p>
        <h4>考一考</h4><p class="quiz">{{ activeK.quiz.q }}</p>
        <p class="dim">—— {{ activeK.quiz.a }}</p>
      </div>
      <div v-else class="panel detail dim center">← 选择左侧词条查看五件套详解</div>
    </div>

    <!-- 历史复盘室 -->
    <div v-else-if="tab === 'debrief'" class="cols">
      <div class="panel list">
        <p v-for="d in triggeredDebriefs" :key="d.id" class="k-item" :class="{ active: selectedD === d.id }" @click="selectedD = d.id">
          <span class="tag">{{ d.year }}</span>{{ d.title }}
        </p>
        <p class="dim note">复盘卡在大行情事件触发后解锁；窗口外的经典周期（互联网泡沫、黑色星期一）作为历史课堂常驻。</p>
      </div>
      <div v-if="activeD" class="panel detail">
        <h3>{{ activeD.title }} <span class="dim">({{ activeD.year }})</span></h3>
        <h4>发生了什么</h4><p>{{ activeD.happened }}</p>
        <h4>为什么</h4><p>{{ activeD.cause }}</p>
        <h4>对客户意味着什么</h4><p>{{ activeD.impact }}</p>
        <h4>下一次怎么办</h4><p class="lesson">{{ activeD.lesson }}</p>
      </div>
      <div v-else class="panel detail dim center">← 选择左侧复盘卡</div>
    </div>

    <!-- 原型图鉴 -->
    <div v-else class="cols">
      <div class="panel list">
        <div class="calc-box">
          <h4>财务计算器</h4>
          <div class="calc-tabs">
            <button :class="{ active: calcTab === 'compound' }" @click="calcTab = 'compound'">复利</button>
            <button :class="{ active: calcTab === 'annuity' }" @click="calcTab = 'annuity'">年金定投</button>
            <button :class="{ active: calcTab === 'mortgage' }" @click="calcTab = 'mortgage'">房贷</button>
            <button :class="{ active: calcTab === 'retire' }" @click="calcTab = 'retire'">养老缺口</button>
          </div>
          <div v-if="calcTab === 'compound'" class="calc-body">
            <label>本金 <input type="number" v-model.number="c1.principal" /></label>
            <label>年化% <input type="number" v-model.number="c1.rate" step="0.5" /></label>
            <label>年限 <input type="number" v-model.number="c1.years" /></label>
            <p class="result">终值 ≈ <b>{{ compoundFV(c1.principal, c1.rate, c1.years).toFixed(0) }}</b> 元（72 法则：{{ (72 / Math.max(0.1, c1.rate)).toFixed(1) }} 年翻倍）</p>
          </div>
          <div v-if="calcTab === 'annuity'" class="calc-body">
            <label>月投 <input type="number" v-model.number="c2.monthly" /></label>
            <label>年化% <input type="number" v-model.number="c2.rate" step="0.5" /></label>
            <label>年限 <input type="number" v-model.number="c2.years" /></label>
            <p class="result">期末总额 ≈ <b>{{ annuityFV(c2.monthly, c2.rate, c2.years).toFixed(0) }}</b> 元</p>
          </div>
          <div v-if="calcTab === 'mortgage'" class="calc-body">
            <label>贷款额 <input type="number" v-model.number="c3.loan" step="100000" /></label>
            <label>利率% <input type="number" v-model.number="c3.rate" step="0.1" /></label>
            <label>年限 <input type="number" v-model.number="c3.years" /></label>
            <p class="result">月供 ≈ <b>{{ mortgageMonthly(c3.loan, c3.rate, c3.years).monthly.toFixed(0) }}</b> 元 · 总利息 {{ (mortgageMonthly(c3.loan, c3.rate, c3.years).total - c3.loan).toFixed(0) }} 元</p>
          </div>
          <div v-if="calcTab === 'retire'" class="calc-body">
            <label>现龄 <input type="number" v-model.number="c4.age" /></label>
            <label>退休龄 <input type="number" v-model.number="c4.retireAge" /></label>
            <label>月支出 <input type="number" v-model.number="c4.monthlyExpense" step="1000" /></label>
            <label>已存 <input type="number" v-model.number="c4.saved" step="10000" /></label>
            <p class="result">退休后总需求约 <b>{{ retireGap(c4).need.toFixed(0) }}</b> 元<br />缺口 <b class="up">{{ retireGap(c4).gap.toFixed(0) }}</b> 元<br />需月存 ≈ <b>{{ retireGap(c4).saveMonthly.toFixed(0) }}</b> 元</p>
          </div>
        </div>
      </div>
      <div class="panel detail">
        <h3>原型图鉴</h3>
        <p class="dim note">游戏内的行情均为架空创作；每亲历一次历史事件，解锁对应的现实原型对照。</p>
        <div v-for="item in galleryItems" :key="item.id" class="gallery-item">
          <b>{{ item.title }}</b> <span class="dim">({{ item.year }})</span>
          <p class="proto">原型：{{ item.prototype }}</p>
          <p class="dim">{{ item.prototypeDesc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap { height: 100%; display: flex; flex-direction: column; gap: 10px; }
.tabs { display: flex; gap: 6px; }
.tabs button.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.cols { flex: 1; min-height: 0; display: grid; grid-template-columns: 300px 1fr; gap: 10px; }
.panel { padding: 14px 16px; overflow-y: auto; }
.list { display: flex; flex-direction: column; gap: 2px; }
.k-item { padding: 7px 10px; border-radius: 6px; cursor: pointer; line-height: 1.5; }
.k-item:hover { background: var(--panel2); }
.k-item.active { background: var(--panel2); border: 1px solid var(--accent); }
.k-item.locked { opacity: 0.45; cursor: default; }
.detail h3 { margin-bottom: 8px; }
.detail h4 { color: var(--accent); font-size: 13px; margin: 12px 0 4px; }
.detail p { line-height: 1.7; font-size: 13px; }
.warn-text { color: var(--warn); }
.quiz { color: var(--gold); }
.lesson { color: var(--gold); }
.center { display: flex; align-items: center; justify-content: center; }
.note { font-size: 12px; line-height: 1.7; margin-bottom: 10px; }
.gallery-item { border-bottom: 1px solid var(--bg2); padding: 8px 0; }
.proto { color: var(--gold); font-size: 12px; }

.calc-box { background: var(--bg2); border-radius: 8px; padding: 10px 12px; }
.calc-tabs { display: flex; gap: 4px; margin: 8px 0; }
.calc-tabs button { padding: 3px 10px; font-size: 12px; }
.calc-tabs button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.calc-body { display: flex; flex-direction: column; gap: 6px; }
.calc-body label { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-dim); }
.calc-body input { width: 120px; }
.result { font-size: 13px; line-height: 1.8; }
</style>
