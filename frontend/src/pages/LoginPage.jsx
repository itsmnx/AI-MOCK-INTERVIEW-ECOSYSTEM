// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      // Check onboarding status
      if (user?.onboardingCompleted === false) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
      toast.success('Logged in successfully!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('Google credential received');
    
    try {
      const response = await axios.post(`${API_URL}/auth/google`, {
        idToken: credentialResponse.credential
      });
      
      console.log('Backend response:', response.data);
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Set authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        toast.success('Logged in with Google!');
        
        // Check onboarding status
        if (response.data.user?.onboardingCompleted === false) {
          window.location.href = '/onboarding';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        toast.error(response.data.error || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error(error.response?.data?.error || 'Google login failed');
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    toast.error('Google login failed. Please try again.');
  };

  const handleSendOtp = async () => {
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }
    setSendingOtp(true);
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email: resetEmail });
      if (response.data.success) {
        setStep(2);
        toast.success(`OTP sent to ${resetEmail}`);
        if (response.data.otp) {
          console.log('OTP:', response.data.otp);
        }
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setResettingPassword(true);
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email: resetEmail,
        otp: otp,
        newPassword: newPassword
      });
      if (response.data.success) {
        toast.success('Password reset successfully! Please login with your new password.');
        setShowForgotPassword(false);
        setStep(1);
        setResetEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 to-purple-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-white text-xl font-bold">AI</span>
            </div>
            <span className="text-white text-xl font-bold">AI Mock Interview</span>
          </div>
          
          <div className="text-center">
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-white text-4xl font-bold">AI</span>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Welcome Back!</h2>
            <p className="text-blue-100 text-lg">Continue your interview preparation journey</p>
            <div className="mt-8 flex justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-blue-200 text-sm">Interviews</div>
              </div>
              <div className="w-px h-10 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">95%</div>
                <div className="text-blue-200 text-sm">Success</div>
              </div>
              <div className="w-px h-10 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-blue-200 text-sm">Companies</div>
              </div>
            </div>
          </div>
          
          <div className="text-center text-blue-200 text-sm">
            <p>© 2026 AI Mock Interview - By team BYTEFORCE</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <span className="text-white text-2xl font-bold">AI</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome Back!</h2>
            <p className="text-gray-400 mt-1">Sign in to continue</p>
          </div>

          {!showForgotPassword ? (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-xl">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white">Sign In</h1>
                <p className="text-gray-400 mt-1">Access your interview practice account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-400">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Sign In →</>
                  )}
                </button>
              </form>

              {/* Google Sign In Button */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-800/50 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_blue"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width="100%"
                  />
                </div>
              </div>

              <p className="text-center text-gray-400 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-400 font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          ) : (
            // Forgot Password Modal
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-xl">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white">Reset Password</h1>
                <p className="text-gray-400 mt-1">
                  {step === 1 ? 'Enter your email to receive OTP' : 'Enter OTP and new password'}
                </p>
              </div>

              {step === 1 ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                      placeholder="Enter your registered email"
                      required
                    />
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all duration-200"
                  >
                    {sendingOtp ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                    ) : (
                      'Send OTP'
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setStep(1);
                      setResetEmail('');
                      setOtp('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="w-full text-gray-400 hover:text-white transition"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={resetEmail}
                      disabled
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">OTP Code</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                      placeholder="Enter OTP sent to your email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={resettingPassword}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all duration-200"
                  >
                    {resettingPassword ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                    ) : (
                      'Reset Password'
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setStep(1);
                      setOtp('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="w-full text-gray-400 hover:text-white transition"
                  >
                    ← Resend OTP
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-6">
            <p className="text-gray-500 text-xs">Powered by AI</p>
          </div>
        </div>
      </div>
    </div>
  );
};