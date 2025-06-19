import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../Context/useAuth";

const baseURL = import.meta.env.VITE_URL;

export default function Login() {
  const { setAuth } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [animate, setAnimate] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!form.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!form.password) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const res = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setAuth(data.user);
        toast.success("Login successful!");
        setForm({ email: "", password: "" });
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Login failed!");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const res = await fetch(`${baseURL}/api/auth/google-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: credentialResponse.credential,
          name: decoded.name,
          email: decoded.email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuth(data.user);
        toast.success("Google login successful!");
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Google login failed");
      }
    } catch {
      toast.error("Google login failed");
    }
  };

  const handleSignupClick = () => {
    setAnimate(true);
    setTimeout(() => {
      navigate("/signup");
    }, 400);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
      <div
        className={`bg-white shadow-2xl rounded-none w-full h-full flex flex-col justify-center px-4 sm:px-0 transition-transform duration-400 ${
          animate ? "animate-slide-right" : ""
        }`}
        style={{
          willChange: "transform",
        }}
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <span className="text-3xl text-blue-600 font-bold">✍️</span>
          </div>
          <h2 className="text-3xl font-extrabold text-blue-700 mb-1">
            CoWrite
          </h2>
          <p className="text-gray-500 text-center text-base">
            Welcome back! Log in to continue collaborating.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-w-md mx-auto w-full"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="text"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 rounded-lg shadow-lg transition"
          >
            Login
          </button>
        </form>
        <div className="mt-6 text-center text-gray-500 text-sm">
          New to CoWrite?{" "}
          <button
            className="text-blue-600 hover:underline font-medium"
            onClick={handleSignupClick}
          >
            Sign up
          </button>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center w-full max-w-md mb-3">
            <hr className="flex-grow border-gray-300" />
            <span className="mx-4 text-gray-400 font-semibold">or</span>
            <hr className="flex-grow border-gray-300" />
          </div>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google login failed!")}
            text="continue_with"
            width={300}
          />
        </div>
      </div>
      <style>
        {`
          .animate-slide-right {
            transform: translateX(100vw);
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}
      </style>
    </div>
  );
}