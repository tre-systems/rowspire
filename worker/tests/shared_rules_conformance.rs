use rowspire_ai_core::{Cell, GameState, Player, COLS, ROWS};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Fixture {
    schema_version: u8,
    cases: Vec<Case>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Case {
    name: String,
    moves: Vec<u8>,
    expected_board: Vec<String>,
    expected_current_player: Player,
    expected_valid_moves: Vec<u8>,
    expected_winner: Option<Player>,
    expected_draw: bool,
    expected_game_over: bool,
}

#[test]
fn shared_game_rule_contract() {
    let fixture: Fixture = serde_json::from_str(include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../resources/conformance/game-rules.json"
    )))
    .unwrap();

    assert_eq!(fixture.schema_version, 1);

    for case in fixture.cases {
        assert_case(&case);
    }
}

fn assert_case(case: &Case) {
    let mut state = GameState::new();

    for &column in &case.moves {
        state
            .make_move(column)
            .unwrap_or_else(|error| panic!("{}: {error}", case.name));
    }

    assert_eq!(board_rows(&state), case.expected_board, "{}", case.name);
    assert_eq!(
        state.current_player, case.expected_current_player,
        "{}",
        case.name
    );
    assert_eq!(
        state.get_valid_moves(),
        case.expected_valid_moves,
        "{}",
        case.name
    );
    assert_eq!(state.get_winner(), case.expected_winner, "{}", case.name);
    assert_eq!(state.is_draw(), case.expected_draw, "{}", case.name);
    assert_eq!(
        state.is_game_over(),
        case.expected_game_over,
        "{}",
        case.name
    );
}

fn board_rows(state: &GameState) -> Vec<String> {
    (0..ROWS)
        .map(|row| {
            (0..COLS)
                .map(|column| match state.board[column][row] {
                    Cell::Empty => '.',
                    Cell::Player1 => '1',
                    Cell::Player2 => '2',
                })
                .collect()
        })
        .collect()
}
