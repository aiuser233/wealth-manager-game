# -*- coding: utf-8 -*-
"""T6：knowledge8.ts 追加第二轮深化 6 张复盘卡（24→30）。"""
import io

EXTRA = '''
// ================= 第二轮深化复盘卡（6 张：24→30） =================

export const debriefCardsDeep2: DebriefCard[] = [
  {
    id: 'db_2023_ztgu', title: '中特估：一次政策审美的定价实验', year: 2023, eventRef: 'dir_2023_zz',
    happened: '"中国特色估值体系"讨论升温，低估值央企集中修复，"中字头"板块大涨后回落。',
    cause: '低估值+高分红+政策叙事共振，资金短期集中涌入。',
    impact: '红利风格从此进入主流视野，但追高的资金在回落中体验了政策主题的波动。',
    lesson: '政策审美能抬估值的中枢，却不能消灭波动——把"主题"翻译成"风格暴露"再谈配置。',
    prototype: '2023 年中特估行情', prototypeDesc: '央企价值重估讨论引发的蓝筹修复行情，红利投资走向大众化的分水岭。',
  },
  {
    id: 'db_2023_move', title: '换房潮：资产配置的被动课', year: 2023, eventRef: 'dir_2023_zz',
    happened: '认房不认贷等政策落地后，"卖旧换新"交易放量；部分家庭卖房后的大额资金在账上"无处安放"。',
    cause: '限购松绑+利率下调+置换需求集中释放。',
    impact: '百万级资金短期涌入存款与理财，家庭资产结构从不动产向金融资产迁移的第一课。',
    lesson: '卖房款不是"闲钱"，是一家人下半生的资产负债表重排——先规划再投资。',
    prototype: '2023 年下半年置换需求释放', prototypeDesc: '地产政策优化后的一轮换房潮，居民资产配置迁移的标志性窗口。',
  },
  {
    id: 'db_2024_debt', title: '化债交易：信用利差的压缩史', year: 2024, eventRef: 'dir_2024_micro',
    happened: '一揽子化债推进，城投债收益率快速下行，信用利差压缩至历史低位，"资产荒"加剧。',
    cause: '特殊再融资债置换+供给收缩+机构欠配。',
    impact: '城投标债"刚兑预期"强化，但票息同步走低——收益让位于安全。',
    lesson: '当信用利差被压到极致，"稳"的代价是"薄"——低票息时代要靠资产结构而非单点收益。',
    prototype: '2024 年化债与资产荒', prototypeDesc: '信用债收益率历史性下行，固定收益投资进入票息荒时代。',
  },
  {
    id: 'db_2024_mv_mgmt', title: '市值管理元年：分红与回购的制度红利', year: 2024, eventRef: 'dir_2024_niujiau_mv',
    happened: '市值管理指引+回购增持再贷款落地，上市公司分红回购规模创历史新高。',
    cause: '监管导向+低利率环境下股东回报的相对价值凸显。',
    impact: '红利资产"政策底"夯实，股东回报文化从口号变成现金流。',
    lesson: '选股逻辑从"讲故事"向"分现金"迁移——教客户看自由现金流，比看市梦率实在。',
    prototype: '2024 年市值管理新政', prototypeDesc: '分红、回购、注销的制度化，A 股股东回报体系的重建之年。',
  },
  {
    id: 'db_2025_robot', title: '机器人行情：主题投资的功与过', year: 2025, eventRef: 'dir_2025_rec',
    happened: '人形机器人产业链催化密集，相关指数数月翻倍，主题 ETF 发行井喷后高位巨震。',
    cause: '产业趋势真实+叙事宏大+资金拥挤。',
    impact: '早期的纪律投资者收获颇丰，追高的持有人经历了 30% 级别回撤。',
    lesson: '产业趋势是真的，波动也是真的——主题仓位用"定投+上限"表达信仰，而不是一把梭。',
    prototype: '2025 年人形机器人行情', prototypeDesc: 'AI 具身智能叙事下的产业主题大年，主题投资方法论的最佳教材。',
  },
  {
    id: 'db_2025_slowbull', title: '慢牛启蒙：波动率下降的两年', year: 2025, eventRef: 'dir_2025_rec',
    happened: '长线资金持续入市+退市分红等制度落地，指数缓步抬升而波动率显著低于历史牛市。',
    cause: '投资者结构机构化+长钱考核+稳市工具常态化。',
    impact: '"快牛慢熊"的旧剧本被改写，但客户对"慢牛"的耐心需要被教育。',
    lesson: '慢牛里最大的风险不是下跌，是"拿不住"——陪伴客户穿越无聊，是投顾的新价值。',
    prototype: '2025 年低波动慢牛', prototypeDesc: '制度红利与长钱入市共同塑造的新市场形态，投资者行为学的实践场。',
  },
];
'''

s = io.open('content/src/knowledge8.ts', encoding='utf-8').read()
i = s.rfind('\n];')
s2 = s[:i].rstrip().rstrip(',') + ',\n' + EXTRA.rstrip() + '\n];\n'
io.open('content/src/knowledge8.ts', 'w', encoding='utf-8', newline='\n').write(s2)
print('cards appended:', s2.count("id: 'db_"))
