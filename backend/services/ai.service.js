const { GoogleGenAI } = require('@google/genai');

const geminiApiKey = process.env.GEMINI_API_KEY;

async function analyzeAndFixResume(jd, resumeText, toolOption) {
    if (!geminiApiKey || geminiApiKey === 'YOUR_GEMINI_API_KEY') {
        throw new Error('Gemini API key is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    let personaPrompt = '';
    if (toolOption === 'Standard Optimizer') {
        personaPrompt = 'You are a professional resume reviewer.';
    } else if (toolOption === 'MERN Specialist') {
        personaPrompt = 'You are an expert MERN stack recruiter and resume writer. Emphasize React, Node, Express, MongoDB skills where appropriate without outright lying.';
    } else if (toolOption === 'ATS Optimizer') {
        personaPrompt = 'You are an ATS (Applicant Tracking System) optimizer. Ensure the resume heavily uses keywords from the JD.';
    } else {
        personaPrompt = `You are an expert ${toolOption} recruiter and resume writer. Prioritize emphasizing skills, formatting, and industry-standard keywords that appeal specifically to a ${toolOption} hiring manager.`;
    }

    const prompt = `
    ${personaPrompt}

    I will provide a Job Description and a Resume. 
    Analyze the resume against the job description and extract the following:
    1. A rigorous score out of 10 based on relevance and keyword matching (ATS-style).
    2. Missing skills (skills in the JD not present in the original resume).
    3. Suggestions for improvements.
    4. Recommended keywords to include to increase the score.
    5. An aggressively optimized, highly ATS-friendly rewritten version of the original resume. You MUST dynamically weave the missing skills, relevant tools, and key phrases directly from the JD into the candidate's existing projects and experience bullets. The goal is that your 'updated_resume' output MUST theoretically score a 9/10 or 10/10 if run through this system again. Stretch the truth creatively where necessary to maximize the keyword matching while preserving the core job titles. Format it concisely to easily fit on one page.

    Respond STRICTLY in JSON format with exactly this structure recursively mapping all data from their old resume into the "updated_resume" object:
    {
      "score": <number>,
      "missing_skills": ["skill 1", "skill 2"],
      "suggestions": ["suggestion 1", "suggestion 2"],
      "recommended_keywords": ["keyword 1", "keyword 2"],
      "updated_resume": {
        "name": "Candidate Full Name",
        "contact": ["Email: x", "Phone: y", "LinkedIn: z", "GitHub: w"],
        "sections": [
          {
            "title": "SKILLS",
            "items": [
              { "name": "Languages:", "description": "C++, JS", "bullets": [], "date": "" }
            ]
          },
          {
            "title": "PROJECTS",
            "items": [
              { 
                "name": "Project Name | Details", 
                "date": "Dec 2025 - Jan 2026", 
                "description": "",
                "bullets": ["Did this", "Did that"] 
              }
            ]
          },
          {
            "title": "EDUCATION",
            "items": [
              { 
                "name": "University Name", 
                "date": "Aug 2023 - Present",
                "description": "",
                "bullets": ["Degree name", "GPA: 3.8"] 
              }
            ]
          }
        ]
      }
    }

    Keep bullet points concise to save space. Map their original sections (Experience, Certificates, Achievements, etc.) into the "sections" array.

    Job Description:
    ${jd}

    Resume:
    ${resumeText}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                 responseMimeType: 'application/json'
            }
        });
        
        const result = response.text;
        return JSON.parse(result);
    } catch (error) {
        console.error('Error generating AI content:', error);
        throw error;
    }
}

module.exports = { analyzeAndFixResume };
