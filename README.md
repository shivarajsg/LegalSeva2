# 🤖 AI Pull Request Review Agent
### Assignment 2 — AI-Powered Development Workflow

---

## ▶️ How to Run (Step by Step)

### Step 1 — Install Node.js
Download from: https://nodejs.org  
Choose the **LTS** version. Install it normally.

To verify it installed, open terminal and run:
```
node -v
npm -v
```

---

### Step 2 — Open this folder in VSCode
1. Open VSCode
2. File → Open Folder → select the `pr-review-agent` folder

---

### Step 3 — Install dependencies
Open the terminal in VSCode (View → Terminal) and run:
```
npm install
```
Wait for it to finish (downloads React).

---

### Step 4 — Add your API Key
1. Open the `.env` file in VSCode
2. Replace `your_api_key_here` with your real key:
```
REACT_APP_ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxx
```
3. Get a free key at: https://console.anthropic.com

---

### Step 5 — Start the app
```
npm start
```
The app opens automatically at: **http://localhost:3000**

---

## 🎮 How to Use

1. The app opens in your browser
2. Click **"Load Sample"** to load a buggy `auth.py` diff
3. Click **"▶ Run AI Review"**
4. Watch Claude detect security issues, bugs, and suggest fixes!

---

## 🔍 What the AI Detects (in the sample diff)

| Issue | Severity |
|-------|----------|
| SQL Injection via string concatenation | 🔴 CRITICAL |
| MD5 used for password hashing (weak) | 🔴 CRITICAL |
| Hardcoded admin token "ADMIN_TOKEN_123" | 🔴 CRITICAL |
| Second SQL injection in delete_user() | 🔴 CRITICAL |
| Missing error handling | ⚠️ WARNING |
| Predictable token generation | ⚠️ WARNING |

---

## 🏗️ Project Architecture

```
Developer pastes git diff
        ↓
AI Agent (Claude API)
        ↓
Analyzes: Security + Bugs + Code Quality
        ↓
Outputs structured review with severity levels
```

## 📁 File Structure

```
pr-review-agent/
├── public/
│   └── index.html        ← HTML template
├── src/
│   ├── index.js          ← React entry point
│   └── App.js            ← Main agent UI + API logic
├── .env                  ← 🔑 Add your API key here
├── package.json          ← Dependencies
└── README.md             ← This file
```

---

## 🛠️ Tech Stack

- **React 18** — UI framework
- **Anthropic Claude API** — AI code analysis
- **CSS-in-JS** — Styling (no extra libraries needed)
