#[cfg(test)]
mod tests {
    use rowspire_ai_core::genetic_params::GeneticParams;
    use rowspire_ai_core::ml_ai::{MLDiagnostics, MLMoveEvaluation};
    use rowspire_ai_core::wasm_api::{
        MoveEvaluationWasm, WasmBestMoveResponse, WasmHeuristicResponse, WasmMLResponse,
    };
    use rowspire_ai_core::{Cell, GameState, Player};
    use ts_rs::TS;

    #[test]
    fn test_bindings() {
        assert!(GeneticParams::export().is_ok());
        assert!(GameState::export().is_ok());
        assert!(Player::export().is_ok());
        assert!(Cell::export().is_ok());
        assert!(WasmBestMoveResponse::export().is_ok());
        assert!(WasmHeuristicResponse::export().is_ok());
        assert!(WasmMLResponse::export().is_ok());
        assert!(MoveEvaluationWasm::export().is_ok());
        assert!(MLDiagnostics::export().is_ok());
        assert!(MLMoveEvaluation::export().is_ok());
    }
}
