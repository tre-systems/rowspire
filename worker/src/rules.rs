use crate::{Cell, GameState, Player, COLS, ROWS};

const DIRECTIONS: [(i32, i32); 4] = [(1, 0), (0, 1), (1, 1), (1, -1)];

impl GameState {
    pub fn is_game_over(&self) -> bool {
        self.has_winner() || self.board_is_full()
    }

    pub fn has_winner(&self) -> bool {
        self.get_winner().is_some()
    }

    pub fn is_draw(&self) -> bool {
        !self.has_winner() && self.board_is_full()
    }

    pub fn is_empty_board(&self) -> bool {
        self.board.iter().flatten().all(|cell| *cell == Cell::Empty)
    }

    pub fn get_winner(&self) -> Option<Player> {
        for col in 0..COLS {
            for row in 0..ROWS {
                if let Some(player) = self.board[col][row].to_player() {
                    if self.check_win_at(col, row, player) {
                        return Some(player);
                    }
                }
            }
        }

        None
    }

    pub fn get_valid_moves(&self) -> Vec<u8> {
        (0..COLS)
            .filter(|column| self.can_place_in_column(*column))
            .map(|column| column as u8)
            .collect()
    }

    pub fn can_place_in_column(&self, column: usize) -> bool {
        column < COLS && self.board[column][0] == Cell::Empty
    }

    pub fn make_move(&mut self, column: u8) -> Result<(), &'static str> {
        if self.is_game_over() {
            return Err("Game is already over");
        }

        let column = column as usize;

        if column >= COLS {
            return Err("Invalid column");
        }

        let row = self.lowest_empty_row(column).ok_or("Column is full")?;
        self.board[column][row] = Cell::from_player(self.current_player);

        if !self.check_win_at(column, row, self.current_player) && !self.board_is_full() {
            self.current_player = self.current_player.opponent();
        }

        Ok(())
    }

    pub(crate) fn lowest_empty_row(&self, column: usize) -> Option<usize> {
        (0..ROWS)
            .rev()
            .find(|row| self.board[column][*row] == Cell::Empty)
    }

    pub(crate) fn board_is_full(&self) -> bool {
        self.board.iter().all(|column| column[0] != Cell::Empty)
    }

    pub(crate) fn check_win_at(&self, column: usize, row: usize, player: Player) -> bool {
        DIRECTIONS
            .iter()
            .any(|&(dcol, drow)| self.count_line(column, row, dcol, drow, player) >= 4)
    }

    pub(crate) fn check_win_on(
        board: &[[Cell; ROWS]; COLS],
        column: usize,
        row: usize,
        player: Player,
    ) -> bool {
        DIRECTIONS
            .iter()
            .any(|&(dcol, drow)| count_line_on(board, column, row, dcol, drow, player) >= 4)
    }

    fn count_line(&self, column: usize, row: usize, dcol: i32, drow: i32, player: Player) -> usize {
        count_line_on(&self.board, column, row, dcol, drow, player)
    }
}

fn count_line_on(
    board: &[[Cell; ROWS]; COLS],
    column: usize,
    row: usize,
    dcol: i32,
    drow: i32,
    player: Player,
) -> usize {
    1 + count_ray(board, column, row, dcol, drow, player)
        + count_ray(board, column, row, -dcol, -drow, player)
}

fn count_ray(
    board: &[[Cell; ROWS]; COLS],
    column: usize,
    row: usize,
    dcol: i32,
    drow: i32,
    player: Player,
) -> usize {
    let mut column = column as i32 + dcol;
    let mut row = row as i32 + drow;
    let mut count = 0;

    while in_bounds(column, row)
        && board[column as usize][row as usize] == Cell::from_player(player)
    {
        count += 1;
        column += dcol;
        row += drow;
    }

    count
}

fn in_bounds(column: i32, row: i32) -> bool {
    (0..COLS as i32).contains(&column) && (0..ROWS as i32).contains(&row)
}
