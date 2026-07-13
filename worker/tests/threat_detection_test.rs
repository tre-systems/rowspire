use rowspire_ai_core::{ml_ai::MLAI, Cell, GameState, Player};

fn vertical_threat(player: Player, column: usize) -> GameState {
    let mut state = GameState::new();
    state.current_player = Player::Player1;

    for row in 3..6 {
        state.board[column][row] = Cell::from_player(player);
    }

    state
}

#[test]
fn ml_ai_takes_an_immediate_win() {
    let mut ai = MLAI::new();
    let state = vertical_threat(Player::Player1, 0);

    let response = ai.get_best_move(&state);

    assert_eq!(response.r#move, Some(0));
    assert_eq!(
        response.diagnostics.move_evaluations[0].move_type,
        "immediate_win"
    );
}

#[test]
fn ml_ai_blocks_an_immediate_loss() {
    let mut ai = MLAI::new();
    let state = vertical_threat(Player::Player2, 4);

    let response = ai.get_best_move(&state);

    assert_eq!(response.r#move, Some(4));
    assert_eq!(
        response.diagnostics.move_evaluations[0].move_type,
        "immediate_block"
    );
}

#[test]
fn ml_ai_prefers_an_immediate_win_over_a_block() {
    let mut ai = MLAI::new();
    let mut state = vertical_threat(Player::Player1, 0);

    for row in 3..6 {
        state.board[4][row] = Cell::Player2;
    }

    let response = ai.get_best_move(&state);

    assert_eq!(response.r#move, Some(0));
    assert_eq!(
        response.diagnostics.move_evaluations[0].move_type,
        "immediate_win"
    );
}
