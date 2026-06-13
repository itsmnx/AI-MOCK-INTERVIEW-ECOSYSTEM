// backend/src/services/ai/questionGeneratorService.js
import BaseAIService from './baseAIService.js';

class QuestionGeneratorService extends BaseAIService {
  async generateQuestions(params) {
    const { type, domain, difficulty, count = 5, role = 'Software Engineer', resumeContext = null } = params;
    
    let prompt = `Generate ${count} unique, high-quality ${difficulty} difficulty interview questions for a ${role} position.`;

    if (domain && domain !== 'general') {
      const domainTopics = {
        cse: 'Computer Science Engineering including DSA, Algorithms, System Design, Data Structures',
        it: 'Information Technology including Networking, Cloud Computing, Security, DevOps',
        mba: 'Business Administration including Leadership, Strategy, Case Studies, Marketing',
        design: 'UI/UX Design including Design Thinking, Prototyping, User Research, Figma',
        data_science: 'Data Science including Machine Learning, Statistics, Python, SQL'
      };
      prompt += ` Focus specifically on ${domainTopics[domain] || domain} domain.`;
    }

    if (resumeContext && resumeContext.skills && resumeContext.skills.length > 0) {
      prompt += `\n\nBased on the candidate's resume, generate questions relevant to these skills: ${resumeContext.skills.slice(0, 5).join(', ')}.`;
    }

    prompt += `\n\nReturn ONLY a valid JSON array. Do NOT include any text before or after the JSON. Format exactly like this:
[
  {
    "text": "question text here",
    "type": "${type}",
    "difficulty": "${difficulty}",
    "expectedKeywords": ["keyword1", "keyword2"]
  }
]`;

    try {
      const result = await this.callAIWithJSON(prompt, { maxTokens: 2048, temperature: 0.8 });
      
      // Handle different response formats
      let questions = [];
      if (Array.isArray(result)) {
        questions = result;
      } else if (result.questions && Array.isArray(result.questions)) {
        questions = result.questions;
      } else if (typeof result === 'object') {
        // If result is a single object, wrap it in array
        questions = [result];
      }
      
      if (questions.length === 0) {
        console.log('No questions generated, using fallback');
        return this.getDomainSpecificQuestions(domain, difficulty, count);
      }
      
      return questions.slice(0, count).map((q, idx) => ({
        id: `q_${Date.now()}_${idx}`,
        text: q.text || q.question || "Sample question",
        type: q.type || type,
        difficulty: q.difficulty || difficulty,
        expectedKeywords: q.expectedKeywords || []
      }));
    } catch (error) {
      console.error('Question generation error:', error.message);
      return this.getDomainSpecificQuestions(domain, difficulty, count);
    }
  }

