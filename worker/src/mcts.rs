use crate::mcts_node::MctsNode;
use crate::mcts_policy::{normalize, sample};
use crate::{GameState, BOARD_SIZE, COLS};
use rand::{rngs::StdRng, Rng, SeedableRng};

pub struct MCTS {
    nodes: Vec<MctsNode>,
    exploration: f32,
    simulations: usize,
    pub terminal_nodes_found: u32,
    rng: StdRng,
}

impl MCTS {
    pub fn new(exploration: f32, simulations: usize) -> Self {
        Self::with_rng(exploration, simulations, StdRng::from_entropy())
    }

    pub fn new_with_seed(exploration: f32, simulations: usize, seed: u64) -> Self {
        Self::with_rng(exploration, simulations, StdRng::seed_from_u64(seed))
    }

    fn with_rng(exploration: f32, simulations: usize, rng: StdRng) -> Self {
        Self {
            nodes: Vec::new(),
            exploration,
            simulations: simulations.max(1),
            terminal_nodes_found: 0,
            rng,
        }
    }

    pub fn search(
        &mut self,
        root_state: GameState,
        value: &dyn Fn(&GameState) -> f32,
        policy: &dyn Fn(&GameState) -> Vec<f32>,
        temperature: f32,
        add_noise: bool,
    ) -> (u8, Vec<f32>) {
        self.nodes.clear();
        self.terminal_nodes_found = 0;
        let root = self.add_node(root_state, 1.0, None);
        let noise_after = self.nodes[root].valid_moves.len().min(self.simulations);

        for index in 0..self.simulations {
            self.simulate(root, value, policy, 0);
            if add_noise && index + 1 == noise_after {
                self.add_root_noise(root);
            }
        }

        let mut probabilities = vec![0.0; COLS];
        for &child in &self.nodes[root].children {
            let node = &self.nodes[child];
            probabilities[node.last_move.expect("child nodes have a move") as usize] =
                node.visits as f32;
        }
        normalize(&mut probabilities, temperature);
        (sample(&mut self.rng, &probabilities), probabilities)
    }

    fn simulate(
        &mut self,
        node: usize,
        value: &dyn Fn(&GameState) -> f32,
        policy: &dyn Fn(&GameState) -> Vec<f32>,
        depth: usize,
    ) -> f32 {
        if depth >= BOARD_SIZE {
            return 0.0;
        }

        let result = if self.nodes[node].terminal {
            terminal_value(&self.nodes[node].state)
        } else if !self.nodes[node].is_fully_expanded() {
            let child = self.expand(node, policy);
            let child_value = if self.nodes[child].terminal {
                self.terminal_nodes_found += 1;
                terminal_value(&self.nodes[child].state)
            } else {
                value(&self.nodes[child].state)
            };
            self.nodes[child].visits = 1;
            self.nodes[child].total_value = child_value;
            -child_value
        } else {
            let child = self.best_child(node);
            -self.simulate(child, value, policy, depth + 1)
        };

        self.nodes[node].visits += 1;
        self.nodes[node].total_value += result;
        result
    }

    fn best_child(&self, node: usize) -> usize {
        let visits = self.nodes[node].visits;
        self.nodes[node]
            .children
            .iter()
            .max_by(|&&left, &&right| {
                self.nodes[left]
                    .ucb_score(self.exploration, visits)
                    .total_cmp(&self.nodes[right].ucb_score(self.exploration, visits))
            })
            .copied()
            .expect("expanded nodes have children")
    }

    fn expand(&mut self, node: usize, policy: &dyn Fn(&GameState) -> Vec<f32>) -> usize {
        let policy = policy(&self.nodes[node].state);
        let column = self.nodes[node]
            .valid_moves
            .iter()
            .find(|column| {
                !self.nodes[node]
                    .children
                    .iter()
                    .any(|&child| self.nodes[child].last_move == Some(**column))
            })
            .copied()
            .expect("non-expanded nodes have an available move");
        let mut state = self.nodes[node].state.clone();
        state.make_move(column).expect("selected move is valid");
        let child = self.add_node(
            state,
            policy.get(column as usize).copied().unwrap_or(0.0),
            Some(column),
        );
        self.nodes[node].children.push(child);
        child
    }

    fn add_root_noise(&mut self, root: usize) {
        let children = self.nodes[root].children.clone();
        let noise: Vec<f32> = (0..children.len()).map(|_| self.rng.gen()).collect();
        let total: f32 = noise.iter().sum();
        if total <= f32::EPSILON {
            return;
        }
        for (child, value) in children.into_iter().zip(noise) {
            self.nodes[child].prior = self.nodes[child].prior * 0.75 + value / total * 0.25;
        }
    }

    fn add_node(&mut self, state: GameState, prior: f32, last_move: Option<u8>) -> usize {
        self.nodes.push(MctsNode::new(state, prior, last_move));
        self.nodes.len() - 1
    }
}

fn terminal_value(state: &GameState) -> f32 {
    match state.get_winner() {
        Some(winner) if winner == state.current_player => -1.0,
        Some(_) => 1.0,
        None => 0.0,
    }
}

#[cfg(test)]
#[path = "mcts_tests.rs"]
mod tests;
