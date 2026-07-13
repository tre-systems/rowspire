use crate::feature_scores::FeatureScores;
use crate::{Cell, GameState, Player, BOARD_SIZE, COLS, ROWS};
use ndarray::Array1;

pub const SIZE: usize = 100;

#[derive(Clone, Debug)]
pub struct GameFeatures {
    pub features: [f32; SIZE],
}

impl GameFeatures {
    pub fn from_game_state(state: &GameState) -> Self {
        let mut features = [0.0; SIZE];
        let player = state.current_player;
        encode_pieces(state, player, &mut features[..BOARD_SIZE]);
        encode_pieces(
            state,
            player.opponent(),
            &mut features[BOARD_SIZE..BOARD_SIZE * 2],
        );
        features[BOARD_SIZE * 2..].copy_from_slice(&FeatureScores::encode(state, player));
        Self { features }
    }

    pub fn to_array(&self) -> Array1<f32> {
        Array1::from_vec(self.features.to_vec())
    }
}

fn encode_pieces(state: &GameState, player: Player, output: &mut [f32]) {
    for column in 0..COLS {
        for row in 0..ROWS {
            output[column * ROWS + row] =
                (state.board[column][row] == Cell::from_player(player)) as u8 as f32;
        }
    }
}

#[cfg(test)]
#[path = "features_tests.rs"]
mod tests;
