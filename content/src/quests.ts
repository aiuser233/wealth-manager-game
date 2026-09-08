import type { IsoDate } from '@fm/core';

/**
 * 主线剧情系统（M2 起步：卷一 2006–2008）。
 * QuestItem：按日期/条件触发的剧情任务，带对话演出与分支。
 * 客户人生线：核心客户在关键年份的剧情节点（王秀兰 2007 疯牛、2008 危机安抚等）。
 */

export interface QuestDialogue {
  speaker: string;
  text: string;
  /** 说话者情绪标签（立绘差分预留） */
  mood?: 'normal' | 'smile' | 'serious' | 'angry' | 'sad' | 'shock';
}

export interface QuestChoice {
  text: string;
  /** 分支评价与效果 */
  outcome: string;
  grade: 'best' | 'good' | 'normal' | 'bad';
  effects: {
    trust?: number;       // 对相关客户
    pro?: number;
    comm?: number;
    sales?: number;
    rep?: number;
    stress?: number;
    aum?: number;
    unlockKnowledge?: string[];
  };
  /** 分支解锁的知识词条（合入 effects.unlockKnowledge 的简写） */
  unlockKnowledge?: string[];
}

export interface QuestItem {
  id: string;
  /** 卷号（1=卷一） */
  volume: number;
  title: string;
  /** 触发日期（含） */
  date: IsoDate;
  /** 关联客户（可选） */
  client?: string;
  /** 前置任务 id（线性主线用） */
  requires?: string;
  dialogues: QuestDialogue[];
  choices: QuestChoice[];
  /** 教学点 */
  teach?: string;
  /** 完成后解锁的知识词条 */
  unlockKnowledge?: string[];
}

