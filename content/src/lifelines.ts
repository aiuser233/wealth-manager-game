/**
 * 完整客户人生线（P1 规划 3.4）："剧情即案例课"的示范线。
 * 王秀兰线（9 节点）：2006-2020，适当性/防诈/养老三支柱教学。
 * 李建国线（9 节点）：2006-2025，家庭生命周期/杠杆/断供/传承启动教学。
 * 何志敏线（9 节点）：2006-2025，年轻客群/职场新人/飞单案镜像/合规成长教学。
 * 与 VOLUME1_LIFELINES 中的重叠节点已合并（本表为全量版，替换旧表使用）。
 */
import type { LifeLineDef } from '@fm/core';

export const WANG_LIFELINE: LifeLineDef[] = [
  {
    client: 'cli_wangxl', year: 2006, month: 1,
    title: '王秀兰的存折',
    text: '王秀兰第一次来网点：密码忘了、儿子在外地、存折皱巴巴。这是 2006 年最常见的客户画像——老年人、储蓄习惯、对银行无条件的信任。你带她走挂失流程，顺手讲了利息税。',
    trustReq: 0,
    effects: { trust: 3, unlockKnowledge: ['deposit_insurance'] },
  },
  {
    client: 'cli_wangxl', year: 2007, month: 5,
    title: '疯牛里的儿子婚房钱',
    text: '王秀兰把儿子结婚的 15 万也搬进了股票基金——"隔壁楼的都赚了一半"。你面前是本案最重要的教学点：适当性不是不让她买，是让她买明白。',
    trustReq: 25,
    effects: { trust: 4, unlockKnowledge: ['risk_rating', 'chasing_high'] },
  },
  {
    client: 'cli_wangxl', year: 2007, month: 10,
    title: '6124：她要全部赎回',
    text: '指数冲上 6100，王秀兰兴冲冲来问"要不要把房子卖了追进去"。历史上这一幕之后是一整年的下跌。你的建议将被市场验证——无论说出口的是哪个。',
    trustReq: 35,
    effects: { trust: 3, unlockKnowledge: ['euphoria_top', 'take_profit'] },
  },
  {
    client: 'cli_wangxl', year: 2008, month: 10,
    title: '养老钱腰斩的冬天',
    text: '沪指 1664。王秀兰的基金亏了四成，她在电话里哭。这是理财经理真正的成人礼：稳情绪、讲逻辑、给方案，一样都不能少。',
    trustReq: 30,
    effects: { trust: 6, unlockKnowledge: ['crisis_communication'] },
  },
  {
    client: 'cli_wangxl', year: 2009, month: 3,
    title: '退休三桶金方案',
    text: '反弹让王秀兰回了一大口血，她正式提出退休规划需求："这些钱，你给我分成几份，我听你的。"四32万养钱分成三份：要花的、保命的、生钱的。',
    trustReq: 45,
    effects: { trust: 5, unlockKnowledge: ['retirement_plan', 'asset_allocation'] },
  },
  {
    client: 'cli_wangxl', year: 2011, month: 8,
    title: '负利率的追问',
    text: 'CPI 冲上 6.5%，王秀兰拿着存折来问："定期利息跑不赢菜价，这钱存着不是越存越穷？"负利率时代的沟通，从承认现实开始。',
    trustReq: 50,
    effects: { trust: 3, unlockKnowledge: ['negative_rate', 'inflation'] },
  },
  {
    client: 'cli_wangxl', year: 2013, month: 7,
    title: '被"宝宝类"吸引',
    text: '王秀兰的孙女教她用手机存了互联网货币基金："又灵活利息又高"。老客户第一次被渠道分流——你是挽留，还是坦然祝福并升级服务？',
    trustReq: 50,
    effects: { trust: 2, unlockKnowledge: ['money_fund', 'deposit_migration'] },
  },
  {
    client: 'cli_wangxl', year: 2015, month: 6,
    title: '15% 高息集资的诱惑',
    text: '邻居介绍王秀兰一个"养老理财项目"，年化 15%，还送鸡蛋和旅游。这是 2015-2018 年无数老人财富消失的起点。你的一次深谈，可能就是她全部的防线。',
    trustReq: 55,
    effects: { trust: 8, unlockKnowledge: ['fraud_alert', 'high_yield_trap'] },
  },
  {
    client: 'cli_wangxl', year: 2020, month: 9,
    title: '退休方案落地：感谢与传承',
    text: '十四年了。王秀兰退休金按时到账、保障齐全、还学会了看净值。她把孙女带来："以后我们家理财的事，就托付给你了。"——这就是理财经理这行的复利。',
    trustReq: 60,
    effects: { trust: 10, unlockKnowledge: ['third_pillar', 'succession'] },
  },
];

