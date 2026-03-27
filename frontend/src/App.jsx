import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Briefcase, Zap, Download, RefreshCw, AlertCircle, CheckCircle, Search } from 'lucide-react';
import './App.css';

const tools = [
  { id: 'standard', name: 'Standard Optimizer', icon: <RefreshCw size={18} /> },
  { id: 'mern', name: 'MERN Specialist', icon: <Briefcase size={18} /> },
  { id: 'ats', name: 'ATS Optimizer', icon: <Zap size={18} /> },
  { id: 'custom', name: 'Custom Persona', icon: <Search size={18} /> }
];

function App() {
  const [jd, setJd] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [file, setFile] = useState(null);
  const [selectedTool, setSelectedTool] = useState('standard');
  const [customPersona, setCustomPersona] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.pdf') && !selectedFile.name.endsWith('.docx')) {
        setError('Please upload a valid PDF or DOCX file.');
        setFile(null);
        return;
      }
      setError('');
      setFile(selectedFile);
    }
  };

  const handleJdFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.pdf') && !selectedFile.name.endsWith('.docx')) {
        setError('Please upload a valid PDF or DOCX file for JD.');
        setJdFile(null);
        return;
      }
      setError('');
      setJdFile(selectedFile);
      setJd(''); // Clear text if file is chosen
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!jd.trim() && !jdFile) || !file) {
      setError('Both Job Description (Text or File) and Resume PDF/DOCX are required.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    if (jdFile) {
        formData.append('jdFile', jdFile);
    } else {
        formData.append('jd', jd);
    }
    formData.append('resume', file);
    formData.append('toolName', selectedTool === 'custom' ? customPersona : tools.find(t => t.id === selectedTool).name);

    try {
      const response = await axios.post('http://localhost:5000/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderScoreDisplay = () => {
    if (!result) return null;
    let colorClass = 'medium';
    if (result.score >= 8) colorClass = 'high';
    if (result.score <= 5) colorClass = '';

    return (
      <div className={`score-display ${colorClass}`}>
        {result.score}
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="main-card animate-fade-in">
        <header className="header">
          <h1>DrCode Resume AI</h1>
          <p>Optimize your resume against the Job Description in seconds.</p>
        </header>

        <form onSubmit={handleSubmit} className="glass-panel">
          {error && (
            <div className="error-message" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="jd">
              <Briefcase size={20} color="var(--accent)" />
              Job Description (Text or File)
            </label>
            <textarea
              id="jd"
              className="form-input-text"
              placeholder="Paste the target job description here..."
              value={jd}
              onChange={(e) => { setJd(e.target.value); setJdFile(null); }}
              disabled={loading || jdFile}
              style={{ marginBottom: '10px' }}
            />
            <div className="file-upload-wrapper">
              <label className="file-upload-btn-fake" style={{ width: '100%', padding: '1rem' }}>
                <Upload size={20} />
                <span style={{ fontSize: '0.9rem' }}>{jdFile ? jdFile.name : 'Or click to upload a PDF/DOCX job description...'}</span>
                <input
                  type="file"
                  className="file-input-real"
                  accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,.pdf,.docx"
                  onChange={handleJdFileChange}
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>
              <Zap size={20} color="var(--accent)" />
              Optimization Persona
            </label>
            <div className="tool-selector">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className={`tool-option ${selectedTool === tool.id ? 'active' : ''}`}
                  onClick={() => !loading && setSelectedTool(tool.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>{tool.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{tool.name}</div>
                </div>
              ))}
            </div>
            {selectedTool === 'custom' && (
              <div style={{ marginTop: '1rem' }}>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. AI Engineer, Data Scientist, Finance Expert..."
                  value={customPersona}
                  onChange={(e) => setCustomPersona(e.target.value)}
                  disabled={loading}
                  style={{ minHeight: 'auto', padding: '0.75rem' }}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>
              <FileText size={20} color="var(--accent)" />
              Upload Resume (PDF / DOCX)
            </label>
            <div className="file-upload-wrapper">
              <label className="file-upload-btn-fake" style={{ width: '100%' }}>
                <Upload size={24} />
                <span>{file ? file.name : 'Click to select or drag file here'}</span>
                <input
                  type="file"
                  className="file-input-real"
                  accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,.pdf,.docx"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading || (!jd && !jdFile) || !file || (selectedTool === 'custom' && !customPersona.trim())}>
            {loading ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <div className="loader"></div>
                Analyzing &amp; Optimizing...
              </div>
            ) : (
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <RefreshCw size={20} />
                Optimize Resume
              </div>
            )}
          </button>
        </form>

        {result && (
          <div className="results-panel animate-fade-in" style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', textAlign: 'center' }}>Optimization Results</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {renderScoreDisplay()}
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ATS Match Score (out of 10)</div>
            </div>

            <div className="advice-box">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--accent)' }}>
                <AlertCircle size={18} /> Missing Skills
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
                {result.missing_skills?.map((skill, index) => (
                  <span key={index} style={{ backgroundColor: 'rgba(231, 76, 60, 0.15)', color: '#ff6b6b', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>{skill}</span>
                ))}
              </div>

              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--success)' }}>
                <CheckCircle size={18} /> Recommended Keywords
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
                {result.recommended_keywords?.map((keyword, index) => (
                  <span key={index} style={{ backgroundColor: 'rgba(39, 204, 113, 0.15)', color: '#2ecc71', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>{keyword}</span>
                ))}
              </div>

              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--warning)' }}>
                <Zap size={18} /> Suggestions
              </h3>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                {result.suggestions?.map((sug, index) => (
                  <li key={index} style={{ marginBottom: '6px' }}>{sug}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <a 
                href={`http://localhost:5000${result.downloadUrl}`} 
                className="download-btn"
                download="Tailored_Resume.pdf"
                target="_blank"
                rel="noreferrer"
              >
                <Download size={20} />
                Download Optimized PDF
              </a>
              
              <button 
                type="button"
                onClick={() => {setResult(null); setFile(null); setJd(''); setJdFile(null);}}
                style={{ backgroundColor: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', padding: '1rem 2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
              >
                <RefreshCw size={20} /> Analyze Again
              </button>
            </div>
            
            <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
              Note: The updated resume is customized based on your selected persona and JD requirements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
