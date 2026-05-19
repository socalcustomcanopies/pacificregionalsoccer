import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  ChevronDown, 
  Mail, 
  ArrowUp, 
  Book,
  Download,
  ShieldCheck,
  IdCard,
  Gavel,
  ListOrdered,
  CreditCard,
  UserCheck,
  Table,
  FileText,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LOGO_URL = "https://images.pacificregionalsoccer.com/pacific%20regional%20soccer%20league%20logo.avif";

export default function Rules() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTab, setActiveTab] = useState('mission');
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 500);

      // Simple active section detection
      let currentSection = 'mission';
      const sectionIds = ['mission', 'registration', 'rules-of-play', 'scoring', 'ref-fees', 'fees', 'ref-authority', 'penalties-matrix', 'policy-en', 'policy-es', 'policy-ar'];
      
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 150) {
          currentSection = id;
        }
      }
      setActiveTab(currentSection);
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

  const toc = [
    { id: 'mission', name: 'Mission & Brackets', icon: Table },
    { id: 'registration', name: 'Registration & Rosters', icon: IdCard },
    { id: 'rules-of-play', name: 'Rules of Play', icon: Gavel },
    { id: 'scoring', name: 'Scoring System', icon: ListOrdered },
    { id: 'ref-fees', name: 'Referee Fee Schedule', icon: CreditCard },
    { id: 'fees', name: 'Cancellations & Forfeits', icon: CreditCard },
    { id: 'ref-authority', name: 'Referee Authority', icon: UserCheck },
    { id: 'penalties-matrix', name: 'Penalties Matrix', icon: Table },
    { id: 'policy-en', name: 'Abuse Policy (English)', icon: FileText },
    { id: 'policy-es', name: 'Abuse Policy (Spanish)', icon: FileText },
    { id: 'policy-ar', name: 'Abuse Policy (Armenian)', icon: FileText },
  ];

  return (
    <div className="relative font-sans bg-[#050505] text-white min-h-screen">
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
      <div className="max-w-7xl mx-auto pt-32 lg:pt-48 pb-12 px-5 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* TOC Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-36 h-fit">
          <div className="text-[#C8102E] font-extrabold uppercase text-xs tracking-[2px] mb-4">Quick Navigation</div>
          <ul className="list-none p-0 m-0 border-l-2 border-white/10">
            {toc.map((item) => (
              <li key={item.id} className="ml-[-2px]">
                <a 
                  href={`#${item.id}`}
                  className={`block px-5 py-3 text-sm no-underline transition-all border-l-2 border-transparent ${activeTab === item.id ? 'text-white border-l-[#C8102E] bg-gradient-to-r from-red-600/10 to-transparent' : 'text-gray-500 hover:text-white'}`}
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Mobile TOC Toggle */}
        <div className="lg:hidden block mb-5">
           <button 
             onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
             className="w-full flex items-center justify-between bg-red-600/10 border border-[#C8102E] text-white p-4 rounded-lg font-bold uppercase text-sm"
           >
             <span className="flex items-center gap-3"><Book size={18} /> League Rules & Regulations</span>
             <ChevronDown size={18} className={`transition-transform ${isMobileTocOpen ? 'rotate-180' : ''}`} />
           </button>
           
           <AnimatePresence>
             {isMobileTocOpen && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="mt-2 bg-[#111] border border-white/10 rounded-lg p-2 flex flex-col gap-1"
               >
                 {toc.map((item) => (
                   <a 
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setIsMobileTocOpen(false)}
                    className={`p-3 text-sm rounded ${activeTab === item.id ? 'bg-[#C8102E] text-white' : 'text-gray-400 hover:bg-white/5'}`}
                   >
                     {item.name}
                   </a>
                 ))}
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 flex flex-col gap-10">
          
          <section id="mission" className="glass-panel p-8 lg:p-12 border border-white/10 bg-[#0f0f0f]/95 scroll-mt-36">
             <div className="text-[#C8102E] font-bold text-xs tracking-widest mb-2 uppercase">OUR MISSION</div>
             <h2 className="text-3xl font-black italic uppercase mb-6 border-b border-white/10 pb-4">Mission & Brackets</h2>
             <p className="text-gray-400 leading-relaxed mb-4">We strive to give you a great experience. Top competition with competitive brackets. Come join us for a great season of soccer fun in beautiful Southern California.</p>
             <p className="text-gray-400 leading-relaxed mb-6">This season will focus on the <strong>2026/2027 calendar year age matrix</strong>. We will offer the following Brackets:</p>
             
             <ul className="list-disc pl-5 mb-8 text-gray-400 space-y-2">
                <li><strong>7v7</strong> for U7, U8, U9, U10</li>
                <li><strong>9v9</strong> for U11 & U12</li>
                <li><strong>11v11</strong> for U13 & Older</li>
             </ul>

             {/* Text-based Age Matrix */}
             <div className="mb-10 bg-white/5 border border-white/10 rounded-xl p-6 lg:p-10">
               <h3 className="text-xl font-black italic uppercase mb-6 text-white border-b border-[#C8102E] pb-2 inline-block shadow-[0_4px_0_-2px_#C8102E]">2026-2027 Age Matrix</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                 <div className="space-y-4">
                   <h4 className="text-[#C8102E] font-bold uppercase text-sm italic border-b border-white/5 pb-1">7v7 Format</h4>
                   <div className="space-y-2">
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U7</span>
                       <span className="text-gray-400">Aug 1, 2019 - July 31, 2020</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U8</span>
                       <span className="text-gray-400">Aug 1, 2018 - July 31, 2019</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U9</span>
                       <span className="text-gray-400">Aug 1, 2017 - July 31, 2018</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U10</span>
                       <span className="text-gray-400">Aug 1, 2016 - July 31, 2017</span>
                     </div>
                   </div>
                 </div>
                 <div className="space-y-4">
                   <h4 className="text-[#C8102E] font-bold uppercase text-sm italic border-b border-white/5 pb-1">9v9 Format</h4>
                   <div className="space-y-2">
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U11</span>
                       <span className="text-gray-400">Aug 1, 2015 - July 31, 2016</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U12</span>
                       <span className="text-gray-400">Aug 1, 2014 - July 31, 2015</span>
                     </div>
                   </div>
                 </div>
                 <div className="space-y-4">
                   <h4 className="text-[#C8102E] font-bold uppercase text-sm italic border-b border-white/5 pb-1">11v11 Format</h4>
                   <div className="space-y-2">
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U13</span>
                       <span className="text-gray-400">Aug 1, 2013 - July 31, 2014</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U14</span>
                       <span className="text-gray-400">Aug 1, 2012 - July 31, 2013</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U15</span>
                       <span className="text-gray-400">Aug 1, 2011 - July 31, 2012</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U16</span>
                       <span className="text-gray-400">Aug 1, 2010 - July 31, 2011</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U17</span>
                       <span className="text-gray-400">Aug 1, 2009 - July 31, 2010</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U18</span>
                       <span className="text-gray-400">Aug 1, 2008 - July 31, 2009</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px]">
                       <span className="text-white font-bold">U19</span>
                       <span className="text-gray-400">Aug 1, 2007 - July 31, 2008</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             <div className="bg-red-600/10 border-l-4 border-[#C8102E] p-6 mb-8 rounded-r-lg">
                <p className="font-bold mb-2 uppercase tracking-tight text-[#C8102E]">Match Days</p>
                <p className="text-sm text-gray-300">Games will be played Saturday and/or Sunday. (Might have to make up any missed games by playing 2 games in 1 day)</p>
             </div>

             <img 
               src="https://images.pacificregionalsoccer.com/Screenshot%202026-05-18%20at%207.54.21%E2%80%AFPM.png" 
               alt="Age Matrix" 
               className="w-full rounded-lg border border-white/10 shadow-2xl cursor-zoom-in hover:scale-[1.01] transition-transform"
               onClick={() => setSelectedImg("https://images.pacificregionalsoccer.com/Screenshot%202026-05-18%20at%207.54.21%E2%80%AFPM.png")}
             />
          </section>

          <section id="registration" className="glass-panel p-8 lg:p-12 border border-white/10 bg-[#0f0f0f]/95 scroll-mt-36">
             <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-3"><IdCard className="text-[#C8102E]" /> Team Registration & Rosters</h2>
             
             <h3 className="text-[#C8102E] font-bold text-lg mb-3">Check-In Game Day</h3>
             <div className="space-y-4 text-gray-400 mb-8">
               <p>All teams must check in at the field marshal table 30 minutes prior to each game. All players and a coach must be present at the time of the field check-in. A team that fails to report fifteen minutes prior to scheduled kick-off will forfeit the game. Failure to check-in will result in automatic disqualification from the tournament without a refund of the League fee.</p>
               <p><strong>No card, no play.</strong> Only Cal South / USYS 2025/2026 ID's will be accepted. All U.S. teams must provide valid player identification cards with a photograph.</p>
               <p>All coaches must have a team binder which consists of Player Medical Liability/Media Release forms & Birth certificates for each player on hand.</p>
             </div>

             <h3 className="text-[#C8102E] font-bold text-lg mb-3">Roster Limits</h3>
             <ul className="list-disc pl-5 text-gray-400 space-y-2 mb-8">
                <li>U7-U10: Up to 12 players</li>
                <li>U11-U12: Up to 16 players</li>
                <li>U13-U19: Up to 22 players</li>
             </ul>

             <div className="bg-red-600/10 border-l-4 border-[#C8102E] p-6 rounded-r-lg mb-8">
                <p className="font-bold mb-2">Club Pass Rule:</p>
                <p className="text-sm text-gray-300 italic">A player may ONLY be rostered to one team as their Primary Team. Players may play no more than 2 games per day within the same club, but cannot play in the same flight/bracket. Players that play up in an age group as their Primary team may be club-passed to a team in their actual age group.</p>
             </div>

             <h3 className="text-[#C8102E] font-bold text-lg mb-3">Flights</h3>
             <p className="text-gray-400">In divisions which have a large number of teams, Flight 1 and Flight 2 will be created if the necessary criteria have been met.</p>
          </section>

          <section id="rules-of-play" className="glass-panel p-8 lg:p-12 border border-white/10 bg-[#0f0f0f]/95 scroll-mt-36">
             <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-3"><Gavel className="text-[#C8102E]" /> Rules of Play</h2>
             <p className="text-gray-400 mb-6 font-medium italic">FIFA Laws of the Game will apply as modified by USYSA as described herein. Referees have been instructed to start the game on time.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                <div>
                   <h3 className="text-[#C8102E] font-black mb-4 uppercase text-sm tracking-widest border-b border-white/5 pb-2">Duration of Game, Halves & Ball Size</h3>
                   <ul className="text-gray-300 text-sm space-y-4">
                      <li className="flex justify-between items-center bg-white/5 p-3 rounded">
                        <span className="font-bold">U13 & Older</span> 
                        <span className="font-black text-[#C8102E] bg-white/10 px-2 py-1 rounded">Ball Size 5</span>
                      </li>
                      <li className="flex justify-between items-center bg-white/5 p-3 rounded">
                        <span className="font-bold">U7 - U12</span> 
                        <span className="font-black text-[#C8102E] bg-white/10 px-2 py-1 rounded">Ball Size 4</span>
                      </li>
                   </ul>
                </div>
                <div>
                   <h3 className="text-[#C8102E] font-black mb-4 uppercase text-sm tracking-widest border-b border-white/5 pb-2">Uniforms</h3>
                   <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-3 rounded text-center border border-white/5">
                           <span className="block text-[10px] text-gray-500 uppercase font-black mb-1">Home Team</span>
                           <span className="font-black text-white uppercase text-xs">Light Jersey</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded text-center border border-white/5">
                           <span className="block text-[10px] text-gray-500 uppercase font-black mb-1">Away Team</span>
                           <span className="font-black text-white uppercase text-xs">Dark Jersey</span>
                        </div>
                     </div>
                     <p className="text-[11px] text-gray-400 leading-relaxed italic border-l-2 border-[#C8102E] pl-3">
                       The team listed as the home team is responsible for providing 3 game balls. 
                       If there is a uniform conflict, the team listed as the home team must change uniforms (Jerseys).
                     </p>
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <div>
                  <h3 className="text-white font-black uppercase mb-4 flex items-center gap-2 italic tracking-tight underline decoration-[#C8102E] decoration-2 underline-offset-4">Match Format</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-[#C8102E] font-bold text-xs uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#C8102E] rounded-full"></span> Group Play
                      </h4>
                      <p className="text-gray-400 text-[13px] leading-relaxed">
                        All group games will be called not less than five (5) minutes prior to the start of the next scheduled game without regard to the amount of time played in each half up to that point. A game is “complete” upon completion of one half. The final result will be based upon the score at the time the game is called. Group play games can end in a tie.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-[#C8102E] font-bold text-xs uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#C8102E] rounded-full"></span> Playoffs
                      </h4>
                      <p className="text-gray-400 text-[13px] leading-relaxed">
                        Games tied after regulation will have the match decided by FIFA Penalty Kicks, which will immediately follow the end of the regulation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h3 className="text-white font-black uppercase mb-4 flex items-center gap-2 italic tracking-tight underline decoration-[#C8102E] decoration-2 underline-offset-4">Substitutions & Equipment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 p-5 rounded-lg border border-white/5 h-full">
                       <span className="block font-black text-[#C8102E] text-xs uppercase mb-2">Substitutions</span>
                       <p className="text-xs text-gray-400 leading-relaxed">
                         Substitutions shall be unlimited. Substitutions may be made, with the consent of the referee, at any stoppage in play. (USYSA Rule 302 Cal South Rule 2.9)
                       </p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-lg border border-white/5 h-full">
                       <span className="block font-black text-[#C8102E] text-xs uppercase mb-2">Players Equipment</span>
                       <p className="text-xs text-gray-400 leading-relaxed">
                         All equipment will be approved at the discretion of the Center referee who will determine the safety and suitability of a player’s equipment.
                       </p>
                    </div>
                  </div>
                </div>
             </div>
          </section>

          <section id="scoring" className="glass-panel p-8 lg:p-12 border border-white/10 bg-[#0f0f0f]/95 scroll-mt-36">
             <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-3"><ListOrdered className="text-[#C8102E]" /> Scoring System</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <h3 className="text-white font-bold uppercase text-sm tracking-widest border-b border-white/10 pb-2">Standings Points</h3>
                   <ul className="space-y-3">
                      <li className="flex justify-between items-center text-sm"><span className="text-gray-400 uppercase">Win</span> <span className="font-black text-xl text-green-500">3 Points</span></li>
                      <li className="flex justify-between items-center text-sm"><span className="text-gray-400 uppercase">Tie</span> <span className="font-black text-xl text-yellow-500">1 Point</span></li>
                      <li className="flex justify-between items-center text-sm"><span className="text-gray-400 uppercase">Loss</span> <span className="font-black text-xl text-red-500">0 Points</span></li>
                      <li className="flex justify-between items-center text-sm"><span className="text-gray-400 uppercase">Forfeit (2-0 Score)</span> <span className="font-black text-lg text-white">3 Points</span></li>
                   </ul>
                </div>
                <div>
                   <h3 className="text-white font-bold uppercase text-sm tracking-widest border-b border-white/10 pb-2">Tie-Breakers</h3>
                   <ol className="list-decimal pl-5 space-y-3 text-sm text-gray-400 mt-4">
                      <li>Head to head results (dropped if &gt;2 teams tied)</li>
                      <li>Winner of most games</li>
                      <li>Least goals allowed in all flight games</li>
                      <li>Cumulative goal differential</li>
                      <li>FIFA Penalty Kicks</li>
                   </ol>
                </div>
             </div>
          </section>

          <section id="ref-fees" className="glass-panel p-8 lg:p-12 border border-white/10 bg-[#0f0f0f]/95 scroll-mt-36">
             <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-3"><CreditCard className="text-[#C8102E]" /> Referee Fee Schedule</h2>
             <img 
               src="https://images.pacificregionalsoccer.com/REFEREE%20SCHEDULE.avif" 
               alt="Referee Fee Schedule" 
               className="w-full rounded-lg border border-white/10 shadow-2xl cursor-zoom-in group"
               onClick={() => setSelectedImg("https://images.pacificregionalsoccer.com/REFEREE%20SCHEDULE.avif")}
             />
          </section>

          <section id="fees" className="glass-panel p-8 lg:p-12 border border-white/10 bg-[#0f0f0f]/95 scroll-mt-36">
             <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-3"><CreditCard className="text-[#C8102E]" /> Cancellations & Forfeits</h2>
             
             <div className="flex flex-col gap-6 mb-10">
                <div className="flex-1">
                   <p className="text-gray-400 mb-6 text-sm">The referee assignor has already scheduled the referees, and their fees will be applied once the match is officially assigned and scheduled.</p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between items-center p-5 bg-white/5 border-l-4 border-[#C8102E] rounded-r-lg">
                        <span className="font-bold uppercase tracking-wide text-xs">Small Sided (7v7 / 9v9)</span>
                        <span className="text-2xl font-black">$250</span>
                      </div>
                      <div className="flex justify-between items-center p-5 bg-white/5 border-l-4 border-[#C8102E] rounded-r-lg">
                        <span className="font-bold uppercase tracking-wide text-xs">Full Field (11v11)</span>
                        <span className="text-2xl font-black">$350</span>
                      </div>
                   </div>
                   <p className="mt-4 text-[11px] text-gray-500 italic">Late Cancellations: No schedule changes permitted after Tuesday. Anything canceled after midnight on Tuesday is subject to the full forfeit fee.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                <div className="p-6 bg-black/50 border border-white/10 rounded-lg text-center">
                   <h4 className="text-[#C8102E] font-black uppercase mb-1 text-xs tracking-widest">Zelle Payment</h4>
                   <p className="text-gray-400 text-xs mb-1">Pacific Regional Soccer League</p>
                   <p className="font-mono text-lg font-black text-white">818-276-7687</p>
                </div>
                <div className="p-6 bg-black/50 border border-white/10 rounded-lg text-center">
                   <h4 className="text-[#C8102E] font-black uppercase mb-1 text-xs tracking-widest">Venmo Payment</h4>
                   <p className="text-gray-400 text-xs mb-1">@Pacific-Regional</p>
                   <p className="font-mono text-lg font-black text-white">Pacific-Regional</p>
                </div>
             </div>

             <div className="bg-red-600/10 border border-red-600/30 p-8 rounded-lg text-center mb-8">
                <strong className="text-[#C8102E] uppercase text-sm block mb-4 tracking-widest">FORFEIT / NO-SHOW POLICY</strong>
                <p className="text-gray-300 text-sm leading-relaxed max-w-2xl mx-auto italic">
                   If a team does not show up to their scheduled game, they will forfeit. The forfeiting team is responsible for paying a <strong>DOUBLE REF FEE</strong> (to cover the fees for BOTH teams) plus a league fine. Games will not be rescheduled for that team until all forfeit fees have been paid in full.
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="md:col-span-2 bg-white/5 p-6 rounded border border-white/5">
                  <h4 className="font-bold uppercase text-white mb-3 text-xs tracking-widest">Refund Policy</h4>
                  <p className="text-xs text-gray-400 leading-relaxed italic">Once a team has been accepted, NO REFUNDS.</p>
                </div>
                <div className="md:col-span-2 bg-white/5 p-6 rounded border border-white/5">
                  <h4 className="font-bold uppercase text-white mb-3 text-xs tracking-widest">Field Rules</h4>
                  <p className="text-xs text-gray-400 leading-relaxed italic">Teams are responsible for field cleanup. No dogs, no sunflower seeds, no trash left behind. No gum or colored drinks (only water) allowed on synthetic turf fields. Spectators must remain in bleacher areas. Absolutely no alcohol, air horns, noise makers, or weapons permitted.</p>
                </div>
             </div>
          </section>

          <section id="ref-authority" className="glass-panel p-8 lg:p-12 border border-white/10 bg-[#0f0f0f]/95 scroll-mt-36">
             <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-3"><UserCheck className="text-[#C8102E]" /> Referee Authority</h2>
             <p className="text-gray-400 mb-6 font-bold">Game conduct is strictly under the jurisdiction of the referee. The decisions of the referee regarding facts connected with play are FINAL.</p>
             
             <div className="space-y-8">
                <div>
                   <h3 className="text-[#C8102E] font-bold text-lg mb-3">Coaching Conduct</h3>
                   <ul className="list-disc pl-5 text-gray-400 text-sm space-y-2">
                     <li>Tone of voice must be instructive and not derogatory.</li>
                     <li>Coaches must stay within 10 yards of the halfway line.</li>
                     <li>No derogatory remarks or gestures allowed to referees, other coaches, or players.</li>
                   </ul>
                </div>

                <div>
                   <h3 className="text-[#C8102E] font-bold text-lg mb-3">Cautions & Ejections</h3>
                   <p className="text-gray-400 text-sm mb-4">A player receiving two cautions (yellow cards) in a single game is considered an ejection (red card). Ejected players/coaches will not return for that game and are suspended for the next scheduled game(s).</p>
                   <div className="bg-red-600/10 border-l-4 border-[#C8102E] p-5 rounded-r">
                      <p className="text-sm font-black text-white italic">Any player or coach who assaults a referee will be expelled from the League immediately.</p>
                   </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded italic text-xs text-gray-400 leading-relaxed">
                   <strong>Coach Suspensions:</strong> During game suspension(s), there can be NO contact between the team and the coach. The coach must be out of sight and sound of the field.
                </div>
             </div>
          </section>

          <section id="penalties-matrix" className="glass-panel p-8 lg:p-12 border border-white/10 bg-[#0f0f0f]/95 scroll-mt-36">
             <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-3"><Table className="text-[#C8102E]" /> Penalties Matrix</h2>
             <img 
               src="https://images.pacificregionalsoccer.com/Penalties%20Matrix.avif" 
               alt="Penalties Matrix" 
               className="w-full rounded-lg border border-white/10 mb-8 cursor-zoom-in group"
               onClick={() => setSelectedImg("https://images.pacificregionalsoccer.com/Penalties%20Matrix.avif")}
             />
             
             <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#C8102E] p-10 rounded-lg text-center relative overflow-hidden group shadow-2xl">
                <div className="absolute top-4 right-[-30px] bg-[#C8102E] text-white text-[10px] font-black px-10 py-1 rotate-45 shadow-lg">MANDATORY</div>
                <ShieldCheck size={48} className="mx-auto mb-4 text-[#C8102E]/40" />
                <h3 className="text-xl font-bold uppercase mb-4 tracking-tighter">U.S. Soccer Policy</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">All teams, coaches, and staff must read and adhere to the Official U.S. Soccer Federation Policy regarding referee abuse and conduct.</p>
                <a 
                  href="https://cdn.sanity.io/files/oyf3dba6/production/1b81f46d14aed6c952a0286ad561fea6eb80e5a5.pdf" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded font-black uppercase text-xs tracking-widest hover:bg-[#C8102E] hover:text-white transition-all shadow-xl hover:-translate-y-1"
                >
                  <Download size={16} /> Download Policy PDF
                </a>
             </div>
          </section>

          <section id="policy-en" className="glass-panel p-8 lg:p-12 border border-red-600/30 bg-gradient-to-br from-[#0f0f0f] to-[#1a0a0a] scroll-mt-36 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 font-black text-xs text-white/5 select-none pointer-events-none tracking-widest">EN STATEMENT</div>
             <h2 className="text-2xl font-black uppercase mb-1 tracking-tight">Official League Statement</h2>
             <div className="text-[#C8102E] text-xs font-bold tracking-[2px] mb-10 pb-4 border-b border-white/5">APRIL 15, 2025</div>
             
             <div className="space-y-6 text-gray-300 text-sm leading-relaxed max-w-2xl">
               <p>League Members and Leaders,</p>
               <p>It is vital for everyone to take a moment to read this official league statement and follow it at all levels. You are responsible for properly training, educating, and supervising your staff, coaches, and members at all times. Our league aims to ensure compliance at all levels to promote its success while safeguarding everyone&apos;s well-being.</p>
               <p>As an official US Soccer competitive league serving our Southern California region, we must adhere to all guidelines. Any incidents that violate these new referee guidelines and regulations will be reported and shared with all other Sanctioning bodies and official leagues/platforms in US Soccer, including but not limited to:</p>
               
               <div className="bg-white/5 p-6 rounded text-center font-black text-lg text-white space-y-2 border border-white/5">
                 <div className="text-[#C8102E] text-[10px] uppercase font-bold tracking-widest mb-1">Coordinated reporting with:</div>
                 <div className="tracking-tighter">CALSOUTH (CSL & PRSL)</div>
                 <div className="tracking-tighter line-through opacity-20">/</div>
                 <div className="tracking-tighter">USCLUBS (SOCAL LEAGUE)</div>
                 <div className="tracking-tighter line-through opacity-20">/</div>
                 <div className="tracking-tighter text-sm lg:text-lg">USSAA (EA LEAGUE/ MLS NXT 2)</div>
               </div>

               <p>PRSL is here to help you grow and prove that you can continue to rise to the next level/platform. However, it is not just about winning but rather your “silent interview,” which pertains to your on-field presence, behavior, and respect for the game at all times.</p>
               
               <p className="font-bold text-white border-t border-white/5 pt-6 mt-6">We love ALL of our members! As such, PRSL will do what&apos;s necessary to ensure everyone&apos;s inclusion and well-being are not jeopardized by anyone.</p>
               
               <p className="font-black text-[#C8102E] uppercase text-xl mt-6 tracking-widest">PRSL</p>
             </div>
          </section>

          <section id="policy-es" className="glass-panel p-8 lg:p-12 border border-white/10 bg-[#0f0f0f]/95 scroll-mt-36 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 font-black text-xs text-white/5 select-none pointer-events-none tracking-widest uppercase">ES STATEMENT</div>
             <h2 className="text-2xl font-black uppercase mb-1 tracking-tight">Declaración Oficial (Spanish)</h2>
             <div className="text-[#C8102E] text-xs font-bold tracking-[2px] mb-10 pb-4 border-b border-white/5">15 DE ABRIL DE 2025</div>
             
             <div className="space-y-6 text-gray-300 text-sm leading-relaxed max-w-2xl">
               <p>Miembros y Líderes de la Liga,</p>
               <p>Es vital que todos se tomen un momento para leer esta declaración oficial de la liga y seguirla en todos los niveles. Usted es responsable de capacitar, educar y supervisar adecuadamente a su personal, entrenadores y miembros en todo momento.</p>
               <p>Como liga competitiva oficial de US Soccer que opera en nuestra región del sur de California, debemos cumplir con todas las normas. Cualquier incidente que infrinja estas nuevas directrices y regulaciones para árbitros se informará y se compartirá con todos los demás organismos sancionadores y ligas/plataformas oficiales de US Soccer, incluyendo:</p>
               
               <div className="bg-red-600/5 p-6 rounded text-center font-black text-lg text-white border border-red-600/10">
                 CALSOUTH - USCLUBS - USSAA
               </div>

               <p>PRSL está aquí para ayudarte a crecer y demostrar que puedes seguir ascendiendo al siguiente nivel/plataforma. Sin embargo, no se trata solo de ganar, sino de tu &quot;entrevista silenciosa&quot;, que se refiere a tu presencia en el campo, tu comportamiento y tu respeto por el juego en todo momento.</p>
               
               <p className="font-bold text-white uppercase mt-6 tracking-widest text-[#C8102E]">PRSL</p>
             </div>
          </section>

          <section id="policy-ar" className="glass-panel p-8 lg:p-12 border border-white/10 bg-[#0f0f0f]/95 scroll-mt-36 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 font-black text-xs text-white/5 select-none pointer-events-none tracking-widest uppercase">AR STATEMENT</div>
             <h2 className="text-2xl font-black uppercase mb-1 tracking-tight">ՀԱՅԵՐԵՆ ՀԱՅՏԱՐԱՐՈՒԹՅՈՒՆ (Armenian)</h2>
             <div className="text-[#C8102E] text-xs font-bold tracking-[2px] mb-10 pb-4 border-b border-white/5">15 Ապրիլի, 2025</div>
             
             <div className="space-y-6 text-gray-300 text-sm leading-relaxed max-w-2xl" dir="ltr">
               <p>Լիգայի անդամներ և առաջնորդներ,</p>
               <p>Կենսական նշանակություն ունի բոլորի համար մի պահ տրամադրել լիգայի այս պաշտոնական հայտարարությունը կարդալու և բոլոր մակարդակներում դրան հետևելու համար:</p>
               <p>Որպես ԱՄՆ ֆուտբոլի պաշտոնական մրցակցային լիգա, որը ծառայում է մեր Հարավային Կալիֆորնիայի տարածաշրջանին, մենք պետք է հետևենք բոլոր ուղեցույցներին: Ցանկացած միջադեպ, որը խախտում է մրցավարների այս նոր ուղեցույցները և կանոնակարգերը, կհաղորդվի և կկիսվի ԱՄՆ Ֆուտբոլի բոլոր մյուս պատժիչ մարմինների և պաշտոնական լիգաների հետ:</p>
               
               <div className="bg-white/5 p-6 rounded text-center font-black text-lg text-white border border-white/10">
                 CALSOUTH - USCLUBS - USSAA
               </div>

               <p>Մենք սիրում ենք մեր ԲՈԼՈՐ անդամներին: Որպես այդպիսին, PRSL-ը կանի այն, ինչ անհրաժեշտ է, որպեսզի բոլորի ընդգրկվածությունն ու բարեկեցությունը որևէ մեկի կողմից վտանգված չլինի:</p>
               
               <p className="font-bold text-[#C8102E] uppercase mt-6 tracking-widest text-xl">PRSL</p>
             </div>
          </section>

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
          <div className="flex justify-center gap-6 mb-8">
            <a href="https://instagram.com/pacificregionalsoccer" target="_blank" rel="noreferrer" className="text-white hover:text-[#C8102E] transition-all hover:scale-110">
              <Instagram />
            </a>
          </div>
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
