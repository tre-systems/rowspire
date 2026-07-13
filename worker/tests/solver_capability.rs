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

#[test]
fn configured_horizons_choose_distinct_plans() {
    let mut state = GameState::new();
    for column in [1, 2, 6, 5, 1, 6, 4, 4, 4, 6, 6, 2, 2, 2] {
        state.make_move(column).unwrap();
    }

    let relaxed = AI::new().get_best_move(&state, 2).0;
    let standard = AI::new().get_best_move(&state, 6).0;
    let expert = AI::new().get_best_move(&state, 14).0;

    assert_eq!((relaxed, standard, expert), (Some(3), Some(2), Some(1)));
}

fn expert_wins(expert_starts: bool) -> Option<bool> {
    let mut state = GameState::new();
    let mut relaxed = AI::new();
    let mut expert = AI::new();

    while !state.is_game_over() {
        let expert_turn = (state.current_player == Player::Player1) == expert_starts;
        let column = if expert_turn {
            expert.get_best_move(&state, 14).0
        } else {
            relaxed.get_best_move(&state, 2).0
        }
        .expect("active game has a legal move");
        state.make_move(column).unwrap();
    }

    state
        .get_winner()
        .map(|winner| (winner == Player::Player1) == expert_starts)
}

#[test]
fn expert_outperforms_relaxed_in_paired_games() {
    assert_eq!(expert_wins(true), Some(true));
    assert_eq!(expert_wins(false), None);
}
