pub use crate::bitboard::Bitboard;
use crate::{BOARD_SIZE, COLS};
use std::collections::HashMap;

type Transposition = (i8, u8);

pub struct Solver {
    transposition_table: HashMap<u64, Transposition>,
    nodes: u64,
    transposition_hits: u64,
    column_order: [usize; COLS],
}

impl Default for Solver {
    fn default() -> Self {
        Self::new()
    }
}

impl Solver {
    pub fn new() -> Self {
        Self {
            transposition_table: HashMap::with_capacity(1_000_000),
            nodes: 0,
            transposition_hits: 0,
            column_order: [3, 2, 4, 1, 5, 0, 6],
        }
    }

    pub fn reset(&mut self) {
        self.transposition_table.clear();
        self.nodes = 0;
        self.transposition_hits = 0;
    }

    pub fn get_nodes_count(&self) -> u64 {
        self.nodes
    }

    pub fn tt_size(&self) -> usize {
        self.transposition_table.len()
    }

    pub fn transposition_hits(&self) -> u64 {
        self.transposition_hits
    }

    pub fn analyze(&mut self, position: &Bitboard, depth: u8) -> (Option<usize>, i32) {
        self.nodes = 0;
        self.transposition_hits = 0;

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
                        (BOARD_SIZE + 1 - position.moves_count as usize) as i32 / 2,
                    );
                }

                let score = -self.negamax(&next_pos, depth.saturating_sub(1), -10000, -best_score);

                if score > best_score {
                    best_score = score;
                    best_move = Some(col);
                }
            }
        }

        (best_move, best_score)
    }

    pub fn analyze_all(&mut self, position: &Bitboard, depth: u8) -> Vec<(usize, i32)> {
        self.nodes = 0;
        self.transposition_hits = 0;
        let mut evaluations = Vec::new();

        for col in 0..COLS {
            if position.can_play(col) {
                let mut next_pos = *position;
                next_pos.play(col);

                if next_pos.is_win() {
                    let score = (BOARD_SIZE + 1 - next_pos.moves_count as usize) as i32 / 2;
                    evaluations.push((col, score));
                    continue;
                }

                let score = -self.negamax(&next_pos, depth.saturating_sub(1), -10000, 10000);
                evaluations.push((col, score));
            }
        }

        evaluations
    }

    fn negamax(&mut self, position: &Bitboard, depth: u8, mut alpha: i32, mut beta: i32) -> i32 {
        self.nodes += 1;

        if position.moves_count >= BOARD_SIZE as u8 {
            return 0;
        }

        if depth == 0 {
            return 0;
        }

        let key = position.key();
        if let Some(&(val, cached_depth)) = self.transposition_table.get(&key) {
            if cached_depth >= depth {
                self.transposition_hits += 1;
                return i32::from(val);
            }
        }
        let max_possible = (BOARD_SIZE - position.moves_count as usize + 1) as i32 / 2;
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
                next_pos.play(col);

                if next_pos.is_win() {
                    let score = (BOARD_SIZE + 1 - next_pos.moves_count as usize) as i32 / 2;
                    return score;
                }

                let score = -self.negamax(&next_pos, depth - 1, -beta, -alpha);

                if score >= beta {
                    self.transposition_table.insert(key, (score as i8, depth));
                    return score;
                }
                if score > alpha {
                    alpha = score;
                }
            }
        }

        self.transposition_table.insert(key, (alpha as i8, depth));

        alpha
    }
}
