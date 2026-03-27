const fs = require('fs');
const PDFDocument = require('pdfkit');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractTextFromPdf(buffer) {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to read PDF file. Make sure it is a valid format.');
    }
}

async function extractTextFromDocx(buffer) {
    try {
        const { value } = await mammoth.extractRawText({ buffer });
        return value;
    } catch (error) {
        console.error('Error extracting text from DOCX:', error);
        throw new Error('Failed to read DOCX file. Make sure it is a valid format.');
    }
}

async function createPdfFromText(resumeData, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            // Smaller margins to fit on one page
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // Fallback for simple string output (in case AI hallucinates or fails JSON structuring)
            if (typeof resumeData === 'string') {
                doc.font('Helvetica').fontSize(10).text(resumeData, { align: 'left', lineGap: 3 });
                doc.end();
                stream.on('finish', () => resolve(outputPath));
                stream.on('error', (err) => reject(err));
                return;
            }

            // Structured JSON Renderer (One-page standard template)
            const primaryColor = '#0070B5'; // Blue color like the image
            const textColor = '#111111';
            
            // Name Header
            if (resumeData.name) {
                doc.font('Helvetica-Bold').fontSize(22).fillColor(primaryColor).text(resumeData.name.toUpperCase());
            }

            // Contact Info Side-by-Side Grid
            if (resumeData.contact && Array.isArray(resumeData.contact)) {
                doc.font('Helvetica').fontSize(9).fillColor(textColor);
                doc.moveDown(0.2);
                let contactLine1 = '';
                let contactLine2 = '';
                
                resumeData.contact.forEach((c, i) => {
                    if (i < 2) contactLine1 += c + '    ';
                    else contactLine2 += c + '    ';
                });
                if (contactLine1) doc.text(contactLine1.trim());
                if (contactLine2) doc.text(contactLine2.trim());
                doc.moveDown(0.5);
            }

            // Sections
            if (resumeData.sections && Array.isArray(resumeData.sections)) {
                resumeData.sections.forEach(sec => {
                    if (!sec.title) return;
                    
                    // Section Title
                    doc.moveDown(0.5);
                    doc.font('Helvetica').fontSize(11).fillColor(primaryColor).text(sec.title.toUpperCase());
                    
                    // Draw Line below Title
                    doc.lineWidth(1).strokeColor(primaryColor)
                       .moveTo(doc.x, doc.y)
                       .lineTo(doc.page.width - doc.page.margins.right, doc.y)
                       .stroke();
                    
                    doc.moveDown(0.3);

                    // Section Items
                    if (sec.items && Array.isArray(sec.items)) {
                        sec.items.forEach(item => {
                            // Item Main Name, Date & Description Layout
                            if (item.name || item.date) {
                                if (item.name) {
                                    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10);
                                    
                                    // If there is description but no date (typical for SKILLS: Languages -> C++)
                                    if (item.description && !item.date) {
                                        // Ensure spacing
                                        let cleanName = item.name.trim();
                                        doc.text(cleanName + " ", { continued: true });
                                        doc.fillColor(textColor).font('Helvetica').text(item.description.trim());
                                    } else {
                                        // Typical for Experience/Projects (Name \n Description)
                                        doc.text(item.name.trim());
                                        if (item.date) {
                                            doc.moveUp();
                                            doc.fillColor(textColor).font('Helvetica-Oblique').fontSize(9);
                                            doc.text(item.date.trim(), { align: 'right' });
                                        }
                                        if (item.description) {
                                            doc.fillColor(textColor).font('Helvetica').fontSize(10);
                                            doc.text(item.description.trim());
                                        }
                                    }
                                } else {
                                    if (item.date) {
                                        doc.fillColor(textColor).font('Helvetica-Oblique').fontSize(9);
                                        doc.text(item.date.trim(), { align: 'right' });
                                    }
                                    if (item.description) {
                                        doc.fillColor(textColor).font('Helvetica').fontSize(10);
                                        doc.text(item.description.trim());
                                    }
                                }
                            } else if (item.description) {
                                doc.fillColor(textColor).font('Helvetica').fontSize(10);
                                doc.text(item.description.trim());
                            }


                            // Item Bullets
                            if (item.bullets && Array.isArray(item.bullets) && item.bullets.length > 0) {
                                doc.fillColor(textColor).font('Helvetica').fontSize(9);
                                item.bullets.forEach(bullet => {
                                    if (bullet && bullet.trim() !== '') {
                                        doc.text('  - ' + bullet, { indent: 15, lineGap: 1 });
                                    }
                                });
                            }
                            // Tiny space between items
                            doc.moveDown(0.2);
                        });
                    }
                });
            }

            doc.end();

            stream.on('finish', () => {
                resolve(outputPath);
            });

            stream.on('error', (err) => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { extractTextFromPdf, extractTextFromDocx, createPdfFromText };
