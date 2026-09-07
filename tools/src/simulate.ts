/**
 * 无头模拟与校准脚本（M0）
 * 运行：npm run sim
 * 校验内容：
 *  1. 内容包完整性（validateContent）
 *  2. 20 年全量演算性能与统计（指数终值、年化收益、最大回撤、行业分布）
 *  3. 导演事件锚定校验（2007 顶、2015 股灾、2020 疫情底、2022 破净潮、2024 9·24）
 *  4. 游戏循环烟测（1 游戏年行动与成交）
 */
import { GameCalendar, MarketSim, Game, validateContent, Rng } from '@fm/core';
import { contentBundle, eraDrift, eraLevel } from '@fm/content';

const cal = new GameCalendar('2006-01-02', '2025-12-31');

function annualized(start: number, end: number, days: number): number {
  return (Math.pow(end / start, 365.25 / days) - 1) * 100;
}

function maxDrawdown(series: number[]): number {
  let peak = series[0];
  let mdd = 0;
  for (const v of series) {
    peak = Math.max(peak, v);
    mdd = Math.max(mdd, (peak - v) / peak);
  }
  return mdd * 100;
}

console.log('=== 内容校验 ===');
const errs = validateContent(contentBundle);
if (errs.length) {
  console.error('内容错误:', errs);
  process.exit(1);
}
console.log(`因子 ${contentBundle.factors.length}，行业 ${contentBundle.industries.length}，事件 ${contentBundle.events.length}，数据日历 ${contentBundle.releases.length}，产品 ${contentBundle.products.length}，客户 ${contentBundle.clients.length}`);

console.log('\n=== 20 年市场演算（seed=42） ===');
const t0 = performance.now();
const sim = new MarketSim(contentBundle.factors, contentBundle.industries, contentBundle.events, contentBundle.releases, cal, 42, eraDrift, eraLevel);
let eqStart = 0;
let eqEnd = 0;
let eqSeries: number[] = [];
let snapCount = 0;
while (sim.cursor < cal.count) {
  const s = sim.stepToNext();
  if (snapCount === 0) eqStart = s.indices['idx_300'];
  eqEnd = s.indices['idx_300'];
  if (snapCount % 5 === 0) eqSeries.push(s.indices['idx_300']);
  snapCount++;
}
const t1 = performance.now();
console.log(`交易日 ${cal.count}，演算耗时 ${(t1 - t0).toFixed(0)}ms，快照 ${snapCount}`);
console.log(`玄商300: 起点 ${eqStart.toFixed(0)} → 终点 ${eqEnd.toFixed(0)}，年化 ${annualized(eqStart, eqEnd, cal.count * 1.4).toFixed(2)}%，最大回撤 ${maxDrawdown(eqSeries).toFixed(1)}%（约半月采样）`);
console.log(`10Y 国债利率: ${(sim.factorState['rate10y'] * 100).toFixed(2)}%`);
console.log(`美联储利率: ${(sim.factorState['fed_rate'] * 100).toFixed(2)}%`);
console.log(`人民币汇率: ${sim.factorState['fx_cny'].toFixed(2)}`);
console.log(`房价指数: ${sim.factorState['housing'].toFixed(0)}`);
console.log(`导演事件触发 ${sim.firedEvents.length} 条，新闻 ${sim.newsFeed.length} 条，数据公布 ${sim.releaseLog.length} 条`);

// 行业终值排行
console.log('\n=== 20 年行业指数年化（前8 / 后4） ===');
const rows = contentBundle.industries.map((ind) => {
  const final = sim.industryState[ind.id];
  return { name: ind.name, family: ind.family, annual: annualized(ind.start, final, cal.count * 1.4) };
});
rows.sort((a, b) => b.annual - a.annual);
for (const r of rows.slice(0, 8)) console.log(`  ${r.name}: ${r.annual.toFixed(2)}%/年`);
console.log('  ……');
for (const r of rows.slice(-4)) console.log(`  ${r.name}: ${r.annual.toFixed(2)}%/年`);

