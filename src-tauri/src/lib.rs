use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Movement {
    id: String,
    date: String,
    kind: String,
    flow: String,
    amount_cents: i64,
    category: String,
    description: String,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LedgerFile {
    version: u32,
    movements: Vec<Movement>,
}

fn ledger_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir.join("ledger.json"))
}

#[tauri::command]
fn load_ledger(app: tauri::AppHandle) -> Result<Vec<Movement>, String> {
    let path = ledger_path(&app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&path).map_err(|err| err.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Vec::new());
    }
    let file: LedgerFile = serde_json::from_str(&raw).map_err(|err| err.to_string())?;
    Ok(file.movements)
}

#[tauri::command]
fn save_ledger(app: tauri::AppHandle, movements: Vec<Movement>) -> Result<(), String> {
    let path = ledger_path(&app)?;
    let file = LedgerFile {
        version: 1,
        movements,
    };
    let raw = serde_json::to_vec_pretty(&file).map_err(|err| err.to_string())?;
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, raw).map_err(|err| err.to_string())?;
    fs::rename(&tmp, &path).map_err(|err| err.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_ledger, save_ledger])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
