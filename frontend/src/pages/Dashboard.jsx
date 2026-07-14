import React, { useEffect, useState } from 'react'
import { Swords, Users, Trophy, Flame, Target, Sparkles, UserPlus, Play, Circle, LogOut, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null); // Initialize as null to handle dynamic loading states cleanly
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function getUser() {
      try {
        const response = await api.get('/v1/auth/me');
        // Safely capture the user nested object based on your backend log shape
        if (response.data && response.data.user && isMounted) {
          setUserData(response.data.user);
        }
      } catch (err) {
        console.error("Error pulling player profile data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    
    getUser();
    return () => { isMounted = false; };
  }, []);
  
  const [friends, setFriends] = useState([
    { id: 1, name: 'Alex_GuesseS', status: 'online', isPlaying: false },
    { id: 2, name: 'Vocal_Sniper', status: 'online', isPlaying: true },
    { id: 3, name: 'LexiconLover', status: 'offline', isPlaying: false },
  ]);

  const handleLogout = async () => {
    try {
      const responseData = await api.post('/v1/auth/logout', {});
      if (responseData) navigate('/login');
    } catch (err) {
      console.error("Logout verification drop caught:", err);
    }
  };

  // Render a clean structural loader window until the user's profile context resolves
  if (isLoading || !userData) {
    return (
      <div className='min-h-screen w-full bg-[#f8f9fa] flex flex-col items-center justify-center gap-3'>
        <Loader2 className='animate-spin text-[#6aaa64] w-8 h-8' />
        <span className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>Syncing Arena Stats...</span>
      </div>
    );
  }

  // Fallback defaults for analytics blocks if not present yet on the backend model
  const winStreak = userData.winStreak ?? 0;
  const winRate = userData.winRate ?? '0%';
  const gamesPlayed = userData.gamesPlayed ?? 0;
  const initialLetter = userData.firstName ? userData.firstName[0].toUpperCase() : 'W';

  return (
    <main className='min-h-screen w-full bg-[#f8f9fa] text-zinc-900 font-sans flex flex-col md:flex-row'>
      
      {/* Sidebar Navigation */}
      <aside className='w-full md:w-64 bg-zinc-950 text-white flex flex-col justify-between p-6 shrink-0'>
        <div className='space-y-8'>
          {/* Logo */}
          <div className='flex items-center gap-2 font-black tracking-wider text-xl'>
            <Swords size={22} className='text-[#6aaa64]' />
            <span>WORDLE<span className='text-[#c9b458]'>.BATTLE</span></span>
          </div>

          {/* User Preview */}
          <div className='p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-3'>
            <div className='w-10 h-10 bg-[#6aaa64] text-white font-black rounded-lg flex items-center justify-center shadow-inner text-base'>
              {initialLetter}
            </div>
            <div className='flex flex-col min-w-0'>
              <span className='font-bold text-sm truncate text-white'>{userData.firstName} {userData.lastName}</span>
              <span className='text-xs text-[#c9b458] font-semibold flex items-center gap-1'>
                <Sparkles size={12} /> {userData.rank || 'Bronze V'}
              </span>
            </div>
          </div>

          {/* Nav Actions */}
          <nav className='flex flex-col gap-2 font-semibold text-sm text-zinc-400'>
            <a href="#" className='px-4 py-3 bg-zinc-900 text-white rounded-xl flex items-center gap-3 transition-all'>
              <Target size={18} className='text-[#6aaa64]' /> Arena Main
            </a>
            <a href="#" className='px-4 py-3 hover:bg-zinc-900 hover:text-white rounded-xl flex items-center gap-3 transition-all'>
              <Trophy size={18} /> Leaderboards
            </a>
          </nav>
        </div>

        {/* Logout Trigger */}
        <button 
          onClick={handleLogout}
          className='w-full px-4 py-3 hover:bg-red-950/40 text-zinc-500 hover:text-red-400 border border-transparent hover:border-red-900/40 rounded-xl font-bold text-sm flex items-center gap-3 transition-all mt-8'
        >
          <LogOut size={18} /> Exit Arena
        </button>
      </aside>

      {/* Main Content Dashboard Hub */}
      <section className='flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 overflow-y-auto'>
        
        {/* Analytics Top Stats Banner */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='bg-white border border-zinc-200 p-5 rounded-2xl flex items-center justify-between shadow-sm'>
            <div className='space-y-1'>
              <span className='text-xs font-bold text-zinc-400 uppercase tracking-wider'>Current Streak</span>
              <h3 className='text-2xl font-black text-zinc-950 flex items-center gap-1.5'>
                {winStreak} <Flame size={20} className='text-[#c9b458] fill-[#c9b458]' />
              </h3>
            </div>
          </div>
          <div className='bg-white border border-zinc-200 p-5 rounded-2xl flex items-center justify-between shadow-sm'>
            <div className='space-y-1'>
              <span className='text-xs font-bold text-zinc-400 uppercase tracking-wider'>Win Rate</span>
              <h3 className='text-2xl font-black text-[#6aaa64]'>{winRate}</h3>
            </div>
          </div>
          <div className='bg-white border border-zinc-200 p-5 rounded-2xl flex items-center justify-between shadow-sm'>
            <div className='space-y-1'>
              <span className='text-xs font-bold text-zinc-400 uppercase tracking-wider'>Battles Fought</span>
              <h3 className='text-2xl font-black text-zinc-950'>{gamesPlayed}</h3>
            </div>
          </div>
          <div className='bg-white border border-zinc-200 p-5 rounded-2xl flex items-center justify-between shadow-sm'>
            <div className='space-y-1'>
              <span className='text-xs font-bold text-zinc-400 uppercase tracking-wider'>Arena Standing</span>
              <h3 className='text-2xl font-black text-zinc-950'>#{userData.globalRank || '---'}</h3>
            </div>
          </div>
        </div>

        {/* Layout Splitting Matrix */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          
          {/* Left Block Side: Action Console Matchmakers */}
          <div className='lg:col-span-2 space-y-6'>
            
            {/* Quick Play Card Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Card 1: Matchmaking Queue */}
              <div className='bg-gradient-to-br from-zinc-900 to-zinc-800 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between h-52 border border-zinc-800 relative overflow-hidden group'>
                <div className='absolute -right-8 -bottom-8 text-zinc-800/40 w-36 h-36 transform -rotate-12 group-hover:scale-110 transition-transform duration-300'>
                  <Swords size={144} />
                </div>
                <div className='space-y-2 z-10'>
                  <span className='px-2.5 py-0.5 bg-[#6aaa64] text-white text-[10px] font-black tracking-wide uppercase rounded shadow-sm'>Real-Time Match</span>
                  <h4 className='text-2xl font-black tracking-tight pt-1'>FIND QUICK DUEL</h4>
                  <p className='text-xs text-zinc-400 max-w-[200px] leading-relaxed'>Queue instantly against random online rivals across the globe.</p>
                </div>
                <button className='w-fit px-5 py-2.5 bg-white text-zinc-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 hover:bg-zinc-100 transform active:scale-95 transition-all z-10'>
                  <Play size={14} className='fill-zinc-950' /> Match Me
                </button>
              </div>

              {/* Card 2: Custom Private Room */}
              <div className='bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between h-52 relative overflow-hidden group hover:border-[#c9b458] transition-all duration-300'>
                <div className='absolute -right-8 -bottom-8 text-zinc-100 w-36 h-36 transform rotate-12 group-hover:scale-110 transition-transform duration-300'>
                  <Users size={144} />
                </div>
                <div className='space-y-2 z-10'>
                  <span className='px-2.5 py-0.5 bg-[#c9b458] text-zinc-900 text-[10px] font-black tracking-wide uppercase rounded shadow-sm'>Custom Lobby</span>
                  <h4 className='text-2xl font-black tracking-tight pt-1 text-zinc-950'>BATTLE FRIENDS</h4>
                  <p className='text-xs text-zinc-500 max-w-[200px] leading-relaxed'>Generate a custom invite link code to fight specific squadmates.</p>
                </div>
                <button className='w-fit px-5 py-2.5 bg-zinc-900 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 hover:bg-zinc-800 transform active:scale-95 transition-all z-10'>
                  <UserPlus size={14} /> Create Room
                </button>
              </div>
            </div>

            {/* Daily Challenge Progress Module */}
            <div className='bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4'>
              <div className='flex justify-between items-center'>
                <h4 className='font-black text-lg tracking-tight'>Daily Arena Mastery</h4>
                <span className='text-xs font-bold px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-zinc-500'>Resets in 10h</span>
              </div>
              <div className='space-y-3.5'>
                <div>
                  <div className='flex justify-between text-xs font-bold text-zinc-600 mb-1'>
                    <span>Solve words in less than 4 tries</span>
                    <span>2 / 3 Games</span>
                  </div>
                  <div className='w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/60'>
                    <div className='h-full bg-[#6aaa64] rounded-full' style={{ width: '66%' }} />
                  </div>
                </div>
                <div>
                  <div className='flex justify-between text-xs font-bold text-zinc-600 mb-1'>
                    <span>Win 5 speed-duels in active matchmaking</span>
                    <span>5 / 5 Complete</span>
                  </div>
                  <div className='w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/60'>
                    <div className='h-full bg-[#6aaa64] rounded-full' style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Block Side: Friends Social Hub Compartment */}
          <div className='bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[440px]'>
            <div className='space-y-4 min-h-0 flex flex-col'>
              <div className='flex justify-between items-center pb-2 border-b border-zinc-100 shrink-0'>
                <h4 className='font-black text-lg tracking-tight flex items-center gap-2'>
                  <Users size={18} className='text-zinc-400' /> Squad Hub
                </h4>
                <button className='p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-all' title='Add Friend'>
                  <UserPlus size={16} />
                </button>
              </div>

              {/* Friends Feed Container */}
              <div className='flex-1 overflow-y-auto space-y-3 pr-1'>
                {friends.map((friend) => (
                  <div key={friend.id} className='flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-200/50'>
                    <div className='flex items-center gap-2.5 min-w-0'>
                      <div className='relative shrink-0'>
                        <div className='w-8 h-8 bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold rounded-lg flex items-center justify-center text-xs'>
                          {friend.name[0]}
                        </div>
                        <Circle 
                          size={10} 
                          className={`absolute -bottom-0.5 -right-0.5 rounded-full fill-current ${friend.status === 'online' ? 'text-[#6aaa64]' : 'text-zinc-300'}`} 
                        />
                      </div>
                      <div className='flex flex-col min-w-0'>
                        <span className='text-xs font-bold truncate text-zinc-800'>{friend.name}</span>
                        <span className='text-[10px] text-zinc-400 font-medium'>
                          {friend.status === 'online' ? (friend.isPlaying ? 'In a Match' : 'Available') : 'Offline'}
                        </span>
                      </div>
                    </div>
                    {friend.status === 'online' && !friend.isPlaying && (
                      <button className='px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-950 hover:text-white border border-zinc-200 text-zinc-700 font-bold text-[10px] tracking-wide uppercase rounded-lg transition-all shadow-sm shrink-0'>
                        Duel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Micro Global Rank Leaderboard Preview */}
            <div className='mt-6 pt-4 border-t border-zinc-100 space-y-3 shrink-0'>
              <h5 className='text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5'>
                <Trophy size={14} className='text-[#c9b458]' /> Daily Champions
              </h5>
              <div className='flex items-center justify-between text-xs font-bold text-zinc-700 bg-zinc-50 p-2 rounded-xl border border-zinc-200/60'>
                <div className='flex items-center gap-2'>
                  <span className='text-zinc-400 w-4'>#1</span>
                  <span>WordNinja_99</span>
                </div>
                <span className='text-[#6aaa64]'>42 Ws</span>
              </div>
            </div>

          </div>

        </div>

      </section>
    </main>
  )
}

export default Dashboard