import { useState } from "react";
import client from "../api/client";

const SAMPLE_NOTE =
  "Patient came in for a routine visit. Blood pressure was slightly elevated at 145/90. " +
  "Discussed diet and exercise. Prescribed Metformin 500mg twice daily for blood sugar " +
  "management. Patient reports mild headaches over the past week. No known allergies. " +
  "Follow-up appointment scheduled in 3 weeks to recheck blood pressure and review lab results.";

export default function AISummaryPanel() {
  const [rawText, setRawText] = useState(SAMPLE_NOTE);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  async function summarize() {
    setLoading(true);
    try {
      const { data } = await client.post("/ai/summarize", { rawText });
      setSummary(data.note.aiSummary);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>AI Care Summarization</h2>
      <p className="hint-text">
        Paste raw visit notes or a caregiver log. CareLink condenses it into a short summary.
      </p>
      <textarea rows={6} value={rawText} onChange={(e) => setRawText(e.target.value)} />
      <button onClick={summarize} disabled={loading}>
        {loading ? "Summarizing..." : "Summarize note"}
      </button>

      {summary && (
        <div className="disclaimer" style={{ marginTop: 16 }}>
          <strong>AI Summary:</strong> {summary}
        </div>
      )}
    </div>
  );
}
