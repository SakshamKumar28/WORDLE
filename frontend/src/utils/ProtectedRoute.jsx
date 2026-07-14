import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; // Standardizing import to match your previous files
import { Loader2, Swords } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Prevents unauthorized UI flashing

  useEffect(() => {
    let isMounted = true; // Clean cleanup flag to prevent memory leaks

    async function checkAuth() {
      try {
        // Sticking to your api layout setup (assuming api.get or standard config handles the method)
        const response = await api.get('/v1/auth/me');

        if (isMounted) {
          if (response && response.data?.user) {
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
            navigate('/register', { replace: true }); // replace: true prevents back-button loops
          }
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        if (isMounted) {
          setIsLoggedIn(false);
          navigate('/register', { replace: true });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false; // Cancels state updates if component unmounts mid-request
    };
  }, [navigate]);

  // 1. Show a clean arena-themed loader while checking token states
  if (isLoading) {
    return (
      <div className='min-h-screen w-full bg-[#f8f9fa] flex flex-col items-center justify-center gap-4'>
        <div className='w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md animate-bounce'>
          <Swords className='text-[#6aaa64] w-6 h-6' />
        </div>
        <div className='flex items-center gap-2 text-zinc-500 font-bold text-sm uppercase tracking-wider'>
          <Loader2 size={16} className='animate-spin text-zinc-400' />
          Verifying Arena Access...
        </div>
      </div>
    );
  }

  // 2. Only render children if verified successfully
  return isLoggedIn ? <>{children}</> : null;
};

export default ProtectedRoute;