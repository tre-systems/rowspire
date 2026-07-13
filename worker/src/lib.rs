mod bitboard;
mod evaluation;
mod game;
mod network_layer;
mod network_training;
mod rules;
mod search_ai;

pub mod features;
pub mod genetic_params;
pub mod mcts;
pub mod ml_ai;
mod ml_tactics;
pub mod neural_network;
pub mod solver;
pub mod wasm_api;

pub use game::{Cell, GameState, Player, BOARD_SIZE, COLS, ROWS};
pub use search_ai::{HeuristicAI, MoveEvaluation, AI};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn player_opponent_is_symmetric() {
        assert_eq!(Player::Player1.opponent(), Player::Player2);
        assert_eq!(Player::Player2.opponent(), Player::Player1);
    }

    #[test]
    fn new_game_has_all_columns_available() {
        assert_eq!(
            GameState::new().get_valid_moves(),
            (0..COLS as u8).collect::<Vec<_>>()
        );
    }

    #[test]
    fn search_returns_a_legal_move() {
        let state = GameState::new();
        let (best_move, _) = AI::new().get_best_move(&state, 3);

        assert!(best_move.is_some_and(|column| state.get_valid_moves().contains(&column)));
    }
}
