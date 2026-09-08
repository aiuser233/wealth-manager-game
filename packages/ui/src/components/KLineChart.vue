<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, getGame } from '../state';
import type { MarketSnapshot } from '@fm/core';
import { contentBundle } from '@fm/content';

/**
 * 行情 K 线图（SVG 自绘，无新依赖，规划 P2）：
 * - 数据源：game.snapHistory（最近 120 交易日快照环形缓冲）
 * - 系列：6 个宽基指数 + 31 行业（选择器切换）
 * - 显示：收盘价折线 + 涨跌区间填充；红涨绿跌（A 股习惯）
 */
const g = computed(() => (gameReady.value ? getGame() : null));

const history = computed<MarketSnapshot[]>(() => g.value?.snapHistory ?? []);
const N = computed(() => history.value.length);

const SERIES: Record<string, { name: string; pick: (s: MarketSnapshot) => number }> = {
  idx_main: { name: 'A 股主板综指', pick: (s) => s.indices.idx_main },
  idx_300: { name: '玄商 300', pick: (s) => s.indices.idx_300 },
  idx_500: { name: '玄证 500', pick: (s) => s.indices.idx_500 },
  idx_growth: { name: '玄创板', pick: (s) => s.indices.idx_growth },
  idx_hk: { name: '恒生（架空）', pick: (s) => s.indices.idx_hk },
  idx_us: { name: '纳指（架空）', pick: (s) => s.indices.idx_us },
};
for (const ind of contentBundle.industries) {
  SERIES[ind.id] = { name: ind.name.replace(/指数$/, ''), pick: (s) => s.industries[ind.id] };
}

const FAMILIES: Record<string, string> = {
  financial_realestate: '金融地产',
  cyclical: '周期资源',
  consumer: '消费',
  pharma: '医药',
  tech: '科技成长',
  utility: '稳定公用',
};

const selected = ref('idx_main');
const range = ref<60 | 120>(60);

const seriesList = computed(() => {
  // 分组：宽基 + 按行业族
  const groups: Array<{ group: string; items: Array<{ id: string; name: string }> }> = [
    { group: '宽基指数', items: [] },
  ];
  for (const [id, def] of Object.entries(SERIES)) {
    if (id.startsWith('idx_')) groups[0].items.push({ id, name: def.name });
  }
  for (const [fid, fam] of Object.entries(FAMILIES)) {
    const items = contentBundle.industries.filter((i) => i.family === fid)
      .map((i) => ({ id: i.id, name: SERIES[i.id]?.name ?? i.id }));
    groups.push({ group: fam, items });
  }
  return groups;
});

/** 当前系列的收盘价序列 */
const closes = computed(() => {
  const def = SERIES[selected.value];
  if (!def) return [];
  const src = history.value.slice(-range.value);
  return src.map((s) => ({ date: s.date, v: def.pick(s) })).filter((p) => isFinite(p.v));
});

/** SVG 几何参数 */
const W = 720, H = 260, PAD_L = 8, PAD_R = 56, PAD_T = 12, PAD_B = 26;

const chart = computed(() => {
  const pts = closes.value;
  if (pts.length < 2) return null;
  const min = Math.min(...pts.map((p) => p.v));
  const max = Math.max(...pts.map((p) => p.v));
  const span = max - min || Math.abs(max) * 0.02 || 1;
  const lo = min - span * 0.08, hi = max + span * 0.08;
  const iw = W - PAD_L - PAD_R, ih = H - PAD_T - PAD_B;
  const x = (i: number) => PAD_L + (i / (pts.length - 1)) * iw;
  const y = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * ih;
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const area = `${line}L${x(pts.length - 1).toFixed(1)},${(PAD_T + ih).toFixed(1)}L${PAD_L},${(PAD_T + ih).toFixed(1)}Z`;
  // 网格线（4 档）
  const grid = [0, 1, 2, 3].map((i) => {
    const v = lo + ((hi - lo) * i) / 3;
    return { y: y(v), label: formatTick(v) };
  });
  // 起止日期标签
  const first = pts[0].date.slice(5), last = pts[pts.length - 1].date.slice(5);
  const lastV = pts[pts.length - 1].v, firstV = pts[0].v;
  const changePct = (lastV / firstV - 1) * 100;
  return { line, area, grid, x, y, first, last, changePct, lastV, lo, hi, iw, ih };
});

