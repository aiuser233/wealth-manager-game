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
   * dateShift：任务 id → 实际触发日期（二周目事件漂移；缺省完全按原日期）。
   */
  checkQuests(currentDate: IsoDate, dateShift?: Record<string, IsoDate>): QuestDef | null {
    if (this.pending) return this.pending;
    for (const q of this.quests) {
      if (this.completed.has(q.id)) continue;
      const effDate = dateShift?.[q.id] ?? q.date;
      if (effDate > currentDate) break; // 排序保证后面更晚（漂移幅度 ≤ 季度，相对顺序可能微调，此处容忍）
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

  /** 已触发人生线节点数（结局档案用） */
  lifelinesDone(): number {
    return this.firedLifelines.size;
  }

  /**
   * 结局闭环 v0（P2）：卷一结束时按"业绩 / 专业 / 红线"三维给阶段性评语。
   * 完整六结局留 P6；此处输出可导出的阶段画像。
   */
  volumeReview(volume: number, dims: {
    /** 业绩分：月度 KPI 均分（0-100） */
    perfScore: number;
    /** 专业分：证书数*10 + 专业力上限 60 */
    proScore: number;
    /** 红线：违规次数 */
    violations: number;
    /** 客户信任均值（0-100） */
    avgTrust: number;
  }): { headline: string; lines: string[]; grades: Array<{ dim: string; grade: string; comment: string }> } {
    const done = this.quests.filter((q) => q.volume === volume && this.completed.has(q.id)).length;
    const total = this.quests.filter((q) => q.volume === volume).length;

    const perfGrade = dims.perfScore >= 85 ? 'S' : dims.perfScore >= 70 ? 'A' : dims.perfScore >= 55 ? 'B' : 'C';
    const proGrade = dims.proScore >= 50 ? 'S' : dims.proScore >= 30 ? 'A' : dims.proScore >= 15 ? 'B' : 'C';
    const redGrade = dims.violations === 0 ? 'S' : dims.violations <= 2 ? 'A' : dims.violations <= 5 ? 'B' : 'C';
    const trustGrade = dims.avgTrust >= 60 ? 'S' : dims.avgTrust >= 40 ? 'A' : dims.avgTrust >= 25 ? 'B' : 'C';

    const perfComment: Record<string, string> = {
      S: '业绩标杆：KPI 从不是你的目的，但每次你都超额完成。',
      A: '业绩扎实：稳定达标，距离标杆只差一个牛熊周期的沉淀。',
      B: '业绩平庸：靠天吃饭的月份太多，配置能力需要补课。',
      C: '业绩告急：回头看看，是获客不足还是转化不力？',
    };
    const proComment: Record<string, string> = {
      S: '专业过硬：证书与知识储备让客户愿意把家庭资产负债表交给你。',
      A: '专业合格：该考的证考了，该懂的逻辑懂了，继续往深里走。',
      B: '专业单薄：证书是门槛不是天花板，错题本里的坑都填了吗？',
      C: '专业堪忧：连门槛都还没迈过去，考题里的红线就是执业红线。',
    };
    const redComment: Record<string, string> = {
      S: '红线满分：一次违规都没有，合规是你的本能而不是负担。',
      A: '偶有擦边：没有造成事故，但记住——违规没有"差一点没事"。',
      B: '红线意识薄弱：双录、适当性、承诺收益，培训要重点回炉。',
      C: '合规高危：这个状态放到真实网点，已经在处罚名单上了。',
    };
    const trustComment: Record<string, string> = {
      S: '客户信任满分：人生线走完了大半，客户把你当成家人。',
      A: '信任良好：客户愿意听你讲完再决定，这就是专业溢价。',
      B: '信任一般：客户还把你当"卖产品的"，多聊聊人生再聊钱。',
      C: '信任危机：客户在防着你，回想一下哪次急功近利伤了人。',
    };

    const grades = [
      { dim: '业绩', grade: perfGrade, comment: perfComment[perfGrade] },
      { dim: '专业', grade: proGrade, comment: proComment[proGrade] },
      { dim: '红线', grade: redGrade, comment: redComment[redGrade] },
      { dim: '信任', grade: trustGrade, comment: trustComment[trustGrade] },
    ];

    // 头条：三维加权总评（按卷号显示）
    const volName = ['卷一 · 黄金年代', '卷二 · 膨胀与幻灭', '卷三 · 净值化前夜', '卷四 · 私行纵深', '卷五 · 传承与终局'][volume - 1] ?? `卷${volume}`;
    const scoreMap: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 };
    const total3 = scoreMap[redGrade] * 2 + scoreMap[perfGrade] + scoreMap[proGrade]; // 红线双倍权重
    const headline = total3 >= 12
      ? `${volName}终评 · 「穿越牛熊的新星」——牛熊交替之间，你守住了底线也赢得了信任。`
      : total3 >= 9
        ? `${volName}终评 · 「稳健前行的理财经理」——专业在长，业绩在涨，红线在手。`
        : total3 >= 6
          ? `${volName}终评 · 「磕磕绊绊的进阶者」——这一卷比上一卷强，但距离合格还有距离。`
          : `${volName}终评 · 「被行情牵着走的人」——被行情和欲望牵着走的一段路，需要复盘重来。`;

    const lines = [
      `主线章节：${done}/${total} 完成。`,
      ...grades.map((g) => `【${g.dim}·${g.grade}】${g.comment}`),
    ];
    return { headline, lines, grades };
  }

  /** 序列化（存档）：含进行中任务与生涯日志（P2 存档补全） */
  serialize(): { completed: string[]; lifelines: string[]; pending: string | null; pendingLife: string | null; careerLog: Array<{ date: IsoDate; title: string; grade: string }> } {
    return {
      completed: [...this.completed],
      lifelines: [...this.firedLifelines],
      pending: this.pending?.id ?? null,
      pendingLife: this.pendingLife ? `${this.pendingLife.client}@${this.pendingLife.year}@${this.pendingLife.title}` : null,
      careerLog: [...this.careerLog],
    };
  }

  /** 恢复（读档） */
  restore(data: {
    completed: string[]; lifelines: string[];
    pending?: string | null; pendingLife?: string | null;
    careerLog?: Array<{ date: IsoDate; title: string; grade: string }>;
  }) {
    this.completed = new Set(data.completed ?? []);
    this.firedLifelines = new Set(data.lifelines ?? []);
    // 恢复进行中的剧情演出（下次 checkQuests/checkLifeNodes 直接返回）
    const pid = data.pending ?? null;
    this.pending = pid ? (this.quests.find((q) => q.id === pid) ?? null) : null;
    const plid = data.pendingLife ?? null;
    this.pendingLife = plid ? (this.lifelines.find((n) => `${n.client}@${n.year}@${n.title}` === plid) ?? null) : null;
    this.careerLog = [...(data.careerLog ?? [])];
  }
}
