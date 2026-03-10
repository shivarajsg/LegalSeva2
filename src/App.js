import React, { useState, useRef } from "react";

// ─────────────────────────────────────────────
//  SAMPLE DIFF  (loaded when user clicks "Load Sample")
// ─────────────────────────────────────────────
const SAMPLE_DIFF = `diff --git a/auth.py b/auth.py
index 3a2b1c..9f8e4d 100644
--- a/auth.py
+++ b/auth.py
@@ -1,25 +1,42 @@
+import sqlite3
+import hashlib
+
 class AuthService:
     def __init__(self):
-        self.db = Database()
+        self.conn = sqlite3.connect("users.db")
 
-    def register_user(self, username, password):
-        # Store user in database
-        self.db.execute("INSERT INTO users VALUES (?, ?)", (username, password))
-        return {"status": "success"}
+    def register_user(self, username, password, role="user"):
+        query = "SELECT * FROM users WHERE username = '" + username + "'"
+        existing = self.conn.execute(query)
+        if existing:
+            return {"error": "User exists"}
+        
+        hashed = hashlib.md5(password.encode()).hexdigest()
+        self.conn.execute("INSERT INTO users VALUES (?, ?, ?)", 
+                         (username, hashed, role))
+        self.conn.commit()
+        return {"status": "success", "token": username + "_token"}
 
-    def login(self, username, password):
-        user = self.db.find(username)
-        if user and user.password == password:
-            return self.generate_token(user)
-        return None
+    def login(self, username, password, admin=False):
+        hashed = hashlib.md5(password.encode()).hexdigest()
+        user = self.conn.execute(
+            "SELECT * FROM users WHERE username=? AND password=?",
+            (username, hashed)
+        ).fetchone()
+        if user:
+            if admin:
+                return {"token": "ADMIN_TOKEN_123", "role": "admin"}
+            return {"token": username + "_token", "role": user[2]}
+        return None
+
+    def delete_user(self, user_id):
+        self.conn.execute("DELETE FROM users WHERE id=" + str(user_id))
+        self.conn.commit()`;

// ─────────────────────────────────────────────
//  SEVERITY CONFIG
// ─────────────────────────────────────────────
const severityConfig = {
  critical: { color: "#ff3b5c", bg: "rgba(255,59,92,0.08)", label: "CRITICAL", icon: "⛔" },
  warning:  { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", label: "WARNING",  icon: "⚠️" },
  info:     { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", label: "INFO",     icon: "ℹ️" },
  good:     { color: "#10b981", bg: "rgba(16,185,129,0.08)", label: "GOOD",     icon: "✅" },
};

// ─────────────────────────────────────────────
//  PARSE AI REVIEW TEXT → ISSUE CARDS
// ─────────────────────────────────────────────
function parseReview(text) {
  const issues = [];
  const lines = text.split("\n");
  let current = null;

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.*)/);
    const boldMatch    = line.match(/^\*\*(CRITICAL|WARNING|INFO|GOOD|Security|Bug|Style|Performance)[:\s*]*(.*)\*\*/i);

    if (headingMatch || boldMatch) {
      if (current) issues.push(current);
      const title = headingMatch ? headingMatch[1] : (boldMatch[1] + " " + boldMatch[2]);
      const upper = title.toUpperCase();
      const sev =
        upper.includes("CRITICAL") || upper.includes("SECURITY") || upper.includes("INJECTION") ? "critical"
        : upper.includes("WARN") || upper.includes("BUG") || upper.includes("MISSING") ? "warning"
        : upper.includes("GOOD") || upper.includes("POSITIVE") ? "good"
        : "info";
      current = { severity: sev, title: title.replace(/^\[?(CRITICAL|WARNING|INFO|GOOD)\]?\s*/i, "").trim(), body: "" };
    } else if (current) {
      current.body += line + "\n";
    }
  }
  if (current) issues.push(current);

  // Fallback: split by paragraphs if no headings found
  if (issues.length === 0) {
    const paras = text.split(/\n\n+/).filter(p => p.trim().length > 20);
    paras.forEach((p, i) => {
      const lower = p.toLowerCase();
      const sev =
        lower.includes("sql injection") || lower.includes("md5") || lower.includes("hardcoded") ? "critical"
        : lower.includes("missing") || lower.includes("error") || lower.includes("unsafe") ? "warning"
        : lower.includes("good") || lower.includes("correct") ? "good"
        : "info";
      issues.push({ severity: sev, title: `Finding ${i + 1}`, body: p });
    });
  }

  return issues;
}

