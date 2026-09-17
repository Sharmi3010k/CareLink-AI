import { useEffect, useState } from "react";
import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import client from "./api/client";

export default function App() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("carelink_token");
    if (!token) {
      setChecked(true);
      return;
    }
    client
      .get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem("carelink_token"))
      .finally(() => setChecked(true));
  }, []);

  function logout() {
    localStorage.removeItem("carelink_token");
    setUser(null);
  }

  if (!checked) return null;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" /> : <Login onLogin={setUser} />}
      />
      <Route
        path="/dashboard"
        element={
          user ? (
            <Shell user={user} onLogout={logout}>
              <Dashboard user={user} />
            </Shell>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

function Shell({ user, onLogout, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>CareLink</h1>
        <p className="tagline">AI-assisted care coordination</p>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>
        </nav>
        <div style={{ marginTop: 40, fontSize: 13 }}>
          <div>{user.name}</div>
          <div className="hint-text" style={{ margin: "2px 0 12px" }}>{user.role}</div>
          <button className="secondary" style={{ width: "100%" }} onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
