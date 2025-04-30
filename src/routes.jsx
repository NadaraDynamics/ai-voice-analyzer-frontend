import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./layouts/AdminDashboard";
import UserDashboard from "./layouts/UserDashboard";
import SignIn from "./pages/SignIn";
import { useAuth } from "./context/AuthContext";

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="*" element={<Navigate to="/sign-in" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {user.role === "admin" ? (
        <Route path="/*" element={<AdminDashboard />} />
      ) : (
        <Route path="/*" element={<UserDashboard />} />
      )}
    </Routes>
  );
}

export default AppRoutes;
