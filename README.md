# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      # dissonance-frontend

      A modern React (TypeScript) frontend for the Dissonance project, built with Vite.

      ## Features
      - Modular React components
      - TypeScript for type safety
      - Vite for fast development and builds
      - Custom hooks and plugin architecture

      ## Getting Started

      ### Prerequisites
      - Node.js (18+ recommended)
      - npm (comes with Node.js)

      ### Installation
      ```sh
      npm install
      ```

      ### Development
      ```sh
      npm run dev
      ```

      ### Build
      ```sh
      npm run build
      ```

      ### Lint
      ```sh
      npm run lint
      ```

      ### Preview Production Build
      ```sh
      npm run preview
      ```

      ## Project Structure
      - `src/components/` — React UI components
      - `src/hooks/` — Custom React hooks
      - `src/lib/` — Core libraries and utilities
      - `src/plugins/` — Feature plugins
      - `src/shared/` — Shared code (e.g., theme)
      - `public/` — Static assets

      ## Contributing
      1. Fork the repo and create your branch from `main`.
      2. Commit your changes with clear messages.
      3. Push to your fork and submit a pull request.

      ## License
      MIT
