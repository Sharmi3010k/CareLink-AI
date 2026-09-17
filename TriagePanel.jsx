import { useState } from "react";
import client from "../api/client";

export default function TriagePanel() {
  const [symptomText, setSymptomText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function classify() {
    if (!symptomText.trim()) return;
    setLoading(true);
    try {
      const { data } = await client.post("/ai/triage", { symptomText });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  async function markReviewed() {
    if (!result) return;
    const { data } = await client.patch(`/ai/triage/${result.record._id}/review`, {
      reviewNotes: "Reviewed by care team.",
    });
    setResult((r) => ({ ...r, record: data.record }));
  }

  return (
    <div className="card">
      <h2>Symptom / Urgency Triage Support</h2>
      <p className="hint-text">
        Describe a reported symptom. This classifies relative urgency as decision support —
        it is not a medical diagnosis.
      </p>
      <textarea
        rows={3}
        placeholder="e.g. Patient has a high fever and severe headache"
        value={symptomText}
        onChange={(e) => setSymptomText(e.target.value)}
      />
      <button onClick={classify} disabled={loading}>
        {loading ? "Classifying..." : "Classify urgency"}
      </button>

      {result && (
        <div style={{ marginTop: 16 }}>
          <span className={`badge ${result.record.urgencyLevel}`}>
            {result.record.urgencyLevel}
          </span>
          {result.record.escalatedToHuman && (
            <span className="badge escalated">Escalated to human</span>
          )}
          <div className="hint-text" style={{ marginTop: 8 }}>
            Confidence: {Math.round(result.record.confidence * 100)}% — {result.rationale}
          </div>
          <div className="disclaimer">{result.disclaimer}</div>

          {result.record.escalatedToHuman && !result.record.reviewedBy && (
            <button className="secondary" style={{ marginTop: 10 }} onClick={markReviewed}>
              Mark as reviewed by care team
            </button>
          )}
        </div>
      )}
    </div>
  );
}
