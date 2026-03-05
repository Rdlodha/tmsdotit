import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login({ onSubmit, onSwitch, pending, error, successMessage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!email || !password) {
      setLocalError("Email and password are required");
      return;
    }

    try {
      await onSubmit(email, password);
    } catch (submitError) {
      setLocalError(submitError.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border bg-white p-6 shadow"
      >
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-gray-500">Use your account to continue</p>

        {successMessage && (
          <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {(localError || error) && (
          <p className="mt-3 text-sm text-red-600">{localError || error}</p>
        )}

        <Button type="submit" className="mt-6 w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>

        <button
          type="button"
          onClick={onSwitch}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Create a new account
        </button>
      </form>
    </div>
  );
}
