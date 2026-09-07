import { describe, it, expect } from 'vitest';
import { GameCalendar, MarketSim, Game, productNavAt, holdingValue, productOnShelf } from '../src/index';
import { contentBundle, eraDrift, eraLevel } from '../../../content/src/index';

const cal = new GameCalendar('2006-01-02', '2025-12-31');

function makeGame(seed = 42): Game {
  const sim = new MarketSim(contentBundle.factors, contentBundle.industries, contentBundle.events, contentBundle.releases, cal, seed, eraDrift, eraLevel);
  const g = new Game(sim, cal, seed, contentBundle.clients);
  g.products = contentBundle.products;
  g.seed = seed;
  return g;
}

describe('游戏主控', () => {
  it('日帧推进：日期递增、快照更新', () => {
    const g = makeGame();
    const d0 = g.date;
    g.advanceFrame(2);
    expect(g.date).not.toBe(d0);
    expect(g.lastSnap).not.toBeNull();
  });
  it('AP 消耗与恢复', () => {
    const g = makeGame();
    for (let i = 0; i < 4; i++) g.doAction('lobby');
    expect(g.apUsed).toBe(4);
    const r = g.doAction('lobby');
    expect(r.text).toContain('用完');
    g.advanceFrame(1);
    expect(g.apUsed).toBe(0);
  });
  it('见习期不能切周帧；普通可切', () => {
    const g = makeGame();
    expect(g.canSetFrame('week')).toBe(false);
    expect(g.setFrame('week')).toBe(false);
    g.player.grade = 1;
    expect(g.canSetFrame('week')).toBe(true);
    expect(g.setFrame('week')).toBe(true);
    expect(g.apMax).toBe(10);
  });
  it('force_day 期间锁定日帧', () => {
    const g = makeGame();
    g.player.grade = 3;
    g.setFrame('month');
    g.forceDayDays = 3;
    expect(g.canSetFrame('week')).toBe(false);
    const res = g.advanceFrame();
    expect(res.daysAdvanced).toBe(1); // force 期间逐日
  });
  it('2007 全年 5·30 中断恰好一次', () => {
    const g = makeGame();
    let interrupts = 0;
    while (g.sim.cursor < cal.indexOf('2008-01-04')) {
      for (let i = 0; i < 4; i++) g.doAction('lobby');
      const res = g.advanceFrame();
      if (res.interrupted) interrupts++;
    }
    expect(interrupts).toBe(1);
    expect(g.forceDayDays).toBeGreaterThan(0);
  });
  it('成交：资金池约束生效', () => {
    const g = makeGame();
    const c = g.clients[0];
    const prod = g.products.find((p) => p.id === 'dep_current')!;
    // 尝试一笔远超客户资金池的成交
    const res = g.executeDeal(c, prod, 999_999_999);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('合理比例');
  });
  it('成交：适当性校验生效（R1 客户不能买 R5 产品）', () => {
    const g = makeGame();
    const c = g.clients.find((x) => x.risk.level === 1)!;
    const prod = g.products.find((p) => p.risk_level === 5)!;
    const res = g.executeDeal(c, prod, 1_000_000);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('风险');
  });
  it('成交：净值基准记录（nav_at_buy > 0）', () => {
    const g = makeGame();
    const c = g.clients[0];
    const prod = g.products.find((p) => p.id === 'dep_current')!;
    const res = g.executeDeal(c, prod, 50000);
    expect(res.ok).toBe(true);
    expect(c.holdings[0].nav_at_buy).toBeGreaterThan(0);
  });
  it('月度结算：KPI 重置与评级日志', () => {
    const g = makeGame();
    while (g.sim.cursor < cal.indexOf('2006-02-03')) {
      for (let i = 0; i < 4; i++) g.doAction('reception');
      g.advanceFrame(1);
    }
    expect(g.kpi.month).toBeGreaterThanOrEqual(1);
    expect(g.monthScores.length).toBeGreaterThan(0);
  });
  it('金手指记忆：2018 后归零提示', () => {
    const g = makeGame();
    // 快进到 2019
    while (g.sim.cursor < cal.indexOf('2019-06-03')) {
      g.sim.stepToNext();
    }
    const mem = g.useMemory();
    expect(mem.hint).toContain('归零');
  });
});

describe('产品净值引擎', () => {
  it('固定利率型：净值单调上升', () => {
    const sim = new MarketSim(contentBundle.factors, contentBundle.industries, contentBundle.events, contentBundle.releases, cal, 42, eraDrift, eraLevel);
    while (sim.cursor < 100) sim.stepToNext();
    const dep = contentBundle.products.find((p) => p.id === 'dep_1y')!;
    const nav50 = productNavAt(sim, dep, 50, 42);
    const nav100 = productNavAt(sim, dep, 100, 42);
    expect(nav50).toBeGreaterThan(1);
    expect(nav100).toBeGreaterThan(nav50);
  });
  it('净值型：钱荒日回撤（纯债基金 2013-06-20 附近）', () => {
    const sim = new MarketSim(contentBundle.factors, contentBundle.industries, contentBundle.events, contentBundle.releases, cal, 42, eraDrift, eraLevel);
    const bond = contentBundle.products.find((p) => p.id === 'fund_pure_bond')!;
    // 从 2013 年初推进
    const startIdx = cal.indexOf('2013-01-04');
    while (sim.cursor < startIdx) sim.stepToNext();
    const navBefore = productNavAt(sim, bond, sim.cursor, 42);
    const crunchIdx = cal.indexOf('2013-06-21');
    while (sim.cursor < crunchIdx) sim.stepToNext();
    const navAfter = productNavAt(sim, bond, sim.cursor, 42);
    expect(navAfter).toBeLessThan(navBefore * 1.02); // 钱荒中债基不应上涨超过 2%
  });
  it('持仓现值=金额×(现净值/买入净值)', () => {
    const g = makeGame();
    const c = g.clients[0];
    const prod = g.products.find((p) => p.id === 'dep_current')!;
    g.executeDeal(c, prod, 100000);
    const holding = c.holdings[0];
    const pv = holdingValue(g.sim, prod, holding.amount, holding.nav_at_buy, g.sim.cursor, 42);
    expect(pv).toBeCloseTo(holding.amount * (productNavAt(g.sim, prod, g.sim.cursor, 42) / holding.nav_at_buy), 4);
  });
  it('产品年代货架：分级基金 2018 后退市', () => {
    const graded = contentBundle.products.find((p) => p.id === 'fund_graded')!;
    expect(productOnShelf(graded, '2015-06-01')).toBe(true);
    expect(productOnShelf(graded, '2019-06-01')).toBe(false);
  });
  it('月度客户情绪：牛市浮盈提升信任', () => {
    const g = makeGame();
    const c = g.clients.find((x) => x.id === 'cli_liqiang')!; // R3 平衡型
    c.risk.level = 4; // 保证适当性
    const prod = g.products.find((p) => p.id === 'fund_active_mix')!; // 2006 年在架 R4
    const res = g.executeDeal(c, prod, 50000);
    expect(res.ok).toBe(true);
    // 推进到 2007 年疯牛：权益大涨，现值应显著高于成本
    while (g.sim.cursor < cal.indexOf('2007-10-16')) {
      for (let i = 0; i < 4; i++) g.doAction('lobby');
      g.advanceFrame(1);
    }
    const pv = g.clientPortfolioValue(c.id);
    expect(pv).toBeGreaterThan(60000); // 两年牛市，涨幅 > 20%
  });
});
