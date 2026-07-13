use super::features::GameFeatures;
use super::ml_network::{create_networks, expected_weight_counts};
use super::ml_tactics::tactical_move;
use super::neural_network::NeuralNetwork;
use super::{GameState, COLS};
pub use crate::ml_types::{MLDiagnostics, MLResponse};
use crate::MoveEvaluation;

pub struct MLAI {
    pub value_network: NeuralNetwork,
    pub policy_network: NeuralNetwork,
    pub mcts_simulations: usize,
    mcts_seed: Option<u64>,
}

fn tactical_response(valid_moves: Vec<u8>, column: u8, move_type: &str) -> MLResponse {
    MLResponse {
        r#move: Some(column),
        evaluation: 1.0,
        thinking: format!("Tactical move in column {column}: {move_type}"),
        diagnostics: MLDiagnostics {
            valid_moves,
            move_evaluations: vec![MoveEvaluation {
                column,
                score: 1.0,
                move_type: move_type.to_string(),
            }],
            value_network_output: 0.0,
            policy_network_outputs: vec![0.0; COLS],
        },
    }
}

impl Default for MLAI {
    fn default() -> Self {
        Self::new()
    }
}

impl MLAI {
    pub fn new() -> Self {
        Self::create(None)
    }

    pub fn new_with_seed(seed: u64) -> Self {
        Self::create(Some(seed))
    }

    fn create(seed: Option<u64>) -> Self {
        let simulations = if cfg!(debug_assertions) { 200 } else { 4000 };
        let (value_network, policy_network) = create_networks(seed);

        Self {
            value_network,
            policy_network,
            mcts_simulations: simulations,
            mcts_seed: seed,
        }
    }

    pub fn get_best_move(&mut self, state: &GameState) -> MLResponse {
        let valid_moves = state.get_valid_moves();

        if valid_moves.is_empty() {
            return MLResponse {
                r#move: None,
                evaluation: 0.0,
                thinking: "No valid moves available".to_string(),
                diagnostics: MLDiagnostics {
                    valid_moves: vec![],
                    move_evaluations: vec![],
                    value_network_output: 0.0,
                    policy_network_outputs: vec![0.0; COLS],
                },
            };
        }

        if let Some((column, move_type)) = tactical_move(state, &valid_moves) {
            return tactical_response(valid_moves, column, move_type);
        }

        if valid_moves.len() == 1 {
            return MLResponse {
                r#move: Some(valid_moves[0]),
                evaluation: 0.0,
                thinking: "Only one valid move".to_string(),
                diagnostics: MLDiagnostics {
                    valid_moves: valid_moves.clone(),
                    move_evaluations: vec![],
                    value_network_output: 0.0,
                    policy_network_outputs: vec![0.0; COLS],
                },
            };
        }

        let features = GameFeatures::from_game_state(state);
        let feature_array = features.to_array();
        let raw_value = self.value_network.forward(&feature_array)[0];
        let raw_policy = self.policy_network.forward(&feature_array);

        let mut mcts = match self.mcts_seed {
            Some(seed) => super::mcts::MCTS::new_with_seed(1.41, self.mcts_simulations, seed),
            None => super::mcts::MCTS::new(1.41, self.mcts_simulations),
        };

        let value_net = &self.value_network;
        let policy_net = &self.policy_network;

        let value_fn = |s: &GameState| -> f32 {
            let f = GameFeatures::from_game_state(s);
            value_net.forward(&f.to_array())[0]
        };

        let policy_fn = |s: &GameState| -> Vec<f32> {
            let f = GameFeatures::from_game_state(s);
            policy_net.forward(&f.to_array()).to_vec()
        };

        let (best_move, move_probs) = mcts.search(state.clone(), &value_fn, &policy_fn, 0.0, true);

        let mut move_evaluations: Vec<_> = valid_moves
            .iter()
            .map(|&column| MoveEvaluation {
                column,
                score: move_probs[column as usize],
                move_type: "mcts_visit_prob".to_string(),
            })
            .collect();
        move_evaluations.sort_by(|left, right| right.score.total_cmp(&left.score));

        MLResponse {
            r#move: Some(best_move),
            evaluation: raw_value,
            thinking: format!(
                "MCTS searched {} sims. Best move col {} with visit prob {:.3}. Terminals: {}. Raw Value: {:.3}",
                self.mcts_simulations,
                best_move,
                move_probs[best_move as usize],
                mcts.terminal_nodes_found,
                raw_value
            ),
            diagnostics: MLDiagnostics {
                valid_moves,
                move_evaluations,
                value_network_output: raw_value,
                policy_network_outputs: raw_policy.to_vec(),
            },
        }
    }

    pub fn evaluate_position(&self, state: &GameState) -> f32 {
        let features = GameFeatures::from_game_state(state);
        let value = self.value_network.forward(&features.to_array());
        value[0]
    }

    pub fn load_weights(
        &mut self,
        value_weights: &[f32],
        policy_weights: &[f32],
    ) -> Result<(), String> {
        let (expected_value, expected_policy) = expected_weight_counts();
        validate_weight_count("value", value_weights.len(), expected_value)?;
        validate_weight_count("policy", policy_weights.len(), expected_policy)?;
        self.value_network
            .load_weights(value_weights)
            .map_err(|error| format!("value {error}"))?;
        self.policy_network
            .load_weights(policy_weights)
            .map_err(|error| format!("policy {error}"))
    }
}

fn validate_weight_count(name: &str, actual: usize, expected: usize) -> Result<(), String> {
    if actual == expected {
        Ok(())
    } else {
        Err(format!(
            "{name} network weight count mismatch: expected {expected}, received {actual}"
        ))
    }
}

#[cfg(test)]
#[path = "ml_ai_tests.rs"]
mod tests;
