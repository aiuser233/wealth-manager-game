/**
 * 六结局判定系统（P6-1，规划书 4.3 / 6.6）：
 * - 卷五结束（2025-12-31）或日历终点触发，按生涯数据判结局
 * - 结局优先级：调查立案 > 猝死警示 > 隐藏结局 > 家办 > 总经理 > 支行行长 > 平凡退休
 * - 纯函数：输入引擎快照，输出结局与判定依据（可单测、可蒙特卡洛统计）
 */

export interface EndingInput {
  /** 违规次数（红线分支计入） */
  violations: number;
  /** 是否被调查立案（红线累计 ≥3 触发调查线） */
  investigated?: boolean;
  /** 压力终值（0-100） */
  stress: number;
  /** 生涯是否长期高压（压力 ≥80 的月份数） */
  highStressMonths?: number;
  /** 最终职级（PROMOTION_PATH grade：0 见习 ~ 4 私行团队主管） */
  grade: number;
  /** 最终 AUM */
  aum: number;
  /** 近 6 月考核分均值（0-100） */
  seasonScore: number;
  /** 客户信任均值（0-100） */
  avgTrust: number;
  /** 最终专业力；用于区分专业独立路线与管理路线（旧存档可缺省） */
  professional?: number;
  /** 最终销售力；用于区分业绩/管理路线（旧存档可缺省） */
  salesPower?: number;
  /** 主线任务完成数 */
  questsDone: number;
  /** 主线任务总数 */
  questsTotal: number;
  /** 人生线完成节点数 */
  lifelinesDone: number;
  /** 隐藏结局条件：二周目 + 全主线 + 零违规 + 高信任（由 shell 传入） */
  newGamePlus?: boolean;
  /** 玩家名（结局文案用） */
  playerName?: string;
}

export type EndingId =
  | 'investigation'   // 调查立案离场（Bad End 教学演出）
  | 'burnout'         // 猝死警示（呼应前世死因）
  | 'plain_retire'    // 平凡退休
  | 'branch_manager'  // 支行行长
  | 'division_gm'     // 分行财富管理部总经理
  | 'independent'     // 独立财富顾问·开办家办
  | 'reborn_investor'; // 隐藏结局"重返投资界"

export interface EndingDef {
  id: EndingId;
  title: string;
  /** 一句话结局定性（档案页/成就系统用） */
  tagline: string;
  /** 结局演出文案（分幕） */
  scenes: Array<{ speaker: string; text: string }>;
  /** 结局评语：这二十年教会了你什么（教学收束） */
  epilogue: string;
}

