#[path = "train/data.rs"]
mod data;
#[path = "train/training.rs"]
mod training;

use rowspire_ai_core::ml_ai::MLAI;
use std::error::Error;
use std::fs;
use std::path::PathBuf;
use std::time::Instant;

const EPOCHS: usize = 50;

fn main() -> Result<(), Box<dyn Error>> {
    let started = Instant::now();
    let mut model = MLAI::new();
    let mut dataset = data::load_or_generate()?;

    training::train(&mut model, &mut dataset, EPOCHS);
    save_model(&model, dataset.len())?;
    println!("Training completed in {:?}", started.elapsed());
    Ok(())
}

fn save_model(model: &MLAI, samples: usize) -> Result<(), Box<dyn Error>> {
    let path =
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../resources/ai/ml_ai_weights_best.json");
    let document = serde_json::json!({
        "metadata": {
            "training_date": chrono::Local::now().to_rfc3339(),
            "phase": 3,
            "samples": samples,
            "epochs": EPOCHS,
            "architecture": [128, 128, 128, 128],
            "teacher": "BitboardSolver",
            "teacher_depth": data::SOLVER_DEPTH,
            "curriculum": "40% early, 40% mid, 20% late game",
            "lr_schedule": "warmup + decay"
        },
        "value_network": { "weights": model.value_network.get_weights() },
        "policy_network": { "weights": model.policy_network.get_weights() }
    });

    fs::write(&path, serde_json::to_string_pretty(&document)?)?;
    println!("Saved weights to {path:?}");
    Ok(())
}
