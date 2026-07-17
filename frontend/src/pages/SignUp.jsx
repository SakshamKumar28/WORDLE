import React, { useState } from 'react'
import { Swords, Eye, EyeOff, Mail, Lock, User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  // Tracking touched states for clean UX inline validation
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false
  });

  // Input state handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
  };

  // 1. Basic Field Validations
  const isFirstNameValid = formData.firstName.trim().length >= 2;
  const isLastNameValid = formData.lastName.trim().length >= 1;
  
  // 2. Email Verification regex pattern
  const validateEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };
  const isEmailValid = validateEmail(formData.email);

  // 3. Game Strength scoring system
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-zinc-200', textColor: 'text-zinc-400' };
    
    let score = 0;
    if (pass.length >= 6) score++; 
    if (/[0-9]/.test(pass)) score++; 
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++; 

    if (score === 1) return { score, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
    if (score === 2) return { score, label: 'Moderate', color: 'bg-[#c9b458]', textColor: 'text-[#c9b458]' };
    return { score, label: 'Strong', color: 'bg-[#6aaa64]', textColor: 'text-[#6aaa64]' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    // Set all fields to touched on final submission check
    setTouched({ firstName: true, lastName: true, email: true, password: true });

    if (isFirstNameValid && isLastNameValid && isEmailValid && strength.score >= 2) {
      try {
        setIsLoading(true);
        // Clean handling using your custom api utility setup
        const responseData = await api.post('/v1/auth/register', formData);
        toast.success('Account created successfully!');
        console.log('Registration Successful:', responseData);
        
        // Push user along to login screen upon successful registration
        navigate('/login');
      } catch (error) {
        const errorMessage = error.message || 'Something went wrong. Please try again.';
        console.error('Registration API Error:', error);
        toast.error(errorMessage);
        setApiError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <section className='min-h-screen w-full bg-[#f8f9fa] flex justify-center items-center px-4 py-12'>
      
      {/* Registration Container Card */}
      <div className='w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl shadow-xl shadow-zinc-200/40 p-8 md:p-10 flex flex-col'>
        
        {/* Header Zone */}
        <div className='flex flex-col items-center text-center space-y-2 mb-6'>
          <div className='w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md transform -rotate-3'>
            <Swords className='text-[#6aaa64] w-6 h-6' />
          </div>
          <h2 className='font-black text-2xl tracking-tight text-zinc-950 pt-2'>CREATE ACCOUNT</h2>
          <p className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>Claim your arena tag</p>
        </div>

        {/* Global Server/API Error Banner Container */}
        {apiError && (
          <div className='mb-4 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2.5'>
            <AlertCircle size={16} className='shrink-0 mt-0.5' />
            <span>{apiError}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          
          {/* Row Component: First and Last Name Grid */}
          <div className='grid grid-cols-2 gap-4'>
            {/* First Name Column */}
            <div className='flex flex-col space-y-1.5'>
              <label className='text-xs font-bold text-zinc-700 uppercase tracking-wide' htmlFor='firstName'>First Name</label>
              <div className='relative flex items-center'>
                <User className='absolute left-3 text-zinc-400 w-4 h-4 pointer-events-none' />
                <input
                  id='firstName'
                  type='text'
                  required
                  disabled={isLoading}
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('firstName')}
                  placeholder='Alex'
                  className={`w-full pl-9 pr-3 py-2.5 bg-zinc-50 border rounded-xl text-zinc-900 placeholder-zinc-400 font-medium focus:outline-none focus:bg-white transition-all text-sm disabled:opacity-60
                    ${!touched.firstName ? 'border-zinc-200 focus:border-zinc-900' : isFirstNameValid ? 'border-[#6aaa64]/60' : 'border-red-400 bg-red-50/10'}`}
                />
              </div>
            </div>

            {/* Last Name Column */}
            <div className='flex flex-col space-y-1.5'>
              <label className='text-xs font-bold text-zinc-700 uppercase tracking-wide' htmlFor='lastName'>Last Name</label>
              <input
                id='lastName'
                type='text'
                required
                disabled={isLoading}
                value={formData.lastName}
                onChange={handleChange}
                onBlur={() => handleBlur('lastName')}
                placeholder='Smith'
                className={`w-full px-3 py-2.5 bg-zinc-50 border rounded-xl text-zinc-900 placeholder-zinc-400 font-medium focus:outline-none focus:bg-white transition-all text-sm disabled:opacity-60
                  ${!touched.lastName ? 'border-zinc-200 focus:border-zinc-900' : isLastNameValid ? 'border-[#6aaa64]/60' : 'border-red-400 bg-red-50/10'}`}
              />
            </div>
          </div>

          {/* Email Block Field */}
          <div className='flex flex-col space-y-1.5'>
            <div className='flex justify-between items-center'>
              <label className='text-xs font-bold text-zinc-700 uppercase tracking-wide' htmlFor='email'>Email Address</label>
              {touched.email && (
                <span className={`text-[11px] font-bold flex items-center gap-0.5 ${isEmailValid ? 'text-[#6aaa64]' : 'text-red-500'}`}>
                  {isEmailValid ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                  {isEmailValid ? 'Valid' : 'Invalid format'}
                </span>
              )}
            </div>
            <div className='relative flex items-center'>
              <Mail className='absolute left-3 text-zinc-400 w-5 h-5 pointer-events-none' />
              <input
                id='email'
                type='email'
                required
                disabled={isLoading}
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                placeholder='you@example.com'
                className={`w-full pl-10 pr-4 py-3 bg-zinc-50 border rounded-xl text-zinc-900 placeholder-zinc-400 font-medium focus:outline-none focus:bg-white transition-all text-sm disabled:opacity-60
                  ${!touched.email ? 'border-zinc-200 focus:border-zinc-900' : isEmailValid ? 'border-[#6aaa64]/60' : 'border-red-400 bg-red-50/10'}`}
              />
            </div>
          </div>

          {/* Password Block Field */}
          <div className='flex flex-col space-y-1.5'>
            <div className='flex justify-between items-center'>
              <label className='text-xs font-bold text-zinc-700 uppercase tracking-wide' htmlFor='password'>Password</label>
              {formData.password && (
                <span className={`text-xs font-black uppercase tracking-wider ${strength.textColor}`}>
                  {strength.label}
                </span>
              )}
            </div>
            <div className='relative flex items-center'>
              <Lock className='absolute left-3 text-zinc-400 w-5 h-5 pointer-events-none' />
              <input
                id='password'
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                placeholder='••••••••'
                className='w-full pl-10 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 font-medium focus:outline-none focus:border-zinc-900 focus:bg-white transition-all text-sm disabled:opacity-60'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 text-zinc-400 hover:text-zinc-600 focus:outline-none'
              >
                {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
              </button>
            </div>

            {/* Battle Strength Meter Blocks */}
            <div className='grid grid-cols-3 gap-2 pt-1'>
              <div className={`h-1.5 rounded-full transition-all duration-300 ${formData.password ? (strength.score >= 1 ? strength.color : 'bg-zinc-200') : 'bg-zinc-200'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${formData.password ? (strength.score >= 2 ? strength.color : 'bg-zinc-200') : 'bg-zinc-200'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${formData.password ? (strength.score === 3 ? strength.color : 'bg-zinc-200') : 'bg-zinc-200'}`} />
            </div>
          </div>

          {/* Call to Action Trigger */}
          <button
            type='submit'
            disabled={isLoading || (formData.email.length > 0 && (!isEmailValid || strength.score === 1 || !isFirstNameValid))}
            className='w-full py-3.5 mt-2 bg-zinc-900 text-white font-bold rounded-xl shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 duration-200 text-sm'
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className='animate-spin' />
                Deploying Account...
              </>
            ) : (
              'Create Account & Battle'
            )}
          </button>
        </form>

        {/* Existing User Redirect Link */}
        <div className='mt-6 text-center'>
          <p className='text-xs text-zinc-500 font-medium'>
            Already have an account?{' '}
            <a href='/login' className='font-bold text-zinc-950 hover:underline'>Log In</a>
          </p>
        </div>

      </div>
    </section>
  )
}

export default SignUp