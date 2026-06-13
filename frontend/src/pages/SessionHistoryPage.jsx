// src/pages/SessionHistoryPage.jsx
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Calendar, CheckCircle, XCircle, Award, ChevronRight, 
  Clock, FileText, Trash2, AlertCircle, Loader2, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const SessionHistoryPage = () => {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sessionHistory'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/sessions/history`);
      return response.data;
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast.success('History refreshed');
  };

  const handleDeleteSession = async (sessionId) => {
    setDeletingId(sessionId);
    try {
      await axios.delete(`${API_URL}/sessions/${sessionId}`);
      toast.success('Session deleted successfully');
      await refetch();
      queryClient.invalidateQueries(['sessionHistory']);
      queryClient.invalidateQueries(['dashboard']);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete session');
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setSelectedSession(null);
    }
  };

  const handleDeleteAllSessions = async () => {
    setDeletingAll(true);
    try {
      const response = await axios.delete(`${API_URL}/sessions/all`);
      console.log('Delete all response:', response.data);
      toast.success('All sessions cleared successfully');
      await refetch();
      queryClient.invalidateQueries(['sessionHistory']);
      queryClient.invalidateQueries(['dashboard']);
    } catch (error) {
      console.error('Delete all error:', error);
      toast.error(error.response?.data?.error || 'Failed to clear sessions');
    } finally {
      setDeletingAll(false);
      setShowDeleteModal(false);
      setSelectedSession(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Sessions', value: data?.total || 0, icon: Calendar, color: 'blue' },
    { label: 'Completed', value: data?.completed || 0, icon: CheckCircle, color: 'green' },
    { label: 'Cancelled', value: data?.cancelled || 0, icon: XCircle, color: 'red' },
    { label: 'Avg Score', value: '75%', icon: Award, color: 'yellow' },
  ];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  const hasSessions = data?.sessions && data.sessions.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Delete All Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Session History</h1>
            <p className="text-gray-400">Track all your interview sessions and progress</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {hasSessions && (
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setShowDeleteModal(true);
                }}
                className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition flex items-center gap-2 border border-red-500/30"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Sessions
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${colorClasses[stat.color]} p-2 rounded-lg opacity-20`}>
                  <stat.icon className={`w-5 h-5 text-white`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {hasSessions ? (
            data.sessions.map((session) => (
              <div
                key={session.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-gray-600 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gray-700/50 rounded-xl">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadge(session.status)}`}>
                          {session.status}
                        </span>
                        <span className="text-gray-500 text-sm capitalize">{session.type} Interview</span>
                      </div>
                      <h3 className="text-white font-semibold mb-1">
                        {session.type === 'domain' ? `${session.domain || 'General'} Interview` : `${session.type} Based Interview`}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {session.date ? new Date(session.date).toLocaleDateString() : 'Date not set'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.date ? new Date(session.date).toLocaleTimeString() : 'Time not set'}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {session.questionsCount || 0} questions
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.status === 'completed' && (
                      <Link
                        to={`/feedback/${session.id}`}
                        className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition text-sm flex items-center gap-2"
                      >
                        View Report <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setSelectedSession(session);
                        setShowDeleteModal(true);
                      }}
                      disabled={deletingId === session.id}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                    >
                      {deletingId === session.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No sessions yet</p>
              <Link to="/interview/select" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Start Your First Interview
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-white">Confirm Delete</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              {selectedSession 
                ? `Are you sure you want to delete this ${selectedSession.type} interview session from ${selectedSession.date ? new Date(selectedSession.date).toLocaleDateString() : 'unknown date'}? This action cannot be undone.`
                : `Are you sure you want to delete ALL your interview sessions? This action cannot be undone.`
              }
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSession(null);
                }}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedSession) {
                    handleDeleteSession(selectedSession.id);
                  } else {
                    handleDeleteAllSessions();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                {deletingAll || deletingId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete {selectedSession ? 'Session' : 'All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};