// frontend/src/pages/EnhancedVideoInterviewPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Mic, MicOff, Video, VideoOff, Loader2, AlertCircle,
  Activity, BarChart3, Brain, Shield, Target, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const EnhancedVideoInterviewPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [liveAnalytics, setLiveAnalytics] = useState({
    technical: 0,
    communication: 0,
    confidence: 0,
    overall: 0
  });
  const [proctoringWarnings, setProctoringWarnings] = useState([]);
  const [totalFlags, setTotalFlags] = useState(0);
  const maxFlags = 5;
  
  // Video/Audio refs
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  
  useEffect(() => {
    fetchSession();
    requestPermissions();
    setupProctoring();
    
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [sessionId]);
  
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setupSpeechRecognition();
    } catch (error) {
      toast.error('Camera and microphone access required');
    }
  };
  
  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
          analyzeCommunication(finalTranscript);
        }
      };
    }
  };
  
  const analyzeCommunication = async (text) => {
    // Simple real-time communication analysis
    const wordCount = text.split(' ').length;
    const sentenceCount = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / (sentenceCount || 1);
    
    let communicationScore = 70;
    if (avgWordsPerSentence > 15) communicationScore += 10;
    if (wordCount > 50) communicationScore += 10;
    
    setLiveAnalytics(prev => ({
      ...prev,
      communication: Math.min(100, communicationScore)
    }));
  };
  
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
      const response = await axios.post(`${API_URL}/v2/proctoring/violation`, {
        sessionId,
        violationType: type,
        metadata: { timestamp: new Date() }
      });
      
      setTotalFlags(response.data.totalFlags);
      setProctoringWarnings(prev => [...prev, {
        type,
        flagsUsed: response.data.totalFlags,
        timestamp: new Date()
      }]);
      
      toast.warning(`Warning: ${response.data.flagsRemaining} violations remaining`);
      
      if (response.data.shouldTerminate) {
        toast.error('Interview terminated due to multiple violations');
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
      if (response.data.questions?.length > 0) {
        setCurrentQuestion(response.data.questions[0]);
      }
    } catch (error) {
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };
  
  const startAnswering = () => {
    setIsAnswering(true);
    setTranscript('');
    setAiFeedback(null);
    
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
    
    toast.success('Recording started. Speak clearly!');
  };
  
  const stopAnswering = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsAnswering(false);
    
    // Submit for AI evaluation
    try {
      const response = await axios.post(`${API_URL}/v2/evaluate`, {
        sessionId,
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer: transcript,
        category: currentQuestion.type,
        difficulty: currentQuestion.difficulty
      });
      
      const { evaluation, followUp } = response.data;
      setAiFeedback(evaluation);
      setLiveAnalytics({
        technical: evaluation.scores.technical,
        communication: evaluation.scores.communication,
        confidence: evaluation.scores.confidence,
        overall: evaluation.overallScore
      });
      
      // Auto-submit after 3 seconds
      setTimeout(() => {
        submitAnswer(evaluation, followUp);
      }, 3000);
    } catch (error) {
      toast.error('Failed to analyze answer');
    }
  };
  
  const submitAnswer = async (evaluation, followUp) => {
    try {
      await axios.post(`${API_URL}/interviews/sessions/${sessionId}/responses`, {
        questionId: currentQuestion.id,
        responseText: transcript
      });
      
      const nextIndex = questionIndex + 1;
      if (nextIndex < session.questions.length) {
        setQuestionIndex(nextIndex);
        setCurrentQuestion(session.questions[nextIndex]);
        setTranscript('');
        setAiFeedback(null);
        toast.success('Answer submitted! Next question');
        
        if (followUp && followUp.shouldAskFollowUp) {
          toast.info(`Follow-up: ${followUp.question}`);
        }
      } else {
        await axios.post(`${API_URL}/interviews/sessions/${sessionId}/complete`);
        toast.success('Interview completed!');
        navigate(`/feedback/${sessionId}`);
      }
    } catch (error) {
      toast.error('Failed to submit answer');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  const progress = ((questionIndex + 1) / session.questions.length) * 100;
  
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex h-screen">
        {/* Video Section */}
        <div className="flex-1 bg-gray-900 p-4">
          <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-video">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {isAnswering && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm">Recording</span>
              </div>
            )}
          </div>
          
          {/* Proctoring Warnings */}
          {proctoringWarnings.length > 0 && (
            <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">
                  Warnings: {totalFlags}/{maxFlags}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Interview Section */}
        <div className="w-[500px] bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Progress Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between text-gray-400 text-sm mb-2">
              <span>Question {questionIndex + 1} of {session.questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 rounded-full h-2 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          
          {/* Live Analytics */}
          <div className="p-4 bg-gray-700/30 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Live Analytics</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="text-xs text-gray-400">Technical</div>
                <div className="text-lg font-bold text-blue-400">{liveAnalytics.technical}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Comm</div>
                <div className="text-lg font-bold text-green-400">{liveAnalytics.communication}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Confidence</div>
                <div className="text-lg font-bold text-yellow-400">{liveAnalytics.confidence}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Overall</div>
                <div className="text-lg font-bold text-purple-400">{liveAnalytics.overall}%</div>
              </div>
            </div>
          </div>
          
          {/* Question Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  {currentQuestion?.type || 'behavioral'}
                </span>
                <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">
                  {currentQuestion?.difficulty || 'medium'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{currentQuestion?.text}</h2>
            </div>
            
            {!isAnswering && !aiFeedback && (
              <button
                onClick={startAnswering}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Mic className="h-5 w-5" />
                Start Answering
              </button>
            )}
            
            {isAnswering && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-gray-300 text-sm italic">"{transcript || "Listening..."}"</p>
              </div>
            )}
            
            {aiFeedback && (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-green-400 mb-2">AI Analysis</h3>
                  <p className="text-gray-300 text-sm">{aiFeedback.feedback}</p>
                </div>
                <div className="text-center text-gray-400 text-sm">
                  Moving to next question...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};