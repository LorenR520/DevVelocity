"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function signup(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) return setError(error.message);

    router.push("/auth/login");
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-md">
      <h1 className="text-2xl font-semibold mb-4">Create Account</h1>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      <form onSubmit={signup} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded border dark:bg-neutral-800"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded border dark:bg-neutral-800"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
        >
          Sign Up
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500">
        Already have an account?{" "}
        <a className="text-blue-600" href="/auth/login">
          Login
        </a>
      </p>
    </div>
  );
}
