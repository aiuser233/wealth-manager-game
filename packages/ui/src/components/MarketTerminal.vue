<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { state, gameReady, getGame, cal, markViewed, fmtPct, pctClass, snapAt } from '../state';
import { MarketSim } from '@fm/core';
import KLineChart from './KLineChart.vue';

const g = computed(() => (gameReady.value ? getGame() : null));

const scopes = [
  { id: 'day', label: '当日' },
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
  { id: 'since_view', label: '距上次查看' },
] as const;

onMounted(() => markViewed());

/** 计算某口径相对基准的涨跌：基准点 = 缓存里能找到的最早对应快照 */
function changeOf(key: 'indices' | 'industries' | 'factors', id: string, scope: string): number | undefined {
  const cur = g.value?.lastSnap;
  if (!cur) return undefined;
  const base = scope === 'since_view'
    ? state.baseSnap.since_view
    : scope === 'day'
      ? findPrevCursorSnap(1)
      : scope === 'week'
        ? findPrevCursorSnap(5)
        : findPrevCursorSnap(21);
  if (!base || base.date === cur.date) return undefined;
  const a = base[key]?.[id];
  const b = cur[key]?.[id];
  if (a === undefined || b === undefined) return undefined;
  return (b / a - 1) * 100;
}

/** 在快照缓存中找 cursor- n 对应的快照 */
function findPrevCursorSnap(n: number) {
  const cursor = g.value!.sim.cursor;
  for (let i = n; i < n + 10; i++) {
    const s = snapAt(cursor - i);
    if (s) return s;
  }
  return null;
}

const indexNames: Record<string, string> = {
  idx_main: 'A 股主板综指',
  idx_300: '玄商 300',
  idx_500: '玄证 500',
  idx_growth: '玄创板',
  idx_hk: '恒生（架空）',
  idx_us: '纳指（架空）',
};

const factorDisplay = computed(() => {
  const s = g.value?.lastSnap;
  if (!s) return [];
  const defs: Array<{ id: string; name: string; fmt: (v: number) => string }> = [
    { id: 'rate10y', name: '10Y 国债', fmt: (v) => (v * 100).toFixed(2) + '%' },
    { id: 'lpr_5y', name: '5Y LPR', fmt: (v) => (v * 100).toFixed(2) + '%' },
    { id: 'fed_rate', name: '美联储利率', fmt: (v) => (v * 100).toFixed(2) + '%' },
    { id: 'us10y', name: '美债 10Y', fmt: (v) => (v * 100).toFixed(2) + '%' },
    { id: 'fx_cny', name: '人民币汇率', fmt: (v) => v.toFixed(3) },
    { id: 'usd_idx', name: '美元指数', fmt: (v) => v.toFixed(1) },
    { id: 'gold', name: '黄金', fmt: (v) => v.toFixed(0) },
    { id: 'oil', name: '原油', fmt: (v) => v.toFixed(1) },
    { id: 'vix', name: 'VIX', fmt: (v) => v.toFixed(1) },
    { id: 'housing', name: '房价指数', fmt: (v) => v.toFixed(0) },
  ];
  return defs.map((d) => ({ ...d, value: s.factors[d.id] }));
});

const familyNames: Record<string, string> = {
  financial_realestate: '金融地产',
  cyclical: '周期资源',
  consumer: '消费',
  pharma: '医药',
  tech: '科技成长',
  utility: '稳定公用',
};
</script>

