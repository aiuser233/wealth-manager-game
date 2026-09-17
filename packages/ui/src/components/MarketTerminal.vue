<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { contentBundle } from '@fm/content';
import { state, gameReady, getGame, markViewed, fmtPct, pctClass } from '../state';
import KLineChart from './KLineChart.vue';

const g = computed(() => (gameReady.value ? getGame() : null));
const view = ref<'overview' | 'kline'>('overview');
const industryFamily = ref('all');
const scopes = [{ id: 'day', label: '当日' }, { id: 'week', label: '本周' }, { id: 'month', label: '本月' }, { id: 'since_view', label: '距上次' }] as const;
const indexNames: Record<string, string> = { idx_main: 'A 股主板', idx_300: '玄商 300', idx_500: '玄证 500', idx_growth: '玄创板', idx_hk: '恒生（架空）', idx_us: '纳指（架空）' };
const families = [
  { id: 'all', name: '涨跌榜' }, { id: 'financial_realestate', name: '金融地产' },
  { id: 'cyclical', name: '周期资源' }, { id: 'consumer', name: '消费' },
  { id: 'pharma', name: '医药' }, { id: 'tech', name: '科技成长' }, { id: 'utility', name: '稳定公用' },
];
onMounted(() => markViewed());

function changeOf(key: 'indices' | 'industries' | 'factors', id: string, scope = state.quoteScope): number | undefined {
  const cur = g.value?.lastSnap;
  if (!cur) return undefined;
  const hist = g.value?.snapHistory ?? [];
  const nBack = scope === 'since_view' ? 0 : scope === 'day' ? 1 : scope === 'week' ? 5 : 21;
  const base = scope === 'since_view' ? state.baseSnap.since_view : hist.length > nBack ? hist[hist.length - 1 - nBack] : null;
  if (!base || base.date === cur.date) return undefined;
  const a = base[key]?.[id], b = cur[key]?.[id];
  if (a === undefined || b === undefined) return undefined;
  return (b / a - 1) * 100;
}

const factorDisplay = computed(() => {
  const snap = g.value?.lastSnap;
  if (!snap) return [];
  const defs = [
    ['rate10y', '10Y 国债', (v: number) => `${(v * 100).toFixed(2)}%`], ['lpr_5y', '5Y LPR', (v: number) => `${(v * 100).toFixed(2)}%`],
    ['fed_rate', '联邦基金', (v: number) => `${(v * 100).toFixed(2)}%`], ['us10y', '美债 10Y', (v: number) => `${(v * 100).toFixed(2)}%`],
    ['fx_cny', '人民币汇率', (v: number) => v.toFixed(3)], ['usd_idx', '美元指数', (v: number) => v.toFixed(1)],
    ['gold', '黄金', (v: number) => v.toFixed(0)], ['oil', '原油', (v: number) => v.toFixed(1)],
    ['vix', 'VIX', (v: number) => v.toFixed(1)], ['housing', '房价指数', (v: number) => v.toFixed(0)],
  ] as const;
  return defs.map(([id, name, fmt]) => ({ id, name, value: snap.factors[id], fmt }));
});
const industryRows = computed(() => {
  const rows = contentBundle.industries.filter((item) => industryFamily.value === 'all' || item.family === industryFamily.value)
    .map((item) => ({ ...item, shortName: item.name.replace(/指数$/, ''), change: changeOf('industries', item.id), value: g.value?.lastSnap?.industries[item.id] }))
    .sort((a, b) => (b.change ?? -Infinity) - (a.change ?? -Infinity));
  return industryFamily.value !== 'all' || rows.length <= 14 ? rows : [...rows.slice(0, 7), ...rows.slice(-7).reverse()];
});
function sparkPath(id: string): string {
  const pts = (g.value?.snapHistory ?? []).slice(-40).map((snap) => snap.indices[id]).filter((v): v is number => v !== undefined);
  if (pts.length < 2) return '';
  const min = Math.min(...pts), max = Math.max(...pts), span = Math.max(.0001, max - min);
  return pts.map((v, i) => `${i ? 'L' : 'M'}${((i / (pts.length - 1)) * 96).toFixed(1)},${(26 - ((v - min) / span) * 24).toFixed(1)}`).join(' ');
}
</script>

