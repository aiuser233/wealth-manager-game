/**
 * 团队管理系统（P6-3，规划书 6.6）：
 * - 卷四末（私行团队主管试用）起配 3-5 名下属（含剧情人物小唐/周远航）
 * - 月度自动结算：辅导（口碑与士气）、闯祸（违规风险事件）、客户分配（公平性）
 * - 纯引擎逻辑：下属成长影响带教出师数（晋升条件）与结局判定的"管理线"
 */

import type { IsoDate } from './types';

export interface SubordinateDef {
  id: string;
  name: string;
  /** 性格：影响闯祸倾向与辅导收益 */
  trait: 'eager' | 'steady' | 'reckless' | 'bookish';
  /** 入队年份（卷四 2023 起逐步到齐） */
  joinedYear: number;
  /** 一句话人设 */
  bio: string;
}

export const SUBORDINATES: SubordinateDef[] = [
  { id: 'sub_tang', name: '小唐', trait: 'eager', joinedYear: 2023, bio: '研究生新人，勤奋但不会倾听。你的第一个下属，也是你要复制的那面镜子。' },
  { id: 'sub_zhouyh', name: '周远航', trait: 'reckless', joinedYear: 2024, bio: '业绩冲动型，单产高、花样多，红线意识靠团队兜底。' },
  { id: 'sub_liuq', name: '刘晴', trait: 'steady', joinedYear: 2024, bio: '柜面转岗的稳健派，客户关系扎实，冲劲不足。' },
  { id: 'sub_xiaoh', name: '肖何', trait: 'bookish', joinedYear: 2025, bio: '考证狂人，CFP 候选人，讲得清逻辑但见客户就紧张。' },
];

export interface SubordinateState {
  id: string;
  /** 能力 0-100 */
  skill: number;
  /** 士气 0-100 */
  morale: number;
  /** 带教月数 */
  coachedMonths: number;
  /** 是否出师（晋升条件"带教 2 人出师"） */
  graduated: boolean;
  /** 累计闯祸次数 */
  incidents: number;
}

/** 性格 → 闯祸基础概率（月度） */
const TRAIT_INCIDENT_P: Record<SubordinateDef['trait'], number> = {
  eager: 0.04, steady: 0.02, reckless: 0.09, bookish: 0.02,
};
/** 性格 → 辅导增益区间 */
const TRAIT_COACH_GAIN: Record<SubordinateDef['trait'], [number, number]> = {
  eager: [1.5, 3], steady: [0.8, 1.8], reckless: [1, 2.5], bookish: [1.2, 2.6],
};

/** 团队事件（月度结算产出，UI 呈现为日志/抉择） */
export interface TeamEvent {
  kind: 'incident' | 'graduation' | 'attrition';
  subId: string;
  subName: string;
  text: string;
  /** 士气冲击（全员） */
  moraleDelta: number;
  /** 违规次数冲击（闯祸处置不当时） */
  violationsDelta: number;
}

export class TeamSystem {
  members: SubordinateState[] = [];
  /** 团队士气（0-100）：影响客户分配与闯祸率 */
  morale = 60;

  /** 按游戏年份补齐成员（卷四末自动到岗） */
  syncRoster(year: number, rng: { next(): number }) {
    for (const def of SUBORDINATES) {
      if (def.joinedYear > year) continue;
      if (this.members.some((m) => m.id === def.id)) continue;
      this.members.push({
        id: def.id,
        skill: def.trait === 'bookish' ? 35 : def.trait === 'steady' ? 45 : 28,
        morale: 60,
        coachedMonths: 0,
        graduated: false,
        incidents: 0,
      });
    }
  }

