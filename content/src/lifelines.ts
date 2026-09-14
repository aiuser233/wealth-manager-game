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


/** 周远航线（9 节点）：2015-2025，00 后徒弟线（与团队系统 sub_zhouyh 同人同弧）。
 *  教学主题：少年股民 → 大学生虚拟盘 → 新人冲业绩与红线 → AI 原住民的质询 → 从冒进到分寸 → 独当一面。
 */
export const ZHOuyh_LIFELINE: LifeLineDef[] = [
  {
    client: 'cli_zhouyh', year: 2015, month: 7,
    title: '跟着舅舅看盘的初中生',
    text: '2015 年 6 月股灾，营业部里一个初中生盯着大屏看了一下午。周远航，11 岁，舅舅是老股民。"叔叔，为什么大家都在卖，昨天还在赚？"杠杆的第一次目击，刻在了一个孩子眼里。',
    trustReq: 0,
    effects: { trust: 2, unlockKnowledge: ['leverage_risk', 'forced_liquidation'] },
  },
  {
    client: 'cli_zhouyh', year: 2018, month: 8,
    title: '十四岁的模拟盘',
    text: '14 岁的周远航开了模拟盘，三个月收益率跑赢了你大半个网点。他得意地问你服不服。你问他："如果这是真钱，第几天你会睡不着？"风险承受力不等于收益率，这是他记下的第一课。',
    trustReq: 10,
    effects: { trust: 3, unlockKnowledge: ['risk_rating', 'self_control'] },
  },
  {
    client: 'cli_zhouyh', year: 2022, month: 10,
    title: '大学生的第一笔实盘',
    text: '18 岁生日刚过，他拿奖学金开了实盘账户，买了热搜第一的基金，一个月浮亏 12%。他来找你时嘴硬："技术性回调。"你只问了一句："这笔钱，是你下学期的生活费吗？"',
    trustReq: 20,
    effects: { trust: 4, unlockKnowledge: ['chasing_high', 'attention'] },
  },
  {
    client: 'cli_zhouyh', year: 2024, month: 3,
    title: '入职：你带的新下属',
    text: '00 后理财经理周远航入职，分给你带。单产冒尖、花样频出、双录总想省步骤——"前辈，这些流程 AI 都能替代了，客户要的是结果。"业绩冲动型的画像与你 2006 年见过的何俊，重合得让你警惕。',
    trustReq: 30,
    effects: { trust: 4, unlockKnowledge: ['team_coaching', 'red_lines'] },
  },
  {
    client: 'cli_zhouyh', year: 2024, month: 9,
    title: '9·24 之夜的冲动',
    text: '政策组合拳引爆行情，他连夜给 80 个客户群发"满仓短信"。你拦下了第 81 条："短信里那个「稳」字，敢写进双录吗？"他盯着屏幕看了很久，删掉了整段话。行情越火，纪律越值钱。',
    trustReq: 45,
    effects: { trust: 5, unlockKnowledge: ['policy_stimulus', 'chasing_high'] },
  },
  {
    client: 'cli_zhouyh', year: 2025, month: 1,
    title: 'AI 原住民的质询',
    text: '行里 AI 助手全面上线。他在晨会上当众问出那个问题："前辈，AI 三秒出方案，我们还有什么用？"全网点安静。你把 2023 年何志敏写的 AI 红线递给他："机器管效率。王秀兰的儿子在外地这件事，机器不知道。"',
    trustReq: 55,
    effects: { trust: 6, unlockKnowledge: ['ai_advisor', 'team_coaching'] },
  },
  {
    client: 'cli_zhouyh', year: 2025, month: 6,
    title: '第一次拦住自己',
    text: '他发现一张单子的客户测评快到期、风险等级又对不上——没人看见，签了就是单产。他自己做了"超风险特别程序"并跑来向你报备。你批了，然后说："这不是流程，这是你在这行的立足点。"',
    trustReq: 65,
    effects: { trust: 8, unlockKnowledge: ['suitability', 'red_lines'] },
  },
  {
    client: 'cli_zhouyh', year: 2025, month: 12,
    title: '出师答辩',
    text: '带教满 18 个月，能力考核出师。答辩最后一题他答的是："带教教我的第一课是什么？"他说："师傅让我把每张单子想象成有人会拿着它来找我哭。"你在台下，想起了 2006 年的陈曼看着你。',
    trustReq: 75,
    effects: { trust: 10, unlockKnowledge: ['team_coaching'] },
  },
];


