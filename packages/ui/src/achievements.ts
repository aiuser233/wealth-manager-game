/**
 * 成就系统 UI 侧：生涯快照采集 + 达成状态持久化（fm_achievements）。
 * 在月结/考试通过/剧情完成/结局四类节点调用 refreshAchievements。
 */
import { getGame, state } from './state';
import { storage } from './storage';
import { checkAchievements, type AchievementSnapshot, type AchievementState } from '@fm/core';
import { examHistory } from './lms';

const KEY = 'fm_achievements';
/** 跨局记忆的"达成过的结局"（achievements 面板全量展示，包括旧存档达成的） */
function endingsSeen(): string[] {
  return storage.get('fm_endings_seen') ? JSON.parse(storage.get('fm_endings_seen')!) : [];
}

export function recordEnding(id: string) {
  const seen = endingsSeen();
  if (!seen.includes(id)) {
    seen.push(id);
    storage.set('fm_endings_seen', JSON.stringify(seen));
  }
}

/** 采集当前生涯快照 */
function collectSnapshot(): AchievementSnapshot {
  const g = getGame();
  // B3：成交数据改为读引擎生涯统计（stats 精确口径），日志文本解析只做旧档兜底
  const st = g.stats;
  let studyActions = st.studyActions;
  for (const l of state.log) {
    if (l.text.includes('学习')) studyActions += 0; // studyActions 已由 doAction 精确累计
  }
  const qe = state.questEngine;
  const questsDone = qe ? [1, 2, 3, 4, 5, 6, 7].reduce((a, v) => a + qe.volumeProgress(v).done, 0) : 0;
  const questsTotal = qe ? [1, 2, 3, 4, 5, 6, 7].reduce((a, v) => a + qe.volumeProgress(v).total, 0) : 0;
  const examsPassed = examHistory().filter((e) => e.passed).length;
  const ym = Number(getGame().date.replace(/-/g, '').slice(0, 6));
  const startYm = 200601;
  const months = Math.max(0, (Math.floor(ym / 100) - 2006) * 12 + (ym % 100) - 1);
  return {
    biggestDeal: st.biggestDeal,
    totalDeals: st.deals,
    maxGrade: g.player.grade,
    aum: g.player.aum,
    certs: g.player.certs.length,
    questsDone,
    questsTotal,
    lifelinesDone: qe?.lifelinesDone() ?? 0,
    violations: g.violations,
    studyActions,
    examsPassed,
    months,
    playthrough: state.playthrough,
    endingsSeen: endingsSeen(),
    referrals: st.referrals,
    reactivated: st.reactivated,
    clientsServed: st.clientsServed,
    dealAmount: st.dealAmount,
  };
}

/** 刷新并持久化成就状态；返回新解锁的成就（供弹幕提示） */
export function refreshAchievements(): AchievementState[] {
  const snapshot = collectSnapshot();
  const current = checkAchievements(snapshot);
  const prevIds = storage.get(KEY) ? (JSON.parse(storage.get(KEY)!) as string[]) : [];
  const newlyUnlocked = current.filter((a) => a.achieved && !prevIds.includes(a.def.id));
  const achievedIds = current.filter((a) => a.achieved).map((a) => a.def.id);
  storage.set(KEY, JSON.stringify(achievedIds));
  return newlyUnlocked;
}

/** 面板展示用：全量成就与达成态 */
export function achievementStates(): AchievementState[] {
  return checkAchievements(collectSnapshot());
}