/** 卷一主线（2006–2008）：12 个任务 */
export const VOLUME1_QUESTS: QuestItem[] = [
  {
    id: 'q1_01_firstday', volume: 1, title: '入职第一天', date: '2006-01-03',
    dialogues: [
      { speaker: '陈曼', mood: 'smile', text: '新来的？我叫陈曼，这层楼的老人了。记住三件事：客户的钱不是你的胆子，话术不如台账，还有——晨会喊口号的时候别笑出声。' },
      { speaker: '林奇安', text: '（前世管 80 亿美元的人，如今要从喊口号学起……也好，这一世我想堂堂正正重来。）' },
      { speaker: '陈曼', text: '愣着干什么？去大堂，今天厅堂人多，先学着分流。' },
    ],
    choices: [
      { text: '认真观察大厅里的每一位客户', outcome: '陈曼瞥了你一眼："观察力不错，是个干这行的料。"', grade: 'best', effects: { comm: 1, pro: 1 } },
      { text: '默默背产品手册', outcome: '陈曼："背书谁不会？客户是人，不是考题。"', grade: 'normal', effects: { pro: 1 } },
    ],
    teach: 'suitability',
  },
  {
    id: 'q1_02_wangxl_first', volume: 1, title: '王秀兰的存折', date: '2006-01-12', client: 'cli_wangxl',
    dialogues: [
      { speaker: '王秀兰', text: '小林啊，我这存折密码忘了，儿子又在外地……这可怎么办哟。' },
      { speaker: '陈曼', text: '（小声）老年人业务，考验耐心。挂失要本人身份证，你带她走流程。' },
    ],
    choices: [
      { text: '全程陪同办理，顺手讲解利息税', outcome: '王秀兰拉着你的手连声道谢。你讲利息税时她听得认真："还是你们专业。"', grade: 'best', effects: { trust: 8, comm: 1 }, unlockKnowledge: ['deposit_insurance'] },
      { text: '指了指柜台方向', outcome: '她排了半小时队。之后见了你总是客客气气，却不再多聊。', grade: 'bad', effects: { trust: -3 } },
    ],
    teach: 'deposit_insurance',
  },
  {
    id: 'q1_03_fund_craze', volume: 1, title: '排队买基金的大厅', date: '2006-03-15',
    dialogues: [
      { speaker: '朱大同', text: '瞧见没，这队排到门口了。股票型基金一天卖几个亿，跟不要钱似的。' },
      { speaker: '王建平', mood: 'serious', text: '小林，行里下了基金销售任务。你去接待区，帮客户"把握机会"。' },
      { speaker: '林奇安', text: '（前世 2007 年这些排队的人后来怎么样，我记得清清楚楚……）' },
    ],
    choices: [
      { text: '卖，但只卖给测评合格且明白风险的人', outcome: '你给每位客户做了风险测评再谈产品。王行长皱眉："就你事多。"但客户签得踏实。', grade: 'best', effects: { trust: 4, rep: 2, sales: 1, aum: 50000 }, unlockKnowledge: ['risk_rating'] },
      { text: '完成任务要紧，来者不拒', outcome: '任务超额完成，王行长在晨会上点名表扬。陈曼却提醒你："签下的字，是以后的雷。"', grade: 'bad', effects: { sales: 2, aum: 120000, rep: -2, stress: 2 } },
    ],
    teach: 'suitability',
  },
  {
    id: 'q1_04_qiandd_millions', volume: 1, title: '钱进的十万拆迁款', date: '2006-05-20', client: 'cli_qiandd',
    dialogues: [
      { speaker: '钱进', text: '林哥！拆迁款到手一百五十万！你说买啥基金好？全买！就要收益最高的！' },
      { speaker: '陈曼', text: '（敲打）百万级客户，也是百万级的雷。他要是亏了，哭得最响。' },
    ],
    choices: [
      { text: '先做风险测评，再谈"收益最高"', outcome: '测评结果：R3。你按 4321 法则给他做了配置建议，只留三成仓位在权益。钱进嘟囔着"保守"，但还是签了。', grade: 'best', effects: { trust: 6, pro: 2, aum: 450000 }, unlockKnowledge: ['asset_allocation'] },
      { text: '他有钱又愿意，全仓高收益产品', outcome: '150 万全进了股票基金。2007 年你风光无限——但 2008 年的剧本你已经知道了。', grade: 'bad', effects: { sales: 3, aum: 1000000, stress: 3, rep: -3 } },
      { text: '劝他先留足自住房和应急钱', outcome: '钱进嫌你啰嗦，去别家问了。半年后基金大涨，他回头骂你胆小。你心里清楚：这一单没做，是对的。', grade: 'good', effects: { pro: 2, stress: 1 } },
    ],
    teach: 'suitability',
  },
  {
    id: 'q1_05_530', volume: 1, title: '5·30：深夜的印花税', date: '2007-05-30',
    dialogues: [
      { speaker: '系统', text: '凌晨，财政部突然宣布上调印花税。两市暴跌，数百只股票连续跌停。' },
      { speaker: '王秀兰', mood: 'sad', text: '小林！我那基金三天跌了这么多……我儿子结婚的钱都在里面啊！' },
      { speaker: '陈曼', mood: 'serious', text: '记住这一刻。疯牛里学会的教训，比十场培训都值钱。' },
    ],
    choices: [
      { text: '一个个电话打过去，讲清波动来源', outcome: '你打了一天电话，嗓子哑了。多数客户选择持有。王秀兰说："有你这句话，我睡得着。"', grade: 'best', effects: { trust: 10, comm: 2, stress: 4 }, unlockKnowledge: ['stamp_duty', 'chasing_high'] },
      { text: '发条短信统一安抚', outcome: '短信模板谁都会发。有客户打电话来质问："你就发个短信？"信任悄悄裂了缝。', grade: 'normal', effects: { trust: 2, stress: 2 } },
    ],
    teach: 'chasing_high',
  },
  {
    id: 'q1_06_6100_top', volume: 1, title: '6124：疯狂的顶点', date: '2007-10-17',
    dialogues: [
      { speaker: '朱大同', text: '六千一百点了！营业部的大爷大妈都在讨论股票，报纸头版全是牛市！' },
      { speaker: '陈曼', mood: 'serious', text: '我在这个行当十一年，只见过山顶的风景，没见过山顶的人全身而退。' },
      { speaker: '林奇安', text: '（前世记忆：这里是 6124。接下来是一路向下的一年。）' },
    ],
    choices: [
      { text: '提醒大额客户分批止盈', outcome: '有客户嫌你扫兴，但老客户们默默减了仓。陈曼点头："该说的话说了，剩下的看命。"', grade: 'best', effects: { trust: 8, pro: 3, stress: 2 }, unlockKnowledge: ['euphoria_top'] },
      { text: '趁热打铁冲业绩', outcome: '十月业绩冲上支行第一。庆功宴上你举杯的手，微微发抖。', grade: 'bad', effects: { sales: 3, aum: 300000, stress: 3, rep: 1 } },
    ],
    teach: 'euphoria_top',
  },
  {
    id: 'q1_07_qdii_loss', volume: 1, title: '出海折戟：QDII 之痛', date: '2007-11-20',
    dialogues: [
      { speaker: '周宏图', mood: 'angry', text: '你们说的出海基金，三个月亏了 15%？！这就是你们银行的水平？' },
      { speaker: '陈曼', text: '（小声）别急着辩解，先把产品结构讲清楚。他骂的是亏钱，你要给的是逻辑。' },
    ],
    choices: [
      { text: '复盘产品结构：港股 QDII+汇率双风险', outcome: '你摊开材料逐项拆解。周宏图骂完，静静听完，最后说："下次上产品，先给我打预防针。"', grade: 'best', effects: { trust: 6, pro: 2, comm: 1 }, unlockKnowledge: ['qdii_risk'] },
      { text: '避而不谈，等风头过去', outcome: '周宏图把剩余资金转去了别家。何俊倒是趁机挖了你的客户——他向来不讲武德。', grade: 'bad', effects: { trust: -6, aum: -500000, stress: 3 } },
    ],
    teach: 'qdii_risk',
  },
  {
    id: 'q1_08_1664', volume: 1, title: '1664：至暗时刻', date: '2008-10-29',
    dialogues: [
      { speaker: '系统', text: '沪指跌破 1700 点，一年跌去七成。网点冷清，客户电话里带着哭腔。（正文由下方补全逻辑注入）' },
    ],
    choices: [
      { text: '占位', outcome: '占位', grade: 'normal', effects: {} },
    ],
  },
  {
    id: 'q1_09_hejun_risk', volume: 1, title: '何俊的"内部消息"', date: '2008-11-20',
    dialogues: [
      { speaker: '何俊', mood: 'smile', text: '兄弟，我手上有个银信合作的产品，保底 8%，帮我卖点？返点好说。' },
      { speaker: '林奇安', text: '（前世他就是栽在这上面。这一世……我看着他在我面前重复一遍。）' },
    ],
    choices: [
      { text: '严词拒绝："这不是返点，是案底。"', outcome: '何俊讪讪而去。陈曼听到了全程，什么也没说，第二天你的桌上多了一本合规手册。', grade: 'best', effects: { rep: 3, pro: 1 }, unlockKnowledge: ['red_lines'] },
      { text: '不参与，但也不上报', outcome: '你保全了自己，却没有阻止他。2013 年的档案里会有他这一笔——那时你会想起今天的沉默。', grade: 'normal', effects: { stress: 1 } },
      { text: '参与一单试试', outcome: '红线在脚下延伸。这一单的返点，你要用整个职业生涯来还。', grade: 'bad', effects: { sales: 2, stress: 4 }, unlockKnowledge: ['red_lines'] },
    ],
    teach: 'red_lines',
  },
  {
    id: 'q1_10_4trillion', volume: 1, title: '四万亿：V 型反转', date: '2008-11-11',
    dialogues: [
      { speaker: '系统', text: '四万亿投资计划公布，货币宽松全面开启。市场应声暴涨。' },
      { speaker: '王建平', mood: 'smile', text: '机会来了！信贷任务翻倍，存款立行！小林，今年开门红就看你的了！' },
    ],
    choices: [
      { text: '趁机帮深套客户做"补仓回本"方案', outcome: '你给深套的客户设计了补仓与调结构方案。反弹开始时，他们回血的速度比谁都快。', grade: 'best', effects: { trust: 8, pro: 2, aum: 200000 }, unlockKnowledge: ['policy_stimulus'] },
      { text: '全力冲存款任务', outcome: '存款时点数据漂亮，行长满意。但客户的基金还深套着——回本那天他们会记得你做了什么。', grade: 'normal', effects: { sales: 2, rep: 1, aum: 100000 } },
    ],
    teach: 'policy_stimulus',
  },
  {
    id: 'q1_11_wangxl_2009', volume: 1, title: '王秀兰的退休规划', date: '2009-03-10', client: 'cli_wangxl',
    dialogues: [
      { speaker: '王秀兰', mood: 'smile', text: '小林，我明年就退休了。这大半辈子攒的钱，你给我参谋参谋，怎么安排稳妥？' },
      { speaker: '陈曼', text: '（提醒）养老钱三原则：保本、现金流、别碰看不懂的。她信你，这是福气也是责任。' },
    ],
    choices: [
      { text: '定存+国债+低波理财的养老组合', outcome: '你把她的钱按"要花的/保命的/生钱的"分了三份。王秀兰说："比你叔自己炒股强多了。"', grade: 'best', effects: { trust: 8, pro: 2, aum: 150000 }, unlockKnowledge: ['retirement_plan'] },
      { text: '推荐当时收益最高的三年期定存', outcome: '稳是稳了，但通胀一高，实际购买力缩水。这是 2011 年你会被问起的问题。', grade: 'normal', effects: { trust: 3, aum: 100000 } },
    ],
    teach: 'retirement_plan',
  },
  {
    id: 'q1_12_vol1_end', volume: 1, title: '卷末：晋升评审', date: '2009-06-15',
    dialogues: [
      { speaker: '王建平', text: '三年了。从喊口号的新人，到能扛任务的骨干。评审材料我看了，合规记录干净。' },
      { speaker: '陈曼', mood: 'smile', text: '说点什么吧，徒弟。这一卷，你学到的最重要的一课是什么？' },
      { speaker: '林奇安', text: '（选择你的回答——这会影响你卷二的开局心态。）' },
    ],
    choices: [
      { text: '"敬畏市场，守住客户。"', outcome: '陈曼大笑："行，出口气不粗，心气也正。"你获得了"稳健开局"：信任与口碑加成。', grade: 'best', effects: { rep: 5, trust: 5 } },
      { text: '"业绩才是硬道理。"', outcome: '王行长满意地点头。陈曼没说话。卷二的高压任务会更重——你选的路线，你自己走。', grade: 'normal', effects: { sales: 3, stress: 2 } },
    ],
    teach: 'volume_end',
  },
];

