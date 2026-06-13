import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft, TrendingUp, Target, Lightbulb, Download, Share2, Award, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const FeedbackPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['feedback', sessionId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/interviews/sessions/${sessionId}/feedback`);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    const numScore = score || 0;
    if (numScore >= 80) return 'text-green-400';
    if (numScore >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    const numScore = score || 0;
    if (numScore >= 80) return 'from-green-500/20 to-green-600/20';
    if (numScore >= 60) return 'from-yellow-500/20 to-yellow-600/20';
    return 'from-red-500/20 to-red-600/20';
  };

  const avgScore = data?.averageScore || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Interview Feedback</h1>
          <p className="text-gray-400">Review your performance and track improvement areas</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8 mb-6">
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getScoreBgColor(avgScore)} mb-4`}>
              <span className={`text-4xl font-bold ${getScoreColor(avgScore)}`}>
                {Math.round(avgScore)}%
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white">Overall Score</h2>
            {data?.level && (
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-300`}>
                {data.level}
              </span>
            )}
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" /> Summary
            </h3>
            <p className="text-gray-300 leading-relaxed">{data?.summary}</p>
            {data?.encouragement && (
              <p className="text-blue-400 mt-3 text-sm">{data.encouragement}</p>
            )}
          </div>
        </div>

        {data?.practicePlan && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 p-8 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" /> Practice Plan
            </h3>
            <div className="space-y-4">
              {data.practicePlan.focusAreas && data.practicePlan.focusAreas.length > 0 && (
                <div>
                  <p className="font-medium text-gray-300 mb-2">Focus Areas:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.practicePlan.focusAreas.map((area, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.practicePlan.dailyGoal && (
                <div>
                  <p className="font-medium text-gray-300 mb-2">Daily Goal:</p>
                  <p className="text-gray-400">{data.practicePlan.dailyGoal}</p>
                </div>
              )}
              {data.practicePlan.weeklyTarget && (
                <div>
                  <p className="font-medium text-gray-300 mb-2">Weekly Target:</p>
                  <p className="text-gray-400">{data.practicePlan.weeklyTarget}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {data?.evaluations && data.evaluations.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" /> Detailed Evaluation
            </h3>
            <div className="space-y-6">
              {data.evaluations.map((evaluation, idx) => (
                <div key={idx} className="border-b border-gray-700 last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-white">Question {idx + 1}</p>
                    <span className={`font-semibold ${getScoreColor(evaluation?.scores?.overall)}`}>
                      {evaluation?.scores?.overall}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-2 bg-gray-700/30 rounded-lg">
                      <p className="text-xs text-gray-400">Clarity</p>
                      <p className={`text-sm font-medium ${getScoreColor(evaluation?.scores?.clarity)}`}>
                        {evaluation?.scores?.clarity}%
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-700/30 rounded-lg">
                      <p className="text-xs text-gray-400">Relevance</p>
                      <p className={`text-sm font-medium ${getScoreColor(evaluation?.scores?.relevance)}`}>
                        {evaluation?.scores?.relevance}%
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-700/30 rounded-lg">
                      <p className="text-xs text-gray-400">Confidence</p>
                      <p className={`text-sm font-medium ${getScoreColor(evaluation?.scores?.confidence)}`}>
                        {evaluation?.scores?.confidence}%
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{evaluation?.feedback}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" /> Download Report
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
            <Share2 className="h-4 w-4" /> Share Feedback
          </button>
        </div>
      </div>
    </div>
  );
};
