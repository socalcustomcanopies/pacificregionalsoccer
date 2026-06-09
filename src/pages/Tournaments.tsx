import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  ChevronDown, 
  Mail, 
  ArrowUp, 
  ExternalLink,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LOGO_URL = "https://images.pacificregionalsoccer.com/pacific%20regional%20soccer%20league%20logo.avif";

export default function Tournaments() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: "SUMMER 26'", dropdown: [
      { name: 'Registration', href: 'https://soccer.sincsports.com/register/start.aspx?tid=SUMCIR&tab=2&sub=0' },
    ]},
    { name: 'Events', href: '/#events', dropdown: [
      { name: 'Summer League', href: 'https://soccer.sincsports.com/register/start.aspx?tid=SUMCIR&tab=2&sub=0' },
      { name: 'Fall League', href: 'https://soccer.sincsports.com/register/start.aspx?tid=PACRSL&tab=2&sub=0' },
      { name: 'Pro Camp 2026', href: '/#pro-camp-event' },
      { name: 'ES National ID', href: '/#esid-event' },
      { name: 'Tournaments', href: '/tournaments' }
    ]},
    { name: 'Rules', dropdown: [
      { name: 'League Rules', href: '/rules' },
      { name: 'Age Matrix', href: '/age-matrix' },
      { name: 'Ref Fees', href: '/rules#ref-fees' },
      { name: 'Licensing', href: '/#education' }
    ]},
  ];

  return (
    <div className="relative font-sans bg-[#050505] text-white min-h-screen flex flex-col">
      <div className="bg-grid opacity-30" />
      <div className="noise-overlay opacity-20" />

      {/* Utility Bar */}
      <div className="hidden lg:flex fixed top-0 left-0 w-full h-[36px] bg-black text-white z-[1001] justify-end items-center px-[5%] text-[0.85rem] font-semibold tracking-wide border-b border-white/5">
        <a href="mailto:pacificregionalsoccerleague@gmail.com" className="flex items-center gap-2 hover:text-[#C8102E] transition-colors">
          <Mail size={14} /> pacificregionalsoccerleague@gmail.com
        </a>
      </div>

      {/* Navigation */}
      <nav 
        className={`fixed left-0 w-full z-[1000] px-[5%] flex justify-between items-center transition-all duration-300 border-b border-white/10 shadow-sm lg:top-[36px] top-0 ${
          isScrolled ? 'py-2 bg-black/95 backdrop-blur-md shadow-lg' : 'py-4 bg-white/10 backdrop-blur-md'
        }`}
      >
        <Link to="/" className="nav-brand">
          <img 
            src={LOGO_URL} 
            alt="PRSL Logo" 
            className={`transition-all duration-300 bg-white rounded-full p-0.5 ${isScrolled ? 'h-[38px]' : 'h-[45px]'}`}
          />
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex items-center gap-8 list-none">
          {navLinks.map((link) => (
            <li key={link.name} className="relative group py-2">
              {link.href && (link.href.startsWith('http') || link.href.includes('#')) ? (
                 <a 
                   href={link.href} 
                   className="text-gray-300 no-underline font-bold text-[0.9rem] uppercase transition-colors hover:text-[#C8102E] relative block"
                 >
                   {link.name}
                   {link.dropdown && <ChevronDown size={14} className="inline ml-1" />}
                   <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C8102E] transition-all duration-300 group-hover:w-full" />
                 </a>
              ) : link.href ? (
                <Link 
                  to={link.href} 
                  className="text-gray-300 no-underline font-bold text-[0.9rem] uppercase transition-colors hover:text-[#C8102E] relative block"
                >
                  {link.name}
                  {link.dropdown && <ChevronDown size={14} className="inline ml-1" />}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C8102E] transition-all duration-300 group-hover:w-full" />
                </Link>
              ) : (
                <button className="text-gray-300 no-underline font-bold text-[0.9rem] uppercase transition-colors hover:text-[#C8102E] relative block cursor-default">
                  {link.name}
                  {link.dropdown && <ChevronDown size={14} className="inline ml-1" />}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C8102E] transition-all duration-300 group-hover:w-full" />
                </button>
              )}
              
              {link.dropdown && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black border border-white/10 border-t-4 border-t-[#C8102E] min-w-[240px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl rounded-b-md">
                  {link.dropdown.map((sub) => (
                    sub.href.startsWith('http') || sub.href.includes('#') ? (
                      <a 
                        key={sub.name}
                        href={sub.href}
                        target={sub.href.startsWith('http') ? "_blank" : undefined}
                        rel={sub.href.startsWith('http') ? "noreferrer" : undefined}
                        className="block px-5 py-3 text-gray-300 no-underline text-[0.85rem] font-semibold border-b border-white/5 hover:bg-white/5 hover:text-[#C8102E] hover:pl-7 transition-all"
                      >
                        {sub.name}
                      </a>
                    ) : (
                      <Link 
                        key={sub.name}
                        to={sub.href}
                        className="block px-5 py-3 text-gray-300 no-underline text-[0.85rem] font-semibold border-b border-white/5 hover:bg-white/5 hover:text-[#C8102E] hover:pl-7 transition-all"
                      >
                        {sub.name}
                      </Link>
                    )
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Hamburger */}
        <button 
          className="lg:hidden flex flex-col gap-1.5 cursor-pointer z-[1002]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className={`w-8 h-0.5 bg-white transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-8 h-0.5 bg-white transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-8 h-0.5 bg-white transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-[#050505] z-[1001] flex flex-col pt-32 px-5 pb-20 items-center overflow-y-auto"
          >
            {navLinks.map((link) => (
              <div key={link.name} className="w-full max-w-sm mb-5 pb-5 border-b border-white/10 text-center">
                <span className="text-[#C8102E] font-black uppercase text-lg mb-2 block">{link.name}</span>
                  {link.dropdown ? (
                    <div className="flex flex-col">
                      {link.dropdown.map((sub) => (
                        sub.href.startsWith('http') || sub.href.includes('#') ? (
                          <a 
                            key={sub.name} 
                            href={sub.href} 
                            target={sub.href.startsWith('http') ? "_blank" : undefined}
                            rel={sub.href.startsWith('http') ? "noreferrer" : undefined}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-lg font-bold text-white uppercase py-3 hover:text-[#C8102E]"
                          >
                            {sub.name}
                          </a>
                        ) : (
                          <Link 
                            key={sub.name} 
                            to={sub.href} 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-lg font-bold text-white uppercase py-3 hover:text-[#C8102E]"
                          >
                            {sub.name}
                          </Link>
                        )
                      ))}
                    </div>
                  ) : link.href ? (
                  <Link 
                    to={link.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xl font-bold text-white uppercase py-3 block hover:text-[#C8102E]"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <div className="text-xl font-bold text-white uppercase py-3 block">
                    {link.name}
                  </div>
                )}
              </div>
            ))}
            <div className="mt-5 flex gap-5">
              <a href="https://instagram.com/pacificregionalsoccer" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#C8102E] transition-all scale-125">
                <Instagram />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center pt-32 lg:pt-44 pb-20 px-5 text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="glass-panel p-10 lg:p-16 max-w-[700px] w-full border border-white/10 bg-[#0f0f0f]/90 relative overflow-hidden flex flex-col items-center"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C8102E]" />
          
          <h1 className="text-[clamp(2.2rem,6vw,3.5rem)] font-black italic uppercase leading-[1.1] mb-4 bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent">
            Tournaments
          </h1>
          <p className="text-gray-400 text-lg mb-10 max-w-[500px]">
            Click the button below to view more information about upcoming tournament events, applications, and bracket details.
          </p>

          <div className="bg-white p-5 rounded-lg mb-10 w-full max-w-[400px] flex justify-center items-center shadow-2xl">
            <img 
              src="https://images.pacificregionalsoccer.com/soccer%20tournament%20logo.png" 
              alt="SoCal Soccer Tournaments" 
              className="w-full h-auto max-h-[180px] object-contain"
            />
          </div>

          <a 
            href="http://www.socalsoccertournaments.com" 
            target="_blank" 
            rel="noreferrer"
            className="group relative inline-flex items-center justify-center gap-3 bg-[#C8102E] text-white px-12 py-5 rounded font-black uppercase text-sm tracking-widest no-underline transition-all hover:bg-[#a00c24] hover:-translate-y-1 shadow-[0_5px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(200,16,46,0.4)] w-full max-w-[350px]"
          >
            Visit Tournament Site <ExternalLink size={18} />
          </a>

          <div className="mt-10 pt-8 border-t border-white/10 w-full text-[0.8rem] uppercase tracking-[1px] text-gray-500 font-bold">
            Official PRSL Partner
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-16 px-5 text-center relative z-10 border-t border-white/5">
          <motion.img 
            whileHover={{ scale: 1.1, rotate: 5 }}
            src={LOGO_URL} 
            alt="PRSL Logo" 
            className="h-16 mx-auto mb-6 bg-white rounded-full p-1 aspect-square cursor-pointer"
          />
          <div className="font-black text-xl mb-4 tracking-widest uppercase">PACIFIC REGIONAL SOCCER LEAGUE</div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
             ©2015-2026 by Pacific Regional Soccer League.<br />All Rights Reserved.
          </p>
      </footer>

      {/* Mobile Sticky Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-black border-t-2 border-t-[#C8102E] z-[1000] shadow-2xl">
        <a href="mailto:pacificregionalsoccerleague@gmail.com" className="flex items-center justify-center gap-2 p-4 text-white text-sm font-bold uppercase">
          <Mail size={18} /> Contact PRSL
        </a>
      </div>

      {/* Scroll Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-20 right-5 w-12 h-12 bg-[#C8102E]/90 text-white border-none rounded-lg cursor-pointer flex justify-center items-center shadow-lg z-[999]"
          >
            <ArrowUp />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