/** 陈曼线（9 节点）：2006-2025，师父线——从带教者到同路人，兼教学"理财经理自己的人生账"。
 *  与剧情中陈曼的出场（卷一教学/卷五返聘）互为映照；她是客户，也是这行的活教材。
 */
export const CHENMAN_LIFELINE: LifeLineDef[] = [
  {
    client: 'cli_chenman', year: 2006, month: 6,
    title: '师父自己买什么',
    text: '带了你半年的陈曼，自己的 80 万金融资产却配得毫无亮点：存款+国债+一份重疾。"教人的人不炒股？"她说："我见过 2001 年的 2245。我教你们管别人的钱，先得管好自己的心跳。"',
    trustReq: 0,
    effects: { trust: 3, unlockKnowledge: ['asset_allocation', 'self_control'] },
  },
  {
    client: 'cli_chenman', year: 2008, month: 5,
    title: '婚礼上的周期议题',
    text: '她结婚。喜糖盒里塞着一张纸条给你："经济周期和婚姻一样，重要资产要长期持有，但每年都要体检。"全网点都笑，你知道她是认真的——她把重疾险受益人改成了丈夫。',
    trustReq: 20,
    effects: { trust: 3, unlockKnowledge: ['insurance_basics', 'family_lifecycle'] },
  },
  {
    client: 'cli_chenman', year: 2010, month: 6,
    title: '女儿的出生与教育金',
    text: '女儿出生。她拿出一份手写表格：教育金 18 年 60 万按 5% 折现，现在每月要存 1900。"我天天教人算这个，轮到自己才明白：规划不是算术，是自律。"',
    trustReq: 35,
    effects: { trust: 4, unlockKnowledge: ['education_fund', 'dca'] },
  },
  {
    client: 'cli_chenman', year: 2013, month: 9,
    title: '跳槽的诱惑',
    text: '第三方财富公司开三倍薪水挖她。她把 offer 拿给你看："他们卖的产品我都不敢给妈买。"最终她留下了。"钱挣多少是够？客户信任攒了八年，搬不走。"',
    trustReq: 45,
    effects: { trust: 5, unlockKnowledge: ['high_yield_trap', 'suitability'] },
  },
  {
    client: 'cli_chenman', year: 2015, month: 9,
    title: '股灾里的她',
    text: '三轮股灾，她的客户一个都没伤到——因为 2007 年她就给每个客户画了风险预算线。她自己 40% 的基金仓位跌掉 15%，面不改色地再平衡。"年轻人，这就是当年我教你的第一课的利息。"',
    trustReq: 55,
    effects: { trust: 5, unlockKnowledge: ['rebalancing', 'crisis_communication'] },
  },
  {
    client: 'cli_chenman', year: 2019, month: 4,
    title: '升任财富管理部副总',
    text: '她升任分行财富管理部副总，管全区理财经理。第一天给她以前的客户（包括你）发了同一条短信："我的手机号没变。"位置越高，她越明白：她真正的资产名单没变过。',
    trustReq: 60,
    effects: { trust: 4, unlockKnowledge: ['team_coaching'] },
  },
  {
    client: 'cli_chenman', year: 2021, month: 2,
    title: '她也被顶流基金套过',
    text: '抱团瓦解，她 2020 年跟风买的"网红基金"回撤 28%。她主动在部门会上把这单当反面教材："我看报表看了二十年，也会被故事打动。所以永远不要觉得客户蠢，要帮他建制度。"',
    trustReq: 65,
    effects: { trust: 5, unlockKnowledge: ['crowded_trade', 'take_profit'] },
  },
  {
    client: 'cli_chenman', year: 2023, month: 10,
    title: '退休返聘与传承',
    text: '她退休返聘，做新人培训师。第一课点名让你去讲。你在她当年的教室讲适当性，她在最后一排听课记笔记。下课后她说："我把 2006 年的教案给了你，现在你把它变成你自己的了。"',
    trustReq: 70,
    effects: { trust: 6, unlockKnowledge: ['team_coaching', 'suitability'] },
  },
  {
    client: 'cli_chenman', year: 2025, month: 10,
    title: '师徒账本',
    text: '她拿出一本泛黄的笔记本——2006 年以来她给每个客户、每个学生记的"人生账"。"这行最公平：你存进别人人生的，复利最高。"她把笔记本复印了一本给你。师父线的终点，是传承的完成。',
    trustReq: 80,
    effects: { trust: 10, unlockKnowledge: ['succession', 'team_coaching'] },
  },
];