export const LI_LIFELINE: LifeLineDef[] = [
  {
    client: 'cli_liqiang', year: 2006, month: 6,
    title: '李建国的第一份定投',
    text: '28 岁的技术员李建国新婚，来网点主要是取工资。你跟他聊了"每月强制存 800 块定投"的计划——他半信半疑地开了户。年轻客户的第一课是习惯，不是收益。',
    trustReq: 0,
    effects: { trust: 3, unlockKnowledge: ['dca'] },
  },
  {
    client: 'cli_liqiang', year: 2009, month: 6,
    title: '购房 vs 投资：人生第一道大题',
    text: '三年定投攒下首付的一半，李建国两口子来问："是买房还是继续投资？"房价起飞前夜，这道题没有标准答案，只有"匹配他们的现金流"这一个解法。',
    trustReq: 25,
    effects: { trust: 5, unlockKnowledge: ['housing_vs_invest', 'family_lifecycle'] },
  },
  {
    client: 'cli_liqiang', year: 2011, month: 4,
    title: '二孩与教育金',
    text: '李建国家里添了二孩，妻子辞了职。家庭收入砍半、支出上台阶——满巢期的现金流压力来了。教育金和保障，哪个先上？',
    trustReq: 35,
    effects: { trust: 4, unlockKnowledge: ['education_fund', 'insurance_basics'] },
  },
  {
    client: 'cli_liqiang', year: 2013, month: 7,
    title: '利率市场化：转贷的算术题',
    text: '央行放开了贷款利率管制，李建国拿着邻居的"转贷省钱账"来问："我的房贷要不要也转？"利率市场化元年，存量按揭客户的第一个"再定价"问题。你给他算了手续成本、利率差额与重定价周期——省不省，算完才知道。',
    trustReq: 40,
    effects: { trust: 4, unlockKnowledge: ['debt', 'cashflow'] },
  },
  {
    client: 'cli_liqiang', year: 2015, month: 4,
    title: '邻居的配资神话',
    text: '李建国的邻居用场外配资三个月翻倍，换了大车。他来问你："我房子抵押了去配资怎么样？"——2015 年 4 月。两个月后市场会用最惨烈的方式回答这个问题。',
    trustReq: 45,
    effects: { trust: 5, unlockKnowledge: ['leverage_risk'] },
  },
  {
    client: 'cli_liqiang', year: 2015, month: 7,
    title: '断供边缘的求助电话',
    text: '股灾。李建国没听劝，还是配了一倍杠杆，现在保证金告急、房贷也快还不上。凌晨两点他的电话打进来。这一夜你怎么接，就是你们二十年的关系怎么写。',
    trustReq: 40,
    effects: { trust: 6, unlockKnowledge: ['forced_liquidation', 'crisis_communication'] },
  },
  {
    client: 'cli_liqiang', year: 2018, month: 8,
    title: 'P2P 里的血汗钱',
    text: '缓过劲来的李建国把积蓄放进了年化 11% 的 P2P 平台——"都三年了从没出过事"。七月的爆雷潮里他的平台倒了。他没脸来网点，但你先打了电话。',
    trustReq: 40,
    effects: { trust: 8, unlockKnowledge: ['fraud_alert'] },
  },
  {
    client: 'cli_liqiang', year: 2022, month: 4,
    title: '留学金保卫战',
    text: '李建国的孩子拿到海外 offer，学费 40 万。可这钱在 2021 年买的基金里，正浮亏 18%。"赎回就是实亏，不赎怕更亏"——2022 年 4 月的市场正砸在用钱时点上。',
    trustReq: 55,
    effects: { trust: 6, unlockKnowledge: ['liquidity_risk', 'family_lifecycle'] },
  },
  {
    client: 'cli_liqiang', year: 2025, month: 6,
    title: '从小李到老李：养老启动',
    text: '四十七岁的李建国来网点，第一句话是："还记得吗，2006 年你让我每月定投 800。"他给父母买过保险、给孩子办过留学金，现在轮到自己的养老三支柱了。一条客户线，就是一部家庭生命周期教材。',
    trustReq: 65,
    effects: { trust: 10, unlockKnowledge: ['third_pillar', 'pension_gap'] },
  },
];


/**
 * 周宏图企业主线（P5 第二批，9 节点 2006-2025）：
 * "剧情即案例课"的第三条示范线——企业主的家庭现金流与家企隔离教学。
 * 年代节点：粗放扩张(2008)→民间借贷危机(2011)→二胎与家企混同(2013)→质押危机(2018)→纾困转型(2019)→家办传承(2025)。
 */
