const TelegramBot = require('node-telegram-bot-api');
const UserSession = require('../models/UserSession');
const Analysis = require('../models/Analysis');
const { analyzeAndFixResume } = require('../services/ai.service');
const { extractTextFromPdf, extractTextFromDocx, createPdfFromText } = require('../services/pdf.service');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

if (token && token !== 'YOUR_TELEGRAM_BOT_TOKEN') {
    bot = new TelegramBot(token, { polling: true });
    
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        await resetSession(chatId);

        bot.sendMessage(chatId, "Welcome to the AI-Powered Resume Analyzer Assistant! 🚀\n\nI can analyze your resume against a Job Description, give it an ATS match score out of 10, provide detailed suggestions, and even rewrite it for better keyword optimization.\n\nTo begin, please send me the **Job Description** (paste the text or upload a PDF/DOCX file).", { parse_mode: 'Markdown' });
    });

    async function resetSession(chatId) {
        return UserSession.findOneAndUpdate(
            { chatId },
            { state: 'WAITING_JD', jobDescription: '', resumeText: '', selectedTool: '' },
            { upsert: true, new: true }
        );
    }

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        if (!msg.text && !msg.document) return;
        if (msg.text && msg.text.startsWith('/')) return; // ignore commands

        const session = await UserSession.findOne({ chatId });
        if (!session) return bot.sendMessage(chatId, "Please type /start to begin.");

        if (session.state === 'WAITING_JD') {
            if (!msg.text && !msg.document) {
                return bot.sendMessage(chatId, "Please send the Job Description as text or upload a PDF/DOCX file.");
            }

            if (msg.document) {
                const isPdf = msg.document.mime_type === 'application/pdf' || msg.document.file_name.endsWith('.pdf');
                const isDocx = msg.document.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || msg.document.file_name.endsWith('.docx');

                if (!isPdf && !isDocx) {
                    return bot.sendMessage(chatId, "Only PDF and DOCX files are supported. Please upload a valid document or paste text.");
                }
                
                bot.sendMessage(chatId, "Parsing Job Description file...");
                try {
                    const fileId = msg.document.file_id;
                    const fileLink = await bot.getFileLink(fileId);
                    const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
                    const docBuffer = Buffer.from(response.data);
                    
                    if (isPdf) {
                        session.jobDescription = await extractTextFromPdf(docBuffer);
                    } else {
                        session.jobDescription = await extractTextFromDocx(docBuffer);
                    }
                } catch (e) {
                    return bot.sendMessage(chatId, "Error reading JD file. Please try pasting the text instead.");
                }
            } else {
                session.jobDescription = msg.text;
            }

            session.state = 'WAITING_RESUME';
            await session.save();

            bot.sendMessage(chatId, "Great! I have the JD.\n\nNow, please select your AI Resume Assistant Persona:", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Standard Optimizer', callback_data: 'tool_standard' }],
                        [{ text: 'MERN Specialist', callback_data: 'tool_mern' }],
                        [{ text: 'ATS Optimizer', callback_data: 'tool_ats' }],
                        [{ text: 'Custom Persona 🔍', callback_data: 'tool_custom' }]
                    ]
                }
            });
        }
        else if (session.state === 'WAITING_PERSONA') {
            if (!msg.text) {
                return bot.sendMessage(chatId, "Please type a short phrase for your Custom Persona (e.g. 'Project Manager').");
            }
            session.selectedTool = msg.text.trim();
            session.state = 'WAITING_RESUME';
            await session.save();
            bot.sendMessage(chatId, `Assigned persona: **${session.selectedTool}**.\n\nPlease upload your Resume as a **PDF** or **DOCX** document.`, { parse_mode: 'Markdown' });
        }
        else if (session.state === 'WAITING_RESUME') {
            if (!msg.document) {
               if(msg.text) {
                  return bot.sendMessage(chatId, "You need to upload your Resume as a **PDF** or **DOCX** document.", { parse_mode: 'Markdown' });
               }
               return;
            }

            const isPdf = msg.document.mime_type === 'application/pdf' || msg.document.file_name.endsWith('.pdf');
            const isDocx = msg.document.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || msg.document.file_name.endsWith('.docx');

            if (!isPdf && !isDocx) {
                return bot.sendMessage(chatId, "Only PDF and DOCX files are supported. Please upload a valid document.");
            }

            bot.sendMessage(chatId, "Received your resume. Initializing analysis...");

            try {
                // Download File
                const fileId = msg.document.file_id;
                const fileLink = await bot.getFileLink(fileId);
                const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
                const docBuffer = Buffer.from(response.data);

                // Extract Text
                bot.sendMessage(chatId, "Parsing document and extracting text...");
                let resumeText = '';
                if (isPdf) {
                    resumeText = await extractTextFromPdf(docBuffer);
                } else {
                    resumeText = await extractTextFromDocx(docBuffer);
                }

                session.resumeText = resumeText;
                await session.save();

                bot.sendMessage(chatId, "Generating AI analysis via Gemini API... This might take up to 20 seconds.");

                // Call AI
                const aiResult = await analyzeAndFixResume(session.jobDescription, resumeText, session.selectedTool || 'Standard Optimizer');

                // Generate new PDF
                const outPath = path.join(__dirname, '..', '..', 'uploads', `updated_${chatId}_${Date.now()}.pdf`);
                // Ensure directory exists
                if (!fs.existsSync(path.dirname(outPath))) {
                    fs.mkdirSync(path.dirname(outPath), { recursive: true });
                }
                await createPdfFromText(aiResult.updated_resume, outPath);

                // Save Analysis
                const newAnalysis = new Analysis({
                    chatId: chatId.toString(),
                    score: aiResult.score,
                    missing_skills: aiResult.missing_skills,
                    suggestions: aiResult.suggestions,
                    recommended_keywords: aiResult.recommended_keywords,
                    toolUsed: session.selectedTool || 'Standard Optimizer'
                });
                await newAnalysis.save();

                // Send Score & Feedback
                const feedbackScoreText = `*Resume Analysis Complete! 🎯*\n\n` +
                `*ATS Score:* ${aiResult.score}/10\n\n` +
                `*Missing Skills:* \n${aiResult.missing_skills.join(", ") || 'None identified'}\n\n` +
                `*Recommended Keywords:* \n${aiResult.recommended_keywords.join(", ") || 'None identified'}\n\n` +
                `*Suggestions:* \n- ${aiResult.suggestions.join("\n- ")}`;

                await bot.sendMessage(chatId, feedbackScoreText, { 
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📥 Download Improved Resume', callback_data: `dl_resume:${path.basename(outPath)}` }],
                            [{ text: '🔄 Analyze Again', callback_data: `restart` }]
                        ]
                    }
                });

                // Reset session state
                session.state = 'IDLE'; 
                await session.save();

            } catch (error) {
                console.error(error);
                bot.sendMessage(chatId, "An error occurred while processing your request: " + error.message);
                await resetSession(chatId);
            }
        }
    });

    bot.on('callback_query', async (callbackQuery) => {
        const action = callbackQuery.data;
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;

        if (action.startsWith('tool_')) {
            const session = await UserSession.findOne({ chatId });
            if (!session) return;

            if (action === 'tool_custom') {
                session.state = 'WAITING_PERSONA';
                await session.save();
                bot.answerCallbackQuery(callbackQuery.id, { text: `Custom Selected` });
                return bot.sendMessage(chatId, `You chose **Custom Persona**.\n\nPlease type the specific Persona you want to optimize for (e.g. *Data Scientist, UX Designer, IT Director*):`, { parse_mode: 'Markdown' });
            }

            let toolName = 'Standard Optimizer';
            if (action === 'tool_mern') toolName = 'MERN Specialist';
            if (action === 'tool_ats') toolName = 'ATS Optimizer';

            session.selectedTool = toolName;
            session.state = 'WAITING_RESUME';
            await session.save();

            bot.answerCallbackQuery(callbackQuery.id, { text: `Selected Tool: ${toolName}` });
            bot.sendMessage(chatId, `Assigned persona: **${toolName}**.\n\nPlease upload your Resume as a **PDF** or **DOCX** file now.`, { parse_mode: 'Markdown' });
        } 
        else if (action.startsWith('dl_resume:')) {
            bot.answerCallbackQuery(callbackQuery.id, { text: `Generating PDF download...` });
            
            const filename = action.split(':')[1];
            const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
            
            if (fs.existsSync(filePath)) {
                await bot.sendDocument(chatId, filePath, {
                    caption: "Here is your dynamically improved, ATS-optimized Resume PDF! 📄"
                });
                // Optional: remove file after sending to save space
                try { fs.unlinkSync(filePath); } catch (e) {}
            } else {
                bot.sendMessage(chatId, "Sorry, this generated resume has expired from the server. Please Analyze Again.");
            }
        }
        else if (action === 'restart') {
            await resetSession(chatId);
            bot.answerCallbackQuery(callbackQuery.id, { text: "Restarting flow..." });
            bot.sendMessage(chatId, "Let's start over! Please send me your **Job Description** (paste text or upload PDF/DOCX).", { parse_mode: 'Markdown' });
        }
    });
}

module.exports = bot;
