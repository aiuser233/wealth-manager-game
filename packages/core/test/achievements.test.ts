import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, checkAchievements, type AchievementSnapshot } from '../src/achievements';

function snapshot(overrides: Partial<AchievementSnapshot> = {}): AchievementSnapshot {
  return {
    biggestDeal: 0,
    totalDeals: 0,
    maxGrade: 0,
    aum: 0,
    certs: 0,
    questsDone: 0,
    questsTotal: 82,
    volume7Done: 0,
    volume8Done: 0,
    lifelinesDone: 0,
    violations: 0,
    studyActions: 0,
    examsPassed: 0,
    months: 0,
    playthrough: 1,
    endingsSeen: [],
    referrals: 0,
    reactivated: 0,
    clientsServed: 0,
    dealAmount: 0,
    ...overrides,
  };
}

const achieved = (s: AchievementSnapshot, id: string) =>
  checkAchievements(s).find((a) => a.def.id === id)?.achieved;

describe('卷七/卷八互斥成就', () => {
  it('成就库共 30 枚', () => {
    expect(ACHIEVEMENTS).toHaveLength(30);
  });

  it('一周目通关卷八只解锁薪火相传', () => {
    const s = snapshot({ questsDone: 82, volume8Done: 8 });
    expect(achieved(s, 'quest_all')).toBe(true);
    expect(achieved(s, 'torch_passed')).toBe(true);
    expect(achieved(s, 'ngplus_clear')).toBe(false);
  });

  it('二周目通关卷七只解锁来客通关', () => {
    const s = snapshot({ questsDone: 82, playthrough: 2, volume7Done: 8 });
    expect(achieved(s, 'quest_all')).toBe(true);
    expect(achieved(s, 'ngplus_clear')).toBe(true);
    expect(achieved(s, 'torch_passed')).toBe(false);
  });

  it('二周目仅开启但未完成卷七时不误触发', () => {
    const s = snapshot({ questsDone: 82, playthrough: 2, volume7Done: 7 });
    expect(achieved(s, 'ngplus_clear')).toBe(false);
  });
});
