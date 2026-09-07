import type { IsoDate } from './types';

/**
 * 晋升系统（规划书 6.1）：6 级职业阶梯。
 * 条件全部满足才可提交评审；评审通过立即晋升（剧情评审演出在 M2 接入）。
 */

export interface PromotionRequirement {
  grade: number; // 目标职级
  name: string;
  certs?: string[];      // 任一满足即可（或关系：满足其一）
  certsAll?: string[];   // 必须全部持有
  aum?: number;          // 个人 AUM
  vipClients?: number;   // 贵宾客户数（finance.deposits+wealth ≥ 50 万视为贵宾）
  privateClients?: number; // 私行客户数（≥600 万）
  seasonsAboveB?: number; // 连续两季考核 B+ 以上（月度评级累计）
  zeroViolations?: boolean;
  teamAum?: number;      // 团队 AUM（M2 团队系统接入前等于个人 AUM×1.2 折算）
  coached?: number;      // 带教出师人数（M2 接入，暂恒 0 → 该条件在 M2 前视为满足）
  desc: string;
}

export const PROMOTION_PATH: PromotionRequirement[] = [
  {
    grade: 1, name: '普通理财经理',
    certsAll: ['银行从业·法律法规与综合能力', '银行从业·个人理财'],
    aum: 3_000_000, seasonsAboveB: 2, zeroViolations: true,
    desc: '双证 + AUM 300 万 + 两季考核 B+ + 零违规',
  },
  {
    grade: 2, name: '贵宾理财经理',
    certs: ['AFP 金融理财师认证'],
    certsAll: ['基金从业·证券投资基金与销售'],
    aum: 30_000_000, vipClients: 10,
    desc: 'AFP + 基金从业 + AUM 3000 万 + 贵宾客户 10 户',
  },
  {
    grade: 3, name: '私行理财经理',
    certs: ['CFP 国际金融理财师认证'],
    certsAll: ['AFP 金融理财师认证'],
    aum: 150_000_000, privateClients: 6, zeroViolations: true,
    desc: 'CFP + AUM 1.5 亿 + 私行客户 6 户 + 零违规',
  },
  {
    grade: 4, name: '私行团队主管',
    certs: ['CFP 国际金融理财师认证'],
    aum: 500_000_000, coached: 2,
    desc: 'CPB 评审（剧情）+ 团队 AUM 5 亿 + 带教 2 人出师（团队系统 M2 接入前按个人 AUM 5 亿计）',
  },
];

export interface PromotionCheckResult {
  req: PromotionRequirement;
  eligible: boolean;
  missing: string[];
}

export function checkPromotion(
  currentGrade: number,
  req: PromotionRequirement,
  ctx: {
    certs: string[];
    aum: number;
    vipClients: number;
    privateClients: number;
    seasonScore: number; // 近 6 月平均评级 0-100
    violations: number;
    coached?: number;    // 带教出师人数（团队系统 M2 前可缺省）
  },
): PromotionCheckResult {
  const missing: string[] = [];
  if (req.grade !== currentGrade + 1) return { req, eligible: false, missing: ['需按职级顺序逐级晋升'] };
  if (req.certsAll) {
    for (const c of req.certsAll) if (!ctx.certs.includes(c)) missing.push(`缺少证书：${c}`);
  }
  if (req.certs) {
    const hasAny = req.certs.some((c) => ctx.certs.includes(c));
    if (!hasAny) missing.push(`需任一证书：${req.certs.join(' / ')}`);
  }
  if (req.aum && ctx.aum < req.aum) missing.push(`AUM 不足（需 ${fmtWan(req.aum)}，当前 ${fmtWan(ctx.aum)}）`);
  if (req.vipClients && ctx.vipClients < req.vipClients) missing.push(`贵宾客户不足（需 ${req.vipClients} 户，当前 ${ctx.vipClients} 户）`);
  if (req.privateClients && ctx.privateClients < req.privateClients) missing.push(`私行客户不足（需 ${req.privateClients} 户，当前 ${ctx.privateClients} 户）`);
  if (req.seasonsAboveB && ctx.seasonScore < 75) missing.push(`近两季考核未达 B+（当前 ${ctx.seasonScore.toFixed(0)} 分）`);
  if (req.zeroViolations && ctx.violations > 0) missing.push(`有合规违规记录 ${ctx.violations} 次`);
  if (req.teamAum && ctx.aum < req.teamAum) missing.push(`团队 AUM 不足（需 ${fmtWan(req.teamAum)}）`);
  if (req.coached && ctx.coached && ctx.coached < req.coached) missing.push(`带教出师不足（需 ${req.coached} 人）`);
  return { req, eligible: missing.length === 0, missing };
}

function fmtWan(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)} 亿`;
  return `${(n / 10_000).toFixed(0)} 万`;
}

/** 月度 KPI 综合评级（0-100）：四项完成率加权（早期年代缺失品类按其他项补足） */
export function monthlyKpiScore(kpi: {
  deposit_done: number; deposit_target: number;
  wm_done: number; wm_target: number;
  fund_done: number; fund_target: number;
  ins_done: number; ins_target: number;
}): number {
  const rate = (d: number, t: number) => Math.min(1.3, t > 0 ? d / t : 1);
  const rDep = rate(kpi.deposit_done, kpi.deposit_target);
  const rWm = rate(kpi.wm_done, kpi.wm_target);
  const rFund = rate(kpi.fund_done, kpi.fund_target);
  const rIns = rate(kpi.ins_done, kpi.ins_target);
  // 品类缺失补偿：某品类目标为 0（年代货架尚未出现）时，其权重摊入其他品类
  const hasWm = kpi.wm_target > 0;
  const hasFund = kpi.fund_target > 0;
  const hasIns = kpi.ins_target > 0;
  let wDep = 0.3, wWm = hasWm ? 0.35 : 0, wFund = hasFund ? 0.25 : 0, wIns = hasIns ? 0.1 : 0;
  const totalW = wDep + wWm + wFund + wIns;
  wDep /= totalW; wWm /= totalW; wFund /= totalW; wIns /= totalW;
  const total = rDep * wDep + rWm * wWm + rFund * wFund + rIns * wIns;
  return Math.round((total / 1.0) * 76.9); // 全部 100% 完成 ≈ 77 → B；130% 完成 ≈ 100 → S
}

export function kpiGradeName(score: number): string {
  if (score >= 100) return 'S';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  return 'D';
}

/** 是否开门红月份（Q1 考核压力） */
export function isOpeningSeason(month: number): boolean {
  return month >= 1 && month <= 3;
}

/** 月度绩效奖金（规划书 6.5：2006 低提成高底薪 → 2025 中收分成） */
export function monthlyBonus(year: number, aumGained: number, score: number, opening: boolean): number {
  const commissionRate = year >= 2020 ? 0.0006 : year >= 2013 ? 0.0004 : 0.00025;
  const scoreMul = score >= 100 ? 1.5 : score >= 85 ? 1.2 : score >= 75 ? 1.0 : score >= 60 ? 0.7 : 0.4;
  const openingMul = opening ? 1.3 : 1;
  return Math.round(aumGained * commissionRate * scoreMul * openingMul);
}
