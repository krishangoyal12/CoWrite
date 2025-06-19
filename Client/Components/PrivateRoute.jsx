import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
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

  useEffect(() => {
    if (auth === false) {
      toast("You should be logged in access dashbaord", { icon: "⚠️" });
    }
  }, [auth]);

  if (auth === null) return <div>Loading...</div>;
  if (auth) return children;
  return <Navigate to="/login" replace />;
}