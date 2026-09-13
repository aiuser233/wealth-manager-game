<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, getGame } from '../state';
import { KNOWLEDGE, DEBRIEF_CARDS } from '@fm/content';
import { KNOWLEDGE_ALL } from '@fm/content';
import { contentBundle } from '@fm/content';

type Tab = 'knowledge' | 'debrief' | 'gallery';
const tab = ref<Tab>('knowledge');

const g = computed(() => (gameReady.value ? getGame() : null));
const year = computed(() => Number(g.value?.date.slice(0, 4) ?? 2006));

const ALL_K = KNOWLEDGE_ALL.length >= KNOWLEDGE.length ? KNOWLEDGE_ALL : KNOWLEDGE;
// 知识库全量开放（学习用途）；未来年代的词条仅打标提示，不锁内容
const yearAccessor = computed(() => Number(g.value?.date.slice(0, 4) ?? 2006));
const unlockedKnowledge = computed(() => ALL_K);
const lockedKnowledge = computed(() => ALL_K.filter((k) => k.unlockYear > yearAccessor.value));

const selectedK = ref<string>('');
const selectedD = ref<string>('');
const activeK = computed(() => ALL_K.find((k) => k.id === selectedK.value));
const activeD = computed(() => DEBRIEF_CARDS.find((d) => d.id === selectedD.value));

/** 已触发事件的复盘卡（历史复盘室） */
const triggeredDebriefs = computed(() => {
  const fired = new Set(getGame()?.sim.firedEvents.map((f) => f.ev.id) ?? []);
  return DEBRIEF_CARDS.filter((d) => !d.eventRef || fired.has(d.eventRef) || d.year < year.value);
});

/** 复盘室日历视图：全部 30 卡按年代排时间线，未解锁卡灰态并显示解锁条件 */
const calendarDebriefs = computed(() => {
  const fired = new Set(getGame()?.sim.firedEvents.map((f) => f.ev.id) ?? []);
  return DEBRIEF_CARDS.map((d) => {
    const unlocked = !d.eventRef || fired.has(d.eventRef) || d.year < year.value;
    const ev = contentBundle.events.find((e) => e.id === d.eventRef);
    return {
      id: d.id, year: d.year, title: d.title, lesson: d.lesson,
      unlocked,
      unlockHint: unlocked ? '' : ev ? `亲历「${ev.title}」（${ev.date}）后解锁` : '随剧情推进解锁',
    };
  }).sort((a, b) => a.year - b.year);
});
const calendarMode = ref(false);

