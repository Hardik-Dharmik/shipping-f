import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import './Signup.css';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    file: null
  });
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file: file
      }));
      setFileName(file.name);
      // Clear error
      if (errors.file) {
        setErrors(prev => ({
          ...prev,
          file: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.file) {
      newErrors.file = 'Please upload a file';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (validateForm()) {
      setLoading(true);
      try {
        const response = await api.signup(formData);
        console.log('Signup successful:', response);
        
        // Show success toast
        if (response.success) {
          toast.success(response.message || 'Registration successful! Your account is pending admin approval.');
          // Navigate to login page after successful signup
          navigate('/login');
        } else {
          const errorMsg = response.error || 'Registration failed. Please try again.';
          setSubmitError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error) {
        console.error('Signup error:', error);
        const errorMsg = error.message || 'Signup failed. Please try again.';
        setSubmitError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <h1>Create Account</h1>
          <p>Sign up to get started</p>
        </div>
        
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="companyName">Company Name *</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Enter your company name"
              className={errors.companyName ? 'error' : ''}
            />
            {errors.companyName && <span className="error-message">{errors.companyName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="file">Upload File *</label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                id="file"
                name="file"
                onChange={handleFileChange}
                className={`file-input ${errors.file ? 'error' : ''}`}
                accept="*/*"
              />
              <label htmlFor="file" className="file-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>{fileName || 'Choose file or drag and drop'}</span>
              </label>
            </div>
            {errors.file && <span className="error-message">{errors.file}</span>}
            {fileName && (
              <span className="file-name-display">
                Selected: {fileName}
              </span>
            )}
          </div>

          {submitError && (
            <div className="submit-error">
              {submitError}
            </div>
          )}

          <button type="submit" className="btn-signup" disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>

          <div className="form-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="link">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;

