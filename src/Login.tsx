import { useState } from "react";
import { API_BASE, extractErrorMessage } from "./api";
import SampleLedger from "./SampleLedger";

type Mode = "login" | "register";

interface LoginProps {
  onLogin: (token: string) => void;
}

const inputClasses =
  "h-10 w-full rounded border border-rule bg-paper px-3 text-[15px] text-ink placeholder:text-dim " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-ink";

const linkButtonClasses =
  "underline underline-offset-2 text-dim hover:text-ink " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-ink";

function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "register") {
        const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!registerResponse.ok) {
          throw new Error(await extractErrorMessage(registerResponse));
        }
      }

      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (loginResponse.status === 401) {
        throw new Error("Invalid email or password");
      }
      if (!loginResponse.ok) {
        throw new Error(await extractErrorMessage(loginResponse));
      }

      const data: { token: string } = await loginResponse.json();
      onLogin(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleMode() {
    setError("");
    setMode(mode === "login" ? "register" : "login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="border-b border-rule px-4 py-4 sm:px-6 sm:py-5">
        <span className="text-[16px] font-medium">Daybook</span>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-4 py-16 sm:py-20">
        <div className="login-scope flex w-full flex-col items-center">
          <div className="w-full max-w-[520px] text-center">
            <p className="eyebrow">Expense tracker</p>
            <h1 className="mt-4 text-[clamp(28px,5vw,38px)] font-medium leading-[1.15]">
              Every dollar, on one line.
            </h1>
            <p className="mt-3 text-[17px] text-dim">Know where it went.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-12 w-full max-w-[340px] space-y-3"
          >
            <h2 className="sr-only">
              {mode === "login" ? "Sign in" : "Create an account"}
            </h2>

            {mode === "register" && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClasses}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-10 w-full rounded bg-ink px-4 text-[15px] font-medium text-paper hover:opacity-90 disabled:opacity-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {submitting
                ? "Please wait…"
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </button>

            <p className="text-center text-[14px] text-dim">
              {mode === "login" ? (
                <>
                  No account?{" "}
                  <button type="button" onClick={toggleMode} className={linkButtonClasses}>
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have one?{" "}
                  <button type="button" onClick={toggleMode} className={linkButtonClasses}>
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>

          <div className="mt-16 w-full max-w-[520px] border-t border-rule pt-6">
            <SampleLedger />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