<template>
  <div v-if="g" class="terminal">
    <header class="terminal-head">
      <div><div class="eyebrow">MARKET DESK · {{ g.lastSnap?.date ?? '--' }}</div><h2>行情终端 <span>架空模拟数据</span></h2></div>
      <div class="head-actions">
        <div v-if="view === 'overview'" class="segmented scope-switch"><button v-for="s in scopes" :key="s.id" :class="{ active: state.quoteScope === s.id }" @click="state.quoteScope = s.id">{{ s.label }}</button></div>
        <div class="segmented view-switch"><button :class="{ active: view === 'overview' }" @click="view = 'overview'">总览</button><button :class="{ active: view === 'kline' }" @click="view = 'kline'">历史走势</button></div>
      </div>
    </header>
    <KLineChart v-if="view === 'kline'" class="view-body" />
    <div v-else class="dashboard view-body">
      <div class="primary-column">
        <section class="market-card indices-card">
          <div class="section-title"><div><span class="kicker">主要市场</span><h3>宽基指数</h3></div><span class="section-note">{{ scopes.find((s) => s.id === state.quoteScope)?.label }}涨跌</span></div>
          <div class="index-grid">
            <article v-for="(value, id) in g.lastSnap?.indices" :key="id" class="index-tile">
              <div class="index-top"><span>{{ indexNames[id] ?? id }}</span><b :class="pctClass(changeOf('indices', id as string))">{{ fmtPct(changeOf('indices', id as string)) }}</b></div>
              <div class="index-value">{{ value.toFixed(0) }}</div>
              <svg viewBox="0 0 96 28" preserveAspectRatio="none" aria-hidden="true"><path :d="sparkPath(id as string)" fill="none" :class="['spark-line', pctClass(changeOf('indices', id as string))]" /></svg>
            </article>
          </div>
        </section>
        <section class="market-card industry-card">
          <div class="section-title industry-title"><div><span class="kicker">SECTOR PULSE</span><h3>行业强弱</h3></div><div class="family-filter"><button v-for="item in families" :key="item.id" :class="{ active: industryFamily === item.id }" @click="industryFamily = item.id">{{ item.name }}</button></div></div>
          <div class="industry-list">
            <div v-for="row in industryRows" :key="row.id" class="industry-row">
              <div class="industry-name"><span class="dot" :class="pctClass(row.change)"></span>{{ row.shortName }}</div>
              <div class="industry-bar"><i :class="pctClass(row.change)" :style="{ width: `${Math.min(100, Math.max(4, Math.abs(row.change ?? 0) * 14))}%` }"></i></div>
              <span class="industry-value dim">{{ row.value?.toFixed(0) ?? '--' }}</span><b :class="pctClass(row.change)">{{ fmtPct(row.change) }}</b>
            </div>
          </div>
        </section>
      </div>
      <aside class="side-column">
        <section class="market-card macro-card"><div class="section-title"><div><span class="kicker">MACRO BOARD</span><h3>利率与全球</h3></div></div><div class="macro-grid"><div v-for="f in factorDisplay" :key="f.id" class="macro-item"><span>{{ f.name }}</span><b>{{ f.value !== undefined ? f.fmt(f.value) : '--' }}</b></div></div></section>
        <section class="market-card news-card">
          <div class="section-title"><div><span class="kicker">LIVE FEED</span><h3>市场快讯</h3></div><span class="news-count">{{ state.news.length }}</span></div>
          <div class="news-list"><article v-for="(n, i) in state.news.slice(0, 20)" :key="`${n.date}-${i}`"><time>{{ n.date }}</time><h4>{{ n.title }}</h4><p>{{ n.body }}</p></article><div v-if="state.news.length === 0" class="empty-news"><span>◌</span><p>当前没有新的市场快讯</p></div></div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.terminal{height:100%;min-height:0;display:flex;flex-direction:column;gap:10px}.terminal-head{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:2px 2px 0}.eyebrow,.kicker{color:#6781aa;font-size:10px;font-weight:700;letter-spacing:.14em}h2{margin-top:2px;font-size:20px;line-height:1.2;letter-spacing:.02em}h2 span{margin-left:8px;color:var(--text-dim);font-size:11px;font-weight:400}.head-actions{display:flex;align-items:center;gap:10px}.segmented{display:inline-flex;padding:3px;border:1px solid var(--line);border-radius:8px;background:rgba(8,13,25,.52)}.segmented button{min-height:28px;padding:3px 11px;border:0;border-radius:5px;background:transparent;color:var(--text-dim);font-size:12px}.segmented button.active{background:#2f64be;color:#fff;box-shadow:0 2px 8px rgba(16,45,96,.45)}.view-switch button{font-weight:600}.view-body{flex:1;min-height:0}.dashboard{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.85fr);gap:10px}.primary-column,.side-column{min-height:0;display:grid;gap:10px}.primary-column{grid-template-rows:auto minmax(0,1fr)}.side-column{grid-template-rows:auto minmax(0,1fr)}
.market-card{min-height:0;padding:13px 14px;overflow:hidden;border:1px solid rgba(59,76,111,.72);border-radius:11px;background:linear-gradient(145deg,rgba(27,38,62,.96),rgba(20,29,48,.96));box-shadow:0 8px 24px rgba(2,7,18,.12)}.section-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.section-title h3{margin-top:1px;font-size:14px;font-weight:650}.section-note{color:var(--text-dim);font-size:11px}.index-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.index-tile{position:relative;min-width:0;padding:9px 10px 7px;overflow:hidden;border:1px solid rgba(58,76,112,.56);border-radius:8px;background:rgba(10,17,31,.34)}.index-top{display:flex;justify-content:space-between;gap:6px;font-size:11px;color:var(--text-dim);white-space:nowrap}.index-top b{font-variant-numeric:tabular-nums}.index-value{margin-top:3px;font-size:20px;font-weight:650;font-variant-numeric:tabular-nums}.index-tile svg{position:absolute;right:8px;bottom:7px;width:72px;height:20px;opacity:.72}.spark-line{stroke-width:1.6;vector-effect:non-scaling-stroke}.spark-line.up{stroke:var(--up)}.spark-line.down{stroke:var(--down)}
.industry-card,.news-card{display:flex;flex-direction:column}.industry-title{flex-wrap:wrap}.family-filter{display:flex;max-width:76%;gap:3px;overflow-x:auto;scrollbar-width:none}.family-filter button{min-height:24px;flex:0 0 auto;padding:2px 8px;border-color:transparent;background:transparent;color:var(--text-dim);font-size:11px}.family-filter button.active{border-color:rgba(79,140,255,.4);background:rgba(79,140,255,.13);color:#a9c7ff}.industry-list{min-height:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;column-gap:22px;overflow-y:auto;padding-right:3px}.industry-row{min-width:0;display:grid;grid-template-columns:72px minmax(30px,1fr) 48px 58px;align-items:center;gap:7px;min-height:31px;border-bottom:1px solid rgba(48,63,93,.5);font-size:11px}.industry-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dot{display:inline-block;width:5px;height:5px;margin-right:6px;border-radius:50%;background:var(--text-dim)}.dot.up{background:var(--up)}.dot.down{background:var(--down)}.industry-bar{height:3px;overflow:hidden;border-radius:3px;background:rgba(71,86,116,.35)}.industry-bar i{display:block;height:100%;border-radius:inherit}.industry-bar i.up{background:var(--up)}.industry-bar i.down{background:var(--down)}.industry-value,.industry-row b{text-align:right;font-variant-numeric:tabular-nums}
.macro-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px 14px}.macro-item{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid rgba(48,63,93,.5);font-size:11px;color:var(--text-dim)}.macro-item b{color:var(--text);font-size:12px;font-variant-numeric:tabular-nums}.news-count{display:grid;place-items:center;min-width:22px;height:22px;border-radius:11px;background:rgba(79,140,255,.14);color:#91b8ff;font-size:10px}.news-list{min-height:0;flex:1;overflow-y:auto;padding-right:5px}.news-list article{position:relative;padding:1px 0 11px 15px;margin-bottom:10px;border-left:1px solid #34435f}.news-list article:before{content:'';position:absolute;left:-3px;top:4px;width:5px;height:5px;border-radius:50%;background:#5c8de2}.news-list time{color:#647796;font-size:10px}.news-list h4{margin:2px 0 3px;font-size:12px;line-height:1.35}.news-list p{color:var(--text-dim);font-size:11px;line-height:1.5}.empty-news{height:100%;min-height:90px;display:grid;place-content:center;justify-items:center;color:var(--text-dim);font-size:11px}.empty-news span{font-size:28px;opacity:.5}
@media(max-width:900px){.dashboard{grid-template-columns:minmax(0,1fr) 280px}.index-grid{grid-template-columns:repeat(2,1fr)}.industry-list{grid-template-columns:1fr}}@media(max-width:767px){.terminal{height:auto}.terminal-head{align-items:flex-start;flex-direction:column}.head-actions{width:100%;flex-wrap:wrap}.dashboard{display:block}.primary-column,.side-column{display:block}.market-card{margin-bottom:10px}.index-grid{grid-template-columns:repeat(2,1fr)}.industry-list{max-height:340px}.family-filter{max-width:100%}.news-list{max-height:360px}}
</style>
