import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  ChevronDown, 
  Mail, 
  ArrowUp, 
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LOGO_URL = "https://images.pacificregionalsoccer.com/pacific%20regional%20soccer%20league%20logo.avif";

export default function AgeMatrix() {
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
    { name: "SPRING 26'", dropdown: [
      { name: 'Schedule', href: 'https://soccer.sincsports.com/schedule.aspx?tid=DSPCH&tab=3&sub=0' },
    ]},
    { name: 'Events', href: '/#events', dropdown: [
      { name: 'Spring League', href: '/spring-league' },
      { name: 'Summer League', href: 'https://soccer.sincsports.com/register/start.aspx?tid=SUMCIR&tab=2&sub=0' },
      { name: 'Fall League', href: 'https://soccer.sincsports.com/register/start.aspx?tid=PACRSL&tab=2&sub=0' },
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
      <div className="max-w-4xl mx-auto pt-32 lg:pt-48 pb-12 px-5 text-center flex-1">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 border-b border-white/10 pb-10"
        >
          <h4 className="text-[#C8102E] font-black uppercase text-xs tracking-[3px] mb-3">PRSL REGISTRATION</h4>
          <h1 className="text-[clamp(2.2rem,5vw,3.5rem)] font-black italic uppercase leading-none mb-4">Age Matrix 2026/2027</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Please refer to the charts below to determine the appropriate age bracket and format for your team based on birth year.</p>
        </motion.div>

        <div className="flex flex-col gap-12 items-center">
            <motion.img 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              src="https://images.pacificregionalsoccer.com/Screenshot%202026-05-18%20at%207.54.21%E2%80%AFPM.png" 
              alt="Age Matrix 2026/2027" 
              className="w-full rounded-xl border border-white/10 shadow-2xl cursor-zoom-in hover:scale-[1.01] transition-transform"
              onClick={() => setSelectedImg("https://images.pacificregionalsoccer.com/Screenshot%202026-05-18%20at%207.54.21%E2%80%AFPM.png")}
            />
            
            <motion.img 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              src="https://media.pacificregionalsoccer.com/age-matrix-flyer-2.png?v=2" 
              alt="Age Matrix Flyer 2" 
              className="w-full rounded-xl border border-white/10 shadow-2xl cursor-zoom-in hover:scale-[1.01] transition-transform"
              onClick={() => setSelectedImg("https://media.pacificregionalsoccer.com/age-matrix-flyer-2.png?v=2")}
            />

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-8 lg:p-12 text-left"
            >
              <h2 className="text-3xl font-black italic uppercase mb-8 border-b border-[#C8102E] pb-4 inline-block tracking-tight">2026-2027 Age Matrix</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-6">
                  <h3 className="text-[#C8102E] font-black text-xl uppercase italic pb-2 border-b border-white/5">7v7 Format</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-white font-black text-lg uppercase">U7</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2019 thru July 31, 2020</div>
                    </div>
                    <div>
                      <div className="text-white font-black text-lg uppercase">U8</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2018 thru July 31, 2019</div>
                    </div>
                    <div>
                      <div className="text-white font-black text-lg uppercase">U9</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2017 thru July 31, 2018</div>
                    </div>
                    <div>
                      <div className="text-white font-black text-lg uppercase">U10</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2016 thru July 31, 2017</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[#C8102E] font-black text-xl uppercase italic pb-2 border-b border-white/5">9v9 Format</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-white font-black text-lg uppercase">U11</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2015 thru July 31, 2016</div>
                    </div>
                    <div>
                      <div className="text-white font-black text-lg uppercase">U12</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2014 thru July 31, 2015</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[#C8102E] font-black text-xl uppercase italic pb-2 border-b border-white/5">11v11 Format</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-white font-black text-lg uppercase">U13</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2013 thru July 31, 2014</div>
                    </div>
                    <div>
                      <div className="text-white font-black text-lg uppercase">U14</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2012 thru July 31, 2013</div>
                    </div>
                    <div>
                      <div className="text-white font-black text-lg uppercase">U15</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2011 thru July 31, 2012</div>
                    </div>
                    <div>
                      <div className="text-white font-black text-lg uppercase">U16</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2010 thru July 31, 2011</div>
                    </div>
                    <div>
                      <div className="text-white font-black text-lg uppercase">U17</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2009 thru July 31, 2010</div>
                    </div>
                    <div>
                      <div className="text-white font-black text-lg uppercase">U18</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2008 thru July 31, 2009</div>
                    </div>
                    <div>
                      <div className="text-white font-black text-lg uppercase">U19</div>
                      <div className="text-gray-400 text-sm">Aug 1, 2007 thru July 31, 2008</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
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
