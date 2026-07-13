use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[ts(export)]
pub struct GeneticParams {
    pub id: String,
    pub parent_ids: Vec<String>,
    pub generation: usize,
    pub win_score: i32,
    pub loss_score: i32,
    pub center_column_value: i32,
    pub adjacent_center_value: i32,
    pub outer_column_value: i32,
    pub edge_column_value: i32,
    pub row_height_weight: f64,
    pub center_control_weight: f64,
    pub piece_count_weight: f64,
    pub threat_weight: f64,
    pub mobility_weight: f64,
    pub vertical_control_weight: f64,
    pub horizontal_control_weight: f64,
    pub defensive_weight: f64,
}

impl Default for GeneticParams {
    fn default() -> Self {
        Self {
            id: "default".into(),
            parent_ids: Vec::new(),
            generation: 0,
            win_score: 10_000,
            loss_score: -10_000,
            center_column_value: 165,
            adjacent_center_value: 97,
            outer_column_value: 17,
            edge_column_value: 6,
            row_height_weight: 1.798,
            center_control_weight: 2.022,
            piece_count_weight: 0.965,
            threat_weight: 1.588,
            mobility_weight: 1.453,
            vertical_control_weight: 2.862,
            horizontal_control_weight: 1.344,
            defensive_weight: 1.372,
        }
    }
}
