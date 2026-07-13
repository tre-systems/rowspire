use rowspire_ai_core::genetic_params::GeneticParams;
use rowspire_ai_core::ml_ai::MLDiagnostics;
use rowspire_ai_core::wasm_api::{WasmBestMoveResponse, WasmMLResponse};
use rowspire_ai_core::{Cell, GameState, MoveEvaluation, Player};
use ts_rs::TS;

#[test]
fn exports_every_frontend_domain_type() {
    assert!(GeneticParams::export().is_ok());
    assert!(GameState::export().is_ok());
    assert!(Player::export().is_ok());
    assert!(Cell::export().is_ok());
    assert!(WasmBestMoveResponse::export().is_ok());
    assert!(WasmMLResponse::export().is_ok());
    assert!(MoveEvaluation::export().is_ok());
    assert!(MLDiagnostics::export().is_ok());
}
