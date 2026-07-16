import React, { useEffect, useState, useRef } from 'react'
import { Swords, Users, Trophy, Flame, Target, Sparkles, UserPlus, Play, Circle, LogOut, Loader2, X, Check, Mail, Bell, Key } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api';
import { io } from 'socket.io-client'
import GameBoard from '../components/GameBoard';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Custom Lobby states
  const [showLobbyModal, setShowLobbyModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);

  // --- NEW SOCKET & GAME STATES ---
  const [socket, setSocket] = useState(null);
  const [socketId, setSocketId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [matchDetails, setMatchDetails] = useState(null);

  const leaderboardsRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    
    // Connect to your backend
    const newSocket = io('http://localhost:3000', {
      withCredentials: true
    });
    
    setSocket(newSocket);

    // Listen for successful connection
    newSocket.on('connect', () => {
      console.log('Connected to game server!');
      if (isMounted) setSocketId(newSocket.id);
    });

    // --- MATCHMAKING LISTENERS ---
    newSocket.on('waitingForOpponent', () => {
      console.log("Waiting for opponent...");
      if (isMounted) setIsSearching(true);
    });

    newSocket.on('matchFound', (data) => {
      console.log("Match Found!", data);
      if (isMounted) {
        setIsSearching(false);
        setShowLobbyModal(false);
        setMatchDetails(data); // Save the room and secret word info
      }
    });

    // --- CUSTOM LOBBY LISTENERS ---
    newSocket.on('customLobbyCreated', (data) => {
      if (!isMounted) return;
      setLobbyCode(data.roomCode);
      setLobbyPlayers(data.players);
      setIsHost(true);
      setShowLobbyModal(true);
    });

    newSocket.on('lobbyUpdated', (data) => {
      if (!isMounted) return;
      setLobbyPlayers(data.players);
      if (data.host === newSocket.id) setIsHost(true);
      setShowJoinModal(false);
      setShowLobbyModal(true);
    });

    newSocket.on('customLobbyError', (data) => {
      if (isMounted) toast.error(data.message);
    });

    async function fetchDashboardData() {
      try {
        const profileRes = await api.get('/v1/auth/me');
        if (profileRes.data?.user && isMounted) {
          setUserData(profileRes.data.user);
        }

        const [friendsRes, leaderboardRes, requestsRes] = await Promise.all([
          api.get('/v1/user/friends').catch(() => null),
          api.get('/v1/user/leaderboard').catch(() => null),
          api.get('/v1/user/friends/requests').catch(() => null)
        ]);

        if (isMounted) {
          if (friendsRes?.data) setFriends(friendsRes.data);
          if (leaderboardRes?.data) setLeaderboard(leaderboardRes.data);
          if (requestsRes?.data) setFriendRequests(requestsRes.data);
        }
      } catch (err) {
        console.error("Error pulling dashboard data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    
    fetchDashboardData();
    
    return () => { 
      isMounted = false; 
      newSocket.disconnect(); 
    };
  }, []);
  

  const handleLogout = async () => {
    try {
      const responseData = await api.post('/v1/auth/logout', {});
      if (responseData) navigate('/login');
    } catch (err) {
      console.error("Logout verification drop caught:", err);
    }
  };

  // --- MATCHMAKING ACTION ---
  const handleJoinQueue = () => {
    if (socket && userData?.id) {
      setIsSearching(true);
      socket.emit('joinQueue', { userId: userData.id, firstName: userData.firstName });
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!addEmail) return;
    setActionLoading(true);
    try {
      await api.post('/v1/user/friends/request', { receiverEmail: addEmail });
      toast.success("Friend request sent!");
      setShowAddModal(false);
      setAddEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    try {
      await api.post('/v1/user/friends/respond', { requestId, action });
      toast.success(`Request ${action}ed!`);
      // Refresh friends and requests list locally without full page reload
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      if (action === 'accept') {
        const friendsRes = await api.get('/v1/user/friends').catch(() => null);
        if (friendsRes?.data?.data) setFriends(friendsRes.data.data);
      }
    } catch (err) {
      toast.error("Error responding to request");
    }
  };

  const handleCreateCustomRoom = () => {
    if (socket && userData) {
      socket.emit('createCustomLobby', { userId: userData.id, firstName: userData.firstName });
    }
  };

  const handleJoinCustomRoomSubmit = (e) => {
    e.preventDefault();
    if (socket && joinCode && userData) {
      socket.emit('joinCustomLobby', { roomCode: joinCode.toUpperCase(), userId: userData.id, firstName: userData.firstName });
    }
  };

  const handleStartCustomMatch = () => {
    if (socket && lobbyCode) {
      socket.emit('startCustomMatch', { roomCode: lobbyCode });
    }
  };

  const scrollToLeaderboards = (e) => {
    e.preventDefault();
    leaderboardsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading || !userData) {
    return (
      <div className='min-h-screen w-full bg-[#f8f9fa] flex flex-col items-center justify-center gap-3'>
        <Loader2 className='animate-spin text-[#6aaa64] w-8 h-8' />
        <span className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>Syncing Arena Stats...</span>
      </div>
    );
  }

  const stats = userData.stats || {};
  const winStreak = stats.winStreak || 0;
  const gamesPlayed = stats.gamesPlayed || 0;
  const winRate = gamesPlayed > 0 ? Math.round((stats.wins / gamesPlayed) * 100) + '%' : '0%';
  const initialLetter = userData.firstName ? userData.firstName[0].toUpperCase() : 'W';

  // --- GAME BOARD OVERLAY (If match is active) ---
  if (matchDetails) {
  return (
    <GameBoard 
      socket={socket} 
      roomId={matchDetails.roomId} 
      matchPlayers={matchDetails.players}
      onLeave={() => {
        setMatchDetails(null);
        // also leave lobby if we leave game
        setLobbyCode('');
        setLobbyPlayers([]);
      }} 
    />
  );
}

  return (
    <main className='min-h-screen w-full bg-[#f8f9fa] text-zinc-900 font-sans flex flex-col md:flex-row relative'>
      
      {/* Sidebar Navigation */}
      <aside className='w-full md:w-64 bg-zinc-950 text-white flex flex-col justify-between p-6 shrink-0'>
        <div className='space-y-8'>
          <div className='flex items-center gap-2 font-black tracking-wider text-xl'>
            <Swords size={22} className='text-[#6aaa64]' />
            <span>WORDLE<span className='text-[#c9b458]'>.BATTLE</span></span>
          </div>

          <div className='p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-3'>
            <div className='w-10 h-10 bg-[#6aaa64] text-white font-black rounded-lg flex items-center justify-center shadow-inner text-base'>
              {initialLetter}
            </div>
            <div className='flex flex-col min-w-0'>
              <span className='font-bold text-sm truncate text-white'>{userData.firstName} {userData.lastName}</span>
              <span className='text-xs text-[#c9b458] font-semibold flex items-center gap-1'>
                <Sparkles size={12} /> {stats.rank || 'Bronze V'}
              </span>
            </div>
          </div>

          <nav className='flex flex-col gap-2 font-semibold text-sm text-zinc-400'>
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className='px-4 py-3 bg-zinc-900 text-white rounded-xl flex items-center gap-3 transition-all'>
              <Target size={18} className='text-[#6aaa64]' /> Arena Main
            </a>
            <a href="#" onClick={scrollToLeaderboards} className='px-4 py-3 hover:bg-zinc-900 hover:text-white rounded-xl flex items-center gap-3 transition-all'>
              <Trophy size={18} /> Leaderboards
            </a>
          </nav>
        </div>

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

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          
          <div className='lg:col-span-2 space-y-6'>
            
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
                
                <button 
                  onClick={handleJoinQueue}
                  disabled={isSearching}
                  className={`w-fit px-5 py-2.5 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transform active:scale-95 transition-all z-10 ${
                    isSearching ? 'bg-zinc-700 text-zinc-300 cursor-not-allowed' : 'bg-white text-zinc-950 hover:bg-zinc-100'
                  }`}
                >
                  {isSearching ? (
                    <><Loader2 size={14} className="animate-spin" /> Searching...</>
                  ) : (
                    <><Play size={14} className='fill-zinc-950' /> Match Me</>
                  )}
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
                <div className='flex gap-2 z-10'>
                  <button 
                    onClick={handleCreateCustomRoom}
                    className='w-fit px-5 py-2.5 bg-zinc-900 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 hover:bg-zinc-800 transform active:scale-95 transition-all'
                  >
                    <UserPlus size={14} /> Create Room
                  </button>
                  <button 
                    onClick={() => setShowJoinModal(true)}
                    className='w-fit px-5 py-2.5 bg-zinc-100 text-zinc-900 font-black text-xs rounded-xl shadow-md flex items-center gap-2 hover:bg-zinc-200 transform active:scale-95 transition-all border border-zinc-200'
                  >
                    <Key size={14} /> Join
                  </button>
                </div>
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
                <div className='flex items-center gap-2'>
                  <button 
                    onClick={() => setShowRequestsModal(true)}
                    className='relative p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-all' 
                    title='Pending Requests'
                  >
                    <Bell size={16} />
                    {friendRequests.length > 0 && (
                      <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse' />
                    )}
                  </button>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className='p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-all' 
                    title='Add Friend'
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              </div>

              <div className='flex-1 overflow-y-auto space-y-3 pr-1'>
                {friends.length === 0 ? (
                  <div className='text-center text-zinc-400 text-xs py-4'>No friends added yet.</div>
                ) : friends.map((friend) => (
                  <div key={friend._id} className='flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-200/50'>
                    <div className='flex items-center gap-2.5 min-w-0'>
                      <div className='relative shrink-0'>
                        <div className='w-8 h-8 bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold rounded-lg flex items-center justify-center text-xs'>
                          {friend.firstName[0].toUpperCase()}
                        </div>
                        <Circle 
                          size={10} 
                          className={`absolute -bottom-0.5 -right-0.5 rounded-full fill-current text-[#6aaa64]`} 
                        />
                      </div>
                      <div className='flex flex-col min-w-0'>
                        <span className='text-xs font-bold truncate text-zinc-800'>{friend.firstName} {friend.lastName}</span>
                        <span className='text-[10px] text-zinc-400 font-medium'>Online</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='mt-6 pt-4 border-t border-zinc-100 space-y-3 shrink-0' ref={leaderboardsRef}>
              <h5 className='text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5'>
                <Trophy size={14} className='text-[#c9b458]' /> Daily Champions
              </h5>
              {leaderboard.length === 0 ? (
                <div className='text-xs text-zinc-400 text-center py-2'>No champions yet.</div>
              ) : leaderboard.slice(0, 3).map((player, index) => (
                <div key={player._id} className='flex items-center justify-between text-xs font-bold text-zinc-700 bg-zinc-50 p-2 rounded-xl border border-zinc-200/60 mt-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-zinc-400 w-4'>#{index + 1}</span>
                    <span>{player.firstName}</span>
                  </div>
                  <span className='text-[#6aaa64]'>{player.stats?.wins || 0} Ws</span>
                </div>
              ))}
            </div>

          </div>

        </div>

      </section>

      {/* MODALS */}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className='absolute inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative'>
            <button 
              onClick={() => setShowJoinModal(false)}
              className='absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 transition-colors'
            >
              <X size={20} />
            </button>
            <h3 className='font-black text-xl mb-1 flex items-center gap-2'><Key size={20} className='text-[#c9b458]' /> Join Room</h3>
            <p className='text-xs text-zinc-500 mb-6'>Enter the 6-character room code to join a lobby.</p>
            
            <form onSubmit={handleJoinCustomRoomSubmit} className='flex flex-col gap-3'>
              <input 
                type="text" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder='CODE'
                maxLength={6}
                className='w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-center tracking-[0.5em] text-lg font-black text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#c9b458]/50 focus:border-[#c9b458] transition-all uppercase'
                required
              />
              <button 
                type="submit" 
                className='w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-sm rounded-xl transition-colors shadow-sm'
              >
                Join Lobby
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Lobby Modal */}
      {showLobbyModal && (
        <div className='absolute inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative'>
            <button 
              onClick={() => setShowLobbyModal(false)}
              className='absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 transition-colors'
            >
              <X size={20} />
            </button>
            <h3 className='font-black text-xl mb-1 flex items-center gap-2'><Users size={20} className='text-[#c9b458]' /> Custom Lobby</h3>
            <div className='flex items-center justify-center py-4 bg-zinc-50 border border-zinc-200 rounded-xl mb-4'>
              <span className='font-black text-3xl tracking-widest text-zinc-900'>{lobbyCode}</span>
            </div>
            
            <h4 className='text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2'>Players ({lobbyPlayers.length})</h4>
            <div className='flex flex-col gap-2 mb-6 max-h-40 overflow-y-auto'>
              {lobbyPlayers.map((p, i) => (
                <div key={i} className='flex items-center gap-2 p-2 bg-zinc-50 rounded-lg border border-zinc-100'>
                  <div className='w-6 h-6 bg-[#6aaa64] text-white rounded text-[10px] font-black flex items-center justify-center'>
                    {p.firstName ? p.firstName[0].toUpperCase() : '?'}
                  </div>
                  <span className='font-bold text-sm text-zinc-800'>{p.firstName}</span>
                </div>
              ))}
            </div>

            {isHost ? (
              <button 
                onClick={handleStartCustomMatch}
                disabled={lobbyPlayers.length < 2}
                className='w-full py-3 bg-[#6aaa64] hover:bg-[#5a9554] text-white font-black text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                <Play size={16} className='fill-white' /> Start Match
              </button>
            ) : (
              <div className='w-full py-3 bg-zinc-100 text-zinc-500 font-black text-sm rounded-xl flex items-center justify-center gap-2'>
                <Loader2 size={16} className='animate-spin' /> Waiting for host...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className='absolute inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative'>
            <button 
              onClick={() => setShowAddModal(false)}
              className='absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 transition-colors'
            >
              <X size={20} />
            </button>
            <h3 className='font-black text-xl mb-1 flex items-center gap-2'><UserPlus size={20} className='text-[#6aaa64]' /> Add Friend</h3>
            <p className='text-xs text-zinc-500 mb-6'>Enter your friend's email address to send them a duel request.</p>
            
            <form onSubmit={handleAddFriend} className='flex flex-col gap-3'>
              <div className='relative'>
                <Mail size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400' />
                <input 
                  type="email" 
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder='friend@example.com'
                  className='w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#6aaa64]/50 focus:border-[#6aaa64] transition-all'
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={actionLoading}
                className='w-full py-3 bg-[#6aaa64] hover:bg-[#5a9554] text-white font-black text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50'
              >
                {actionLoading ? 'Sending...' : 'Send Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pending Requests Modal */}
      {showRequestsModal && (
        <div className='absolute inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative max-h-[80vh] flex flex-col'>
            <button 
              onClick={() => setShowRequestsModal(false)}
              className='absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 transition-colors'
            >
              <X size={20} />
            </button>
            <h3 className='font-black text-xl mb-1 flex items-center gap-2'><Bell size={20} className='text-[#c9b458]' /> Pending Requests</h3>
            <p className='text-xs text-zinc-500 mb-6'>Accept friends to add them to your Squad Hub.</p>
            
            <div className='flex-1 overflow-y-auto space-y-3 min-h-[100px]'>
              {friendRequests.length === 0 ? (
                <div className='text-center text-zinc-400 text-sm font-semibold py-8'>No pending requests.</div>
              ) : (
                friendRequests.map(req => (
                  <div key={req._id} className='flex items-center justify-between bg-zinc-50 border border-zinc-200 p-3 rounded-xl'>
                    <div className='flex flex-col'>
                      <span className='text-sm font-bold text-zinc-900'>{req.sender.firstName} {req.sender.lastName}</span>
                      <span className='text-xs text-zinc-500'>{req.sender.email}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <button 
                        onClick={() => handleRespondRequest(req._id, 'accept')}
                        className='p-2 bg-[#6aaa64] hover:bg-[#5a9554] text-white rounded-lg transition-colors'
                        title="Accept"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => handleRespondRequest(req._id, 'reject')}
                        className='p-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg transition-colors'
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  )
}

export default Dashboard