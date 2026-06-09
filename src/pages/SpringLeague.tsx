import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  ChevronDown, 
  Mail, 
  ArrowUp, 
  ArrowRight,
  FileText,
  Tag,
  Users,
  MapPin,
  Trophy,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LOGO_URL = "https://images.pacificregionalsoccer.com/pacific%20regional%20soccer%20league%20logo.avif";

export default function SpringLeague() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

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
    <div className="relative font-sans bg-[#050505] text-white min-h-screen pb-20 lg:pb-0">
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

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto pt-32 lg:pt-48 pb-12 px-5 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <span className="text-[#C8102E] font-black uppercase text-xs tracking-[3px] mb-4 block">March 14th - June 7th, 2026</span>
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-black italic uppercase leading-none mb-6">Spring Challenge 2026</h1>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">Boys & Girls Brackets • Birth Years 2007 thru 2020</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <a href="https://soccer.sincsports.com/register/start.aspx?tid=DSPCH&tab=2&sub=0" target="_blank" rel="noreferrer" className="bg-[#C8102E] hover:bg-transparent border border-[#C8102E] text-white hover:text-[#C8102E] px-10 py-4 rounded font-black uppercase text-sm flex items-center justify-center gap-2 transition-all shadow-[0_10px_20px_rgba(200,16,46,0.3)]">
               Register Now <ArrowRight size={18} />
             </a>
             <Link to="/rules" className="bg-transparent hover:bg-white/5 border border-white/10 text-white px-10 py-4 rounded font-black uppercase text-sm flex items-center justify-center gap-2 transition-all">
               <FileText size={18} /> League Rules
             </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 text-left">
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="glass-panel p-8 bg-white/5 border border-red-600/30"
           >
              <h3 className="text-[#C8102E] font-black uppercase text-lg mb-4 flex items-center gap-2"><Tag /> Registration & Fees</h3>
              <div className="text-4xl font-black mb-1">$399</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-6">Per Team Registration Fee</div>
              <div className="h-px bg-white/10 mb-6" />
              <p className="font-bold mb-2">8 Games Guaranteed*</p>
              <p className="text-gray-400 text-sm italic">*Teams can request blackout dates (Tournaments, State Cup, etc.)</p>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="glass-panel p-8 bg-white/5 border border-white/10"
           >
              <h3 className="text-[#C8102E] font-black uppercase text-lg mb-4 flex items-center gap-2"><Users /> Play Format</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex justify-between items-center bg-white/5 p-2 rounded"><span>U7 - U10</span> <strong>7v7</strong></li>
                <li className="flex justify-between items-center bg-white/5 p-2 rounded"><span>U11 & U12</span> <strong>9v9</strong></li>
                <li className="flex justify-between items-center bg-white/5 p-2 rounded"><span>U13 - U19</span> <strong>11v11</strong></li>
              </ul>
              <div className="h-px bg-white/10 my-6" />
              <p className="text-sm font-bold uppercase tracking-widest text-[#C8102E]">Match Days: Saturdays & Sundays</p>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="glass-panel p-8 bg-white/5 border border-white/10"
           >
              <h3 className="text-[#C8102E] font-black uppercase text-lg mb-4 flex items-center gap-2"><MapPin /> Fields & Locations</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Clubs have the option to provide home fields for their teams. Alternatively, the League can provide fields if needed for an additional fee.</p>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="glass-panel p-8 bg-white/5 border border-white/10"
           >
              <h3 className="text-[#C8102E] font-black uppercase text-lg mb-4 flex items-center gap-2"><Trophy /> Awards</h3>
              <div className="space-y-3">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">1</div>
                    <span className="font-bold">Champions: Team Trophy & Medals</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-400/20 flex items-center justify-center text-gray-400">2</div>
                    <span className="font-bold">Finalists: Medals</span>
                 </div>
              </div>
           </motion.div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-8 text-left">
                <h3 className="text-xl font-bold uppercase italic mb-4">Age Matrix Table</h3>
                <p className="text-gray-400 text-sm mb-6">Please refer to the official Age Matrix below to verify your team's appropriate bracket for the 2026/2027 competitive calendar year.</p>
                <img 
                  src="https://media.pacificregionalsoccer.com/age%20matrix%202026-2027.png" 
                  alt="Age Matrix" 
                  className="w-full rounded-lg border border-white/10 shadow-2xl cursor-zoom-in group"
                  onClick={() => setSelectedImg("https://media.pacificregionalsoccer.com/age%20matrix%202026-2027.png")}
                />
            </div>
            <div className="md:col-span-4">
                <img 
                  src="https://media.pacificregionalsoccer.com/PacificRegionSL2025Art.avif" 
                  alt="Spring Challenge Art" 
                  className="w-full max-w-[250px] mx-auto drop-shadow-2xl" 
                />
            </div>
        </div>

        <div className="mt-16 p-8 bg-black/50 border border-white/5 rounded-lg text-xs text-gray-500 leading-relaxed max-w-3xl mx-auto italic">
            <span className="text-white font-bold block mb-2 uppercase not-italic">Important Notices</span>
            Our SINC SPORTS page will be the final word for all schedules, scores, rules, regulations, and procedures. The Tournament Director and Committee shall maintain the right to independently make new and possibly conflicting rules or regulations on the tournament website at any time. This is a SINC Sports event; all schedules and scores will be posted to the appropriate links.
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-5"
            onClick={() => setSelectedImg(null)}
          >
            <button className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors">
              <X size={40} />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImg} 
              className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
