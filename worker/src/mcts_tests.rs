use super::*;

fn value(_: &GameState) -> f32 {
    0.0
}

fn policy(_: &GameState) -> Vec<f32> {
    vec![1.0 / COLS as f32; COLS]
}

#[test]
fn search_returns_a_probability_distribution() {
    let (_, probabilities) =
        MCTS::new_with_seed(1.0, 100, 42).search(GameState::new(), &value, &policy, 0.0, false);

    assert_eq!(probabilities.len(), COLS);
    assert!((probabilities.iter().sum::<f32>() - 1.0).abs() < 0.001);
}

#[test]
fn seeded_search_is_reproducible() {
    let first =
        MCTS::new_with_seed(1.0, 100, 42).search(GameState::new(), &value, &policy, 1.0, true);
    let second =
        MCTS::new_with_seed(1.0, 100, 42).search(GameState::new(), &value, &policy, 1.0, true);

    assert_eq!(first, second);
}

#[test]
fn repeated_search_does_not_retain_nodes() {
    let mut mcts = MCTS::new_with_seed(1.0, 20, 42);
    mcts.search(GameState::new(), &value, &policy, 0.0, false);
    let first_node_count = mcts.nodes.len();
    mcts.search(GameState::new(), &value, &policy, 0.0, false);

    assert_eq!(mcts.nodes.len(), first_node_count);
}
