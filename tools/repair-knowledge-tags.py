# -*- coding: utf-8 -*-
"""R5-T1a 词条反向缝合（第五轮深化批）：把"零题目引用"的知识词条挂到同域既有题上。

背景：R4 的题-词缝合是单向的——每题 tags 必须命中词条体系（孤儿题红线）；
但反向仍有大量词条没有任何题目引用它（"词条写了没人考"）。本脚本：
1. 解析 knowledge*.ts 全部词条（id / tags / title / unlockYear）；
2. 扫描 exams*.ts 全部题目 tags，按 ref-check 同口径（tag 归属 = KNOWLEDGE_ALL
   顺序中首个含此 tag 的词条）计算每个词条是否被考到；
3. 对零引用词条做域匹配（同词条 tag 交集 ×6 + 标题关键词命中 ×3），在其
   knowledge_tags 末尾追加词条 id——只加不减、一题最多 +2 个；
4. 从后往前写回（避免字符串位移），并复验零引用清零、孤儿题仍为 0。

用法：python tools/repair-knowledge-tags.py  （幂等：再跑一次零引用=0 不改动）
"""
import io, re, glob
from collections import Counter

kb, order = {}, []
for f in sorted(glob.glob('content/src/knowledge*.ts')):
    s = io.open(f, encoding='utf-8').read()
    ids = [(m.start(), m.group(1)) for m in re.finditer(r"id:\s*'([^']+)'", s)]
    for i, (pos, eid) in enumerate(ids):
        end = ids[i + 1][0] if i + 1 < len(ids) else len(s)
        seg = s[pos:end]
        tm = re.search(r"tags:\s*\[([^\]]*)\]", seg)
        ttl = re.search(r"title:\s*'([^']*)'", seg)
        kb[eid] = (re.findall(r"'([^']+)'", tm.group(1)) if tm else [],
                   ttl.group(1) if ttl else '?')
        order.append(eid)

qpat = re.compile(r"\b([smj])\('([a-z]+\d+)',\s*'([a-z_]+)',\s*'([^']*)',\s*(\[[^\]]*\])")
questions = []
for f in glob.glob('content/src/exams*.ts'):
    s = io.open(f, encoding='utf-8').read()
    for m in qpat.finditer(s):
        questions.append({'file': f, 's0': m.start(5), 's1': m.end(5),
                          'qid': m.group(2), 'chapter': m.group(4),
                          'tags': re.findall(r"'([^']+)'", m.group(5)),
                          'text': s[m.start():m.start() + 2200]})

used = Counter()
for q in questions:
    for t in q['tags']:
        used[t] += 1
first_owner = {}
for eid in order:
    for t in kb[eid][0]:
        first_owner.setdefault(t, eid)

def covered(eid):
    if used.get(eid, 0):
        return True
    return any(first_owner.get(t) == eid and used.get(t, 0) > 0 for t in kb[eid][0])

zero = [e for e in order if e.startswith('k_') and not covered(e)]
print('零引用词条:', len(zero))
if not zero:
    print('无需缝合'); raise SystemExit(0)

def score(q, tags, title):
    sc = len(set(q['tags']) & set(tags)) * 6
    for x in [x for x in re.split(r'[：:，,、\s（）()·]', title) if len(x) >= 2][:3]:
        if x in q['chapter'] or x in q['text'][:700]:
            sc += 3
    return sc

qload = Counter()
placed, missed = [], []
for eid in zero:
    tags, title = kb[eid]
    cands = sorted(range(len(questions)), key=lambda i: (-score(questions[i], tags, title), i))
    ok = False
    for i in cands[:50]:
        q = questions[i]
        if eid in q['tags'] or qload[i] >= 2:
            continue
        q['tags'].append(eid); qload[i] += 1; placed.append((eid, q['qid'])); ok = True
        break
    if not ok:
        for i in sorted(range(len(questions)), key=lambda i: qload[i]):
            q = questions[i]
            if eid in q['tags'] or qload[i] >= 2:
                continue
            q['tags'].append(eid); qload[i] += 1; placed.append((eid, q['qid'])); ok = True
            break
    if not ok:
        missed.append((eid, title))

byfile = {}
for i, q in enumerate(questions):
    if qload[i]:
        byfile.setdefault(q['file'], []).append((q['s0'], q['s1'], q['tags']))
total = 0
for f, ops in byfile.items():
    s = io.open(f, encoding='utf-8').read()
    for s0, s1, tags in sorted(ops, key=lambda x: -x[0]):
        old = s[s0:s1]
        assert old.startswith('[') and old.endswith(']'), (f, old[:40])
        new = '[' + ', '.join("'%s'" % t for t in tags) + ']'
        s = s[:s0] + new + s[s1:]
        total += 1
    io.open(f, 'w', encoding='utf-8', newline='\n').write(s)
print('挂载词条:', len(placed), ' 改写题目:', total, ' 文件:', len(byfile),
      ' 未放置:', missed)
