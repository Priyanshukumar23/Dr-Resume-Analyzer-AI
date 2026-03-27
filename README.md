# DrCode Resume AI Bot & Web App (MERN Stack)

DrCode Resume AI is a comprehensive tool built to analyze a given Resume against a Job Description, score the match out of 10, provide targeted advice, and generate a new, tailored PDF Resume. It fulfills the multi-tool selection requirement, allows Bot integration (Telegram), and offers a premium MERN stack web dashboard.

## Features
1. **Telegram Bot Integration**: A bot that interacts with the user sequentially (asks for JD, then Resume, then Tool, and replies with scoring and PDF).
2. **Web Dashboard (MERN Stack)**: A visually stunning, glassmorphism-themed dark mode React frontend where users can use the service effortlessly.
3. **Downloadable Tailored PDF**: Uses Gemini AI to re-write and highlight the best skills matched with the JD, outputting a polished PDF file.
4. **Multiple Personas/Tools**: Option to select tools like "Standard Optimizer", "MERN Specialist" or "ATS Optimizer".

## Prerequisites
- **Node.js**: Ensure Node.js is installed.
- **MongoDB**: The app requires MongoDB. Start a local MongoDB instance on port `27017` (default) or change the `.env` value.
- **Telegram Bot Token**: Get one via BotFather on Telegram.
- **Google Gemini API Key**: Grab an API key from Google AI Studio.

## Setup Instructions

### 1. Setting up Backend & Bot
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. The `.env` file is ready. You must edit `backend/.env` to include your API Keys:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/drcodebot
   TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```
3. Start the backend Server (which also starts the Bot):
   ```bash
   node server.js
   ```

### 2. Setting up the React Frontend
Our frontend is a modern Vite+React app styled with pure CSS.
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the Local URL (usually `http://localhost:5173`) in your browser to see the beautiful web UI.

### Usage instructions
**Via Web UI:**
- Paste your Job Description.
- Select your Optimization Tool (e.g. MERN Specialist).
- Upload your Resume as a standard PDF file.
- Click "Optimize" to view your score out of 10, targeted advice, and a download link for your new resume.

**Via Telegram Bot:**
- Add the bot using your Telegram Bot username.
- Send `/start`.
- Follow the interactive prompts (JD -> Tool -> PDF upload).
- Receive the AI feedback directly as messages and the tailored Resume as a `.pdf` document!
