use crate::{Cell, GameState, Player, COLS, ROWS};

const DIRECTIONS: [(i32, i32); 4] = [(1, 0), (0, 1), (1, 1), (1, -1)];

pub(crate) struct FeatureScores;

impl FeatureScores {
    pub(crate) fn encode(state: &GameState, player: Player) -> [f32; 16] {
        let opponent = player.opponent();
        [
            Self::center(state, player) as f32 / 10.0,
            Self::center(state, opponent) as f32 / 10.0,
            Self::pieces(state, player) as f32 / 21.0,
            Self::pieces(state, opponent) as f32 / 21.0,
            Self::threats(state, player) as f32 / 100.0,
            Self::threats(state, opponent) as f32 / 100.0,
            Self::mobility(state, player) as f32 / 10.0,
            Self::mobility(state, opponent) as f32 / 10.0,
            Self::vertical(state, player) as f32 / 10.0,
            Self::vertical(state, opponent) as f32 / 10.0,
            Self::horizontal(state, player) as f32 / 10.0,
            Self::horizontal(state, opponent) as f32 / 10.0,
            Self::diagonal(state, player) as f32 / 10.0,
            Self::diagonal(state, opponent) as f32 / 10.0,
            Self::blocking(state, player) as f32 / 10.0,
            if player == Player::Player1 { 1.0 } else { -1.0 },
        ]
    }

    fn pieces(state: &GameState, player: Player) -> i32 {
        state
            .board
            .iter()
            .flatten()
            .filter(|cell| **cell == Cell::from_player(player))
            .count() as i32
    }

    fn center(state: &GameState, player: Player) -> i32 {
        [2, 3, 4]
            .iter()
            .flat_map(|column| (0..ROWS).map(move |row| (*column, row)))
            .filter(|&(column, row)| state.board[column][row] == Cell::from_player(player))
            .map(|(column, _)| match column {
                3 => state.genetic_params.center_column_value,
                2 | 4 => state.genetic_params.adjacent_center_value,
                _ => state.genetic_params.outer_column_value,
            })
            .sum()
    }

    fn threats(state: &GameState, player: Player) -> i32 {
        (0..COLS)
            .flat_map(|column| (0..ROWS).map(move |row| (column, row)))
            .filter(|&(column, row)| state.board[column][row] == Cell::from_player(player))
            .flat_map(|(column, row)| {
                DIRECTIONS.map(|(dcol, drow)| {
                    let (forward, forward_blocked) = ray(state, column, row, dcol, drow, player);
                    let (backward, backward_blocked) =
                        ray(state, column, row, -dcol, -drow, player);
                    threat_value(1 + forward + backward, forward_blocked + backward_blocked)
                })
            })
            .sum()
    }

    fn mobility(state: &GameState, player: Player) -> i32 {
        state
            .get_valid_moves()
            .into_iter()
            .filter_map(|column| {
                let mut next = state.clone();
                next.make_move(column).ok()?;
                Some(Self::threats(&next, player) / 10)
            })
            .sum()
    }

    fn vertical(state: &GameState, player: Player) -> i32 {
        (0..COLS)
            .map(|column| consecutive((0..ROWS).map(|row| state.board[column][row]), player))
            .sum()
    }

    fn horizontal(state: &GameState, player: Player) -> i32 {
        (0..ROWS)
            .map(|row| consecutive((0..COLS).map(|column| state.board[column][row]), player))
            .sum()
    }

    fn diagonal(state: &GameState, player: Player) -> i32 {
        let mut score = 0;
        for column in 0..COLS {
            for row in 0..ROWS {
                for (dcol, drow) in [(1, 1), (1, -1)] {
                    score += diagonal_from(state, column, row, dcol, drow, player);
                }
            }
        }
        score
    }

    fn blocking(state: &GameState, player: Player) -> i32 {
        state
            .get_valid_moves()
            .into_iter()
            .filter_map(|column| {
                let mut next = state.clone();
                next.make_move(column).ok()?;
                Some(Self::threats(&next, player.opponent()) / 10)
            })
            .sum()
    }
}

fn ray(
    state: &GameState,
    column: usize,
    row: usize,
    dcol: i32,
    drow: i32,
    player: Player,
) -> (i32, i32) {
    let mut column = column as i32 + dcol;
    let mut row = row as i32 + drow;
    let mut count = 0;
    while in_bounds(column, row)
        && state.board[column as usize][row as usize] == Cell::from_player(player)
    {
        count += 1;
        column += dcol;
        row += drow;
    }
    let blocked = (in_bounds(column, row)
        && state.board[column as usize][row as usize] != Cell::Empty) as i32;
    (count, blocked)
}

fn threat_value(consecutive: i32, blocked: i32) -> i32 {
    match consecutive {
        4 => 1_000,
        3 if blocked == 0 => 100,
        3 => 10,
        2 if blocked == 0 => 10,
        2 => 1,
        _ => 0,
    }
}

fn consecutive(cells: impl Iterator<Item = Cell>, player: Player) -> i32 {
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

fn diagonal_from(
    state: &GameState,
    column: usize,
    row: usize,
    dcol: i32,
    drow: i32,
    player: Player,
) -> i32 {
    let mut column = column as i32;
    let mut row = row as i32;
    let mut count = 0;
    let mut score = 0;
    while in_bounds(column, row) {
        count = if state.board[column as usize][row as usize] == Cell::from_player(player) {
            count + 1
        } else {
            0
        };
        score += count;
        column += dcol;
        row += drow;
    }
    score
}

fn in_bounds(column: i32, row: i32) -> bool {
    (0..COLS as i32).contains(&column) && (0..ROWS as i32).contains(&row)
}
