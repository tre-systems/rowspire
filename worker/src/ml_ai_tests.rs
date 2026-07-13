use super::*;
use crate::{Cell, COLS, ROWS};

#[test]
fn creates_both_networks() {
    let ai = MLAI::new();

    assert!(ai.value_network.num_layers() > 0);
    assert!(ai.policy_network.num_layers() > 0);
}

#[test]
fn evaluates_an_empty_board() {
    let mut ai = MLAI::new();
    let response = ai.get_best_move(&GameState::new());

    assert!(response.r#move.is_some());
    assert_eq!(response.diagnostics.valid_moves.len(), COLS);
    assert_eq!(response.diagnostics.policy_network_outputs.len(), COLS);
}

#[test]
fn handles_a_full_board() {
    let mut ai = MLAI::new();
    let mut state = GameState::new();
    state.board = [[Cell::Player1; ROWS]; COLS];

    let response = ai.get_best_move(&state);

    assert_eq!(response.r#move, None);
    assert!(response.diagnostics.valid_moves.is_empty());
}

#[test]
fn position_evaluation_is_finite() {
    let ai = MLAI::new();
    let evaluation = ai.evaluate_position(&GameState::new());

    assert!(evaluation.is_finite());
}

#[test]
fn move_evaluations_are_sorted() {
    let mut ai = MLAI::new();
    let response = ai.get_best_move(&GameState::new());

    assert_eq!(response.diagnostics.move_evaluations.len(), COLS);
    assert!(response
        .diagnostics
        .move_evaluations
        .windows(2)
        .all(|moves| moves[0].score >= moves[1].score));
}
