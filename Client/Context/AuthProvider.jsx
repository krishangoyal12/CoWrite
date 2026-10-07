import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  // Synchronously initialize from localStorage cache so the page renders at 0ms
  const [auth, setAuth] = useState(() => {
    try {
      const cached = localStorage.getItem("cowrite_user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem("token");
    const cached = localStorage.getItem("cowrite_user");
    // If no token, or if we already have cached user, do NOT block initial render
    return !token ? false : !cached;
  });

  const baseURL = import.meta.env.VITE_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuth(false);
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${baseURL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
      headers,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (data.user) {
          localStorage.setItem("cowrite_user", JSON.stringify(data.user));
          setAuth(data.user);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("cowrite_user");
          setAuth(false);
        }
        setLoading(false);
      })
      .catch(() => {
        // If network fails but we had cached user, keep user logged in
        if (!localStorage.getItem("cowrite_user")) {
          setAuth(false);
        }
        setLoading(false);
      });
  }, [baseURL]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}