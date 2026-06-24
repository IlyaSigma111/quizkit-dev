use crate::game::{AppSettings, Quiz};
use serde_json;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

fn get_base_dir() -> PathBuf {
    let mut path = dirs_next().unwrap_or_else(|| PathBuf::from("."));
    path.push("ИльЯкласс");
    path
}

fn get_data_dir() -> PathBuf {
    let path = get_base_dir().join("quizzes");
    fs::create_dir_all(&path).ok();
    path
}

fn get_settings_path() -> PathBuf {
    let dir = get_base_dir();
    fs::create_dir_all(&dir).ok();
    dir.join("settings.json")
}

fn dirs_next() -> Option<PathBuf> {
    if cfg!(target_os = "windows") {
        std::env::var("APPDATA").ok().map(PathBuf::from)
    } else if cfg!(target_os = "macos") {
        let home = std::env::var("HOME").ok()?;
        Some(PathBuf::from(home).join("Library").join("Application Support"))
    } else {
        let home = std::env::var("XDG_DATA_HOME")
            .or_else(|_| std::env::var("HOME").map(|h| format!("{}/.local/share", h))).ok()?;
        Some(PathBuf::from(home))
    }
}

pub fn load_quizzes() -> Vec<Quiz> {
    let dir = get_data_dir();
    let mut quizzes = Vec::new();
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().map_or(false, |e| e == "json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(quiz) = serde_json::from_str::<Quiz>(&content) {
                        quizzes.push(quiz);
                    }
                }
            }
        }
    }
    quizzes.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    quizzes
}

pub fn save_quiz(quiz: &Quiz) -> Result<(), String> {
    let dir = get_data_dir();
    let path = dir.join(format!("{}.json", quiz.id));
    let content = serde_json::to_string_pretty(quiz).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn delete_quiz(id: &str) -> Result<(), String> {
    let dir = get_data_dir();
    let path = dir.join(format!("{}.json", id));
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

pub fn get_quiz(id: &str) -> Option<Quiz> {
    let dir = get_data_dir();
    let path = dir.join(format!("{}.json", id));
    fs::read_to_string(&path).ok()
        .and_then(|content| serde_json::from_str::<Quiz>(&content).ok())
}

pub fn generate_id() -> String {
    Uuid::new_v4().to_string()
}

#[allow(dead_code)]
pub fn get_quizzes_dir() -> PathBuf {
    get_data_dir()
}

pub fn load_settings() -> AppSettings {
    let path = get_settings_path();
    if path.exists() {
        fs::read_to_string(&path).ok()
            .and_then(|content| serde_json::from_str::<AppSettings>(&content).ok())
            .unwrap_or_default()
    } else {
        AppSettings::default()
    }
}

pub fn save_settings(settings: &AppSettings) -> Result<(), String> {
    let path = get_settings_path();
    let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}
