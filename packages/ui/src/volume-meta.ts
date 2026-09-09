/** 卷号 → 显示名（剧情演出头部与工作台进度共用） */
export const VOLUME_META: Record<number, string> = {
  1: '卷一 · 黄金年代',
  2: '卷二 · 膨胀与幻灭',
  3: '卷三 · 净值化前夜',
  4: '卷四 · 私行纵深',
  5: '卷五 · 传承与终局',
};

export function volumeLabel(volume: number): string {
  return VOLUME_META[volume] ?? `卷${volume}`;
}
