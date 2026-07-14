import React, { useState } from 'react'
import { Swords, Eye, EyeOff, Mail, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(''); // Handles server errors gracefully
  
  // Validation States
  const [isEmailTouched, setIsEmailTouched] = useState(false);

  // 1. Email Validation Logic
  const validateEmail = (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };
  const isEmailValid = validateEmail(email);

  // 2. Password Strength Logic
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

  const strength = getPasswordStrength(password);

  // 3. Robust Authentication Workflow
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(''); // Reset errors from prior attempts

    if (!isEmailValid || strength.score < 2) {
      setIsEmailTouched(true);
      return;
    }

    try {
      setIsLoading(true);
      // Sticking strictly to your v1 routing spec
      const response = await api.post('/v1/auth/login', { email, password });
      toast.success('Login successful!');
      console.log('Login successful:', response);
      navigate('/dashboard');
    } catch (error) {
      console.error('Authentication Error:', error);
      // Grabs custom errors from backend if available, or falls back to standard text
      const errorMessage = error.response?.data?.message || 'Invalid email or password. Please try again.';
      toast.error(errorMessage);
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className='min-h-screen w-full bg-[#f8f9fa] flex justify-center items-center px-4'>
      <div className='w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl shadow-xl shadow-zinc-200/40 p-8 md:p-10 flex flex-col'>
        
        {/* Logo Zone */}
        <div className='flex flex-col items-center text-center space-y-2 mb-6'>
          <div className='w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md transform rotate-3'>
            <Swords className='text-[#6aaa64] w-6 h-6' />
          </div>
          <h2 className='font-black text-2xl tracking-tight text-zinc-950 pt-2'>LOGIN MATE</h2>
          <p className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>Enter the arena</p>
        </div>

        {/* Global API Error Alert Window */}
        {apiError && (
          <div className='mb-4 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-fadeIn'>
            <AlertCircle size={16} className='shrink-0 mt-0.5' />
            <span>{apiError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-5'>
          
          {/* Email Input Field */}
          <div className='flex flex-col space-y-1.5'>
            <div className='flex justify-between items-center'>
              <label className='text-xs font-bold text-zinc-700 tracking-wide uppercase' htmlFor='email'>
                Email Address
              </label>
              {isEmailTouched && (
                <span className={`text-xs font-bold flex items-center gap-1 ${isEmailValid ? 'text-[#6aaa64]' : 'text-red-500'}`}>
                  {isEmailValid ? (
                    <>
                      <CheckCircle2 size={12} /> Valid Email
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} /> Invalid Email
                    </>
                  )}
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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEmailTouched(true);
                }}
                onBlur={() => setIsEmailTouched(true)}
                placeholder='you@example.com'
                className={`w-full pl-10 pr-4 py-3 bg-zinc-50 border rounded-xl text-zinc-900 placeholder-zinc-400 font-medium focus:outline-none focus:bg-white transition-all text-sm disabled:opacity-60
                  ${!isEmailTouched ? 'border-zinc-200 focus:border-zinc-900' : isEmailValid ? 'border-[#6aaa64]/60 focus:border-[#6aaa64]' : 'border-red-400 focus:border-red-500 bg-red-50/10'}`}
              />
            </div>
          </div>

          {/* Password Input Field */}
          <div className='flex flex-col space-y-1.5'>
            <div className='flex justify-between items-center'>
              <label className='text-xs font-bold text-zinc-700 tracking-wide uppercase' htmlFor='password'>
                Password
              </label>
              {password && (
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* Dynamic Password Strength Meter Grid */}
            <div className='grid grid-cols-3 gap-2 pt-1'>
              <div className={`h-1.5 rounded-full transition-all duration-300 ${password ? (strength.score >= 1 ? strength.color : 'bg-zinc-200') : 'bg-zinc-200'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${password ? (strength.score >= 2 ? strength.color : 'bg-zinc-200') : 'bg-zinc-200'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${password ? (strength.score === 3 ? strength.color : 'bg-zinc-200') : 'bg-zinc-200'}`} />
            </div>
          </div>

          {/* Submit Button showing Loading Spinner dynamically */}
          <button
            type='submit'
            disabled={isLoading || (email.length > 0 && (!isEmailValid || strength.score === 1))}
            className='w-full py-4 mt-2 bg-zinc-900 text-white font-bold rounded-xl shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 duration-200 text-sm'
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className='animate-spin' />
                Connecting...
              </>
            ) : (
              'Sign In & Play'
            )}
          </button>
        </form>

        <div className='mt-8 text-center'>
          <p className='text-xs text-zinc-500 font-medium'>
            New to the grid?{' '}
            <a href='/register' className='font-bold text-zinc-950 hover:underline'>Create an account</a>
          </p>
        </div>

      </div>
    </section>
  )
}

export default Login