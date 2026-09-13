# -*- coding: utf-8 -*-
"""第四轮批 R4-T1a：存量题库野 tag 修复（260 题 / 58 个野 tag → 有效 tag 映射）。
每条映射人工判定并带理由；替换后 unsealed 扫描必须清零。"""
import io, re, glob, os

# ---- 构建合法 tag 集合（同 ref-check 口径：词条 tag ∪ 词条 id）----
def build_valid():
    tags, ids = set(), set()
    for f in glob.glob('content/src/knowledge*.ts'):
        s = io.open(f, encoding='utf-8').read()
        for m in re.finditer(r"tags:\s*\[([^\]]*)\]", s):
            tags.update(re.findall(r"'([^']+)'", m.group(1)))
        for m in re.finditer(r"id:\s*'(k_[a-z0-9_+]+|re_[a-z0-9_]+)'", s):
            ids.add(m.group(1))
    return tags | ids

VALID = build_valid()

# ---- 人工映射表：野 tag -> 有效 tag（带理由）----
MAP = {
    'credit_card': 'card_safety',          # 信用卡主题 → 银行卡安全词条群
    'mortgage': 'housing',                  # 房贷主题 → 住房与房产配置词条
    'annuity': 'k_tax_deferred_annuity',    # 年金 → 税延年金词条
    'private_equity': 'k_hedge_fund_diff',  # 另类/私募 → 私募与公募差异词条
    'debt_avalanche': 'debt',               # 债务优化 → 家庭负债词条群
    'fund_dividend': 'dividend',            # 基金分红 → 分红词条群
    'drawdown_read': 'nav_drawdown_read',   # 回撤解读 → 净值回撤词条（原 tag 少 nav 前缀）
    'risk_budget': 'rebalancing',           # 风险预算 → 再平衡与配置纪律
    'irr': 'k_investor_irr_gap',            # IRR/收益缺口 → 收益-回报缺口词条
    'planning_process': 'planning_tools',   # 规划流程 → 规划工具词条
    'interest': 'compound_interest',        # 利息 → 复利与 72 法则
    'fund_fees': 'fund_fee',                # 基金费用（复数拼写）
    'fund_nav': 'nav_product',              # 基金净值 → 净值型产品词条
    'fund_risk': 'risk_rating',             # 基金风险 → 风险测评词条
    'credit_basics': 'credit',              # 信用基础 → 个人征信词条
    'private_banking': 'k_trust_service',    # 私行服务 → 信托服务词条
    'corporate_finance': 'risk_isolation',  # 公司金融 → 家企隔离词条
    'portfolio_theory': 'asset_allocation', # 组合理论 → 资产配置词条
    't_plus_rules': 't+0',                  # T+N 规则 → T+0 词条
    'crs': 'cross_border',                  # 共同申报准则 → 跨境词条
    'wm_rules': 'net_value_transition',     # 资管规则 → 净值化转型词条
    'balance_sheet': 'household_ips',       # 资产负债表 → 家庭 IPS 词条
    'governance': 'employee_conduct',       # 治理 → 员工行为管理词条
    'housing_loan': 'housing',              # 住房贷款 → 住房词条
    'loan_compliance': 'red_lines',         # 贷款合规 → 红线词条
    'retirement': 'retirement_plan',        # 退休（原 tag 少 plan）
    'industry_basics': 'industry_cycle',    # 行业基础 → 行业周期词条
    'rate_system': 'rate_marketize',        # 利率体系 → 利率市场化词条
    'fund_governance': 'fund_evaluation',   # 基金治理 → 基金评价词条
    'fof': 'k_fof_mom',                     # FOF → FOF/MOM 词条
    'value_investing': 'fund_evaluation',   # 价值投资 → 基金评价词条
    'guarantee': 'red_lines',               # 担保/保证承诺 → 红线词条
    'risk_mgmt': 'risk_isolation',          # 风险管理 → 风险隔离词条
    'collateral': 'pledge_risk',            # 抵押 → 质押风险词条
    'professional_ethics': 'employee_conduct', # 职业道德 → 员工行为词条
    'interest_tax': 'tax_basics',           # 利息税 → 税务基础词条
    'regulator_basics': 'k_nfra_era',       # 监管基础 → 金监总局词条
    'card_rules': 'card_safety',            # 卡规则 → 银行卡安全词条
    'money_basics': 'money_fund',           # 货币基础 → 货币基金词条
    'disclosure': 'mislead' if False else 'k_misleading_sales',  # 披露 → 误导销售词条
    'sharp_ratio': 'k_smart_beta',          # 夏普比率 → 因子投资词条
    'kyc': 'suitability',                   # KYC → 适当性词条
    'debt_ratio': 'k_household_debt_ratio', # 负债率 → 家庭负债率词条
    'discipline': 'self_control',           # 纪律 → 自控词条
    'smart_beta_': 'k_smart_beta',
    'ai_advisor_2024': 'ai_advisor',              # 2024 AI 投顾词条 tag 是 ai_advisor
    'pension_2024': 'k_pension_2024',             # 词条 id 直引
    't+0_money': 'k_t+0_money',                   # 词条 id 直引
    'household_debt_ratio': 'k_household_debt_ratio',  # 词条 id 直引
    'rate_marketize': 'k_rate_marketize',         # 词条 id 直引（exams2/4）
    'rigid_payment': 'deposit_insurance',         # 刚性兑付 → 存款保险与刚兑词条群
    'agency': 'fund_basics',                      # 代销 → 基金销售词条
    'bse': 'k_bse_special',                       # 北交所 → 北证 50 词条
    'delisting': 'k_delisting_norm',              # 退市 → 退市常态化词条
    'sector_fund': 'fund_selection',              # 行业基金 → 基金筛选词条
    'star_market': 'k_star_eight',                # 科创板 → 科创板八条词条
    'abs': 'structured_product',                  # 资产证券化 → 结构性产品词条
    'capital': 'macro_basics',                    # 资本市场 → 宏观基础词条
    'compliance': 'red_lines',                    # 合规（泛） → 红线词条
    'data_protection': 'privacy',                 # 数据保护 → 隐私词条
    'fx_control': 'fx_risk',                      # 汇率管制 → 汇率风险词条
    'ipo': 'k_limit_updown',                      # 打新/上市 → 涨跌停与新股词条群
    'monetary_policy': 'macro_cycle',             # 货币政策 → 宏观周期词条
    'syndicate': 'fund_express',                  # 承销团 → 基金发行词条群
    'insurance': 'insurance_basics',              # 保险（泛） → 保险基础词条
    'long_term_care': 'ltc',                      # 长期照护 → ltc 词条
}

