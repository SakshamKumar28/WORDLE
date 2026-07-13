import React from 'react'
import { Link } from 'react-router-dom'

const navigationLinks = [
  { name: 'Home', href: '/' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Sign Up', href: '/register' },
  { name: 'Login', href: '/login' },
]
const Navbar = () => {
  return (
    <nav className='h-9 w-[90%] flex justify-between px-3 items-center rounded-lg'>
        <h2>WORDLE</h2>
        <ul className='flex gap-4'>
            {navigationLinks.map((link, key)=>{
                return <Link to={link.href} key={key}>{link.name}</Link>
            })}
        </ul>
    </nav>
  )
}

export default Navbar
