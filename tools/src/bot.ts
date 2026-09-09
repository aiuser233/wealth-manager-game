/**
 * 机器人玩家蒙特卡洛模拟（规划书 9.4 数值平衡流水线）
 * 运行：npm run bot
 * 三种策略 × N 局 × 完整 20 年，输出：
 * - 晋升时点分布 / 终局职级
 * - AUM / 收入 / 精力压力曲线
 * - 结局分布（含 Bad End 触发率）
 */
import { GameCalendar, MarketSim, Game, Rng, productOnShelf, judgeEnding, ENDINGS, type EndingId } from '@fm/core';
import { contentBundle, eraDrift, eraLevel, randomEvents } from '@fm/content';

const cal = new GameCalendar('2006-01-02', '2025-12-31');

type Strategy = 'pro' | 'sales' | 'balanced';

interface BotRunResult {
  seed: number;
  strategy: Strategy;
  finalGrade: number;
  finalAum: number;
  totalIncome: number;
  finalStress: number;
  finalEnergy: number;
  certs: number;
  promotedAt: Record<number, string>; // grade -> date
  diedOfStress: boolean;
  dealCount: number;
  /** P6 六结局判定（bot 无剧情引擎，主线按满额计） */
  endingId: EndingId;
}

/** 机器人一局：从 2006 玩到 2025 */
function runBot(seed: number, strategy: Strategy): BotRunResult {
  const sim = new MarketSim(contentBundle.factors, contentBundle.industries, contentBundle.events, contentBundle.releases, cal, seed, eraDrift, eraLevel);
  const game = new Game(sim, cal, seed, contentBundle.clients);
  game.products = contentBundle.products;
  game.seed = seed;
  game.injectEvents(randomEvents as any, new Rng(seed ^ 0x5f3759df));

  const rng = new Rng(seed * 7919 + strategy.length);
  const result: BotRunResult = {
    seed, strategy, finalGrade: 0, finalAum: 0, totalIncome: 0,
    finalStress: 0, finalEnergy: 0, certs: 0, promotedAt: {}, diedOfStress: false, dealCount: 0,
    endingId: 'plain_retire',
  };

  // 行动池按策略加权
  const actionPool: Record<Strategy, string[]> = {
    pro: ['reception', 'reception', 'study', 'study', 'review', 'outreach', 'aftersale', 'rest'],
    sales: ['reception', 'reception', 'reception', 'outreach', 'outreach', 'lobby', 'aftersale', 'rest'],
    balanced: ['reception', 'reception', 'study', 'outreach', 'review', 'lobby', 'aftersale', 'social', 'rest'],
  };

  const endIdx = cal.indexOf('2025-12-31');
  let lastPromoCheck = '';
  while (game.sim.cursor < endIdx) {
    // 有待决策随机事件：选"稳妥"分支（第一个）
    if (game.pendingEvent) {
      game.resolveEvent(0);
    }
    for (let ap = 0; ap < game.apMax; ap++) {
      const pool = actionPool[strategy];
      const act = rng.pick(pool) as any;
      const r = game.doAction(act);
      if (r.text.includes('成交')) result.dealCount++;
    }
    // 帧选择：普通以上用周帧提效（机器人用激进口径测数值上限）
    if (game.canSetFrame('week') && game.frame === 'day' && Number(game.date.slice(5, 7)) % 2 === 0) {
      game.setFrame('week');
    }
    game.advanceFrame();
    // 每月晋升检查 + 机器人自动考证（模拟玩家在考试季学习并通过）
    const ym = game.date.slice(0, 7);
    if (lastPromoCheck !== ym) {
      lastPromoCheck = ym;
      const year = Number(game.date.slice(0, 4));
      const month = Number(game.date.slice(5, 7));
      // 机器人考证策略：每年 6/12 月考一次，按解锁年份顺序拿证
      if (month === 6 || month === 12) {
        const wantCerts = [
          { year: 2006, name: '银行从业·法律法规与综合能力' },
          { year: 2006, name: '银行从业·个人理财' },
          { year: 2009, name: '基金从业·证券投资基金与销售' },
          { year: 2009, name: 'AFP 金融理财师认证' },
          { year: 2014, name: '证券从业·金融市场基础知识' },
          { year: 2014, name: 'CFP 国际金融理财师认证' },
        ];
        for (const w of wantCerts) {
          if (year >= w.year && !game.player.certs.includes(w.name)) {
            // 专业力与学习投入决定通过率：机器人 pro=80+ 时 90% 通过
            const passRate = 0.55 + game.player.attrs.pro / 400;
            if (rng.chance(passRate)) {
              game.player.certs.push(w.name);
              game.player.attrs.pro += 5;
            }
            break; // 每次考一科
          }
        }
      }
      const check = game.promotionCheck().find((r) => r.req.grade === game.player.grade + 1);
      if (check?.eligible && game.applyPromotion()) {
        result.promotedAt[game.player.grade] = game.date;
      }
    }
    // 压力警戒：压力 > 90 强制休息一帧
    if (game.player.attrs.stress > 90) {
      for (let ap = 0; ap < game.apMax; ap++) game.doAction('rest');
    }
    if (game.player.attrs.stress >= 100 && game.player.energy <= 0) {
      result.diedOfStress = true;
      break;
    }
  }
  result.finalGrade = game.player.grade;
  result.finalAum = game.player.aum;
  result.finalStress = game.player.attrs.stress;
  result.finalEnergy = game.player.energy;
  result.certs = game.player.certs.length;
  // P6 六结局判定（bot 不跑剧情/人生线，questsDone 按总数、trust 用客户均值）
  const avgTrust = game.clients.length
    ? game.clients.reduce((a, c) => a + c.trust, 0) / game.clients.length
    : 0;
  const judge = judgeEnding({
    violations: game.violations,
    stress: game.player.attrs.stress,
    highStressMonths: game.highStressMonths,
    grade: game.player.grade,
    aum: game.player.aum,
    seasonScore: game.recentSeasonScore(),
    avgTrust,
    questsDone: 60,
    questsTotal: 60,
    lifelinesDone: 0,
  });
  result.endingId = result.diedOfStress ? 'burnout' : judge.id;
  return result;
}