/** 六结局 + 2 教学结局的定义表 */
export const ENDINGS: Record<EndingId, EndingDef> = {
  investigation: {
    id: 'investigation', title: '调查立案离场', tagline: '红线是电网，不是弹簧',
    scenes: [
      { speaker: '系统', text: '合规部的封条贴上你工位的那天，距离你退休还有很久。' },
      { speaker: '陈曼', text: '（隔着谈话室的桌子）二十年，我看着你从见习做到主管。可你把"变通"当成了本事——把客户的钱当成自己的筹码。' },
      { speaker: '林奇安', text: '（你想起 2006 年重生回来的那个早晨。你以为重活一次最大的敌人是行情，其实是自己。）' },
      { speaker: '系统', text: '生涯档案封存。调查结论写入行业诚信档案——这一世，你输给了上一世同样的东西。' },
    ],
    epilogue: '教学点：飞单、代客操作、承诺收益——每一根红线背后都是真实的人生。重来一次，把"以为没事"变成"守住底线"。',
  },
  burnout: {
    id: 'burnout', title: '猝死警示', tagline: '又赶上了那趟航班',
    scenes: [
      { speaker: '系统', text: '凌晨两点的办公室，你的心脏先于项目书停止了工作。' },
      { speaker: '陈曼', text: '（在追悼会上）他总说"这一世要赢回一切"。可他用二十年，跑完了上一世的最后一个月。' },
      { speaker: '林奇安', text: '（意识消散前你想：上辈子死在键盘上，这辈子死在报表里——重生到底改变了什么？）' },
      { speaker: '系统', text: '压力是复利的敌人：财富按年复利，健康按月透支。这份档案，是给所有"再来一年就好了"的人的。' },
    ],
    epilogue: '教学点：理财经理首先要管好自己的资产负债表——健康是最不能归零的资产。',
  },
  plain_retire: {
    id: 'plain_retire', title: '平凡退休', tagline: '平平安安，也是二十年',
    scenes: [
      { speaker: '系统', text: '2025 年 12 月 31 日，你按部就班地退休了。没有仪式，只有一盆绿植和二十年工龄。' },
      { speaker: '王秀兰', text: '小林，我这养老钱啊，稳稳当当跟你走了这么多年。人这一辈子，平安就是福。' },
      { speaker: '林奇安', text: '（你没有大富大贵，也没有踩过雷。KPI 每年都完成，客户每年都不多不少。安稳，是这一世的关键词。）' },
      { speaker: '系统', text: '平凡不是贬义词——但对一个知道未来二十年行情的人来说，有点可惜。' },
    ],
    epilogue: '教学点：合规活着不等于专业活着。下一局，试着把"完成 KPI"升级成"经营信任"。',
  },
  branch_manager: {
    id: 'branch_manager', title: '支行行长', tagline: '网点里最好的位置，留给了会带人的人',
    scenes: [
      { speaker: '系统', text: '聘任文件下来那天，城东支行的门牌换成了"行长室"。' },
      { speaker: '王建平', text: '我就知道你行。从厅堂轮值到行长，你带的团队是全行最稳的——没出过一次合规事故。' },
      { speaker: '小唐', text: '林行长，我带的实习生态度浮，跟当年您骂我一样骂他，对吧？' },
      { speaker: '林奇安', text: '（你看着大厅里进进出出的客户——你的判断变了：从"我怎么做单"到"我的团队怎么对人"。）' },
      { speaker: '系统', text: '管理结局达成：把专业复制给团队，比把产品卖给客户更难，也更重要。' },
    ],
    epilogue: '教学点：带团队是第二重专业——你的口碑从"签单的人"变成了"培养签单的人"。',
  },
  division_gm: {
    id: 'division_gm', title: '分行财富管理部总经理', tagline: '指挥棒在你手里，考的不再是 KPI 是方向',
    scenes: [
      { speaker: '系统', text: '分行财富管理部总经理——你的签字决定全辖区数百位理财经理的服务方向。' },
      { speaker: '陈曼', text: '（退休返聘酒会上）当年那个厅堂里的小林，如今在台上讲"财富管理转型"。台下的年轻人，像极了当年的你。' },
      { speaker: '小唐', text: '林总，您在述职里说"指标是行业转型的镜子，不是目的"。这句话我记了三年，今天终于懂了。' },
      { speaker: '林奇安', text: '（你推开的考核指挥棒改革：从存款时点到养老金融——你知道指挥棒指哪里，行业就走向哪里。）' },
      { speaker: '系统', text: '事业巅峰结局：你不仅穿越了周期，还参与了周期的方向。' },
    ],
    epilogue: '教学点：KPI 品类二十年四次演变（存款→理财→AUM→养老金融），本身就是行业转型史——看懂指挥棒的人才有资格举指挥棒。',
  },
  independent: {
    id: 'independent', title: '独立财富顾问·开办家办', tagline: '把名字签在方案上，而不是工牌上',
    scenes: [
      { speaker: '系统', text: '你递交辞职信的那天，陈曼沉默了很久，最后只说："把王秀兰她们照顾好。"' },
      { speaker: '周宏图', text: '（第一位签约客户）小林，我信的不是你背后那块牌子，是你二十年来没让我亏过"睡不着的钱"。' },
      { speaker: '小唐', text: '师傅，家办的牌照我帮你跑下来了。第一个客户见面会，我给你做主持。' },
      { speaker: '林奇安', text: '（办公室很小，客户名单很短——每一页都是二十年的名字。你终于可以只用一种身份见客户：你的专业本身。）' },
      { speaker: '系统', text: '专业线结局：信任是可以带走的资产——前提是它从未被辜负。' },
    ],
    epilogue: '教学点：独立顾问的合规边界比在机构内更严：执业资格、利益冲突披露、客户资金托管，一样都不能少。',
  },
  reborn_investor: {
    id: 'reborn_investor', title: '重返投资界', tagline: '两次人生，一个答案',
    scenes: [
      { speaker: '系统', text: '（隐藏结局）二十年后，你站在交易室里。这一次不是重生，是你自己走回来的。' },
      { speaker: '陈曼', text: '你不是最会卖产品的理财经理，你是最记得"每个数字背后是人"的那一个。投资界缺的从来不是聪明人。' },
      { speaker: '林奇安', text: '（上一世你死于贪婪与过劳；这一世你用二十年学会了敬畏与耐心。原来重生的意义不是预知行情——是终于配得上它。）' },
      { speaker: '系统', text: '隐藏结局达成。二周目已解锁：下一世，行情将不再完全重演——但你已经不需要背答案了。' },
    ],
    epilogue: '教学点：知道未来是外挂，理解人性才是本事。二周目事件漂移后，剩下能靠的只有专业与纪律。',
  },
};

