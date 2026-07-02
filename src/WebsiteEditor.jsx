import { useState } from "react";

const inp = {width:"100%",padding:"12px 14px",borderRadius:"10px",border:"1.5px solid #E5E7EB",fontSize:"0.92em",color:"#111827",outline:"none",boxSizing:"border-box",fontFamily:"inherit",background:"#fff"};
const btn = (bg="#2563EB") => ({padding:"14px 20px",borderRadius:"10px",border:"none",background:bg,color:"#fff",fontSize:"0.9em",fontWeight:800,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"});

const EXAMPLES = [
  "Change my headline to 'Wollongong's Most Trusted Plumber'",
  "Add emergency callouts as a new service",
  "Add a Christmas special offer section",
  "Update my phone number to 0412 345 678",
  "Add a gallery section with my latest work",
  "Make the tone more friendly and casual",
  "Add our opening hours — Mon–Fri 7am–4pm, Sat 8am–12pm",
  "Add a 10% off first visit offer",
];

export default function WebsiteEditor({ biz, liveUrl, onBack }) {
  const [instruction, setInstruction] = useState("");
  const [phase, setPhase]             = useState("idle"); // idle | loading | done | error
  const [currentUrl, setCurrentUrl]   = useState(liveUrl || "");
  const [errorMsg, setErrorMsg]       = useState("");
  const [history, setHistory]         = useState([]);
  const [copied, setCopied]           = useState(false);

  const applyChange = async () => {
    if (!instruction.trim() || phase === "loading") return;
    setPhase("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/edit-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: instruction.trim(),
          currentUrl,
          biz,
        }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setHistory(h => [{ instruction: instruction.trim(), ts: new Date().toLocaleTimeString("en-AU") }, ...h]);
      setCurrentUrl(d.url);
      setInstruction("");
      setPhase("done");
    } catch (e) {
      setErrorMsg(e.message || "Something went wrong — please try again.");
      setPhase("error");
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(currentUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontSize: "0.86em", fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: "4px", marginBottom: "16px" }}>
        ← Back
      </button>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0D1117 0%,#1A2235 100%)", borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "1.8em" }}>✏️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1em", color: "#fff", marginBottom: "2px" }}>Edit My Website</div>
            <div style={{ fontSize: "0.8em", color: "rgba(255,255,255,0.5)" }}>
              Describe what you want changed — AI updates and redeploys in ~30 seconds
            </div>
          </div>
        </div>
      </div>

      {/* Live preview */}
      {currentUrl && (
        <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: "12px", overflow: "hidden", marginBottom: "16px" }}>
          <div style={{ background: "#F8F9FA", padding: "10px 14px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "flex", gap: "5px" }}>
              {["#FF5F56", "#FFBD2E", "#27C93F"].map(c => <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
            </div>
            <div style={{ flex: 1, background: "#fff", borderRadius: "6px", padding: "4px 10px", fontSize: "0.75em", color: "#6B7280", border: "1px solid #E5E7EB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentUrl}
            </div>
            <button onClick={copyUrl} style={{ fontSize: "0.72em", color: copied ? "#16A34A" : "#2563EB", fontWeight: 600, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
              {copied ? "✓ Copied" : "Copy link"}
            </button>
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72em", color: "#2563EB", fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
              Open ↗
            </a>
          </div>
          <iframe
            src={currentUrl}
            style={{ width: "100%", height: "340px", border: "none", display: "block" }}
            title="Your website preview"
            loading="lazy"
            key={currentUrl} // forces reload when URL changes
          />
        </div>
      )}

      {/* Instruction input */}
      <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "18px", marginBottom: "12px" }}>
        <label style={{ display: "block", fontWeight: 700, fontSize: "0.85em", color: "#374151", marginBottom: "8px" }}>
          What would you like to change?
        </label>
        <textarea
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          placeholder="e.g. Change my headline to 'Best Café in Wollongong' and add a note that we're dog-friendly..."
          rows={3}
          style={{ ...inp, resize: "vertical", marginBottom: "10px" }}
          disabled={phase === "loading"}
          onKeyDown={e => { if (e.key === "Enter" && e.metaKey) applyChange(); }}
        />

        {/* Example chips */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "0.72em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "7px" }}>
            Quick examples — tap to use:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setInstruction(ex)}
                style={{ padding: "5px 10px", borderRadius: "99px", border: "1px solid #E5E7EB", background: "#F8F9FA", fontSize: "0.72em", color: "#6B7280", cursor: "pointer", fontFamily: "inherit", transition: "all 0.1s" }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Status messages */}
        {phase === "error" && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 12px", fontSize: "0.82em", color: "#991B1B", marginBottom: "10px" }}>
            ⚠️ {errorMsg}
          </div>
        )}
        {phase === "done" && (
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px", padding: "10px 12px", fontSize: "0.82em", color: "#166534", marginBottom: "10px" }}>
            ✅ Done! Your website has been updated and is live. The preview above has refreshed.
          </div>
        )}

        <button
          onClick={applyChange}
          disabled={!instruction.trim() || phase === "loading"}
          style={{ ...btn(phase === "loading" ? "#6B7280" : "#2563EB"), width: "100%", opacity: instruction.trim() && phase !== "loading" ? 1 : 0.45 }}
        >
          {phase === "loading" ? "✨ Updating your website..." : "✨ Make this change →"}
        </button>

        {phase === "loading" && (
          <div style={{ marginTop: "10px", fontSize: "0.78em", color: "#6B7280", textAlign: "center", lineHeight: 1.6 }}>
            Reading your website → applying changes → redeploying live<br />About 30 seconds
          </div>
        )}
      </div>

      {/* Change history */}
      {history.length > 0 && (
        <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "16px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.85em", color: "#374151", marginBottom: "10px" }}>
            Changes made this session
          </div>
          {history.map((h, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < history.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <span style={{ color: "#16A34A", flexShrink: 0 }}>✓</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.83em", color: "#111827", fontWeight: 600 }}>{h.instruction}</div>
                <div style={{ fontSize: "0.72em", color: "#9CA3AF", marginTop: "2px" }}>{h.ts}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      <div style={{ marginTop: "12px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "9px", padding: "12px 14px", fontSize: "0.78em", color: "#92400E", lineHeight: 1.6 }}>
        💡 <strong>Tip:</strong> Be as specific as possible — "change the headline to X" works better than "improve the headline". You can make multiple changes one at a time.
      </div>
    </div>
  );
}
