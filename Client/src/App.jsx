import "./App.css";
import { Route, Routes, Navigate, useParams } from "react-router-dom";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Dashboard from "./Pages/Dashboard";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "../Components/PrivateRoute";
import Navbar from "../Components/Navbar";
import EditorPage from "./Pages/Editor";
import PublicEditor from "./Pages/PublicEditor";
import { useAuth } from "../Context/useAuth";

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
    </>
  );
}

export default App;
