import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Register({ onSubmit, onSwitch, pending, error }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!name || !email || !password || !confirmPassword) {
      setLocalError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      await onSubmit(name, email, password, role);
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
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-gray-500">Register to access DOT IT</p>

        <div className="mt-6 space-y-4">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
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
          <Input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="admin-toggle"
              checked={role === "admin"}
              onChange={(e) => setRole(e.target.checked ? "admin" : "user")}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="admin-toggle" className="text-sm font-medium text-gray-700">
              Register as Admin
            </label>
          </div>
        </div>

        {(localError || error) && (
          <p className="mt-3 text-sm text-red-600">{localError || error}</p>
        )}

        <Button type="submit" className="mt-6 w-full" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>

        <button
          type="button"
          onClick={onSwitch}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Already have an account? Sign in
        </button>
      </form>
    </div>
  );
}
