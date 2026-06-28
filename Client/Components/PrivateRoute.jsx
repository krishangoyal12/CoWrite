import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/useAuth";

export default function PrivateRoute({ children }) {
  const { auth } = useAuth();

  useEffect(() => {
    if (auth === false) {
      toast("You should be logged in to access dashboard", { icon: "⚠️" });
    }
  }, [auth]);

  if (auth === null) return <div>Loading...</div>;
  if (auth) return children;
  return <Navigate to="/" replace />;
}