use crate::{Cell, GameState, Player, COLS, ROWS};

const DIRECTIONS: [(i32, i32); 4] = [(1, 0), (0, 1), (1, 1), (1, -1)];

impl GameState {
    pub fn evaluate(&self) -> i32 {
        match self.get_winner() {
            Some(Player::Player1) => 10_000,
            Some(Player::Player2) => -10_000,
            None if self.is_draw() => 0,
            None => self.evaluate_with_genetic_params(),
        }
    }

    pub fn evaluate_with_genetic_params(&self) -> i32 {
        match self.get_winner() {
            Some(Player::Player1) => return self.genetic_params.win_score,
            Some(Player::Player2) => return self.genetic_params.loss_score,
            None if self.is_draw() => return 0,
            None => {}
        }

        let player1 =
            self.positional_score(Player::Player1) + self.weighted_feature_score(Player::Player1);
        let player2 =
            self.positional_score(Player::Player2) + self.weighted_feature_score(Player::Player2);

        player1 - player2
    }

    pub fn center_control_score(&self, player: Player) -> i32 {
        [2, 3, 4]
            .iter()
            .flat_map(|column| (0..ROWS).map(move |row| (*column, row)))
            .filter(|&(column, row)| self.board[column][row] == Cell::from_player(player))
            .map(|(_, row)| (ROWS - row) as i32)
            .sum()
    }

    pub fn pieces_count(&self, player: Player) -> i32 {
        self.board
            .iter()
            .flatten()
            .filter(|cell| **cell == Cell::from_player(player))
            .count() as i32
    }

    pub fn threat_score(&self, player: Player) -> i32 {
        self.get_valid_moves()
            .into_iter()
            .map(|column| self.move_threat_score(column as usize, player))
            .sum()
    }

    pub fn mobility_score(&self, player: Player) -> i32 {
        if self.is_empty_board() {
            return 0;
        }

        self.get_valid_moves()
            .into_iter()
            .filter_map(|column| {
                let mut next = self.clone();
                next.current_player = player;
                next.make_move(column).ok()?;
                Some(next.threat_score(player) / 10)
            })
            .sum()
    }

    pub fn vertical_control_score(&self, player: Player) -> i32 {
        (0..COLS)
            .map(|column| consecutive_score((0..ROWS).map(|row| self.board[column][row]), player))
            .sum()
    }

    pub fn horizontal_control_score(&self, player: Player) -> i32 {
        (0..ROWS)
            .map(|row| consecutive_score((0..COLS).map(|column| self.board[column][row]), player))
            .sum()
    }

    pub fn defensive_score(&self, player: Player) -> i32 {
        self.get_valid_moves()
            .into_iter()
            .filter(|column| self.is_winning_move(*column as usize, player.opponent()))
            .count() as i32
            * 5_000
    }

    fn positional_score(&self, player: Player) -> i32 {
        let values = [
            self.genetic_params.edge_column_value,
            self.genetic_params.outer_column_value,
            self.genetic_params.adjacent_center_value,
            self.genetic_params.center_column_value,
            self.genetic_params.adjacent_center_value,
            self.genetic_params.outer_column_value,
            self.genetic_params.edge_column_value,
        ];

        (0..COLS)
            .flat_map(|column| (0..ROWS).map(move |row| (column, row)))
            .filter(|&(column, row)| self.board[column][row] == Cell::from_player(player))
            .map(|(column, row)| {
                (values[column] as f64
                    * (ROWS - row) as f64
                    * self.genetic_params.row_height_weight) as i32
            })
            .sum()
    }

    fn weighted_feature_score(&self, player: Player) -> i32 {
        let weighted = [
            (
                self.center_control_score(player),
                self.genetic_params.center_control_weight,
            ),
            (
                self.pieces_count(player),
                self.genetic_params.piece_count_weight,
            ),
            (self.threat_score(player), self.genetic_params.threat_weight),
            (
                self.mobility_score(player),
                self.genetic_params.mobility_weight,
            ),
            (
                self.vertical_control_score(player),
                self.genetic_params.vertical_control_weight,
            ),
            (
                self.horizontal_control_score(player),
                self.genetic_params.horizontal_control_weight,
            ),
            (
                self.defensive_score(player),
                self.genetic_params.defensive_weight,
            ),
        ];

        weighted
            .iter()
            .map(|(score, weight)| *score * *weight as i32)
            .sum()
    }

    fn move_threat_score(&self, column: usize, player: Player) -> i32 {
        let Some(row) = self.lowest_empty_row(column) else {
            return 0;
        };
        let mut board = self.board;
        board[column][row] = Cell::from_player(player);

        if Self::check_win_on(&board, column, row, player) {
            10_000
        } else {
            DIRECTIONS
                .iter()
                .map(|&(dcol, drow)| line_threat(&board, column, row, dcol, drow, player))
                .sum()
        }
    }

    fn is_winning_move(&self, column: usize, player: Player) -> bool {
        let Some(row) = self.lowest_empty_row(column) else {
            return false;
        };
        let mut board = self.board;
        board[column][row] = Cell::from_player(player);

        Self::check_win_on(&board, column, row, player)
    }
}

fn consecutive_score(cells: impl Iterator<Item = Cell>, player: Player) -> i32 {
    cells
        .scan(0, |count, cell| {
            *count = if cell == Cell::from_player(player) {
                *count + 1
            } else {
                0
            };
            Some(*count)
        })
        .sum()
}

fn line_threat(
    board: &[[Cell; ROWS]; COLS],
    column: usize,
    row: usize,
    dcol: i32,
    drow: i32,
    player: Player,
) -> i32 {
    let (forward, forward_blocked) = ray(board, column, row, dcol, drow, player);
    let (backward, backward_blocked) = ray(board, column, row, -dcol, -drow, player);
    let consecutive = 1 + forward + backward;
    let blocked = forward_blocked as u8 + backward_blocked as u8;

    match consecutive {
        4.. => 1_000,
        3 if blocked == 0 => 100,
        3 => 10,
        2 if blocked == 0 => 10,
        2 => 1,
        1 if blocked == 0 => 1,
        _ => 0,
    }
}

fn ray(
    board: &[[Cell; ROWS]; COLS],
    column: usize,
    row: usize,
    dcol: i32,
    drow: i32,
    player: Player,
) -> (usize, bool) {
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

    let blocked = in_bounds(column, row) && board[column as usize][row as usize] != Cell::Empty;
    (count, blocked)
}

fn in_bounds(column: i32, row: i32) -> bool {
    (0..COLS as i32).contains(&column) && (0..ROWS as i32).contains(&row)
}
