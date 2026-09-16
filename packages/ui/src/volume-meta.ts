/** 卷号 → 显示名（剧情演出头部与工作台进度共用） */
export const VOLUME_META: Record<number, string> = {
  1: '卷一 · 黄金年代',
  2: '卷二 · 膨胀与幻灭',
  3: '卷三 · 净值化前夜',
  4: '卷四 · 私行纵深',
  5: '卷五 · 传承与终局',
  6: '卷六 · 人间彩蛋',
  7: '卷七 · 二周目来客',
  8: '卷八 · 薪火',
};

export function volumeLabel(volume: number): string {
  return VOLUME_META[volume] ?? `卷${volume}`;
}

/** 旧 careerLog 未存 volume，展示层按标题与年份还原分卷。 */
export function careerEntryVolume(entry: { date: string; title: string }): number {
  if (entry.title.startsWith('记忆残响') || entry.title.startsWith('来客')) return 7;
  if (entry.title.startsWith('薪火')) return 8;
  if (entry.title.startsWith('彩蛋')) return 6;
  const year = Number(entry.date.slice(0, 4));
  if (year <= 2009) return 1;
  if (year <= 2015) return 2;
  if (year <= 2020) return 3;
  if (year <= 2023) return 4;
  return 5;
}
