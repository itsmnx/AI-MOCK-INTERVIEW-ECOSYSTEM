// backend/src/services/ai/resumeIntelligenceService.js
import BaseAIService from './baseAIService.js';
import mammoth from 'mammoth';
import fs from 'fs';

// Dynamic import for pdf-parse (works better with ES modules)
let pdfParse;
const loadPdfParse = async () => {
  if (!pdfParse) {
    const module = await import('pdf-parse');
    pdfParse = module.default;
  }
  return pdfParse;
};

class ResumeIntelligenceService extends BaseAIService {
  async extractTextFromFile(filePath, fileType) {
    const buffer = fs.readFileSync(filePath);
    
    if (fileType === 'pdf') {
      const parse = await loadPdfParse();
      const data = await parse(buffer);
      return data.text;
    } else if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    throw new Error('Unsupported file type');
  }

  async parseResume(filePath, fileType) {
    const text = await this.extractTextFromFile(filePath, fileType);
    
    const prompt = `Analyze this resume and extract structured information. Return as JSON:

Resume Text:
${text.substring(0, 8000)}

Extract:
1. Skills (technical and soft skills)
2. Technologies (frameworks, tools, platforms)
3. Projects (name, description, technologies used)
4. Education (degree, institution, year)
5. Work Experience (role, company, duration, achievements)
6. Certifications
7. Achievements (awards, publications, recognitions)
8. Weak Areas (what's missing or could be improved)
9. Domains (industry expertise)
10. Leadership Experience

Return ONLY valid JSON.`;

    const result = await this.callAIWithJSON(prompt);
    
    return {
      raw_text: text,
      skills: result.skills || [],
      technologies: result.technologies || [],
      projects: result.projects || [],
      education: result.education || [],
      experience: result.experience || [],
      certifications: result.certifications || [],
      achievements: result.achievements || [],
      weak_areas: result.weakAreas || [],
      domains: result.domains || [],
      leadership_experience: result.leadershipExperience || [],
      parsed_at: new Date()
    };
  }

  async verifyResumeClaims(resumeData, userId) {
    const claims = [];
    
    if (resumeData.projects) {
      resumeData.projects.forEach(project => {
        claims.push({
          type: 'project',
          title: project.name,
          description: project.description,
          technologies: project.technologies
        });
      });
    }
    
    if (resumeData.experience) {
      resumeData.experience.forEach(exp => {
        claims.push({
          type: 'experience',
          role: exp.role,
          company: exp.company,
          achievements: exp.achievements
        });
      });
    }
    
    const verificationQuestions = [];
    
    for (const claim of claims) {
      const prompt = `Generate 3 verification questions to validate this resume claim:
Claim: ${JSON.stringify(claim)}

Generate questions that:
1. Test deep understanding
2. Cannot be answered without real experience
3. Reveal if the claim is exaggerated

Return as JSON array of questions.`;
      
      const questions = await this.callAIWithJSON(prompt);
      verificationQuestions.push({
        claim,
        questions: questions || []
      });
    }
    
    return verificationQuestions;
  }
}

export default ResumeIntelligenceService;