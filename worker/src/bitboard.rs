use crate::{Cell, GameState, Player, COLS, ROWS};

const HEIGHT: usize = 6;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct Bitboard {
    player_board: u64,
    mask: u64,
    pub(crate) moves_count: u8,
}

impl Default for Bitboard {
    fn default() -> Self {
        Self::new()
    }
}

impl Bitboard {
    pub fn new() -> Self {
        Self {
            player_board: 0,
            mask: 0,
            moves_count: 0,
        }
    }

    pub fn can_play(&self, column: usize) -> bool {
        (self.mask & top_mask(column)) == 0
    }

    pub fn play(&mut self, column: usize) {
        self.player_board ^= self.mask;
        self.mask |= self.mask + bottom_mask(column);
        self.player_board ^= self.mask;
        self.player_board ^= self.mask;
        self.moves_count += 1;
    }

    pub fn is_win(&self) -> bool {
        Self::alignment(self.player_board ^ self.mask)
    }

    pub fn alignment(position: u64) -> bool {
        [(7, 14), (6, 12), (8, 16), (1, 2)]
            .iter()
            .any(|&(first, second)| {
                let adjacent = position & (position >> first);
                adjacent & (adjacent >> second) != 0
            })
    }

    pub fn key(&self) -> u64 {
        self.player_board + self.mask
    }

    pub fn from_game_state(state: &GameState) -> Self {
        let mut player1 = 0;
        let mut player2 = 0;

        for column in 0..COLS {
            for row in 0..ROWS {
                let bit = 1 << (column * 7 + (ROWS - 1 - row));

                match state.board[column][row] {
                    Cell::Player1 => player1 |= bit,
                    Cell::Player2 => player2 |= bit,
                    Cell::Empty => {}
                }
            }
        }

        let mask = player1 | player2;
        let player_board = match state.current_player {
            Player::Player1 => player1,
            Player::Player2 => player2,
        };

        Self {
            player_board,
            mask,
            moves_count: mask.count_ones() as u8,
        }
    }
}

const fn top_mask(column: usize) -> u64 {
    1 << (HEIGHT - 1 + column * (HEIGHT + 1))
}

const fn bottom_mask(column: usize) -> u64 {
    1 << (column * (HEIGHT + 1))
}
