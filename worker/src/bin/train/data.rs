use rayon::prelude::*;
use rowspire_ai_core::{
    features::GameFeatures,
    solver::{Bitboard, Solver},
    GameState, COLS, ROWS,
};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::error::Error;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Instant;

pub const SOLVER_DEPTH: u8 = 12;
const RAW_SAMPLES: usize = 250_000;
const EARLY_RATIO: f32 = 0.4;
const MID_RATIO: f32 = 0.4;

pub type Sample = (Vec<f32>, f32, Vec<f32>);

#[derive(Serialize, Deserialize)]
struct StoredSample {
    features: Vec<f32>,
    value: f32,
    policy: Vec<f32>,
}

thread_local! {
    static SOLVER: RefCell<Solver> = RefCell::new(Solver::new());
}

pub fn load_or_generate() -> Result<Vec<Sample>, Box<dyn Error>> {
    let path = dataset_path();
    if path.exists() {
        let samples: Vec<StoredSample> = serde_json::from_str(&fs::read_to_string(&path)?)?;
        println!("Loaded {} samples from {path:?}", samples.len());
        return Ok(samples.into_iter().map(StoredSample::into_tuple).collect());
    }

    let started = Instant::now();
    let progress = AtomicUsize::new(0);
    let samples: Vec<_> = (0..RAW_SAMPLES)
        .into_par_iter()
        .flat_map(|index| generate_pair(index, &progress))
        .collect();
    let stored: Vec<_> = samples
        .iter()
        .cloned()
        .map(StoredSample::from_tuple)
        .collect();

    fs::create_dir_all(path.parent().expect("dataset path has a parent"))?;
    fs::write(&path, serde_json::to_vec(&stored)?)?;
    println!(
        "Generated {} samples in {:?}",
        samples.len(),
        started.elapsed()
    );
    Ok(samples)
}

fn generate_pair(index: usize, progress: &AtomicUsize) -> [Sample; 2] {
    SOLVER.with(|solver| {
        let mut solver = solver.borrow_mut();
        if solver.tt_size() > 500_000 {
            solver.reset();
        }

        let state = random_state(index);
        let evaluations = solver.analyze_all(&Bitboard::from_game_state(&state), SOLVER_DEPTH);
        report_progress(progress.fetch_add(1, Ordering::Relaxed));
        let (value, policy) = labels(&evaluations);
        let mirrored = mirror_state(&state);

        [
            (features(&state), value, policy.clone()),
            (features(&mirrored), value, mirror_policy(&policy)),
        ]
    })
}

fn random_state(index: usize) -> GameState {
    let phase = index as f32 / RAW_SAMPLES as f32;
    let move_count = if phase < EARLY_RATIO {
        rand::random::<usize>() % 9
    } else if phase < EARLY_RATIO + MID_RATIO {
        9 + rand::random::<usize>() % 12
    } else {
        21 + rand::random::<usize>() % 10
    };
    let mut state = GameState::new_random_first_player();

    for _ in 0..move_count {
        let moves = state.get_valid_moves();
        if state.is_game_over() || moves.is_empty() {
            return GameState::new_random_first_player();
        }
        state
            .make_move(moves[rand::random::<usize>() % moves.len()])
            .expect("selected move is valid");
    }
    state
}

fn labels(evaluations: &[(usize, i32)]) -> (f32, Vec<f32>) {
    let mut best: f32 = -1.0;
    let mut scores = [f32::NEG_INFINITY; COLS];
    for &(column, score) in evaluations {
        best = best.max((score as f32).clamp(-21.0, 21.0) / 21.0);
        scores[column] = (score as f32).clamp(-30.0, 30.0);
    }
    let max = scores.iter().copied().fold(f32::NEG_INFINITY, f32::max);
    let total: f32 = scores
        .iter()
        .filter(|score| score.is_finite())
        .map(|score| (score - max).exp())
        .sum();
    let policy = scores
        .map(|score| {
            if score.is_finite() {
                (score - max).exp() / total
            } else {
                0.0
            }
        })
        .to_vec();
    (best, policy)
}

fn mirror_state(state: &GameState) -> GameState {
    let mut mirrored = state.clone();
    for column in 0..COLS {
        for row in 0..ROWS {
            mirrored.board[column][row] = state.board[COLS - column - 1][row];
        }
    }
    mirrored
}

fn mirror_policy(policy: &[f32]) -> Vec<f32> {
    policy.iter().rev().copied().collect()
}

fn features(state: &GameState) -> Vec<f32> {
    GameFeatures::from_game_state(state).features.to_vec()
}

fn report_progress(completed: usize) {
    let interval = RAW_SAMPLES / 100;
    if completed > 0 && completed.is_multiple_of(interval) {
        eprintln!("Generated {completed}/{RAW_SAMPLES} raw samples");
    }
}

fn dataset_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../resources/ai/training/dataset_p4.json")
}

impl StoredSample {
    fn from_tuple((features, value, policy): Sample) -> Self {
        Self {
            features,
            value,
            policy,
        }
    }

    fn into_tuple(self) -> Sample {
        (self.features, self.value, self.policy)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mirrored_policy_reverses_columns() {
        assert_eq!(mirror_policy(&[0.0, 1.0, 2.0]), vec![2.0, 1.0, 0.0]);
    }

    #[test]
    fn labels_form_a_probability_distribution() {
        let (_, policy) = labels(&[(0, -2), (3, 4), (6, 1)]);
        assert!((policy.iter().sum::<f32>() - 1.0).abs() < 1e-6);
        assert_eq!(policy[1], 0.0);
    }
}
