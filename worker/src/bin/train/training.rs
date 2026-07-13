use ndarray::Array1;
use rand::seq::SliceRandom;
use rayon::prelude::*;
use rowspire_ai_core::{ml_ai::MLAI, neural_network::LayerGradient};

use super::data::Sample;

type NetworkResult = (f32, Vec<LayerGradient>);
type BatchResult = (NetworkResult, NetworkResult);

const BATCH_SIZE: usize = 128;
const WARMUP_EPOCHS: usize = 10;
const BASE_RATE: f32 = 0.001;
const WARMUP_RATE: f32 = 0.0001;

pub fn train(model: &mut MLAI, dataset: &mut [Sample], epochs: usize) {
    dataset.shuffle(&mut rand::thread_rng());
    for epoch in 1..=epochs {
        let rate = learning_rate(epoch, epochs);
        let mut value_loss = 0.0;
        let mut policy_loss = 0.0;

        for batch in dataset.chunks(BATCH_SIZE) {
            let results: Vec<_> = batch
                .par_iter()
                .map(|(features, value, policy)| gradients(model, features, *value, policy))
                .collect();
            let (loss, gradients) = average(results.iter().map(|result| &result.0), batch.len());
            value_loss += loss;
            model.value_network.apply_gradients(&gradients, rate);
            let (loss, gradients) = average(results.iter().map(|result| &result.1), batch.len());
            policy_loss += loss;
            model.policy_network.apply_gradients(&gradients, rate);
        }

        if epoch == 1 || epoch == epochs || epoch.is_multiple_of(5) {
            println!(
                "Epoch {epoch}/{epochs}: rate {rate:.6}, value loss {:.5}, policy loss {:.5}",
                value_loss / dataset.len() as f32,
                policy_loss / dataset.len() as f32
            );
        }
    }
}

fn gradients(model: &MLAI, features: &[f32], value: f32, policy: &[f32]) -> BatchResult {
    let input = Array1::from_vec(features.to_vec());
    (
        model
            .value_network
            .compute_gradients(&input, &Array1::from_vec(vec![value])),
        model
            .policy_network
            .compute_gradients(&input, &Array1::from_vec(policy.to_vec())),
    )
}

fn average<'a>(mut results: impl Iterator<Item = &'a NetworkResult>, size: usize) -> NetworkResult {
    let (mut loss, mut gradients) = results
        .next()
        .expect("training batches are non-empty")
        .clone();
    for (sample_loss, sample_gradients) in results {
        loss += sample_loss;
        for (total, sample) in gradients.iter_mut().zip(sample_gradients) {
            total.0 += &sample.0;
            total.1 += &sample.1;
        }
    }
    for gradient in &mut gradients {
        gradient.0 /= size as f32;
        gradient.1 /= size as f32;
    }
    (loss, gradients)
}

fn learning_rate(epoch: usize, epochs: usize) -> f32 {
    if epoch <= WARMUP_EPOCHS {
        WARMUP_RATE + (BASE_RATE - WARMUP_RATE) * epoch as f32 / WARMUP_EPOCHS as f32
    } else if epoch > epochs * 85 / 100 {
        BASE_RATE * 0.01
    } else if epoch > epochs * 60 / 100 {
        BASE_RATE * 0.1
    } else {
        BASE_RATE
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn schedule_warms_up_and_decays() {
        assert_eq!(learning_rate(10, 50), BASE_RATE);
        assert_eq!(learning_rate(31, 50), BASE_RATE * 0.1);
        assert_eq!(learning_rate(43, 50), BASE_RATE * 0.01);
    }
}
