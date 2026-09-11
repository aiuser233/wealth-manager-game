@echo off
rem 启动《重生之我是理财经理》游戏（开发服务器方式）
rem 关闭本窗口即停止游戏
cd /d "%~dp0"
echo 正在启动游戏...
start "" http://localhost:5173/
npm run dev
