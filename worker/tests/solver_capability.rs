use rowspire_ai_core::{Cell, GameState, Player, AI, COLS, ROWS};

fn state(rows: [&str; ROWS], player: Player) -> GameState {
    let mut state = GameState::with_first_player(player);
    for (row, cells) in rows.iter().enumerate() {
        for (column, cell) in cells.chars().enumerate() {
            state.board[column][row] = match cell {
                '1' => Cell::Player1,
                '2' => Cell::Player2,
                _ => Cell::Empty,
            };
        }
    }
    state
}

#[test]
fn blocks_an_immediate_horizontal_loss() {
    let state = state(
        [
            ".......", ".......", ".......", ".......", ".......", "222....",
        ],
        Player::Player1,
    );

    assert_eq!(AI::new().get_best_move(&state, 4).0, Some(3));
}

#[test]
fn takes_an_immediate_vertical_win() {
    let state = state(
        [
            ".......", ".......", ".......", "...1...", "..21...", "..21...",
        ],
        Player::Player1,
    );

    assert_eq!(AI::new().get_best_move(&state, 4).0, Some(3));
}

#[test]
fn always_returns_legal_moves_during_a_game() {
    let mut state = GameState::new();
    let mut ai = AI::new();

    while !state.is_game_over() {
        let valid_moves = state.get_valid_moves();
        let column = ai
            .get_best_move(&state, 2)
            .0
            .expect("non-terminal game has a move");
        assert!(valid_moves.contains(&column));
        state.make_move(column).unwrap();
    }

    assert!(state.get_winner().is_some() || state.get_valid_moves().len() < COLS);
}
