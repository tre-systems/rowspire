pub use crate::ai_types::MoveEvaluation;
use crate::solver::{Bitboard, Solver};
use crate::{GameState, Player};

pub struct AI {
    solver: Solver,
    pub nodes_evaluated: u32,
    pub transposition_hits: u32,
}

impl Default for AI {
    fn default() -> Self {
        Self::new()
    }
}

impl AI {
    pub fn new() -> Self {
        Self {
            solver: Solver::new(),
            nodes_evaluated: 0,
            transposition_hits: 0,
        }
    }

    pub fn clear_transposition_table(&mut self) {
        self.solver.reset();
    }

    pub fn get_best_move(
        &mut self,
        state: &GameState,
        depth: u8,
    ) -> (Option<u8>, Vec<MoveEvaluation>) {
        let engine_depth = match depth {
            1 => 6,
            3 => 10,
            5 => 14,
            _ => depth.saturating_add(4).min(20),
        };
        let (best_move, score) = self
            .solver
            .analyze(&Bitboard::from_game_state(state), engine_depth);

        self.nodes_evaluated = self.solver.get_nodes_count().try_into().unwrap_or(u32::MAX);
        self.transposition_hits = self
            .solver
            .transposition_hits()
            .try_into()
            .unwrap_or(u32::MAX);

        let evaluations = best_move
            .map(|column| MoveEvaluation {
                column: column as u8,
                score: score as f32,
                move_type: outcome_name(score).to_string(),
            })
            .into_iter()
            .collect();

        (best_move.map(|column| column as u8), evaluations)
    }
}

pub struct HeuristicAI {
    pub nodes_evaluated: u32,
}

impl Default for HeuristicAI {
    fn default() -> Self {
        Self::new()
    }
}

impl HeuristicAI {
    pub fn new() -> Self {
        Self { nodes_evaluated: 0 }
    }

    pub fn get_best_move(&mut self, state: &GameState) -> (Option<u8>, Vec<MoveEvaluation>) {
        self.nodes_evaluated = 0;
        let valid_moves = state.get_valid_moves();

        if valid_moves.len() <= 1 {
            return (valid_moves.first().copied(), Vec::new());
        }

        if let Some(column) = find_immediate_win(state, state.current_player) {
            return (
                Some(column),
                vec![evaluation(column, state.current_player, 10_000.0, "win")],
            );
        }

        if let Some(column) = find_immediate_win(state, state.current_player.opponent()) {
            return (
                Some(column),
                vec![evaluation(column, state.current_player, 5_000.0, "block")],
            );
        }

        let mut evaluations: Vec<_> = valid_moves
            .into_iter()
            .filter_map(|column| evaluate_move(state, column))
            .collect();
        evaluations.sort_by(|left, right| right.score.total_cmp(&left.score));

        let best = match state.current_player {
            Player::Player1 => evaluations.first(),
            Player::Player2 => evaluations.last(),
        };

        (best.map(|item| item.column), evaluations)
    }
}

fn find_immediate_win(state: &GameState, player: Player) -> Option<u8> {
    state.get_valid_moves().into_iter().find(|column| {
        let mut next = state.clone();
        next.current_player = player;
        next.make_move(*column).is_ok() && next.get_winner() == Some(player)
    })
}

fn evaluate_move(state: &GameState, column: u8) -> Option<MoveEvaluation> {
    let mut next = state.clone();
    next.make_move(column).ok()?;

    Some(MoveEvaluation {
        column,
        score: next.evaluate() as f32,
        move_type: "drop".to_string(),
    })
}

fn evaluation(column: u8, player: Player, magnitude: f32, move_type: &str) -> MoveEvaluation {
    MoveEvaluation {
        column,
        score: if player == Player::Player1 {
            magnitude
        } else {
            -magnitude
        },
        move_type: move_type.to_string(),
    }
}

fn outcome_name(score: i32) -> &'static str {
    match score {
        value if value > 0 => "win",
        value if value < 0 => "loss",
        _ => "draw",
    }
}
