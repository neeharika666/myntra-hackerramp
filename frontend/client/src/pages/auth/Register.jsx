import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { register as registerUser, clearError } from '../../store/slices/authSlice.jsx';
import { FiEye, FiEyeOff, FiUser, FiMail, FiPhone, FiCalendar, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Auth.css';

// Validation schema using yup
const schema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .required('Name is required'),
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  phone: yup
    .string()
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number')
    .required('Phone number is required'),
  gender: yup
    .string()
    .oneOf(['Male', 'Female', 'Other'], 'Please select a valid gender')
    .required('Gender is required'),
  dateOfBirth: yup
    .date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .required('Date of birth is required'),
});

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  // Show toast on error and clear
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await dispatch(registerUser(registerData)).unwrap();
      toast.success('Registration successful!');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join us and start shopping</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {/* Name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                className={`form-input ${errors?.name ? 'error' : ''}`}
                {...register('name')}
              />
            </div>
            {errors?.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className={`form-input ${errors?.email ? 'error' : ''}`}
                {...register('email')}
              />
            </div>
            {errors?.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone Number</label>
            <div className="input-wrapper">
              <FiPhone className="input-icon" />
              <input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                className={`form-input ${errors?.phone ? 'error' : ''}`}
                {...register('phone')}
              />
            </div>
            {errors?.phone && <span className="form-error">{errors.phone.message}</span>}
          </div>

          {/* Gender & DOB */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender" className="form-label">Gender</label>
              <select
                id="gender"
                className={`form-input ${errors?.gender ? 'error' : ''}`}
                {...register('gender')}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors?.gender && <span className="form-error">{errors.gender.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
              <div className="input-wrapper">
                <FiCalendar className="input-icon" />
                <input
                  id="dateOfBirth"
                  type="date"
                  className={`form-input ${errors?.dateOfBirth ? 'error' : ''}`}
                  {...register('dateOfBirth')}
                />
              </div>
              {errors?.dateOfBirth && <span className="form-error">{errors.dateOfBirth.message}</span>}
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                className={`form-input ${errors?.password ? 'error' : ''}`}
                {...register('password')}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors?.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                className={`form-input ${errors?.confirmPassword ? 'error' : ''}`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors?.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
          </div>

          {/* Terms */}
          <div className="form-options">
            <label className="checkbox-wrapper">
              <input type="checkbox" required />
              <span className="checkmark"></span>
              I agree to the{' '}
              <Link to="/terms" className="terms-link">Terms of Service</Link> and{' '}
              <Link to="/privacy" className="terms-link">Privacy Policy</Link>
            </label>
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-primary btn-lg auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