export const ZHOU_LIFELINE: LifeLineDef[] = [
  {
    client: 'cli_zhout', year: 2006, month: 8,
    title: '建材厂老板的活期账户',
    text: '周宏图的厂子账上常年趴着 90 万活期——"流转快，懒得管"。你给他做的第一件事不是推销，是把公司备用金和家庭用钱分成两个账户。企业主的第一课：钱先分家，再谈收益。',
    trustReq: 0,
    effects: { trust: 3, unlockKnowledge: ['cash_mgmt'] },
  },
  {
    client: 'cli_zhout', year: 2008, month: 10,
    title: '危机里的订单与现金流',
    text: '全球金融危机，下游地产停工，货款回收周期从 60 天拖到 150 天。周宏图第一次体会到"利润是观点，现金流是事实"。你帮他做了 6 个月滚动现金流预测——厂子熬过去了。',
    trustReq: 20,
    effects: { trust: 5, unlockKnowledge: ['cashflow', 'systemic_risk'] },
  },
  {
    client: 'cli_zhout', year: 2011, month: 9,
    title: '过桥贷的诱惑',
    text: '信贷紧缩，银行抽贷，朋友介绍月息 3 分的"过桥资金"。他来问你意见时，合同已经在包里了。你拆给他看：年化 36%，抵押的是厂房。他撕了合同，多跑了两家银行。',
    trustReq: 30,
    effects: { trust: 6, unlockKnowledge: ['shadow_banking', 'leverage_risk'] },
  },
  {
    client: 'cli_zhout', year: 2013, month: 5,
    title: '二胎、厂房与个人卡',
    text: '二孩出生，妻子全职带娃。周宏图嫌对公转账麻烦，开始用个人卡收货款。你警告他"人格混同"，他摆摆手："厂子是我的。"——四年后他会想起这句话。',
    trustReq: 35,
    effects: { trust: 3, unlockKnowledge: ['risk_isolation', 'family_lifecycle'] },
  },
  {
    client: 'cli_zhout', year: 2015, month: 9,
    title: '股灾里的浮盈幻觉',
    text: '牛市顶点，周宏图把厂里 200 万流动资金搬进了股票账户——"厂里干一年不如股票三个月"。9 月股灾后资金腰斩，厂里进货的钱没了。这一课叫"经营资金与投资资金隔离"。',
    trustReq: 40,
    effects: { trust: 4, unlockKnowledge: ['leverage_risk', 'cashflow'] },
  },
  {
    client: 'cli_zhout', year: 2018, month: 6,
    title: '质押爆仓的深夜电话',
    text: '他 2016 年把股权质押给了信托计划，2018 年 6 月股价砸到平仓线。深夜来电时他声音发抖："小林，他们明天就要强平。"这是你职业生涯最重的一次家企联动救援。',
    trustReq: 50,
    effects: { trust: 8, unlockKnowledge: ['pledge_risk', 'risk_isolation'] },
  },
  {
    client: 'cli_zhout', year: 2019, month: 3,
    title: '纾困之后：合规改造',
    text: '纾困基金落地，厂房保住了。周宏图做的第一件事：注销个人卡收款的账户，请了专职会计，把公司财务和家庭资产彻底分账。"差点没了家"是最高效的合规教育。',
    trustReq: 55,
    effects: { trust: 6, unlockKnowledge: ['risk_isolation', 'employee_conduct'] },
  },
  {
    client: 'cli_zhout', year: 2022, month: 5,
    title: '女儿的留学与保单架构',
    text: '女儿拿到海外 offer。周宏图想一次性把 300 万打过去，你拦住了：留学金分年给付+保单架构+外汇合规路径。他笑着说："2006 年那个管我活期的年轻人，现在管我们全家了。"',
    trustReq: 60,
    effects: { trust: 6, unlockKnowledge: ['education_fund', 'insurance_basics'] },
  },
  {
    client: 'cli_zhout', year: 2025, month: 3,
    title: '二代接班与家族治理',
    text: '五十一岁的周宏图开始谈接班：女儿不想接厂子，想做设计。你陪他和女儿开了三次家庭会议，最后落成"家族宪章+职业经理人+家族信托"三件套。企业主客户线的终点，是治理，不是产品。',
    trustReq: 70,
    effects: { trust: 10, unlockKnowledge: ['family_office', 'succession'] },
  },
];

/**
 * 吴建国大众客群线（P5 增量，8 节点 2006-2024）：
 * "剧情即案例课"的第四条示范线——蓝领家庭的债务、保障与彩票式投机教学。
 * 年代节点：摩托换车梦(2007)→诱惑高息(2009)→孩子上学与保单(2012)→车祸与保险缺位(2015)→
 * 网贷危机(2018)→网约车冲击与副业(2020)→强制储蓄翻盘(2022)→儿子教育与豁免(2024)。
 */
