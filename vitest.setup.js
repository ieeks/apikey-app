import "@testing-library/jest-dom";

const storage = new Map();
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn((key) => (storage.has(key) ? storage.get(key) : null)),
    setItem: vi.fn((key, value) => {
      storage.set(key, String(value));
    }),
    removeItem: vi.fn((key) => {
      storage.delete(key);
    }),
    clear: vi.fn(() => {
      storage.clear();
    }),
  },
  configurable: true,
});

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});
