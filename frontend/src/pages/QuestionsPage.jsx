// frontend/src/pages/QuestionsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Search, BookOpen, Loader2, Sparkles, Send, 
  Bot, User, Copy, Check, Lightbulb, 
  Code2, Database, Network, Brain, Briefcase, 
  Users, FileText, BarChart3, Megaphone, Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const QuestionsPage = () => {
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);

  const getToken = () => localStorage.getItem('token');

  // Fetch questions with filters
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['questions', search, selectedDomain, selectedType, selectedDifficulty],
    queryFn: async () => {
      const token = getToken();
      const response = await axios.get(`${API_URL}/questions`, {
        params: { 
          search, 
          domain: selectedDomain,
          type: selectedType,
          difficulty: selectedDifficulty 
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!getToken()
  });

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'easy': return 'from-green-500/20 to-green-600/20 text-green-400 border-green-500/30';
      case 'medium': return 'from-yellow-500/20 to-yellow-600/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'from-red-500/20 to-red-600/20 text-red-400 border-red-500/30';
      default: return 'from-gray-500/20 to-gray-600/20 text-gray-400 border-gray-500/30';
    }
  };

  const getDomainIcon = (domain) => {
    const icons = {
      dsa: <Code2 className="w-4 h-4" />,
      cn: <Network className="w-4 h-4" />,
      os: <Cpu className="w-4 h-4" />,
      dbms: <Database className="w-4 h-4" />,
      mba: <Briefcase className="w-4 h-4" />,
      marketing: <Megaphone className="w-4 h-4" />,
      hr: <Users className="w-4 h-4" />,
      behavioral: <Brain className="w-4 h-4" />,
      resume: <FileText className="w-4 h-4" />,
      technical: <Code2 className="w-4 h-4" />
    };
    return icons[domain] || <BarChart3 className="w-4 h-4" />;
  };

  const askAI = async () => {
    if (!userQuestion.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setIsAsking(true);
    const questionToAsk = userQuestion;
    
    setChatHistory(prev => [...prev, { role: 'user', content: questionToAsk }]);
    setUserQuestion('');
    
    try {
      const token = getToken();
      
      if (!token) {
        toast.error('Please login to use AI assistant');
        setIsAsking(false);
        return;
      }
      
      const response = await axios.post(`${API_URL}/ai/chat/evaluate`, 
        {
          question: questionToAsk,
          answer: "",
          category: "general",
          difficulty: "easy",
          conversationHistory: chatHistory
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      let aiAnswer = "";
      
      if (response.data.evaluation?.feedback) {
        aiAnswer = response.data.evaluation.feedback;
      } else if (response.data.nextQuestion?.acknowledgment) {
        aiAnswer = response.data.nextQuestion.acknowledgment;
      } else if (typeof response.data === 'string') {
        aiAnswer = response.data;
      } else {
        aiAnswer = "I'm here to help with your interview preparation! Could you please rephrase your question?";
      }
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiAnswer }]);
      
    } catch (error) {
      console.error('❌ AI error:', error);
      
      let errorMessage = "Sorry, I'm having trouble connecting to the AI. Please try again.";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please try again.";
      }
      
      toast.error(errorMessage);
      
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ Error: ${errorMessage}\n\nPlease check your connection and try again.` 
      }]);
    } finally {
      setIsAsking(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setUserQuestion(question.text);
  };

  // Domain Categories
  const domains = [
    { id: 'all', name: 'All Domains', icon: <BarChart3 className="w-5 h-5" />, color: 'gray' },
    { id: 'technical', name: 'Technical', icon: <Code2 className="w-5 h-5" />, color: 'blue' },
    { id: 'dsa', name: 'DSA', icon: <Code2 className="w-5 h-5" />, color: 'blue' },
    { id: 'cn', name: 'Computer Networks', icon: <Network className="w-5 h-5" />, color: 'blue' },
    { id: 'os', name: 'Operating Systems', icon: <Cpu className="w-5 h-5" />, color: 'blue' },
    { id: 'dbms', name: 'DBMS', icon: <Database className="w-5 h-5" />, color: 'blue' },
    { id: 'mba', name: 'MBA / Business', icon: <Briefcase className="w-5 h-5" />, color: 'purple' },
    { id: 'marketing', name: 'Marketing', icon: <Megaphone className="w-5 h-5" />, color: 'purple' },
    { id: 'hr', name: 'HR Interview', icon: <Users className="w-5 h-5" />, color: 'green' },
    { id: 'behavioral', name: 'Behavioral', icon: <Brain className="w-5 h-5" />, color: 'yellow' },
    { id: 'resume', name: 'Resume-Based', icon: <FileText className="w-5 h-5" />, color: 'orange' }
  ];

  // Question Types
  const types = [
    { id: 'all', name: 'All Types' },
    { id: 'behavioral', name: 'Behavioral' },
    { id: 'technical', name: 'Technical' },
    { id: 'hr', name: 'HR' },
    { id: 'resume', name: 'Resume-Based' }
  ];

  // Difficulties
  const difficulties = [
    { id: 'all', name: 'All Difficulties' },
    { id: 'easy', name: 'Easy' },
    { id: 'medium', name: 'Medium' },
    { id: 'hard', name: 'Hard' }
  ];

  if (!getToken()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/50 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-2">Please Login</h2>
          <p className="text-gray-400">You need to be logged in to access the question bank.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">AI-Powered Learning</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Question Bank</h1>
          <p className="text-gray-400">Browse questions by domain, get AI-powered answers, and improve your interview skills</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Questions List */}
          <div>
            {/* Domain Filters */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Filter by Domain</label>
              <div className="flex flex-wrap gap-2 mb-6">
                {domains.map((domain) => (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      selectedDomain === domain.id
                        ? `bg-${domain.color === 'blue' ? 'blue' : domain.color === 'purple' ? 'purple' : domain.color === 'green' ? 'green' : domain.color === 'yellow' ? 'yellow' : domain.color === 'orange' ? 'orange' : 'gray'}-500/20 text-${domain.color === 'blue' ? 'blue' : domain.color === 'purple' ? 'purple' : domain.color === 'green' ? 'green' : domain.color === 'yellow' ? 'yellow' : domain.color === 'orange' ? 'orange' : 'gray'}-400 border border-${domain.color === 'blue' ? 'blue' : domain.color === 'purple' ? 'purple' : domain.color === 'green' ? 'green' : domain.color === 'yellow' ? 'yellow' : domain.color === 'orange' ? 'orange' : 'gray'}-500/30`
                        : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 border border-transparent'
                    }`}
                  >
                    {domain.icon}
                    <span className="text-sm">{domain.name}</span>
                  </button>
                ))}
              </div>

              {/* Type and Difficulty Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Question Type</label>
                  <div className="flex gap-2">
                    {types.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selectedType === type.id
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'
                        }`}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                  <div className="flex gap-2">
                    {difficulties.map((diff) => (
                      <button
                        key={diff.id}
                        onClick={() => setSelectedDifficulty(diff.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selectedDifficulty === diff.id
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'
                        }`}
                      >
                        {diff.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Questions List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {data?.questions?.map((question, idx) => (
                  <div
                    key={question.id || idx}
                    onClick={() => handleQuestionSelect(question)}
                    className={`group bg-gray-800/50 backdrop-blur-sm rounded-xl border p-5 hover:border-gray-600 transition-all cursor-pointer ${
                      selectedQuestion?.id === question.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {question.domain && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-md text-xs border border-purple-500/30 flex items-center gap-1">
                              {getDomainIcon(question.domain)}
                              {question.domain.toUpperCase()}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs border border-blue-500/30">
                            {question.type || 'general'}
                          </span>
                          <span className={`px-2 py-1 rounded-md text-xs border bg-gradient-to-r ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty || 'medium'}
                          </span>
                        </div>
                        <p className="text-gray-200 font-medium leading-relaxed">{question.text}</p>
                      </div>
                      <div className="ml-4">
                        {selectedQuestion?.id === question.id ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {data?.questions?.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No questions found. Try adjusting your filters.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - AI Chat Assistant */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col h-[700px]">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">AI Interview Assistant</h2>
                  <p className="text-sm text-gray-400">Powered by Groq AI</p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Ask Me Anything!</h3>
                  <p className="text-gray-400">
                    Ask any interview-related question and I'll provide a detailed answer.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">DSA Questions</span>
                    <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">HR Interview</span>
                    <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">STAR Method</span>
                    <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">System Design</span>
                    <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">MBA Prep</span>
                  </div>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                          {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-200'
                        }`}>
                          <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                          {msg.role === 'assistant' && (
                            <button
                              onClick={() => copyToClipboard(msg.content)}
                              className="mt-2 text-xs text-gray-400 hover:text-white transition flex items-center gap-1"
                            >
                              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copied ? 'Copied!' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isAsking && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-sm text-gray-300">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-700">
              <div className="flex gap-3">
                <textarea
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && askAI()}
                  placeholder="Ask any question about interviews, DSA, HR, STAR method, or career advice..."
                  rows="2"
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                />
                <button
                  onClick={askAI}
                  disabled={isAsking || !userQuestion.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-6 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-300">💡 Tip: Ask any interview-related question. The AI will provide detailed answers and guidance!</span>
          </div>
        </div>
      </div>
    </div>
  );
};