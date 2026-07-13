#[cfg(feature = "wasm")]
use super::ml_ai::MLAI;
#[cfg(feature = "wasm")]
use super::{GameState, AI};
use serde::{Deserialize, Serialize};
#[cfg(feature = "wasm")]
use serde_wasm_bindgen;
use ts_rs::TS;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "wasm")]
use wasm_bindgen::JsValue;

#[derive(Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct MoveEvaluationWasm {
    pub column: u8,
    pub score: f32,
    pub move_type: String,
}

#[derive(Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct WasmBestMoveResponse {
    pub r#move: Option<u8>,
    pub evaluations: Vec<MoveEvaluationWasm>,
    pub nodes_evaluated: u32,
    pub transposition_hits: u32,
}

#[derive(Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct WasmMLResponse {
    pub r#move: Option<u8>,
    pub evaluation: f32,
    pub thinking: String,
    pub diagnostics: crate::ml_ai::MLDiagnostics,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct RowspireAI {
    ai: AI,
    ml_ai: MLAI,
}

#[cfg(feature = "wasm")]
impl Default for RowspireAI {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl RowspireAI {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        RowspireAI {
            ai: AI::new(),
            ml_ai: MLAI::new(),
        }
    }
    pub fn get_best_move(&mut self, board_state: &JsValue, depth: u8) -> Result<JsValue, JsValue> {
        let state: GameState = serde_wasm_bindgen::from_value(board_state.clone())
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let (best_move, evaluations) = self.ai.get_best_move(&state, depth);

        let wasm_evaluations: Vec<MoveEvaluationWasm> = evaluations
            .into_iter()
            .map(|e| MoveEvaluationWasm {
                column: e.column,
                score: e.score,
                move_type: e.move_type,
            })
            .collect();

        let response = WasmBestMoveResponse {
            r#move: best_move,
            evaluations: wasm_evaluations,
            nodes_evaluated: self.ai.nodes_evaluated,
            transposition_hits: self.ai.transposition_hits,
        };

        serde_wasm_bindgen::to_value(&response).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn get_ml_move(&mut self, board_state: &JsValue) -> Result<JsValue, JsValue> {
        let state: GameState = serde_wasm_bindgen::from_value(board_state.clone())
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        if state.is_game_over() {
            return Err(JsValue::from_str("Game is already over"));
        }

        let valid_moves = state.get_valid_moves();
        if valid_moves.is_empty() {
            return Err(JsValue::from_str("No valid moves available"));
        }
        let ml_response = self.ml_ai.get_best_move(&state);

        let response = WasmMLResponse {
            r#move: ml_response.r#move,
            evaluation: ml_response.evaluation,
            thinking: ml_response.thinking,
            diagnostics: ml_response.diagnostics,
        };

        serde_wasm_bindgen::to_value(&response).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn clear_transposition_table(&mut self) {
        self.ai.clear_transposition_table();
    }

    pub fn load_ml_weights(
        &mut self,
        value_weights: &JsValue,
        policy_weights: &JsValue,
    ) -> Result<(), JsValue> {
        let value_weights: Vec<f32> = serde_wasm_bindgen::from_value(value_weights.clone())
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        let policy_weights: Vec<f32> = serde_wasm_bindgen::from_value(policy_weights.clone())
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        if value_weights.len() != 62593 || policy_weights.len() != 63367 {
            return Err(JsValue::from_str(&format!(
                "ML weight size mismatch: expected 62593/63367, received {}/{}",
                value_weights.len(),
                policy_weights.len()
            )));
        }

        self.ml_ai.load_weights(&value_weights, &policy_weights);

        Ok(())
    }
}

#[cfg(all(test, target_arch = "wasm32"))]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    fn test_ai_creation() {
        RowspireAI::new();
    }

    #[wasm_bindgen_test]
    fn test_search_move() {
        let mut ai = RowspireAI::new();
        let game_state = serde_wasm_bindgen::to_value(&GameState::new()).unwrap();
        let result = ai.get_best_move(&game_state, 1).unwrap();
        assert!(!result.is_undefined());
    }

    #[wasm_bindgen_test]
    fn test_ml_move() {
        let mut ai = RowspireAI::new();
        let game_state = serde_wasm_bindgen::to_value(&GameState::new()).unwrap();
        let result = ai.get_ml_move(&game_state).unwrap();
        assert!(!result.is_undefined());
    }
}
