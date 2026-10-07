import "./App.css";
import React, { lazy, Suspense } from "react";
import { Route, Routes, Navigate, useParams } from "react-router-dom";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "../Components/PrivateRoute";
import Navbar from "../Components/Navbar";
import { useAuth } from "../Context/useAuth";

// Lazy-load heavier routes to keep initial bundle microscopic
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const EditorPage = lazy(() => import("./Pages/Editor"));
const PublicEditor = lazy(() => import("./Pages/PublicEditor"));

function LoadingFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EditorWrapper() {
  const { id } = useParams();
  return <EditorPage key={id} />;
}

function App() {
  const { auth } = useAuth();

  return (
    <>
      <Toaster />
      <Navbar/>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={auth ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/editor/:id" element={<EditorWrapper/>} />
          <Route path="/public/:id" element={<PublicEditor/>} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
