# Física 1 UTN

Sitio para resolver problemas de Física 1 (UTN FRRo): cinemática, dinámica y energía, rotación, y fluidos/movimiento periódico. Ver [docs/sections.md](docs/sections.md) para el detalle de unidades.

## Stack

- [Vite](https://vite.dev/) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) (vía `@tailwindcss/vite`)
- [React Router](https://reactrouter.com/) para la navegación entre unidades
- [mathjs](https://mathjs.org/) para cálculos numéricos y manejo de unidades físicas
- [KaTeX](https://katex.org/) + [react-katex](https://github.com/talyssonoc/react-katex) para renderizar ecuaciones
- [Recharts](https://recharts.org/) para gráficos (posición-tiempo, velocidad-tiempo, etc.)
- [oxlint](https://oxc.rs/) como linter

## Desarrollo

```bash
pnpm install
pnpm dev      # servidor de desarrollo
pnpm build    # build de producción
pnpm lint     # linter
```
