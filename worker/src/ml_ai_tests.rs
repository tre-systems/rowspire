use super::*;
use crate::{Cell, COLS, ROWS};

#[test]
fn creates_both_networks() {
    let ai = MLAI::new();

    assert!(ai.value_network.num_layers() > 0);
    assert!(ai.policy_network.num_layers() > 0);
}

#[test]
fn seeded_initialization_is_reproducible() {
    let first = MLAI::new_with_seed(42);
    let second = MLAI::new_with_seed(42);

    assert_eq!(
        first.value_network.get_weights(),
        second.value_network.get_weights()
    );
    assert_eq!(
        first.policy_network.get_weights(),
        second.policy_network.get_weights()
    );
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

#[test]
fn rejects_incomplete_weight_sets() {
    let mut ai = MLAI::new_with_seed(42);

    assert_eq!(
        ai.load_weights(&[0.0], &[0.0]).unwrap_err(),
        "value network weight count mismatch: expected 62593, received 1"
    );
}

#[test]
fn weight_loading_is_atomic() {
    let mut ai = MLAI::new_with_seed(42);
    let original = ai.value_network.get_weights();
    let (value_count, _) = expected_weight_counts();

    assert!(ai.load_weights(&vec![0.0; value_count], &[0.0]).is_err());
    assert_eq!(ai.value_network.get_weights(), original);
}