<template>
  <div v-if="g" class="wrap">
    <div class="bar">
      <div class="scopes">
        <button v-for="s in scopes" :key="s.id" :class="{ active: state.quoteScope === s.id }" @click="state.quoteScope = s.id">
          {{ s.label }}
        </button>
      </div>
      <span class="dim">数据日：{{ g.lastSnap?.date ?? '--' }} · 行情为架空模拟</span>
    </div>

    <!-- K 线走势图（宽基/行业，近 60/120 日） -->
    <KLineChart />

    <div class="cols">
      <!-- 宽基指数 -->
      <section class="panel">
        <h3>指数</h3>
        <table>
          <thead><tr><th>名称</th><th>点位</th><th>{{ scopes.find((s) => s.id === state.quoteScope)!.label }}</th></tr></thead>
          <tbody>
            <tr v-for="(v, id) in g.lastSnap?.indices" :key="id">
              <td>{{ indexNames[id] ?? id }}</td>
              <td class="num">{{ v.toFixed(0) }}</td>
              <td class="num" :class="pctClass(changeOf('indices', id as string, state.quoteScope))">{{ fmtPct(changeOf('indices', id as string, state.quoteScope)) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 利率与宏观 -->
      <section class="panel">
        <h3>利率与全球</h3>
        <table>
          <thead><tr><th>指标</th><th>数值</th></tr></thead>
          <tbody>
            <tr v-for="f in factorDisplay" :key="f.id">
              <td>{{ f.name }}</td>
              <td class="num">{{ f.value !== undefined ? f.fmt(f.value) : '--' }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <!-- 31 行业热力 -->
    <section class="panel heat">
      <h3>行业涨跌榜（31 行业）</h3>
      <div v-for="(fam, fid) in familyNames" :key="fid" class="fam">
        <div class="fam-name dim">{{ fam }}</div>
        <div class="fam-items">
          <div v-for="ind in contentIndustries(fid)" :key="ind.id" class="cell" :class="cellClass(changeOf('industries', ind.id, state.quoteScope))">
            <span class="cname">{{ shortName(ind.name) }}</span>
            <span class="cpct">{{ fmtPct(changeOf('industries', ind.id, state.quoteScope)) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 新闻流 -->
    <section class="panel news">
      <h3>《A 国证券报》新闻流</h3>
      <div class="news-list">
        <p v-for="(n, i) in state.news.slice(0, 40)" :key="i"><span class="dim">{{ n.date }}</span> <b>{{ n.title }}</b> — {{ n.body }}</p>
        <p v-if="state.news.length === 0" class="dim">暂无新闻。</p>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { contentBundle } from '@fm/content';

function shortName(n: string): string {
  return n.replace(/指数$/, '');
}
export default {
  methods: {
    contentIndustries(family: string) {
      return contentBundle.industries.filter((i) => i.family === family);
    },
    cellClass(v: number | undefined) {
      if (v === undefined || !isFinite(v)) return { flat: true };
      return v >= 0 ? { pos: true } : { neg: true };
    },
  },
};
</script>

<style scoped>
.wrap { height: 100%; display: flex; flex-direction: column; gap: 10px; }
.bar { display: flex; justify-content: space-between; align-items: center; }
.scopes { display: flex; gap: 6px; }
.scopes button.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.cols { display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; }
.panel { padding: 12px 14px; overflow: hidden; }
h3 { font-size: 14px; margin-bottom: 8px; color: var(--text-dim); font-weight: 600; }

table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--bg2); }
th { color: var(--text-dim); font-weight: 500; font-size: 12px; }
.num { font-variant-numeric: tabular-nums; }

.heat { flex: 0 0 auto; }
.fam { margin-bottom: 8px; }
.fam-name { font-size: 12px; margin-bottom: 4px; }
.fam-items { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }
.cell {
  display: flex; justify-content: space-between; align-items: center;
  padding: 4px 8px; border-radius: 4px; font-size: 12px;
  background: var(--bg2); color: var(--text-dim);
}
.cell.pos { background: rgba(255, 90, 90, 0.14); color: var(--up); }
.cell.neg { background: rgba(61, 207, 142, 0.12); color: var(--down); }
.cell.flat { color: var(--text-dim); }
.cname { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cpct { font-variant-numeric: tabular-nums; }

.news { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.news-list { flex: 1; overflow-y: auto; line-height: 1.8; font-size: 13px; }
</style>
