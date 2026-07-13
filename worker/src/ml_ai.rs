use super::features::GameFeatures;
use super::ml_tactics::tactical_move;
use super::neural_network::{NetworkConfig, NeuralNetwork};
use super::GameState;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct MLMoveEvaluation {
    pub column: u8,
    pub score: f32,
    pub move_type: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct MLDiagnostics {
    pub valid_moves: Vec<u8>,
    pub move_evaluations: Vec<MLMoveEvaluation>,
    pub value_network_output: f32,
    pub policy_network_outputs: Vec<f32>,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct MLResponse {
    pub r#move: Option<u8>,
    pub evaluation: f32,
    pub thinking: String,
    pub diagnostics: MLDiagnostics,
}

pub struct MLAI {
    pub value_network: NeuralNetwork,
    pub policy_network: NeuralNetwork,
    pub mcts_simulations: usize,
}

fn tactical_response(valid_moves: Vec<u8>, column: u8, move_type: &str) -> MLResponse {
    MLResponse {
        r#move: Some(column),
        evaluation: 1.0,
        thinking: format!("Tactical move in column {column}: {move_type}"),
        diagnostics: MLDiagnostics {
            valid_moves,
            move_evaluations: vec![MLMoveEvaluation {
                column,
                score: 1.0,
                move_type: move_type.to_string(),
            }],
            value_network_output: 0.0,
            policy_network_outputs: vec![0.0; 7],
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
        let value_config = NetworkConfig {
            input_size: 100,
            hidden_sizes: vec![128, 128, 128, 128],
            output_size: 1,
            use_skip_connections: true,
        };
        let policy_config = NetworkConfig {
            input_size: 100,
            hidden_sizes: vec![128, 128, 128, 128],
            output_size: 7,
            use_skip_connections: true,
        };

        let simulations = if cfg!(debug_assertions) { 200 } else { 4000 };

        MLAI {
            value_network: NeuralNetwork::new(value_config),
            policy_network: NeuralNetwork::new(policy_config),
            mcts_simulations: simulations,
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
                    policy_network_outputs: vec![0.0; 7],
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
                    policy_network_outputs: vec![0.0; 7],
                },
            };
        }

        let features = GameFeatures::from_game_state(state);
        let raw_value = self.value_network.forward(&features.to_array())[0];
        let raw_policy = self.policy_network.forward(&features.to_array());

        let mut mcts = super::mcts::MCTS::new(1.41, self.mcts_simulations);

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

        let mut move_evaluations = Vec::new();
        for &col in &valid_moves {
            let prob = move_probs[col as usize];
            move_evaluations.push(MLMoveEvaluation {
                column: col,
                score: prob,
                move_type: "mcts_visit_prob".to_string(),
            });
        }

        move_evaluations.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());

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

    pub fn load_weights(&mut self, value_weights: &[f32], policy_weights: &[f32]) {
        self.value_network.load_weights(value_weights);
        self.policy_network.load_weights(policy_weights);
    }
}

#[cfg(test)]
#[path = "ml_ai_tests.rs"]
mod tests;
