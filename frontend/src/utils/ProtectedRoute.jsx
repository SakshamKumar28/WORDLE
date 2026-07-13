import { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import get from '../utils/api'

const ProtectedRoute = ({children}) => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    useEffect(()=>{
        async function checkAuth(){
            try{
                const response = await get('/auth/me');
                if(response && response.user){
                    setIsLoggedIn(true);
                }else{
                    setIsLoggedIn(false);
                    navigate('/register');
                }
            }catch(err){
                setIsLoggedIn(false);
                navigate('/register');
            }
        }

        checkAuth();
    }, [navigate]);
  return (
    <div>
      {children}
    </div>
  )
}

export default ProtectedRoute