export const WU_LIFELINE: LifeLineDef[] = [
  {
    client: 'cli_wuji', year: 2007, month: 6,
    title: '出租车司机的换车梦',
    text: '吴建国开夜班车攒了 8 万，想贷款 10 万换个新车跑长途。风险测评 R4、爱买彩票——他真正的需求是"回本快的路子"。你的第一课：先把"跑车的本钱"和"梦想的钱"分开。',
    trustReq: 0,
    effects: { trust: 3, unlockKnowledge: ['cashflow', 'suitability'] },
  },
  {
    client: 'cli_wuji', year: 2009, month: 7,
    title: '车队里的"高息传说"',
    text: '出租车队里传遍"放贷月息 3 分"的故事，有同行把营运证都押了进去。吴建国拿着 8 万来问。你给他算了借 10 万收 3 分息的人靠什么赚钱——他听完把存折收回了兜里。',
    trustReq: 15,
    effects: { trust: 5, unlockKnowledge: ['high_yield_trap', 'shadow_banking'] },
  },
  {
    client: 'cli_wuji', year: 2012, month: 9,
    title: '老大上学与第一份保单',
    text: '老大上初中、老二上小学，妻子的身体查出了问题。他第一次主动来网点——"给媳妇买份保险，还有娃上学的钱"。家庭责任顶点的配置：医疗险先于理财，一分钱都不该省。',
    trustReq: 25,
    effects: { trust: 6, unlockKnowledge: ['insurance_basics', 'education_fund'] },
  },
  {
    client: 'cli_wuji', year: 2015, month: 11,
    title: '车祸之后：保险缺位的代价',
    text: '夜班追尾，人没事、车报废、对方索赔 6 万。他没买足额三者险，积蓄一下去了三分之二。来网点时他说的第一句话："小林，去年你要我加保，我嫌贵。"这一课他替所有客户上的。',
    trustReq: 30,
    effects: { trust: 4, unlockKnowledge: ['insurance_basics', 'cashflow'] },
  },
  {
    client: 'cli_wuji', year: 2018, month: 9,
    title: '儿子给他下的"网贷套"',
    text: '上大学的儿子借了网贷，利滚利到 4 万，催收打到了车队。吴建国来网点时手都在抖。你陪他做了三件事：核实平台资质、报了 110、制定了还款计划。他说："丢人。"你说："这是所有家庭的必修课。"',
    trustReq: 40,
    effects: { trust: 8, unlockKnowledge: ['fraud_alert', 'debt'] },
  },
  {
    client: 'cli_wuji', year: 2020, month: 6,
    title: '网约车来了',
    text: '疫情+网约车双重冲击，一个月跑车收入腰斩。54 岁的吴建国第一次认真问你："我这岁数，还能怎么 plan B？"你陪他盘了盘：营运证转让价、妻子的小卖部、还有他跟了你十四年攒下的账户。',
    trustReq: 45,
    effects: { trust: 5, unlockKnowledge: ['income_structure', 'cashflow'] },
  },
  {
    client: 'cli_wuji', year: 2022, month: 8,
    title: '强制储蓄的翻盘',
    text: '转行做代驾+小卖部后，他给全家上了"发薪日储蓄"的机制——发工资当天自动转 30%。两年攒下 12 万，是他这辈子第一笔"没被花掉的钱"。他请你在小卖部吃了根冰棍："这就是复利吧？"',
    trustReq: 55,
    effects: { trust: 8, unlockKnowledge: ['self_control', 'dca'] },
  },
  {
    client: 'cli_wuji', year: 2024, month: 7,
    title: '儿子的第一份工资',
    text: '毕业的儿子拿到第一份工资，吴建国把他带到网点："当年我没管好自己，也没教好他。现在他的钱，你照着教我的那套来。"大众客户线的终点，是代际的改写。',
    trustReq: 60,
    effects: { trust: 10, unlockKnowledge: ['self_control', 'dca', 'third_pillar'] },
  },
];


/** 何志敏线（9 节点）：2006-2025，年轻客群/职场新人/飞单案镜像/从柜员到合规顾问的教学线。
 *  教学主题：定投启蒙 → 理财盲从 → 兄长飞单案的信任修复 → 合规与职业选择 → 二代客户与 AI 时代。
 */
