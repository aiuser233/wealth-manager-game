# 桌面壳（Tauri 2 Windows）

P3 形态：把 Web 版打包为 Windows 桌面应用（NSIS 安装包 + MSI）。

## 架构

```
packages/ui (Vue 3 + Vite)
    │  build → packages/ui/dist（静态资源）
    ▼
src-tauri (Tauri 2 Rust 壳)
    ├── tauri.conf.json    窗口/打包/前端产物配置
    └── src/main.rs        load_kv / save_kv 文件存档命令
```

## 存档：文件替换 localStorage

桌面端存档不再依赖浏览器 localStorage，而是整体键值落盘到用户数据目录：

| 平台 | 存档文件 |
|---|---|
| Windows | `%APPDATA%/重生之我是理财经理/fm_save.json` |
| macOS | `~/Library/Application Support/重生之我是理财经理/fm_save.json` |

- 前端 [packages/ui/src/storage.ts](../packages/ui/src/storage.ts) 统一存储适配层：
  探测顺序 `Tauri → localStorage → sessionStorage → 会话内存`（微信 H5 / 隐私模式兜底）。
- 桌面端启动时 `load_kv` 整体预载入内存；写操作写穿内存后 600ms 防抖 `save_kv` 落盘，
  Rust 侧临时文件 + rename 原子写，避免半写损坏。
- UI 层保持同步 `storage.get/set/remove` 接口，业务代码零感知。

## 自动更新（占位）

P3 不启用 updater；后续接入 `tauri-plugin-updater` 时：
1. `tauri.conf.json` 增加 `plugins.updater` 配置与签名公钥；
2. 打包时用私钥签名产物；3. 检查源指向行内内网分发地址（数据不出本机原则）。

## 本地构建

```bash
# 前置：Rust stable（MSVC 目标需 VS Build Tools；无 VS 时可用 GNU 工具链，见下）
npm run build            # 先产出 packages/ui/dist
npm run tauri build      # 产出 src-tauri/target/release/bundle/nsis/*.exe 与 msi/*.msi
npm run tauri dev        # 开发模式（热更新）
```

无 VS Build Tools 的机器改用 GNU 工具链：

```bash
rustup toolchain install stable-x86_64-pc-windows-gnu --profile minimal
rustup default stable-x86_64-pc-windows-gnu   # 需 MinGW gcc 在 PATH（如 MSYS2）
```

## 私有化预留

静态资源（packages/ui/dist）+ 内容包（JSON/TS 数据）整体即离线包：
银行内网可直接分发 Web 版静态资源，或用本壳打包安装包，两者同代码同存档格式。
