fn main() {
    println!("cargo:rerun-if-changed=recipes.json");
    tauri_build::build()
}
