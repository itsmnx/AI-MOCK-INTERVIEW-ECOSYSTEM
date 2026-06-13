// src/pages/DashboardPage.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  Activity, CheckCircle, Award, ArrowRight, TrendingUp, 
  Calendar, Target, Clock, BarChart3, Sparkles, 
  Briefcase, Code2, FileText, Star
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/dashboard`);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalSessions = data?.stats?.totalSessions || 0;
  const completedSessions = data?.stats?.completedSessions || 0;
  const averageScore = Math.round(data?.stats?.averageScore || 0);
  const improvementRate = data?.stats?.improvementRate || 0;

  const stats = [
    { label: 'Total Sessions', value: totalSessions, icon: Activity, color: 'blue', change: '+12%' },
    { label: 'Completed', value: completedSessions, icon: CheckCircle, color: 'green', change: '+5%' },
    { label: 'Avg Score', value: `${averageScore}%`, icon: Award, color: 'yellow', change: '+8%' },
    { label: 'Improvement', value: `+${improvementRate}%`, icon: TrendingUp, color: 'purple', change: 'vs last month' },
  ];

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-blue-500/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <span className="text-yellow-500 text-sm font-medium">Welcome Back!</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Hello, {user?.firstName}! 👋</h1>
              <p className="text-gray-400">Track your interview practice progress and improve daily</p>
            </div>
            {!data?.onboardingCompleted && (
              <Link to="/onboarding" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Complete Your Profile
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="relative overflow-hidden bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[stat.color]} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
              <div className="flex items-center justify-between relative">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </p>
                </div>
                <div className={`bg-gradient-to-br ${colorClasses[stat.color]} p-3 rounded-xl shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link to="/interview/select" className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg hover:from-blue-500/20 hover:to-purple-500/20 transition-all border border-blue-500/20 group">
                <div>
                  <p className="font-medium text-white">Start New Interview</p>
                  <p className="text-sm text-gray-400">Practice with AI-powered questions</p>
                </div>
                <ArrowRight className="h-5 w-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/questions" className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-lg hover:from-green-500/20 hover:to-teal-500/20 transition-all border border-green-500/20 group">
                <div>
                  <p className="font-medium text-white">Browse Questions</p>
                  <p className="text-sm text-gray-400">Review sample questions and answers</p>
                </div>
                <ArrowRight className="h-5 w-5 text-green-500 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/sessions/history" className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg hover:from-purple-500/20 hover:to-pink-500/20 transition-all border border-purple-500/20 group">
                <div>
                  <p className="font-medium text-white">Session History</p>
                  <p className="text-sm text-gray-400">Review past interviews and progress</p>
                </div>
                <Calendar className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Recommended Practice */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Recommended Practice
            </h2>
            <div className="space-y-3">
              {data?.recommendations && data.recommendations.length > 0 ? (
                data.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-gray-500 transition-all group">
                    <p className="font-medium text-white">{rec.title}</p>
                    <p className="text-sm text-gray-400 mt-1">{rec.description}</p>
                    <Link to={rec.link} className="text-blue-400 text-sm mt-2 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Practice now <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Code2 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Complete your profile to get personalized recommendations</p>
                  <Link to="/profile" className="inline-block mt-3 text-blue-400 text-sm hover:underline">
                    Update Profile →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Recent Activity
            </h2>
            {data?.recentSessions?.length > 0 && (
              <Link to="/sessions/history" className="text-sm text-blue-400 hover:text-blue-300 transition">
                View All →
              </Link>
            )}
          </div>
          {data?.recentSessions?.length > 0 ? (
            <div className="space-y-3">
              {data.recentSessions.slice(0, 5).map((session, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${session.status === 'completed' ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                      {session.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium capitalize">{session.type || 'Interview'} Session</p>
                      <p className="text-sm text-gray-400">{new Date(session.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      session.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {session.status}
                    </span>
                    {session.status === 'completed' && (
                      <Link to={`/feedback/${session.id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                        View Report →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-10 w-10 text-gray-500" />
              </div>
              <p className="text-gray-400 mb-4">No sessions yet. Start your first interview!</p>
              <Link to="/interview/select" className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition">
                Start Your First Interview <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl border border-blue-500/20 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Pro Tip</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Practice using the STAR method (Situation, Task, Action, Result) for behavioral questions. 
                  It helps structure your answers effectively!
                </p>
              </div>
            </div>
            <Link to="/questions" className="px-4 py-2 bg-gray-700/50 text-white text-sm rounded-lg hover:bg-gray-700 transition whitespace-nowrap">
              View Sample Answers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};