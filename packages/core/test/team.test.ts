import { describe, it, expect } from 'vitest';
import { TeamSystem, SUBORDINATES } from '../src/team';

/** 确定性假随机流（0-1 递增序列，测试可复现） */
function seqRng(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('TeamSystem 团队管理', () => {
  it('花名册按年份逐步到岗（卷四 2023 起）', () => {
    const t = new TeamSystem();
    const rng = seqRng([0.5]);
    t.syncRoster(2022, rng);
    expect(t.members).toHaveLength(0);
    t.syncRoster(2023, rng);
    expect(t.members.map((m) => m.id)).toEqual(['sub_tang']);
    t.syncRoster(2025, rng);
    expect(t.members).toHaveLength(SUBORDINATES.length);
  });

  it('syncRoster 幂等：重复调用不重复入队', () => {
    const t = new TeamSystem();
    const rng = seqRng([0.5]);
    t.syncRoster(2025, rng);
    t.syncRoster(2025, rng);
    expect(t.members).toHaveLength(SUBORDINATES.length);
  });

  it('辅导投入越高成长越快', () => {
    const t1 = new TeamSystem();
    const t2 = new TeamSystem();
    t1.syncRoster(2023, seqRng([0.5]));
    t2.syncRoster(2023, seqRng([0.5]));
    for (let i = 0; i < 12; i++) {
      t1.monthlyTick(2023, seqRng([0.9, 0.1]), 3);
      t2.monthlyTick(2023, seqRng([0.9, 0.1]), 0);
    }
    const s1 = t1.members[0].skill;
    const s2 = t2.members[0].skill;
    expect(s1).toBeGreaterThan(s2);
  });

  it('出师判定：带教 ≥18 月且能力 ≥55', () => {
    const t = new TeamSystem();
    t.syncRoster(2023, seqRng([0.5]));
    // 直接操纵状态做边界验证
    const m = t.members[0];
    m.coachedMonths = 18;
    m.skill = 56;
    const evs = t.monthlyTick(2024, seqRng([0.99, 0.99]), 2);
    expect(evs.some((e) => e.kind === 'graduation')).toBe(true);
    expect(t.graduatedCount()).toBe(1);
  });

  it('能力不足不出师', () => {
    const t = new TeamSystem();
    t.syncRoster(2023, seqRng([0.5]));
    const m = t.members[0];
    m.coachedMonths = 18;
    m.skill = 50;
    const evs = t.monthlyTick(2024, seqRng([0.99, 0.99]), 2);
    expect(evs.some((e) => e.kind === 'graduation')).toBe(false);
  });

  it('闯祸处置不当计入违规', () => {
    const t = new TeamSystem();
    t.syncRoster(2023, seqRng([0.5]));
    // 强制闯祸：提高 reckless 概率的 rng=0
    const evs = t.monthlyTick(2024, seqRng([0.0, 0.0]), 0);
    const inc = evs.find((e) => e.kind === 'incident');
    expect(inc).toBeTruthy();
    expect(inc!.violationsDelta).toBe(1);
  });

  it('士气崩盘触发离职事件并移除成员', () => {
    const t = new TeamSystem();
    t.syncRoster(2023, seqRng([0.5]));
    const m = t.members[0];
    m.morale = 5;
    const evs = t.monthlyTick(2024, seqRng([0.0, 0.1]), 0);
    expect(evs.some((e) => e.kind === 'attrition')).toBe(true);
    expect(t.members.find((x) => x.id === m.id)).toBeUndefined();
  });

  it('客户分配：大客户提振个人但拉低整体公平感', () => {
    const t = new TeamSystem();
    t.syncRoster(2023, seqRng([0.5]));
    const m = t.members[0];
    const before = m.morale;
    const r = t.assignClient(m.id, true);
    expect(m.morale).toBeGreaterThan(before);
    expect(r.moraleDelta).toBeLessThanOrEqual(0);
  });

  it('serialize/restore 往返一致', () => {
    const t = new TeamSystem();
    t.syncRoster(2023, seqRng([0.5]));
    t.monthlyTick(2023, seqRng([0.9, 0.1]), 2);
    const snap = JSON.parse(JSON.stringify(t.serialize()));
    const t2 = new TeamSystem();
    t2.restore(snap);
    expect(t2.members).toEqual(t.members);
    expect(t2.morale).toBe(t.morale);
  });
});
