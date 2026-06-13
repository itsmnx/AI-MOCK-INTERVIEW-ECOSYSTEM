// frontend/src/pages/OnboardingPage.jsx - Complete Working Version
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  User, Briefcase, GraduationCap, Code2,
  Globe, Link, Camera, Save, ChevronRight, Loader2,
  MapPin, Phone, Mail, Award, Target, Clock, Plus, X,
  Trash2, Edit2, Upload, FileText, CheckCircle, Calendar,
  Building2, Heart, Zap, BookOpen, Star, FolderOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    profilePicture: null,
    profilePicturePreview: null,
    phone: '',
    location: '',
    bio: '',
    dateOfBirth: '',
    headline: '',
    currentRole: '',
    experienceYears: '',
    employmentType: '',
    skills: [],
    skillLevels: {},
    projects: [],
    certifications: [],
    education: [],
    workExperience: [],
    languages: [],
    github: '',
    linkedin: '',
    twitter: '',
    portfolio: '',
    targetRoles: [],
    targetCompanies: [],
    dreamCompany: '',
    salaryExpectation: '',
    relocationPreference: '',
    noticePeriod: ''
  });

  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [targetCompanyInput, setTargetCompanyInput] = useState('');
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  
  const [tempProject, setTempProject] = useState({ title: '', description: '', techStack: '', link: '', startDate: '', endDate: '' });
  const [tempCertification, setTempCertification] = useState({ name: '', issuer: '', date: '', credentialId: '', url: '' });
  const [tempEducation, setTempEducation] = useState({ degree: '', institution: '', year: '', percentage: '', location: '' });
  const [tempExperience, setTempExperience] = useState({ title: '', company: '', location: '', startDate: '', endDate: '', description: '', currentlyWorking: false });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfilePictureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Profile picture should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      const previewUrl = URL.createObjectURL(file);
      setFormData({ 
        ...formData, 
        profilePicture: file,
        profilePicturePreview: previewUrl
      });
      toast.success('Profile picture selected!');
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
        skillLevels: { ...formData.skillLevels, [skillInput.trim()]: skillLevel }
      });
      setSkillInput('');
      setSkillLevel('intermediate');
      toast.success('Skill added!');
    } else if (formData.skills.includes(skillInput.trim())) {
      toast.error('Skill already exists');
    }
  };

  const removeSkill = (skill) => {
    const newSkills = formData.skills.filter(s => s !== skill);
    const newSkillLevels = { ...formData.skillLevels };
    delete newSkillLevels[skill];
    setFormData({ ...formData, skills: newSkills, skillLevels: newSkillLevels });
    toast.success('Skill removed');
  };

  const addProject = () => {
    if (tempProject.title && tempProject.description) {
      setFormData({
        ...formData,
        projects: [...formData.projects, { ...tempProject, id: Date.now() }]
      });
      setTempProject({ title: '', description: '', techStack: '', link: '', startDate: '', endDate: '' });
      setShowProjectModal(false);
      toast.success('Project added!');
    } else {
      toast.error('Please fill project title and description');
    }
  };

  const removeProject = (projectId) => {
    setFormData({ ...formData, projects: formData.projects.filter(p => p.id !== projectId) });
    toast.success('Project removed');
  };

  const addCertification = () => {
    if (tempCertification.name && tempCertification.issuer) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, { ...tempCertification, id: Date.now() }]
      });
      setTempCertification({ name: '', issuer: '', date: '', credentialId: '', url: '' });
      setShowCertificationModal(false);
      toast.success('Certification added!');
    } else {
      toast.error('Please fill certification name and issuer');
    }
  };

  const removeCertification = (certId) => {
    setFormData({ ...formData, certifications: formData.certifications.filter(c => c.id !== certId) });
    toast.success('Certification removed');
  };

  const addEducation = () => {
    if (tempEducation.degree && tempEducation.institution) {
      setFormData({
        ...formData,
        education: [...formData.education, { ...tempEducation, id: Date.now() }]
      });
      setTempEducation({ degree: '', institution: '', year: '', percentage: '', location: '' });
      setShowEducationModal(false);
      toast.success('Education added!');
    } else {
      toast.error('Please fill degree and institution');
    }
  };

  const removeEducation = (eduId) => {
    setFormData({ ...formData, education: formData.education.filter(e => e.id !== eduId) });
    toast.success('Education removed');
  };

  const addExperience = () => {
    if (tempExperience.title && tempExperience.company) {
      setFormData({
        ...formData,
        workExperience: [...formData.workExperience, { ...tempExperience, id: Date.now() }]
      });
      setTempExperience({ title: '', company: '', location: '', startDate: '', endDate: '', description: '', currentlyWorking: false });
      setShowExperienceModal(false);
      toast.success('Work experience added!');
    } else {
      toast.error('Please fill job title and company');
    }
  };

  const removeExperience = (expId) => {
    setFormData({ ...formData, workExperience: formData.workExperience.filter(e => e.id !== expId) });
    toast.success('Experience removed');
  };

  const addTargetRole = () => {
    if (targetRoleInput.trim() && !formData.targetRoles.includes(targetRoleInput.trim())) {
      setFormData({ ...formData, targetRoles: [...formData.targetRoles, targetRoleInput.trim()] });
      setTargetRoleInput('');
      toast.success('Target role added!');
    }
  };

  const removeTargetRole = (role) => {
    setFormData({ ...formData, targetRoles: formData.targetRoles.filter(r => r !== role) });
  };

  const addTargetCompany = () => {
    if (targetCompanyInput.trim() && !formData.targetCompanies.includes(targetCompanyInput.trim())) {
      setFormData({ ...formData, targetCompanies: [...formData.targetCompanies, targetCompanyInput.trim()] });
      setTargetCompanyInput('');
      toast.success('Target company added!');
    }
  };

  const removeTargetCompany = (company) => {
    setFormData({ ...formData, targetCompanies: formData.targetCompanies.filter(c => c !== company) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let profilePictureUrl = null;
      if (formData.profilePicture) {
        const pictureFormData = new FormData();
        pictureFormData.append('profilePicture', formData.profilePicture);
        
        try {
          const uploadRes = await axios.post(`${API_URL}/upload/profile-picture`, pictureFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          profilePictureUrl = uploadRes.data.url;
        } catch (err) {
          console.log('Profile picture upload failed:', err);
        }
      }
      
      // IMPORTANT: Prepare submit data with onboardingCompleted = true
      const submitData = {
        ...formData,
        profilePicture: profilePictureUrl,
        skills: formData.skills,
        targetRoles: formData.targetRoles,
        targetCompanies: formData.targetCompanies,
        skillLevels: formData.skillLevels,
        projects: formData.projects,
        certifications: formData.certifications,
        education: formData.education,
        workExperience: formData.workExperience,
        onboardingCompleted: true  // ✅ Critical: Marks onboarding as complete
      };
      
      delete submitData.profilePicturePreview;
      
      await axios.post(`${API_URL}/onboarding`, submitData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Update local user state
      if (updateUser) {
        updateUser({ ...user, onboardingCompleted: true });
      }
      
      toast.success('Profile completed successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Profile save error:', error);
      toast.error(error.response?.data?.error || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (updateUser) {
      updateUser({ ...user, onboardingCompleted: true });
    }
    toast.success('You can complete your profile later from settings');
    navigate('/dashboard');
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: <User className="w-5 h-5" /> },
    { number: 2, title: 'Skills', icon: <Code2 className="w-5 h-5" /> },
    { number: 3, title: 'Experience', icon: <Briefcase className="w-5 h-5" /> },
    { number: 4, title: 'Career Goals', icon: <Target className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">Help us personalize your interview experience</p>
          <button onClick={handleSkip} className="mt-2 text-blue-400 text-sm hover:underline">
            Skip for now
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 overflow-x-auto">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.number)}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                  currentStep >= step.number
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-gray-700 text-gray-500'
                }`}
              >
                {step.number}
              </button>
              <span className="ml-2 text-xs text-gray-400 hidden sm:inline">{step.title}</span>
              {idx < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${currentStep > step.number ? 'bg-blue-500' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>
              
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                      {formData.profilePicturePreview ? (
                        <img src={formData.profilePicturePreview} className="w-full h-full object-cover" alt="Profile" />
                      ) : (
                        <User className="w-12 h-12 text-gray-500" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="absolute bottom-0 right-0 p-1 bg-blue-600 rounded-full hover:bg-blue-700 transition"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Upload a professional photo</p>
                    <p className="text-xs text-gray-500">JPG, PNG or GIF. Max 5MB</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Professional Headline</label>
                  <input type="text" name="headline" value={formData.headline} onChange={handleChange} placeholder="e.g., Senior Full Stack Developer" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Role</label>
                  <input type="text" name="currentRole" value={formData.currentRole} onChange={handleChange} placeholder="e.g., Software Engineer" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Years of Experience</label>
                  <select name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <option value="">Select</option>
                    <option value="0">Fresher (0 years)</option>
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="3">3 years</option>
                    <option value="4">4 years</option>
                    <option value="5">5+ years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="City, Country" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio / Summary</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="Tell us about yourself..." />
              </div>

              {/* Social Profiles */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Social Profiles (Optional)</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Link className="w-5 h-5 text-gray-400" />
                    <input type="text" name="github" value={formData.github} onChange={handleChange} placeholder="GitHub URL" className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <input type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="LinkedIn URL" className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="Portfolio Website" className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Skills & Certifications</h2>
              
              {/* Technical Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Technical Skills</label>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="e.g., React, Python" className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                  <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button onClick={addSkill} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center gap-2">
                      {skill} ({formData.skillLevels[skill]})
                      <button onClick={() => removeSkill(skill)} className="hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">Projects</label>
                  <button onClick={() => setShowProjectModal(true)} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Project
                  </button>
                </div>
                {formData.projects.length === 0 ? (
                  <div className="text-center py-8 bg-gray-700/30 rounded-lg border border-dashed border-gray-600">
                    <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No projects added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.projects.map((project) => (
                      <div key={project.id} className="p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white">{project.title}</h4>
                            <p className="text-sm text-gray-400 mt-1">{project.description}</p>
                          </div>
                          <button onClick={() => removeProject(project.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">Certifications</label>
                  <button onClick={() => setShowCertificationModal(true)} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Certification
                  </button>
                </div>
                {formData.certifications.length === 0 ? (
                  <div className="text-center py-8 bg-gray-700/30 rounded-lg border border-dashed border-gray-600">
                    <Award className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No certifications added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.certifications.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div>
                          <p className="font-medium text-white">{cert.name}</p>
                          <p className="text-sm text-gray-400">{cert.issuer}</p>
                        </div>
                        <button onClick={() => removeCertification(cert.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Education */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">Education</label>
                  <button onClick={() => setShowEducationModal(true)} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Education
                  </button>
                </div>
                {formData.education.length === 0 ? (
                  <div className="text-center py-8 bg-gray-700/30 rounded-lg border border-dashed border-gray-600">
                    <GraduationCap className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No education added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.education.map((edu) => (
                      <div key={edu.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div>
                          <p className="font-medium text-white">{edu.degree}</p>
                          <p className="text-sm text-gray-400">{edu.institution} • {edu.year}</p>
                        </div>
                        <button onClick={() => removeEducation(edu.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Work Experience */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Work Experience</h2>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">Work Experience</label>
                  <button onClick={() => setShowExperienceModal(true)} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Experience
                  </button>
                </div>
                {formData.workExperience.length === 0 ? (
                  <div className="text-center py-8 bg-gray-700/30 rounded-lg border border-dashed border-gray-600">
                    <Briefcase className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No work experience added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.workExperience.map((exp) => (
                      <div key={exp.id} className="p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white">{exp.title}</h4>
                            <p className="text-sm text-gray-400">{exp.company}</p>
                          </div>
                          <button onClick={() => removeExperience(exp.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Career Goals */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Career Goals</h2>
              
              {/* Target Roles */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Roles</label>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={targetRoleInput} onChange={(e) => setTargetRoleInput(e.target.value)} placeholder="e.g., Software Engineer" className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                  <button onClick={addTargetRole} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.targetRoles.map((role) => (
                    <span key={role} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-2">
                      {role}
                      <button onClick={() => removeTargetRole(role)} className="hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Dream Companies */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Dream Companies</label>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={targetCompanyInput} onChange={(e) => setTargetCompanyInput(e.target.value)} placeholder="e.g., Google" className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                  <button onClick={addTargetCompany} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.targetCompanies.map((company) => (
                    <span key={company} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm flex items-center gap-2">
                      {company}
                      <button onClick={() => removeTargetCompany(company)} className="hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Dream Company</label>
                  <input type="text" name="dreamCompany" value={formData.dreamCompany} onChange={handleChange} placeholder="Your ultimate dream company" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Salary Expectation (LPA)</label>
                  <input type="text" name="salaryExpectation" value={formData.salaryExpectation} onChange={handleChange} placeholder="e.g., 15-20 LPA" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Relocation Preference</label>
                  <select name="relocationPreference" value={formData.relocationPreference} onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <option value="">Select</option>
                    <option value="yes">Willing to relocate</option>
                    <option value="no">Not willing to relocate</option>
                    <option value="remote">Remote only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notice Period</label>
                  <select name="noticePeriod" value={formData.noticePeriod} onChange={handleChange} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <option value="">Select</option>
                    <option value="immediate">Immediate</option>
                    <option value="15">15 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
            {currentStep > 1 && (
              <button onClick={() => setCurrentStep(currentStep - 1)} className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                Previous
              </button>
            )}
            {currentStep < 4 ? (
              <button onClick={() => setCurrentStep(currentStep + 1)} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 ml-auto">
                Next <ChevronRight className="w-4 h-4 inline" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 ml-auto flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Complete Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Add Project</h2>
            <input type="text" placeholder="Project Title" value={tempProject.title} onChange={(e) => setTempProject({...tempProject, title: e.target.value})} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mb-3" />
            <textarea placeholder="Description" value={tempProject.description} onChange={(e) => setTempProject({...tempProject, description: e.target.value})} rows="3" className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mb-3" />
            <input type="text" placeholder="Tech Stack (comma separated)" value={tempProject.techStack} onChange={(e) => setTempProject({...tempProject, techStack: e.target.value})} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mb-3" />
            <div className="flex gap-3">
              <button onClick={() => setShowProjectModal(false)} className="flex-1 px-4 py-2 bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={addProject} className="flex-1 px-4 py-2 bg-blue-600 rounded-lg">Add</button>
            </div>
          </div>
        </div>
      )}

      {showCertificationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Add Certification</h2>
            <input type="text" placeholder="Certification Name" value={tempCertification.name} onChange={(e) => setTempCertification({...tempCertification, name: e.target.value})} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mb-3" />
            <input type="text" placeholder="Issuer" value={tempCertification.issuer} onChange={(e) => setTempCertification({...tempCertification, issuer: e.target.value})} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mb-3" />
            <div className="flex gap-3">
              <button onClick={() => setShowCertificationModal(false)} className="flex-1 px-4 py-2 bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={addCertification} className="flex-1 px-4 py-2 bg-blue-600 rounded-lg">Add</button>
            </div>
          </div>
        </div>
      )}

      {showEducationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Add Education</h2>
            <input type="text" placeholder="Degree" value={tempEducation.degree} onChange={(e) => setTempEducation({...tempEducation, degree: e.target.value})} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mb-3" />
            <input type="text" placeholder="Institution" value={tempEducation.institution} onChange={(e) => setTempEducation({...tempEducation, institution: e.target.value})} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mb-3" />
            <input type="text" placeholder="Year" value={tempEducation.year} onChange={(e) => setTempEducation({...tempEducation, year: e.target.value})} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mb-3" />
            <div className="flex gap-3">
              <button onClick={() => setShowEducationModal(false)} className="flex-1 px-4 py-2 bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={addEducation} className="flex-1 px-4 py-2 bg-blue-600 rounded-lg">Add</button>
            </div>
          </div>
        </div>
      )}

      {showExperienceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Add Work Experience</h2>
            <input type="text" placeholder="Job Title" value={tempExperience.title} onChange={(e) => setTempExperience({...tempExperience, title: e.target.value})} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mb-3" />
            <input type="text" placeholder="Company" value={tempExperience.company} onChange={(e) => setTempExperience({...tempExperience, company: e.target.value})} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mb-3" />
            <input type="text" placeholder="Location" value={tempExperience.location} onChange={(e) => setTempExperience({...tempExperience, location: e.target.value})} className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mb-3" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Start Date" value={tempExperience.startDate} onChange={(e) => setTempExperience({...tempExperience, startDate: e.target.value})} className="px-4 py-2 bg-gray-700 rounded-lg text-white" />
              {!tempExperience.currentlyWorking && (
                <input type="text" placeholder="End Date" value={tempExperience.endDate} onChange={(e) => setTempExperience({...tempExperience, endDate: e.target.value})} className="px-4 py-2 bg-gray-700 rounded-lg text-white" />
              )}
            </div>
            <label className="flex items-center gap-2 my-3">
              <input type="checkbox" checked={tempExperience.currentlyWorking} onChange={(e) => setTempExperience({...tempExperience, currentlyWorking: e.target.checked})} className="w-4 h-4 rounded" />
              <span className="text-gray-300">I currently work here</span>
            </label>
            <textarea placeholder="Job Description" value={tempExperience.description} onChange={(e) => setTempExperience({...tempExperience, description: e.target.value})} rows="3" className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mb-3" />
            <div className="flex gap-3">
              <button onClick={() => setShowExperienceModal(false)} className="flex-1 px-4 py-2 bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={addExperience} className="flex-1 px-4 py-2 bg-blue-600 rounded-lg">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};