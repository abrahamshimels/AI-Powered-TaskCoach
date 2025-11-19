// src/routes/Routes.jsx
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import Dashboard from "../pages/Dashboard/Dashboard";
import TaskDetails from "../components/tasks/task-details/TaskDetails";
import PrivateRoute from "../components/PrivateRoute";
import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/task/:id"
        element={
          <PrivateRoute>
            <TaskDetails />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
