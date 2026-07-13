#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT/worker"
exec caffeinate -dimsu cargo test --locked --test ai_matrix_test test_ai_matrix -- --ignored --exact --nocapture
