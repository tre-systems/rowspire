use rowspire_ai_core::{Cell, GameState, Player, COLS, ROWS};

const DRAW_GAME: [u8; 42] = [
    0, 1, 6, 1, 0, 1, 5, 4, 4, 6, 3, 4, 1, 5, 5, 0, 5, 2, 3, 2, 0, 3, 2, 0, 4, 1, 0, 5, 2, 5, 1, 3,
    2, 2, 3, 6, 3, 6, 6, 4, 4, 6,
];

#[test]
fn empty_board_contract() {
    let state = GameState::new();

    assert_eq!(state.current_player, Player::Player1);
    assert_eq!(state.get_valid_moves(), vec![0, 1, 2, 3, 4, 5, 6]);
    assert_eq!(state.get_winner(), None);
    assert!(!state.is_draw());
    assert!(!state.is_game_over());
}

#[test]
fn moves_drop_from_bottom_and_switch_player() {
    let mut state = GameState::new();

    state.make_move(3).unwrap();
    state.make_move(3).unwrap();

    assert_eq!(state.board[3][ROWS - 1], Cell::Player1);
    assert_eq!(state.board[3][ROWS - 2], Cell::Player2);
    assert_eq!(state.current_player, Player::Player1);
}

#[test]
fn full_columns_and_out_of_range_columns_are_rejected() {
    let mut state = GameState::new();

    for _ in 0..ROWS {
        state.make_move(0).unwrap();
    }

    assert_eq!(state.get_valid_moves(), vec![1, 2, 3, 4, 5, 6]);
    assert_eq!(state.make_move(0), Err("Column is full"));
    assert_eq!(state.make_move(COLS as u8), Err("Invalid column"));
}

#[test]
fn wins_are_detected_in_every_direction() {
    assert_win(&[0, 0, 1, 1, 2, 2, 3], Player::Player1);
    assert_win(&[0, 1, 0, 1, 0, 1, 0], Player::Player1);
    assert_win(&[0, 1, 1, 2, 4, 2, 2, 3, 4, 3, 4, 3, 3], Player::Player1);
    assert_win(&[6, 5, 5, 4, 2, 4, 4, 3, 2, 3, 2, 3, 3], Player::Player1);
}

#[test]
fn lines_longer_than_four_are_wins() {
    let mut state = GameState::new();
    for column in 0..5 {
        state.board[column][ROWS - 1] = Cell::Player1;
    }

    assert_eq!(state.get_winner(), Some(Player::Player1));
}

#[test]
fn a_full_board_without_a_winner_is_a_draw() {
    let state = play(&DRAW_GAME);

    assert!(state.get_valid_moves().is_empty());
    assert_eq!(state.current_player, Player::Player2);
    assert_eq!(state.get_winner(), None);
    assert!(state.is_draw());
    assert!(state.is_game_over());
}

#[test]
fn terminal_games_reject_further_moves() {
    let mut state = play(&[0, 1, 0, 1, 0, 1, 0]);
    let terminal = state.clone();

    assert_eq!(state.make_move(2), Err("Game is already over"));
    assert_eq!(state.board, terminal.board);
    assert_eq!(state.current_player, terminal.current_player);
}

#[test]
fn a_full_board_with_a_winner_is_not_a_draw() {
    let mut state = GameState::new();
    state.board = [[Cell::Player1; ROWS]; COLS];

    assert_eq!(state.get_winner(), Some(Player::Player1));
    assert!(!state.is_draw());
    assert!(state.is_game_over());
}

fn assert_win(moves: &[u8], player: Player) {
    let state = play(moves);

    assert_eq!(state.get_winner(), Some(player));
    assert_eq!(state.current_player, player);
    assert!(state.is_game_over());
    assert!(!state.is_draw());
}

fn play(moves: &[u8]) -> GameState {
    let mut state = GameState::new();

    for &column in moves {
        state.make_move(column).unwrap();
    }

    state
}
