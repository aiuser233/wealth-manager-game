/**
 * 成就系统（P6 增强）：生涯里程碑徽章。
 * - 纯检测函数：输入生涯快照（无引擎依赖），输出已达成成就与进度
 * - UI 在关键节点（月结/考试/剧情/结局）调用 refreshAchievements 持久化到 storage
 */

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  /** 图形字符（emoji 徽章） */
  icon: string;
  /** 分档：bronze/silver/gold/hidden */
  tier: 'bronze' | 'silver' | 'gold' | 'hidden';
}

export interface AchievementSnapshot {
  /** 单笔最大成交额 */
  biggestDeal: number;
  /** 累计成交笔数 */
  totalDeals: number;
  /** 达到过的最高职级 */
  maxGrade: number;
  /** 当前 AUM */
  aum: number;
  /** 证书数 */
  certs: number;
  /** 主线完成数 */
  questsDone: number;
  /** 人生线触发节点数 */
  lifelinesDone: number;
  /** 违规次数 */
  violations: number;
  /** 累计学习行动次数 */
  studyActions: number;
  /** 考试通过次数 */
  examsPassed: number;
  /** 存续月数 */
  months: number;
  /** 周目数 */
  playthrough: number;
  /** 达成过的结局集合 */
  endingsSeen: string[];
}

export interface AchievementState {
  def: AchievementDef;
  achieved: boolean;
  /** 未达成时显示的进度描述（可选） */
  progress?: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_deal', name: '开张大吉', desc: '完成第一笔成交', icon: '🎉', tier: 'bronze' },
  { id: 'deal_50', name: '熟手理财经理', desc: '累计成交 50 笔', icon: '🤝', tier: 'bronze' },
  { id: 'deal_200', name: '成交机器', desc: '累计成交 200 笔', icon: '⚡', tier: 'silver' },
  { id: 'deal_10m', name: '单笔千万', desc: '单笔成交突破 1000 万', icon: '🐋', tier: 'gold' },
  { id: 'aum_100m', name: '亿级客户经理', desc: '管理 AUM 突破 1 亿', icon: '💎', tier: 'silver' },
  { id: 'aum_1b', name: '十亿俱乐部', desc: '管理 AUM 突破 10 亿', icon: '🏦', tier: 'gold' },
  { id: 'grade_vip', name: '贵宾经理', desc: '晋升贵宾理财经理', icon: '🎖️', tier: 'bronze' },
  { id: 'grade_private', name: '私行经理', desc: '晋升私行理财经理', icon: '🏅', tier: 'silver' },
  { id: 'grade_lead', name: '团队掌舵人', desc: '晋升私行团队主管', icon: '🚩', tier: 'gold' },
  { id: 'cert_4', name: '考证达人', desc: '持有 4 张证书', icon: '📚', tier: 'bronze' },
  { id: 'cert_6', name: '六证俱全', desc: '持有全部 6 张证书', icon: '🎓', tier: 'gold' },
  { id: 'study_100', name: '学习是底色', desc: '累计学习行动 100 次', icon: '✍️', tier: 'bronze' },
  { id: 'quest_half', name: '剧情过半', desc: '完成 30 章主线', icon: '📖', tier: 'bronze' },
  { id: 'quest_all', name: '二十年全档案', desc: '完成全部 60 章主线', icon: '🏆', tier: 'gold' },
  { id: 'life_10', name: '人生的同行者', desc: '触发 10 个客户人生线节点', icon: '🌅', tier: 'bronze' },
  { id: 'life_25', name: '二十年的陪伴', desc: '触发 25 个客户人生线节点', icon: '🌈', tier: 'silver' },
  { id: 'clean_record', name: '如水清白', desc: '走完 240 个月零违规', icon: '💧', tier: 'gold' },
  { id: 'survivor', name: '穿越牛熊', desc: '走完 20 年（240 个月）', icon: '🕰️', tier: 'silver' },
  { id: 'hidden_ending', name: '重返投资界', desc: '达成隐藏结局', icon: '✨', tier: 'hidden' },
  { id: 'ng_plus', name: '二周目来客', desc: '开启第二周目', icon: '🔄', tier: 'hidden' },
];

const fmt = (n: number) => (n >= 100000000 ? `${(n / 100000000).toFixed(1)} 亿` : `${(n / 10000).toFixed(0)} 万`);

/** 检测快照下所有成就的达成状态 */
export function checkAchievements(s: AchievementSnapshot): AchievementState[] {
  const done = (id: string, achieved: boolean, progress?: string): AchievementState => ({
    def: ACHIEVEMENTS.find((a) => a.id === id)!,
    achieved,
    progress,
  });
  return [
    done('first_deal', s.totalDeals >= 1),
    done('deal_50', s.totalDeals >= 50, `成交 ${s.totalDeals}/50`),
    done('deal_200', s.totalDeals >= 200, `成交 ${s.totalDeals}/200`),
    done('deal_10m', s.biggestDeal >= 10_000_000, `单笔最大 ${fmt(s.biggestDeal)}`),
    done('aum_100m', s.aum >= 100_000_000, `AUM ${fmt(s.aum)}`),
    done('aum_1b', s.aum >= 1_000_000_000, `AUM ${fmt(s.aum)}`),
    done('grade_vip', s.maxGrade >= 2),
    done('grade_private', s.maxGrade >= 3),
    done('grade_lead', s.maxGrade >= 4),
    done('cert_4', s.certs >= 4, `证书 ${s.certs}/4`),
    done('cert_6', s.certs >= 6, `证书 ${s.certs}/6`),
    done('study_100', s.studyActions >= 100, `学习 ${s.studyActions}/100 次`),
    done('quest_half', s.questsDone >= 30, `主线 ${s.questsDone}/30 章`),
    done('quest_all', s.questsDone >= 60, `主线 ${s.questsDone}/60 章`),
    done('life_10', s.lifelinesDone >= 10, `人生线 ${s.lifelinesDone}/10`),
    done('life_25', s.lifelinesDone >= 25, `人生线 ${s.lifelinesDone}/25`),
    done('clean_record', s.violations === 0 && s.months >= 240, s.months < 240 ? `存续 ${s.months}/240 月` : `违规 ${s.violations} 次`),
    done('survivor', s.months >= 240, `存续 ${s.months}/240 月`),
    done('hidden_ending', s.endingsSeen.includes('reborn_investor')),
    done('ng_plus', s.playthrough >= 2),
  ];
}