/** 唐薇线（8 节点）：2013-2025，年轻客群线——从大学生到互联网新中产的行为金融教学线。
 *  与卷三/卷四剧情（止盈/抱团/破净）联动；她是"数字原生代投资者"的样本。
 */
export const TANGWEI_LIFELINE: LifeLineDef[] = [
  {
    client: 'cli_tangwei', year: 2013, month: 6,
    title: '大学生与她的第一只宝宝类',
    text: '唐薇，2006 年还在读高中，2013 年大学实习第一次发工资。她拿着手机问："学长说这个比银行利息高，真的假的？"你是她人生第一个"金融客服"。你讲了流动性收益三角，她开了人生第一个理财户。',
    trustReq: 0,
    effects: { trust: 3, unlockKnowledge: ['money_fund', 'deposit_migration'] },
  },
  {
    client: 'cli_tangwei', year: 2015, month: 4,
    title: '牛市里的兼职收入',
    text: '她把实习攒的 3 万全买了基金——室友都在买。4 月她浮盈 30%，5 月她想辞职专职炒股。你让她算了一笔账：工资现金流 vs 账户波动。"输不起的钱，别给它上杠杆般的期待。"',
    trustReq: 15,
    effects: { trust: 3, unlockKnowledge: ['chasing_high', 'herding'] },
  },
  {
    client: 'cli_tangwei', year: 2015, month: 9,
    title: '股灾后的骂声',
    text: '她的 3 万变 1.8 万。她冲进网点时在哭："你们银行的人都是骗子！"你递上纸巾，然后把 2015 年 4 月的谈话记录翻出来给她看。她看完沉默很久："当时你劝了，是我自己不听。"',
    trustReq: 25,
    effects: { trust: 4, unlockKnowledge: ['crisis_communication', 'self_control'] },
  },
  {
    client: 'cli_tangwei', year: 2018, month: 10,
    title: '工作三年的定投重启',
    text: '互联网运营月薪 1.5 万。她主动来找你："这次按你说的来。"发薪日自动定投，3 年下来的第 100 期她截图发你："原来坚持比预测简单。"',
    trustReq: 35,
    effects: { trust: 5, unlockKnowledge: ['dca', 'self_control'] },
  },
  {
    client: 'cli_tangwei', year: 2021, month: 3,
    title: '抱团基金腰斩',
    text: '2020 年她重仓"顶流"基金，春节后回撤 30%。群里都说要补仓，她第一次学你的话反问群里："回撤来源查了吗？"她来做归因：风格拥挤+估值极值。这回，她没有恐慌赎回。',
    trustReq: 50,
    effects: { trust: 6, unlockKnowledge: ['crowded_trade', 'nav_drawdown_read'] },
  },
  {
    client: 'cli_tangwei', year: 2022, month: 11,
    title: '理财破净与她的第一次转介绍',
    text: '破净潮里她妈的 R2 理财回撤，她替母亲来问。你做了完整归因演示，她说："能不能给我妈也讲一遍？"那场家庭视频会议后，她母亲成了你的客户。年轻客户的终局价值：她带你进她的家庭。',
    trustReq: 60,
    effects: { trust: 6, unlockKnowledge: ['family_lifecycle', 'crisis_communication'] },
  },
  {
    client: 'cli_tangwei', year: 2024, month: 5,
    title: '新房贷与家庭账本',
    text: '她要结婚了，首付+房贷+彩礼三线作战。她带来一份自己做的 Excel："你看看我这个资产负债表及格吗？"从 2013 年的"学长说"到自建账本，十一年，一个数字原生代的理财成人礼。',
    trustReq: 70,
    effects: { trust: 5, unlockKnowledge: ['housing_vs_invest', 'family_lifecycle'] },
  },
  {
    client: 'cli_tangwei', year: 2025, month: 9,
    title: '她开始给同事讲配置',
    text: '公司在搞理财讲座请她分享，她把你的四笔钱框架讲给 300 个年轻人，PPT 最后一页写着你 2015 年对她说过的话："输不起的钱，别给它杠杆般的期待。"她@了你。年轻客群线的终点：她成了传播节点。',
    trustReq: 80,
    effects: { trust: 10, unlockKnowledge: ['asset_allocation', 'third_pillar'] },
  },
];

