use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct MoveEvaluation {
    pub column: u8,
    pub score: f32,
    #[serde(rename = "moveType")]
    #[ts(rename = "moveType")]
    pub move_type: String,
}
