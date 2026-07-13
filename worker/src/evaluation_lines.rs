use crate::{Cell, Player, COLS, ROWS};

pub(crate) const DIRECTIONS: [(i32, i32); 4] = [(1, 0), (0, 1), (1, 1), (1, -1)];

pub(crate) fn consecutive_score(cells: impl Iterator<Item = Cell>, player: Player) -> i32 {
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

pub(crate) fn line_threat(
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
