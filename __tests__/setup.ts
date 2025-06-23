// Test setup file that imports Jest types
import '@testing-library/jest-dom'

// This ensures Jest globals are available in TypeScript
declare global {
  const describe: (name: string, fn: () => void) => void
  const it: (name: string, fn: () => void) => void
  const expect: any
  const beforeEach: (fn: () => void) => void
  const jest: any
}