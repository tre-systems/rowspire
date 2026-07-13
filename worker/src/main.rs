use rowspire_ai_core::{GameState, AI};
use std::error::Error;
use std::fs;
use std::io::{self, Write};

fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn Error>> {
    let mut args = std::env::args().skip(1);
    let command = required(args.next(), "command")?;
    let input_file = required(args.next(), "input file")?;
    let depth = parse_depth(args.collect())?;
    let state: GameState = serde_json::from_str(&fs::read_to_string(input_file)?)?;
    let mut stdout = io::stdout().lock();

    match command.as_str() {
        "get_move" => write_move(&mut stdout, &state, depth)?,
        "evaluate" => writeln!(stdout, "{}", state.evaluate())?,
        _ => return Err(input_error(format!("unknown command: {command}"))),
    }
    Ok(())
}

fn parse_depth(args: Vec<String>) -> Result<u8, Box<dyn Error>> {
    match args.as_slice() {
        [] => Ok(3),
        [flag, value] if flag == "--depth" => Ok(value.parse()?),
        _ => Err(input_error(
            "usage: rowspire-ai-worker <get_move|evaluate> <input> [--depth N]",
        )),
    }
}

fn write_move(output: &mut impl Write, state: &GameState, depth: u8) -> Result<(), Box<dyn Error>> {
    let (best_move, evaluations) = AI::new().get_best_move(state, depth);
    serde_json::to_writer(
        &mut *output,
        &serde_json::json!({
            "move": best_move,
            "evaluation": state.evaluate(),
            "moveEvaluations": evaluations,
        }),
    )?;
    writeln!(output)?;
    Ok(())
}

fn required(value: Option<String>, name: &str) -> Result<String, Box<dyn Error>> {
    value.ok_or_else(|| input_error(format!("missing {name}")))
}

fn input_error(message: impl Into<String>) -> Box<dyn Error> {
    Box::new(io::Error::new(io::ErrorKind::InvalidInput, message.into()))
}
