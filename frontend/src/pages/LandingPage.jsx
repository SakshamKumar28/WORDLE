import React from 'react'
import Navbar from '../components/Navbar'
import wordleGrid from '../assets/wordle_grid.png'
import { CircleUserRound, Sword, Users, Keyboard, ShieldAlert, Trophy, UserPlus, GitPullRequestArrow} from 'lucide-react';
import Instagram from '../components/Instagram';
import { CiTwitter } from "react-icons/ci";
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <main className='relative min-h-screen w-full bg-[#f8f9fa] text-zinc-900 font-sans overflow-x-hidden scroll-smooth'>
      <Navbar />
      
      {/* Main Container adjusted for fixed Navbar padding */}
      <section id="hero" className='pt-24 min-h-screen w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 px-6 items-center'>
        
        {/* Section 1: Hero & Action (2/3 Width) */}
        <section className='w-full md:w-2/3 flex flex-col justify-center items-start space-y-6 py-10'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold tracking-wide uppercase'>
            <span className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></span>
            Multiplayer Mode Live
          </div>
          
          <h1 className='text-5xl md:text-7xl font-black tracking-tight leading-none text-zinc-900'>
            SHARPEN YOUR <br />
            <span className='text-[#6aaa64]'>WORDS.</span> <br />
            BATTLE YOUR <br />
            <span className='text-[#c9b458]'>FRIENDS.</span>
          </h1>
          
          <p className='text-lg text-zinc-600 max-w-lg font-medium'>
            The daily word puzzle you love, now turned into a real-time multiplayer arena. Challenge friends, track streaks, and claim the ultimate title of Word Master.
          </p>
          
          <div className='flex flex-wrap gap-4 pt-4'>
            <button onClick={()=>{navigate('/dashboard')}} className='px-8 py-4 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-all transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2'>
              <Sword size={20} />
              Start a Battle
            </button>
            <button onClick={()=>{navigate('/dashboard')}} className='px-8 py-4 rounded-xl border-2 border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 transition-all transform hover:-translate-y-0.5 flex items-center gap-2'>
              <Users size={20} />
              Invite Friends
            </button>
          </div>
        </section>

        {/* Section 2: Visual Concept (1/3 Width) */}
        <section className='w-full md:w-1/3 h-125 md:h-150 relative bg-zinc-50 rounded-3xl border border-zinc-200 shadow-inner overflow-hidden flex items-center justify-center'>
          
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))]" style={{ backgroundImage: 'radial-gradient(#e4e4e7 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
          
          {/* Visual Player 1 (Top Left Focus) */}
          <div className='absolute top-8 left-6 flex flex-col items-center gap-2 bg-white p-3 rounded-2xl shadow-md border border-zinc-100 animate-bounce [animation-duration:4s]'>
            <CircleUserRound className='h-12 w-12 text-[#6aaa64]' />
            <span className='text-xs font-bold px-2 py-0.5 bg-zinc-100 rounded text-zinc-600'>You</span>
          </div>
          <img src={wordleGrid} alt="Grid" className='w-[160px] absolute top-16 left-24 rotate-[-4deg] drop-shadow-xl border-4 border-white rounded-lg transition-transform hover:scale-105 duration-300' />

          {/* VS Centerpiece */}
          <div className='absolute z-10 w-14 h-14 bg-zinc-900 text-white flex items-center justify-center rounded-full font-black text-lg tracking-wider border-4 border-white shadow-xl transform rotate-12'>
            VS
          </div>

          {/* Visual Player 2 (Bottom Right Focus) */}
          <img src={wordleGrid} alt="Grid" className='w-[160px] absolute bottom-16 right-24 rotate-[6deg] drop-shadow-xl border-4 border-white rounded-lg transition-transform hover:scale-105 duration-300' />
          <div className='absolute bottom-8 right-6 flex flex-col items-center gap-2 bg-white p-3 rounded-2xl shadow-md border border-zinc-100 animate-bounce [animation-duration:4.5s]'>
            <CircleUserRound className='h-12 w-12 text-zinc-400' />
            <span className='text-xs font-bold px-2 py-0.5 bg-zinc-100 rounded text-zinc-600'>Friend</span>
          </div>
          
        </section>

      </section>

      {/* How to Play Section */}
      <section id="howtoplay" className='w-full py-24 bg-zinc-950 text-white rounded-t-[3rem] mt-20 px-6'>
        <div className='max-w-7xl mx-auto'>
          
          {/* Section Header */}
          <div className='text-center max-w-2xl mx-auto mb-16 space-y-4'>
            <h2 className='text-xs font-bold tracking-widest text-[#6aaa64] uppercase'>
              Rules of Engagement
            </h2>
            <p className='text-3xl md:text-5xl font-black tracking-tight'>
              HOW THE BATTLE WORKS
            </p>
            <p className='text-zinc-400 font-medium'>
              It's the Wordle you know, but survival depends on speed, strategy, and outsmarting your opponent.
            </p>
          </div>

          {/* Steps Grid */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-8 relative'>
            
            {/* Step 1 */}
            <div className='bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-[#6aaa64] transition-all duration-300'>
              <div className='absolute -top-6 -right-6 w-24 h-24 bg-[#6aaa64]/5 rounded-full flex items-center justify-center group-hover:bg-[#6aaa64]/10 transition-all'>
                <UserPlus className='text-[#6aaa64] w-8 h-8 translate-x-[-8px] translate-y-[8px]' />
              </div>
              <span className='text-5xl font-black text-zinc-800 group-hover:text-[#6aaa64]/20 transition-all block mb-4'>01</span>
              <h3 className='text-xl font-bold mb-2 text-zinc-100'>Lobby Up</h3>
              <p className='text-sm text-zinc-400 leading-relaxed'>
                Create a private room and send the invite link to a friend, or jump instantly into a matchmaking queue to duel a random word smith.
              </p>
            </div>

            {/* Step 2 */}
            <div className='bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-[#c9b458] transition-all duration-300'>
              <div className='absolute -top-6 -right-6 w-24 h-24 bg-[#c9b458]/5 rounded-full flex items-center justify-center group-hover:bg-[#c9b458]/10 transition-all'>
                <Keyboard className='text-[#c9b458] w-8 h-8 translate-x-[-8px] translate-y-[8px]' />
              </div>
              <span className='text-5xl font-black text-zinc-800 group-hover:text-[#c9b458]/20 transition-all block mb-4'>02</span>
              <h3 className='text-xl font-bold mb-2 text-zinc-100'>Race the Clock</h3>
              <p className='text-sm text-zinc-400 leading-relaxed'>
                Both players get the exact same secret 5-letter word. You have 6 attempts, but every second matters. Speed breaks ties!
              </p>
            </div>

            {/* Step 3 */}
            <div className='bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-500 transition-all duration-300'>
              <div className='absolute -top-6 -right-6 w-24 h-24 bg-zinc-800/30 rounded-full flex items-center justify-center group-hover:bg-zinc-800/50 transition-all'>
                <ShieldAlert className='text-zinc-400 w-8 h-8 translate-x-[-8px] translate-y-[8px]' />
              </div>
              <span className='text-5xl font-black text-zinc-800 group-hover:text-zinc-700/50 transition-all block mb-4'>03</span>
              <h3 className='text-xl font-bold mb-2 text-zinc-100'>Decode Clues</h3>
              <p className='text-sm text-zinc-400 leading-relaxed'>
                <span className='text-[#6aaa64] font-bold'>Green</span> tiles mean right letter, right spot. <span className='text-[#c9b458] font-bold'>Yellow</span> means right letter, wrong spot. Gray means it's a dud.
              </p>
            </div>

            {/* Step 4 */}
            <div className='bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-[#6aaa64] transition-all duration-300'>
              <div className='absolute -top-6 -right-6 w-24 h-24 bg-[#6aaa64]/5 rounded-full flex items-center justify-center group-hover:bg-[#6aaa64]/10 transition-all'>
                <Trophy className='text-[#6aaa64] w-8 h-8 translate-x-[-8px] translate-y-[8px]' />
              </div>
              <span className='text-5xl font-black text-zinc-800 group-hover:text-[#6aaa64]/20 transition-all block mb-4'>04</span>
              <h3 className='text-xl font-bold mb-2 text-zinc-100'>Claim Victory</h3>
              <p className='text-sm text-zinc-400 leading-relaxed'>
                Solve it in fewer tries than your rival to deal damage. Wipe out their health bar or solve it faster to secure the ultimate win.
              </p>
            </div>

          </div>

          {/* Bottom Call to Action Pro Tip */}
          <div className='mt-12 p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center gap-3 max-w-xl mx-auto text-center'>
            <span className='px-2 py-0.5 bg-[#c9b458] text-black text-xs font-black rounded uppercase'>Pro Tip</span>
            <p className='text-xs text-zinc-400 font-medium'>
              Don't just guess blindly. Watch your opponent's progress bar live to pace your final strikes!
            </p>
          </div>

        </div>
      </section>
      
      {/* Footer */}
      <footer className='w-full bg-zinc-950 text-zinc-400 border-t border-zinc-900 py-12 px-6'>
  <div className='max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8'>
    
    {/* Left Side: Brand & Concept */}
    <div className='flex flex-col items-center md:items-start space-y-3 text-center md:text-left'>
      <div className='flex items-center gap-2'>
        <div className='w-8 h-8 bg-[#6aaa64] flex items-center justify-center rounded text-white font-black text-sm tracking-tighter'>
          W
        </div>
        <h2 className='font-black tracking-wider text-white text-xl'>WORDLE <span className='text-[#c9b458]'>ARENA</span></h2>
      </div>
      <p className='text-xs text-zinc-500 max-w-xs font-medium leading-relaxed'>
        The ultimate battleground for word enthusiasts. Challenge friends, climb the ranks, and prove your vocabulary dominance.
      </p>
    </div>

    {/* Center: Quick Utility Links */}
    <div className='flex flex-wrap justify-center gap-6 text-sm font-semibold'>
      <a href="#" className='hover:text-white transition-colors'>Leaderboards</a>
      <a href="#" className='hover:text-white transition-colors'>Patch Notes</a>
      <a href="#" className='hover:text-white transition-colors'>Privacy Policy</a>
      <a href="#" className='hover:text-white transition-colors'>Terms of Service</a>
    </div>

    {/* Right Side: Socials & Copyright */}
    <div className='flex flex-col items-center md:items-end space-y-3'>
      <div className='flex gap-4'>
        <a href="#" className='p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#6aaa64] hover:border-[#6aaa64] transition-all'>
          <CiTwitter size={18} />
        </a>
        <a href="#" className='p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#c9b458] hover:border-[#c9b458] transition-all'>
          <Instagram size={18} />
        </a>
        <a href="#" className='p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all'>
          <GitPullRequestArrow size={18} />
        </a>
      </div>
      <span className='text-[10px] text-zinc-600 font-mono tracking-wider'>
        &copy; {new Date().getFullYear()} WORDLE ARENA. NOT AFFILIATED WITH NYT.
      </span>
    </div>

  </div>
      </footer>
    </main>
  )
}

export default LandingPage