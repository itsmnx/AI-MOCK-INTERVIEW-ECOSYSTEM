// frontend/src/components/Navbar.jsx - Show initials only
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Activity, LogOut, User, Calendar, LayoutDashboard, 
  FileText, Menu, X, ChevronDown, Briefcase
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Pages where navbar should be hidden
  const hiddenNavbarRoutes = [
    '/',
    '/login',
    '/register',
    '/onboarding',
  ];

  const shouldHideNavbar = () => {
    const pathname = location.pathname;
    if (hiddenNavbarRoutes.includes(pathname)) return true;
    if (pathname.includes('/chat-interview/')) return true;
    if (pathname.includes('/video-interview/')) return true;
    if (pathname.includes('/interview/') && !pathname.includes('/select')) return true;
    return false;
  };

  if (shouldHideNavbar()) return null;
  if (!user) return null;

  // Get user initials
  const getInitials = () => {
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/interview/select', label: 'Interview', icon: <Briefcase className="w-4 h-4" /> },
    { path: '/questions', label: 'Questions', icon: <FileText className="w-4 h-4" /> },
    { path: '/sessions/history', label: 'History', icon: <Calendar className="w-4 h-4" /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <Activity className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              MOCKUP AI
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right side - Profile Menu with Initials */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition border border-gray-700"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getInitials()}
                  </span>
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role || 'Candidate'}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-xl shadow-xl border border-gray-700 z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {getInitials()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{user?.firstName} {user?.lastName}</p>
                          <p className="text-sm text-gray-400">{user?.email}</p>
                          <p className="text-xs text-gray-500 capitalize">{user?.role || 'Candidate'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 transition w-full"
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </Link>
                    </div>
                    
                    <div className="border-t border-gray-700 py-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 transition ${
                  isActive(link.path)
                    ? 'bg-blue-500/20 text-blue-400 border-l-4 border-blue-500'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
            
            <div className="border-t border-gray-800 mt-2 pt-2">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800"
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};