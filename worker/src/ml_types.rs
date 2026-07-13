use crate::MoveEvaluation;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct MLDiagnostics {
    pub valid_moves: Vec<u8>,
    pub move_evaluations: Vec<MoveEvaluation>,
    pub value_network_output: f32,
    pub policy_network_outputs: Vec<f32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MLResponse {
    pub r#move: Option<u8>,
    pub evaluation: f32,
    pub thinking: String,
    pub diagnostics: MLDiagnostics,
}
