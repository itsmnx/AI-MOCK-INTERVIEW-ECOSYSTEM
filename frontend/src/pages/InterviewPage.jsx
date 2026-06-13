import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Play, Brain, Mic, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const InterviewPage = () => {
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startInterview = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/interviews/sessions`, {
        templateId: 'default',
        role: 'software_engineer',
        difficulty
      });
      navigate(`/interview/${response.data.id}`);
    } catch (error) {
      alert('Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Practice Interview</h1>
          <p className="text-xl text-gray-600">Simulate a real interview with AI-powered questions and feedback</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">AI Questions</h3>
              <p className="text-sm text-gray-600">Adaptive questions based on your responses</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Mic className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Voice Recording</h3>
              <p className="text-sm text-gray-600">Practice speaking your answers</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Instant Feedback</h3>
              <p className="text-sm text-gray-600">Get detailed evaluation after each answer</p>
            </div>
          </div>

          <div className="border-t pt-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Difficulty</label>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {['easy', 'medium', 'hard'].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                    difficulty === level
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>

            <button
              onClick={startInterview}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-lg font-medium"
            >
              {loading ? 'Starting...' : <><Play className="h-5 w-5" /> Start Interview</>}
            </button>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for success</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use the STAR method (Situation, Task, Action, Result)</li>
            <li>• Be specific with examples from your experience</li>
            <li>• Take a moment to structure your thoughts before answering</li>
            <li>• Practice regularly to build confidence</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
