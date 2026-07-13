use crate::network_layer::{Layer, LayerGradient};
use crate::neural_network::NeuralNetwork;
use ndarray::{Array1, Array2};

impl NeuralNetwork {
    pub fn compute_gradients(
        &self,
        input: &Array1<f32>,
        target: &Array1<f32>,
    ) -> (f32, Vec<LayerGradient>) {
        let layer_count = self.layers.len();
        let (activations, linear_outputs) = self.forward_training(input);
        let (loss, output_gradient) = self.output_gradient(&activations, target);
        let output_index = layer_count - 1;
        let output_input = &activations[output_index];
        let output_layer = &self.layers[output_index];
        let weight_gradients = outer_product(output_input, &output_gradient, output_layer);
        let mut gradient = output_gradient.dot(&output_layer.weights.t());
        let mut gradients = vec![(weight_gradients, output_gradient)];

        for index in (0..output_index).rev() {
            let (weights, biases, input_gradient) = layer_gradients(
                &self.layers[index],
                &activations[index],
                &linear_outputs[index],
                &gradient,
            );
            gradients.push((weights, biases));
            gradient = self.skip_gradient(index, input_gradient, gradient);
        }

        gradients.reverse();
        (loss, gradients)
    }

    pub fn apply_gradients(&mut self, gradients: &[LayerGradient], learning_rate: f32) {
        for (layer, (weights, biases)) in self.layers.iter_mut().zip(gradients) {
            layer.update_weights(weights, biases, learning_rate);
        }
    }

    pub fn train_step(
        &mut self,
        input: &Array1<f32>,
        target: &Array1<f32>,
        learning_rate: f32,
    ) -> f32 {
        let (loss, gradients) = self.compute_gradients(input, target);
        self.apply_gradients(&gradients, learning_rate);
        loss
    }

    fn forward_training(&self, input: &Array1<f32>) -> (Vec<Array1<f32>>, Vec<Array1<f32>>) {
        let mut activations = vec![input.clone()];
        let mut linear_outputs = Vec::new();

        for index in 0..self.layers.len() - 1 {
            let previous = activations.last().unwrap();
            let (mut activated, linear) = self.layers[index].forward_with_cache(previous);

            if self.config.use_skip_connections && activated.len() == previous.len() {
                activated = &activated + previous;
            }

            activations.push(activated);
            linear_outputs.push(linear);
        }

        (activations, linear_outputs)
    }

    fn output_gradient(
        &self,
        activations: &[Array1<f32>],
        target: &Array1<f32>,
    ) -> (f32, Array1<f32>) {
        let output_layer = self.layers.last().unwrap();
        let linear = output_layer.forward_linear(activations.last().unwrap());

        if self.config.output_size == 1 {
            let output = linear.mapv(f32::tanh);
            let difference = &output - target;
            let gradient = difference
                .iter()
                .zip(&output)
                .map(|(difference, output)| difference * (1.0 - output * output))
                .collect();
            (difference.dot(&difference), gradient)
        } else {
            let output = self.softmax(&linear);
            let loss = output
                .iter()
                .zip(target)
                .map(|(probability, expected)| -expected * probability.clamp(1e-7, 1.0 - 1e-7).ln())
                .sum();
            (loss, &output - target)
        }
    }

    fn skip_gradient(
        &self,
        index: usize,
        input_gradient: Array1<f32>,
        output_gradient: Array1<f32>,
    ) -> Array1<f32> {
        if self.config.use_skip_connections
            && input_gradient.len() == self.layers[index].weights.shape()[1]
        {
            input_gradient + output_gradient
        } else {
            input_gradient
        }
    }
}

fn layer_gradients(
    layer: &Layer,
    input: &Array1<f32>,
    linear_output: &Array1<f32>,
    output_gradient: &Array1<f32>,
) -> (Array2<f32>, Array1<f32>, Array1<f32>) {
    let activation_gradient = linear_output.mapv(|value| (value > 0.0) as u8 as f32);
    let gradient = output_gradient * &activation_gradient;
    let weights = outer_product(input, &gradient, layer);
    let input_gradient = gradient.dot(&layer.weights.t());

    (weights, gradient, input_gradient)
}

fn outer_product(input: &Array1<f32>, gradient: &Array1<f32>, layer: &Layer) -> Array2<f32> {
    Array2::from_shape_fn(layer.weights.raw_dim(), |(row, column)| {
        input[row] * gradient[column]
    })
}
