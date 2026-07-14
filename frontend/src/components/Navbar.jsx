import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom';

// 1. The Rolling Text Component (Kept exactly as you had it)
function TextToggle({ page, link, onClick }) {
  const containerVariants = {
    initial: {},
    hover: {
      transition: {
        staggerChildren: 0.02,
      },
    },
  };

  const letterVariants = {
    initial: { y: 0 },
    hover: { y: "-100%" },
  };

  return (
    <motion.span
      initial="initial"
      whileHover="hover"
      variants={containerVariants}
      className="relative flex overflow-hidden cursor-pointer font-heading font-medium text-[1rem]" 
    >
      {page.toUpperCase().split("").map((char, index) => (
        <motion.span
          key={index}
          variants={letterVariants}
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }} 
          className="relative inline-block whitespace-pre"
        >
          <a href={link} onClick={onClick}><span className="block">{char}</span></a>
          <a href={link} onClick={onClick}><span className="absolute top-full left-0 block">
            {char}
          </span></a>
        </motion.span>
      ))}
    </motion.span>
  );
}

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Hamburger line animation variants
  const topVariants = {
    closed: { rotate: 0, y: 0 },
    opened: { rotate: 45, y: 6 }
  };

  const middleVariants = {
    closed: { opacity: 1 },
    opened: { opacity: 0 }
  };

  const bottomVariants = {
    closed: { rotate: 0, y: 0 },
    opened: { rotate: -45, y: -6 }
  };

  // Mobile menu slide animation variants
  const menuVariants = {
    initial: { scaleY: 0, opacity: 0 },
    animate: { 
      scaleY: 1, 
      opacity: 1,
      transition: { duration: 0.4, ease: [0.76, 0, 0.24, 1] }
    },
    exit: { 
      scaleY: 0, 
      opacity: 0,
      transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] }
    }
  };

  return (
    <nav className='fixed top-3 left-[5%] md:left-15 h-14 w-[90%] flex justify-between px-4 items-center rounded-lg backdrop-blur-lg bg-white/70 border border-zinc-200/50 z-50'>
      <h2 className='font-bold text-xl tracking-wider text-zinc-900'>WORDLE</h2>
      
      
      {/* Desktop Navigation Links */}
      <ul className='hidden md:flex gap-6 font-semibold text-zinc-800'>
        <TextToggle page="Home" link="#hero" />
        <TextToggle page="How To Play" link="#howtoplay" />
      </ul>
      
      {/* Desktop Register Button */}
      <button onClick={()=>{navigate('/login')}} className='cursor-pointer hidden md:block px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 font-medium text-sm transition-colors'>
        Register
      </button>

      {/* Hamburger Menu Button (Mobile Only) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className='flex md:hidden flex-col justify-between w-6 h-3.5 z-50 focus:outline-none'
        aria-label="Toggle Menu"
      >
        <motion.div 
          variants={topVariants} 
          animate={isOpen ? "opened" : "closed"} 
          className='w-full h-[2px] bg-black origin-center'
          transition={{ duration: 0.3 }}
        />
        <motion.div 
          variants={middleVariants} 
          animate={isOpen ? "opened" : "closed"} 
          className='w-full h-[2px] bg-black'
          transition={{ duration: 0.2 }}
        />
        <motion.div 
          variants={bottomVariants} 
          animate={isOpen ? "opened" : "closed"} 
          className='w-full h-[2px] bg-black origin-center'
          transition={{ duration: 0.3 }}
        />
      </button>

      {/* Mobile Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className='absolute top-16 left-0 w-full bg-white/95 backdrop-blur-xl border border-zinc-200 shadow-xl rounded-xl flex flex-col items-center py-6 gap-6 md:hidden origin-top z-40'
          >
            <ul className='flex flex-col items-center gap-5 font-semibold text-zinc-800'>
              <TextToggle page="Home" link="#hero" onClick={() => setIsOpen(false)} />
              <TextToggle page="How To Play" link="#howtoplay" onClick={() => setIsOpen(false)} />
            </ul>
            <div className='w-[80%] h-[1px] bg-zinc-200' />
            <button 
              onClick={() => setIsOpen(false)}
              className='w-[80%] py-3 rounded-md bg-black text-white hover:bg-gray-900 font-medium text-center'
            >
              Register
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar