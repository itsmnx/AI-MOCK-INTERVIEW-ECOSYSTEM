// frontend/src/pages/ProfilePage.jsx - Without Profile Picture
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Code2, Edit2, Save, X, Award, Target, Clock,
  Trash2, Plus, FolderOpen, Building2, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [formData, setFormData] = useState({
    headline: '',
    phone: '',
    location: '',
    bio: '',
    skills: [],
    projects: [],
    education: [],
    workExperience: [],
    certifications: [],
    github: '',
    linkedin: '',
    portfolio: '',
    targetRoles: [],
    targetCompanies: [],
    dreamCompany: '',
    salaryExpectation: '',
    relocationPreference: '',
    noticePeriod: ''
  });

  const [modal, setModal] = useState({ open: false, type: '', data: {} });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      const profileData = response.data.profile;
      setProfile(profileData);
      if (profileData) {
        setFormData({
          headline: profileData.headline || '',
          phone: profileData.phone || '',
          location: profileData.location || '',
          bio: profileData.bio || '',
          skills: profileData.skills || [],
          projects: profileData.projects || [],
          education: profileData.education || [],
          workExperience: profileData.workExperience || [],
          certifications: profileData.certifications || [],
          github: profileData.github || '',
          linkedin: profileData.linkedin || '',
          portfolio: profileData.portfolio || '',
          targetRoles: profileData.targetRoles || [],
          targetCompanies: profileData.targetCompanies || [],
          dreamCompany: profileData.dreamCompany || '',
          salaryExpectation: profileData.salaryExpectation || '',
          relocationPreference: profileData.relocationPreference || '',
          noticePeriod: profileData.noticePeriod || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (type, item) => {
    setFormData(prev => ({ ...prev, [type]: [...prev[type], { ...item, id: Date.now() }] }));
    setModal({ open: false, type: '', data: {} });
    toast.success(`Added`);
  };

  const removeItem = (type, index) => {
    setFormData(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
    toast.success('Removed');
  };

  const handleSave = async () => {
    try {
      const submitData = { ...formData };
      await axios.post(`${API_URL}/onboarding`, submitData);
      toast.success('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  // Get user initials
  const getInitials = () => {
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header - Without Profile Picture */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Initials Avatar instead of profile picture */}
            <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {getInitials()}
              </span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white">{user?.firstName} {user?.lastName}</h1>
              {editing ? (
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="mt-2 px-3 py-1 bg-white/20 rounded text-white placeholder-white/50 w-full md:w-96"
                  placeholder="Your headline"
                />
              ) : (
                <p className="text-blue-200 mt-1">{formData.headline || 'Add your headline'}</p>
              )}
            </div>
            <button onClick={() => editing ? handleSave() : setEditing(true)} className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2">
              {editing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              {editing ? 'Save' : 'Edit'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700">
          {['overview', 'skills', 'projects', 'certifications', 'preferences'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-medium capitalize transition-all ${activeTab === tab ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">About</h2>
              {editing ? (
                <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows="4" className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white" placeholder="Tell us about yourself..." />
              ) : (
                <p className="text-gray-300">{formData.bio || 'No bio added yet'}</p>
              )}
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Contact</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300"><Mail className="w-5 h-5 text-blue-500" /><span>{user?.email}</span></div>
                <div className="flex items-center gap-3 text-gray-300"><Phone className="w-5 h-5 text-blue-500" />{editing ? <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="flex-1 px-3 py-1 bg-gray-700 rounded-lg text-white" placeholder="Phone" /> : <span>{formData.phone || 'Not added'}</span>}</div>
                <div className="flex items-center gap-3 text-gray-300"><MapPin className="w-5 h-5 text-blue-500" />{editing ? <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="flex-1 px-3 py-1 bg-gray-700 rounded-lg text-white" placeholder="Location" /> : <span>{formData.location || 'Not added'}</span>}</div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Social Profiles</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 text-gray-400 font-bold">GH</span>
                  {editing ? (
                    <input type="url" value={formData.github} onChange={(e) => setFormData({ ...formData, github: e.target.value })} className="flex-1 px-3 py-1 bg-gray-700 rounded-lg text-white" placeholder="GitHub URL" />
                  ) : (
                    <a href={formData.github} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{formData.github || 'Not added'}</a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 text-blue-400 font-bold">IN</span>
                  {editing ? (
                    <input type="url" value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} className="flex-1 px-3 py-1 bg-gray-700 rounded-lg text-white" placeholder="LinkedIn URL" />
                  ) : (
                    <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{formData.linkedin || 'Not added'}</a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 text-gray-400 font-bold">🌐</span>
                  {editing ? (
                    <input type="url" value={formData.portfolio} onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })} className="flex-1 px-3 py-1 bg-gray-700 rounded-lg text-white" placeholder="Portfolio URL" />
                  ) : (
                    <a href={formData.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{formData.portfolio || 'Not added'}</a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Technical Skills</h2>
              {editing && <button onClick={() => setModal({ open: true, type: 'skills', data: { name: '', level: 'intermediate' } })} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Skill</button>}
            </div>
            <div className="flex flex-wrap gap-3">
              {formData.skills.map((skill, idx) => (
                <div key={idx} className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-4 py-2 flex items-center gap-2">
                  <span className="text-blue-400 font-medium">{skill}</span>
                  {editing && <button onClick={() => removeItem('skills', idx)} className="text-red-400"><X className="w-3 h-3" /></button>}
                </div>
              ))}
              {formData.skills.length === 0 && <p className="text-gray-400">No skills added</p>}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Projects</h2>
              {editing && <button onClick={() => setModal({ open: true, type: 'projects', data: { title: '', description: '', techStack: '' } })} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Project</button>}
            </div>
            {formData.projects.length === 0 ? <p className="text-gray-400">No projects added</p> : (
              <div className="space-y-4">
                {formData.projects.map((project, idx) => (
                  <div key={idx} className="p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex justify-between">
                      <div><h3 className="font-semibold text-white">{project.title}</h3><p className="text-gray-400 text-sm mt-1">{project.description}</p>{project.techStack && <div className="flex flex-wrap gap-1 mt-2">{project.techStack.split(',').map((t, i) => <span key={i} className="text-xs px-2 py-0.5 bg-gray-600 rounded-full">{t.trim()}</span>)}</div>}</div>
                      {editing && <button onClick={() => removeItem('projects', idx)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Certifications</h2>
              {editing && <button onClick={() => setModal({ open: true, type: 'certifications', data: { name: '', issuer: '', date: '' } })} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Certification</button>}
            </div>
            {formData.certifications.length === 0 ? <p className="text-gray-400">No certifications added</p> : (
              <div className="space-y-3">
                {formData.certifications.map((cert, idx) => (
                  <div key={idx} className="p-3 bg-gray-700/30 rounded-lg flex justify-between">
                    <div><p className="font-medium text-white">{cert.name}</p><p className="text-sm text-gray-400">{cert.issuer} • {cert.date}</p></div>
                    {editing && <button onClick={() => removeItem('certifications', idx)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Target Roles</h2>
              <div className="flex flex-wrap gap-2">
                {formData.targetRoles.map((role, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-2">{role}{editing && <button onClick={() => removeItem('targetRoles', idx)} className="hover:text-red-400">×</button>}</span>
                ))}
                {editing && <button onClick={() => setModal({ open: true, type: 'targetRoles', data: '' })} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm hover:bg-gray-600">+ Add Role</button>}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Career Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-1">Dream Company</label>{editing ? <input type="text" value={formData.dreamCompany} onChange={(e) => setFormData({ ...formData, dreamCompany: e.target.value })} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" /> : <p className="text-gray-300">{formData.dreamCompany || 'Not specified'}</p>}</div>
                <div><label className="block text-sm text-gray-400 mb-1">Salary Expectation</label>{editing ? <input type="text" value={formData.salaryExpectation} onChange={(e) => setFormData({ ...formData, salaryExpectation: e.target.value })} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white" placeholder="e.g., 15-20 LPA" /> : <p className="text-gray-300">{formData.salaryExpectation || 'Not specified'}</p>}</div>
                <div><label className="block text-sm text-gray-400 mb-1">Relocation</label>{editing ? <select value={formData.relocationPreference} onChange={(e) => setFormData({ ...formData, relocationPreference: e.target.value })} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"><option value="">Select</option><option value="yes">Willing to relocate</option><option value="no">Not willing</option><option value="remote">Remote only</option></select> : <p className="text-gray-300">{formData.relocationPreference === 'yes' ? 'Willing to relocate' : formData.relocationPreference === 'no' ? 'Not willing' : formData.relocationPreference === 'remote' ? 'Remote only' : 'Not specified'}</p>}</div>
                <div><label className="block text-sm text-gray-400 mb-1">Notice Period</label>{editing ? <select value={formData.noticePeriod} onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })} className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"><option value="">Select</option><option value="immediate">Immediate</option><option value="15">15 days</option><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option></select> : <p className="text-gray-300">{formData.noticePeriod || 'Not specified'}</p>}</div>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Adding Items */}
        {modal.open && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-white mb-4 capitalize">Add {modal.type === 'targetRoles' ? 'Target Role' : modal.type.slice(0, -1)}</h2>
              {modal.type === 'skills' && (
                <div className="space-y-3">
                  <input type="text" placeholder="Skill name" value={modal.data.name} onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white" />
                  <select value={modal.data.level} onChange={(e) => setModal({ ...modal, data: { ...modal.data, level: e.target.value } })} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select>
                  <div className="flex gap-3"><button onClick={() => setModal({ open: false, type: '', data: {} })} className="flex-1 px-4 py-2 bg-gray-700 rounded-lg">Cancel</button><button onClick={() => addItem('skills', modal.data.name)} className="flex-1 px-4 py-2 bg-blue-600 rounded-lg">Add</button></div>
                </div>
              )}
              {modal.type === 'projects' && (
                <div className="space-y-3">
                  <input type="text" placeholder="Project Title" value={modal.data.title} onChange={(e) => setModal({ ...modal, data: { ...modal.data, title: e.target.value } })} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white" />
                  <textarea placeholder="Description" value={modal.data.description} onChange={(e) => setModal({ ...modal, data: { ...modal.data, description: e.target.value } })} rows="3" className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white" />
                  <input type="text" placeholder="Tech Stack" value={modal.data.techStack} onChange={(e) => setModal({ ...modal, data: { ...modal.data, techStack: e.target.value } })} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white" />
                  <div className="flex gap-3"><button onClick={() => setModal({ open: false, type: '', data: {} })} className="flex-1 px-4 py-2 bg-gray-700 rounded-lg">Cancel</button><button onClick={() => addItem('projects', modal.data)} className="flex-1 px-4 py-2 bg-blue-600 rounded-lg">Add</button></div>
                </div>
              )}
              {modal.type === 'certifications' && (
                <div className="space-y-3">
                  <input type="text" placeholder="Certification Name" value={modal.data.name} onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white" />
                  <input type="text" placeholder="Issuer" value={modal.data.issuer} onChange={(e) => setModal({ ...modal, data: { ...modal.data, issuer: e.target.value } })} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white" />
                  <input type="text" placeholder="Date" value={modal.data.date} onChange={(e) => setModal({ ...modal, data: { ...modal.data, date: e.target.value } })} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white" />
                  <div className="flex gap-3"><button onClick={() => setModal({ open: false, type: '', data: {} })} className="flex-1 px-4 py-2 bg-gray-700 rounded-lg">Cancel</button><button onClick={() => addItem('certifications', modal.data)} className="flex-1 px-4 py-2 bg-blue-600 rounded-lg">Add</button></div>
                </div>
              )}
              {modal.type === 'targetRoles' && (
                <div className="space-y-3">
                  <input type="text" placeholder="Role (e.g., Software Engineer)" value={modal.data} onChange={(e) => setModal({ ...modal, data: e.target.value })} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white" />
                  <div className="flex gap-3"><button onClick={() => setModal({ open: false, type: '', data: {} })} className="flex-1 px-4 py-2 bg-gray-700 rounded-lg">Cancel</button><button onClick={() => addItem('targetRoles', modal.data)} className="flex-1 px-4 py-2 bg-blue-600 rounded-lg">Add</button></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};