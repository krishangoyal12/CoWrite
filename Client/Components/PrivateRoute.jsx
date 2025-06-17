import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const baseURL = import.meta.env.VITE_URL;

export default function PrivateRoute({ children }) {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    fetch(`${baseURL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => setAuth(res.ok))
      .catch(() => setAuth(false));
  }, []);

  if (auth === null) return <div>Loading...</div>;
  return auth ? children : <Navigate to="/login" replace />;
}
