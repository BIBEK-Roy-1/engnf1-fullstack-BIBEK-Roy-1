import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/Login";
import Register from "../pages/Register";
import TriageQueue from "../pages/TriageQueue";
import TicketDetail from "../pages/TicketDetail";
import Resources from "../pages/Resources";
import ResourceDetail from "../pages/ResourceDetail";
import MyBookings from "../pages/MyBookings";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Protected application routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/triage" element={<TriageQueue />} />
          <Route path="/triage/:id" element={<TicketDetail />} />
          <Route path="/resources" element={<Resources />} />

          <Route path="/resources/:id" element={<ResourceDetail />} />

          <Route path="/my-bookings" element={<MyBookings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
