// Test environment polyfills for Node/Vitest
const storageMap = new Map<string, string>();

const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storageMap.set(key, String(value));
  },
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  clear: () => {
    storageMap.clear();
  },
  get length() {
    return storageMap.size;
  },
  key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
};

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = mockLocalStorage as any;
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: mockLocalStorage,
  };
}

if (typeof (globalThis as any).CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params?: { detail?: any }) {
      this.type = type;
      this.detail = params?.detail;
    }
  };
}