function formatTick(v: number): string {
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)}万`;
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

const upDown = computed(() => {
  const c = chart.value;
  if (!c) return 'flat';
  return c.changePct >= 0 ? 'up' : 'down';
});
</script>

<template>
  <section class="panel kline">
    <div class="kbar">
      <h3>K 线走势</h3>
      <div class="range-sel">
        <button :class="{ active: range === 60 }" @click="range = 60">60 日</button>
        <button :class="{ active: range === 120 }" @click="range = 120">120 日</button>
      </div>
    </div>
    <div class="series-sel">
      <template v-for="grp in seriesList" :key="grp.group">
        <span class="grp dim">{{ grp.group }}</span>
        <button v-for="it in grp.items" :key="it.id" :class="{ active: selected === it.id }" @click="selected = it.id" :title="it.name">
          {{ it.name }}
        </button>
      </template>
    </div>
    <div v-if="chart && N >= 2" class="chart-wrap">
      <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="chart">
        <g v-for="(gl, i) in chart.grid" :key="i">
          <line :x1="8" :y1="gl.y" :x2="W - PAD_R" :y2="gl.y" class="grid-line" />
          <text :x="W - PAD_R + 6" :y="gl.y + 3" class="tick">{{ gl.label }}</text>
        </g>
        <path :d="chart.area" :class="['area', upDown]" />
        <path :d="chart.line" :class="['line', upDown]" />
      </svg>
      <div class="meta">
        <span class="dim">{{ chart.first }} → {{ chart.last }}</span>
        <span :class="upDown">{{ chart.changePct >= 0 ? '+' : '' }}{{ chart.changePct.toFixed(2) }}%</span>
        <span class="num">{{ formatTick(chart.lastV) }}</span>
      </div>
    </div>
    <p v-else class="dim hint">行情数据积累中（推进时间后显示走势图）。</p>
  </section>
</template>

<style scoped>
.kline { display: flex; flex-direction: column; gap: 8px; }
.kbar { display: flex; justify-content: space-between; align-items: center; }
.kbar h3 { margin: 0; }
.range-sel { display: flex; gap: 4px; }
.range-sel button, .series-sel button {
  min-height: 28px; padding: 2px 10px; font-size: 12px;
  background: var(--bg2); border: 1px solid var(--border); border-radius: 4px; color: var(--text-dim); cursor: pointer;
}
.range-sel button.active, .series-sel button.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.series-sel { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.series-sel .grp { font-size: 11px; margin-right: 2px; }

.chart-wrap { position: relative; }
.chart { width: 100%; height: auto; display: block; }
.grid-line { stroke: var(--bg2); stroke-width: 1; }
.tick { fill: var(--text-dim); font-size: 10px; }
.line { fill: none; stroke-width: 1.8; }
.line.up { stroke: var(--up, #ff5a5a); }
.line.down { stroke: var(--down, #3dcf8e); }
.area { opacity: 0.10; }
.area.up { fill: var(--up, #ff5a5a); }
.area.down { fill: var(--down, #3dcf8e); }

.meta { display: flex; gap: 12px; align-items: baseline; font-size: 12px; }
.meta .num { font-variant-numeric: tabular-nums; font-size: 15px; font-weight: 600; }
.up { color: var(--up, #ff5a5a); }
.down { color: var(--down, #3dcf8e); }
.hint { padding: 20px 0; text-align: center; }
</style>
