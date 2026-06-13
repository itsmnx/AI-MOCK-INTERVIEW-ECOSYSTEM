// src/pages/VideoInterviewPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Mic, MicOff, Video, VideoOff, Send, Loader2, 
  ArrowLeft, AlertCircle, Camera, Monitor, PhoneOff,
  CheckCircle, XCircle, Clock, MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const VideoInterviewPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  // Video/Audio states
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Interview states
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [transcript, setTranscript] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchSession();
    requestPermissions();
    
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
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
      setPermissionGranted(true);
      setupSpeechRecognition();
    } catch (error) {
      console.error('Permission denied:', error);
      toast.error('Camera and microphone access are required for video interview');
      setPermissionGranted(false);
    }
  };

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(prev => prev + finalTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
    } else {
      toast.error('Speech recognition not supported in this browser');
    }
  };

  const fetchSession = async () => {
    try {
      const response = await axios.get(`${API_URL}/interviews/sessions/${sessionId}`);
      setSession(response.data);
      if (response.data.questions && response.data.questions.length > 0) {
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
    
    // Start speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
    
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopAnswering();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    toast.success('Recording started. Speak your answer clearly.');
  };

  const stopAnswering = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsAnswering(false);
    
    // Analyze the answer using AI
    const evaluation = await analyzeAnswer(currentQuestion.text, transcript);
    setAiFeedback(evaluation);
    
    // Auto-submit after 3 seconds
    setTimeout(() => {
      submitAnswer(evaluation);
    }, 3000);
  };

  const analyzeAnswer = async (question, answer) => {
    // Analyze speech patterns, confidence, clarity
    const wordCount = answer.split(' ').length;
    const hasExamples = /example|project|experience|specific|when|during/.test(answer);
    const hasMetrics = /\d+%|\d+\s*(years|months|projects|users)/.test(answer);
    
    // Analyze speaking rate and pauses
    const speakingRate = wordCount / 60; // words per second
    let clarityScore = 70;
    let confidenceScore = 65;
    let relevanceScore = 70;
    
    if (wordCount > 50) clarityScore += 15;
    if (hasExamples) relevanceScore += 20;
    if (hasMetrics) clarityScore += 10;
    if (speakingRate > 2 && speakingRate < 4) confidenceScore += 15;
    
    let overallScore = Math.min(100, (clarityScore + confidenceScore + relevanceScore) / 3);
    
    let feedback = "";
    let strengths = [];
    let improvements = [];
    
    if (overallScore >= 80) {
      feedback = "Excellent! Your delivery was confident and well-structured.";
      strengths = ["Clear articulation", "Good pacing", "Relevant examples"];
      improvements = ["Consider adding more quantifiable metrics"];
    } else if (overallScore >= 60) {
      feedback = "Good attempt! Work on speaking more confidently and adding specific examples.";
      strengths = ["Understood the question", "Relevant response"];
      improvements = ["Speak more clearly", "Add specific examples", "Use STAR method"];
    } else {
      feedback = "Your answer needs more structure and confidence. Practice using the STAR method.";
      strengths = ["Attempted to answer"];
      improvements = ["Improve clarity", "Add specific examples", "Structure your answer"];
    }
    
    return {
      overall: Math.round(overallScore),
      clarity: Math.round(clarityScore),
      relevance: Math.round(relevanceScore),
      confidence: Math.round(confidenceScore),
      feedback,
      strengths,
      improvements,
      transcript: answer,
      wordCount,
      duration: 60 - timeLeft
    };
  };

  const submitAnswer = async (evaluation) => {
    try {
      await axios.post(`${API_URL}/interviews/sessions/${sessionId}/responses`, {
        questionId: currentQuestion.id,
        responseText: evaluation.transcript,
        metadata: {
          video_mode: true,
          duration: evaluation.duration,
          word_count: evaluation.wordCount,
          scores: {
            clarity: evaluation.clarity,
            confidence: evaluation.confidence
          }
        }
      });
      
      const nextIndex = questionIndex + 1;
      if (nextIndex < session.questions.length) {
        setQuestionIndex(nextIndex);
        setCurrentQuestion(session.questions[nextIndex]);
        setTranscript('');
        setAiFeedback(null);
        setTimeLeft(60);
        toast.success('Answer submitted! Next question');
      } else {
        await axios.post(`${API_URL}/interviews/sessions/${sessionId}/complete`);
        toast.success('Interview completed!');
        navigate(`/feedback/${sessionId}`);
      }
    } catch (error) {
      toast.error('Failed to submit answer');
    }
  };

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraOn;
        setCameraOn(!cameraOn);
      }
    }
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  };

  const endInterview = async () => {
    if (window.confirm('Are you sure you want to end the interview?')) {
      await axios.post(`${API_URL}/interviews/sessions/${sessionId}/complete`);
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!permissionGranted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800 rounded-xl">
          <Camera className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Camera & Microphone Access Required</h2>
          <p className="text-gray-400 mb-4">Please allow camera and microphone access to continue with the video interview.</p>
          <button onClick={requestPermissions} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
            Request Access
          </button>
        </div>
      </div>
    );
  }

  const progress = ((questionIndex + 1) / session.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex h-screen">
        {/* Video Section - Left Side */}
        <div className="flex-1 bg-gray-900 p-4">
          <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-video">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Camera Off Overlay */}
            {!cameraOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="h-12 w-12 text-gray-600" />
              </div>
            )}
            
            {/* Recording Indicator */}
            {isAnswering && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-sm">Recording</span>
              </div>
            )}
          </div>
          
          {/* Video Controls */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={toggleCamera}
              className={`p-3 rounded-full transition ${
                cameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {cameraOn ? <Video className="h-5 w-5 text-white" /> : <VideoOff className="h-5 w-5 text-white" />}
            </button>
            <button
              onClick={toggleMic}
              className={`p-3 rounded-full transition ${
                micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {micOn ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5 text-white" />}
            </button>
            <button
              onClick={endInterview}
              className="p-3 bg-red-600 rounded-full hover:bg-red-700 transition"
            >
              <PhoneOff className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Interview Section - Right Side */}
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

            {/* Answer Status */}
            {!isAnswering && !aiFeedback && (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Click below to start answering</p>
                <button
                  onClick={startAnswering}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
                >
                  <Mic className="h-5 w-5" />
                  Start Answering
                </button>
              </div>
            )}

            {/* Timer and Recording */}
            {isAnswering && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-400 font-medium">Recording your answer</span>
                  <span className="text-2xl font-bold text-white">{timeLeft}s</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div className="bg-red-500 rounded-full h-1 transition-all" style={{ width: `${(timeLeft / 60) * 100}%` }} />
                </div>
                <div className="mt-3 text-gray-300 text-sm">
                  <p className="font-medium mb-1">Live Transcript:</p>
                  <p className="italic">{transcript || "Speak now..."}</p>
                </div>
              </div>
            )}

            {/* AI Feedback */}
            {aiFeedback && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-400 mb-2">AI Analysis</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center p-2 bg-gray-700/30 rounded">
                    <p className="text-xs text-gray-400">Overall</p>
                    <p className="text-xl font-bold text-white">{aiFeedback.overall}%</p>
                  </div>
                  <div className="text-center p-2 bg-gray-700/30 rounded">
                    <p className="text-xs text-gray-400">Clarity</p>
                    <p className="text-xl font-bold text-white">{aiFeedback.clarity}%</p>
                  </div>
                  <div className="text-center p-2 bg-gray-700/30 rounded">
                    <p className="text-xs text-gray-400">Relevance</p>
                    <p className="text-xl font-bold text-white">{aiFeedback.relevance}%</p>
                  </div>
                  <div className="text-center p-2 bg-gray-700/30 rounded">
                    <p className="text-xs text-gray-400">Confidence</p>
                    <p className="text-xl font-bold text-white">{aiFeedback.confidence}%</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{aiFeedback.feedback}</p>
                <div className="mt-3">
                  <p className="text-xs text-green-400 mb-1">✓ Strengths:</p>
                  <ul className="text-xs text-gray-400 list-disc list-inside">
                    {aiFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-yellow-400 mb-1">⚠ Areas to improve:</p>
                  <ul className="text-xs text-gray-400 list-disc list-inside">
                    {aiFeedback.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                  </ul>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">Moving to next question...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};