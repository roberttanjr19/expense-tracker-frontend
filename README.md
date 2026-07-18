# Expense Tracker — Frontend

A React + TypeScript frontend for tracking personal expenses. Lets you add an
expense (description, amount, date, category) and view the running list.

Built with:

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) — dev server and build tool
- [Tailwind CSS 4](https://tailwindcss.com/) — styling

This is the frontend only. It expects a backend REST API running at
`http://localhost:8080` (see [Backend](#backend) below).

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm
- A running instance of the expense tracker backend API

## Getting started

```bash
npm install
npm run dev
```

This starts the Vite dev server (default: `http://localhost:5173`) with hot
module reloading.

## Available scripts

| Command           | Description                                      |
| ------------------ | ------------------------------------------------- |
| `npm run dev`     | Start the local dev server                       |
| `npm run build`   | Type-check and build for production into `dist/` |
| `npm run preview` | Preview the production build locally             |
| `npm run lint`    | Run ESLint                                       |

## Backend
The backend REST API for this project is a separate repository: [expense-tracker-api](https://github.com/roberttanjr19/expense-tracker-api) (Spring Boot + Java).

The app calls these REST endpoints on `http://localhost:8080`:

- `GET /api/expenses` — list expenses
- `POST /api/expenses` — create an expense
- `GET /api/categories` — list categories

The backend URL is currently hardcoded in `src/App.tsx`. Make sure the
backend is running locally before starting the dev server, or the app will
show a loading/error state.

## Project structure

```
src/
  App.tsx       # Main view: expense form + expense list
  types.ts      # Shared TypeScript types (Expense, Category)
  main.tsx      # App entry point
  index.css     # Tailwind entry point
public/         # Static assets served as-is
```
