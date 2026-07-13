use crate::genetic_params::GeneticParams;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::hash::Hash;
use ts_rs::TS;

pub const ROWS: usize = 6;
pub const COLS: usize = 7;
pub const BOARD_SIZE: usize = ROWS * COLS;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum Player {
    Player1 = 0,
    Player2 = 1,
}

impl Player {
    pub fn opponent(self) -> Self {
        match self {
            Self::Player1 => Self::Player2,
            Self::Player2 => Self::Player1,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum Cell {
    Empty,
    Player1,
    Player2,
}

impl Cell {
    pub fn from_player(player: Player) -> Self {
        match player {
            Player::Player1 => Self::Player1,
            Player::Player2 => Self::Player2,
        }
    }

    pub fn to_player(self) -> Option<Player> {
        match self {
            Self::Empty => None,
            Self::Player1 => Some(Player::Player1),
            Self::Player2 => Some(Player::Player2),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct GameState {
    pub board: [[Cell; ROWS]; COLS],
    pub current_player: Player,
    pub genetic_params: GeneticParams,
}

impl Default for GameState {
    fn default() -> Self {
        Self::new()
    }
}

impl GameState {
    pub fn new() -> Self {
        Self::with_first_player(Player::Player1)
    }

    pub fn with_first_player(current_player: Player) -> Self {
        Self {
            board: [[Cell::Empty; ROWS]; COLS],
            current_player,
            genetic_params: GeneticParams::default(),
        }
    }

    pub fn new_random_first_player() -> Self {
        Self::new_random_first_player_with_rng(&mut rand::thread_rng())
    }

    pub fn new_random_first_player_with_rng(rng: &mut impl Rng) -> Self {
        Self::with_first_player(random_player(rng))
    }
}

fn random_player(rng: &mut impl Rng) -> Player {
    if rng.gen_bool(0.5) {
        Player::Player1
    } else {
        Player::Player2
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::{rngs::StdRng, SeedableRng};

    #[test]
    fn seeded_first_player_is_reproducible() {
        let mut first_rng = StdRng::seed_from_u64(42);
        let mut second_rng = StdRng::seed_from_u64(42);

        let first = GameState::new_random_first_player_with_rng(&mut first_rng);
        let second = GameState::new_random_first_player_with_rng(&mut second_rng);

        assert_eq!(first.current_player, second.current_player);
    }
}
