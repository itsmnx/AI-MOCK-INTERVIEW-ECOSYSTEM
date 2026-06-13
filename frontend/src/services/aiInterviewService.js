// frontend/src/services/aiInterviewService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class AIInterviewService {
  constructor() {
    this.mockMode = false;
  }

  // ===============================
  // Question Generation
  // ===============================
  async generateQuestions(params) {
    const { type, domain, difficulty, count = 5, resumeData = null } = params;

    try {
      const response = await axios.post(`${API_URL}/ai/generate-questions`, {
        type,
        domain,
        difficulty,
        count,
        role: this.getRoleFromDomain(domain),
        resumeContext: resumeData
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data.questions;
    } catch (error) {
      console.error('❌ Question generation failed:', error.message);
      // Return domain-specific questions based on selected domain
      return this.getDomainSpecificQuestions(domain, difficulty, count);
    }
  }

  getRoleFromDomain(domain) {
    const roles = {
      cse: 'Software Engineer',
      it: 'IT Specialist',
      mba: 'Business Analyst',
      design: 'UI/UX Designer',
      data_science: 'Data Scientist'
    };
    return roles[domain] || 'Software Engineer';
  }

  getDomainSpecificQuestions(domain, difficulty, count) {
    const domainQuestions = {
      cse: {
        easy: [
          "What is the difference between array and linked list?",
          "What is the time complexity of binary search?",
          "What is a stack? Give examples.",
          "What is a queue? Give examples.",
          "What is the difference between TCP and UDP?"
        ],
        medium: [
          "What is a hash table and how does it work?",
          "Explain recursion with an example.",
          "What is the difference between BFS and DFS?",
          "Explain Big O notation.",
          "What is a binary search tree?"
        ],
        hard: [
          "What is dynamic programming? Explain with example.",
          "How do you detect a cycle in a linked list?",
          "Explain Dijkstra's algorithm.",
          "What is the difference between Prim's and Kruskal's algorithm?",
          "Explain AVL tree rotations."
        ]
      },
      mba: {
        easy: [
          "Explain SWOT analysis with an example.",
          "What is a business model?",
          "What is the difference between strategy and tactics?",
          "What is a KPI?",
          "Explain the 4 Ps of marketing."
        ],
        medium: [
          "Walk me through a case study you solved.",
          "What is your leadership philosophy?",
          "How do you measure team performance?",
          "Explain Porter's Five Forces.",
          "What is a value proposition?"
        ],
        hard: [
          "How would you increase profits for a declining business?",
          "Explain Porter's Five Forces with examples.",
          "Walk me through a product launch strategy.",
          "How would you enter a new international market?",
          "What is blue ocean strategy?"
        ]
      },
      data_science: {
        easy: [
          "Difference between supervised and unsupervised learning?",
          "What is overfitting?",
          "Difference between classification and regression?",
          "What is a confusion matrix?",
          "Explain bias-variance tradeoff."
        ],
        medium: [
          "How do you handle missing values?",
          "Difference between bagging and boosting?",
          "What is cross-validation?",
          "Explain ROC curve and AUC.",
          "What is feature engineering?"
        ],
        hard: [
          "Explain gradient descent.",
          "Difference between L1 and L2 regularization?",
          "Explain attention mechanism in transformers.",
          "How to handle imbalanced datasets?",
          "Explain neural network architecture."
        ]
      },
      design: {
        easy: [
          "Difference between UI and UX?",
          "Importance of white space in design?",
          "What is a design system?",
          "What is responsive design?",
          "Difference between wireframe and prototype?"
        ],
        medium: [
          "Walk me through your design process.",
          "How do you conduct user research?",
          "What tools do you use for prototyping?",
          "Explain atomic design.",
          "How do you handle design feedback?"
        ],
        hard: [
          "How would you redesign a complex application?",
          "How do you measure design success?",
          "Balance user needs with business goals?",
          "Explain accessibility in design.",
          "How do you maintain a design system?"
        ]
      },
      it: {
        easy: [
          "Difference between TCP and UDP?",
          "What is an IP address?",
          "What is DNS?",
          "What is a firewall?",
          "Difference between IPv4 and IPv6?"
        ],
        medium: [
          "Explain OSI model layers.",
          "Explain TCP 3-way handshake.",
          "What is subnetting?",
          "Difference between HTTP and HTTPS?",
          "What is cloud computing?"
        ],
        hard: [
          "Explain how SSL/TLS works.",
          "Difference between symmetric and asymmetric encryption?",
          "Explain load balancing.",
          "Difference between Kubernetes and Docker?",
          "Explain zero-trust security."
        ]
      }
    };

    const defaultQuestions = {
      easy: [
        "Tell me about yourself.",
        "What are your strengths?",
        "What are your weaknesses?",
        "Why do you want to work here?",
        "Where do you see yourself in 5 years?"
      ],
      medium: [
        "Describe a challenging project.",
        "How do you handle conflict?",
        "Tell me about a time you showed leadership.",
        "How do you prioritize tasks?",
        "Describe a time you learned a new skill quickly."
      ],
      hard: [
        "Tell me about a time you failed.",
        "Describe an unpopular decision you made.",
        "How do you handle pressure?",
        "Tell me about a time you persuaded someone.",
        "Describe your biggest achievement."
      ]
    };

    const questions = domainQuestions[domain] || defaultQuestions;
    const levelQuestions = questions[difficulty] || questions.medium || defaultQuestions.medium;
    
    return levelQuestions.slice(0, count).map((text, idx) => ({
      id: `q_${Date.now()}_${idx}`,
      text,
      type: domain === 'mba' ? 'behavioral' : 'technical',
      difficulty,
      expectedKeywords: []
    }));
  }

  // ===============================
  // Answer Evaluation
  // ===============================
  async evaluateAnswer(question, answer) {
    try {
      const response = await axios.post(`${API_URL}/ai/evaluate`, { 
        question, 
        answer 
      }, { 
        headers: this.getAuthHeaders() 
      });
      return response.data.evaluation;
    } catch (error) {
      console.error('❌ Evaluation failed:', error.message);
      return this.mockEvaluate(answer);
    }
  }

  mockEvaluate(answer) {
    let score = 60;
    if (answer.length > 100) score += 10;
    if (/example|project|experience/.test(answer)) score += 15;
    return {
      score: Math.min(100, score),
      feedback: score >= 75 ? "Good answer! Keep practicing." : "Try adding more specific examples.",
      strengths: score >= 75 ? ["Clear communication"] : ["Attempted answer"],
      improvements: score >= 75 ? ["Add quantifiable results"] : ["Use STAR method"]
    };
  }

  // ===============================
  // Chat Evaluation
  // ===============================
  async chatEvaluate(payload) {
    try {
      const res = await axios.post(`${API_URL}/ai/chat/evaluate`, payload, { 
        headers: this.getAuthHeaders() 
      });
      return res.data;
    } catch (error) {
      console.error('❌ Chat evaluation failed:', error.message);
      return { success: false, message: 'Chat evaluation failed' };
    }
  }

  // ===============================
  // Follow-up Question
  // ===============================
  async generateFollowUp(payload) {
    try {
      const res = await axios.post(`${API_URL}/ai/follow-up`, payload, { 
        headers: this.getAuthHeaders() 
      });
      return res.data.followUp;
    } catch (error) {
      console.error('❌ Follow-up failed:', error.message);
      return { success: false, message: 'Follow-up failed' };
    }
  }

  // ===============================
  // Resume Upload & Parse
  // ===============================
  async uploadResume(file) {
    const formData = new FormData();
    formData.append('resume', file);
    const res = await axios.post(`${API_URL}/resume/upload`, formData, {
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }

  async parseResume(file) {
    const formData = new FormData();
    formData.append('resume', file);
    const res = await axios.post(`${API_URL}/resume/parse`, formData, {
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }

  // ===============================
  // Dashboard & History
  // ===============================
  async getDashboard() {
    const res = await axios.get(`${API_URL}/dashboard`, { 
      headers: this.getAuthHeaders() 
    });
    return res.data;
  }

  async getSessionHistory() {
    const res = await axios.get(`${API_URL}/sessions/history`, { 
      headers: this.getAuthHeaders() 
    });
    return res.data;
  }

  // ===============================
  // Reports & Roadmaps
  // ===============================
  async generateReport(sessionId) {
    const res = await axios.post(`${API_URL}/report/generate`, { sessionId }, { 
      headers: this.getAuthHeaders() 
    });
    return res.data;
  }

  async generateRoadmap(sessionId, timeframe = '30days') {
    const res = await axios.post(`${API_URL}/roadmap/generate`, { sessionId, timeframe }, { 
      headers: this.getAuthHeaders() 
    });
    return res.data;
  }

  // ===============================
  // Helpers
  // ===============================
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const aiService = new AIInterviewService();