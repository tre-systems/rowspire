use super::*;

#[test]
fn empty_board_has_only_player_perspective() {
    let features = GameFeatures::from_game_state(&GameState::new()).features;

    assert!(features[..SIZE - 1].iter().all(|value| *value == 0.0));
    assert_eq!(features[SIZE - 1], 1.0);
}

#[test]
fn pieces_are_encoded_relative_to_current_player() {
    let mut state = GameState::new();
    state.make_move(3).unwrap();
    let features = GameFeatures::from_game_state(&state).features;

    assert_eq!(features[BOARD_SIZE + 3 * ROWS + ROWS - 1], 1.0);
    assert_eq!(features[BOARD_SIZE + 3], 0.0);
    assert_eq!(features[SIZE - 1], -1.0);
}

#[test]
fn feature_vector_is_finite() {
    let mut state = GameState::new();
    for column in [3, 2, 3, 2, 4, 1] {
        state.make_move(column).unwrap();
    }

    assert!(GameFeatures::from_game_state(&state)
        .features
        .iter()
        .all(|value| value.is_finite()));
}
