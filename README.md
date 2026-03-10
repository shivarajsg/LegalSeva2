# 🤖 AI Pull Request Review Agent

### AI Agent for Automated Code Review in Development Workflows

An **AI-powered development assistant** that analyzes pull request diffs and automatically detects **security vulnerabilities, bugs, and code quality issues**.

This project demonstrates how **AI agents can assist developers in real development workflows**, such as reviewing code changes before merging them into production.

---

# 🚀 Features

✔ Automated **Pull Request diff analysis**
✔ Detects **security vulnerabilities**
✔ Identifies **logic bugs and anti-patterns**
✔ Provides **AI-generated code improvement suggestions**
✔ Highlights **issue severity levels (Critical / Warning / Info)**
✔ Simple interactive **web interface**

---

# 🧠 Example Issues Detected

The sample pull request included in the project demonstrates how the AI detects multiple problems.

| Issue                                  | Severity    |
| -------------------------------------- | ----------- |
| SQL Injection via string concatenation | 🔴 Critical |
| MD5 password hashing (insecure)        | 🔴 Critical |
| Hardcoded admin token                  | 🔴 Critical |
| Unsafe SQL query in delete_user()      | 🔴 Critical |
| Predictable token generation           | ⚠ Warning   |
| Missing error handling                 | ⚠ Warning   |

---

# 🏗 System Architecture

```
Pull Request Diff
        ↓
AI Review Agent
        ↓
Security + Bug Analysis
        ↓
Structured Review Output
        ↓
Developer Fixes Issues
```

The AI agent processes **code changes instead of full files**, which mimics how real pull request review systems work.

---

# 📁 Project Structure

```
pr-review-agent
│
├── public
│   └── index.html
│
├── src
│   ├── App.js
│   └── index.js
│
├── .env
├── package.json
├── package-lock.json
└── README.md
```

---

# ⚙️ Tech Stack

| Technology           | Purpose           |
| -------------------- | ----------------- |
| React                | User Interface    |
| Anthropic Claude API | AI code analysis  |
| Node.js              | Runtime           |
| JavaScript           | Application logic |

---

# 🖥 Installation Guide

### 1️⃣ Install Node.js

Download the LTS version:

https://nodejs.org

Verify installation:

```
node -v
npm -v
```

---

### 2️⃣ Clone the Repository

```
git clone https://github.com/shivarajsg/LegalSeva2.git
cd pr-review-agent
```

---

### 3️⃣ Install Dependencies

```
npm install
```

---

### 4️⃣ Configure Environment Variables

Create a `.env` file and add your Anthropic API key:

```
REACT_APP_ANTHROPIC_API_KEY=your_api_key_here
```

You can generate an API key here:

https://console.anthropic.com

---

### 5️⃣ Run the Application

```
npm start
```

Open the app in your browser:

```
http://localhost:3000
```

---

# 🎮 Usage

1. Launch the application
2. Click **Load Sample Diff**
3. Click **Run AI Review**
4. The AI analyzes the code and returns detected issues with explanations

---

# 📊 Example Workflow

```
Developer creates pull request
        ↓
AI Review Agent analyzes diff
        ↓
Security vulnerabilities detected
        ↓
Developer fixes issues before merge
```

This demonstrates how AI can **augment developer productivity and improve software quality**.

---

# 🎯 Use Cases

AI-powered code review systems can assist with:

• Automated pull request review
• Security vulnerability detection
• Bug detection during development
• Code quality improvement
• Developer productivity tools

---

# 📌 Assignment Context

This project was built as part of an **AI Agent internship assignment** to demonstrate how AI agents can assist in **software development workflows**, particularly **code review automation**.

---

# 👨‍💻 Author

Shivaraj
Information Science Engineering
Dayananda Sagar College of Engineering