// 导演事件锚定检查
console.log('\n=== 历史锚定抽查（玄商300 关键时点） ===');
const anchors: Array<[string, string, 'up' | 'down' | 'top' | 'bottom']> = [
  ['2007-10-16', '2007 疯牛顶部', 'top'],
  ['2008-10-28', '2008 危机谷底', 'bottom'],
  ['2009-08-04', '2009 反弹顶', 'top'],
  ['2013-06-20', '2013 钱荒', 'down'],
  ['2015-06-15', '2015 杠杆牛顶', 'top'],
  ['2015-08-24', '2015 二次股灾', 'down'],
  ['2016-01-28', '2016 熔断底', 'bottom'],
  ['2018-10-19', '2018 贸易战底', 'bottom'],
  ['2020-02-03', '2020 疫情开市暴跌', 'down'],
  ['2021-02-18', '2021 抱团瓦解', 'down'],
  ['2022-11-14', '2022 破净潮', 'down'],
  ['2024-09-24', '2024 9·24 行情', 'up'],
];
// 重新演算一遍记录锚点值
const sim2 = new MarketSim(contentBundle.factors, contentBundle.industries, contentBundle.events, contentBundle.releases, cal, 42, eraDrift, eraLevel);
const anchorVals: Record<string, number> = {};
while (sim2.cursor < cal.count) {
  const s = sim2.stepToNext();
  if (anchors.some(([d]) => d === s.date)) anchorVals[s.date] = s.indices['idx_300'];
}
let prevVal = 0;
for (const [d, label, kind] of anchors) {
  const v = anchorVals[d] ?? 0;
  const vs = v.toFixed(0);
  let ok = '';
  if (prevVal > 0) {
    if (kind === 'top' || kind === 'up') ok = v > prevVal ? '✓' : `✗(较上锚点${((v / prevVal - 1) * 100).toFixed(0)}%)`;
    if (kind === 'bottom' || kind === 'down') ok = v < prevVal ? '✓' : `✗(较上锚点+${((v / prevVal - 1) * 100).toFixed(0)}%)`;
  }
  console.log(`  ${d} ${label}: ${vs} ${ok}`);
  prevVal = v;
}

// 游戏循环烟测：跑 1 游戏年
console.log('\n=== 游戏循环烟测（2006 全年，随机行动） ===');
const sim3 = new MarketSim(contentBundle.factors, contentBundle.industries, contentBundle.events, contentBundle.releases, cal, 42, eraDrift, eraLevel);
const game = new Game(sim3, cal, 42, contentBundle.clients);
game.products = contentBundle.products;
const rng = new Rng(7);
let deals = 0;
let texts = 0;
const dateEnd = '2006-12-29';
const endIdx = cal.indexOf(dateEnd);
while (game.sim.cursor < endIdx) {
  // 每天 4 行动 + 推进 1 天
  for (let ap = 0; ap < 4; ap++) {
    const act = rng.pick(['reception', 'reception', 'lobby', 'outreach', 'study', 'review', 'aftersale', 'social', 'rest'] as const);
    const r = game.doAction(act);
    if (r.text.includes('成交')) deals++;
    texts++;
  }
  game.advanceDays(1);
}
console.log(`行动 ${texts} 次，成交 ${deals} 笔，AUM ${game.player.aum.toFixed(0)}，专业力 ${game.player.attrs.pro.toFixed(1)}，压力 ${game.player.attrs.stress.toFixed(1)}`);
console.log(`KPI: 存款 ${game.kpi.deposit_done.toFixed(0)}/${game.kpi.deposit_target.toFixed(0)}，理财 ${game.kpi.wm_done.toFixed(0)}/${game.kpi.wm_target.toFixed(0)}`);
console.log(`客户持有产品人数: ${game.clients.filter((c) => c.holdings.length > 0).length}/10`);
console.log('\n=== 烟测通过 ✓ ===');