/** 日历视图按年代分组（1990s / 2000s / 2010s / 2020s） */
const calendarGroups = computed(() => {
  const groups: Array<{ decade: string; items: typeof calendarDebriefs.value }> = [];
  for (const d of calendarDebriefs.value) {
    const decade = `${Math.floor(d.year / 10) * 10}s`;
    const last = groups[groups.length - 1];
    if (last && last.decade === decade) last.items.push(d);
    else groups.push({ decade, items: [d] });
  }
  return groups;
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
const calcTab = ref<'compound' | 'annuity' | 'mortgage' | 'retire' | 'irr' | 'sharp' | 'duration' | 'fx'>('compound');
const c1 = ref({ principal: 100000, rate: 6, years: 10 });
const c2 = ref({ monthly: 2000, rate: 6, years: 20 });
const c3 = ref({ loan: 1000000, rate: 4.2, years: 30 });
const c4 = ref({ age: 30, retireAge: 60, monthlyExpense: 8000, saved: 200000, rate: 5, infl: 2.5 });
const c5 = ref({ cashflows: [-100000, 20000, 25000, 30000, 30000, 35000] });
const c6 = ref({ ret: 12, rf: 2, vol: 18 });
const c7 = ref({ dur: 4.5, rateChg: 0.5, notional: 1000000 });
const c8 = ref({ amount: 10000, from: 7.2, to: 6.9 });

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
/** IRR：牛顿法解 NPV=0 */
function irrOf(cfs: number[]): number {
  const npv = (r: number) => cfs.reduce((s, cf, i) => s + cf / Math.pow(1 + r, i), 0);
  let lo = -0.99, hi = 10;
  // 二分法：NPV 在 (−0.99, 10) 内单调
  if (npv(lo) * npv(hi) > 0) return NaN;
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}
/** 夏普比率 */
function sharpe(ret: number, rf: number, vol: number): number {
  return vol <= 0 ? NaN : (ret - rf) / vol;
}
/** 久期近似价格变动 */
function durPriceChange(dur: number, rateChgPct: number, notional: number): { pct: number; abs: number } {
  const pct = -dur * (rateChgPct / 100);
  return { pct: pct * 100, abs: notional * pct };
}
/** 汇率换算 */
function fxConvert(amount: number, from: number, to: number): number {
  return from <= 0 ? 0 : amount * (from / to);
}
/** 净现值展示 */
function npvOf(cfs: number[], r: number): number {
  return cfs.reduce((s, cf, i) => s + cf / Math.pow(1 + r, i), 0);
}
</script>

<template>
  <div class="wrap">
    <div class="tabs">
      <button :class="{ active: tab === 'knowledge' }" @click="tab = 'knowledge'">知识库（{{ ALL_K.length }}）</button>
      <button :class="{ active: tab === 'debrief' }" @click="tab = 'debrief'">历史复盘室（{{ triggeredDebriefs.length }}）</button>
      <button :class="{ active: tab === 'gallery' }" @click="tab = 'gallery'">原型图鉴（{{ galleryItems.length }}）</button>
    </div>

    <!-- 知识库 -->
    <div v-if="tab === 'knowledge'" class="cols">
      <div class="panel list">
        <p class="dim note">全部词条开放查阅（学习用途）；与剧情/复盘卡关联的内容仍随游戏进程解锁。</p>
        <p v-for="k in ALL_K" :key="k.id" class="k-item" :class="{ active: selectedK === k.id }" @click="selectedK = k.id">
          <span class="tag">{{ catNames[k.category] }}</span>{{ k.title }}
          <span v-if="k.unlockYear > yearAccessor" class="dim future-tag">{{ k.unlockYear }} 年词条</span>
        </p>
      </div>
      <div v-if="activeK" class="panel detail">
        <h3>{{ activeK.title }} <span class="dim">（{{ activeK.unlockYear }} 年起）</span></h3>
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
        <div class="cal-head">
          <b>复盘日历（{{ triggeredDebriefs.length }}/{{ DEBRIEF_CARDS.length }} 已解锁）</b>
          <button class="mini" @click="calendarMode = !calendarMode">{{ calendarMode ? '列表视图' : '日历视图' }}</button>
        </div>
        <template v-if="calendarMode">
          <div v-for="grp in calendarGroups" :key="grp.decade" class="cal-group">
            <p class="cal-decade">{{ grp.decade }}</p>
            <p
              v-for="d in grp.items" :key="d.id"
              class="k-item cal-item"
              :class="{ active: selectedD === d.id, locked: !d.unlocked }"
              :title="d.unlockHint"
              @click="d.unlocked && (selectedD = d.id)"
            >
              <span class="tag">{{ d.year }}</span>{{ d.unlocked ? d.title : `？？？ ${d.unlockHint}` }}
            </p>
          </div>
        </template>
        <template v-else>
          <p v-for="d in triggeredDebriefs" :key="d.id" class="k-item" :class="{ active: selectedD === d.id }" @click="selectedD = d.id">
            <span class="tag">{{ d.year }}</span>{{ d.title }}
          </p>
        </template>
        <p class="dim note">复盘卡在大行情事件触发后解锁；窗口外的经典周期（互联网泡沫、黑色星期一）作为历史课堂常驻。日历视图可预览全部卡片的解锁条件。</p>
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
            <button :class="{ active: calcTab === 'irr' }" @click="calcTab = 'irr'">IRR</button>
            <button :class="{ active: calcTab === 'sharp' }" @click="calcTab = 'sharp'">夏普</button>
            <button :class="{ active: calcTab === 'duration' }" @click="calcTab = 'duration'">久期</button>
            <button :class="{ active: calcTab === 'fx' }" @click="calcTab = 'fx'">汇率</button>
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
          <div v-if="calcTab === 'irr'" class="calc-body">
            <p class="dim">现金流序列（首笔为投资，负数）：{{ c5.cashflows.join(', ') }}</p>
            <label v-for="(v, i) in c5.cashflows" :key="i">第 {{ i }} 期 <input type="number" v-model.number="c5.cashflows[i]" /></label>
            <p class="result">IRR ≈ <b>{{ (irrOf(c5.cashflows) * 100).toFixed(2) }}%</b> / 年<br />折现 5% 的 NPV ≈ <b>{{ npvOf(c5.cashflows, 0.05).toFixed(0) }}</b> 元</p>
          </div>
          <div v-if="calcTab === 'sharp'" class="calc-body">
            <label>年化收益% <input type="number" v-model.number="c6.ret" step="0.5" /></label>
            <label>无风险% <input type="number" v-model.number="c6.rf" step="0.1" /></label>
            <label>年化波动% <input type="number" v-model.number="c6.vol" step="1" /></label>
            <p class="result">夏普比率 ≈ <b>{{ sharpe(c6.ret, c6.rf, c6.vol).toFixed(2) }}</b><br /><span class="dim">>1 优秀 · 0.5-1 尚可 · <0 收益未补偿波动</span></p>
          </div>
          <div v-if="calcTab === 'duration'" class="calc-body">
            <label>组合久期 <input type="number" v-model.number="c7.dur" step="0.5" /></label>
            <label>利率变动 % <input type="number" v-model.number="c7.rateChg" step="0.1" /></label>
            <label>本金 <input type="number" v-model.number="c7.notional" step="100000" /></label>
            <p class="result">净值变动 ≈ <b :class="durPriceChange(c7.dur, c7.rateChg, c7.notional).pct > 0 ? 'up' : ''">{{ durPriceChange(c7.dur, c7.rateChg, c7.notional).pct.toFixed(2) }}%</b><br />盈亏 ≈ <b>{{ durPriceChange(c7.dur, c7.rateChg, c7.notional).abs.toFixed(0) }}</b> 元<br /><span class="dim">利率与债券价格反向；久期是利率敏感度的刻度</span></p>
          </div>
          <div v-if="calcTab === 'fx'" class="calc-body">
            <label>金额（外币） <input type="number" v-model.number="c8.amount" step="1000" /></label>
            <label>现汇率（1 外币=? 本币） <input type="number" v-model.number="c8.from" step="0.01" /></label>
            <label>目标汇率 <input type="number" v-model.number="c8.to" step="0.01" /></label>
            <p class="result">按目标汇率折算 ≈ <b>{{ fxConvert(c8.amount, c8.from, c8.to).toFixed(0) }}</b> 外币<br />本币成本差 ≈ <b>{{ (c8.amount * (c8.from - c8.to)).toFixed(0) }}</b> 元<br /><span class="dim">刚性支出换汇宜分批，不赌单点</span></p>
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

.cal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.cal-head .mini { padding: 2px 10px; font-size: 12px; }
.cal-group { margin-bottom: 8px; }
.cal-decade { color: var(--accent); font-size: 12px; font-weight: 700; margin: 6px 0 2px; }
.cal-item.locked { opacity: 0.5; font-size: 12px; }
.future-tag { font-size: 11px; margin-left: 4px; opacity: 0.8; }

.calc-box { background: var(--bg2); border-radius: 8px; padding: 10px 12px; }
.calc-tabs { display: flex; gap: 4px; margin: 8px 0; }
.calc-tabs button { padding: 3px 10px; font-size: 12px; }
.calc-tabs button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.calc-body { display: flex; flex-direction: column; gap: 6px; }
.calc-body label { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-dim); }
.calc-body input { width: 120px; }
.result { font-size: 13px; line-height: 1.8; }
</style>
