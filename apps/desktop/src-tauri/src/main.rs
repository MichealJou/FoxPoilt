#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[derive(Clone, serde::Serialize)]
struct DesktopRuntimeStatus {
    shell: &'static str,
    runtime: &'static str,
    cli_json_ready: bool,
    pages: Vec<&'static str>,
    platform_adapters: Vec<&'static str>,
}

#[tauri::command]
fn desktop_runtime_status() -> DesktopRuntimeStatus {
    DesktopRuntimeStatus {
        shell: "tauri",
        runtime: "shared-runtime-core",
        cli_json_ready: true,
        pages: vec![
            "dashboard",
            "workspace",
            "tasks",
            "runs",
            "events",
            "control-plane",
            "health",
        ],
        platform_adapters: vec!["codex", "claude_code", "qoder", "trae"],
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![desktop_runtime_status])
        .run(tauri::generate_context!())
        .expect("failed to run foxpilot desktop");
}
