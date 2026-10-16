import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ManualPlanning from "./pages/ManualPlanning";
import AutoPlanning from "./pages/AutoPlanning";
import History from "./pages/History";
import Employees from "./pages/Employees";
import Users from "./pages/Users";
import { ROLES } from "./utils/roles";

function App() {
  const { user, role, loading } = useAuth();

  if (loading)
    return (
      <div
        style={{
          padding: 20,
          color: "#fff",
          background: "#0F0F12",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
        }}
      >
        Chargement...
      </div>
    );

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
      />
      <Route
        path="/planning/manual"
        element={user ? <ManualPlanning user={user} /> : <Navigate to="/login" />}
      />
      <Route
        path="/planning/auto"
        element={user ? <AutoPlanning user={user} /> : <Navigate to="/login" />}
      />
      <Route
        path="/history"
        element={user ? <History user={user} /> : <Navigate to="/login" />}
      />
      <Route
        path="/employees"
        element={user ? <Employees user={user} /> : <Navigate to="/login" />}
      />
      <Route
        path="/users"
        element={
          user && role === ROLES.ADMIN ? (
            <Users user={user} />
          ) : (
            <Navigate to="/dashboard" />
          )
        }
      />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default App;
