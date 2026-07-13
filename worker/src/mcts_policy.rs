use rand::Rng;

pub(crate) fn normalize(probabilities: &mut [f32], temperature: f32) {
    if temperature > 0.1 {
        probabilities
            .iter_mut()
            .for_each(|value| *value = value.powf(1.0 / temperature));
    } else {
        let maximum = probabilities.iter().copied().fold(0.0, f32::max);
        probabilities
            .iter_mut()
            .for_each(|value| *value = (*value == maximum && maximum > 0.0) as u8 as f32);
    }

    let total: f32 = probabilities.iter().sum();
    if total > 0.0 {
        probabilities.iter_mut().for_each(|value| *value /= total);
    }
}

pub(crate) fn sample(rng: &mut impl Rng, probabilities: &[f32]) -> u8 {
    let target = rng.gen::<f32>();
    let mut total = 0.0;
    probabilities
        .iter()
        .position(|probability| {
            total += probability;
            target <= total
        })
        .unwrap_or(probabilities.len() - 1) as u8
}
