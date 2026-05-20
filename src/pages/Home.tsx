import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  ChevronDown, 
  Mail, 
  LayoutGrid,
  Calendar,
  Info,
  Contact,
  GraduationCap,
  ArrowUp,
  Book
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Design System Constants
const LOGO_URL = "https://images.pacificregionalsoccer.com/pacific%20regional%20soccer%20league%20logo.avif";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    
    const payload = {
      name: formData.name,
      email: formData.email,
      message: formData.message
    };
    
    const webAppUrl = 'https://script.google.com/macros/s/AKfycb8jXboUkfAe3Givz-ldsqN0YPA_ydhPdIHUFTP5QrRtY5up3Ap1k7eic5A6TIdOXitqA/exec';
    
    try {
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors', // Avoids cross-origin issues with Apps Script
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setFormStatus('success');
      setFormData({ name: '', email: '', message: '' });
      alert('Thank you! Your submission was saved.');
    } catch (err) {
      console.error('Error:', err);
      setFormStatus('error');
    }
  };

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
    { name: 'Home', href: '/', icon: LayoutGrid },
    { name: "SPRING 26'", icon: Calendar, dropdown: [
      { name: 'Schedule', href: 'https://soccer.sincsports.com/schedule.aspx?tid=DSPCH&tab=3&sub=0' },
    ]},
    { name: 'Events', href: '/#events', icon: Calendar, dropdown: [
      { name: 'Spring League', href: '/spring-league' },
      { name: 'Summer League', href: 'https://soccer.sincsports.com/register/start.aspx?tid=SUMCIR&tab=2&sub=0' },
      { name: 'Fall League', href: 'https://soccer.sincsports.com/register/start.aspx?tid=PACRSL&tab=2&sub=0' },
      { name: 'Pro Camp 2026', href: '/#pro-camp-event' },
      { name: 'ES National ID', href: '/#esid-event' },
      { name: 'Tournaments', href: '/tournaments' }
    ]},
    { name: 'Rules', icon: Book, dropdown: [
      { name: 'League Rules', href: '/rules' },
      { name: 'Age Matrix', href: '/age-matrix' },
      { name: 'Ref Fees', href: '/rules#ref-fees' },
      { name: 'Licensing', href: '/#education' }
    ]},
  ];

  const revealVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } }
  };

  return (
    <div className="relative font-sans text-[#1a1a1a] bg-[#f4f6f8]">
      <div className="bg-grid" />
      <div className="noise-overlay" />

      {/* Utility Bar (Desktop) */}
      <div className="hidden lg:flex fixed top-0 left-0 w-full h-[36px] bg-[#111111] text-white z-[1001] justify-end items-center px-[5%] text-[0.85rem] font-semibold tracking-wide">
        <a href="mailto:pacificregionalsoccerleague@gmail.com" className="flex items-center gap-2 hover:text-[#C8102E] transition-colors">
          <Mail size={14} /> pacificregionalsoccerleague@gmail.com
        </a>
      </div>

      {/* Navigation */}
      <nav 
        className={`fixed left-0 w-full z-[1000] px-[5%] flex justify-between items-center transition-all duration-300 border-b border-black/8 shadow-sm lg:top-[36px] top-0 ${
          isScrolled ? 'py-2 bg-white/95 backdrop-blur-md shadow-lg' : 'py-4 bg-white/85 backdrop-blur-md'
        }`}
      >
        <Link to="/" className="nav-brand">
          <img 
            src={LOGO_URL} 
            alt="PRSL Logo" 
            className={`transition-all duration-300 ${isScrolled ? 'h-[38px]' : 'h-[45px]'}`}
          />
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex items-center gap-8 list-none">
          {navLinks.map((link) => (
            <li key={link.name} className="relative group py-2">
              {link.href && (link.href.startsWith('http') || link.href.includes('#')) ? (
                 <a 
                   href={link.href} 
                   className="text-[#555] no-underline font-bold text-[0.9rem] uppercase transition-colors hover:text-[#C8102E] relative block"
                 >
                   {link.name}
                   {link.dropdown && <ChevronDown size={14} className="inline ml-1" />}
                   <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C8102E] transition-all duration-300 group-hover:w-full" />
                 </a>
              ) : link.href ? (
                <Link 
                  to={link.href} 
                  className="text-[#555] no-underline font-bold text-[0.9rem] uppercase transition-colors hover:text-[#C8102E] relative block"
                >
                  {link.name}
                  {link.dropdown && <ChevronDown size={14} className="inline ml-1" />}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C8102E] transition-all duration-300 group-hover:w-full" />
                </Link>
              ) : (
                <button className="text-[#555] no-underline font-bold text-[0.9rem] uppercase transition-colors hover:text-[#C8102E] relative block cursor-default">
                   {link.name}
                   {link.dropdown && <ChevronDown size={14} className="inline ml-1" />}
                   <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C8102E] transition-all duration-300 group-hover:w-full" />
                </button>
              )}
              
                  {link.dropdown && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-black/5 border-t-4 border-t-[#C8102E] min-w-[240px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl rounded-b-md">
                      {link.dropdown.map((sub) => (
                        sub.href.startsWith('http') || sub.href.includes('#') ? (
                          <a 
                            key={sub.name}
                            href={sub.href}
                            target={sub.href.startsWith('http') ? "_blank" : undefined}
                            rel={sub.href.startsWith('http') ? "noreferrer" : undefined}
                            className="block px-5 py-3 text-[#1a1a1a] no-underline text-[0.85rem] font-semibold border-b border-black/5 hover:bg-gray-50 hover:text-[#C8102E] hover:pl-7 transition-all"
                          >
                            {sub.name}
                          </a>
                        ) : (
                          <Link 
                            key={sub.name}
                            to={sub.href}
                            className="block px-5 py-3 text-[#1a1a1a] no-underline text-[0.85rem] font-semibold border-b border-black/5 hover:bg-gray-50 hover:text-[#C8102E] hover:pl-7 transition-all"
                          >
                            {sub.name}
                          </Link>
                        )
                      ))}
                    </div>
                  )}
            </li>
          ))}
          <li>
            <a href="https://soccer.sincsports.com/schedule.aspx?tid=DSPCH&tab=3&sub=0" target="_blank" rel="noreferrer" className="bg-[#C8102E] text-white px-5 py-2 rounded-md font-bold text-[0.85rem] uppercase hover:bg-[#a00c24] transition-all">
              Schedule
            </a>
          </li>
        </ul>

        {/* Hamburger */}
        <button 
          className="lg:hidden flex flex-col gap-1.5 cursor-pointer z-[1002]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className={`w-8 h-0.5 bg-black transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-8 h-0.5 bg-black transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-8 h-0.5 bg-black transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
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
            className="fixed inset-0 bg-white z-[1001] flex flex-col pt-32 px-5 pb-20 items-center overflow-y-auto"
          >
            {navLinks.map((link) => (
              <div key={link.name} className="w-full max-w-sm mb-5 pb-5 border-b border-black/5 text-center">
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
                            className="text-lg font-bold text-[#1a1a1a] uppercase py-3 hover:text-[#C8102E]"
                          >
                            {sub.name}
                          </a>
                        ) : (
                          <Link 
                            key={sub.name} 
                            to={sub.href} 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-lg font-bold text-[#1a1a1a] uppercase py-3 hover:text-[#C8102E]"
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
                    className="text-xl font-bold text-[#1a1a1a] uppercase py-3 block hover:text-[#C8102E]"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <div className="text-xl font-bold text-[#1a1a1a] uppercase py-3 block">
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
      <section id="home" className="pt-32 lg:pt-48 pb-10 px-[5%] overflow-hidden relative min-h-screen">
        <div className="mesh-bg" />
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(6rem,20vw,20rem)] font-black text-transparent stroke-2 stroke-black/5 pointer-events-none z-[-1] whitespace-nowrap select-none opacity-10">
          PRSL
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-12 gap-5">
          <motion.div 
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="col-span-12 lg:col-span-8 glass-panel p-8 lg:p-12 border-l-8 border-l-[#111] border-b-8 border-b-[#C8102E] min-h-[400px] flex flex-col justify-center"
          >
            <div className="mb-4">
              <span className="dark-badge">EST. 2015</span>
            </div>
            <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-black italic leading-[1.1] mb-5 tracking-tighter">
              <span className="gradient-text block">Pacific Regional</span>
              <span className="text-[#111111] drop-shadow-sm">Soccer League</span>
            </h1>
            <p className="font-semibold text-[#1a1a1a] mb-8 text-[clamp(1.1rem,1.5vw,1.3rem)]">
              <span className="bg-[#111] text-white px-2.5 py-1 rounded font-black uppercase tracking-wider shadow-[3px_3px_0px_#C8102E] mr-2">L.A.&apos;s #1</span>
              <span className="inline-block lg:inline">Youth Soccer League</span>
            </p>
            
            <div className="flex flex-wrap gap-4 mb-5">
              <Link to="/spring-league" className="btn-outline">Spring Registration</Link>
              <a href="https://soccer.sincsports.com/schedule.aspx?tid=DSPCH&tab=3&sub=0" target="_blank" rel="noreferrer" className="btn-outline">Schedule</a>
              <a href="#events" className="btn-outline">View Events</a>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#summer-event" className="btn-primary bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-300/30 btn-pulse-summer">Summer</a>
              <a href="#fall-event" className="btn-primary bg-gradient-to-br from-red-600 to-red-800 shadow-red-300/30 btn-pulse-fall">Fall</a>
            </div>
          </motion.div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">
            <motion.div 
              variants={revealVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="glass-panel group aspect-[4/3] lg:flex-1 bg-white"
            >
              <img 
                src="https://images.pacificregionalsoccer.com/PacificRegionSL2025Art%20(1).avif" 
                alt="PRSL 2025 Art" 
                className="w-full h-full object-contain p-5 transition-transform duration-700 group-hover:scale-105" 
              />
            </motion.div>
            <motion.div 
              variants={revealVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="glass-panel group aspect-[4/3] lg:flex-1 bg-white"
            >
              <img 
                src="https://images.pacificregionalsoccer.com/CalSouth_Sanctioned_League_25_26%20LOGO.avif" 
                alt="CalSouth Sanctioned League" 
                className="w-full h-full object-contain p-5 transition-transform duration-700 group-hover:scale-105" 
              />
            </motion.div>
          </div>
        </div>

        {/* Ticker */}
        <div className="mt-10 lg:mt-20 overflow-hidden bg-[#111111] -mx-[5%] lg:-mx-[5%]">
            <div className="ticker-track">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-15 py-4 items-center shrink-0">
                  <div className="flex items-center gap-3 text-white/90">
                    <span className="italic italic-serif font-medium">"Talent without working hard is nothing."</span>
                    <span className="bg-white text-[#C8102E] px-2.5 py-0.5 rounded font-black uppercase text-[0.8rem] tracking-wider shrink-0">Cristiano Ronaldo</span>
                  </div>
                  <span className="text-gray-600 text-xl">/</span>
                  <div className="flex items-center gap-3 text-white/90">
                    <span className="italic italic-serif font-medium">"You have to fight to reach your dream."</span>
                    <span className="bg-white text-[#C8102E] px-2.5 py-0.5 rounded font-black uppercase text-[0.8rem] tracking-wider shrink-0">Lionel Messi</span>
                  </div>
                  <span className="text-gray-600 text-xl">/</span>
                  <div className="flex items-center gap-3 text-white/90">
                    <span className="italic italic-serif font-medium">"Football is played with the head. Your feet are just the tools."</span>
                    <span className="bg-white text-[#C8102E] px-2.5 py-0.5 rounded font-black uppercase text-[0.8rem] tracking-wider shrink-0">Andrea Pirlo</span>
                  </div>
                   <span className="text-gray-600 text-xl">/</span>
                  <div className="flex items-center gap-3 text-white/90">
                    <span className="italic italic-serif font-medium">"I learned all about life with a ball at my feet."</span>
                    <span className="bg-white text-[#C8102E] px-2.5 py-0.5 rounded font-black uppercase text-[0.8rem] tracking-wider shrink-0">Ronaldinho</span>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-[5%]">
        <div className="max-w-6xl mx-auto grid grid-cols-12 gap-5">
          <motion.div 
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="col-span-12 lg:col-span-8 glass-panel p-8 lg:p-10"
          >
            <h2 className="gradient-text text-4xl mb-2 font-bold uppercase tracking-tight">About PRSL</h2>
            <h3 className="text-[#C8102E] text-xl mb-6 font-bold uppercase">We’ve Got Team Spirit</h3>
            <div className="rounded-lg overflow-hidden mb-6 shadow-sm aspect-video h-[250px] w-full">
               <img 
                 src="https://images.pacificregionalsoccer.com/Website%20Banner%20or%20Header.avif" 
                 alt="About PRSL" 
                 className="w-full h-full object-cover" 
               />
            </div>
            <p className="text-[#555] mb-4 text-lg">
              <strong>Pacific Regional Soccer League</strong> is home for some of the most competitive forces in the Los Angeles area.
            </p>
            <p className="text-[#555]">
              Serving the San Fernando Valley, Pasadena, Glendale, and San Gabriel Valley with premier competition and top-tier facilities.
            </p>
          </motion.div>
          
          <motion.div 
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="col-span-12 lg:col-span-4 glass-panel bg-white p-2 min-h-[300px]"
          >
             <img 
               src="https://images.pacificregionalsoccer.com/soccer%20field.jpg" 
               alt="Soccer Field Aerial" 
               className="w-full h-full object-cover rounded-lg" 
             />
          </motion.div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-20 px-[5%] bg-white/30">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="gradient-text text-[clamp(2.2rem,5vw,3rem)] font-black uppercase mb-3"
          >
            Upcoming Events
          </motion.h2>
          <div className="w-16 h-1 bg-[#C8102E] mx-auto rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
           {/* Summer */}
           <motion.div 
             id="summer-event"
             variants={revealVariants}
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             className="glass-panel p-8 text-center bg-white flex flex-col items-center gap-6 h-full"
           >
              <div className="w-full flex-1 flex flex-col">
                <div className="min-h-[120px] flex flex-col justify-center">
                  <h3 className="text-[#C8102E] text-3xl font-black mb-2 uppercase">Summer League 2026</h3>
                  <p className="font-bold text-lg text-[#111] mb-6">Now accepting applications.</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <a href="https://soccer.sincsports.com/register/start.aspx?tid=SUMCIR&tab=2&sub=0" target="_blank" rel="noreferrer" className="block transform transition-transform hover:scale-[1.02] mb-6">
                    <img src="https://images.pacificregionalsoccer.com/unnamed%20(3).png" alt="Summer League" className="rounded-lg shadow-md max-w-full h-auto mx-auto" />
                  </a>
                </div>
              </div>
              <a href="https://soccer.sincsports.com/register/start.aspx?tid=SUMCIR&tab=2&sub=0" target="_blank" rel="noreferrer" className="btn-primary bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-200/50 btn-pulse-summer w-fit">
                Register Now
              </a>
           </motion.div>

           {/* Fall */}
           <motion.div 
             id="fall-event"
             variants={revealVariants}
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             className="glass-panel p-8 text-center bg-white flex flex-col items-center gap-6 h-full"
           >
              <div className="w-full flex-1 flex flex-col">
                <div className="min-h-[120px] flex flex-col justify-center">
                  <h3 className="text-[#C8102E] text-3xl font-black mb-2 uppercase">Fall League 2026</h3>
                  <p className="font-bold text-lg text-[#111] mb-6">Now accepting applications.</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <a href="https://soccer.sincsports.com/register/start.aspx?tid=PACRSL&tab=2&sub=0" target="_blank" rel="noreferrer" className="block transform transition-transform hover:scale-[1.02] mb-6">
                    <img src="https://images.pacificregionalsoccer.com/Fall%20League%202026.png" alt="Fall League" className="rounded-lg shadow-md max-w-full h-auto mx-auto" />
                  </a>
                </div>
              </div>
              <a href="https://soccer.sincsports.com/register/start.aspx?tid=PACRSL&tab=2&sub=0" target="_blank" rel="noreferrer" className="btn-primary bg-gradient-to-br from-red-600 to-red-800 shadow-red-200/50 btn-pulse-fall w-fit">
                Register Now
              </a>
           </motion.div>

           {/* PRO CAMP 2026 */}
           <motion.div 
             id="pro-camp-event"
             variants={revealVariants}
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             className="glass-panel p-8 text-center bg-white flex flex-col items-center gap-6 h-full"
           >
              <div className="w-full flex-1 flex flex-col">
                <div className="min-h-[120px] flex flex-col justify-center">
                  <h3 className="text-[#C8102E] text-3xl font-black mb-1 uppercase">PRO CAMP 2026</h3>
                  <p className="font-bold text-lg text-[#111] mb-6 uppercase tracking-tighter">Elite Player Development</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="block transform transition-transform hover:scale-[1.02] mb-6">
                    <img src="https://images.pacificregionalsoccer.com/ESID%2BPROCAMP2026%20-%20PROCAMP.png" alt="PRO CAMP 2026" className="rounded-lg shadow-md max-w-full h-auto mx-auto" />
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-col items-center gap-2">
                <a 
                  href="https://pacificregional.leagueapps.com/camps/5003785-pro-camp" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-primary bg-gradient-to-br from-red-600 to-red-800 shadow-red-200/50 btn-pulse-fall w-fit uppercase font-black"
                >
                  Register Now
                </a>
              </div>
           </motion.div>

           {/* ES National Team Player ID */}
           <motion.div 
             id="esid-event"
             variants={revealVariants}
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             className="glass-panel p-8 text-center bg-white flex flex-col items-center gap-6 h-full"
           >
              <div className="w-full flex-1 flex flex-col">
                <div className="min-h-[120px] flex flex-col justify-center">
                  <h3 className="text-[#C8102E] text-3xl font-black mb-1 uppercase leading-tight">El Salvador National Team</h3>
                  <p className="font-bold text-lg text-[#111] mb-6 uppercase tracking-tighter">Player ID Event</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="block transform transition-transform hover:scale-[1.02] mb-6">
                    <img src="https://images.pacificregionalsoccer.com/ESID%2BPROCAMP2026%20-%201.png" alt="El Salvador ID Event" className="rounded-lg shadow-md max-w-full h-auto mx-auto" />
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-col items-center gap-2">
                <a 
                  href="https://www.jotform.com/252498415438870" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-primary bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-200/50 btn-pulse-fall w-fit uppercase font-black"
                >
                  Register Now
                </a>
              </div>
           </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-12 bg-[#111] -mx-[5%] py-5 flex justify-center"
        >
          <img src="https://images.pacificregionalsoccer.com/Mapa%20Pacific.avif" alt="PRSL Map" className="max-w-7xl w-full h-auto object-contain" />
        </motion.div>
      </section>

      {/* Education & Licensing */}
      <section id="education" className="py-20 px-[5%]">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="gradient-text text-4xl font-black uppercase mb-3"
          >
            Education & Licensing
          </motion.h2>
          <p className="text-[#555] font-medium">Education is one of our top priorities.</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
           <motion.div 
             variants={revealVariants}
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             className="glass-panel p-10 flex flex-col items-center text-center bg-white"
           >
              <img src="https://images.pacificregionalsoccer.com/Calsouth%20Referre-program.avif" alt="Referee" className="h-32 object-contain mb-6" />
              <h3 className="text-xl font-bold uppercase mb-4">Referee Program</h3>
              <a href="https://calsouth.com/new-referees/" target="_blank" rel="noreferrer" className="btn-outline w-full max-w-[250px]">Click Here</a>
           </motion.div>

           <motion.div 
             variants={revealVariants}
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             className="glass-panel p-10 flex flex-col items-center text-center bg-white"
           >
              <img src="https://images.pacificregionalsoccer.com/Coaching-education%20logo.avif" alt="Coaching" className="h-32 object-contain mb-6" />
              <h3 className="text-xl font-bold uppercase mb-4">Coaching Education</h3>
              <a href="https://calsouth.com/competitive-licensing/" target="_blank" rel="noreferrer" className="btn-outline w-full max-w-[250px]">Click Here</a>
           </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-[5%] bg-white/30">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-5 flex flex-col gap-5">
              <motion.div 
                variants={revealVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass-panel p-10 bg-[#C8102E] text-white flex-1"
              >
                  <h2 className="text-3xl font-black uppercase mb-5">Get In Touch</h2>
                  <p className="mb-8 text-white/90">
                    Have questions about registration, schedules, or events? Reach out to our team.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <span className="block font-black text-sm uppercase mb-1 flex items-center gap-2"><Mail size={16} /> Email:</span>
                      <a href="mailto:pacificregionalsoccerleague@gmail.com" className="block hover:underline text-sm break-all">pacificregionalsoccerleague@gmail.com</a>
                      <a href="mailto:pacificregionalsl@gmail.com" className="block hover:underline text-sm break-all">pacificregionalsl@gmail.com</a>
                    </div>
                  </div>
              </motion.div>
           </div>

           <motion.div 
             variants={revealVariants}
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             className="lg:col-span-7 glass-panel p-10 bg-white"
           >
              <h2 className="text-2xl font-black uppercase text-[#111] mb-8">Contact Us</h2>
              <form id="contactForm" onSubmit={handleFormSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500">Name *</label>
                  <input 
                    type="text" 
                    id="name" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-gray-50 border border-gray-200 p-3 rounded focus:ring-2 focus:ring-[#C8102E] transition-all outline-none" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500">Email *</label>
                  <input 
                    type="email" 
                    id="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-gray-50 border border-gray-200 p-3 rounded focus:ring-2 focus:ring-[#C8102E] transition-all outline-none" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500">Write a Message *</label>
                  <textarea 
                    id="message" 
                    required
                    rows={4} 
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-gray-50 border border-gray-200 p-3 rounded focus:ring-2 focus:ring-[#C8102E] transition-all outline-none resize-none"
                  ></textarea>
                </div>

                <div>
                  <button 
                    type="submit" 
                    disabled={formStatus === 'submitting'}
                    className={`btn-primary w-full ${formStatus === 'submitting' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {formStatus === 'submitting' ? 'Submitting...' : 'Submit Message'}
                  </button>
                </div>
                
                {formStatus === 'success' && (
                  <div className="text-green-600 font-bold text-center mt-2">
                    Message saved successfully!
                  </div>
                )}
                {formStatus === 'error' && (
                  <div className="text-red-500 font-bold text-center mt-2">
                    Something went wrong. Please try again.
                  </div>
                )}
              </form>
           </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111] text-white py-16 px-5 text-center relative z-10 border-t-4 border-t-[#C8102E]">
          <motion.img 
            whileHover={{ scale: 1.1, rotate: 5 }}
            src={LOGO_URL} 
            alt="PRSL Logo" 
            className="h-16 mx-auto mb-6 bg-white rounded-full p-1 aspect-square cursor-pointer"
          />
          <div className="font-black text-xl mb-4 tracking-widest uppercase">PACIFIC REGIONAL SOCCER LEAGUE</div>
          <div className="flex justify-center gap-6 mb-10">
            <a href="https://instagram.com/pacificregionalsoccer" target="_blank" rel="noreferrer" className="hover:text-[#C8102E] hover:scale-110 transition-all text-2xl">
              <Instagram />
            </a>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
             ©2015-2026 by Pacific Regional Soccer League.<br />All Rights Reserved.
          </p>
      </footer>

      {/* Sticky Mobile Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-[#111] border-t-2 border-t-[#C8102E] z-[1000] shadow-[0_-10px_25px_rgba(0,0,0,0.2)]">
        <a href="mailto:pacificregionalsoccerleague@gmail.com" className="flex items-center justify-center gap-2 p-4 text-white text-sm font-bold uppercase no-underline">
          <Mail size={18} /> Contact PRSL
        </a>
      </div>

      {/* Back to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-20 right-5 w-12 h-12 bg-[#C8102E]/90 text-white border-none rounded-lg cursor-pointer flex justify-center items-center shadow-lg hover:-translate-y-1 hover:bg-[#a00c24] transition-all z-[999]"
          >
            <ArrowUp />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
