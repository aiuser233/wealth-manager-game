<script setup lang="ts">
import { computed, ref } from 'vue';
import type { MarketSnapshot } from '@fm/core';
import { contentBundle } from '@fm/content';
import { gameReady, getGame, GAME_START_DATE } from '../state';

const g = computed(() => (gameReady.value ? getGame() : null));
const history = computed<MarketSnapshot[]>(() => g.value?.snapHistory ?? []);
const selected = ref('idx_main');
type RangeId = '1m' | '3m' | '1y' | '3y' | 'all';
const range = ref<RangeId>('1y');
const ranges: Array<{ id: RangeId; name: string }> = [{ id: '1m', name: '1月' }, { id: '3m', name: '3月' }, { id: '1y', name: '1年' }, { id: '3y', name: '3年' }, { id: 'all', name: '全部' }];
const indexSeries = [['idx_main', 'A 股主板综指'], ['idx_300', '玄商 300'], ['idx_500', '玄证 500'], ['idx_growth', '玄创板'], ['idx_hk', '恒生（架空）'], ['idx_us', '纳指（架空）']] as const;
const familyNames: Record<string, string> = { financial_realestate: '金融地产', cyclical: '周期资源', consumer: '消费', pharma: '医药', tech: '科技成长', utility: '稳定公用' };
const groups = computed(() => [
  { name: '宽基指数', items: indexSeries.map(([id, name]) => ({ id, name })) },
  ...Object.entries(familyNames).map(([family, name]) => ({ name, items: contentBundle.industries.filter((item) => item.family === family).map((item) => ({ id: item.id, name: item.name.replace(/指数$/, '') })) })),
]);
const nameMap = computed(() => Object.fromEntries(groups.value.flatMap((group) => group.items.map((item) => [item.id, item.name]))));
const rangeDays = computed(() => ({ '1m': 22, '3m': 66, '1y': 250, '3y': 750, all: Infinity })[range.value]);
function valueOf(snap: MarketSnapshot, id: string) { return id.startsWith('idx_') ? snap.indices[id] : snap.industries[id]; }
const closes = computed(() => history.value.slice(-rangeDays.value).map((snap) => ({ date: snap.date, v: valueOf(snap, selected.value) })).filter((point): point is { date: string; v: number } => Number.isFinite(point.v)));