// ============ 汇总报表 ============
const N = Number(process.argv[2] ?? 20);
const strategies: Strategy[] = ['pro', 'sales', 'balanced'];

console.log(`=== 机器人蒙特卡洛：3 策略 × ${N} 局 × 20 年 ===\n`);

for (const strat of strategies) {
  const runs: BotRunResult[] = [];
  for (let i = 0; i < N; i++) {
    runs.push(runBot(1000 + i, strat));
  }
  const avg = (f: (r: BotRunResult) => number) => runs.reduce((s, r) => s + f(r), 0) / runs.length;
  const gradeDist: Record<number, number> = {};
  for (const r of runs) gradeDist[r.finalGrade] = (gradeDist[r.finalGrade] ?? 0) + 1;
  const promo1 = runs.filter((r) => r.promotedAt[1]).map((r) => r.promotedAt[1]!.slice(0, 4));
  const promo2 = runs.filter((r) => r.promotedAt[2]).map((r) => r.promotedAt[2]!.slice(0, 4));

  console.log(`【策略 ${strat}】`);
  console.log(`  终局职级分布: ${JSON.stringify(gradeDist)} (0见习 1普通 2贵宾 3私行 4主管)`);
  console.log(`  平均 AUM: ${fmt(avg((r) => r.finalAum))}，平均成交 ${avg((r) => r.dealCount).toFixed(0)} 笔`);
  console.log(`  晋升普通: ${promo1.length}/${N} 局（年份分布 ${mode(promo1)}）`);
  console.log(`  晋升贵宾: ${promo2.length}/${N} 局（年份分布 ${mode(promo2)}）`);
  console.log(`  过劳结局: ${runs.filter((r) => r.diedOfStress).length}/${N}`);
  // P6 六结局分布
  const endingDist: Record<string, number> = {};
  for (const r of runs) endingDist[r.endingId] = (endingDist[r.endingId] ?? 0) + 1;
  const endingText = Object.entries(endingDist)
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => `${ENDINGS[id as EndingId].title} ${n}`).join('，');
  console.log(`  六结局分布: ${endingText}`);
  console.log('');
}

console.log('=== 平衡性结论参考 ===');
console.log('· 若 sales 策略终局职级系统性高于 pro → 专业路线奖励不足，需上调信任/口碑对晋升的影响');
console.log('· 若所有局都无法晋升贵宾 → AUM 门槛偏高或资金池约束过紧');
console.log('· 过劳结局率应 < 5%（压力系统兜底机制生效）');

function fmt(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)} 亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)} 万`;
  return `${Math.round(n)}`;
}

function mode(arr: string[]): string {
  if (arr.length === 0) return '-';
  const cnt: Record<string, number> = {};
  for (const v of arr) cnt[v] = (cnt[v] ?? 0) + 1;
  const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  return `${sorted[0][0]}(${Math.round((sorted[0][1] / arr.length) * 100)}%)`;
}
