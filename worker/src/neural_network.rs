use ndarray::Array1;
use rand::{rngs::StdRng, Rng, SeedableRng};

pub use crate::network_layer::{Layer, LayerGradient, NetworkConfig};

#[derive(Clone, Debug)]
pub struct NeuralNetwork {
    pub(crate) layers: Vec<Layer>,
    pub(crate) config: NetworkConfig,
}

impl NeuralNetwork {
    pub fn new(config: NetworkConfig) -> Self {
        Self::new_with_rng(config, &mut rand::thread_rng())
    }

    pub fn new_with_seed(config: NetworkConfig, seed: u64) -> Self {
        Self::new_with_rng(config, &mut StdRng::seed_from_u64(seed))
    }

    pub fn new_with_rng(config: NetworkConfig, rng: &mut impl Rng) -> Self {
        let mut layers = Vec::new();
        let mut input_size = config.input_size;

        for &output_size in &config.hidden_sizes {
            layers.push(Layer::new_with_rng(input_size, output_size, rng));
            input_size = output_size;
        }

        layers.push(Layer::new_with_rng(input_size, config.output_size, rng));
        Self { layers, config }
    }

    pub fn forward(&self, input: &Array1<f32>) -> Array1<f32> {
        let mut current = input.clone();
        let output_index = self.layers.len() - 1;

        for (index, layer) in self.layers.iter().enumerate() {
            if index == output_index {
                current = layer.forward_linear(&current);
                continue;
            }

            let mut next = layer.forward(&current);
            if self.config.use_skip_connections && next.len() == current.len() {
                next += &current;
            }
            current = next;
        }

        if self.config.output_size == 1 {
            current.mapv(f32::tanh)
        } else {
            self.softmax(&current)
        }
    }

    pub(crate) fn softmax(&self, input: &Array1<f32>) -> Array1<f32> {
        let max = input.fold(f32::NEG_INFINITY, |current, &value| current.max(value));
        let exponentials = input.mapv(|value| (value - max).exp());
        exponentials.mapv(|value| value / exponentials.sum())
    }

    pub fn load_weights(&mut self, weights: &[f32]) -> Result<(), String> {
        let expected = self.config.total_weights();
        if weights.len() != expected {
            return Err(format!(
                "network weight count mismatch: expected {expected}, received {}",
                weights.len()
            ));
        }

        let mut offset = 0;
        for layer in &mut self.layers {
            let end = offset + layer.weight_count();
            layer.load_weights(&weights[offset..end])?;
            offset = end;
        }
        Ok(())
    }

    pub fn get_weights(&self) -> Vec<f32> {
        self.layers.iter().flat_map(Layer::get_weights).collect()
    }

    pub fn num_layers(&self) -> usize {
        self.layers.len()
    }
}

#[cfg(test)]
#[path = "neural_network_tests.rs"]
mod tests;
