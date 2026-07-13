use rowspire_ai_core::{Cell, GameState};

#[test]
fn test_game_logic() {
    println!("🎮 Game Logic Test");
    println!("==================");

    // Test 1: Basic game flow
    test_basic_game_flow();

    // Test 2: Win detection
    test_win_detection();

    // Test 3: Move validation
    test_move_validation();
}

fn test_basic_game_flow() {
    println!("\n🔄 Test 1: Basic Game Flow");
    println!("-------------------------");

    let mut game_state = GameState::new();
    let first_player = game_state.current_player;
    let second_player = first_player.opponent();

    // First player makes first move
    assert!(game_state.make_move(3).is_ok());
    assert_eq!(game_state.current_player, second_player);
    assert_eq!(game_state.board[3][5], Cell::from_player(first_player)); // Bottom row

    // Second player makes second move
    assert!(game_state.make_move(3).is_ok());
    assert_eq!(game_state.current_player, first_player);
    assert_eq!(game_state.board[3][4], Cell::from_player(second_player)); // Second from bottom

    println!("✅ Basic game flow working correctly");
}

fn test_win_detection() {
    println!("\n🏆 Test 2: Win Detection");
    println!("----------------------");

    // Test vertical win
    let mut game_state = GameState::new();
    let expected_winner = game_state.current_player;

    game_state.make_move(0).unwrap(); // P1 (or starter)
    game_state.make_move(1).unwrap(); // P2
    game_state.make_move(0).unwrap(); // P1
    game_state.make_move(1).unwrap(); // P2
    game_state.make_move(0).unwrap(); // P1
    game_state.make_move(1).unwrap(); // P2
    game_state.make_move(0).unwrap(); // P1 - should win

    println!("Vertical win position:");
    print_board(&game_state);

    assert!(game_state.is_game_over());
    assert!(game_state.has_winner());
    assert_eq!(game_state.get_winner(), Some(expected_winner));

    println!("✅ Vertical win detection working");
}

fn test_move_validation() {
    println!("\n✅ Test 3: Move Validation");
    println!("-------------------------");

    let mut game_state = GameState::new();

    // Fill a column
    for _ in 0..6 {
        assert!(game_state.make_move(0).is_ok());
    }

    // Try to place in full column
    assert!(game_state.make_move(0).is_err());

    println!("✅ Move validation working");
}

fn print_board(game_state: &GameState) {
    for row in (0..6).rev() {
        print!("|");
        for col in 0..7 {
            match game_state.board[col][row] {
                Cell::Empty => print!(" "),
                Cell::Player1 => print!("X"),
                Cell::Player2 => print!("O"),
            }
            print!("|");
        }
        println!();
    }
    println!(" 0 1 2 3 4 5 6");
}