export const JIANGYU_LIFELINE: LifeLineDef[] = [
  {
    client: 'cli_d_exfunds', year: 2013, month: 3,
    title: '从卖方到买方：新基金经理的第一只产品',
    text: '姜屿，2006 年时还是券商研究所的资深研究员，2013 年 40 岁跳槽到公募做基金经理。发产品前他来网点办个人账户，聊起风格："我做了十年研究，这次管真金白银。"你问他回撤预案，他愣了一下："公募不就是做相对收益吗？"——你记下了这句话，七年后它会应验。',
    trustReq: 0,
    effects: { trust: 3, unlockKnowledge: ['fund_evaluation', 'fund_basics'] },
  },
  {
    client: 'cli_d_exfunds', year: 2015, month: 7,
    title: '股灾中的流动性螺旋',
    text: '他的成长基金连吃跌停，持仓小票根本卖不出去——先跌停的先跑，跑不掉的全套住。他深夜来网点取自己账户里的钱应急，苦笑："我在给别人管流动性，自己的流动性先没了。"你陪他把赎回顺序理了一遍。他记住了：危机关头，资产和负债要分开看。',
    trustReq: 10,
    effects: { trust: 4, unlockKnowledge: ['forced_liquidation', 'systemic_risk'] },
  },
  {
    client: 'cli_d_exfunds', year: 2017, month: 6,
    title: '风格切换里的排名焦虑',
    text: '2016-2017 年小票持续失血，大盘蓝筹走强。他重仓小盘成长，排名掉进后三分之一，公司开始给他做"归因辅导"。他来网点转转账，顺口问你："你说散户都买「茅指数」了，我们这种做小票的还有活路吗？"你把风格箱讲给他听——他也反过来讲给你听，两个"同行"第一次平等对话。',
    trustReq: 20,
    effects: { trust: 4, unlockKnowledge: ['rotation', 'k_style_box'] },
  },
  {
    client: 'cli_d_exfunds', year: 2019, month: 8,
    title: '抱团的形成：他也是参与者',
    text: '核心资产行情起来了，他的新基金清仓式买入消费白马。"不是我不知道贵，是考核就要这个。"他坦白抱团的机制：季度排名逼着大家买一样的票，越买越涨、越涨越买。你问他拥挤了怎么办，他说："音乐停之前谁都不想先下场。"',
    trustReq: 30,
    effects: { trust: 4, unlockKnowledge: ['herding', 'crowded_trade'] },
  },
  {
    client: 'cli_d_exfunds', year: 2021, month: 3,
    title: '抱团瓦解：基金净值与骂声一起落',
    text: '春节后他的基金一个月回撤 28%，赎回潮来了——基民在最该扛的时候集体割肉，他在最该减仓的时候被排名绑住。他给你看持有人结构："散户平均持有 41 天，我做的所有研究，他们 41 天就走完了。"你第一次听基金经理说：这个行业的痛点是期限错配。',
    trustReq: 40,
    effects: { trust: 5, unlockKnowledge: ['crowded_trade', 'nav_drawdown_read'] },
  },
  {
    client: 'cli_d_exfunds', year: 2021, month: 11,
    title: '离开：公奔私还是离开行业',
    text: '他递了辞职信，没去私募。"管了八年别人的钱，我想先搞明白钱到底是什么。"他注销了部分仓位，把大头换成债基和存款，只留一只定投。网点柜台再见他，已经不是基金经理，是一个来办定期转存的普通中年人。他说这叫"向下兼容"。',
    trustReq: 50,
    effects: { trust: 5, unlockKnowledge: ['cashflow', 'cash_mgmt'] },
  },
  {
    client: 'cli_d_exfunds', year: 2023, month: 6,
    title: '回来：以投资者身份做配置',
    text: '他在一家企业做投资顾问培训讲师，回来请你给他讲讲银行视角的适当性管理。"我以前觉得适当性是枷锁，现在明白它是桥。"你把双录、风险测评、销售适当性流程完整讲了一遍，他逐条记进讲义——从前端_mgr到后端投资者，他终于走完了全流程。',
    trustReq: 60,
    effects: { trust: 5, unlockKnowledge: ['suitability', 'advisory'] },
  },
  {
    client: 'cli_d_exfunds', year: 2025, month: 9,
    title: '和解：长钱长投的最后一课',
    text: '他的定投第七年，年化 6.8%，"比公募的多数权益基金都稳"。他把这段经历写成小册子《我管了八年基金才学会给自己理财》，送你一本，扉页写着 2013 年你问他的那句："回撤预案是什么？"二十年局，一个基金经理的完整弧光：从管别人的钱，到管好自己的钱。',
    trustReq: 70,
    effects: { trust: 8, unlockKnowledge: ['dca', 'patient_capital'] },
  },
];

