import { useState, useEffect, useMemo } from "react";
import { authHeaders } from "./supabase.js";
import { inputSt, backBtn, Icon } from "./DashboardB.jsx";

const C = {
  brand:"#0284C7", brandLt:"#F0F9FF",
  green:"#16A34A", greenLt:"#F0FDF4",
  amber:"#D97706", amberLt:"#FFFBEB",
  red:"#DC2626",   redLt:"#FEF2F2",
  border:"#E5E9F0", text:"#0F172A", muted:"#64748B", light:"#F1F5F9",
};

function planBadge(plan) {
  const map = {
    pro:       { bg: C.greenLt, fg: C.green,  label: "Pro" },
    trial:     { bg: C.brandLt, fg: C.brand,  label: "Trial" },
    cancelled: { bg: C.redLt,   fg: C.red,    label: "Cancelled" },
    past_due:  { bg: C.amberLt, fg: C.amber,  label: "Past due" },
  };
  const s = map[plan] || map.trial;
  return (
    <span style={{ background: s.bg, color: s.fg, borderRadius: "99px", padding: "3px 10px", fontSize: "0.75em", fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

export default function AdminPanel({ onClose, onImpersonate, impersonating }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = await authHeaders();
        const res = await fetch("/api/admin-list-customers", { headers });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load customers");
        setCustomers(json.customers || []);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      [c.bizName, c.owner, c.email, c.suburb, c.industry].some(v => (v || "").toLowerCase().includes(q))
    );
  }, [customers, query]);

  const handleImpersonate = async (c) => {
    setBusyId(c.userId);
    try {
      await onImpersonate(c.userId, c.bizName);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA", fontFamily: "'Inter',system-ui,sans-serif", padding: "32px 24px" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <button onClick={onClose} style={{ ...backBtn, marginBottom: "16px" }}>
          <Icon name="home" size={15} /> Back to my dashboard
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.5em", fontWeight: 800, color: C.text, margin: 0 }}>Admin — Customers</h1>
            <div style={{ fontSize: "0.85em", color: C.muted, marginTop: "2px" }}>
              {customers.length} customer{customers.length === 1 ? "" : "s"}
            </div>
          </div>
          <div style={{ position: "relative", width: "280px", maxWidth: "100%" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.muted }}>
              <Icon name="search" size={15} />
            </span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search business, owner, email, suburb…"
              style={{ ...inputSt, paddingLeft: "36px" }}
            />
          </div>
        </div>

        {loading && <div style={{ color: C.muted, padding: "24px 0" }}>Loading customers…</div>}
        {error && (
          <div style={{ background: C.redLt, color: C.red, borderRadius: "10px", padding: "12px 16px", fontSize: "0.88em", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map(c => (
              <div key={c.userId} style={{
                background: "#fff", border: `1px solid ${C.border}`, borderRadius: "12px",
                padding: "16px 18px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
              }}>
                <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: C.text, fontSize: "0.98em" }}>
                      {c.bizName || "(no business name yet)"}
                    </span>
                    {planBadge(c.plan)}
                  </div>
                  <div style={{ fontSize: "0.82em", color: C.muted, marginTop: "3px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {c.owner && <span>{c.owner}</span>}
                    {c.email && <span>{c.email}</span>}
                    {c.suburb && <span><Icon name="mappin" size={12} /> {c.suburb}</span>}
                  </div>
                </div>

                <div style={{ fontSize: "0.82em", color: C.muted, minWidth: "120px" }}>
                  {c.plan === "trial" && c.daysRemaining !== null && (
                    <span style={{ color: c.isTrialActive ? C.muted : C.red }}>
                      {c.isTrialActive ? `${c.daysRemaining}d left in trial` : "Trial expired"}
                    </span>
                  )}
                  {c.plan !== "trial" && c.createdAt && (
                    <span>Joined {new Date(c.createdAt).toLocaleDateString()}</span>
                  )}
                </div>

                <button
                  onClick={() => handleImpersonate(c)}
                  disabled={busyId === c.userId || impersonating}
                  style={{
                    padding: "8px 16px", borderRadius: "8px", border: `1.5px solid ${C.brand}`,
                    background: "#fff", color: C.brand, fontSize: "0.85em", fontWeight: 700,
                    cursor: busyId === c.userId || impersonating ? "default" : "pointer",
                    opacity: busyId === c.userId ? 0.6 : 1, fontFamily: "inherit",
                  }}
                >
                  {busyId === c.userId ? "Opening…" : "View as customer"}
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ color: C.muted, padding: "24px 0", textAlign: "center" }}>No customers match "{query}".</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
