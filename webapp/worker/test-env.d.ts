// Vite/Vitest `?raw` imports (used by tests for golden text fixtures).
declare module '*?raw' {
  const text: string
  export default text
}

// Vite's import.meta.glob (the test D1 helper loads every migration with it).
interface ImportMeta {
  glob<T = unknown>(pattern: string, options: { query?: string; import?: string; eager: true }): Record<string, T>
}
