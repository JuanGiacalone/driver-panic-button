import { vi } from "vitest";

// Mock AsyncStorage for testing
const mockAsyncStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => Promise.resolve(store[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      store = {};
      return Promise.resolve();
    }),
    getAllKeys: vi.fn(() => Promise.resolve(Object.keys(store))),
    multiGet: vi.fn((keys: string[]) =>
      Promise.resolve(keys.map((key) => [key, store[key] || null]))
    ),
    multiSet: vi.fn((entries: [string, string][]) => {
      entries.forEach(([key, value]) => {
        store[key] = value;
      });
      return Promise.resolve();
    }),
    multiRemove: vi.fn((keys: string[]) => {
      keys.forEach((key) => {
        delete store[key];
      });
      return Promise.resolve();
    }),
  };
})();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: mockAsyncStorage,
}));
