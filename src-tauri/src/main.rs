//! Tauri 桌面壳（P3）：把前端 localStorage 换成用户数据目录下的 JSON 文件存档。
//!
//! 存储模型：前端 storage.ts 把全部键值打包成 `Record<string,string>`，
//! 通过 `save_kv` 整体写盘、`load_kv` 启动时整体预载。
//! 落盘为原子写（临时文件 + rename），避免半写文件损坏存档。
//!
//! 存档位置（Tauri 默认 app_data_dir）：
//!   Windows: %APPDATA%/重生之我是理财经理/fm_save.json
//!   macOS:   ~/Library/Application Support/重生之我是理财经理/fm_save.json
//!
//! 自动更新：P3 占位不启用；P4/后续接入 tauri-plugin-updater。

use base64::Engine as _;
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{Manager, State};

const SAVE_FILE: &str = "fm_save.json";

/// 保存数据句柄：内存为权威副本，写穿落盘
struct KvStore {
    path: PathBuf,
}

impl KvStore {
    fn load(app: &tauri::AppHandle) -> Self {
        let dir = app
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| PathBuf::from("."));
        let _ = fs::create_dir_all(&dir);
        let path = dir.join(SAVE_FILE);
        KvStore { path }
    }

    fn read_all(&self) -> HashMap<String, Value> {
        match fs::read_to_string(&self.path) {
            Ok(s) => serde_json::from_str(&s).unwrap_or_default(),
            Err(_) => HashMap::new(),
        }
    }

    /// 原子写：先写 .tmp 再 rename，避免半写损坏
    fn write_all(&self, data: &HashMap<String, Value>) -> Result<(), String> {
        let tmp = self.path.with_extension("json.tmp");
        let body = serde_json::to_string(data).map_err(|e| e.to_string())?;
        fs::write(&tmp, body.as_bytes()).map_err(|e| e.to_string())?;
        fs::rename(&tmp, &self.path).map_err(|e| e.to_string())?;
        Ok(())
    }
}

/// 启动预载：返回全部键值（前端 storage.ts 灌入内存 Map）
#[tauri::command]
fn load_kv(store: State<KvStore>) -> HashMap<String, Value> {
    store.read_all()
}

/// 防抖后的整体写盘：前端每次写操作都会调用（600ms 防抖在 storage.ts）
#[tauri::command]
fn save_kv(store: State<KvStore>, data: HashMap<String, Value>) -> Result<(), String> {
    store.write_all(&data)
}

/// 导出存档到用户选择的位置（P3 预留：配合前端"导出到文件"）
#[tauri::command]
fn kv_path() -> String {
    SAVE_FILE.to_string()
}

#[tauri::command]
fn save_kv_b64(store: State<KvStore>, payload: String) -> Result<(), String> {
    let raw = base64::engine::general_purpose::STANDARD
        .decode(payload.as_bytes())
        .map_err(|e| e.to_string())?;
    let v: Value = serde_json::from_slice(&raw).map_err(|e| e.to_string())?;
    let map: HashMap<String, Value> = serde_json::from_value(v).map_err(|e| e.to_string())?;
    store.write_all(&map)
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let kv = KvStore::load(app.handle());
            app.manage(kv);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![load_kv, save_kv, save_kv_b64, kv_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
