"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is ON in Supabase:
    if (data?.user && !data.user.confirmed_at) {
      alert("Check your email to confirm your account.");
      setLoading(false);
      return;
    }

    // Otherwise go to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-neutral-900 shadow rounded-lg border border-gray-200 dark:border-neutral-800">
      <h1 className="text-2xl font-semibold mb-6 text-center">Create Account</h1>

      {error && (
        <p className="text-red-500 text-center mb-4">{error}</p>
      )}

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
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
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-gray-500">
        Already have an account?{" "}
        <a href="/auth/login" className="underline text-blue-600">
          Log in
        </a>
      </p>
    </div>
  );
}
