"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-neutral-900 shadow rounded-lg border border-gray-200 dark:border-neutral-800">
      <h1 className="text-2xl font-semibold mb-6 text-center">Login</h1>

      {error && (
        <p className="text-red-500 text-center mb-4">{error}</p>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          className="p-3 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="p-3 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-gray-500">
        Don't have an account?  
        <a href="/auth/signup" className="underline text-blue-600">
          Sign up
        </a>
      </p>
    </div>
  );
}