export const LIUQ_LIFELINE: LifeLineDef[] = [
  {
    client: 'cli_liuq', year: 2013, month: 5,
    title: '柜面里的定投启蒙',
    text: '刘晴，2006 年时是刚入行的柜员，点钞比赛全行第二。2013 年她隔着玻璃看你给客户讲定投，下班后问了一句："我自己能这么存吗？"你给她排了发薪日自动转入。柜员与理财经理之间隔着一块玻璃，也隔着一整套知识——她开始自学。',
    trustReq: 0,
    effects: { trust: 3, unlockKnowledge: ['dca', 'cash_mgmt'] },
  },
  {
    client: 'cli_liuq', year: 2016, month: 9,
    title: '转岗考试：玻璃的另一边',
    text: '她考下了从业资格，申请转岗理财经理。面试时行长问她："柜员干得好好的，为什么出来？"她说："我想从数钱的，变成帮人规划钱的。"你坐在评委席上没说话，但她引用的那套"四笔钱"框架，是三年前你在晨会上讲的。',
    trustReq: 10,
    effects: { trust: 4, unlockKnowledge: ['income_structure', 'deposit_migration'] },
  },
  {
    client: 'cli_liuq', year: 2019, month: 8,
    title: '净值化的第一次驻足',
    text: '转岗第三年，她负责的老年客户在理财破净传闻里集体动摇。她跑来问你："我按流程讲了基准不等于承诺，可他们不听，怎么办？"你反问："你讲了亏损之后的生活怎么办吗？"她愣住了——流程管合规，人管人心。',
    trustReq: 20,
    effects: { trust: 4, unlockKnowledge: ['nav_product', 'crisis_communication'] },
  },
  {
    client: 'cli_liuq', year: 2022, month: 11,
    title: '破净潮里的老兵',
    text: '2022 年底的债市急跌，她一个一个给 R2 客户打电话，嗓子哑了三天。有人骂她，也有人第二天带着热包子来网点。她后来在复盘会上说："那天我明白了，客户骂的不是净值，是没人接住他们。"',
    trustReq: 30,
    effects: { trust: 5, unlockKnowledge: ['nav_drawdown_read', 'crisis_communication'] },
  },
  {
    client: 'cli_liuq', year: 2024, month: 3,
    title: '加入你的团队',
    text: '你升任私行团队负责人后第一批招人，点名要她。她说："刘晴有个毛病，见不得客户在别人那儿吃亏。"你笑着说，这毛病全团队都得有。柜面转岗的稳健派，终于和你成了并肩的人。',
    trustReq: 40,
    effects: { trust: 5, unlockKnowledge: ['team_coaching', 'suitability'] },
  },
  {
    client: 'cli_liuq', year: 2024, month: 11,
    title: '她带的第一批老年客户',
    text: '她主动接下全组最难的老年客群：手机银行教学、防诈讲座、上门服务。有人嫌这活慢，她一句话顶回去："老年客户的信任是十年前的存款攒的，我们现在不做，十年后谁管他们？"这批客户后来成了全组 AUM 最稳的底盘。',
    trustReq: 50,
    effects: { trust: 6, unlockKnowledge: ['elder_care', 'senior_service'] },
  },
  {
    client: 'cli_liuq', year: 2025, month: 6,
    title: '稳健的价值被看见',
    text: '季度复盘，她负责的客群投诉率为零、复购率全组第一。行长在会上问秘诀，她只说了三个词："多走、多问、不吹。"你把这三个字写进了团队手册第一章。',
    trustReq: 60,
    effects: { trust: 6, unlockKnowledge: ['team_coaching', 'communication'] },
  },
  {
    client: 'cli_liuq', year: 2025, month: 12,
    title: '出师：从玻璃内到玻璃外',
    text: '年末，她通过出师答辩。答辩最后她说："十三年前我隔着玻璃看人做理财，今天我想造更多扇窗。"你想起 2013 年她隔着柜台问你的那句话。带出一个徒弟，是这份职业最好的复利。',
    trustReq: 70,
    effects: { trust: 8, unlockKnowledge: ['team_coaching', 'succession'] },
  },
];

