use rowspire_ai_core::{genetic_params::GeneticParams, ml_ai::MLAI, Cell, GameState, Player};

const BOARD: [&str; 6] = [
    "🟢⚫🟢🟣⚫🟢🟣",
    "🟣⚫🟣🟢⚫🟢🟢",
    "🟢⚫🟢🟣⚫🟣🟣",
    "🟣⚫🟣🟢⚫🟢🟢",
    "🟣⚫🟢🟢🟢🟣🟣",
    "🟣⚫🟢🟣🟣🟣🟢",
];

fn parse_board() -> GameState {
    let mut board = [[Cell::Empty; 6]; 7];

    for (row, line) in BOARD.iter().enumerate() {
        for (column, symbol) in line.chars().enumerate() {
            board[column][row] = match symbol {
                '🟢' => Cell::Player1,
                '🟣' => Cell::Player2,
                _ => Cell::Empty,
            };
        }
    }

    GameState {
        board,
        current_player: Player::Player2,
        genetic_params: GeneticParams::default(),
    }
}

#[test]
fn ml_ai_takes_the_reproduced_endgame_win() {
    let mut state = parse_board();
    let response = MLAI::new().get_best_move(&state);

    assert_eq!(response.r#move, Some(4));
    assert_eq!(
        response.diagnostics.move_evaluations[0].move_type,
        "immediate_win"
    );

    state.make_move(response.r#move.unwrap()).unwrap();
    assert_eq!(state.get_winner(), Some(Player::Player2));
}
