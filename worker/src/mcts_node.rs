use crate::GameState;

#[derive(Debug, Clone)]
pub(crate) struct MctsNode {
    pub(crate) state: GameState,
    pub(crate) children: Vec<usize>,
    pub(crate) visits: u32,
    pub(crate) total_value: f32,
    pub(crate) prior: f32,
    pub(crate) terminal: bool,
    pub(crate) valid_moves: Vec<u8>,
    pub(crate) last_move: Option<u8>,
}

impl MctsNode {
    pub(crate) fn new(state: GameState, prior: f32, last_move: Option<u8>) -> Self {
        let valid_moves = state.get_valid_moves();
        let terminal = state.is_game_over();
        Self {
            state,
            children: Vec::new(),
            visits: 0,
            total_value: 0.0,
            prior,
            terminal,
            valid_moves,
            last_move,
        }
    }

    pub(crate) fn ucb_score(&self, exploration: f32, parent_visits: u32) -> f32 {
        if self.visits == 0 {
            return f32::INFINITY;
        }
        -(self.total_value / self.visits as f32)
            + exploration * self.prior * (parent_visits as f32).sqrt() / (1.0 + self.visits as f32)
    }

    pub(crate) fn is_fully_expanded(&self) -> bool {
        self.children.len() >= self.valid_moves.len()
    }
}
