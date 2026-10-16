import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ManualPlanning from "./pages/ManualPlanning";
import AutoPlanning from "./pages/AutoPlanning";
import History from "./pages/History";
import Employees from "./pages/Employees";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <div
        style={{
          padding: 20,
          color: "#fff",
          background: "#0f0f12",
          minHeight: "100vh",
        }}
      >
        Chargement...
      </div>
    );

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
      <Route path="/planning/manual" element={user ? <ManualPlanning user={user} /> : <Navigate to="/login" />} />
      <Route path="/planning/auto" element={user ? <AutoPlanning user={user} /> : <Navigate to="/login" />} />
      <Route path="/history" element={user ? <History user={user} /> : <Navigate to="/login" />} />
      <Route path="/employees" element={user ? <Employees user={user} /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default App;
