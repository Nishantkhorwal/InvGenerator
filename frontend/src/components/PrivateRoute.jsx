import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Not logged in
  if (!token || !user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is provided, check if the user's role is included
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Unauthorized access, redirect
    return <Navigate to={user.role === "User" ? "/addentry" : "/"} replace />;
  }

  // Authorized: render children
  return <Outlet />;
};

export default PrivateRoute;
