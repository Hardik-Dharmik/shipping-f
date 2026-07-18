import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { getOrganizationId } from '../../utils/userAccess.js';
import './Signup.css';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationMode: 'new',
    organizationName: '',
    organizationId: ''
  });
  const [errors, setErrors] = useState({});
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

  const handleOrganizationModeChange = (e) => {
    const organizationMode = e.target.value;
    setFormData(prev => ({
      ...prev,
      organizationMode,
      organizationName: organizationMode === 'new' ? prev.organizationName : '',
      organizationId: organizationMode === 'existing' ? prev.organizationId : ''
    }));
    setErrors(prev => ({
      ...prev,
      organizationMode: '',
      organizationName: '',
      organizationId: ''
    }));
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
    
    if (formData.organizationMode === 'new') {
      if (!formData.organizationName.trim()) {
        newErrors.organizationName = 'Organization name is required';
      }
    } else if (!formData.organizationId.trim()) {
      newErrors.organizationId = 'Organization ID is required';
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
          const organizationId =
            getOrganizationId(response?.user) ||
            response?.organization_id ||
            response?.org_id ||
            response?.data?.organization_id ||
            response?.data?.org_id;
          const successMessage = response.message || 'Registration successful! You can now sign in.';
          toast.success(
            organizationId
              ? `${successMessage} Organization ID: ${organizationId}`
              : successMessage
          );
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
            <label>Organization *</label>
            <div className="organization-options">
              <label className={`organization-option ${formData.organizationMode === 'new' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="organizationMode"
                  value="new"
                  checked={formData.organizationMode === 'new'}
                  onChange={handleOrganizationModeChange}
                />
                <div>
                  <span>New organization</span>
                  <small>I am the first user from my organization</small>
                </div>
              </label>
              <label className={`organization-option ${formData.organizationMode === 'existing' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="organizationMode"
                  value="existing"
                  checked={formData.organizationMode === 'existing'}
                  onChange={handleOrganizationModeChange}
                />
                <div>
                  <span>Employee of organization</span>
                  <small>I already have an organization ID</small>
                </div>
              </label>
            </div>
          </div>

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

          {formData.organizationMode === 'new' ? (
            <div className="form-group">
              <label htmlFor="organizationName">Organization Name *</label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Enter your organization name"
                className={errors.organizationName ? 'error' : ''}
              />
              {errors.organizationName && <span className="error-message">{errors.organizationName}</span>}
              <span className="field-hint">
                A new organization ID will be generated for your company after registration.
              </span>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="organizationId">Organization ID *</label>
              <input
                type="text"
                id="organizationId"
                name="organizationId"
                value={formData.organizationId}
                onChange={handleChange}
                placeholder="Enter your organization ID"
                className={errors.organizationId ? 'error' : ''}
              />
              {errors.organizationId && <span className="error-message">{errors.organizationId}</span>}
              <span className="field-hint">
                Employee accounts are linked to the same organization and do not require KYC.
              </span>
            </div>
          )}

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

