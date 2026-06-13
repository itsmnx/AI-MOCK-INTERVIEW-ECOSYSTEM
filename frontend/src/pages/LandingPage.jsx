// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  FileText, 
  Video, 
  Shield, 
  BarChart3, 
  Sparkles,
  ChevronRight,
  Star,
  Users,
  Clock,
  Award,
  Mic,
  FileCheck,
  TrendingUp
} from 'lucide-react';

export const LandingPage = () => {
  const features = [
    {
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      title: "Resume-Based AI Interview",
      description: "AI generates personalized questions based on your uploaded resume and projects"
    },
    {
      icon: <Video className="w-8 h-8 text-purple-600" />,
      title: "Video/Audio/Chat Options",
      description: "Choose your preferred interview mode - video call, audio only, or text chat"
    },
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: "AI Proctoring",
      description: "Advanced cheating detection with flag system - 5 strikes and interview ends"
    },
    {
      icon: <Brain className="w-8 h-8 text-red-600" />,
      title: "Domain-Specific Interviews",
      description: "Tailored questions for CSE, IT, MBA, Design, and more domains"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
      title: "Detailed Analytics",
      description: "Comprehensive feedback with metrics, scores, and improvement suggestions"
    },
    {
      icon: <Clock className="w-8 h-8 text-indigo-600" />,
      title: "Schedule Interviews",
      description: "Book interviews at your preferred time slot"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Interviews Conducted", icon: <Users className="w-5 h-5" /> },
    { value: "95%", label: "Student Satisfaction", icon: <Star className="w-5 h-5" /> },
    { value: "50+", label: "Companies Trust", icon: <Award className="w-5 h-5" /> },
    { value: "30min", label: "Average Session", icon: <Clock className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Floating Action Buttons - NO NAVBAR */}
      <div className="absolute top-6 right-6 z-50 flex gap-4">
        <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">
          Sign In
        </Link>
        <Link to="/register" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md">
          Get Started
        </Link>
      </div>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600">AI-Powered Interview Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Ace Your Next Interview with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI Technology</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Practice with realistic AI interviews, get instant feedback, and land your dream job.
              Used by 10,000+ job seekers and 50+ companies.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/register" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md">
                Start Free Practice <ChevronRight className="w-4 h-4" />
              </Link>
              <button className="px-8 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-600 transition">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900">
                  {stat.icon}
                  {stat.value}
                </div>
                <p className="text-gray-600 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features for Interview Success</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to prepare for your dream job interview
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">Four simple steps to interview success</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Create Profile", desc: "Sign up and complete your profile with resume", icon: <FileCheck /> },
              { step: "2", title: "Choose Interview", desc: "Select domain, mode, and schedule time", icon: <Mic /> },
              { step: "3", title: "Take Interview", desc: "AI-powered interview with proctoring", icon: <Video /> },
              { step: "4", title: "Get Feedback", desc: "Detailed analytics and improvement plan", icon: <TrendingUp /> }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Ace Your Interview?</h2>
          <p className="text-blue-100 mb-8">Join thousands of successful candidates who practiced with AI</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-lg transition">
            Start Practicing Now <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};