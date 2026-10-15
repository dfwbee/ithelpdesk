"use client";

import { useAuth } from "../components/AuthProvider";
import AdminDashboard from "../components/AdminDashboard";
import UserHome from "../components/UserHome";

// The home page looks different for admins and regular users
export default function HomePage() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <UserHome />;
}