  getDomainSpecificQuestions(domain, difficulty, count) {
    const questionsByDomain = {
      cse: {
        easy: [
          "What is the difference between an array and a linked list?",
          "Explain the time complexity of binary search.",
          "What is a stack? Give a real-world example.",
          "What is a queue? Where is it used?",
          "What is the difference between TCP and UDP?"
        ],
        medium: [
          "How does a hash table work and how are collisions handled?",
          "Explain recursion with a practical example.",
          "What is the difference between BFS and DFS?",
          "Explain Big O notation with examples.",
          "What is a binary search tree and how do you search in it?"
        ],
        hard: [
          "Explain dynamic programming with an example problem.",
          "How would you detect a cycle in a linked list?",
          "Explain Dijkstra's shortest path algorithm.",
          "Compare and contrast Prim's and Kruskal's algorithms.",
          "Explain AVL tree rotations and balancing."
        ]
      },
      mba: {
        easy: [
          "Explain SWOT analysis with a company example.",
          "What is a business model? Give examples.",
          "What is the difference between strategy and tactics?",
          "What is a KPI and why is it important?",
          "Explain the 4 Ps of marketing with examples."
        ],
        medium: [
          "Walk me through a case study you have solved.",
          "Describe your leadership philosophy.",
          "How do you measure team performance?",
          "Explain Porter's Five Forces model.",
          "What is a value proposition and why is it important?"
        ],
        hard: [
          "How would you increase profits for a declining business?",
          "Apply Porter's Five Forces to a real company.",
          "Outline a product launch strategy from start to finish.",
          "How would you enter a new international market?",
          "Explain blue ocean strategy with an example."
        ]
      },
      data_science: {
        easy: [
          "What is the difference between supervised and unsupervised learning?",
          "Explain overfitting in machine learning.",
          "What is the difference between classification and regression?",
          "What is a confusion matrix?",
          "Explain the bias-variance tradeoff."
        ],
        medium: [
          "How do you handle missing values in a dataset?",
          "Explain the difference between bagging and boosting.",
          "What is cross-validation and why is it used?",
          "Explain ROC curve and AUC.",
          "What is feature engineering and why is it important?"
        ],
        hard: [
          "Explain how gradient descent works mathematically.",
          "What is the difference between L1 and L2 regularization?",
          "Explain the attention mechanism in transformers.",
          "How would you handle an imbalanced dataset?",
          "Explain the architecture of a neural network."
        ]
      },
      design: {
        easy: [
          "What is the difference between UI and UX design?",
          "Why is white space important in design?",
          "What is a design system?",
          "What is responsive design?",
          "What is the difference between a wireframe and a prototype?"
        ],
        medium: [
          "Walk me through your typical design process.",
          "How do you conduct user research?",
          "What tools do you use for prototyping and why?",
          "Explain atomic design methodology.",
          "How do you handle and incorporate design feedback?"
        ],
        hard: [
          "How would you approach redesigning a complex application?",
          "How do you measure the success of a design?",
          "How do you balance user needs with business goals?",
          "Explain your approach to accessible design.",
          "How do you maintain and scale a design system?"
        ]
      },
      it: {
        easy: [
          "What is the difference between TCP and UDP?",
          "What is an IP address?",
          "What is DNS and how does it work?",
          "What is a firewall?",
          "What is the difference between IPv4 and IPv6?"
        ],
        medium: [
          "Explain the OSI model and its 7 layers.",
          "Explain the TCP 3-way handshake.",
          "What is subnetting and why is it used?",
          "What is the difference between HTTP and HTTPS?",
          "What is cloud computing and what are its benefits?"
        ],
        hard: [
          "Explain how SSL/TLS works to secure communication.",
          "What is the difference between symmetric and asymmetric encryption?",
          "Explain load balancing and its algorithms.",
          "Compare Kubernetes and Docker.",
          "Explain the zero-trust security model."
        ]
      }
    };

    const defaultQuestions = {
      easy: [
        "Tell me about yourself.",
        "What are your greatest strengths?",
        "What are your weaknesses?",
        "Why do you want to work here?",
        "Where do you see yourself in 5 years?"
      ],
      medium: [
        "Describe a challenging project you worked on.",
        "How do you handle conflict within a team?",
        "Tell me about a time you showed leadership.",
        "How do you prioritize multiple tasks?",
        "Describe a situation where you had to learn a new skill quickly."
      ],
      hard: [
        "Tell me about a time you failed and what you learned.",
        "Describe a situation where you had to make an unpopular decision.",
        "How do you handle working under pressure?",
        "Tell me about a time you had to persuade someone.",
        "Describe your biggest professional achievement."
      ]
    };

    const domainQuestions = questionsByDomain[domain] || defaultQuestions;
    const levelQuestions = domainQuestions[difficulty] || domainQuestions.medium || defaultQuestions.medium;
    
    // Shuffle and return requested count
    const shuffled = [...levelQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, count).map((text, idx) => ({
      id: `q_${Date.now()}_${idx}`,
      text,
      type: domain === 'mba' ? 'behavioral' : 'technical',
      difficulty,
      expectedKeywords: []
    }));
  }
}

export default QuestionGeneratorService;