use rand::{rngs::StdRng, Rng, SeedableRng};
use rayon::prelude::*;
use rowspire_ai_core::{ml_ai::MLAI, GameState, Player, AI, BOARD_SIZE};
use serde::Deserialize;
use std::sync::OnceLock;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Kind {
    Random,
    Solver,
    Ml,
}

impl Kind {
    const ALL: [Self; 3] = [Self::Random, Self::Solver, Self::Ml];
}

enum Bot {
    Random(StdRng),
    Solver(AI),
    Ml(MLAI),
}

impl Bot {
    fn new(kind: Kind, seed: u64) -> Self {
        match kind {
            Kind::Random => Self::Random(StdRng::seed_from_u64(seed)),
            Kind::Solver => Self::Solver(AI::new()),
            Kind::Ml => {
                let mut ai = MLAI::new_with_seed(seed);
                ai.mcts_simulations = 100;
                let weights = weights();
                ai.load_weights(
                    &weights.value_network.weights,
                    &weights.policy_network.weights,
                )
                .unwrap();
                Self::Ml(ai)
            }
        }
    }

    fn choose(&mut self, state: &GameState) -> Option<u8> {
        match self {
            Self::Random(rng) => {
                let moves = state.get_valid_moves();
                (!moves.is_empty()).then(|| moves[rng.gen_range(0..moves.len())])
            }
            Self::Solver(ai) => ai.get_best_move(state, 3).0,
            Self::Ml(ai) => ai.get_best_move(state).r#move,
        }
    }
}

#[derive(Deserialize)]
struct Weights {
    value_network: NetworkWeights,
    policy_network: NetworkWeights,
}

#[derive(Deserialize)]
struct NetworkWeights {
    weights: Vec<f32>,
}

fn weights() -> &'static Weights {
    static WEIGHTS: OnceLock<Weights> = OnceLock::new();
    WEIGHTS.get_or_init(|| {
        serde_json::from_str(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../resources/ai/ml_ai_weights_best.json"
        )))
        .unwrap()
    })
}

#[derive(Debug)]
struct Result {
    first: Kind,
    second: Kind,
    winner: Option<Kind>,
    moves: usize,
}

fn play(first: Kind, second: Kind, seed: u64, first_starts: bool) -> Result {
    let mut bots = [Bot::new(first, seed), Bot::new(second, seed + 1)];
    let mut state = GameState::new();
    let mut moves = 0;

    while !state.is_game_over() {
        let first_turn = state.current_player == Player::Player1;
        let bot = usize::from(first_turn != first_starts);
        let column = bots[bot].choose(&state).expect("active game has a move");
        state
            .make_move(column)
            .expect("bots must return legal moves");
        moves += 1;
    }

    let winner = state.get_winner().map(|player| {
        if (player == Player::Player1) == first_starts {
            first
        } else {
            second
        }
    });
    Result {
        first,
        second,
        winner,
        moves,
    }
}

#[test]
#[ignore]
fn test_ai_matrix() {
    let games = std::env::var("NUM_GAMES")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(10);
    let pairs = [
        (Kind::Random, Kind::Solver),
        (Kind::Random, Kind::Ml),
        (Kind::Solver, Kind::Ml),
    ];
    let jobs: Vec<_> = pairs
        .into_iter()
        .flat_map(|(first, second)| (0..games).map(move |game| (first, second, game)))
        .collect();
    let results: Vec<_> = jobs
        .into_par_iter()
        .map(|(first, second, game)| play(first, second, game as u64, game % 2 == 0))
        .collect();

    assert_eq!(results.len(), pairs.len() * games);
    assert!(results.iter().all(|result| result.moves <= BOARD_SIZE));
    for kind in Kind::ALL {
        let wins = results
            .iter()
            .filter(|result| result.winner == Some(kind))
            .count();
        println!("{kind:?}: {wins} wins");
    }
    for result in results {
        println!(
            "{:?} vs {:?}: {:?} in {} moves",
            result.first, result.second, result.winner, result.moves
        );
    }
}
