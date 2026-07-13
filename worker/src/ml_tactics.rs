use super::{GameState, Player};

fn winning_move(state: &GameState, valid_moves: &[u8], player: Player) -> Option<u8> {
    valid_moves.iter().copied().find(|&column| {
        let mut next = state.clone();
        next.current_player = player;
        next.make_move(column).is_ok() && next.get_winner() == Some(player)
    })
}

pub fn tactical_move(state: &GameState, valid_moves: &[u8]) -> Option<(u8, &'static str)> {
    let player = state.current_player;
    winning_move(state, valid_moves, player)
        .map(|column| (column, "immediate_win"))
        .or_else(|| {
            winning_move(state, valid_moves, player.opponent())
                .map(|column| (column, "immediate_block"))
        })
}
