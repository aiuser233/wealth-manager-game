/**
 * 主线剧情触发引擎（core 侧，内容无关）：
 * - QuestDef 为结构性定义（与 content 的 QuestItem 字段兼容）
 * - 按日期触发主线任务；按年份+月份+信任检查人生线节点
 * - 已完成任务记录，存档友好（只需存 id 集合）
 */
import type { IsoDate } from './types';

export interface QuestDef {
  id: string;
  volume: number;
  title: string;
  date: IsoDate;
  client?: string;
  requires?: string;
  dialogues: Array<{ speaker: string; text: string; mood?: string }>;
  choices: Array<{
    text: string;
    outcome: string;
    grade: string;
    effects: {
      trust?: number;
      pro?: number;
      comm?: number;
      sales?: number;
      rep?: number;
      stress?: number;
      aum?: number;
      unlockKnowledge?: string[];
    };
    unlockKnowledge?: string[];
  }>;
  teach?: string;
}

export interface LifeLineDef {
  client: string;
  year: number;
  month?: number;
  title: string;
  text: string;
  trustReq?: number;
  effects: { trust?: number; aum?: number; unlockKnowledge?: string[] };
}

export interface QuestTriggerCheck {
  quest: QuestDef | null;
  lifeNode: LifeLineDef | null;
}

export class QuestEngine {
  private quests: QuestDef[];
  private lifelines: LifeLineDef[];
  /** 已完成任务 id */
  completed = new Set<string>();
  /** 已触发人生线节点（client@year@title hash） */
  private firedLifelines = new Set<string>();
  /** 当前待演出任务（UI 弹出剧情后置空） */
  pending: QuestDef | null = null;
  /** 当前待提示人生线 */
  pendingLife: LifeLineDef | null = null;

  /** 生涯日志：章节式记录（图鉴/结局用） */
  careerLog: Array<{ date: IsoDate; title: string; grade: string }> = [];

  constructor(quests: QuestDef[], lifelines: LifeLineDef[]) {
    // 按触发日期排序，保证线性主线顺序演出
    this.quests = [...quests].sort((a, b) => a.date.localeCompare(b.date));
    this.lifelines = lifelines;
  }

  /**
   * 每月（或每次帧推进后）调用：检查是否有到期未完成任务。
   * 只弹出一个（最早的），完成后再触发下一个。
   */
  checkQuests(currentDate: IsoDate): QuestDef | null {
    if (this.pending) return this.pending;
    for (const q of this.quests) {
      if (this.completed.has(q.id)) continue;
      if (q.date > currentDate) break; // 排序保证后面更晚
      if (q.requires && !this.completed.has(q.requires)) continue;
      this.pending = q;
      return q;
    }
    return null;
  }

  /** 检查人生线节点（月初调用一次） */
  checkLifeNodes(currentDate: IsoDate, clientTrust: (clientId: string) => number): LifeLineDef | null {
    if (this.pendingLife) return this.pendingLife;
    const y = Number(currentDate.slice(0, 4));
    const m = Number(currentDate.slice(5, 7));
    for (const node of this.lifelines) {
      const key = `${node.client}@${node.year}@${node.title}`;
      if (this.firedLifelines.has(key)) continue;
      const nm = node.month ?? 1;
      if (y < node.year || (y === node.year && m < nm)) continue;
      if (node.trustReq && clientTrust(node.client) < node.trustReq) continue;
      this.firedLifelines.add(key);
      this.pendingLife = node;
      return node;
    }
    return null;
  }

  /** 完成当前任务：应用所选分支，记录生涯日志 */
  complete(choiceIdx: number): { outcome: string; grade: string; effects: QuestDef['choices'][number]['effects'] } | null {
    const q = this.pending;
    if (!q) return null;
    const ch = q.choices[Math.min(choiceIdx, q.choices.length - 1)];
    this.completed.add(q.id);
    this.careerLog.push({ date: q.date, title: q.title, grade: ch.grade });
    this.pending = null;
    const knowledge = [...(ch.effects.unlockKnowledge ?? []), ...(ch.unlockKnowledge ?? [])];
    return {
      outcome: ch.outcome,
      grade: ch.grade,
      effects: { ...ch.effects, unlockKnowledge: knowledge.length ? knowledge : undefined },
    };
  }

  /** 人生线确认（无分支，直接生效） */
  completeLife(): { node: LifeLineDef } | null {
    const node = this.pendingLife;
    if (!node) return null;
    this.pendingLife = null;
    return { node };
  }

  /** 当前卷号（用于 UI 显示"卷一·第 x/12 章"） */
  volumeProgress(volume: number): { done: number; total: number } {
    const inVol = this.quests.filter((q) => q.volume === volume);
    return { done: inVol.filter((q) => this.completed.has(q.id)).length, total: inVol.length };
  }

  /** 序列化（存档） */
  serialize(): { completed: string[]; lifelines: string[] } {
    return { completed: [...this.completed], lifelines: [...this.firedLifelines] };
  }

  /** 恢复（读档） */
  restore(data: { completed: string[]; lifelines: string[] }) {
    this.completed = new Set(data.completed ?? []);
    this.firedLifelines = new Set(data.lifelines ?? []);
    this.pending = null;
    this.pendingLife = null;
  }
}
