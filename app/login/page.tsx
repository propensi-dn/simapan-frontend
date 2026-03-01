"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import api from "@/lib/axios";
import { saveAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("member.active@gmail.com");
  const [password, setPassword] = useState("Member1234!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await api.post("/auth/login/", { email, password });
      saveAuth(response.data.access, response.data.refresh, response.data.role, response.data.email);
      router.push("/savings");
    } catch {
      setError("Email atau password salah");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Login SI-MAPAN</h1>
        <p className="mt-1 text-sm text-zinc-500">Masuk untuk mengakses halaman simpanan.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-400"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-400"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSubmitting ? "Memproses..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