// 补全 q1_08（覆盖占位内容）
Object.assign(VOLUME1_QUESTS[7], {
  dialogues: [
    { speaker: '系统', text: '沪指跌破 1700 点，一年跌去七成。网点冷清，客户电话里带着哭腔。' },
    { speaker: '赵树理', mood: 'sad', text: '小林师傅，我那 40 万养老钱……还剩多少？我不敢看账户了。' },
    { speaker: '陈曼', mood: 'serious', text: '现在是真正的考验。牛市里人人都是理财经理，谷底里才看得出谁是专业的。' },
  ],
  choices: [
    { text: '逐户盘点：先稳情绪，再谈"能做什么"', outcome: '你花了一周给每位亏损客户做了持仓盘点与现金流评估。有人割肉，有人持有，但没人觉得被抛弃。', grade: 'best', effects: { trust: 12, comm: 2, stress: 5, pro: 2 }, unlockKnowledge: ['crisis_communication', 'systemic_risk'] },
    { text: '"市场就是这样，您自己决定吧。"', outcome: '专业上没错。但客户记住的是那一周里，谁握过他的手。', grade: 'bad', effects: { trust: -5, stress: 2 } },
  ],
  teach: 'crisis_communication',
} as Partial<(typeof VOLUME1_QUESTS)[number]>);

