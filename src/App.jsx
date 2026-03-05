import { useState } from "react";
import "./App.css";
import Home from "./layout/home";
import Login from "./layout/login";
import Register from "./layout/register";
import { AuthProvider, useAuth } from "@/auth/AuthContext";

function AppContent() {
  const { isAuthenticated, loading, login, register, logout, user, error, setError } = useAuth();
  const [screen, setScreen] = useState("login");
  const [pending, setPending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async (email, password) => {
    setPending(true);
    setError("");
    setSuccessMessage("");
    try {
      await login(email, password);
    } finally {
      setPending(false);
    }
  };

  const handleRegister = async (name, email, password, role) => {
    setPending(true);
    setError("");
    setSuccessMessage("");
    try {
      const data = await register(name, email, password, role);
      setSuccessMessage(data.message || "Registration successful! Check your email to verify.");
      setScreen("login");
    } catch (registerError) {
      throw registerError;
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-100">
        <p className="text-gray-600">Checking session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (screen === "register") {
      return (
        <Register
          onSubmit={handleRegister}
          onSwitch={() => {
            setError("");
            setSuccessMessage("");
            setScreen("login");
          }}
          pending={pending}
          error={error}
        />
      );
    }

    return (
      <Login
        onSubmit={handleLogin}
        onSwitch={() => {
          setError("");
          setSuccessMessage("");
          setScreen("register");
        }}
        pending={pending}
        error={error}
        successMessage={successMessage}
      />
    );
  }

  return <Home user={user} onLogout={logout} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