def repair_file(path):
    s = io.open(path, encoding='utf-8').read()
    orig = s
    # 只替换 tag 数组里的野 tag（[...] 内的字符串字面量）
    def fix_array(m):
        arr = m.group(0)
        ts = re.findall(r"'([a-z0-9_+]+)'", arr)
        if not ts or any(t.startswith('exam_') for t in ts):
            return arr
        if all(t in VALID for t in ts):
            return arr
        new_ts = []
        for t in ts:
            if t in VALID:
                new_ts.append(t)
            elif t in MAP:
                new_ts.append(MAP[t])
            else:
                print('  UNMAPPED', t, '<-', os.path.basename(path))
                new_ts.append(t)
        # 去重保序
        seen, out = set(), []
        for t in new_ts:
            if t not in seen:
                seen.add(t); out.append(t)
        return '[' + ', '.join("'%s'" % t for t in out) + ']'
    s2 = re.sub(r"\[[^\[\]]*\]", fix_array, s)
    if s2 != orig:
        io.open(path, 'w', encoding='utf-8', newline='\n').write(s2)
        return True
    return False

changed = 0
for f in sorted(glob.glob('content/src/exams*.ts')):
    if repair_file(f):
        changed += 1
        print('repaired', os.path.basename(f))
print('files changed:', changed)

# ---- 复扫 unsealed ----
bad = 0
for f in glob.glob('content/src/exams*.ts'):
    s = io.open(f, encoding='utf-8').read()
    for mm in re.finditer(r"\[([^\]]*)\], '", s):
        ts = re.findall(r"'([a-z0-9_+]+)'", mm.group(1))
        if not ts or any(t.startswith('exam_') for t in ts):
            continue
        if not any(t in VALID for t in ts):
            bad += 1
print('remaining fully-unsealed:', bad)
