import { useEffect, useState } from "react";
import client from "../api/client";

export default function OverviewPanel() {
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [medications, setMedications] = useState([]);

  async function load() {
    const [aRes, tRes, mRes] = await Promise.all([
      client.get("/care/appointments"),
      client.get("/care/tasks"),
      client.get("/care/medications"),
    ]);
    setAppointments(aRes.data.appointments);
    setTasks(tRes.data.tasks);
    setMedications(mRes.data.medications);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleTask(id) {
    await client.patch(`/care/tasks/${id}/toggle`);
    load();
  }

  return (
    <div className="grid-2">
      <div className="card">
        <h2>Upcoming Appointments</h2>
        {appointments.length === 0 && <p className="hint-text">No appointments yet.</p>}
        {appointments.map((a) => (
          <div className="list-item" key={a._id}>
            <div>
              <strong>{a.title}</strong>
              <div className="hint-text" style={{ margin: 0 }}>
                {a.provider} &middot; {new Date(a.dateTime).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Care Tasks</h2>
        {tasks.length === 0 && <p className="hint-text">No tasks yet.</p>}
        {tasks.map((t) => (
          <div className="list-item" key={t._id}>
            <div>
              <strong style={{ textDecoration: t.completed ? "line-through" : "none" }}>
                {t.title}
              </strong>
              <div className="hint-text" style={{ margin: 0 }}>
                Priority: {t.priority}
                {t.dueDate ? ` · Due ${new Date(t.dueDate).toLocaleDateString()}` : ""}
              </div>
            </div>
            <button className="secondary" onClick={() => toggleTask(t._id)}>
              {t.completed ? "Undo" : "Done"}
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>Medications</h2>
        {medications.length === 0 && <p className="hint-text">No medications logged yet.</p>}
        {medications.map((m) => (
          <div className="list-item" key={m._id}>
            <div>
              <strong>{m.name}</strong>
              <div className="hint-text" style={{ margin: 0 }}>
                {m.dosage} &middot; {m.frequencyPerDay}x/day
              </div>
            </div>
            <ReminderSuggestion medicationId={m._id} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReminderSuggestion({ medicationId }) {
  const [suggestion, setSuggestion] = useState(null);

  async function fetchSuggestion() {
    const { data } = await client.get(`/ai/medications/${medicationId}/reminder-suggestion`);
    setSuggestion(data);
  }

  if (!suggestion) {
    return (
      <button className="secondary" onClick={fetchSuggestion}>
        Get smart reminder
      </button>
    );
  }

  return (
    <div style={{ fontSize: 12.5, maxWidth: 260, textAlign: "right" }}>
      <strong>{suggestion.offsetMinutes} min before dose</strong>
      <div className="hint-text" style={{ margin: 0 }}>{suggestion.reason}</div>
    </div>
  );
}
