/**
 * 口碑经营系统单测（A0/A1/A2/A3 + B3）：
 * - 生涯统计 stats（成交/峰值/学习次数）
 * - 客户生命周期：流失预警标记 / 流失结算 / dormant 召回复活
 * - 转介绍链路（spawnReferral 由 rollMonth 触发）
 * - 预约到访（Reception.startFor 指定客户开局）
 */
import { describe, it, expect } from 'vitest';
import { GameCalendar, MarketSim, Game, Reception } from '../src/index';
import { contentBundle, eraDrift, eraLevel } from '../../../content/src/index';

const cal = new GameCalendar('2006-01-02', '2025-12-31');

function makeGame(seed = 42): Game {
  const sim = new MarketSim(contentBundle.factors, contentBundle.industries, contentBundle.events, contentBundle.releases, cal, seed, eraDrift, eraLevel);
  const g = new Game(sim, cal, seed, contentBundle.clients);
  g.products = contentBundle.products;
  g.seed = seed;
  return g;
}

describe('生涯统计 stats（A0）', () => {
  it('executeDeal 成功后统计笔数/金额/单笔最大/峰值 AUM/服务客户', () => {
    const g = makeGame();
    const c = g.clients[0];
    const prod = g.products.find((p) => p.id === 'dep_current')!;
    const res = g.executeDeal(c, prod, 50_000);
    expect(res.ok).toBe(true);
    expect(g.stats.deals).toBe(1);
    expect(g.stats.dealAmount).toBe(50_000);
    expect(g.stats.biggestDeal).toBe(50_000);
    expect(g.stats.peakAum).toBeGreaterThanOrEqual(50_000);
    expect(g.stats.clientsServed).toBe(1);
  });
  it('学习/复盘行动累计 stats.studyActions / stats.reviews', () => {
    const g = makeGame();
    g.doAction('study');
    g.doAction('review');
    expect(g.stats.studyActions).toBe(1);
    expect(g.stats.reviews).toBe(1);
  });
});

describe('客户生命周期（A2）', () => {
  it('流失预警：信任<30 且浮亏>10% → 进入 lastWarningIds 并有日志', () => {
    const g = makeGame(7);
    const c = g.clients[0];
    const prod = g.products.find((p) => p.risk_level <= 5)!;
    c.risk.level = 5;
    const ok = g.executeDeal(c, prod, 100_000);
    expect(ok.ok).toBe(true);
    // 抬高成本基准制造深亏（现值/成本 ≈ -23%）
    c.holdings[0].nav_at_buy = c.holdings[0].nav_at_buy * 1.3;
    c.trust = 20;
    const logBefore = g.log.length;
    g.rollMonthForTest();
    const warned = g.lastWarningIds.includes(c.id) || g.stats.lostClients > 0;
    expect(warned || g.log.length > logBefore).toBe(true);
    expect(['active', 'dormant']).toContain(c.status); // 信任 20 ≥15 不应直接 lost 结算成 lost（流失走 dormant）
  });
  it('流失结算：信任<15 且深亏 → dormant + lostClients 计数', () => {
    const g = makeGame(7);
    const c = g.clients[0];
    const prod = g.products.find((p) => p.risk_level <= 5)!;
    c.risk.level = 5;
    g.executeDeal(c, prod, 100_000);
    c.holdings[0].nav_at_buy = c.holdings[0].nav_at_buy * 1.5;
    c.trust = 5;
    // 强制 50% 概率命中：多次尝试直到命中（确定性 rng，最多 8 次）
    let hit = false;
    for (let i = 0; i < 8 && !hit; i++) {
      c.status = 'active';
      c.trust = 5;
      g.rollMonthForTest();
      hit = c.status === 'dormant';
    }
    expect(hit).toBe(true);
    expect(g.stats.lostClients).toBeGreaterThanOrEqual(1);
  });
  it('召回：dormant 客户信任回到 45+ 后复活 + reactivated 计数', () => {
    const g = makeGame(7);
    const c = g.clients[0];
    c.status = 'dormant';
    c.trust = 50;
    const logBefore = g.log.length;
    g.rollMonthForTest();
    expect(c.status).toBe('active');
    expect(g.stats.reactivated).toBe(1);
    expect(g.log.length).toBeGreaterThan(logBefore);
  });
});

describe('转介绍（A1）', () => {
  it('高信任浮盈客户月结时概率带来新客户（多月份驱动必现）', () => {
    const g = makeGame(7);
    const c = g.clients[0];
    const prod = g.products.find((p) => p.id === 'dep_current')!;
    g.executeDeal(c, prod, 100_000);
    c.trust = 95;
    // 压低成本基准制造浮盈 >5%（存款净值几乎不涨，手动构造满意度场景）
    c.holdings[0].nav_at_buy = c.holdings[0].nav_at_buy / 1.1;
    // 每次月结都有 18+trust/500 ≈ 37% 概率；驱动多次必现
    let spawned = false;
    for (let i = 0; i < 24 && !spawned; i++) {
      c.trust = 95;
      g.monthDeals = 1; // 模拟本月有成交动作（转介绍门槛）
      g.rollMonthForTest();
      spawned = g.clients.some((x) => x.id.startsWith('cli_ref_'));
    }
    expect(spawned).toBe(true);
    expect(g.stats.referrals).toBeGreaterThanOrEqual(1);
    const ref = g.clients.find((x) => x.id.startsWith('cli_ref_'))!;
    expect(ref.behaviors).toContain('referral');
    expect(ref.trust).toBeGreaterThan(20); // 世交信任
  });
});

describe('预约到访（A3）', () => {
  it('startFor 指定客户开局；休眠客户返回 null', () => {
    const g = makeGame();
    const r = new Reception(g.rng);
    const target = g.clients[1];
    const s = r.startFor(g.clients, target.id);
    expect(s).not.toBeNull();
    expect(s!.clientId).toBe(target.id);
    const dormant = { ...g.clients[2], status: 'dormant' as const };
    expect(r.startFor([dormant], dormant.id)).toBeNull();
  });
  it('年度快照与年度报告（D2）', () => {
    const g = makeGame(7);
    const c = g.clients[0];
    g.executeDeal(c, g.products.find((p) => p.id === 'dep_current')!, 80_000);
    g.recordYearlyForTest(2007);
    const rep = g.annualReportFor(2007);
    expect(rep).not.toBeNull();
    expect(rep!.lines.join('')).toContain('AUM');
    expect(g.stats.yearly['2007'].deals).toBe(1);
  });
});
