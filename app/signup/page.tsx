"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");

  const handleSignup = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert("Check your inbox to continue your signup!");
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-neutral-900 rounded-xl shadow">
      <h1 className="text-2xl font-semibold mb-4">Create Account</h1>

      <input
        className="w-full p-2 border rounded mb-4 dark:bg-neutral-800"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        onClick={handleSignup}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Sign Up
      </button>
    </div>
  );
}