  /** 月度结算：辅导成长 + 闯祸掷骰 + 出师判定。rollRng 为引擎确定性随机流 */
  monthlyTick(
    year: number,
    rollRng: () => number,
    /** 玩家本年辅导投入 0-3（行动点分配出来的月度系数） */
    coachLevel: number,
  ): TeamEvent[] {
    const events: TeamEvent[] = [];
    for (const m of this.members) {
      const def = SUBORDINATES.find((d) => d.id === m.id)!;
      m.coachedMonths += 1;
      // 辅导成长：投入越高越快，士气乘数
      if (m.coachedMonths <= 36) {
        const [lo, hi] = TRAIT_COACH_GAIN[def.trait];
        const gain = (lo + (hi - lo) * rollRng()) * (0.6 + coachLevel * 0.3) * (0.7 + m.morale / 200);
        m.skill = Math.min(100, m.skill + gain);
        m.morale = Math.min(100, m.morale + coachLevel * 1.5 - 1);
      }
      // 出师：带教 ≥18 月且能力 ≥55
      if (!m.graduated && m.coachedMonths >= 18 && m.skill >= 55) {
        m.graduated = true;
        events.push({
          kind: 'graduation', subId: m.id, subName: def.name,
          text: `${def.name} 出师了——从"背话术"到"有自己的客户逻辑"。团队带教纪录 +1。`,
          moraleDelta: 3, violationsDelta: 0,
        });
      }
      // 闯祸掷骰：士气低与性格 reckless 放大；辅导高抑制
      const p = TRAIT_INCIDENT_P[def.trait] * (1.4 - m.morale / 200) * (1 - Math.min(0.5, coachLevel * 0.12));
      if (rollRng() < p) {
        m.incidents += 1;
        const handled = coachLevel >= 2;
        events.push({
          kind: 'incident', subId: m.id, subName: def.name,
          text: handled
            ? `${def.name} 险些越线（双录缺一步）。你当晚复盘流程、次周做了全员合规演练——事故被拦在流程里。`
            : `${def.name} 的单子出了合规瑕疵（适当性记录不完整），被监管通报。你作为主管连带担责。`,
          moraleDelta: handled ? 1 : -6,
          violationsDelta: handled ? 0 : 1,
        });
      }
      // 士气崩盘离职
      if (m.morale < 15 && rollRng() < 0.2) {
        events.push({
          kind: 'attrition', subId: m.id, subName: def.name,
          text: `${def.name} 提了离职："在这里学不到东西。"士气崩盘的团队留不住人。`,
          moraleDelta: -8, violationsDelta: 0,
        });
        this.members = this.members.filter((x) => x.id !== m.id);
      }
    }
    // 全员士气均值回归
    if (this.members.length > 0) {
      this.morale = Math.max(0, Math.min(100,
        this.morale * 0.8 + this.members.reduce((a, m) => a + m.morale, 0) / this.members.length * 0.2));
    }
    return events;
  }

  /** 客户分配博弈（规划书 6.6）：大客户给谁。公平性影响士气 */
  assignClient(
    subId: string,
    bigClient: boolean,
  ): { text: string; moraleDelta: number } {
    const m = this.members.find((x) => x.id === subId);
    if (!m) return { text: '分配对象不在团队中。', moraleDelta: 0 };
    const def = SUBORDINATES.find((d) => d.id === subId)!;
    // 平均主义 vs 论功分配的张力：连续给同一人 → 其他人士气受损
    const before = this.morale;
    if (bigClient) {
      m.morale = Math.min(100, m.morale + 6);
      this.morale = Math.max(0, this.morale - 2);
      return { text: `${def.name} 接下了这户大客户。其他人看在眼里——分配的公平性，比分配本身更被计较。`, moraleDelta: this.morale - before };
    }
    m.skill = Math.min(100, m.skill + 2);
    return { text: `${def.name} 领到了练手客户。轮岗式的公平是你的团队离职率最低的原因。`, moraleDelta: 0 };
  }

  /** 带教出师人数（晋升条件） */
  graduatedCount(): number {
    return this.members.filter((m) => m.graduated).length;
  }

  serialize() {
    return { members: this.members.map((m) => ({ ...m })), morale: this.morale };
  }

  restore(data: { members?: SubordinateState[]; morale?: number }) {
    this.members = (data.members ?? []).map((m) => ({ ...m }));
    this.morale = data.morale ?? 60;
  }
}
