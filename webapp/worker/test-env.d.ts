// Vite/Vitest `?raw` imports (used by tests for golden text fixtures).
declare module '*?raw' {
  const text: string
  export default text
}