/** 客户人生线节点（卷一）：客户在各年份的关键剧情 */
export interface LifeLineNode {
  client: string;
  year: number;
  month?: number;
  title: string;
  text: string;
  /** 触发条件：信任 ≥ x */
  trustReq?: number;
  effects: { trust?: number; aum?: number; unlockKnowledge?: string[] };
}

export const VOLUME1_LIFELINES: LifeLineNode[] = [
  { client: 'cli_liqiang', year: 2009, month: 6, title: '李建国的购房抉择', text: '李建国两口子攒够了首付，来问："是提前还贷，还是继续定投？"这是家庭生命周期配置的第一道大题。', trustReq: 40, effects: { trust: 5, unlockKnowledge: ['housing_vs_invest'] } },
  { client: 'cli_sunly', year: 2007, month: 9, title: '孙丽云的教育金', text: '孙丽云的儿子要上小学了，她想把年终奖换成教育金——保障先行的家庭，运气都不会太差。', trustReq: 30, effects: { trust: 4, unlockKnowledge: ['education_fund'] } },
  { client: 'cli_zhout', year: 2008, month: 6, title: '周宏图的钱荒预警', text: '建材生意资金链吃紧，周宏图来问大额资金怎么放。"企业主的现金流，永远是第一命门。"', trustReq: 35, effects: { trust: 4, unlockKnowledge: ['cash_mgmt'] } },
  { client: 'cli_chenlz', year: 2009, month: 11, title: '陈守业的接班人问题', text: '陈守业的儿子回国了。老爷子第一次主动提起："企业和我这些钱，以后都是他的。你说怎么安排？"——传承的种子发芽了。', trustReq: 45, effects: { trust: 5, unlockKnowledge: ['succession'] } },
];
