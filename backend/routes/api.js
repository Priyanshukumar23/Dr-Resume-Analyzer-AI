const express = require('express');
const multer = require('multer');
const { analyzeAndFixResume } = require('../services/ai.service');
const { extractTextFromPdf, extractTextFromDocx, createPdfFromText } = require('../services/pdf.service');
const Analysis = require('../models/Analysis');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Allow pdf and docx for both JD and Resume
const upload = multer({ 
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            file.mimetype === 'application/msword') {
            cb(null, true);
        } else {
            cb(new Error("Only PDF and DOCX files are allowed!"));
        }
    }
});

router.post('/analyze', upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'jdFile', maxCount: 1 }]), async (req, res) => {
    try {
        const { jd, toolName } = req.body;
        const resumeFile = req.files['resume'] ? req.files['resume'][0] : null;
        const jdFile = req.files['jdFile'] ? req.files['jdFile'][0] : null;

        if (!resumeFile) {
            return res.status(400).json({ error: 'Missing Resume file.' });
        }
        if (!jd && !jdFile) {
            return res.status(400).json({ error: 'Missing Job Description (Text or File).' });
        }

        // Process JD
        let jobDescriptionText = jd || '';
        if (jdFile) {
            const jdBuffer = fs.readFileSync(jdFile.path);
            if (jdFile.mimetype === 'application/pdf') {
                jobDescriptionText = await extractTextFromPdf(jdBuffer);
            } else {
                jobDescriptionText = await extractTextFromDocx(jdBuffer);
            }
        }

        // Process Resume
        const resumeBuffer = fs.readFileSync(resumeFile.path);
        let resumeText = '';
        if (resumeFile.mimetype === 'application/pdf') {
            resumeText = await extractTextFromPdf(resumeBuffer);
        } else {
            resumeText = await extractTextFromDocx(resumeBuffer);
        }

        const aiResult = await analyzeAndFixResume(jobDescriptionText, resumeText, toolName || 'Standard Optimizer');

        const outPath = path.join(__dirname, '..', `updated_resume_${Date.now()}.pdf`);
        await createPdfFromText(aiResult.updated_resume, outPath);

        // Save analysis to history database
        const newAnalysis = new Analysis({
            score: aiResult.score,
            missing_skills: aiResult.missing_skills,
            suggestions: aiResult.suggestions,
            recommended_keywords: aiResult.recommended_keywords,
            toolUsed: toolName || 'Standard Optimizer'
        });
        await newAnalysis.save();

        // Clean up uploaded files
        if (resumeFile && fs.existsSync(resumeFile.path)) fs.unlinkSync(resumeFile.path);
        if (jdFile && fs.existsSync(jdFile.path)) fs.unlinkSync(jdFile.path);

        const fileId = path.basename(outPath);
        
        res.json({
            score: aiResult.score,
            missing_skills: aiResult.missing_skills,
            suggestions: aiResult.suggestions,
            recommended_keywords: aiResult.recommended_keywords,
            downloadUrl: `/api/download/${fileId}`
        });

    } catch (error) {
        console.error(error);
        if (req.files) {
            if (req.files['resume'] && fs.existsSync(req.files['resume'][0].path)) fs.unlinkSync(req.files['resume'][0].path);
            if (req.files['jdFile'] && fs.existsSync(req.files['jdFile'][0].path)) fs.unlinkSync(req.files['jdFile'][0].path);
        }
        res.status(500).json({ error: 'Failed to process files: ' + error.message });
    }
});

router.get('/download/:fileId', (req, res) => {
    const filePath = path.join(__dirname, '..', req.params.fileId);
    if (fs.existsSync(filePath)) {
        res.download(filePath, 'Tailored_Resume.pdf', () => {
             // Clean up file after successful download or timeout
             setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 60000); 
        });
    } else {
        res.status(404).send('File not found or expired.');
    }
});

// Get user history
router.get('/history', async (req, res) => {
    try {
        const history = await Analysis.find().sort({ createdAt: -1 }).limit(10);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

module.exports = router;
