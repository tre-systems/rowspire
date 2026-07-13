import { vi } from 'vitest';

global.WebAssembly = {
  instantiate: vi.fn(),
  instantiateStreaming: vi.fn(),
  compile: vi.fn(),
  validate: vi.fn(),
  Module: class MockWasmModule {
    constructor() {}
    static exports = {};
  },
  Memory: class MockMemory {
    constructor() {}
    buffer = new ArrayBuffer(1024);
  },
  Table: class MockTable {
    constructor() {}
    get() {}
    set() {}
    grow() {}
    length = 0;
  },
  Global: class MockGlobal {
    constructor() {}
    value = 0;
  },
} as unknown as typeof WebAssembly;

global.Worker = class MockWorker {
  postMessage = vi.fn();
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((error: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
  terminate = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();

  constructor() {}
} as unknown as typeof Worker;

global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  getEntries: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  timeOrigin: Date.now(),
  toJSON: vi.fn(),
} as unknown as Performance;

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
} as unknown as Storage;

global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
} as unknown as Storage;

vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

vi.mock('../wasm-ai-service', () => ({
  getWASMAIService: vi.fn(() => ({
    isReady: false,
    initialize: vi.fn(),
    getBestMove: vi.fn(),
    getHeuristicMove: vi.fn(),
    getMLMove: vi.fn(),
    evaluatePosition: vi.fn(),
    clearTranspositionTable: vi.fn(),
    getTranspositionTableSize: vi.fn(),
  })),
  initializeWASMAI: vi.fn().mockResolvedValue(undefined),
}));
