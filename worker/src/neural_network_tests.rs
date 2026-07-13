use super::*;
use ndarray::{array, Array2};

fn config(output_size: usize) -> NetworkConfig {
    NetworkConfig {
        input_size: 2,
        hidden_sizes: vec![3],
        output_size,
        use_skip_connections: false,
    }
}

#[test]
fn counts_every_weight_and_bias() {
    assert_eq!(config(1).total_weights(), 13);
}

#[test]
fn value_output_is_bounded() {
    let output = NeuralNetwork::new_with_seed(config(1), 42).forward(&array![1.0, 2.0]);

    assert_eq!(output.len(), 1);
    assert!((-1.0..=1.0).contains(&output[0]));
}

#[test]
fn policy_output_is_a_probability_distribution() {
    let output = NeuralNetwork::new_with_seed(config(4), 42).forward(&array![1.0, 2.0]);

    assert_eq!(output.len(), 4);
    assert!((output.sum() - 1.0).abs() < 1e-6);
    assert!(output.iter().all(|value| *value >= 0.0));
}

#[test]
fn weight_round_trip_preserves_output() {
    let original = NeuralNetwork::new_with_seed(config(1), 42);
    let input = array![1.0, 2.0];
    let expected = original.forward(&input);
    let mut restored = NeuralNetwork::new_with_seed(config(1), 7);

    restored.load_weights(&original.get_weights()).unwrap();

    assert_eq!(restored.forward(&input), expected);
}

#[test]
fn weight_loading_rejects_partial_data() {
    let mut network = NeuralNetwork::new_with_seed(config(1), 42);

    assert_eq!(
        network.load_weights(&[0.0]).unwrap_err(),
        "network weight count mismatch: expected 13, received 1"
    );
}

#[test]
fn value_training_reduces_loss() {
    let mut network = NeuralNetwork::new_with_seed(config(1), 42);
    let input = array![1.0, 2.0];
    let target = array![0.5];
    let initial = network.train_step(&input, &target, 0.01);
    let final_loss = (0..100).fold(initial, |_, _| network.train_step(&input, &target, 0.01));

    assert!(final_loss < initial);
}

#[test]
fn policy_training_increases_target_probability() {
    let mut network = NeuralNetwork::new_with_seed(config(4), 42);
    let input = array![1.0, 2.0];
    let target = array![0.0, 1.0, 0.0, 0.0];
    let initial = network.forward(&input)[1];

    for _ in 0..50 {
        network.train_step(&input, &target, 0.1);
    }

    assert!(network.forward(&input)[1] > initial);
}

#[test]
fn layer_updates_change_parameters() {
    let mut layer = Layer::new_with_rng(2, 3, &mut rand::thread_rng());
    let original = layer.get_weights();
    let weights = Array2::from_elem((2, 3), 0.1);

    layer.update_weights(&weights, &array![0.1, 0.2, 0.3], 0.01);

    assert_ne!(layer.get_weights(), original);
}

#[test]
fn matching_hidden_layers_support_skip_connections() {
    let config = NetworkConfig {
        input_size: 2,
        hidden_sizes: vec![2, 2],
        output_size: 1,
        use_skip_connections: true,
    };
    let mut network = NeuralNetwork::new_with_seed(config, 42);

    assert!(network.forward(&array![1.0, 2.0])[0].is_finite());
    assert!(network.train_step(&array![1.0, 2.0], &array![0.5], 0.01) >= 0.0);
}
