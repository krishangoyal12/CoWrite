import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/useAuth";

const baseURL = import.meta.env.VITE_URL;

export default function Navbar() {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch(`${baseURL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setAuth(false);
    navigate("/login");
  };

  if (auth === null) return null;

  return (
    <nav className="w-full bg-white shadow flex items-center justify-between h-20 px-8">
      {/* Left: Logo */}
      <button
        className="flex items-center gap-2"
        onClick={() => navigate("/")}
        style={{ outline: "none", border: "none", background: "none" }}
      >
        <img src="/logo.png" alt="CoWrite" className="w-10 h-10" />
        <span className="text-2xl font-extrabold text-blue-700 tracking-wide">
          CoWrite
        </span>
      </button>

      {/* Right: Navigation links */}
      <div className="flex items-center gap-6">
        <div className="ml-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-700 font-medium px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-700 transition"
          >
            Dashboard
          </button>
        </div>

        {auth ? (
          <>
            <button
              onClick={handleLogout}
              className="text-blue-600 font-semibold px-5 py-2 rounded hover:bg-blue-600 hover:text-white hover:shadow transition"
            >
              Logout
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full hover:bg-blue-50 flex items-center justify-center transition"
              style={{ border: "none", background: "none" }}
              title="Profile"
            >
              {auth?.authProvider === "google" ? (
                <img
                  src="/google-icon.png"
                  alt="Google Account"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : auth?.name ? (
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white text-lg font-bold">
                  {auth.name[0].toUpperCase()}
                </span>
              ) : null}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/login")}
              className="text-gray-700 font-medium px-4 py-2 rounded border border-blue-600 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="text-white font-semibold px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition"
            >
              Signup
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
