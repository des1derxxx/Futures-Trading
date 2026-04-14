"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

type Tab = "login" | "register";

export default function AuthForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      if (tab === "login") {
        const res = await api.login({
          email: form.get("email") as string,
          password: form.get("password") as string,
        });
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        document.cookie = `auth_token=1; path=/; max-age=86400`;
        router.push("/");
      } else {
        const password = form.get("password") as string;
        const res = await api.register({
          name: form.get("name") as string,
          email: form.get("email") as string,
          password,
          password_confirmation: password,
        });
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        document.cookie = `auth_token=1; path=/; max-age=86400`;
        router.push("/");
      }
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        const flat: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(apiErr.errors)) {
          flat[key] = msgs[0];
        }
        setFieldErrors(flat);
      } else {
        setError(apiErr.message ?? "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="mb-8 text-center">
        <span className="text-2xl font-bold tracking-tight text-white">
          FUTURES<span className="text-emerald-400">X</span>
        </span>
        <p className="mt-1 text-sm text-zinc-500">
          Professional Crypto Trading
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        {/* Tabs */}
        <div className="mb-6 flex rounded-lg bg-zinc-800 p-1">
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError(null);
                setFieldErrors({});
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                tab === t
                  ? "bg-emerald-500 text-black shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name — only register */}
          {tab === "register" && (
            <Field
              name="name"
              label="Name"
              type="text"
              placeholder="Ivan"
              error={fieldErrors.name}
            />
          )}

          <Field
            name="email"
            label="Email"
            type="email"
            placeholder="ivan@example.com"
            error={fieldErrors.email}
          />

          <Field
            name="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            error={fieldErrors.password}
          />

          {/* Global error */}
          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : tab === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type,
  placeholder,
  error,
}: {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className={`rounded-lg border bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:ring-1 ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500"
        }`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
