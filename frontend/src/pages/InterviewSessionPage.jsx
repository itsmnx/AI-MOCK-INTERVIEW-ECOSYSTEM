import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, Mic, MicOff, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const InterviewSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [flags, setFlags] = useState(0);
  const [maxFlags] = useState(5);

  useEffect(() => {
    fetchSession();
    setupProctoring();
  }, [sessionId]);

  const setupProctoring = () => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('tab_switch');
      }
    };
    const handleBlur = () => {
      reportViolation('window_blur');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  };

  const reportViolation = async (type) => {
    try {
      const response = await axios.post(`${API_URL}/interviews/${sessionId}/flag`, { violationType: type });
      setFlags(response.data.flagsUsed);
      toast.error(`Warning! Flag ${response.data.flagsUsed} of ${maxFlags}`);
      if (response.data.cancelled) {
        toast.error('Interview cancelled due to multiple violations');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to report violation');
    }
  };

  const fetchSession = async () => {
    try {
      const response = await axios.get(`${API_URL}/interviews/sessions/${sessionId}`);
      setSession(response.data);
      if (response.data.questions && response.data.questions.length > 0) {
        const currentIdx = response.data.currentIndex || 0;
        setCurrentQuestion(response.data.questions[currentIdx]);
        setQuestionIndex(currentIdx);
      }
    } catch (error) {
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentResponse.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/interviews/sessions/${sessionId}/responses`, {
        questionId: currentQuestion.id,
        responseText: currentResponse
      });

      const nextIndex = questionIndex + 1;
      if (nextIndex < session.questions.length) {
        setQuestionIndex(nextIndex);
        setCurrentQuestion(session.questions[nextIndex]);
        setCurrentResponse('');
        toast.success('Answer submitted! Next question');
      } else {
        await axios.post(`${API_URL}/interviews/sessions/${sessionId}/complete`);
        toast.success('Interview completed!');
        navigate(`/feedback/${sessionId}`);
      }
    } catch (error) {
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Session not found</p>
          <button onClick={() => navigate('/interview/select')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Start new interview</button>
        </div>
      </div>
    );
  }

  const progress = ((questionIndex + 1) / session.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/interview/select')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Interviews
        </button>

        {/* Proctoring Warning */}
        {flags > 0 && (
          <div className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <p className="text-red-400 text-sm">⚠️ Proctoring Warning: {flags}/{maxFlags} flags used. Interview will be cancelled at {maxFlags} flags.</p>
          </div>
        )}

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex justify-between text-white mb-4">
              <span>Question {questionIndex + 1} of {session.questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2">
              <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="p-8">
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">{currentQuestion.type || 'behavioral'}</span>
                <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">{currentQuestion.difficulty || 'medium'}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{currentQuestion.text}</h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Your Answer</label>
              <textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder-gray-500"
                placeholder="Type your answer here..."
              />
            </div>

            <div className="bg-blue-500/10 rounded-lg p-4 mb-6 border border-blue-500/20">
              <h4 className="font-medium text-blue-400 mb-2">💡 Tips for a great answer</h4>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Use the STAR method (Situation, Task, Action, Result)</li>
                <li>• Be specific with examples from your experience</li>
                <li>• Quantify your achievements when possible</li>
              </ul>
            </div>

            <button
              onClick={submitAnswer}
              disabled={submitting || !currentResponse.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              <span>{submitting ? 'Submitting...' : 'Submit Answer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
