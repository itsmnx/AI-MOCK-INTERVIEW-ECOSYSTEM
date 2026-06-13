// frontend/src/pages/ChatInterviewPage.jsx - Complete Updated Version
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Send, Loader2, Bot, User, 
  MessageSquare, Sparkles, X,
  Shield, AlertTriangle, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const ChatInterviewPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const maxViolations = 3;
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Report violation function
  const reportViolation = useCallback(async (type) => {
    const newCount = violationCount + 1;
    setViolationCount(newCount);
    setShowViolationWarning(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/interviews/${sessionId}/flag`, 
        { violationType: type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.cancelled || newCount >= maxViolations) {
        toast.error(`⚠️ CRITICAL: Multiple violations detected! Interview will be terminated.`);
        setTimeout(() => {
          endInterview(true);
        }, 2000);
      } else {
        toast.warning(`⚠️ Warning: ${type.replace('_', ' ')} detected! (${response.data.flagsUsed || newCount}/${maxViolations})`);
      }
      
      setTimeout(() => setShowViolationWarning(false), 3000);
    } catch (error) {
      console.error('Failed to report violation:', error);
      if (newCount >= maxViolations) {
        toast.error('Multiple violations detected! Interview will be terminated.');
        setTimeout(() => endInterview(true), 2000);
      }
    }
  }, [violationCount, sessionId, maxViolations]);

  // End interview function
  const endInterview = useCallback(async (forced = false) => {
    const message = forced 
      ? 'Interview terminated due to multiple violations. Your progress will be saved.'
      : 'Are you sure you want to end this interview? Your progress will be saved.';
    
    if (forced || window.confirm(message)) {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/interviews/sessions/${sessionId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      navigate('/dashboard');
    }
  }, [sessionId, navigate]);

  // Force fullscreen on interview start
  useEffect(() => {
    const forceFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setFullScreen(true);
        }
      } catch (err) {
        console.log('Fullscreen request failed:', err);
        toast.warning('Please allow fullscreen for the best interview experience');
      }
    };
    
    forceFullscreen();
    
    // Prevent exit fullscreen
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !interviewCompleted && !loading) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log('Re-entry failed:', err);
          toast.error('Please stay in fullscreen mode during the interview');
        });
        reportViolation('fullscreen_exit');
      }
    };
    
    // Prevent tab switching
    const handleVisibilityChange = () => {
      if (document.hidden && !interviewCompleted && !loading) {
        reportViolation('tab_switch');
      }
    };
    
    // Prevent right-click
    const handleContextMenu = (e) => {
      if (!interviewCompleted && !loading) {
        e.preventDefault();
        reportViolation('right_click');
      }
    };
    
    // Prevent copy-paste
    const handleCopy = (e) => {
      if (!interviewCompleted && !loading) {
        e.preventDefault();
        reportViolation('copy_attempt');
      }
    };
    
    const handleCut = (e) => {
      if (!interviewCompleted && !loading) {
        e.preventDefault();
        reportViolation('cut_attempt');
      }
    };
    
    const handlePaste = (e) => {
      if (!interviewCompleted && !loading) {
        e.preventDefault();
        reportViolation('paste_attempt');
        toast.warning('Pasting is disabled during interview');
      }
    };
    
    // Prevent keyboard shortcuts
    const handleKeyDown = (e) => {
      if (!interviewCompleted && !loading) {
        if ((e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'C' || e.key === 'V' || e.key === 'X')) ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            e.key === 'F12') {
          e.preventDefault();
          reportViolation('keyboard_shortcut');
          toast.warning('Keyboard shortcuts are disabled during interview');
        }
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [interviewCompleted, loading, reportViolation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const fetchSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/interviews/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSession(response.data);
      if (response.data.questions && response.data.questions.length > 0) {
        setCurrentQuestion(response.data.questions[0]);
        setChatHistory([
          { 
            role: 'assistant', 
            content: "👋 Welcome to your AI interview! I'll be conducting this interview. Please stay focused and provide thoughtful answers. Let's begin!"
          },
          { 
            role: 'assistant', 
            content: `**Question 1:**\n\n${response.data.questions[0].text}`
          }
        ]);
      }
    } catch (error) {
      console.error('Fetch session error:', error);
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Please provide an answer before submitting');
      return;
    }
    
    // Check for "don't know" answers
    const lowerAnswer = answer.trim().toLowerCase();
    if (lowerAnswer === "don't know" || lowerAnswer === "idk" || lowerAnswer === "dont know" || lowerAnswer === "no idea") {
      toast.warning('Try your best to answer! Even a partial answer is better than saying "don\'t know"');
    }

    setSubmitting(true);
    setAiThinking(true);
    
    // Store the current answer and question
    const currentAnswerText = answer;
    const currentQuestionObj = currentQuestion;
    
    // Clear input immediately
    setAnswer('');
    
    // Add user answer to chat
    setChatHistory(prev => [...prev, { 
      role: 'user', 
      content: currentAnswerText
    }]);
    
    try {
      const token = localStorage.getItem('token');
      
      // Submit answer to backend
      const response = await axios.post(`${API_URL}/interviews/sessions/${sessionId}/responses`, {
        questionId: currentQuestionObj.id,
        responseText: currentAnswerText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Get evaluation from response
      const evaluation = response.data.evaluation;
      const score = evaluation?.scores?.overall || 50;
      
      // Generate feedback based on score
      let feedbackMessage = "";
      const scoreEmoji = score >= 80 ? '🎉' : score >= 60 ? '👍' : score >= 40 ? '📚' : '⚠️';
      
      if (score >= 80) {
        feedbackMessage = `${scoreEmoji} **Excellent! Score: ${score}%**\n\nGreat answer! You showed clear understanding and provided good examples.`;
      } else if (score >= 60) {
        feedbackMessage = `${scoreEmoji} **Good! Score: ${score}%**\n\nGood answer! To improve, add more specific examples and quantify your achievements.`;
      } else if (score >= 40) {
        feedbackMessage = `${scoreEmoji} **Score: ${score}%**\n\nYour answer is on the right track. Try using the STAR method (Situation, Task, Action, Result) for better structure.`;
      } else {
        feedbackMessage = `${scoreEmoji} **Score: ${score}%**\n\nLet's work on this. Focus on providing clear, structured answers with specific examples from your experience.`;
      }
      
      // Add AI feedback to chat
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: feedbackMessage
      }]);
      
      // Check if interview should continue
      const nextIndex = questionIndex + 1;
      if (nextIndex < session.questions.length) {
        setQuestionIndex(nextIndex);
        setCurrentQuestion(session.questions[nextIndex]);
        
        // Add next question after delay
        setTimeout(() => {
          setChatHistory(prev => [...prev, { 
            role: 'assistant', 
            content: `**Question ${nextIndex + 1}:**\n\n${session.questions[nextIndex].text}`
          }]);
          setAiThinking(false);
        }, 2000);
      } else {
        // Complete interview
        await axios.post(`${API_URL}/interviews/sessions/${sessionId}/complete`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setInterviewCompleted(true);
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "🎉 **Congratulations!** You've completed the interview! Click the button below to view your detailed feedback report."
        }]);
        toast.success('Interview completed!');
        setAiThinking(false);
        
        // Exit fullscreen
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
      
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to submit answer');
      
      // Remove the user message we added
      setChatHistory(prev => prev.filter(msg => msg.content !== currentAnswerText));
      setAnswer(currentAnswerText);
      setAiThinking(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch session on mount
  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading interview session...</p>
        </div>
      </div>
    );
  }

  const progress = ((questionIndex + 1) / session?.questions?.length || 1) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => endInterview()} className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition">
            <X className="h-4 w-4" /> End Interview
          </button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <span className="text-white font-semibold">AI Mock Interview</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Proctoring Active</span>
            </div>
          </div>
        </div>
        
        {/* Violation Warning Banner */}
        {showViolationWarning && violationCount > 0 && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            violationCount >= maxViolations - 1 
              ? 'bg-red-500/20 border border-red-500/50 text-red-400' 
              : 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
          }`}>
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              {violationCount}/{maxViolations} violations detected. 
              {violationCount >= maxViolations - 1 ? ' Next violation will terminate the interview!' : ' Please maintain focus.'}
            </span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="bg-gray-800 rounded-full h-2 mb-4">
          <div className="bg-blue-500 rounded-full h-2 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-right text-sm text-gray-400 mb-4">
          Question {questionIndex + 1} of {session?.questions?.length || 0}
        </div>

        {/* Chat Container */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col h-[70vh]">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-white">AI Interviewer</h2>
                <p className="text-xs text-gray-400">
                  {interviewCompleted ? 'Interview Complete' : `Conducting interview • ${violationCount}/${maxViolations} warnings`}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
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
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {aiThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-sm text-gray-300">AI is analyzing your answer...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!interviewCompleted && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-3">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitAnswer();
                    }
                  }}
                  placeholder="Type your answer here... (Press Enter to submit, Shift+Enter for new line)"
                  rows="3"
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                  disabled={submitting}
                />
                <button
                  onClick={submitAnswer}
                  disabled={submitting || !answer.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press <kbd className="px-1 py-0.5 bg-gray-700 rounded">Enter</kbd> to send, 
                <kbd className="px-1 py-0.5 bg-gray-700 rounded ml-1">Shift+Enter</kbd> for new line
              </p>
            </div>
          )}

          {/* Completion Button */}
          {interviewCompleted && (
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={() => navigate(`/feedback/${sessionId}`)}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                View Feedback Report →
              </button>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-300">💡 Tip: Use the STAR method (Situation, Task, Action, Result) for best answers! Cheating attempts will be logged and may terminate the interview.</span>
          </div>
        </div>
      </div>
    </div>
  );
};