/** 专业线门槛：主线完成率比例（固定比例，避免卷数扩充后绝对门槛漂移） */
export const QUEST_PRO_RATIO = 0.8;

/** 主判定：按优先级返回结局 id 与判定依据链 */
export function judgeEnding(inp: EndingInput): { id: EndingId; reasons: string[] } {
  const reasons: string[] = [];

  // 1) 调查立案（红线线，最高优先）
  if (inp.investigated || inp.violations >= 3) {
    reasons.push(`违规 ${inp.violations} 次 → 调查立案线`);
    return { id: 'investigation', reasons };
  }

  // 2) 猝死警示（过劳线：终局压力极高，或长期高压积累）
  if (inp.stress >= 90 || (inp.highStressMonths ?? 0) >= 60) {
    reasons.push(`压力 ${Math.round(inp.stress)}（高压月份 ${inp.highStressMonths ?? 0}）→ 过劳警示线`);
    return { id: 'burnout', reasons };
  }

  // 3) 隐藏结局：二周目 + 全主线 + 零违规 + 高信任
  const TOTAL_QUESTS = 82, EASTER_COUNT = 22;
  const legacy = inp.questsTotal <= TOTAL_QUESTS - EASTER_COUNT;
  const required = legacy ? inp.questsTotal : TOTAL_QUESTS;
  const questsAll = inp.questsTotal > 0 && inp.questsDone >= required;
  if (inp.newGamePlus && questsAll && inp.violations === 0 && inp.avgTrust >= 55 && inp.stress < 70) {
    reasons.push('二周目 + 全主线 + 零违规 + 信任 ≥55 → 重返投资界');
    return { id: 'reborn_investor', reasons };
  }

  const professional = inp.professional ?? 0;
  const salesPower = inp.salesPower ?? 0;
  const hasRouteAttrs = inp.professional !== undefined && inp.salesPower !== undefined;
  const professionalDominant = hasRouteAttrs && professional >= Math.max(1, salesPower) * 1.8;
  const managementDominant = !hasRouteAttrs || salesPower >= Math.max(1, professional) * 1.15;

  // 4) 管理线顶峰：高职级+业绩，并且没有形成显著的专业路线优势。
  // 旧档缺少两项能力值时 lead=0，沿用原先的管理判定。
  if (inp.grade >= 4 && inp.seasonScore >= 70 && managementDominant) {
    reasons.push(`职级 ${inp.grade}（私行团队主管）+ 考核 ${Math.round(inp.seasonScore)} + 管理/业绩取向 → 管理线顶峰`);
    return { id: 'division_gm', reasons };
  }

  // 5) 专业线：高信任+深耕；已到管理顶层时还需专业力显著领先销售力，
  // 避免所有高信任玩家都被同一个高优先级结局吞掉。
  const questRatio = inp.questsTotal > 0 ? inp.questsDone / inp.questsTotal : 0;
  if (inp.avgTrust >= 55 && inp.violations === 0 && questRatio >= QUEST_PRO_RATIO && (inp.grade < 4 || professionalDominant)) {
    const ratio = salesPower > 0 ? professional / salesPower : professional;
    reasons.push(`信任均值 ${inp.avgTrust.toFixed(0)} + 零违规 + 主线 ${inp.questsDone}/${inp.questsTotal} + 专业/销售 ${ratio.toFixed(2)} → 专业线`);
    return { id: 'independent', reasons };
  }

  // 6) 管理线：达到中高职级但未满足顶峰条件
  if (inp.grade >= 2) {
    reasons.push(`职级 ${inp.grade} → 管理线`);
    return { id: 'branch_manager', reasons };
  }

  // 7) 平凡退休：活着走完了二十年，但留不下波澜
  reasons.push(`职级 ${inp.grade}、信任 ${inp.avgTrust.toFixed(0)} → 平凡退休`);
  return { id: 'plain_retire', reasons };
}

/** 结局档案摘要（生涯档案页用） */
export function endingSummary(id: EndingId, inp: EndingInput): Array<string> {
  const end = ENDINGS[id];
  return [
    `结局：${end.title} —— ${end.tagline}`,
    `职级：${['见习理财经理', '普通理财经理', '贵宾理财经理', '私行理财经理', '私行团队主管'][Math.min(4, inp.grade)]}`,
    `AUM：${(inp.aum / 10000).toFixed(0)} 万 · 近 6 月考核：${Math.round(inp.seasonScore)} 分`,
    `客户信任均值：${inp.avgTrust.toFixed(0)} · 违规：${inp.violations} 次`,
    `主线：${inp.questsDone}/${inp.questsTotal} 章 · 人生线节点：${inp.lifelinesDone}`,
  ];
}
