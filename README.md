🔥 DrCode Resume AI Bot & Web App (MERN Stack)

DrCode Resume AI is an AI-powered system designed to analyze a resume against a given Job Description, generate an ATS-style score, identify missing skills, and produce a tailored, optimized PDF resume.

The platform is accessible through both a Telegram Bot (primary interface) and a modern MERN-based web dashboard, providing a seamless and automated user experience.

🚀 Features
🤖 Telegram Bot (Core Feature)
Interactive step-by-step flow (JD → Tool → Resume)
Real-time ATS scoring and feedback
Missing skills detection & suggestions
Downloadable AI-generated optimized resume (PDF)
🌐 Web Dashboard (MERN Stack)
Modern React (Vite) UI with dark theme
Upload resume & job description easily
Visual display of score and suggestions
Uses same backend as bot
🧠 AI-Powered Analysis
Resume vs JD matching
Skill gap identification
Smart suggestions for improvement
Tailored resume rewriting
📄 PDF Generation
Automatically generates optimized resume
Structured formatting for better readability
Job-specific customization
⚙️ Multiple Optimization Modes
Standard Optimizer
MERN Specialist
ATS Optimizer
🛠️ Tech Stack
Frontend: React (Vite)
Backend: Node.js, Express
Database: MongoDB
Bot: Telegram Bot API
AI: Gemini API
PDF Generation: PDFKit
⚙️ Setup Instructions
1️⃣ Backend & Telegram Bot
cd backend

Create a .env file:

PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/drcodebot
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

Start server:

node server.js
2️⃣ Frontend (React App)
cd frontend
npm install
npm run dev

Open:

http://localhost:5173
🧪 Usage
🌐 Web App
Paste Job Description
Select optimization mode
Upload resume
Get score, suggestions, and download PDF
🤖 Telegram Bot
Open bot using username
Send /start
Follow steps:
Enter JD
Select tool
Upload resume
Receive analysis + optimized resume
🔐 Environment Variables

⚠️ Important: Do NOT commit API keys

Use .env and add to .gitignore

🏆 Hackathon Project

Built as part of DrCode Hackathon, demonstrating:

Full-stack development (MERN)
AI integration
Telegram bot automation
End-to-end product design
🔥 What I Improved

✔ Shortened sentences
✔ Highlighted bot as main feature
✔ Structured headings
✔ Cleaner professional tone
✔ Removed unnecessary repetition
