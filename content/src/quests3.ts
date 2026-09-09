import type { QuestDef } from '@fm/core';

/**
 * 卷三剧情（P5 第二批）：2016-2020，"从贵宾理财经理到私行理财经理"的五年。
 * 年代主线：熔断与汇率恐慌 → 金融去杠杆与资管新规 → 中美贸易战与股权质押危机 → 疫情与全球熔断 → 基金爆款。
 * 12 任务：资管新规净值化转型是贯穿卷三的行业变局；教学点对齐知识库 tag。
 */
export const VOLUME3_QUESTS: QuestDef[] = [
  {
    id: 'q3_01_fuse', volume: 3, title: '熔断首日：提前收盘', date: '2016-01-04',
    dialogues: [
      { speaker: '系统', text: '新年首个交易日，熔断机制实施首日即两次触发提前收盘。大厅里刚刚买完"开门红"产品的客户面面相觑。' },
      { speaker: '陈曼', text: '卷三开场。2015 年的伤疤还没结痂，2016 年第一天就补了一刀。开门红刚卖出去的基金，今天全部浮亏——你的柜台前站满了人。' },
    ],
    choices: [
      { text: '主动出击：逐户说明熔断机制与持仓影响，给出冷静期建议', outcome: '你把"熔断是什么"讲成了客户听得懂的话：不是世界末日，是保险丝。大厅情绪稳定下来。行长 noting：新来的贵宾经理有点东西。', grade: 'best', effects: { trust: 8, pro: 2, rep: 3 }, unlockKnowledge: ['circuit_breaker', 'panic'] },
      { text: '"机制问题，明天就好了"，轻描淡写带过', outcome: '话没错，但客户的账户明天继续跌。一周后的投诉里，有人记得你说过"没事"。', grade: 'normal', effects: { stress: 2, trust: -2 } },
      { text: '借机推"避险产品"', outcome: '跌停日推销"避险"，吃相被客户记住了。口碑这种东西，亏一次就见底。', grade: 'bad', effects: { sales: 1, rep: -3 } },
    ],
    teach: 'circuit_breaker',
  },
  {
    id: 'q3_02_fx_panic', volume: 3, title: '汇率贬值恐慌中的外币客户', date: '2016-01-12',
    dialogues: [
      { speaker: '周宏图', mood: 'normal', text: '小林，人民币这么贬，我把厂里流动资金都换成美元？朋友圈都说要贬到 7.5。' },
      { speaker: '陈曼', text: '（提醒）开年汇率急贬叠加熔断，"换汇保资产"成为中产标配焦虑。企业主的判断尤其容易被情绪带偏。' },
    ],
    choices: [
      { text: '拆解"贬值焦虑"：企业主的真实敞口是营收币种而非情绪', outcome: '你帮他算了账：他的原料进口付美元、产品出口收美元，天然对冲——换汇反而制造了新敞口。周宏图第一次觉得你"懂企业"。', grade: 'best', effects: { trust: 8, pro: 3 }, unlockKnowledge: ['fx_risk', 'cny'] },
      { text: '"别乱动，听国家的不吃亏"', outcome: '正确的话，错误的姿势。他去找了那位"懂汇率"的券商朋友。', grade: 'normal', effects: {} },
      { text: '顺势帮他全额换汇并推销美元理财', outcome: '单子成了，提成拿了。2017 年人民币转升，美元理财被套，他的电话打到了行长那里。', grade: 'bad', effects: { sales: 3, trust: -4, rep: -2 }, unlockKnowledge: ['fx_risk'] },
    ],
    teach: 'fx_risk',
  },
  {
    id: 'q3_03_fly单_arrest', volume: 3, title: '何俊的案卷', date: '2016-06-15',
    dialogues: [
      { speaker: '系统', text: '行内通报：邻支行客户经理何俊（何志敏之兄）因飞单 800 余万被移送司法。多名退休客户血本无归。' },
      { speaker: '何志敏', mood: 'sad', text: '林哥……我哥的事，行里让我做家属说明。我是不是也该离开银行这一行……' },
      { speaker: '陈曼', text: '2008 年他向你推销银信产品的那个下午，今天有了判决书。' },
    ],
    choices: [
      { text: '陪她做说明，并讲清"制度救的是所有人"', outcome: '你陪她过了一遍全部流程，告诉她：制度存在的意义，就是让"差点"的人停下来。她留下来了，后来成了支行的合规标兵。', grade: 'best', effects: { trust: 5, comm: 2, rep: 2 }, unlockKnowledge: ['employee_conduct', 'red_lines'] },
      { text: '"行业的灰暗面，早看透早离开"', outcome: '她真辞职了。两年后你在同业会上遇到她——在卖同样的"内部产品"，只是换了家公司。', grade: 'normal', effects: { stress: 1 } },
      { text: '"你哥蠢，你不会吧"，玩笑带过', outcome: '她勉强笑笑走了。那天的通报会，她缺席了。', grade: 'bad', effects: { trust: -5, comm: -1 } },
    ],
    teach: 'employee_conduct',
  },
  {
    id: 'q3_04_nav_transition', volume: 3, title: '净值化的第一只产品', date: '2017-11-20',
    dialogues: [
      { speaker: '陈曼', mood: 'serious', text: '总行通知：明年起试点净值型产品，"预期收益率"四个字要逐步退出历史舞台。你来做支行第一个卖净值型的人。' },
      { speaker: '王秀兰', mood: 'normal', text: '（首批客户）小林啊，这个"净值"和"预期收益"，到底有啥不一样？' },
    ],
    choices: [
      { text: '用"从看牌价到看行情"的比喻+历史回撤图讲透', outcome: '你用菜市场鱼价打比方：预期收益是"今天的牌价"，净值是"每天的实际成交价"。王秀兰第一个签字——她买的是"讲明白"。', grade: 'best', effects: { trust: 8, pro: 3, aum: 180000 }, unlockKnowledge: ['nav_product', 'wealth_nav_backtest'] },
      { text: '"差不多，就是名字变了"', outcome: '客户签了字，没懂产品。2022 年破净潮里，这批"没懂的客户"是投诉主力。', grade: 'normal', effects: { sales: 2, stress: 2 } },
      { text: '挑稳健老客户"练手"，只讲收益不讲波动', outcome: '业绩有了，雷埋下了。合规检查抽到你的双录，风险揭示环节"不充分"。', grade: 'bad', effects: { sales: 3, stress: 4, rep: -2 }, unlockKnowledge: ['dual_recording'] },
    ],
    teach: 'nav_product',
  },
  {
    id: 'q3_05_2018_trade', volume: 3, title: '贸易战开打：301 清单之夜', date: '2018-03-23',
    dialogues: [
      { speaker: '系统', text: '海外宣布对华加征关税清单，A股跳空重挫。新闻里"贸易摩擦"四个字将贯穿全年。' },
      { speaker: '王建平', text: '小林！ VIP 客户群里都在问要不要清仓跑路！你给我稳住！' },
    ],
    choices: [
      { text: '区分投机盘与配置盘：给配置客户讲"贸易战是慢变量"', outcome: '你把客户分成三类处理：短线降波动、配置讲逻辑、恐慌先安抚。全年下来，你的客户留存率全行第一。', grade: 'best', effects: { trust: 9, pro: 3, comm: 2 }, unlockKnowledge: ['policy_divergence', 'systemic_risk'] },
      { text: '统一群发"长期看好中国"模板', outcome: '信息发了，焦虑没接住。有客户回：你就知道喊口号。', grade: 'normal', effects: { stress: 2 } },
      { text: '自己也慌了，建议大客户清仓', outcome: '客户清仓了，2019 年初的反弹一个没赶上。你的"专业判断"成了群里两年的笑柄。', grade: 'bad', effects: { trust: -6, aum: -200000 } },
    ],
    teach: 'policy_divergence',
  },
  {
    id: 'q3_06_pledge_crisis', volume: 3, title: '股权质押爆仓：陈守业的电话', date: '2018-06-25', client: 'cli_chenlz',
    dialogues: [
      { speaker: '陈守业', mood: 'sad', text: '小林，我质押的股票今天到平仓线了。厂里还压着三个亿的订单回不了款……这是要把我三十年的家底全收走啊。' },
      { speaker: '陈曼', text: '（警报）2018 年股权质押危机全面爆发，上市公司大股东排队爆仓。你的私行客户，就在这批名单里。' },
    ],
    choices: [
      { text: '联动对公条线做纾困方案：补质押+展期+部分解押', outcome: '你拉了对公、法务、私行三方会议，方案落地。2019 年纾困基金入市，陈守业的企业活了。他后来把整个家族的金融业务都放在了你们支行。', grade: 'best', effects: { trust: 12, rep: 5, aum: 500000 }, unlockKnowledge: ['pledge_risk', 'risk_isolation'] },
      { text: '按流程提示补仓，别的不多管', outcome: '流程没错，但他需要的是方案不是通知。他找了券商的朋友，切走了半个资产盘子。', grade: 'normal', effects: { aum: -150000, stress: 2 } },
      { text: '趁机压价收购他的减持筹码', outcome: '吃绝户的操作。他记了你一辈子——以另一种方式。2020 年他翻身后，你在的这家银行从他的供应商名单里消失了。', grade: 'bad', effects: { sales: 2, rep: -6, trust: -10 } },
    ],
    teach: 'pledge_risk',
  },
  {
    id: 'q3_07_p2p_storm', volume: 3, title: 'P2P 爆雷潮的网点日', date: '2018-07-20',
    dialogues: [
      { speaker: '系统', text: 'P2P 平台连环爆雷，受害储户涌向网点咨询"我的钱怎么办"。柜面日均接待报损咨询 30+ 人次。' },
      { speaker: '赵树理', mood: 'sad', text: '小林，我一个老战友，把拆迁款全放那平台里了……人现在住进了医院。你们银行以前怎么不拦着点？' },
    ],
    choices: [
      { text: '设"防骗咨询专岗"，主动做社区反诈宣讲', outcome: '你们支行的反诈宣讲进了三个社区。两个月后，隔壁街道一个准备投 200 万的老人被宣讲内容拦了下来——他儿子专程送来锦旗。', grade: 'best', effects: { trust: 8, rep: 7, comm: 2 }, unlockKnowledge: ['fraud_alert', 'high_yield_trap'] },
      { text: '"那是网贷，跟我们银行没关系"', outcome: '切割式回应。话没错，但把"银行=安全"的最后信任也割掉了。', grade: 'normal', effects: { rep: -1 } },
      { text: '借机推销"我们 4% 的理财比他们强"', outcome: '灾难营销。截图被发上同城热搜，分行品牌部连夜打电话。', grade: 'bad', effects: { sales: 2, rep: -5, stress: 4 } },
    ],
    teach: 'fraud_alert',
  },
  {
    id: 'q3_08_new_gm_rules', volume: 3, title: '资管新规落地日', date: '2018-04-30',
    dialogues: [
      { speaker: '系统', text: '《关于规范金融机构资产管理业务的指导意见》正式发布：打破刚兑、净值化管理、消除多层嵌套。二十年的"理财=保本"时代进入倒计时。' },
      { speaker: '陈曼', mood: 'serious', text: '行业变天了。从今天起，"保本理财"这个词，你要从话术库里删掉。' },
    ],
    choices: [
      { text: '主动给存量客户开"新规说明会"，重签风险底稿', outcome: '你把新规讲成了"行业成人礼"：从今天起，买的是资产不是承诺。三分之一的客户当场完成风险重评，全支行转介绍第一。', grade: 'best', effects: { trust: 10, pro: 4, rep: 3 }, unlockKnowledge: ['nav_product', 'net_value_transition'] },
      { text: '等总行统一培训再动', outcome: '等待是把窗口让给别人。隔壁支行的说明会开到了你的客户头上。', grade: 'normal', effects: { stress: 1 } },
      { text: '"新规影响不大，该怎么卖还怎么卖"', outcome: '合规检查通报：话术库未更新、仍存在保本表述。这一条进了你年度档案。', grade: 'bad', effects: { stress: 4, rep: -2 }, unlockKnowledge: ['nav_product'] },
    ],
    teach: 'net_value_transition',
  },
  {
    id: 'q3_09_covid_crash', volume: 3, title: '2020：三千股跌停的线上开市日', date: '2020-02-03',
    dialogues: [
      { speaker: '系统', text: '春节后首个交易日，超三千只个股跌停。网点不营业，你的"柜台"变成了三十七个客户群。' },
      { speaker: '陈曼', text: '没有大厅，没有双录设备，只有手机。这一仗，打的是你十年攒下的信任底子。' },
    ],
    choices: [
      { text: '预案先行：早八点群发"我们在线"，分组派发持仓解读', outcome: '你凌晨写好了分组话术：养老金客户先安抚，定投客户讲纪律，重仓客户一对一电话。全天 87 通电话，没有一个客户恐慌性赎回。', grade: 'best', effects: { trust: 12, comm: 3, stress: 6 }, unlockKnowledge: ['panic', 'crisis_communication'] },
      { text: '等客户来问再说', outcome: '微信群的恐慌会自我繁殖。中午前，两个大客户在没有你的情况下割了肉。', grade: 'normal', effects: { aum: -100000, stress: 3 } },
      { text: '在群里发"历史证明每次都是机会"', outcome: '时点对、温度错。有人回：我爸妈的养老钱在里面，你跟我说历史？', grade: 'bad', effects: { trust: -6, comm: -1 } },
    ],
    teach: 'panic',
  },
  {
    id: 'q3_10_oil_negative', volume: 3, title: '负油价：中行"原油宝"的震撼教育', date: '2020-04-22',
    dialogues: [
      { speaker: '系统', text: '原油期货结算价史上首次跌至负值。某行挂钩原油产品"穿仓"事件刷屏：投资者亏光本金还倒欠银行钱。' },
      { speaker: '周宏图', mood: 'normal', text: '小林，你给我讲讲，油价怎么可能是负数？我朋友买了那个产品，现在还倒欠银行几十万？' },
    ],
    choices: [
      { text: '讲透"结算价+移仓+杠杆"三层机制，写一篇防雷科普', outcome: '你的科普长文在客户群转了三天。周宏图看完说："以后我看不懂的产品，一个都不碰。"——这句话，就是理财经理最大的业绩。', grade: 'best', effects: { trust: 9, pro: 4, rep: 6 }, unlockKnowledge: ['structured_product_risk', 'global_crisis'] },
      { text: '"那是别家银行的产品，我们不评价"', outcome: '标准话术，零价值。客户想知道的是原理，不是立场。', grade: 'normal', effects: {} },
      { text: '"所以赶紧买我们家的黄金"', outcome: '又是灾难营销。群里安静了一整天，周末，三个客户转走了资产。', grade: 'bad', effects: { sales: 1, rep: -4, aum: -150000 } },
    ],
    teach: 'structured_product_risk',
  },
  {
    id: 'q3_11_fund_star', volume: 3, title: '爆款基金与"顶流"经理', date: '2020-07-06',
    dialogues: [
      { speaker: '系统', text: '两市成交连续破万亿，新发基金动辄百亿，明星基金经理被"顶流"化。客户拿着短视频来问："这只基金三年五倍，梭哈吗？"' },
      { speaker: '孙丽云', mood: 'normal', text: '林哥，护士站都在讨论那个"坤坤"。我奖励自己的 20 万，全梭这只行不行？' },
    ],
    choices: [
      { text: '讲"规模是收益的敌人"+分批建仓+核心卫星', outcome: '你给她拆了"百亿基金"的建仓困境，设计核心卫星方案。2021 年初抱团瓦解时，她的组合回撤可控，还主动加了一笔定投。', grade: 'best', effects: { trust: 7, pro: 3, aum: 150000 }, unlockKnowledge: ['crowded_trade', 'fund_selection'] },
      { text: '"好基金经理，值得梭哈"', outcome: '她全仓了。2021 年春节后，"坤坤"回撤 25%，她的 20 万变成 15 万，护士站的笑话讲了半年。', grade: 'normal', effects: { sales: 2, trust: -2, stress: 2 } },
      { text: '"买基金不如买我们理财"', outcome: '两句错话：贬低基金+误导理财属性。她买了理财，从此不再跟你聊投资。', grade: 'bad', effects: { sales: 2, trust: -4 } },
    ],
    teach: 'crowded_trade',
  },
  {
    id: 'q3_12_vol3_end', volume: 3, title: '卷末：私行评审', date: '2020-09-18',
    dialogues: [
      { speaker: '王建平', mood: 'smile', text: '十五年。熔断、贸易战、爆雷、疫情，四个大坎你都站住了。总行的私行牌照岗位，给你留了位置。' },
      { speaker: '陈曼', mood: 'smile', text: '我也快退了。最后一课：私行服务的是"家族"，不是"账户"。这五年，你记住了什么？' },
      { speaker: '林奇安', text: '（选择你的回答——这决定你卷四传承篇章的起点与资源。）' },
    ],
    choices: [
      { text: '"帮客户看清结构，比帮客户赚钱更难，也更重要。"', outcome: '评审全票通过。你获得卷四资源：家办协作网络开通，法税专家入库，客户家族办公室需求直接转介给你。', grade: 'best', effects: { rep: 13 } },
      { text: '"穿越牛熊靠的是纪律，不是预测。"', outcome: '行长们赞许地点头。你获得"纪律"标签：大型客户信任 +，但对公资源倾斜一般。', grade: 'normal', effects: { trust: 8, sales: 3 } },
    ],
    teach: 'volume_end',
  },
];