export const HE_LIFELINE: LifeLineDef[] = [
  {
    client: 'cli_hezm', year: 2006, month: 4,
    title: '新同事的第一笔工资',
    text: '柜员岗的何志敏拿着第一个月 1800 元工资来问你："林老师，这钱放哪？"24 岁、单身、住家里——她是最典型的"理财白纸"：没有负债、没有经验、有的是时间这个最大的资产。',
    trustReq: 0,
    effects: { trust: 3, unlockKnowledge: ['dca', 'fund_basics'] },
  },
  {
    client: 'cli_hezm', year: 2007, month: 9,
    title: '同事都在买基金',
    text: '6124 之前的网点里，连保洁阿姨都在谈基金。何志敏问："大家都买，我不买是不是亏了？"你反问她："大家的钱和你的钱，目标一样吗？"从众是职场新人理财的第一课。',

    trustReq: 20,
    effects: { trust: 3, unlockKnowledge: ['herding', 'chasing_high'] },
  },
  {
    client: 'cli_hezm', year: 2009, month: 6,
    title: '熊市里的坚持',
    text: '她的定投浮亏 18%，坚持了 18 个月。今天她把对账单拍在桌上："林老师，我到底在坚持什么？"你给她看了定投的份额曲线——亏损的熊市里，她买到的是最便宜的份额。',
    trustReq: 30,
    effects: { trust: 5, unlockKnowledge: ['dca', 'self_control'] },
  },
  {
    client: 'cli_hezm', year: 2012, month: 6,
    title: '朋友圈卖产品的边界',
    text: '她接了行里的社交平台营销指标，问能不能在朋友圈发产品广告。你让她先想清楚三件事：能不能说收益、要不要报备、出了投诉谁负责。她在自己的朋友圈第一条写了风险提示。',
    trustReq: 40,
    effects: { trust: 4, unlockKnowledge: ['red_lines', 'employee_conduct'] },
  },
  {
    client: 'cli_hezm', year: 2016, month: 7,
    title: '兄长的案卷',
    text: '何俊飞单案移送司法，全行通报。她做了家属说明后提交了调岗申请："我是不是也该离开这一行？"你告诉她：哥哥踩的是红线，不是她的人生——把耻辱翻译成专业，才是真正的修复。',
    trustReq: 55,
    effects: { trust: 8, unlockKnowledge: ['employee_conduct', 'crisis_communication'] },
  },
  {
    client: 'cli_hezm', year: 2018, month: 5,
    title: '从柜员到合规专员',
    text: '她考过了合规岗位认证，转岗到合规部。第一件工作就是参与适当性检查——检查对象里，有你。她按流程指出了你的一份双录瑕疵，然后认真说了句"谢谢林老师当年教的"。制度与师恩，她分得很清。',
    trustReq: 60,
    effects: { trust: 5, unlockKnowledge: ['suitability', 'red_lines'] },
  },
  {
    client: 'cli_hezm', year: 2020, month: 9,
    title: '疫情期的家人账户',
    text: '她母亲的储蓄险到期，家里为"继续买保险还是买基金"吵翻了。她以合规专员的身份回避了自家单子，私下问你："这次，你可以只当我的顾问吗？"角色边界与专业信任，她都守住了。',
    trustReq: 65,
    effects: { trust: 5, unlockKnowledge: ['family_lifecycle', 'insurance_basics'] },
  },
  {
    client: 'cli_hezm', year: 2023, month: 4,
    title: 'AI 合规官的新课题',
    text: '行里上线智能投顾，她负责算法合规审查。她来找你做"人肉测试"：让 AI 给王秀兰出方案，看它会不会把 R4 产品推给 R2 客户。你们一起写下第一条 AI 销售红线：机器出初稿，人负全责。',
    trustReq: 70,
    effects: { trust: 5, unlockKnowledge: ['ai_advisor', 'suitability'] },
  },
  {
    client: 'cli_hezm', year: 2025, month: 8,
    title: '她带出了自己的徒弟',
    text: '合规部新来的年轻人问她："何姐，做合规是不是就是得罪人？"她想起 2006 年那个问"钱放哪"的自己："我哥教会我红线在哪，我师傅教会我专业长什么样。现在轮到我了。"年轻客群线的终点，是行业的下一代。',
    trustReq: 75,
    effects: { trust: 10, unlockKnowledge: ['team_coaching', 'red_lines'] },
  },
];

/** 人生线全量（王秀兰 9 + 李建国 9 + 周宏图 9 + 吴建国 8 + 何志敏 9 = 44 节点） */
export const LIFELINES_FULL: LifeLineDef[] = [...WANG_LIFELINE, ...LI_LIFELINE, ...ZHOU_LIFELINE, ...WU_LIFELINE, ...HE_LIFELINE];
