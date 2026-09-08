import type { KnowledgeEntry } from './knowledge';

/**
 * 知识库第三批（补齐剧情引用缺口，5 条）：行情顶底沟通、危机安抚、负利率通胀。
 * 全部带 review.source_notes，status: 'draft' 待审。
 * 这些词条由卷一主线任务与人生线在关键年份解锁（2007 顶部 / 2008 危机 / 2011 负利率）。
 */

const R = (sources: string[], era?: string) => ({
  status: 'draft' as const,
  source_notes: sources,
  era_note: era,
});

export const knowledgeBatch3: KnowledgeEntry[] = [
  {
    id: 'k_chasing_high', title: '追高与踏空恐惧', unlockYear: 2007, category: 'behavior', tags: ['chasing_high', 'behavior_finance'],
    what: '"怕错过"（FOMO）驱动的追涨买入：客户在行情加速段把储蓄搬进高波动资产，买入价系统性偏高。',
    why: '2007 与 2015 两轮牛市顶部的共同画像：新开户数暴增、"隔壁赚了一半"。追高是散户亏损的第一来源。',
    how: '不否定客户入场，先问三句：这笔钱几年内要用吗？跌 30% 你会怎么办？仓位占家庭金融资产多少？用仓位上限代替禁止。',
    pitfall: '用"市场要跌"劝阻——预测会失败且摧毁信任；正确姿势是把决策从"买不买"转成"买多少"。',
    quiz: { q: '劝阻追高的第一句应该问什么？', a: '"这笔钱几年内会用吗？先定仓位上限，再谈买什么。"' },
    review: R(['行为金融学关于 FOMO 与处置效应的公开综述', '两轮牛市新开户数公开统计'], '2007/2015 牛市顶部语境'),
  },
  {
    id: 'k_euphoria_top', title: '狂热顶部的识别', unlockYear: 2007, category: 'market', tags: ['euphoria_top', 'sentiment'],
    what: '市场顶部特征：出租屋炒股、出租车聊股、新基金当日售罄、"这次不一样"叙事流行、估值分位数极值。',
    why: '狂热阶段是客户最容易把养老钱、婚房钱搬进市场的窗口，也是理财经理专业价值最高的时刻。',
    how: '用客观数据代替预测：给客户看估值分位与新增开户数；做"再平衡"而不是"清仓"——纪律比观点可靠。',
    pitfall: '自己也相信"这次不一样"；或反过来拍胸脯保证"马上要跌"——两个方向都是越界。',
    quiz: { q: '狂热顶部的正确客户动作？', a: '按既定纪律再平衡、控制仓位，不预测顶底。' },
    review: R(['《非同寻常的大众幻想与群众性癫狂》（Mackay）', '交易所新增开户数公开统计'], '顶部识别跨年代通用，案例取 2007'),
  },
  {
    id: 'k_crisis_communication', title: '危机沟通：先安抚后讲理', unlockYear: 2008, category: 'compliance', tags: ['crisis_communication', 'communication'],
    what: '客户深度亏损时的沟通次序：接住情绪 → 确认处境（有没有要用钱）→ 讲清"亏的是波动还是永久损失" → 给出动作清单。',
    why: '2008、2015、2022 三轮深跌的共同教训：客户此时最怕的不是亏损，而是"没人管我"。危机沟通决定十年信任。',
    how: '电话先问"现在方便说话吗"；当面先看持仓再开口；给选项不给指令——"我们可以 A 或 B，我建议 A，因为…"。',
    pitfall: '躲着不接电话（投诉高发源头）；或上来就讲"长期投资"大道理——先共情再讲逻辑，次序不能反。',
    quiz: { q: '危机沟通的第一步？', a: '接住情绪、确认处境，再谈市场与方案。' },
    review: R(['《商业银行理财业务监督管理办法》销售后管理要求', '行为金融学损失厌恶研究（Kahneman & Tversky）'], '跨年代通用'),
  },
  {
    id: 'k_negative_rate', title: '负利率与通货膨胀', unlockYear: 2011, category: 'market', tags: ['negative_rate', 'inflation', 'macro_basics'],
    what: '一年期定存利率低于同期 CPI 即"实际负利率"：名义上利息照付，购买力实际缩水。',
    why: '2010-2012 与 2019-2020 两轮负利率周期中，"存钱越存越穷"是网点最高频的客户疑问。',
    how: '给客户算"实际利率 = 名义利率 - CPI"；按用钱期限分层：短期留存款、长期配固收与权益。',
    pitfall: '用"通胀要来了快买黄金/股票"制造焦虑营销——资产配置看目标不看预测。',
    quiz: { q: '定存 3%、CPI 6%，实际利率是多少？', a: '-3%，购买力每年实际缩水约 3%。' },
    review: R(['国家统计局 CPI 公布口径', '人民银行存贷款基准利率历史数据'], '2011 年负利率周期语境'),
  },
];