export const XIAOH_LIFELINE: LifeLineDef[] = [
  {
    client: 'cli_xiaoh', year: 2018, month: 7,
    title: '管培生的第一张错题本',
    text: '肖何，2018 年以管培生身份入职，是当年唯一一个把《理财经理手册》逐页做成思维导图的新人。你随口说"双录的话术有十二个版本"，第二天他真的整理出十二个版本贴在工位上。书呆子气是好东西——前提是用对地方。',
    trustReq: 0,
    effects: { trust: 3, unlockKnowledge: ['dual_recording', 'fund_basics'] },
  },
  {
    client: 'cli_xiaoh', year: 2020, month: 2,
    title: '线上转型：考霸的盲区',
    text: '疫情远程办公，他把自己刷题打磨的题库搬上线上，全行引用。但他自己第一次视频面谈客户却搞砸了——客户说"你讲得都对，但我感觉你在背书"。他来问你，你只说了一句："考试有标准答案，客户没有。"',
    trustReq: 10,
    effects: { trust: 4, unlockKnowledge: ['digital_banking', 'communication'] },
  },
  {
    client: 'cli_xiaoh', year: 2022, month: 9,
    title: 'CFP 冲刺与客户的婚礼请柬',
    text: '他一边冲 CFP，一边服务着入行以来的第一个深度客户——那对 2019 年他做人生第一份配置方案的小夫妻。请柬送来那天，他忽然懂了：证书证明你懂，请柬证明客户信。两样他都想留着。',
    trustReq: 20,
    effects: { trust: 4, unlockKnowledge: ['asset_allocation', 'family_lifecycle'] },
  },
  {
    client: 'cli_xiaoh', year: 2023, month: 5,
    title: '谈单紧张症的破解',
    text: '大单面前他仍然会紧张。你的方法很"笨"：让他把每一次面谈录音复盘，标注"哪一句是我真正听懂了客户"。三个月后他的转述率从 30% 提到 80%。"原来倾听是可以量化的。"他说这话的时候眼睛是亮的。',
    trustReq: 30,
    effects: { trust: 5, unlockKnowledge: ['communication', 'crisis_communication'] },
  },
  {
    client: 'cli_xiaoh', year: 2025, month: 4,
    title: '加入你的团队',
    text: '2025 年你团队扩编，他递来的自荐信只有一页，最后一行写着："我会考试，但我更想学会您说的「把答案翻译成人话」。"你把这句话读了两遍，签了字。',
    trustReq: 40,
    effects: { trust: 5, unlockKnowledge: ['team_coaching', 'advisory'] },
  },
  {
    client: 'cli_xiaoh', year: 2025, month: 8,
    title: '错题本 2.0：全团队的',
    text: '他把个人错题本升级成团队共享的案例库：每笔失败的推荐、每次投诉的复盘、每个红线案例。有人嫌费时间，你说："我们的工资里有一部分，就是为这些错误付的学费，别白交。"',
    trustReq: 50,
    effects: { trust: 5, unlockKnowledge: ['employee_conduct', 'team_coaching'] },
  },
  {
    client: 'cli_xiaoh', year: 2025, month: 10,
    title: '第一次拦住师傅',
    text: '一个高佣金产品冲业绩的关键期，他拿着数据来找你："这个产品的费后收益跑不赢债基，但任务压力在推它——我们真卖吗？"你看着这个曾经见客户就紧张的年轻人，此刻他在拦你。你签了"不推"。',
    trustReq: 60,
    effects: { trust: 6, unlockKnowledge: ['red_lines', 'employee_conduct'] },
  },
  {
    client: 'cli_xiaoh', year: 2025, month: 12,
    title: '出师：把答案翻译成人话',
    text: '年末出师答辩，评委问他对理财经理这个职业的定义，他说："把专业的答案翻译成人话，把客户的人话翻译成方案。"全场安静了两秒。你带头鼓掌——这句话，值得写进下一版《理财经理手册》的第一页。',
    trustReq: 70,
    effects: { trust: 8, unlockKnowledge: ['communication', 'succession'] },
  },
];

