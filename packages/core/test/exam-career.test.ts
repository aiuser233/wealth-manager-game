import { describe, it, expect } from 'vitest';
import { Rng, buildPaper, gradePaper, EXAM_DEFS, examWindowDates, monthlyKpiScore, kpiGradeName, monthlyBonus, isOpeningSeason, checkPromotion, PROMOTION_PATH } from '../src/index';
import { examBankAll } from '../../../content/src/index';

describe('考试系统', () => {
  it('题库覆盖全部 6 个科目且各科目 ≥ 20 题', () => {
    for (const exam of EXAM_DEFS) {
      const n = examBankAll.filter((q) => q.subject === exam.id).length;
      expect(n).toBeGreaterThanOrEqual(20);
    }
    const ids = new Set(examBankAll.map((q) => q.id));
    expect(ids.size).toBe(examBankAll.length); // id 无重复
  });
  it('抽卷：题量在区间内、无重复、题型交错', () => {
    const rng = new Rng(7);
    for (const exam of EXAM_DEFS) {
      const paper = buildPaper(exam, examBankAll, rng);
      expect(paper.questions.length).toBeGreaterThanOrEqual(exam.question_count[0]);
      expect(paper.questions.length).toBeLessThanOrEqual(exam.question_count[1]);
      const ids = new Set(paper.questions.map((q) => q.id));
      expect(ids.size).toBe(paper.questions.length);
      const totalScore = paper.scores.reduce((a, b) => a + b, 0);
      expect(totalScore).toBeGreaterThan(0);
    }
  });
  it('判分：全对 100 分通过；全错 0 分不通过', () => {
    const exam = EXAM_DEFS[0];
    const paper = buildPaper(exam, examBankAll, new Rng(1));
    const right = gradePaper(paper, paper.questions.map((q) => q.answer));
    expect(right.scorePct).toBeCloseTo(100);
    expect(right.passed).toBe(true);
    const wrong = gradePaper(paper, paper.questions.map(() => -1));
    expect(wrong.scorePct).toBe(0);
    expect(wrong.passed).toBe(false);
  });
  it('多选漏选得一半分', () => {
    const multi = examBankAll.find((q) => q.type === 'multiple')!;
    const paper = { examId: 'exam_afp', questions: [multi], scores: [2], totalScore: 2 };
    const partial = gradePaper(paper, [(multi.answer as number[]).slice(0, 1)]);
    expect(partial.rawScore).toBe(1); // 半分
    expect(partial.perQuestion[0]).toBe(0.5);
  });
  it('考试窗口：每年 4 次（3/6/9/12 月）', () => {
    const dates = examWindowDates(2015);
    expect(dates.length).toBe(4);
    for (const d of dates) {
      const m = Number(d.slice(5, 7));
      expect([3, 6, 9, 12]).toContain(m);
    }
  });
});

describe('月度考核与绩效', () => {
  it('KPI 全部完成约 77 分（B）', () => {
    const score = monthlyKpiScore({
      deposit_done: 100, deposit_target: 100,
      wm_done: 100, wm_target: 100,
      fund_done: 100, fund_target: 100,
      ins_done: 100, ins_target: 100,
    });
    expect(score).toBeGreaterThanOrEqual(75);
    expect(kpiGradeName(score)).toBe('B+');
  });
  it('KPI 零完成 0 分（D）', () => {
    const score = monthlyKpiScore({
      deposit_done: 0, deposit_target: 100,
      wm_done: 0, wm_target: 100,
      fund_done: 0, fund_target: 100,
      ins_done: 0, ins_target: 100,
    });
    expect(score).toBe(0);
    expect(kpiGradeName(score)).toBe('D');
  });
  it('开门红奖金上浮 30%', () => {
    const base = monthlyBonus(2015, 1000000, 80, false);
    const opening = monthlyBonus(2015, 1000000, 80, true);
    expect(opening).toBeGreaterThan(base);
  });
  it('开门红判定 Q1', () => {
    expect(isOpeningSeason(1)).toBe(true);
    expect(isOpeningSeason(3)).toBe(true);
    expect(isOpeningSeason(6)).toBe(false);
  });
});

describe('晋升系统', () => {
  it('见习→普通：条件不足时列出缺失项', () => {
    const req = PROMOTION_PATH[0];
    const res = checkPromotion(0, req, { certs: [], aum: 0, vipClients: 0, privateClients: 0, seasonScore: 0, violations: 0 });
    expect(res.eligible).toBe(false);
    expect(res.missing.length).toBeGreaterThan(0);
  });
  it('见习→普通：条件全满足时可晋升', () => {
    const req = PROMOTION_PATH[0];
    const res = checkPromotion(0, req, {
      certs: ['银行从业·法律法规与综合能力', '银行从业·个人理财'],
      aum: 3_500_000, vipClients: 5, privateClients: 0, seasonScore: 80, violations: 0,
    });
    expect(res.eligible).toBe(true);
    expect(res.missing).toEqual([]);
  });
  it('跳级晋升被拒绝', () => {
    const req = PROMOTION_PATH[2];
    const res = checkPromotion(0, req, { certs: [], aum: 1e9, vipClients: 50, privateClients: 20, seasonScore: 100, violations: 0 });
    expect(res.eligible).toBe(false);
    expect(res.missing[0]).toContain('逐级');
  });
  it('有违规记录时零违规岗位被拒', () => {
    const req = PROMOTION_PATH[2]; // 私行理财经理要求零违规
    const res = checkPromotion(2, req, { certs: ['CFP 国际金融理财师认证', 'AFP 金融理财师认证'], aum: 2e8, vipClients: 30, privateClients: 10, seasonScore: 90, violations: 1 });
    expect(res.eligible).toBe(false);
    expect(res.missing.some((m) => m.includes('违规'))).toBe(true);
  });
});
