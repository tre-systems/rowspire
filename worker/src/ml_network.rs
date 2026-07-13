use crate::features::SIZE;
use crate::neural_network::{NetworkConfig, NeuralNetwork};
use crate::COLS;

pub(crate) fn create_networks(seed: Option<u64>) -> (NeuralNetwork, NeuralNetwork) {
    (
        network(config(1), seed),
        network(config(COLS), seed.map(|value| value.wrapping_add(1))),
    )
}

pub(crate) fn expected_weight_counts() -> (usize, usize) {
    (config(1).total_weights(), config(COLS).total_weights())
}

fn network(config: NetworkConfig, seed: Option<u64>) -> NeuralNetwork {
    match seed {
        Some(seed) => NeuralNetwork::new_with_seed(config, seed),
        None => NeuralNetwork::new(config),
    }
}

fn config(output_size: usize) -> NetworkConfig {
    NetworkConfig {
        input_size: SIZE,
        hidden_sizes: vec![128; 4],
        output_size,
        use_skip_connections: true,
    }
}
