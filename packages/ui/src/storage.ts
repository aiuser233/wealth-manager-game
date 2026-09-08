/**
 * 统一存储适配层（P3 形态适配核心）：
 * - 浏览器：localStorage（被禁用时退化 sessionStorage → 会话内存 Map，微信/隐私模式兜底）
 * - Tauri 桌面：启动时 invoke('load_kv') 整体预载入内存；写操作写穿内存 + 防抖落盘（save_kv，原子写）
 * UI 层保持同步 get/set/remove 接口，不感知后端差异。
 */

type Backend = 'local' | 'session' | 'tauri' | 'memory';

const mem = new Map<string, string>();
let backend: Backend = 'memory';
let tauriInvoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let ready = false;

function lsAvailable(): boolean {
  try {
    const k = '__fm_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function ssAvailable(): boolean {
  try {
    const k = '__fm_probe__';
    sessionStorage.setItem(k, '1');
    sessionStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

async function detectTauri(): Promise<boolean> {
  try {
    const w = window as unknown as { __TAURI_INTERNALS__?: unknown };
    if (!w.__TAURI_INTERNALS__) return false;
    // 动态加载 @tauri-apps/api/core（Tauri 环境）；无该依赖时保持浏览器后端
    const m: { invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> } =
      await import(/* @vite-ignore */ '@tauri-apps/api/core');
    tauriInvoke = m.invoke;
    return true;
  } catch {
    return false;
  }
}

/** 应用启动时调用一次：探测环境并预载持久化数据（同步 API 之前必须完成） */
export async function initStorage(): Promise<void> {
  if (await detectTauri()) {
    backend = 'tauri';
    try {
      const all = (await tauriInvoke!('load_kv')) as Record<string, string>;
      for (const [k, v] of Object.entries(all ?? {})) mem.set(k, String(v));
    } catch {
      /* 首次启动无存档文件，忽略 */
    }
    ready = true;
    return;
  }
  if (lsAvailable()) backend = 'local';
  else if (ssAvailable()) backend = 'session';
  else backend = 'memory';
  ready = true;
}

/** 当前存储后端（诊断用：UI 可显示存储模式提示） */
export function storageBackend(): Backend {
  return backend;
}

function scheduleFlush() {
  if (backend !== 'tauri') return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushToDisk, 600);
}

async function flushToDisk() {
  if (!tauriInvoke) return;
  flushTimer = null;
  try {
    await tauriInvoke('save_kv', { data: Object.fromEntries(mem) });
  } catch {
    /* 落盘失败静默，下次写入重试 */
  }
}

export const storage = {
  get(key: string): string | null {
    try {
      switch (backend) {
        case 'local':
          return localStorage.getItem(key);
        case 'session':
          return sessionStorage.getItem(key);
        default:
          return mem.get(key) ?? null;
      }
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      switch (backend) {
        case 'local':
          localStorage.setItem(key, value);
          return;
        case 'session':
          sessionStorage.setItem(key, value);
          return;
        default:
          mem.set(key, value);
          if (backend === 'tauri') scheduleFlush();
      }
    } catch {
      /* 写满（localStorage 4MB 预算）等异常忽略 */
    }
  },
  remove(key: string): void {
    try {
      switch (backend) {
        case 'local':
          localStorage.removeItem(key);
          return;
        case 'session':
          sessionStorage.removeItem(key);
          return;
        default:
          mem.delete(key);
          if (backend === 'tauri') scheduleFlush();
      }
    } catch {
      /* 忽略 */
    }
  },
  /** 是否已完成初始化（测试/诊断用） */
  isReady(): boolean {
    return ready;
  },
};

// 进程退出前兜底落盘（Tauri 桌面）
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (backend === 'tauri') void flushToDisk();
  });
}
