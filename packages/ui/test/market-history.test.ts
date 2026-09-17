import { afterEach, describe, expect, it } from 'vitest';
import {
  GAME_START_DATE,
  MARKET_START_DATE,
  SAVE_SCHEMA_VERSION,
  getGame,
  loadGameFromSave,
  newGame,
  serializeNow,
  state,
  stopAutoSaveTimer,
  validateSaveData,
} from '../src/state';

describe('开局历史行情', () => {
  afterEach(() => stopAutoSaveTimer());

  it('游戏从 2006 开始，但 K 线从 2000 开始，并可在读档后重建', () => {
    newGame(42, '测试经理', 'm');
    const game = getGame();

    expect(game.date).toBe(GAME_START_DATE);
    expect(game.lastSnap?.date).toBe(GAME_START_DATE);
    expect(game.snapHistory[0]?.date).toBe(MARKET_START_DATE);
    expect(game.snapHistory.length).toBeGreaterThan(1_500);
    expect(state.news).toHaveLength(0);

    const saved = JSON.parse(serializeNow());
    expect(saved.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(validateSaveData(saved).ok).toBe(true);
    // 旧版 cursor 以 2006 为零点；故意保留一个无效旧值，验证迁移只信 ISO 日期。
    saved.market.cursor = 1;
    loadGameFromSave(saved);

    const loaded = getGame();
    expect(loaded.date).toBe(GAME_START_DATE);
    expect(loaded.snapHistory[0]?.date).toBe(MARKET_START_DATE);
    expect(loaded.snapHistory.at(-1)?.date).toBe(GAME_START_DATE);
    expect(loaded.lastSnap?.date).toBe(GAME_START_DATE);
  }, 30_000);

  it('拒绝损坏存档和未来版本存档', () => {
    expect(validateSaveData(null).ok).toBe(false);
    expect(validateSaveData({ seed: 42, date: 'bad' }).ok).toBe(false);
    expect(validateSaveData({ schemaVersion: SAVE_SCHEMA_VERSION + 1, seed: 42, date: GAME_START_DATE, player: {}, market: {} }).ok).toBe(false);
  });
});
