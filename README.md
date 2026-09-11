# 重生之我是理财经理

一款「重生 + 银行职场」题材的视觉小说 × 模拟经营单机游戏，同时是一个面向银行内训的**合规培训游戏化平台**。玩家扮演重生回 2006 年的华尔街明星基金经理，在 A 国商业银行从见习理财经理做起，**历经 20 年完整经济周期**（疯牛、次贷、四万亿、钱荒、杠杆牛熊、贸易战、疫情、破净潮、AI 浪潮），边玩边学一套专业、准确的财富管理知识。

> **虚构声明**：所有机构（汇诚银行、玄商 300 等）、人物、产品、行情均以公开历史行情为蓝本架空改编，仅供学习与娱乐，不构成任何投资建议。这条声明由代码中的内容 Lint 机器闸强制保障（见[开发手册 §2](docs/开发手册.md)）。

> **文档总入口**：[docs/README.md](docs/README.md) —— 本项目**所有**文档的索引与导航，找任何文档先去那里。

---

## 1. 快速上手

```bash
npm install        # 安装依赖（npm workspaces，一次装全五个包）
npm run dev        # 启动游戏 http://localhost:5173（Vite dev server）
```

> **玩家启动**：Windows 双击根目录的 **启动游戏.bat** 即可（自动起服务器并打开浏览器，关掉窗口即退出）。存档存在浏览器本地（localStorage），换浏览器/清缓存会丢档。
> **正式考说明**：题库 1689 题当前均为 draft 待人工双审，正式考暂不可用（日志会提示），练习/模考不受影响；培训后台可开「开发模式」放行全部题目。

全部命令：

| 命令 | 作用 | 什么时候跑 |
|---|---|---|
| `npm run dev` | Vite 开发服务器（热更新） | 日常开发 |
| `npm run typecheck` | core + ui 两包 TS 严格检查 | 每次改代码后 |
| `npm test` | Vitest 全量单测（88 个，7 文件） | 每次改代码后 |
| `npm run build` | UI 生产构建（Vite → packages/ui/dist） | 发布前 |
| `npm run sim` | 无头模拟：20 年行情 + 12 锚点校验 + 游戏循环烟测 | 改市场/内容后 |
| `npm run bot` | 机器人蒙特卡洛 3 策略×N 局数值报表（可带局数参数 `npm run bot -- 50`） | 改数值后 |
| `npm run content:check` | 内容双机器闸：禁语 Lint + 引用完整性 | **每次改内容后必跑** |
| `npm run collect` | 可选培训记录收集端点（零依赖 Node，JSONL 落盘） | 银行内网试点 |

测试指定文件：`npx vitest run packages/core/test/team.test.ts`

---

## 2. Monorepo 结构与三铁律

```
重生之我是理财经理/
├─ packages/
│  ├─ core/            # 纯 TS 引擎（14 文件 2842 行）——零 DOM、零平台依赖
│  └─ ui/              # Vue 3 表现层（18 组件 + 9 模块 4321 行）
├─ content/            # 全部游戏内容（28 文件 4832 行，@fm/content 包）
├─ tools/              # 数值模拟 + 机器人 + 内容合规管线（@fm/tools）
├─ src-tauri/          # Tauri 2 Windows 桌面壳（Rust）
└─ docs/               # 全部文档（入口：docs/README.md）
```

**三铁律**（违反即架构腐化，评审时一票否决）：

1. **core 不 import 任何 UI / DOM / 平台 API**。market/game/exam/quest 等全部可在 Node 里无头跑——`npm run sim` 和 `npm run bot` 就是证明。UI 层发现的 bug 应能先在 core 层用单测复现。
2. **内容与引擎分离**：写剧情/题目/词条只改 `content/`，不碰代码。内容有独立的 lint + 引用检查（`npm run content:check`），红灯即 CI 失败。
3. **平台能力由 UI 层注入**：存档（Tauri 文件/localStorage/内存）全部在 `packages/ui/src/storage.ts` 适配，core 只操作内存对象。

包依赖方向：`ui → core + content`，`tools → core + content`，`content → core`（只用类型）。core 不依赖任何其他包。

---

## 3. 当前状态速览

| 维度 | 现状 |
|---|---|
| 阶段 | P1–P6 全部完成（P6 美术音频明确跳过）+ C1.1 增强批次 + **首次试运行修复批 8 项**（工作台布局/全操作日志反馈/行情涨跌与 K 线折叠/知识库开放/考试三模式+押题冲刺/新闻红点），详见[规划合并文档 §14](docs/项目总体规划与实施状态.md) |
| 质量 | 五管线全绿：typecheck / vitest 88 / build 1.03MB / sim 锚定 / bot 数值 |
| 内容量 | 题库 1689+示范题包 3 · 词条 147 · 主线 60 任务（24 条跨卷前置链）· 人生线 8 条 69 节点 · 复盘卡 18（日历视图）· 导演事件 81 |
| B 端 | 培训后台（学员记录/聚合报表/行内题包/讲师大屏 28 幕/讲师会话持久化）就绪；`content/custom/` 示范题包走通"合规部门零代码提交→机器闸→抽题池"闭环；试点未开始 |

---

## 4. 深入阅读（按需取用）

| 想了解 | 去哪里 |
|---|---|
| **哪些做了/没做，下一步干什么** | [docs/项目总体规划与实施状态.md](docs/项目总体规划与实施状态.md) |
| **引擎/内容/UI 逐文件讲解、数据字典、加内容流程、踩坑记录** | [docs/开发手册.md](docs/开发手册.md) |
| **银行内网怎么部署、题包格式、合规对接** | [docs/培训后台与私有化部署.md](docs/培训后台与私有化部署.md) |
| **桌面壳打包（Tauri/NSIS）** | [docs/培训后台与私有化部署.md §桌面壳](docs/培训后台与私有化部署.md) 与 [src-tauri/README.md](src-tauri/README.md) |
| **全部文档的索引** | [docs/README.md](docs/README.md) |

---

*根 README 只保留上手与导航；系统细节全部在 docs/ 下，改了系统记得同步对应文档。*
