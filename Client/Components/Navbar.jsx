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
    navigate("/");
  };

  if (auth === null) return null;

  return (
    <nav className="w-full bg-white shadow-sm flex items-center justify-between h-16 px-8">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img src="/logo.png" alt="CoWrite" className="w-9 h-9" />
        <span className="text-2xl font-extrabold text-blue-700 tracking-wide">
          CoWrite
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-700 font-medium px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-700 transition"
        >
          Dashboard
        </button>
        {auth ? (
          <>
            <button
              onClick={handleLogout}
              className="text-blue-600 font-semibold px-4 py-2 rounded hover:bg-blue-600 hover:text-white hover:shadow transition"
            >
              Logout
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full hover:bg-blue-50 flex items-center justify-center transition"
              title="Profile"
              style={{ border: "none", background: "none" }}
            >
              {auth?.authProvider === "google" ? (
                <img
                  src="/google-icon.png"
                  alt="Google Account"
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : auth?.name ? (
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white text-lg font-bold">
                  {auth.name[0].toUpperCase()}
                </span>
              ) : null}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/")}
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
