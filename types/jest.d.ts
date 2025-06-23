/// <reference types="jest" />

// Extend global types for Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}

export {};