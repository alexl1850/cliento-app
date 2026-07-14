import { useState, useEffect, useMemo, useRef } from "react";
import { authHeaders } from "./supabase.js";
import { inputSt, backBtn, Icon } from "./DashboardB.jsx";

// A platform-level crash (e.g. a hard function timeout) returns a plain-text
// or HTML error page, not JSON — res.json() throws a cryptic "Unexpected
// token" SyntaxError in that case, hiding what actually went wrong. Read as
// text first and only parse if it looks like JSON, so failures show a real
// message instead.
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Server returned a non-JSON response (status ${res.status}): ${text.slice(0, 200) || "(empty)"}` };
  }
}

// The bulk-batch importer can run for many minutes, entirely as in-memory
// component state — if anything causes AdminPanel to remount in that window
// (a Supabase session hiccup forcing App.jsx back to the login screen and
// then back again, for instance — there's no error boundary anywhere in
// this app to catch that more gracefully), the whole run and its progress
// log used to vanish with no trace. sessionStorage survives a remount
// without surviving an actual tab close, which is the right lifetime here.
function sessionState(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function persistSessionState(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable — not fatal */ }
}

const C = {
  brand:"#0284C7", brandLt:"#F0F9FF",
  green:"#16A34A", greenLt:"#F0FDF4",
  amber:"#D97706", amberLt:"#FFFBEB",
  red:"#DC2626",   redLt:"#FEF2F2",
  purple:"#7C3AED",purpleLt:"#F5F3FF",
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

function statusBadge(status) {
  const map = {
    sourced:    { bg: C.light,    fg: C.muted,  label: "Sourced" },
    drafted:    { bg: C.amberLt,  fg: C.amber,  label: "Needs review" },
    approved:   { bg: C.greenLt,  fg: C.green,  label: "Approved" },
    rejected:   { bg: C.redLt,    fg: C.red,    label: "Rejected" },
    exported:   { bg: C.purpleLt, fg: C.purple, label: "Exported" },
    phone_lead: { bg: C.brandLt,  fg: C.brand,  label: "Call list" },
  };
  const s = map[status] || map.sourced;
  return (
    <span style={{ background: s.bg, color: s.fg, borderRadius: "99px", padding: "3px 10px", fontSize: "0.75em", fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

function CustomersTab({ onImpersonate, impersonating }) {
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
        const json = await safeJson(res);
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
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ fontSize: "0.85em", color: C.muted, display: "flex", alignItems: "center", gap: "10px" }}>
          <span>{customers.length} customer{customers.length === 1 ? "" : "s"}</span>
          {customers.some(c => c.churnRisk) && (
            <span style={{ color: C.red, fontWeight: 700 }}>
              {customers.filter(c => c.churnRisk).length} at churn risk
            </span>
          )}
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
                  {c.churnRisk && (
                    <span style={{ background: C.redLt, color: C.red, borderRadius: "99px", padding: "3px 10px", fontSize: "0.75em", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                      <Icon name="alert" size={11} /> {c.daysSinceActive}d inactive — call?
                    </span>
                  )}
                  {c.referralCreditMonths > 0 && (
                    <span style={{ background: C.brandLt, color: C.brand, borderRadius: "99px", padding: "3px 10px", fontSize: "0.75em", fontWeight: 700 }}>
                      🎁 {c.referralCreditMonths} mo credit owed
                    </span>
                  )}
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
                  <div>Joined {new Date(c.createdAt).toLocaleDateString()}</div>
                )}
                {c.plan === "pro" && (
                  <div style={{ marginTop: "2px" }}>
                    {c.daysSinceActive === null ? "No activity recorded yet" : c.daysSinceActive === 0 ? "Active today" : `Active ${c.daysSinceActive}d ago`}
                  </div>
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
  );
}

function OutreachTab() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const [category, setCategory] = useState("");
  const [suburbsText, setSuburbsText] = useState("");
  const [sourcing, setSourcing] = useState(false);
  const [sourceMsg, setSourceMsg] = useState(null);

  const [generatingIds, setGeneratingIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [expandedSeqId, setExpandedSeqId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [bulkCategoriesText, setBulkCategoriesText] = useState(() => sessionState("akus_bulk_categories", ""));
  const [bulkSuburbsText, setBulkSuburbsText] = useState(() => sessionState("akus_bulk_suburbs", ""));
  const [bulkTarget, setBulkTarget] = useState(() => sessionState("akus_bulk_target", 1000));
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(() => sessionState("akus_bulk_progress", { sourced: 0, drafted: 0, status: "" }));
  const [bulkLog, setBulkLog] = useState(() => sessionState("akus_bulk_log", []));
  // If AdminPanel remounted mid-run (session hiccup, etc.), bulkRunning always
  // starts false on a fresh mount even though the restored progress/log show
  // an in-progress status — surface that explicitly instead of letting it
  // look like a normal idle state the user never touched.
  const [resumedFromInterruption] = useState(() => {
    const status = sessionState("akus_bulk_progress", { status: "" }).status;
    return !!status && status !== "Done." && status !== "Stopped.";
  });

  useEffect(() => { persistSessionState("akus_bulk_categories", bulkCategoriesText); }, [bulkCategoriesText]);
  useEffect(() => { persistSessionState("akus_bulk_suburbs", bulkSuburbsText); }, [bulkSuburbsText]);
  useEffect(() => { persistSessionState("akus_bulk_target", bulkTarget); }, [bulkTarget]);
  useEffect(() => { persistSessionState("akus_bulk_progress", bulkProgress); }, [bulkProgress]);
  useEffect(() => { persistSessionState("akus_bulk_log", bulkLog); }, [bulkLog]);
  const bulkStopRef = useRef(false);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/admin-list-leads", { headers });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json.error || "Could not load leads");
      setLeads(json.leads || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadLeads(); }, []);

  const counts = useMemo(() => {
    const c = { all: leads.length, sourced: 0, drafted: 0, approved: 0, rejected: 0, exported: 0, phone_lead: 0 };
    for (const l of leads) c[l.status] = (c[l.status] || 0) + 1;
    return c;
  }, [leads]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return leads;
    return leads.filter(l => l.status === statusFilter);
  }, [leads, statusFilter]);

  const handleSource = async (e) => {
    e.preventDefault();
    const suburbs = suburbsText.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    if (!category.trim() || suburbs.length === 0) return;
    setSourcing(true);
    setSourceMsg(null);
    try {
      const res = await fetch("/api/admin-source-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ category: category.trim(), suburbs }),
      });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json.error || "Sourcing failed");
      let msg = `Found ${json.sourced} lead${json.sourced === 1 ? "" : "s"} with a published email, plus ${json.phoneLeadsSourced || 0} no-website business${json.phoneLeadsSourced === 1 ? "" : "es"} added to the call list. Skipped ${json.skippedNoEmail} with a site but no discoverable email, ${json.skippedDuplicate} already sourced${json.insertFailed ? `, ${json.insertFailed} failed to save (see below)` : ""}.`;
      if (json.errors?.length) msg += `\n\n⚠ ${json.errors.join("\n⚠ ")}`;
      setSourceMsg(msg);
      await loadLeads();
    } catch (err) {
      setSourceMsg(`Error: ${err.message}`);
    }
    setSourcing(false);
  };

  const generateDraft = async (leadId) => {
    setGeneratingIds(prev => new Set(prev).add(leadId));
    try {
      const res = await fetch("/api/admin-generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ leadId }),
      });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json.error || "Draft generation failed");
      await loadLeads();
    } catch (err) {
      setError(err.message);
    }
    setGeneratingIds(prev => { const next = new Set(prev); next.delete(leadId); return next; });
  };

  const generateAllSourced = async () => {
    const ids = leads.filter(l => l.status === "sourced").slice(0, 2).map(l => l.id);
    if (ids.length === 0) return;
    setGeneratingIds(new Set(ids));
    try {
      const res = await fetch("/api/admin-generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ leadIds: ids }),
      });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json.error || "Draft generation failed");
      await loadLeads();
    } catch (err) {
      setError(err.message);
    }
    setGeneratingIds(new Set());
  };

  // Runs entirely in the browser using the admin's own logged-in session —
  // repeatedly calls the same source/generate endpoints the manual buttons
  // use, chunked to match their internal per-call caps (8 suburbs sourced,
  // 20 drafted at a time), until the target count is hit or every
  // category+suburb combination has been tried. This exists because reaching
  // real volume (hundreds to thousands of leads) by clicking the manual
  // buttons one batch at a time isn't practical.
  const runBulkBatch = async () => {
    const categories = bulkCategoriesText.split("\n").map(s => s.trim()).filter(Boolean);
    const suburbs = bulkSuburbsText.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    if (categories.length === 0 || suburbs.length === 0) {
      setBulkLog(prev => [...prev, "Need at least one category and one suburb."]);
      return;
    }

    bulkStopRef.current = false;
    setBulkRunning(true);
    setBulkProgress({ sourced: 0, drafted: 0, status: "Starting…" });
    setBulkLog([]);
    let totalSourced = 0, totalDrafted = 0;

    outer:
    for (const cat of categories) {
      for (let i = 0; i < suburbs.length; i += 8) {
        if (bulkStopRef.current) break outer;
        if (totalDrafted >= bulkTarget) break outer;

        const chunk = suburbs.slice(i, i + 8);
        setBulkProgress(p => ({ ...p, status: `Sourcing "${cat}" in ${chunk.length} suburb(s)…` }));

        let sourcedIds = [];
        try {
          const headers = await authHeaders();
          const res = await fetch("/api/admin-source-leads", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({ category: cat, suburbs: chunk }),
          });
          const json = await safeJson(res);
          if (!res.ok) throw new Error(json.error || "Sourcing failed");
          // Only email-able leads (status "sourced") go on to drafting — phone
          // leads (no website, no email) have nothing to draft an email for.
          sourcedIds = (json.leads || []).filter(l => l.status === "sourced").map(l => l.id);
          totalSourced += json.sourced || 0;
          setBulkLog(prev => [...prev, `Sourced ${json.sourced} email lead(s) + ${json.phoneLeadsSourced || 0} phone lead(s) in ${cat} / ${chunk.join(", ")} (skipped: ${json.skippedNoEmail} no email, ${json.skippedDuplicate} dup)`]);
        } catch (err) {
          setBulkLog(prev => [...prev, `Sourcing error for ${cat} / ${chunk.join(", ")}: ${err.message}`]);
          continue;
        }
        setBulkProgress(p => ({ ...p, sourced: totalSourced }));

        // Draft everything just sourced, in sub-chunks of 2 (the endpoint's
        // cap) — each lead does two AI calls (demo site + full personalized
        // sequence) in one request with no Fluid Compute on this project, so
        // the 60s function ceiling is hard, not soft. Anything sent beyond
        // the endpoint's own cap gets silently truncated server-side rather
        // than queued, which would otherwise leave those extra leads stuck
        // at "sourced" forever with no error to explain why.
        for (let j = 0; j < sourcedIds.length; j += 2) {
          if (bulkStopRef.current || totalDrafted >= bulkTarget) break;
          const idChunk = sourcedIds.slice(j, j + 2);
          setBulkProgress(p => ({ ...p, status: `Drafting ${idChunk.length} lead(s)…` }));
          try {
            const headers = await authHeaders();
            const res = await fetch("/api/admin-generate-outreach", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...headers },
              body: JSON.stringify({ leadIds: idChunk }),
            });
            const json = await safeJson(res);
            if (!res.ok) throw new Error(json.error || "Draft generation failed");
            totalDrafted += (json.drafted || []).length;
            if ((json.errors || []).length) {
              setBulkLog(prev => [...prev, `${json.errors.length} draft error(s): ${json.errors.map(e => e.error).slice(0, 3).join("; ")}`]);
            }
          } catch (err) {
            setBulkLog(prev => [...prev, `Drafting error: ${err.message}`]);
          }
          setBulkProgress(p => ({ ...p, drafted: totalDrafted }));
        }

        await loadLeads();
      }
    }

    setBulkProgress(p => ({ ...p, status: bulkStopRef.current ? "Stopped." : "Done." }));
    setBulkRunning(false);
  };

  const stopBulkBatch = () => { bulkStopRef.current = true; };

  const startEdit = (lead) => {
    setEditingId(lead.id);
    setEditSubject(lead.draft_subject || "");
    setEditBody(lead.draft_body || "");
  };

  const updateLead = async (id, patch) => {
    const res = await fetch("/api/admin-update-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ id, ...patch }),
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json.error || "Update failed");
    await loadLeads();
  };

  const saveEdit = async (id) => {
    try {
      await updateLead(id, { draftSubject: editSubject, draftBody: editBody });
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const approve = async (id) => {
    try { await updateLead(id, { status: "approved" }); } catch (err) { setError(err.message); }
  };
  const reject = async (id) => {
    try { await updateLead(id, { status: "rejected" }); } catch (err) { setError(err.message); }
  };

  const deleteLeads = async (ids) => {
    try {
      const res = await fetch("/api/admin-delete-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ ids }),
      });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json.error || "Delete failed");
      await loadLeads();
    } catch (err) {
      setError(err.message);
    }
  };
  const deleteLead = (id) => deleteLeads([id]);
  const deleteAllShown = () => {
    if (filtered.length === 0) return;
    if (!window.confirm(`Delete all ${filtered.length} lead(s) in this view? This can't be undone.`)) return;
    deleteLeads(filtered.map(l => l.id));
  };

  const exportCsv = async (type) => {
    setExporting(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/admin-export-leads${type ? `?type=${type}` : ""}`, { headers });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `akus-outreach-${type || "email"}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      await loadLeads();
    } catch (err) {
      setError(err.message);
    }
    setExporting(false);
  };

  return (
    <div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
        <div style={{ fontWeight: 700, color: C.text, marginBottom: "10px" }}>Source new leads</div>
        <form onSubmit={handleSource} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Category (e.g. plumber, cafe, hair salon)"
            style={inputSt}
          />
          <textarea
            value={suburbsText}
            onChange={e => setSuburbsText(e.target.value)}
            placeholder="Suburbs, one per line or comma-separated (e.g. Wollongong NSW, Corrimal NSW)"
            rows={3}
            style={{ ...inputSt, resize: "vertical", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="submit"
              disabled={sourcing}
              style={{
                padding: "10px 18px", borderRadius: "8px", border: "none",
                background: C.brand, color: "#fff", fontSize: "0.88em", fontWeight: 700,
                cursor: sourcing ? "default" : "pointer", opacity: sourcing ? 0.6 : 1, fontFamily: "inherit",
              }}
            >
              {sourcing ? "Sourcing…" : "Source leads"}
            </button>
            <span style={{ fontSize: "0.78em", color: C.muted }}>Only businesses with a publicly published email are kept (max 8 suburbs per run).</span>
          </div>
          {sourceMsg && (
            <div style={{ fontSize: "0.82em", color: sourceMsg.startsWith("Error") ? C.red : C.green, whiteSpace: "pre-wrap" }}>{sourceMsg}</div>
          )}
        </form>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
        <div style={{ fontWeight: 700, color: C.text, marginBottom: "4px" }}>Bulk batch</div>
        <div style={{ fontSize: "0.78em", color: C.muted, marginBottom: "10px" }}>
          Runs sourcing + drafting automatically across many categories and suburbs until it hits your target count. Keep this tab open while it runs — it can take a while for large targets.
        </div>
        {resumedFromInterruption && !bulkRunning && (
          <div style={{ fontSize: "0.82em", color: C.amber, background: C.amberLt, border: `1px solid ${C.amber}44`, borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
            ⚠ A previous run looks like it got interrupted partway through (last status: "{bulkProgress.status}", {bulkProgress.sourced} sourced / {bulkProgress.drafted} drafted). Nothing was lost that had already been saved — sourcing skips duplicates and drafting only touches leads still marked "sourced", so it's safe to just click "Start bulk batch" again to pick up where it left off.
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <textarea
            value={bulkCategoriesText}
            onChange={e => setBulkCategoriesText(e.target.value)}
            placeholder={"Categories, one per line\ne.g.\nplumber\nelectrician\ncafe"}
            rows={4}
            disabled={bulkRunning}
            style={{ ...inputSt, resize: "vertical", fontFamily: "inherit" }}
          />
          <textarea
            value={bulkSuburbsText}
            onChange={e => setBulkSuburbsText(e.target.value)}
            placeholder={"Suburbs, one per line or comma-separated\ne.g.\nWollongong NSW\nCorrimal NSW\nShellharbour NSW"}
            rows={4}
            disabled={bulkRunning}
            style={{ ...inputSt, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.82em", color: C.muted, display: "flex", alignItems: "center", gap: "6px" }}>
            Target leads
            <input
              type="number" min="1" value={bulkTarget}
              onChange={e => setBulkTarget(parseInt(e.target.value) || 0)}
              disabled={bulkRunning}
              style={{ ...inputSt, width: "90px", padding: "6px 10px" }}
            />
          </label>
          {!bulkRunning ? (
            <button
              onClick={runBulkBatch}
              style={{ padding: "10px 18px", borderRadius: "8px", border: "none", background: C.purple, color: "#fff", fontSize: "0.88em", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              Run bulk batch
            </button>
          ) : (
            <button
              onClick={stopBulkBatch}
              style={{ padding: "10px 18px", borderRadius: "8px", border: `1.5px solid ${C.red}`, background: "#fff", color: C.red, fontSize: "0.88em", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              Stop
            </button>
          )}
          {bulkProgress.status && (
            <span style={{ fontSize: "0.82em", color: C.text, fontWeight: 600 }}>
              {bulkProgress.status} · Sourced {bulkProgress.sourced} · Drafted {bulkProgress.drafted} / {bulkTarget}
            </span>
          )}
        </div>
        {bulkLog.length > 0 && (
          <div style={{ marginTop: "10px", maxHeight: "140px", overflowY: "auto", background: C.light, borderRadius: "8px", padding: "10px 12px", fontSize: "0.76em", color: C.muted, fontFamily: "monospace" }}>
            {bulkLog.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All" },
            { key: "sourced", label: "Sourced" },
            { key: "drafted", label: "Needs your review" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
            { key: "exported", label: "Exported" },
            { key: "phone_lead", label: "Call list" },
          ].map(({ key: s, label }) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "6px 14px", borderRadius: "99px", border: `1.5px solid ${statusFilter === s ? C.brand : C.border}`,
                background: statusFilter === s ? C.brandLt : "#fff", color: statusFilter === s ? C.brand : C.muted,
                fontSize: "0.8em", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {label} ({counts[s] || 0})
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {counts.sourced > 0 && (
            <button
              onClick={generateAllSourced}
              disabled={generatingIds.size > 0}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: `1.5px solid ${C.brand}`,
                background: "#fff", color: C.brand, fontSize: "0.82em", fontWeight: 700,
                cursor: generatingIds.size > 0 ? "default" : "pointer", fontFamily: "inherit",
              }}
            >
              Generate drafts (up to 2)
            </button>
          )}
          {counts.approved > 0 && (
            <button
              onClick={() => exportCsv()}
              disabled={exporting}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "none",
                background: C.green, color: "#fff", fontSize: "0.82em", fontWeight: 700,
                cursor: exporting ? "default" : "pointer", opacity: exporting ? 0.6 : 1, fontFamily: "inherit",
              }}
            >
              {exporting ? "Exporting…" : `Export ${counts.approved} approved as CSV`}
            </button>
          )}
          {counts.phone_lead > 0 && (
            <button
              onClick={() => exportCsv("phone")}
              disabled={exporting}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: `1.5px solid ${C.brand}`,
                background: "#fff", color: C.brand, fontSize: "0.82em", fontWeight: 700,
                cursor: exporting ? "default" : "pointer", opacity: exporting ? 0.6 : 1, fontFamily: "inherit",
              }}
            >
              {exporting ? "Exporting…" : `Export ${counts.phone_lead} phone leads as CSV`}
            </button>
          )}
          {filtered.length > 0 && (
            <button
              onClick={deleteAllShown}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "none",
                background: C.red, color: "#fff", fontSize: "0.82em", fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              🗑 Delete all shown ({filtered.length})
            </button>
          )}
        </div>
      </div>

      {loading && <div style={{ color: C.muted, padding: "24px 0" }}>Loading leads…</div>}
      {error && (
        <div style={{ background: C.redLt, color: C.red, borderRadius: "10px", padding: "12px 16px", fontSize: "0.88em", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(lead => (
            <div key={lead.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                <div>
                  <span style={{ fontWeight: 700, color: C.text }}>{lead.business_name}</span>
                  <span style={{ fontSize: "0.82em", color: C.muted, marginLeft: "8px" }}>
                    <Icon name="mappin" size={12} /> {lead.suburb} · {lead.category}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {statusBadge(lead.status)}
                  <button
                    onClick={() => { if (window.confirm(`Delete the lead for "${lead.business_name}"? This can't be undone.`)) deleteLead(lead.id); }}
                    title="Delete this lead"
                    style={{ padding: "5px 12px", borderRadius: "99px", border: `1.5px solid ${C.red}`, background: C.redLt, color: C.red, fontSize: "0.75em", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
              <div style={{ fontSize: "0.8em", color: C.muted, marginBottom: "10px" }}>
                {lead.status === "phone_lead" ? (
                  <span>No website found — call <strong style={{ color: C.text }}>{lead.phone || "unknown"}</strong> directly</span>
                ) : (
                  <>
                    {lead.discovered_email} · {lead.website_url}
                    {lead.pagespeed_score !== null && lead.pagespeed_score !== undefined && (
                      <span> · Their site's mobile PageSpeed score: {lead.pagespeed_score}/100</span>
                    )}
                  </>
                )}
              </div>

              {lead.status === "sourced" && (
                <button
                  onClick={() => generateDraft(lead.id)}
                  disabled={generatingIds.has(lead.id)}
                  style={{
                    padding: "8px 16px", borderRadius: "8px", border: `1.5px solid ${C.brand}`,
                    background: "#fff", color: C.brand, fontSize: "0.82em", fontWeight: 700,
                    cursor: generatingIds.has(lead.id) ? "default" : "pointer", fontFamily: "inherit",
                  }}
                >
                  {generatingIds.has(lead.id) ? "Generating…" : "Generate draft"}
                </button>
              )}

              {(lead.status === "drafted" || lead.status === "approved" || lead.status === "rejected") && (
                <div style={{ background: C.light, borderRadius: "10px", padding: "14px" }}>
                  {editingId === lead.id ? (
                    <>
                      <input value={editSubject} onChange={e => setEditSubject(e.target.value)} style={{ ...inputSt, marginBottom: "8px", fontWeight: 700 }} />
                      <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={6} style={{ ...inputSt, resize: "vertical", fontFamily: "inherit", whiteSpace: "pre-wrap" }} />
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <button onClick={() => saveEdit(lead.id)} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: C.brand, color: "#fff", fontSize: "0.8em", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: "6px 14px", borderRadius: "8px", border: `1.5px solid ${C.border}`, background: "#fff", color: C.muted, fontSize: "0.8em", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 700, color: C.text, marginBottom: "6px", fontSize: "0.9em" }}>
                        {lead.draft_subject}
                        {lead.status === "approved" && (
                          <span style={{ marginLeft: "8px", fontSize: "0.7em", fontWeight: 700, color: lead.review_sample ? C.green : C.muted, background: lead.review_sample ? C.greenLt : C.light, borderRadius: "99px", padding: "2px 8px" }}>
                            {lead.review_sample ? "Reviewed" : "Auto-approved"}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.85em", color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{lead.draft_body}</div>
                      {lead.demo_url && (
                        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                          <a href={lead.demo_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8em", color: C.brand, fontWeight: 700 }}>View generated demo ↗</a>
                          {Array.isArray(lead.sequence) && lead.sequence.length > 1 && (
                            <button
                              onClick={() => setExpandedSeqId(expandedSeqId === lead.id ? null : lead.id)}
                              style={{ padding: "3px 10px", borderRadius: "99px", border: `1px solid ${C.border}`, background: "#fff", color: C.muted, fontSize: "0.75em", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                            >
                              {expandedSeqId === lead.id ? "Hide" : "Show"} remaining {lead.sequence.length - 1} email{lead.sequence.length - 1 === 1 ? "" : "s"}
                            </button>
                          )}
                        </div>
                      )}
                      {expandedSeqId === lead.id && Array.isArray(lead.sequence) && (
                        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          {lead.sequence.filter(s => s.step > 1).map(s => (
                            <div key={s.step} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px 12px" }}>
                              <div style={{ fontSize: "0.72em", fontWeight: 700, color: C.muted, marginBottom: "4px" }}>
                                Day {s.delayDays} · Step {s.step}
                              </div>
                              <div style={{ fontWeight: 700, color: C.text, marginBottom: "4px", fontSize: "0.85em" }}>{s.subject}</div>
                              <div style={{ fontSize: "0.8em", color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{s.body}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {lead.status === "drafted" && (
                        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                          <button onClick={() => approve(lead.id)} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: C.green, color: "#fff", fontSize: "0.8em", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Approve</button>
                          <button onClick={() => reject(lead.id)} style={{ padding: "7px 16px", borderRadius: "8px", border: `1.5px solid ${C.red}`, background: "#fff", color: C.red, fontSize: "0.8em", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Reject</button>
                          <button onClick={() => startEdit(lead)} style={{ padding: "7px 16px", borderRadius: "8px", border: `1.5px solid ${C.border}`, background: "#fff", color: C.muted, fontSize: "0.8em", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ color: C.muted, padding: "24px 0", textAlign: "center" }}>No leads in this view yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel({ onClose, onImpersonate, impersonating }) {
  // If something forces this component to remount mid-session (see the
  // sessionState() comment above), landing back on Customers instead of
  // wherever the admin actually was is its own small confusion on top of
  // whatever caused the remount — cheap to avoid.
  const [tab, setTab] = useState(() => sessionState("akus_admin_tab", "customers"));
  useEffect(() => { persistSessionState("akus_admin_tab", tab); }, [tab]);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA", fontFamily: "'Inter',system-ui,sans-serif", padding: "32px 24px" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <button onClick={onClose} style={{ ...backBtn, marginBottom: "16px" }}>
          <Icon name="home" size={15} /> Back to my dashboard
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <h1 style={{ fontSize: "1.5em", fontWeight: 800, color: C.text, margin: 0 }}>
            Admin — {tab === "customers" ? "Customers" : "Outreach"}
          </h1>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => setTab("customers")}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: `1.5px solid ${tab === "customers" ? C.brand : C.border}`,
                background: tab === "customers" ? C.brandLt : "#fff", color: tab === "customers" ? C.brand : C.muted,
                fontSize: "0.85em", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Customers
            </button>
            <button
              onClick={() => setTab("outreach")}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: `1.5px solid ${tab === "outreach" ? C.brand : C.border}`,
                background: tab === "outreach" ? C.brandLt : "#fff", color: tab === "outreach" ? C.brand : C.muted,
                fontSize: "0.85em", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Outreach
            </button>
          </div>
        </div>

        {tab === "customers" ? (
          <CustomersTab onImpersonate={onImpersonate} impersonating={impersonating} />
        ) : (
          <OutreachTab />
        )}
      </div>
    </div>
  );
}
