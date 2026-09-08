/**
 * 完整客户人生线（P1 规划 3.4）："剧情即案例课"的示范线。
 * 王秀兰线（9 节点）：2006-2020，适当性/防诈/养老三支柱教学。
 * 李建国线（9 节点）：2006-2025，家庭生命周期/杠杆/断供/传承启动教学。
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

/** 卷一完整人生线全量（替换旧版 4 节点表） */
export const LIFELINES_FULL: LifeLineDef[] = [...WANG_LIFELINE, ...LI_LIFELINE];
