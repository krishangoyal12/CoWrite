import "./App.css";
import { Route, Routes } from "react-router-dom";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Dashboard from "./Pages/Dashboard";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "../Components/PrivateRoute";
import Navbar from "../Components/Navbar";
import EditorPage from "./Pages/Editor";

function App() {
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
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/editor/:id" element={<EditorPage/>} />
      </Routes>
    </>
  );
}

export default App;
