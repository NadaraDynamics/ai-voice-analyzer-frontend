import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import SignIn from "./layouts/authentication/sign-in";
import Dashboard from "./layouts/dashboard";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default AppRoutes;
