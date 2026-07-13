use ndarray::{Array1, Array2};
use rand::Rng;

#[derive(Clone, Debug)]
pub struct NetworkConfig {
    pub input_size: usize,
    pub hidden_sizes: Vec<usize>,
    pub output_size: usize,
    pub use_skip_connections: bool,
}

pub type LayerGradient = (Array2<f32>, Array1<f32>);

impl NetworkConfig {
    pub fn total_weights(&self) -> usize {
        let mut total = 0;
        let mut previous_size = self.input_size;

        for &hidden_size in &self.hidden_sizes {
            total += (previous_size + 1) * hidden_size;
            previous_size = hidden_size;
        }

        total + (previous_size + 1) * self.output_size
    }
}

#[derive(Clone, Debug)]
pub struct Layer {
    pub(crate) weights: Array2<f32>,
    pub(crate) biases: Array1<f32>,
}

impl Layer {
    pub fn new(input_size: usize, output_size: usize) -> Self {
        Self::new_with_rng(input_size, output_size, &mut rand::thread_rng())
    }

    pub fn new_with_rng(input_size: usize, output_size: usize, rng: &mut impl Rng) -> Self {
        let scale = (2.0 / input_size as f32).sqrt();
        let weights =
            Array2::from_shape_fn((input_size, output_size), |_| rng.gen_range(-scale..scale));
        let biases = Array1::from_shape_fn(output_size, |_| rng.gen_range(-0.1..0.1));

        Self { weights, biases }
    }

    pub fn update_weights(
        &mut self,
        weight_gradients: &Array2<f32>,
        bias_gradients: &Array1<f32>,
        learning_rate: f32,
    ) {
        self.weights = &self.weights - &(weight_gradients * learning_rate);
        self.biases = &self.biases - &(bias_gradients * learning_rate);
    }

    pub fn forward(&self, input: &Array1<f32>) -> Array1<f32> {
        let linear = input.dot(&self.weights) + &self.biases;
        linear.mapv(|value| value.max(0.0))
    }

    pub fn forward_linear(&self, input: &Array1<f32>) -> Array1<f32> {
        input.dot(&self.weights) + &self.biases
    }

    pub fn forward_with_cache(&self, input: &Array1<f32>) -> (Array1<f32>, Array1<f32>) {
        let linear = input.dot(&self.weights) + &self.biases;
        let activated = linear.mapv(|value| value.max(0.0));
        (activated, linear)
    }

    pub fn weight_count(&self) -> usize {
        self.weights.len() + self.biases.len()
    }

    pub fn load_weights(&mut self, weights: &[f32]) -> Result<(), String> {
        let expected = self.weight_count();
        if weights.len() != expected {
            return Err(format!(
                "layer weight count mismatch: expected {expected}, received {}",
                weights.len()
            ));
        }

        let matrix_size = self.weights.len();
        for (target, source) in self.weights.iter_mut().zip(weights) {
            *target = *source;
        }

        for (target, source) in self.biases.iter_mut().zip(&weights[matrix_size..]) {
            *target = *source;
        }

        Ok(())
    }

    pub fn get_weights(&self) -> Vec<f32> {
        self.weights
            .iter()
            .copied()
            .chain(self.biases.iter().copied())
            .collect()
    }
}
