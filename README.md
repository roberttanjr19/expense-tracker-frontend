# Expense Tracker — Frontend

A React single-page app for tracking personal expenses, backed by a secured Spring Boot REST API. Users register, log in, and manage their own categories and expenses.

**Live demo:** https://expense-tracker-frontend-seven-green.vercel.app
**Backend repo:** https://github.com/roberttanjr19/expense-tracker-api

> Note: the API is hosted on Render's free tier and sleeps after 15 minutes of inactivity. The first load may take 30–60 seconds while the backend wakes up — the app shows a message while this happens. It's fast after that.

---

## Tech Stack

- **React 19** with **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS v4**
- Deployed on **Vercel** (auto-deploys on push to `main`)

---

## Features

- **Register and log in** — JWT stored in localStorage, so sessions survive a page refresh
- **Add categories** with duplicate-name prevention and clear inline errors
- **Add expenses** with amount, description, date, and category
- **Delete expenses** with a confirmation step
- **Log out**, and automatic logout when a token expires
- **Per-user data** — you only ever see your own categories and expenses
- Loading, empty, and error states throughout, including a friendly message while the backend wakes up

---

## How Authentication Works

1. Logging in POSTs credentials to `/api/auth/login`, which returns a signed JWT
2. The token is held in React state and mirrored to `localStorage` so a refresh keeps you logged in
3. Every request to a protected endpoint sends `Authorization: Bearer <token>`
4. The app renders the login screen when there's no token, and the tracker when there is
5. Any `401` response clears the token and returns the user to the login screen

**Trade-off worth noting:** storing the token in `localStorage` is convenient and survives refreshes, but it's readable by JavaScript on the page, so it's vulnerable to XSS. A production app would typically use httpOnly cookies instead.

---

## Running Locally

**Requirements:** Node.js 18+, and the [backend](https://github.com/roberttanjr19/expense-tracker-api) running

```bash
git clone https://github.com/roberttanjr19/expense-tracker-frontend.git
cd expense-tracker-frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`.

### Environment Variables

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:8080
```

Vite requires the `VITE_` prefix to expose a variable to client code, and env vars are embedded at **build time** — so changing one in production requires a redeploy, not just a restart.

If unset, the app falls back to `http://localhost:8080`.

---

## Deployment

Deployed on Vercel with `VITE_API_URL` pointing at the Render-hosted API. Pushing to `main` triggers an automatic rebuild and deploy.

---

## Roadmap

- [ ] Edit an existing expense
- [ ] Monthly and per-category spending summaries with charts
- [ ] Filter and search by date range, category, and amount
- [ ] Budgets with progress indicators
- [ ] Visual design pass
- [ ] Delete and rename categories

---

## Author

**Robert Ortiola Tan Jr.** — Software Engineering Technician student, Centennial College
[GitHub](https://github.com/roberttanjr19) · [LinkedIn](https://linkedin.com/in/robert-tan-jr-313a57386)