/** 人生线全量（王秀兰 9 + 李建国 9 + 周宏图 9 + 吴建国 8 + 何志敏 9 + 周远航 8 + 陈曼 9 + 唐薇 8 + 姜屿 8 + 刘晴 8 + 肖何 8 + 周薇 8 = 101 节点） */

/**
 * 第十二条人生线：周薇（分行合规部督查）——合规视角的"对 face"线。
 * 8 节点：2013 巡检→2016 双录→2019 约谈→2022 举报保护→2025 和解。
 * unlockKnowledge 全走既有 tag/id，不新增野 tag。
 */
export const ZHOUWEI_LIFELINE: LifeLineDef[] = [
  {
    client: 'cli_zhouwei', year: 2013, month: 5,
    title: '第一次巡检：对 face 的开头',
    text: '分行合规部督查周薇第一次到你的网点例行巡检，翻凭证翻到第三本时抬眼问你："这笔理财的销售适当性材料，客户签字页为什么不齐？"你按流程补齐并解释了归档瑕疵，她没扣分，但记了备注。临走时她说："备注不是刁难，是下次还有得聊。"',
    trustReq: 0,
    effects: { trust: 2, unlockKnowledge: ['suitability', 'dual_recording'] },
  },
  {
    client: 'cli_zhouwei', year: 2014, month: 10,
    title: '凭证之外的暗流',
    text: '她在巡检中发现某同事的飞单线索——凭证没问题，问题在客户回访的录音里。她私下提醒你："你那位同事的路子，离红线还有一步。你提醒他，我看不到；你举报他，我必须查。"你选择了先提醒。同事收手了，但周薇记住了你处理问题的方式。',
    trustReq: 10,
    effects: { trust: 3, unlockKnowledge: ['red_lines', 'employee_conduct'] },
  },
  {
    client: 'cli_zhouwei', year: 2016, month: 3,
    title: '双录上线：被检查的人成了讲课的人',
    text: '双录系统上线，网点叫苦不迭。周薇来培训，点名让"归档做得最全的网点"分享经验——是你。你把十二个常见退回场景做成一页纸，她当场决定在分行推广。"合规不是拦住销售，是让销售经得起回放。"这句话后来出现在她的培训 PPT 第一页。',
    trustReq: 20,
    effects: { trust: 3, unlockKnowledge: ['dual_recording', 'communication'] },
  },
  {
    client: 'cli_zhouwei', year: 2019, month: 6,
    title: '销售合规约谈：替团队挡下的一次',
    text: '你团队一位新人把 R4 产品卖给了测评 R2 的客户，系统拦截后客户投诉到分行。约谈室里周薇问的不是"谁让他卖的"，而是"什么流程让新人觉得可以绕开测评"。复盘结论：话术培训替代了流程培训。整改方案她让你牵头写——挡下的是处分，留下的是流程。',
    trustReq: 30,
    effects: { trust: 4, unlockKnowledge: ['suitability', 'k_sales_zone'] },
  },
  {
    client: 'cli_zhouwei', year: 2021, month: 9,
    title: '体检报告与职业账本',
    text: '年度体检她查出了甲状腺结节，复查的那周她照常跑完了三个网点的巡检。你送她的体检报告备注里夹了一句话："合规检查您查别人，自己的风险敞口也该年检一次。"她笑了很久——那是你们认识八年，她第一次在你面前笑得不像督查。',
    trustReq: 40,
    effects: { trust: 3, unlockKnowledge: ['insurance_basics', 'k_serious_illness_plan'] },
  },
  {
    client: 'cli_zhouwei', year: 2022, month: 8,
    title: '内部举报保护：一次艰难的站队',
    text: '一位客户经理实名举报支行走账问题，被举报人扬言"让他在分行待不下去"。举报人深夜给你打电话，你把周薇 2014 年的话原样转给他："你举报他，她必须查。"案件查实，举报人依保护制度调岗留任。周薇后来对你说："制度长牙，是因为有人敢咬。"',
    trustReq: 50,
    effects: { trust: 4, unlockKnowledge: ['employee_conduct', 'red_lines'] },
  },
  {
    client: 'cli_zhouwei', year: 2023, month: 11,
    title: '数据穿透时代：老督查的新考卷',
    text: '监管科技上线，行为数据穿透让"事后翻凭证"变成"实时看异常"。她五十岁开始学数据看板，问你有没有懂系统的年轻同事可以请教。你把肖何借给了她两周。她学完说："以前查的是纸，现在查的是行为——但最后查的还是人。',
    trustReq: 60,
    effects: { trust: 3, unlockKnowledge: ['digital_banking', 'data_compliance'] },
  },
  {
    client: 'cli_zhouwei', year: 2025, month: 6,
    title: '退休前和解：对 face 的最终形态',
    text: '退休前最后一次巡检，她把 2013 年那页备注的复印件还给了你："当年记的是问题，现在看是路线图。"十二年里她查过你十一次，拦过你一次（那次你确实越线半步），也保过你一次。督查与被督查者之间，原来也能长出这种东西——不是朋友，是互相确认过底线的人。',
    trustReq: 70,
    effects: { trust: 6, unlockKnowledge: ['k_zhouwei_compliance_era', 'succession'] },
  },
];

export const LIFELINES_FULL: LifeLineDef[] = [...WANG_LIFELINE, ...LI_LIFELINE, ...ZHOU_LIFELINE, ...WU_LIFELINE, ...HE_LIFELINE, ...ZHOuyh_LIFELINE, ...CHENMAN_LIFELINE, ...TANGWEI_LIFELINE, ...JIANGYU_LIFELINE, ...LIUQ_LIFELINE, ...XIAOH_LIFELINE, ...ZHOUWEI_LIFELINE];