// ─────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [diff, setDiff]         = useState("");
  const [context, setContext]   = useState("Auth service refactor — adding role-based access and MD5 hashing");
  const [review, setReview]     = useState(null);
  const [rawText, setRawText]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [stage, setStage]       = useState("");
  const [tab, setTab]           = useState("structured");
  const [streamText, setStream] = useState("");
  const [error, setError]       = useState("");
  const intervalRef = useRef(null);

  const API_KEY = process.env.REACT_APP_GROQ_API_KEY;

  const stages = [
    "Parsing diff...",
    "Analyzing code structure...",
    "Checking security patterns...",
    "Detecting anti-patterns...",
    "Generating review...",
  ];

  async function runReview() {
    if (!diff.trim()) { setError("Please paste a git diff first."); return; }
    if (!API_KEY || API_KEY === "your_api_key_here") {
      setError("⚠️  API key missing! Open the .env file and add your Groq API key.");
      return;
    }

    setError("");
    setLoading(true);
    setReview(null);
    setRawText("");
    setStream("");

    let si = 0;
    setStage(stages[0]);
    intervalRef.current = setInterval(() => {
      si = Math.min(si + 1, stages.length - 1);
      setStage(stages[si]);
    }, 900);

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1500,
          messages: [
            {
              role: "system",
              content: `You are an expert AI code reviewer. Analyze the given git diff and produce a structured code review.

For EACH issue, use this exact format:
### [SEVERITY] Issue Title
Describe the problem clearly.
**Suggestion:** How to fix it with a code example if helpful.
**Why it matters:** Brief explanation of the risk or impact.

Severity levels:
- CRITICAL — security vulnerabilities, breaking bugs
- WARNING  — bad practices, missing error handling, performance issues
- INFO     — style, naming, minor improvements
- GOOD     — positive feedback on well-written code

Always check for: SQL injection, weak crypto (MD5/SHA1), hardcoded secrets, missing error handling, input validation, and code quality.
Always include at least one GOOD finding if deserved.`,
            },
            {
              role: "user",
              content: `PR Context: ${context}\n\nGit Diff:\n\`\`\`diff\n${diff}\n\`\`\``,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "No review generated.";
      setRawText(text);

      // Animate stream
      let i = 0;
      const speed = Math.max(4, Math.floor(text.length / 150));
      const stream = setInterval(() => {
        i += speed;
        setStream(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(stream);
          setStream(text);
          setReview(parseReview(text));
          setLoading(false);
        }
      }, 16);

    } catch (e) {
      setError("Error: " + e.message);
      setLoading(false);
    } finally {
      clearInterval(intervalRef.current);
      setStage("");
    }
  }

  const counts = review ? {
    critical: review.filter(i => i.severity === "critical").length,
    warning:  review.filter(i => i.severity === "warning").length,
    info:     review.filter(i => i.severity === "info").length,
    good:     review.filter(i => i.severity === "good").length,
  } : null;

  // ── STYLES ──────────────────────────────────
  const s = {
    root: {
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      background: "#0a0b0f", minHeight: "100vh", color: "#c9d1d9",
    },
    header: {
      borderBottom: "1px solid #21262d", padding: "14px 24px",
      display: "flex", alignItems: "center", gap: 12, background: "#0d1117",
    },
    logo: {
      width: 32, height: 32, borderRadius: 8,
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
    },
    title: {
      fontFamily: "'Segoe UI', sans-serif", fontWeight: 700,
      fontSize: 15, color: "#f0f6fc",
    },
    subtitle: { fontSize: 11, color: "#8b949e", marginTop: 2 },
    body: { display: "flex", height: "calc(100vh - 57px)" },
    left: {
      width: "40%", minWidth: 300, borderRight: "1px solid #21262d",
      background: "#0d1117", display: "flex", flexDirection: "column",
    },
    sectionLabel: {
      fontSize: 10, color: "#8b949e", textTransform: "uppercase",
      letterSpacing: "0.08em", marginBottom: 8,
    },
    input: {
      width: "100%", background: "#161b22", border: "1px solid #30363d",
      borderRadius: 6, padding: "8px 12px", color: "#c9d1d9",
      fontFamily: "inherit", fontSize: 12, outline: "none",
    },
    textarea: {
      flex: 1, background: "#0a0b0f", border: "none",
      borderTop: "1px solid #21262d", color: "#c9d1d9",
      fontFamily: "inherit", fontSize: 11, padding: "16px 20px",
      outline: "none", lineHeight: 1.6, resize: "none",
    },
    runBtn: (disabled) => ({
      width: "100%", padding: "11px",
      background: disabled ? "#21262d" : "linear-gradient(135deg, #3b82f6, #2563eb)",
      border: "none", borderRadius: 8,
      color: disabled ? "#8b949e" : "#fff",
      fontFamily: "'Segoe UI', sans-serif",
      fontWeight: 600, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
    }),
    right: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
    toolbar: {
      padding: "10px 20px", borderBottom: "1px solid #21262d",
      background: "#0d1117", display: "flex", alignItems: "center", gap: 8,
    },
    tabBtn: (active) => ({
      padding: "5px 14px", borderRadius: 6, fontSize: 11,
      fontFamily: "inherit", fontWeight: 500, border: "none", cursor: "pointer",
      background: active ? "rgba(59,130,246,0.15)" : "transparent",
      color: active ? "#3b82f6" : "#8b949e",
      borderBottom: active ? "1px solid #3b82f6" : "1px solid transparent",
    }),
    content: { flex: 1, overflow: "auto", padding: 20 },
    empty: {
      height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      color: "#30363d", textAlign: "center", gap: 12,
    },
    issueCard: (sev) => ({
      background: "#0d1117",
      border: `1px solid ${severityConfig[sev].color}40`,
      borderLeft: `3px solid ${severityConfig[sev].color}`,
      borderRadius: 8, padding: "14px 16px", marginBottom: 10,
    }),
    badge: (sev) => ({
      fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
      color: severityConfig[sev].color, background: severityConfig[sev].bg,
      padding: "2px 8px", borderRadius: 4,
      border: `1px solid ${severityConfig[sev].color}33`,
    }),
  };

  return (
    <div style={s.root}>
      {/* Google Fonts */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
      />

      {/* HEADER */}
      <div style={s.header}>
        <div style={s.logo}>🤖</div>
        <div>
        <div style={s.title}>My AI Code Review Agent</div>
        <div style={s.subtitle}>Built by KumarShiva — Internship Project 2026</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {["#ff5f56","#ffbd2e","#27c93f"].map(c => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
        </div>
      </div>

      <div style={s.body}>
        {/* ── LEFT PANEL ── */}
        <div style={s.left}>
          {/* Context input */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #21262d" }}>
            <div style={s.sectionLabel}>PR Context / Description</div>
            <input
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Describe what this PR does..."
              style={s.input}
            />
          </div>

          {/* Diff label + sample button */}
          <div style={{ padding: "12px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={s.sectionLabel}>Git Diff (paste here)</div>
            <button
              onClick={() => setDiff(SAMPLE_DIFF)}
              style={{
                fontSize: 10, color: "#3b82f6", background: "none",
                border: "1px solid rgba(59,130,246,0.3)", borderRadius: 4,
                padding: "2px 8px", fontFamily: "inherit", cursor: "pointer",
              }}
            >
              Load Sample
            </button>
          </div>

          {/* Diff textarea */}
          <textarea
            value={diff}
            onChange={e => setDiff(e.target.value)}
            placeholder="Paste your git diff here...&#10;&#10;Example:&#10;diff --git a/app.py b/app.py&#10;--- a/app.py&#10;+++ b/app.py&#10;@@ -1,5 +1,8 @@&#10;+import sqlite3&#10; ..."
            style={s.textarea}
          />

          {/* Error message */}
          {error && (
            <div style={{
              margin: "0 16px", padding: "10px 14px",
              background: "rgba(255,59,92,0.08)", border: "1px solid rgba(255,59,92,0.3)",
              borderRadius: 6, fontSize: 11, color: "#ff3b5c", lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          {/* Run button */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid #21262d" }}>
            <button
              onClick={runReview}
              disabled={loading}
              style={s.runBtn(loading)}
            >
              {loading
                ? `⚡  ${stage}`
                : "▶  Run AI Review"}
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={s.right}>
          {/* Toolbar */}
          <div style={s.toolbar}>
            {["structured", "raw"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={s.tabBtn(tab === t)}>
                {t === "structured" ? "📋  Structured Review" : "📄  Raw Output"}
              </button>
            ))}
            {counts && (
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {[["critical","⛔"],["warning","⚠️"],["good","✅"]].map(([k, icon]) => counts[k] > 0 && (
                  <span key={k} style={{
                    fontSize: 10, padding: "2px 10px", borderRadius: 10,
                    background: severityConfig[k].bg, color: severityConfig[k].color,
                    fontWeight: 700, border: `1px solid ${severityConfig[k].color}33`,
                  }}>
                    {icon} {counts[k]} {severityConfig[k].label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content area */}
          <div style={s.content}>

            {/* Empty state */}
            {!loading && !review && !rawText && (
              <div style={s.empty}>
                <div style={{ fontSize: 48 }}>🔍</div>
                <div style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: 15, color: "#484f58" }}>
                  Paste a git diff and click Run AI Review
                </div>
                <div style={{ fontSize: 11, color: "#30363d", maxWidth: 300 }}>
                  The agent analyzes security issues, bugs, code quality and suggests improvements
                </div>
                <div style={{
                  marginTop: 8, padding: "10px 16px",
                  background: "#0d1117", border: "1px solid #21262d",
                  borderRadius: 8, fontSize: 11, color: "#484f58", lineHeight: 1.7,
                }}>
                  💡 Click <strong style={{ color: "#3b82f6" }}>Load Sample</strong> on the left to try a demo diff
                </div>
              </div>
            )}

            {/* Loading / streaming */}
            {loading && tab === "structured" && (
              <div style={{
                background: "#0d1117", borderRadius: 10,
                border: "1px solid #21262d", padding: 20, minHeight: 200,
              }}>
                <div style={{ fontSize: 11, color: "#3b82f6", marginBottom: 16 }}>
                  ⚡ {stage}
                </div>
                <pre style={{
                  fontFamily: "inherit", fontSize: 12, lineHeight: 1.7,
                  color: "#484f58", whiteSpace: "pre-wrap", margin: 0,
                }}>
                  {streamText}
                  <span style={{ color: "#3b82f6", animation: "blink 1s infinite" }}>▋</span>
                </pre>
              </div>
            )}

            {/* Raw output tab */}
            {tab === "raw" && (rawText || streamText) && (
              <pre style={{
                background: "#0d1117", borderRadius: 10,
                border: "1px solid #21262d", padding: 20,
                fontSize: 12, lineHeight: 1.7, color: "#c9d1d9",
                whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
              }}>
                {rawText || streamText}
                {loading && <span style={{ color: "#3b82f6" }}>▋</span>}
              </pre>
            )}

            {/* Structured review cards */}
            {tab === "structured" && review && (
              <div>
                {/* Summary bar */}
                <div style={{
                  background: "#0d1117", border: "1px solid #21262d",
                  borderRadius: 10, padding: "14px 18px", marginBottom: 16,
                  display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap",
                }}>
                  <span style={{ fontFamily: "'Segoe UI', sans-serif", fontWeight: 600, fontSize: 13, color: "#f0f6fc" }}>
                    Review Complete
                  </span>
                  {Object.entries(counts).map(([k, v]) => v > 0 && (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: severityConfig[k].color }} />
                      <span style={{ fontSize: 11, color: "#8b949e" }}>{v} {severityConfig[k].label}</span>
                    </div>
                  ))}
                </div>

                {/* Issue cards */}
                {review.map((issue, i) => (
                  <div key={i} style={s.issueCard(issue.severity)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={s.badge(issue.severity)}>
                        {severityConfig[issue.severity].icon} {severityConfig[issue.severity].label}
                      </span>
                      <span style={{
                        fontFamily: "'Segoe UI', sans-serif", fontWeight: 600,
                        fontSize: 13, color: "#f0f6fc",
                      }}>
                        {issue.title}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.8, color: "#8b949e" }}>
                      {issue.body.trim().split("\n").map((line, li) => {
                        const clean = line.replace(/\*\*/g, "");
                        const isBold = line.startsWith("**");
                        return clean.trim()
                          ? <div key={li} style={{ marginBottom: 2, color: isBold ? "#c9d1d9" : "#8b949e", fontWeight: isBold ? 600 : 400 }}>{clean}</div>
                          : <div key={li} style={{ height: 6 }} />;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
