import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "patient@demo.com", password: "password123", role: "patient" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : form;

      const { data } = await client.post(path, payload);
      localStorage.setItem("carelink_token", data.token);
      onLogin(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <h1>CareLink</h1>
        <p className="subtitle">AI-Assisted Health Coordination Platform</p>

        {error && <div className="error-text">{error}</div>}

        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>Full name</label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required />

              <label>I am a</label>
              <select value={form.role} onChange={(e) => update("role", e.target.value)}>
                <option value="patient">Patient</option>
                <option value="caregiver">Caregiver</option>
                <option value="provider">Provider</option>
              </select>
            </>
          )}

          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />

          <label>Password</label>
          <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required />

          <button type="submit" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="hint-text" style={{ marginTop: 14 }}>
          Demo login: patient@demo.com / password123 (run <code>npm run seed</code> in
          the backend first)
        </p>

        <button
          type="button"
          className="secondary"
          style={{ width: "100%" }}
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
