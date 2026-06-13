// frontend/src/pages/InterviewSelectionPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Brain, FileText, Video, Calendar, Clock, ChevronRight,
  Shield, AlertCircle, Sparkles, Server, Users, Palette, Database,
  Code2, BarChart3, Briefcase, Target, BookOpen, Plus, Upload,
  X, CheckCircle, Loader2, Settings, Sliders, HardDrive, Zap, Trash2,
  Cpu, Network, Globe, GitBranch, Layout, PenTool, LineChart
} from 'lucide-react';
import { aiService } from '../services/aiInterviewService';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const InterviewSelectionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('domain');
  const [selectedMode, setSelectedMode] = useState('chat');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  useEffect(() => {
    fetchUserProfile();
    fetchResumeData();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      setUserProfile(response.data.profile);
    } catch (error) {
      console.error('Failed to fetch profile');
    }
  };

  const fetchResumeData = async () => {
    const savedResume = localStorage.getItem('resumeData');
    if (savedResume) {
      setResumeData(JSON.parse(savedResume));
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload PDF or DOC/DOCX file only');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    
    toast.loading(`Analyzing "${file.name}"...`);
    
    try {
      const mockResumeData = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Tailwind CSS'],
        experience: '3 years',
        projects: ['E-commerce Platform', 'Task Management App', 'Portfolio Website'],
        education: 'B.Tech Computer Science',
        currentRole: 'Software Developer',
        company: 'Tech Solutions Inc.',
        uploadedAt: new Date().toISOString()
      };
      
      setResumeData(mockResumeData);
      localStorage.setItem('resumeData', JSON.stringify(mockResumeData));
      toast.dismiss();
      toast.success(`✓ Resume "${file.name}" uploaded and analyzed!`);
      setShowResumeUpload(false);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to analyze resume. Please try again.');
      console.error('Resume upload error:', error);
    }
  };

  const handleRemoveResume = () => {
    setResumeData(null);
    localStorage.removeItem('resumeData');
    toast.success('Resume removed');
  };

  const generateAIQuestions = async () => {
    setGeneratingQuestions(true);
    try {
      const requestData = {
        type: selectedType,
        domain: selectedDomain,
        difficulty: selectedDifficulty,
        count: questionCount,
        resumeData: selectedType === 'resume' ? resumeData : null
      };
      
      console.log('Generating questions with:', requestData);
      
      const questions = await aiService.generateQuestions(requestData);
      
      if (questions && questions.length > 0) {
        setGeneratedQuestions(questions);
        setSelectedQuestions(questions.map(q => q.id));
        toast.success(`${questions.length} ${selectedDomain.toUpperCase()} questions generated!`);
      } else {
        toast.error('No questions generated. Please try again.');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate questions');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const startInterview = async () => {
    if (selectedType === 'resume' && !resumeData) {
      toast.error('Please upload your resume first');
      setShowResumeUpload(true);
      return;
    }
    
    if (selectedType === 'domain' && !selectedDomain) {
      toast.error('Please select a domain');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/interviews/schedule`, {
        type: selectedType,
        mode: selectedMode,
        domain: selectedDomain,
        difficulty: selectedDifficulty,
        questionCount: selectedQuestions.length,
        scheduledAt: scheduledDate && scheduledTime ? `${scheduledDate}T${scheduledTime}` : null,
        customQuestions: generatedQuestions.filter(q => selectedQuestions.includes(q.id))
      });
      
      if (selectedMode === 'video') {
        navigate(`/video-interview/${response.data.sessionId}`);
      } else {
        navigate(`/chat-interview/${response.data.sessionId}`);
      }
    } catch (error) {
      toast.error('Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  // Domain-specific questions preview
  const getDomainPreview = (domain) => {
    const previews = {
      cse: [
        "What is the difference between array and linked list?",
        "Explain the concept of time complexity.",
        "What is the difference between TCP and UDP?"
      ],
      it: [
        "Explain the OSI model and its layers.",
        "What is cloud computing?",
        "What is the difference between HTTP and HTTPS?"
      ],
      mba: [
        "Explain SWOT analysis with an example.",
        "How would you increase profits for a declining business?",
        "What is your leadership philosophy?"
      ],
      design: [
        "What is the difference between UI and UX?",
        "Walk me through your design process.",
        "What is responsive design?"
      ],
      data_science: [
        "What is the difference between supervised and unsupervised learning?",
        "Explain overfitting in machine learning.",
        "What is a confusion matrix?"
      ]
    };
    return previews[domain] || previews.cse;
  };

  const domains = [
    { value: 'cse', label: 'Computer Science', icon: <Code2 className="w-6 h-6" />, topics: ['DSA', 'System Design', 'Programming', 'Databases'], color: 'blue' },
    { value: 'it', label: 'Information Technology', icon: <Network className="w-6 h-6" />, topics: ['Networking', 'Cloud', 'Security', 'DevOps'], color: 'green' },
    { value: 'mba', label: 'Business / MBA', icon: <Briefcase className="w-6 h-6" />, topics: ['Leadership', 'Strategy', 'Marketing', 'Finance'], color: 'purple' },
    { value: 'design', label: 'UI/UX Design', icon: <PenTool className="w-6 h-6" />, topics: ['Figma', 'User Research', 'Prototyping', 'Design Systems'], color: 'pink' },
    { value: 'data_science', label: 'Data Science', icon: <LineChart className="w-6 h-6" />, topics: ['Python', 'ML', 'Statistics', 'SQL'], color: 'yellow' }
  ];

  const interviewTypes = [
    { id: 'resume', icon: <FileText className="w-8 h-8" />, title: 'Resume-Based', desc: 'AI generates questions from your resume', color: 'from-green-500 to-emerald-600' },
    { id: 'domain', icon: <Brain className="w-8 h-8" />, title: 'Domain-Based', desc: 'Technical questions based on your field', color: 'from-blue-500 to-indigo-600' },
    { id: 'behavioral', icon: <Users className="w-8 h-8" />, title: 'Behavioral', desc: 'Soft skills and situational questions', color: 'from-purple-500 to-pink-600' }
  ];

  const interviewModes = [
    { id: 'video', icon: <Video className="w-6 h-6" />, title: 'Video Call', desc: 'Face-to-face AI interview', color: 'from-red-500 to-rose-600' },
    { id: 'chat', icon: <Brain className="w-6 h-6" />, title: 'Text Chat', desc: 'Type your answers', color: 'from-cyan-500 to-blue-600' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', icon: <Zap className="w-4 h-4" />, color: 'from-green-500 to-green-600' },
    { value: 'medium', label: 'Medium', icon: <Target className="w-4 h-4" />, color: 'from-yellow-500 to-yellow-600' },
    { value: 'hard', label: 'Hard', icon: <HardDrive className="w-4 h-4" />, color: 'from-red-500 to-red-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">AI-Powered Interview</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Schedule Your Interview</h1>
          <p className="text-gray-400">Choose your interview type, mode, and preferences</p>
        </div>

        {/* Proctoring Notice */}
        <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-xl">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" />
            <div>
              <p className="font-medium text-yellow-400">AI Proctoring Enabled</p>
              <p className="text-sm text-yellow-500/80">5 flags allowed. Interview will be cancelled on 6th violation.</p>
            </div>
          </div>
        </div>

        {/* Resume Upload Section */}
        {(selectedType === 'resume' || showResumeUpload) && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              Resume Upload
            </h2>
            {resumeData ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-white font-medium">{resumeData.fileName || 'Resume Analyzed'}</p>
                      <p className="text-sm text-gray-400">Skills: {resumeData.skills?.slice(0, 4).join(', ')}</p>
                      {resumeData.skills?.length > 4 && (
                        <p className="text-xs text-gray-500">+{resumeData.skills.length - 4} more skills</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowResumeUpload(true); setResumeData(null); localStorage.removeItem('resumeData'); }} className="text-blue-400 text-sm hover:underline px-3 py-1 rounded hover:bg-blue-500/10 transition">
                      Upload New
                    </button>
                    <button onClick={handleRemoveResume} className="text-red-400 text-sm hover:underline px-3 py-1 rounded hover:bg-red-500/10 transition flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="cursor-pointer flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 transition group">
                  <Upload className="w-6 h-6 text-gray-400 mr-2 group-hover:text-blue-400 transition" />
                  <span className="text-gray-400 group-hover:text-blue-400 transition">
                    Click to upload Resume (PDF, DOC, DOCX)
                  </span>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
                </label>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Maximum file size: 5MB. Supported formats: PDF, DOC, DOCX
                </p>
              </div>
            )}
          </div>
        )}

        {/* Interview Type Selection */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Select Interview Type</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {interviewTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => { setSelectedType(type.id); if (type.id === 'resume' && !resumeData) setShowResumeUpload(true); }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedType === type.id
                    ? `bg-gradient-to-r ${type.color} border-transparent shadow-lg`
                    : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                }`}
              >
                <div className={selectedType === type.id ? 'text-white' : 'text-gray-400'}>
                  {type.icon}
                </div>
                <h3 className={`font-semibold mt-2 ${selectedType === type.id ? 'text-white' : 'text-gray-200'}`}>
                  {type.title}
                </h3>
                <p className={`text-sm mt-1 ${selectedType === type.id ? 'text-white/80' : 'text-gray-500'}`}>
                  {type.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Domain Selection */}
        {selectedType === 'domain' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Select Your Domain</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {domains.map((domain) => (
                <button
                  key={domain.value}
                  onClick={() => setSelectedDomain(domain.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedDomain === domain.value
                      ? `border-${domain.color}-500 bg-${domain.color}-500/20`
                      : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedDomain === domain.value ? `bg-${domain.color}-500/30` : 'bg-gray-600/30'}`}>
                      {domain.icon}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${selectedDomain === domain.value ? `text-${domain.color}-400` : 'text-gray-200'}`}>
                        {domain.label}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {domain.topics.map((topic, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-gray-600/50 rounded-full text-gray-400">{topic}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Domain Preview Questions */}
            {selectedDomain && (
              <div className="mt-4 p-4 bg-gray-700/30 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Sample questions for {domains.find(d => d.value === selectedDomain)?.label}:</h3>
                <ul className="space-y-1">
                  {getDomainPreview(selectedDomain).map((q, idx) => (
                    <li key={idx} className="text-xs text-gray-400">• {q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Difficulty and Question Count */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Interview Settings</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Level</label>
              <div className="flex gap-3">
                {difficulties.map((diff) => (
                  <button
                    key={diff.value}
                    onClick={() => setSelectedDifficulty(diff.value)}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      selectedDifficulty === diff.value
                        ? `bg-gradient-to-r ${diff.color} border-transparent text-white`
                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {diff.icon}
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Number of Questions</label>
              <div className="flex gap-3">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                      questionCount === count
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Generate Questions Button */}
        <button
          onClick={generateAIQuestions}
          disabled={generatingQuestions || (selectedType === 'domain' && !selectedDomain) || (selectedType === 'resume' && !resumeData)}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 mb-6 disabled:opacity-50"
        >
          {generatingQuestions ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
          {generatingQuestions ? 'Generating Questions...' : 'Generate AI Questions'}
        </button>

        {/* Generated Questions Preview */}
        {generatedQuestions.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              AI Generated Questions ({generatedQuestions.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedQuestions.map((q, idx) => (
                <label key={q.id} className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(q.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuestions([...selectedQuestions, q.id]);
                      } else {
                        setSelectedQuestions(selectedQuestions.filter(id => id !== q.id));
                      }
                    }}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <p className="text-white text-sm">{idx + 1}. {q.text}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">{q.type}</span>
                      <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">{q.difficulty}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Select questions you want to include (default: all selected)</p>
          </div>
        )}

        {/* Interview Mode Selection */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Select Interview Mode</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {interviewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  selectedMode === mode.id
                    ? `bg-gradient-to-r ${mode.color} border-transparent shadow-lg`
                    : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                }`}
              >
                <div className={`inline-flex ${selectedMode === mode.id ? 'text-white' : 'text-gray-400'}`}>
                  {mode.icon}
                </div>
                <h3 className={`font-semibold mt-2 ${selectedMode === mode.id ? 'text-white' : 'text-gray-200'}`}>
                  {mode.title}
                </h3>
                <p className={`text-sm mt-1 ${selectedMode === mode.id ? 'text-white/80' : 'text-gray-500'}`}>
                  {mode.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Schedule Interview (Optional)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Leave empty to start immediately</p>
        </div>

        {/* Start Button */}
        <button
          onClick={startInterview}
          disabled={loading || (selectedType === 'domain' && !selectedDomain) || (selectedType === 'resume' && !resumeData)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
          {loading ? 'Starting...' : 'Start Interview'}
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Make sure you're in a quiet environment with stable internet
          </p>
        </div>
      </div>
    </div>
  );
};