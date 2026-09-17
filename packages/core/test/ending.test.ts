import { describe, it, expect } from 'vitest';
import { judgeEnding, ENDINGS, type EndingInput } from '../src/ending';

const base: EndingInput = {
  violations: 0,
  stress: 40,
  grade: 3,
  aum: 200_000_000,
  seasonScore: 80,
  avgTrust: 45,
  questsDone: 10,
  questsTotal: 12,
  lifelinesDone: 20,
};

describe('judgeEnding 六结局判定', () => {
  it('违规 ≥3 触发调查立案线（最高优先）', () => {
    const r = judgeEnding({ ...base, violations: 3, grade: 4, avgTrust: 70 });
    expect(r.id).toBe('investigation');
  });

  it('investigated 标记直接触发调查线', () => {
    const r = judgeEnding({ ...base, investigated: true });
    expect(r.id).toBe('investigation');
  });

  it('终局压力 ≥90 触发猝死警示', () => {
    const r = judgeEnding({ ...base, stress: 95 });
    expect(r.id).toBe('burnout');
  });

  it('长期高压（≥60 个月）触发猝死警示，即使终值不高', () => {
    const r = judgeEnding({ ...base, stress: 60, highStressMonths: 65 });
    expect(r.id).toBe('burnout');
  });

  it('二周目 + 全主线 + 零违规 + 高信任 → 隐藏结局', () => {
    const r = judgeEnding({
      ...base, newGamePlus: true, questsDone: 12, avgTrust: 60, stress: 50,
    });
    expect(r.id).toBe('reborn_investor');
  });

  it('二周目但主线未满 → 不触发隐藏结局', () => {
    const r = judgeEnding({ ...base, newGamePlus: true, questsDone: 10, avgTrust: 60 });
    expect(r.id).not.toBe('reborn_investor');
  });

  it('高信任 + 零违规 + 主线 80% → 独立顾问/家办', () => {
    const r = judgeEnding({ ...base, avgTrust: 58 });
    expect(r.id).toBe('independent');
  });

  it('高信任但主线下滑太多 → 不给专业线', () => {
    const r = judgeEnding({ ...base, avgTrust: 70, questsDone: 6 });
    expect(r.id).not.toBe('independent');
  });

  it('职级 4 + 考核 70+ → 分行财富管理部总经理', () => {
    const r = judgeEnding({ ...base, grade: 4, avgTrust: 40 });
    expect(r.id).toBe('division_gm');
  });

  it('同为高信任主管：销售管理取向进总经理，显著专业取向进独立顾问', () => {
    const manager = judgeEnding({ ...base, grade: 4, avgTrust: 65, professional: 60, salesPower: 80 });
    const expert = judgeEnding({ ...base, grade: 4, avgTrust: 65, professional: 100, salesPower: 50 });
    expect(manager.id).toBe('division_gm');
    expect(expert.id).toBe('independent');
  });

  it('专业与销售均衡的高职级玩家进入支行管理路线', () => {
    const r = judgeEnding({ ...base, grade: 4, avgTrust: 65, professional: 80, salesPower: 70 });
    expect(r.id).toBe('branch_manager');
  });

  it('职级 2-3 → 支行行长', () => {
    const r = judgeEnding({ ...base, grade: 2, avgTrust: 30 });
    expect(r.id).toBe('branch_manager');
  });

  it('低职级低信任 → 平凡退休', () => {
    const r = judgeEnding({ ...base, grade: 1, avgTrust: 20 });
    expect(r.id).toBe('plain_retire');
  });

  it('八种结局定义完整、文案齐备', () => {
    const ids = Object.keys(ENDINGS) as Array<keyof typeof ENDINGS>;
    expect(ids).toHaveLength(7);
    for (const id of ids) {
      expect(ENDINGS[id].title.length).toBeGreaterThan(0);
      expect(ENDINGS[id].scenes.length).toBeGreaterThanOrEqual(3);
      expect(ENDINGS[id].epilogue.length).toBeGreaterThan(10);
    }
  });
});
