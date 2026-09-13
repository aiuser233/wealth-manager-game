import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';
import { initStorage } from './storage';
import { state, newGame, computeFinalEnding, loadGameFromSave, serializeNow, getGame } from './state';
import * as CONTENT from '@fm/content';

// 开发期调试桥（仅 dev 构建注入，生产 bundle 剔除）：供浏览器实测快进主线/人生线
if (import.meta.env.DEV) {
  (window as any).__fm = {
    state,
    newGame,
    computeFinalEnding,
    loadGameFromSave,
    serializeNow: () => JSON.parse(serializeNow()),
    content: CONTENT,
    getGame,
  };
}

// P3：先探测存储环境（Tauri 桌面 / localStorage / sessionStorage / 会话内存），
// 预载完持久化数据再挂载 UI，保证同步读档在首帧就可用。
initStorage()
  .catch(() => {/* 探测失败时 storage 已有会话内存兜底 */})
  .finally(() => {
    createApp(App).mount('#app');
  });
