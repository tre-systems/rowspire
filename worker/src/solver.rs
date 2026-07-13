pub use crate::bitboard::Bitboard;
use crate::ROWS;
use std::collections::HashMap;

const WIDTH: usize = 7;

pub struct Solver {
    transposition_table: HashMap<u64, (i8, u8)>, // Key -> (Score, Depth)
    nodes: u64,
    column_order: [usize; WIDTH],
}

impl Default for Solver {
    fn default() -> Self {
        Self::new()
    }
}

impl Solver {
    pub fn new() -> Self {
        Solver {
            transposition_table: HashMap::with_capacity(1_000_000), // Pre-allocate some space
            nodes: 0,
            column_order: [3, 2, 4, 1, 5, 0, 6],
        }
    }

    pub fn reset(&mut self) {
        self.transposition_table.clear();
        self.nodes = 0;
    }

    pub fn get_nodes_count(&self) -> u64 {
        self.nodes
    }

    pub fn tt_size(&self) -> usize {
        self.transposition_table.len()
    }
    pub fn analyze(&mut self, position: &Bitboard, depth: i32) -> (Option<usize>, i32) {
        self.nodes = 0;

        let mut best_score = -10000;
        let mut best_move = None;

        let search_order = self.column_order;
        for &col in &search_order {
            if position.can_play(col) {
                let mut next_pos = *position;
                next_pos.play(col);

                if next_pos.is_win() {
                    return (
                        Some(col),
                        (WIDTH * ROWS + 1 - position.moves_count as usize) as i32 / 2,
                    );
                }

                let score = -self.negamax(&next_pos, depth - 1, -10000, -best_score);

                if score > best_score {
                    best_score = score;
                    best_move = Some(col);
                }
            }
        }

        (best_move, best_score)
    }

    pub fn analyze_all(&mut self, position: &Bitboard, depth: i32) -> Vec<(usize, i32)> {
        self.nodes = 0;
        let mut evaluations = Vec::new();

        for col in 0..WIDTH {
            if position.can_play(col) {
                let mut next_pos = *position;
                next_pos.play(col);

                if next_pos.is_win() {
                    let score = (WIDTH * ROWS + 1 - next_pos.moves_count as usize) as i32 / 2;
                    evaluations.push((col, score));
                    continue;
                }

                let score = -self.negamax(&next_pos, depth - 1, -10000, 10000);
                evaluations.push((col, score));
            }
        }

        evaluations
    }

    fn negamax(&mut self, position: &Bitboard, depth: i32, mut alpha: i32, mut beta: i32) -> i32 {
        self.nodes += 1;

        if position.moves_count >= (WIDTH * ROWS) as u8 {
            return 0; // Draw
        }

        if depth == 0 {
            return self.heuristic_score(position);
        }

        let key = position.key();
        if let Some(&(val, cached_depth)) = self.transposition_table.get(&key) {
            if cached_depth >= depth as u8 {
                return val as i32;
            }
        }
        let max_possible = (WIDTH * ROWS - position.moves_count as usize + 1) as i32 / 2;
        if beta > max_possible {
            beta = max_possible;
            if alpha >= beta {
                return beta;
            }
        }

        let search_order = self.column_order;
        for &col in &search_order {
            if position.can_play(col) {
                let mut next_pos = *position;
                next_pos.play(col); // flips the player to move

                if next_pos.is_win() {
                    let score = (WIDTH * ROWS + 1 - next_pos.moves_count as usize) as i32 / 2;
                    return score;
                }

                let score = -self.negamax(&next_pos, depth - 1, -beta, -alpha);

                if score >= beta {
                    self.transposition_table
                        .insert(key, (score as i8, depth as u8));
                    return score;
                }
                if score > alpha {
                    alpha = score;
                }
            }
        }

        self.transposition_table
            .insert(key, (alpha as i8, depth as u8));

        alpha
    }
    fn heuristic_score(&self, _position: &Bitboard) -> i32 {
        0
    }
}