const W = 1000, H = 430, LEFT = 16, RIGHT = 76, TOP = 20, BOTTOM = 42;
const chart = computed(() => {
  const points = closes.value;
  if (points.length < 2) return null;
  const values = points.map((point) => point.v), rawMin = Math.min(...values), rawMax = Math.max(...values);
  const span = rawMax - rawMin || Math.abs(rawMax) * .02 || 1, lo = rawMin - span * .08, hi = rawMax + span * .08;
  const iw = W - LEFT - RIGHT, ih = H - TOP - BOTTOM;
  const x = (i: number) => LEFT + (i / (points.length - 1)) * iw;
  const y = (v: number) => TOP + (1 - (v - lo) / (hi - lo)) * ih;
  const line = points.map((point, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(point.v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${TOP + ih} L${LEFT},${TOP + ih} Z`;
  const grid = Array.from({ length: 5 }, (_, i) => { const v = lo + (hi - lo) * i / 4; return { y: y(v), label: format(v) }; });
  const first = points[0], last = points[points.length - 1], change = (last.v / first.v - 1) * 100;
  const startIndex = points.findIndex((point) => point.date >= GAME_START_DATE);
  return { line, area, grid, first, last, change, high: rawMax, low: rawMin, careerX: startIndex > 0 ? x(startIndex) : null };
});
const direction = computed(() => (chart.value?.change ?? 0) >= 0 ? 'up' : 'down');
function format(v: number) { if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)}万`; if (Math.abs(v) >= 1000) return v.toFixed(0); if (Math.abs(v) >= 10) return v.toFixed(1); return v.toFixed(2); }
</script>

<template>
  <section class="history-panel">
    <div class="chart-head">
      <div class="series-control"><label for="market-series">查看标的</label><select id="market-series" v-model="selected"><optgroup v-for="group in groups" :key="group.name" :label="group.name"><option v-for="item in group.items" :key="item.id" :value="item.id">{{ item.name }}</option></optgroup></select></div>
      <div class="range-control"><button v-for="item in ranges" :key="item.id" :class="{ active: range === item.id }" @click="range = item.id">{{ item.name }}</button></div>
    </div>
    <div v-if="chart" class="quote-summary">
      <div class="headline"><span>{{ nameMap[selected] }}</span><b>{{ format(chart.last.v) }}</b><em :class="direction">{{ chart.change >= 0 ? '+' : '' }}{{ chart.change.toFixed(2) }}%</em></div>
      <div class="stat"><span>区间高点</span><b>{{ format(chart.high) }}</b></div><div class="stat"><span>区间低点</span><b>{{ format(chart.low) }}</b></div><div class="stat dates"><span>数据区间</span><b>{{ chart.first.date }} — {{ chart.last.date }}</b></div>
    </div>
    <div v-if="chart" class="canvas">
      <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMid meet" class="chart" role="img" :aria-label="`${nameMap[selected]}历史走势图`">
        <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".22"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
        <g v-for="(line, i) in chart.grid" :key="i"><line :x1="LEFT" :y1="line.y" :x2="W - RIGHT" :y2="line.y" class="grid"/><text :x="W - RIGHT + 10" :y="line.y + 4" class="tick">{{ line.label }}</text></g>
        <g v-if="chart.careerX !== null"><rect :x="LEFT" :y="TOP" :width="Math.max(0, chart.careerX - LEFT)" :height="H - TOP - BOTTOM" class="pre-career"/><line :x1="chart.careerX" :x2="chart.careerX" :y1="TOP" :y2="H - BOTTOM" class="career-line"/><text :x="chart.careerX + 8" :y="TOP + 16" class="career-label">2006 入职</text><text :x="LEFT + 8" :y="TOP + 16" class="pre-label">入职前历史行情</text></g>
        <path :d="chart.area" :class="['area', direction]"/><path :d="chart.line" :class="['price-line', direction]"/><text :x="LEFT" :y="H - 14" class="date-label">{{ chart.first.date }}</text><text :x="W - RIGHT" :y="H - 14" text-anchor="end" class="date-label">{{ chart.last.date }}</text>
      </svg>
    </div>
    <div v-else class="empty">行情数据积累中</div>
    <footer><span>数据自 2000-01-03 起连续模拟</span><span>红涨绿跌 · 收盘价走势 · 不构成投资建议</span></footer>
  </section>
</template>

<style scoped>
.history-panel{height:100%;min-height:0;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(59,76,111,.75);border-radius:11px;background:linear-gradient(145deg,rgba(27,38,62,.98),rgba(17,25,42,.98))}.chart-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding:14px 16px 11px;border-bottom:1px solid rgba(55,71,103,.65)}.series-control{display:flex;align-items:center;gap:9px}.series-control label{color:var(--text-dim);font-size:11px}.series-control select{min-width:190px;font-weight:600}.range-control{display:flex;gap:3px}.range-control button{min-height:29px;padding:3px 11px;border-color:transparent;background:transparent;color:var(--text-dim);font-size:11px}.range-control button.active{border-color:rgba(79,140,255,.4);background:rgba(79,140,255,.14);color:#a9c8ff}.quote-summary{display:flex;align-items:center;gap:28px;padding:11px 16px;background:rgba(7,13,25,.18)}.headline{display:flex;align-items:baseline;gap:10px;min-width:290px}.headline span{color:var(--text-dim);font-size:12px}.headline b{font-size:24px;font-variant-numeric:tabular-nums}.headline em{font-style:normal;font-weight:650}.stat{display:grid;gap:2px}.stat span{color:var(--text-dim);font-size:10px}.stat b{font-size:12px;font-variant-numeric:tabular-nums}.dates{margin-left:auto;text-align:right}.canvas{min-height:0;flex:1;display:grid;place-items:center;padding:6px 12px 0}.chart{display:block;width:100%;height:100%;min-height:240px}.grid{stroke:rgba(77,92,122,.35);stroke-width:1;stroke-dasharray:3 5}.tick,.date-label{fill:#71809b;font-size:11px}.area{fill:url(#chartFill)}.area.up,.price-line.up{color:var(--up)}.area.down,.price-line.down{color:var(--down)}.price-line{fill:none;stroke:currentColor;stroke-width:2;vector-effect:non-scaling-stroke}.pre-career{fill:rgba(104,125,161,.055)}.career-line{stroke:#64799e;stroke-width:1;stroke-dasharray:4 5}.career-label,.pre-label{fill:#8294b2;font-size:10px}.pre-label{fill:#60708c}.up{color:var(--up)}.down{color:var(--down)}.empty{flex:1;display:grid;place-items:center;color:var(--text-dim)}footer{display:flex;justify-content:space-between;padding:8px 16px 10px;color:#667692;font-size:10px}
@media(max-width:767px){.history-panel{height:610px}.chart-head,.quote-summary{align-items:flex-start;flex-direction:column}.range-control{width:100%;overflow-x:auto}.quote-summary{gap:8px}.headline{min-width:0}.dates{margin-left:0;text-align:left}.stat{display:none}.canvas{padding:0}footer{gap:8px;flex-direction:column}}
</style>
