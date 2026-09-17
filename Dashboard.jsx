import OverviewPanel from "../components/OverviewPanel";
import AISummaryPanel from "../components/AISummaryPanel";
import TriagePanel from "../components/TriagePanel";

export default function Dashboard({ user }) {
  return (
    <div>
      <div className="card" style={{ background: "transparent", boxShadow: "none", padding: "0 0 8px" }}>
        <h2 style={{ margin: 0 }}>Welcome back, {user?.name?.split(" ")[0] || "there"}</h2>
        <p className="hint-text" style={{ margin: 0 }}>
          Here's what's happening across appointments, medications, and care tasks.
        </p>
      </div>

      <OverviewPanel />

      <div className="grid-2">
        <AISummaryPanel />
        <TriagePanel />
      </div>
    </div>
  );
}
