import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Instagram,
  ChevronDown,
  Mail,
  LayoutGrid,
  Calendar,
  GraduationCap,
  Book,
  ArrowUp,
  ExternalLink,
  ArrowRight,
  Upload,
  FileText,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LOGO_URL = "https://images.pacificregionalsoccer.com/pacific%20regional%20soccer%20league%20logo.avif";
const PARTNERSHIP_BANNER_URL = "https://images.pacificregionalsoccer.com/Image%20Oct%202%2C%202026%2C%2012_50_07%20PM.png";
const SOCAL_LOGO_URL = "https://images.pacificregionalsoccer.com/SoCal%20Custom%20Canopies%20logo.jpg";
const SOCAL_WEBSITE_URL = "https://www.socalcustomcanopies.com/";
const PARTNER_NOTIFICATION_EMAIL = "socalcustomcanopies@gmail.com";


interface ProductCategory {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  specs: string[];
  applications: string[];
}

export default function SoCalCustomCanopies() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeProductModal, setActiveProductModal] = useState<ProductCategory | null>(null);

  const PRODUCT_INTEREST_OPTIONS = [
    'Custom Canopy',
    'Table Cover',
    'Flags',
    'Banners',
    'Signs',
    'Backdrops',
    'Complete Club Package',
    'Other'
  ] as const;

  const CONTACT_METHOD_OPTIONS = ['Email', 'Phone', 'Text'] as const;

  const [quoteForm, setQuoteForm] = useState({
    fullName: '',
    clubOrganization: '',
    teamName: '',
    email: '',
    phone: '',
    selectedProducts: [] as string[],
    quantityNeeded: '',
    projectDetails: '',
    preferredContactMethod: 'Email' as 'Email' | 'Phone' | 'Text',
    isPrslAffiliated: false
  });
  const [logoFiles, setLogoFiles] = useState<
    { file: File; previewUrl: string | null; dataUrl?: string }[]
  >([]);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    emailConfigured: boolean;
    vendorEmailSent: boolean;
    confirmationEmailSent: boolean;
  } | null>(null);

  useEffect(() => {
    if (formSubmitted) {
      requestAnimationFrame(() => {
        const thankYouEl = document.getElementById('quote-thank-you');
        if (thankYouEl) {
          thankYouEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }, [formSubmitted]);

  // Set SEO Page Title, Meta Description, and OpenGraph tags
  useEffect(() => {
    const previousTitle = document.title;
    const seoTitle = "SoCal Custom Canopies | Official PRSL Partner";
    const seoDescription =
      "Pacific Regional Soccer League has partnered with SoCal Custom Canopies & Print to provide PRSL clubs, teams, and members access to custom canopies, table covers, flags, banners, signs, backdrops, and special PRSL member pricing.";

    document.title = seoTitle;

    const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMetaTag('name', 'description', seoDescription);
    setMetaTag('property', 'og:title', seoTitle);
    setMetaTag('property', 'og:description', seoDescription);
    setMetaTag('property', 'og:type', 'website');

    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 500);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveProductModal(null);
      }
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mapCategoryToFormProducts = (categoryName: string): string[] => {
    switch (categoryName) {
      case 'Custom Canopies':
        return ['Custom Canopy'];
      case 'Table Covers':
        return ['Table Cover'];
      case 'Custom Flags':
        return ['Flags'];
      case 'Banners & Signs':
        return ['Banners', 'Signs'];
      case 'Custom Backdrops':
        return ['Backdrops'];
      case 'Custom Printing & More':
        return ['Complete Club Package'];
      default:
        return [categoryName];
    }
  };

  const scrollToQuote = (productName?: string) => {
    if (productName) {
      const mappedItems = mapCategoryToFormProducts(productName);
      setQuoteForm((prev) => {
        const merged = Array.from(new Set([...prev.selectedProducts, ...mappedItems]));
        return {
          ...prev,
          selectedProducts: merged
        };
      });
    }
    setActiveProductModal(null);
    const el = document.getElementById('request-pricing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleProductSelection = (productName: string) => {
    setQuoteForm((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productName)
        ? prev.selectedProducts.filter((item) => item !== productName)
        : [...prev.selectedProducts, productName]
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleLogoFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setLogoUploadError(null);

    const maxBytes = 100 * 1024 * 1024; // 100 MB per file
    const newEntries: { file: File; previewUrl: string | null; dataUrl?: string }[] = [];

    for (const file of Array.from(fileList)) {
      if (file.size > maxBytes) {
        setLogoUploadError(`"${file.name}" exceeds the 100 MB file size limit.`);
        continue;
      }
      const isImage = file.type.startsWith('image/');
      const previewUrl = isImage ? URL.createObjectURL(file) : null;
      let dataUrl: string | undefined;
      if (file.size <= 15 * 1024 * 1024) {
        try {
          dataUrl = await readFileAsDataUrl(file);
        } catch {
          dataUrl = undefined;
        }
      }
      newEntries.push({ file, previewUrl, dataUrl });
    }

    if (newEntries.length > 0) {
      setLogoFiles((prev) => [...prev, ...newEntries]);
    }
  };

  const handleRemoveLogoFile = (indexToRemove: number) => {
    setLogoFiles((prev) => {
      const target = prev[indexToRemove];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.isPrslAffiliated) {
      return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);

    const payload = {
      ...quoteForm,
      logos: logoFiles.map((item) => ({
        name: item.file.name,
        size: item.file.size,
        type: item.file.type,
        dataUrl: item.dataUrl
      })),
      submittedAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok === false) {
        throw new Error(
          data.error || 'Unable to submit your quote request right now. Please try again.'
        );
      }

      setSubmissionResult({
        emailConfigured: Boolean(data.emailConfigured),
        vendorEmailSent: Boolean(data.vendorEmailSent),
        confirmationEmailSent: Boolean(data.confirmationEmailSent)
      });
      setFormSubmitted(true);
    } catch (err) {
      console.error('Quote submission error:', err);
      setSubmissionError(
        err instanceof Error
          ? err.message
          : 'An error occurred while submitting your quote request.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/', icon: LayoutGrid },
    {
      name: 'FALL 2026',
      icon: Calendar,
      dropdown: [
        { name: 'Registration', href: 'https://soccer.sincsports.com/register/start.aspx?tid=PACRSL&tab=2&sub=0' },
        { name: 'Fall Schedule', href: 'https://soccer.sincsports.com/schedule.aspx?tid=PACRSL&tab=3&sub=0', highlight: true }
      ]
    },
    {
      name: 'Events',
      href: '/#events',
      icon: Calendar,
      dropdown: [
        { name: 'Fall League', href: 'https://soccer.sincsports.com/register/start.aspx?tid=PACRSL&tab=2&sub=0' },
        { name: 'Scrimmage Request', href: 'https://www.Socalsoccerscrimmages.com' },
        { name: 'Tournaments', href: '/tournaments' }
      ]
    },
    {
      name: 'Coaches Resources',
      icon: GraduationCap,
      dropdown: [
        { name: 'Coaches Requirements', href: 'https://calsouth.com/wp-content/uploads/2024/05/Coaching-License-Checklist_IP-5_2024.pdf' },
        { name: 'Licensing & Education', href: '/#education' }
      ]
    },
    {
      name: 'Partners',
      dropdown: [
        { name: 'SoCal Custom Canopies', href: '/socal-custom-canopies', highlight: true }
      ]
    },
    {
      name: 'Rules',
      icon: Book,
      dropdown: [
        { name: 'League Rules', href: '/rules' },
        { name: 'Age Matrix', href: '/age-matrix' },
        { name: 'Ref Fees', href: '/rules#ref-fees' },
        { name: 'Licensing', href: '/#education' }
      ]
    }
  ];

  const productCategories: ProductCategory[] = [
    {
      id: 'custom-canopies',
      number: '01',
      name: 'Custom Canopies',
      subtitle: '10×10 • 10×15 • 10×20 • Full & Half Walls',
      description:
        'Professional custom-branded canopies featuring club logos, colors, sponsors, websites, and team branding.',
      specs: [
        'Full edge-to-edge custom dye-sublimated canopy tops and valances',
        'Available in 10×10, 10×15, and 10×20 commercial club footprints',
        'Optional custom-printed backwalls and side skirts for shade and wind control',
        'Matched to your club crest, team colors, and sponsor logos'
      ],
      applications: ['Game Day Sidelines', 'Tournament Headquarters', 'Team Check-In Tents']
    },
    {
      id: 'table-covers',
      number: '02',
      name: 'Table Covers',
      subtitle: '6ft & 8ft • Stretch, Fitted & Draped',
      description:
        'Custom table covers for registration, tournament headquarters, tryouts, recruiting, and club events.',
      specs: [
        'Available in contour stretch, tailored fitted, and standard draped styles',
        'Sized for standard 6-foot and 8-foot folding registration tables',
        'Full-color printing for high-visibility club crests and lettering',
        'Durable, washable fabric built for repeated field and event use'
      ],
      applications: ['Player Tryouts', 'Tournament Check-In', 'Club Registration Events']
    },
    {
      id: 'custom-flags',
      number: '03',
      name: 'Custom Flags',
      subtitle: 'Feather & Teardrop • Single & Double-Sided',
      description:
        'Custom flags for field identification, entrances, tournaments, tryouts, registration areas, and events.',
      specs: [
        'High-visibility feather and teardrop flag profiles in multiple heights',
        'Single-sided or double-sided blockout printing options',
        'Ground spike and weighted base hardware options for grass or turf',
        'Makes fields, check-in tents, and tryout areas easy for families to locate'
      ],
      applications: ['Field Identification', 'Tryout Entrances', 'Sideline Branding']
    },
    {
      id: 'banners-signs',
      number: '04',
      name: 'Banners & Signs',
      subtitle: 'Vinyl • Mesh • A-Frames • Field Signage',
      description:
        'Professionally printed banners and signs for teams, clubs, sponsors, tournaments, tryouts, and special events.',
      specs: [
        'Heavy-duty vinyl and wind-pass mesh banners with reinforced grommets',
        'Sideline pop-up A-frame banners and directional complex signage',
        'Custom dimensions for fence lines, entrances, and team benches',
        'Ideal for showcasing team rosters, schedules, and club sponsors'
      ],
      applications: ['Complex & Fence Signage', 'Sponsor Recognition', 'Team Banners']
    },
    {
      id: 'custom-backdrops',
      number: '05',
      name: 'Custom Backdrops',
      subtitle: 'Step-and-Repeat • Media Walls • Awards',
      description:
        'Professional backdrops for championship photos, media days, player signings, awards, sponsors, and club events.',
      specs: [
        'Glare-free matte fabric printing designed for photography and video',
        'Step-and-repeat club and sponsor logo layouts or full custom designs',
        'Portable frames for fast setup at fields, clubhouses, or banquets',
        'Creates a clean, professional background for player and team milestones'
      ],
      applications: ['Championship Photos', 'Player Signing Days', 'Media & Awards']
    },
    {
      id: 'custom-printing',
      number: '06',
      name: 'Custom Printing & More',
      subtitle: 'Coordinated Team & Club Branding Packages',
      description:
        'Additional custom printing and branding solutions are available for clubs, teams, tournaments, and events.',
      specs: [
        'Coordinated multi-item packages matching your exact club colors',
        'Custom event signage for showcases, camps, and seasonal kickoffs',
        'Direct design assistance from concept through final artwork proof',
        'Flexible ordering for a single team or an entire multi-team club'
      ],
      applications: ['Complete Club Packages', 'Showcase Branding', 'Special Events']
    }
  ];

  const orderSteps = [
    {
      step: '1',
      title: 'CHOOSE YOUR PRODUCTS',
      description: 'Select the products your club or team needs.'
    },
    {
      step: '2',
      title: 'SUBMIT YOUR BRANDING',
      description: 'Provide your logo, team colors, sponsors, and other branding information.'
    },
    {
      step: '3',
      title: 'RECEIVE YOUR QUOTE & DESIGN PROOF',
      description: 'SoCal Custom Canopies will provide pricing and work with you on the design.'
    },
    {
      step: '4',
      title: 'REVIEW & APPROVE',
      description: 'Review and approve the final artwork before production.'
    },
    {
      step: '5',
      title: 'PRODUCTION',
      description: 'Once approved, your customized products move into production.'
    }
  ];

  const useCases = [
    {
      title: 'GAME DAYS',
      description: 'Create a professional sideline setup.'
    },
    {
      title: 'TOURNAMENTS',
      description: 'Club headquarters, check-in stations, field identification, sponsor signage, and event branding.'
    },
    {
      title: 'TRYOUTS',
      description: 'Create a professional registration and check-in area while making your club easy to identify.'
    },
    {
      title: 'REGISTRATION EVENTS',
      description: 'Use canopies, table covers, banners, and flags to create an identifiable club information center.'
    },
    {
      title: 'CHAMPIONSHIPS & MEDIA DAYS',
      description: 'Use custom backdrops and banners for photos, awards, announcements, and player recognition.'
    },
    {
      title: 'SPONSORS',
      description: 'Incorporate sponsor logos into eligible products to increase sponsor visibility.'
    }
  ];

  const revealVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } }
  };

  return (
    <div className="relative font-sans text-[#1a1a1a] bg-[#f4f6f8] min-h-screen flex flex-col">
      <div className="bg-grid" />
      <div className="noise-overlay" />

      {/* Utility Bar (Desktop) - Identical to Home.tsx */}
      <div className="hidden lg:flex fixed top-0 left-0 w-full h-[36px] bg-[#111111] text-white z-[1001] justify-end items-center px-[5%] text-[0.85rem] font-semibold tracking-wide">
        <a
          href="mailto:pacificregionalsoccerleague@gmail.com"
          className="flex items-center gap-2 hover:text-[#C8102E] transition-colors"
        >
          <Mail size={14} /> pacificregionalsoccerleague@gmail.com
        </a>
      </div>

      {/* Navigation - Identical to Home.tsx */}
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
                  {link.dropdown.map((sub) =>
                    sub.href.startsWith('http') || sub.href.includes('#') ? (
                      <a
                        key={sub.name}
                        href={sub.href}
                        target={sub.href.startsWith('http') ? '_blank' : undefined}
                        rel={sub.href.startsWith('http') ? 'noreferrer' : undefined}
                        className={
                          sub.highlight
                            ? 'block px-5 py-3 bg-[#C8102E] text-white font-black text-center no-underline text-[0.85rem] hover:bg-[#a00c24] transition-all'
                            : 'block px-5 py-3 text-[#1a1a1a] no-underline text-[0.85rem] font-semibold border-b border-black/5 hover:bg-gray-50 hover:text-[#C8102E] hover:pl-7 transition-all'
                        }
                      >
                        {sub.name}
                      </a>
                    ) : (
                      <Link
                        key={sub.name}
                        to={sub.href}
                        className={
                          sub.highlight
                            ? 'block px-5 py-3 bg-[#C8102E] text-white font-black text-center no-underline text-[0.85rem] hover:bg-[#a00c24] transition-all'
                            : 'block px-5 py-3 text-[#1a1a1a] no-underline text-[0.85rem] font-semibold border-b border-black/5 hover:bg-gray-50 hover:text-[#C8102E] hover:pl-7 transition-all'
                        }
                      >
                        {sub.name}
                      </Link>
                    )
                  )}
                </div>
              )}
            </li>
          ))}
          <li>
            <a
              href="https://soccer.sincsports.com/schedule.aspx?tid=PACRSL&tab=3&sub=0"
              target="_blank"
              rel="noreferrer"
              className="bg-[#C8102E] text-white px-5 py-2 rounded-md font-bold text-[0.85rem] uppercase hover:bg-[#a00c24] transition-all no-underline"
            >
              Fall Schedule
            </a>
          </li>
        </ul>

        {/* Hamburger */}
        <button
          className="lg:hidden flex flex-col gap-1.5 cursor-pointer z-[1002]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
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
                    {link.dropdown.map((sub) =>
                      sub.href.startsWith('http') || sub.href.includes('#') ? (
                        <a
                          key={sub.name}
                          href={sub.href}
                          target={sub.href.startsWith('http') ? '_blank' : undefined}
                          rel={sub.href.startsWith('http') ? 'noreferrer' : undefined}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={
                            sub.highlight
                              ? 'text-lg font-black text-white bg-[#C8102E] py-3 px-6 rounded-md my-2 block shadow-md hover:bg-[#a00c24] transition-all'
                              : 'text-lg font-bold text-[#1a1a1a] uppercase py-3 hover:text-[#C8102E]'
                          }
                        >
                          {sub.name}
                        </a>
                      ) : (
                        <Link
                          key={sub.name}
                          to={sub.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={
                            sub.highlight
                              ? 'text-lg font-black text-white bg-[#C8102E] py-3 px-6 rounded-md my-2 block shadow-md hover:bg-[#a00c24] transition-all'
                              : 'text-lg font-bold text-[#1a1a1a] uppercase py-3 hover:text-[#C8102E]'
                          }
                        >
                          {sub.name}
                        </Link>
                      )
                    )}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* SECTION 1 — HERO                                                  */}
      {/* ================================================================= */}
      <section className="pt-28 lg:pt-40 pb-16 px-[5%] relative overflow-hidden">
        <div className="mesh-bg" />

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Partnership Banner Visual */}
          <motion.div
            variants={revealVariants}
            initial="hidden"
            animate="visible"
            className="glass-panel bg-white p-2 sm:p-3 shadow-md"
          >
            <img
              src={PARTNERSHIP_BANNER_URL}
              alt="Pacific Regional Soccer League x SoCal Custom Canopies Official Partnership Banner"
              className="w-full h-auto block rounded-lg"
            />
          </motion.div>

          {/* Hero Announcement Card (Matches Home.tsx Hero Card Style) */}
          <motion.div
            variants={revealVariants}
            initial="hidden"
            animate="visible"
            className="glass-panel bg-white p-8 sm:p-10 lg:p-12 border-l-8 border-l-[#111111] border-b-8 border-b-[#C8102E]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <div className="mb-5">
                  <span className="dark-badge">OFFICIAL PARTNER</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase leading-[1.15] tracking-tight text-[#111111] mb-6">
                  Official Custom Canopy &amp; Printing Partner of{' '}
                  <span className="gradient-text block mt-1">Pacific Regional Soccer League</span>
                </h1>

                <div className="space-y-4 text-[#333333] text-base sm:text-lg leading-relaxed mb-8">
                  <p className="font-bold text-[#111111] text-lg sm:text-xl">
                    Pacific Regional Soccer League is proud to partner with SoCal Custom Canopies &amp; Print.
                  </p>
                  <p>
                    Through this partnership, PRSL clubs, teams, coaches, managers, and members have access to professional custom-branded products for game days, tournaments, tryouts, registration events, showcases, club events, and more.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <button
                    type="button"
                    onClick={() => scrollToQuote()}
                    className="btn-primary bg-[#C8102E] hover:bg-[#a00c24] text-sm sm:text-base py-4 px-8 gap-2"
                  >
                    <span>REQUEST PRSL MEMBER PRICING</span>
                    <ArrowRight size={18} />
                  </button>

                  <a
                    href={SOCAL_WEBSITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm sm:text-base py-4 px-8 gap-2"
                  >
                    <span>VIEW PRODUCTS</span>
                    <ExternalLink size={17} />
                  </a>
                </div>
              </div>

              {/* Official Partner Logos Display */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center bg-[#f8f9fa] border border-gray-200 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-5 mb-4">
                  <img
                    src={LOGO_URL}
                    alt="Pacific Regional Soccer League Logo"
                    className="h-20 w-20 sm:h-24 sm:w-24 object-contain bg-white rounded-full p-1.5 shadow-sm border border-gray-200"
                  />
                  <span className="text-2xl font-black text-[#C8102E]">×</span>
                  <img
                    src={SOCAL_LOGO_URL}
                    alt="SoCal Custom Canopies Logo"
                    className="h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-lg shadow-sm border border-gray-200 bg-black"
                  />
                </div>
                <div className="text-xs font-black uppercase tracking-widest text-[#111111]">
                  PRSL × SoCal Custom Canopies
                </div>
                <a
                  href={SOCAL_WEBSITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#C8102E] hover:underline mt-1 inline-flex items-center gap-1"
                >
                  www.socalcustomcanopies.com <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 2 — EXCLUSIVE PRSL MEMBER PRICING                         */}
      {/* ================================================================= */}
      <section className="py-16 px-[5%]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-[#0A192F] text-white rounded-xl p-8 sm:p-10 lg:p-12 border-l-8 border-l-[#C8102E] shadow-xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <span className="inline-block bg-[#C8102E] text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded mb-4">
                  PRSL Member Benefit
                </span>

                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-5">
                  Exclusive PRSL Member Pricing
                </h2>

                <div className="space-y-4 text-white/90 text-base sm:text-lg leading-relaxed">
                  <p>
                    As an official Pacific Regional Soccer League partner, SoCal Custom Canopies offers special partner pricing to PRSL members.
                  </p>
                  <p>
                    PRSL clubs and teams can work directly with their team to determine the products, sizes, quantities, and designs that work best for their organization.
                  </p>
                  <p className="bg-white/10 border-l-4 border-[#D4AF37] p-4 rounded-r text-white">
                    When requesting a quote, identify your organization as a{' '}
                    <strong className="font-black text-[#D4AF37]">
                      PACIFIC REGIONAL SOCCER LEAGUE MEMBER
                    </strong>{' '}
                    to receive available PRSL partner pricing.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col justify-center">
                <div className="bg-white text-[#111111] rounded-xl p-7 shadow-lg border-t-4 border-t-[#C8102E]">
                  <div className="text-xs font-black uppercase tracking-wider text-[#C8102E] mb-1">
                    Official Partner Quotes
                  </div>
                  <div className="text-2xl font-black uppercase text-[#111111] mb-3">
                    Club &amp; Team Pricing
                  </div>
                  <p className="text-[#444444] text-sm sm:text-base leading-relaxed mb-6">
                    Request a custom quote and design proof tailored to your team or club.
                  </p>
                  <button
                    type="button"
                    onClick={() => scrollToQuote()}
                    className="btn-primary w-full py-4 px-5 text-sm gap-2"
                  >
                    <span>GET A PRSL MEMBER QUOTE</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 3 — PRODUCTS                                              */}
      {/* ================================================================= */}
      <section id="products" className="py-20 px-[5%] bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="gradient-text text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-3">
              Custom Products for Your Club &amp; Team
            </h2>
            <div className="w-16 h-1 bg-[#C8102E] mx-auto rounded-full mb-4" />
            <p className="text-[#444444] font-medium text-base sm:text-lg max-w-2xl mx-auto">
              Professional custom-branded equipment built for game days, tournaments, tryouts, and club events.
            </p>
          </div>

          {/* 3-Column Desktop Layout & Responsive Mobile Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {productCategories.map((product) => (
              <motion.div
                key={product.id}
                variants={revealVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass-panel bg-white flex flex-col justify-between border border-black/10 hover:shadow-xl"
              >
                <div>
                  {/* Clean, Easy-to-Read Product Visual Area (Navy, Red, White, Subtle Gold) */}
                  <div className="bg-[#0A192F] text-white p-6 border-b-4 border-[#C8102E] min-h-[175px] flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center">
                      <img
                        src={SOCAL_LOGO_URL}
                        alt="SoCal Custom Canopies Logo"
                        className="h-9 w-9 object-contain rounded border border-[#D4AF37]/40 bg-black"
                      />
                    </div>

                    <div className="my-3">
                      <div className="text-2xl font-black uppercase tracking-tight text-white leading-snug">
                        {product.name}
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider text-white/80 mt-1.5">
                        {product.subtitle}
                      </div>
                    </div>

                    <div className="w-10 h-1 bg-[#D4AF37] rounded-full" />
                  </div>

                  {/* Product Name & Description */}
                  <div className="p-7">
                    <h3 className="text-2xl font-black uppercase text-[#111111] mb-3 tracking-tight">
                      {product.name}
                    </h3>
                    <p className="text-[#333333] text-base leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-7 pb-7 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => scrollToQuote(product.name)}
                    className="flex-1 bg-[#C8102E] hover:bg-[#a00c24] text-white font-bold uppercase tracking-wider text-xs py-3.5 px-4 rounded-md transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer border-none"
                  >
                    <span>Request Pricing</span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveProductModal(product)}
                    className="bg-white hover:bg-[#111111] text-[#111111] hover:text-white font-bold uppercase tracking-wider text-xs py-3.5 px-4 rounded-md border-2 border-[#111111] transition-colors inline-flex items-center justify-center cursor-pointer"
                  >
                    <span>Learn More</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 4 — HOW IT WORKS (5-STEP PROCESS)                         */}
      {/* ================================================================= */}
      <section className="py-20 px-[5%]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="gradient-text text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-3">
              How to Order
            </h2>
            <div className="w-16 h-1 bg-[#C8102E] mx-auto rounded-full mb-4" />
            <p className="text-[#444444] font-medium text-base sm:text-lg max-w-2xl mx-auto">
              A straightforward 5-step process from initial product selection to custom production.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {orderSteps.map((item) => (
              <motion.div
                key={item.step}
                variants={revealVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass-panel bg-white p-7 border-t-4 border-t-[#C8102E] flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#0A192F] text-white font-black text-lg flex items-center justify-center mb-5 shadow-sm">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-black uppercase text-[#111111] mb-2.5 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[#333333] text-sm sm:text-base leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 5 — BUILT FOR MORE THAN GAME DAY                          */}
      {/* ================================================================= */}
      <section className="py-20 px-[5%] bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="gradient-text text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-3">
              Built for More Than Game Day
            </h2>
            <div className="w-16 h-1 bg-[#C8102E] mx-auto rounded-full mb-4" />
            <p className="text-[#444444] font-medium text-base sm:text-lg max-w-2xl mx-auto">
              Create a unified, professional presence for your club across every event on the calendar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <motion.div
                key={useCase.title}
                variants={revealVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass-panel bg-white p-8 border-l-4 border-l-[#C8102E]"
              >
                <h3 className="text-xl font-black uppercase text-[#111111] mb-3">
                  {useCase.title}
                </h3>
                <p className="text-[#333333] text-base leading-relaxed">
                  {useCase.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 6 — WHY PRSL PARTNERED WITH SOCAL CUSTOM CANOPIES         */}
      {/* ================================================================= */}
      <section className="py-20 px-[5%]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <motion.div
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:col-span-7 glass-panel bg-white p-8 sm:p-10 lg:p-12"
          >
            <span className="dark-badge mb-4">COMMUNITY RESOURCE</span>
            <h2 className="gradient-text text-3xl sm:text-4xl font-black uppercase mb-6 leading-tight">
              A Resource for the PRSL Soccer Community
            </h2>
            <div className="space-y-4 text-[#333333] text-base sm:text-lg leading-relaxed">
              <p>
                Pacific Regional Soccer League is committed to providing our member clubs with resources that extend beyond league competition.
              </p>
              <p>
                Our partnership with SoCal Custom Canopies gives PRSL organizations access to a custom printing provider that can assist teams, clubs, and events with professional branding and customized products.
              </p>
              <p>
                Whether an organization needs one product for an individual team or coordinated branding across an entire club, PRSL members can connect directly with SoCal Custom Canopies for assistance.
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:col-span-5 glass-panel bg-[#0A192F] text-white p-8 sm:p-10 border-t-4 border-t-[#C8102E]"
          >
            <div className="flex items-center justify-center gap-6 py-5 bg-white/5 rounded-lg border border-white/10 mb-6">
              <img
                src={LOGO_URL}
                alt="Pacific Regional Soccer League"
                className="h-20 w-20 object-contain bg-white rounded-full p-1.5"
              />
              <span className="text-2xl font-bold text-[#D4AF37]">×</span>
              <img
                src={SOCAL_LOGO_URL}
                alt="SoCal Custom Canopies & Print"
                className="h-20 w-20 object-contain rounded-lg"
              />
            </div>

            <h3 className="text-xl font-black uppercase text-white text-center mb-3">
              Official PRSL Partner
            </h3>
            <p className="text-white/85 text-sm sm:text-base text-center leading-relaxed mb-6">
              Supporting individual PRSL teams and full-club organizations across Southern California.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => scrollToQuote()}
                className="btn-primary w-full py-3.5 text-sm gap-2"
              >
                <span>Request a Custom Club Quote</span>
                <ArrowRight size={16} />
              </button>

              <a
                href={SOCAL_WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-md border border-white/30 hover:bg-white hover:text-[#0A192F] text-white font-bold uppercase tracking-wider text-xs transition-colors inline-flex items-center justify-center gap-2 no-underline"
              >
                <span>socalcustomcanopies.com</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* REQUEST PRSL MEMBER PRICING FORM                                  */}
      {/* ================================================================= */}
      <section id="request-pricing" className="py-20 px-[5%] bg-white/40">
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel bg-white p-8 sm:p-10 lg:p-12 border-t-4 border-t-[#C8102E] shadow-lg">
            <div className="mb-8 pb-6 border-b border-gray-200">
              <span className="dark-badge mb-3">PRSL PARTNER PRICING</span>
              <h2 className="gradient-text text-3xl sm:text-4xl font-black uppercase mb-2">
                Request PRSL Member Pricing
              </h2>
              <p className="text-[#444444] text-base sm:text-lg leading-relaxed">
                Tell us what your club or team is looking for and a representative can follow up regarding PRSL partner pricing.
              </p>
            </div>

            {formSubmitted ? (
              <div
                id="quote-thank-you"
                className="bg-[#0A192F] text-white rounded-xl p-8 sm:p-12 border-t-8 border-t-[#C8102E] text-center flex flex-col items-center shadow-xl"
              >
                <div className="w-16 h-16 rounded-full bg-[#C8102E] text-white flex items-center justify-center mb-5 shadow-md">
                  <CheckCircle2 size={34} />
                </div>

                <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-3 max-w-2xl">
                  Thank you! Your PRSL member pricing request has been received.
                </h3>
                <p className="text-white/90 text-base sm:text-lg leading-relaxed mb-6 max-w-xl">
                  We have recorded your inquiry for{' '}
                  <strong className="text-[#D4AF37]">{quoteForm.clubOrganization}</strong>
                  {quoteForm.teamName ? ` (${quoteForm.teamName})` : ''}.
                </p>

                <div className="bg-white/10 border border-white/15 rounded-lg p-5 mb-6 space-y-3 text-sm w-full max-w-lg text-left">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>
                      Partner notification routed to{' '}
                      <strong className="text-white">{PARTNER_NOTIFICATION_EMAIL}</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>
                      Confirmation copy routed to{' '}
                      <strong className="text-white">{quoteForm.email}</strong>
                    </span>
                  </div>
                </div>

                {logoFiles.length > 0 && (
                  <p className="text-white/80 text-sm mb-6 max-w-lg">
                    Attached Logo / Artwork Files ({logoFiles.length}):{' '}
                    <span className="font-semibold text-white">
                      {logoFiles.map((f) => f.file.name).join(', ')}
                    </span>
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-6 border-t border-white/15 w-full max-w-lg">
                  <button
                    type="button"
                    onClick={() => {
                      logoFiles.forEach((item) => {
                        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
                      });
                      setLogoFiles([]);
                      setLogoUploadError(null);
                      setSubmissionError(null);
                      setSubmissionResult(null);
                      setFormSubmitted(false);
                      setQuoteForm({
                        fullName: '',
                        clubOrganization: '',
                        teamName: '',
                        email: '',
                        phone: '',
                        selectedProducts: [],
                        quantityNeeded: '',
                        projectDetails: '',
                        preferredContactMethod: 'Email',
                        isPrslAffiliated: false
                      });
                    }}
                    className="btn-primary py-3.5 px-6 text-xs"
                  >
                    Submit Another Request
                  </button>
                  <a
                    href={SOCAL_WEBSITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3.5 px-6 rounded-md border border-white/30 hover:bg-white hover:text-[#0A192F] text-white font-bold uppercase tracking-wider text-xs transition-colors inline-flex items-center justify-center gap-2 no-underline"
                  >
                    <span>Visit SoCalCustomCanopies.com</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="space-y-6">
                {submissionError && (
                  <div className="bg-red-50 border border-red-200 border-l-4 border-l-[#C8102E] rounded-md p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-[#C8102E] shrink-0 mt-0.5" />
                    <div className="text-sm text-[#991b1b] font-medium">{submissionError}</div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="quote-full-name"
                      className="block text-sm font-bold uppercase tracking-wide text-[#111111] mb-2"
                    >
                      Full Name <span className="text-[#C8102E]">*</span>
                    </label>
                    <input
                      id="quote-full-name"
                      type="text"
                      required
                      value={quoteForm.fullName}
                      onChange={(e) => setQuoteForm({ ...quoteForm, fullName: e.target.value })}
                      placeholder="Your full name"
                      className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-md text-base text-[#111111] focus:ring-2 focus:ring-[#C8102E] focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="quote-club-org"
                      className="block text-sm font-bold uppercase tracking-wide text-[#111111] mb-2"
                    >
                      Club / Organization <span className="text-[#C8102E]">*</span>
                    </label>
                    <input
                      id="quote-club-org"
                      type="text"
                      required
                      value={quoteForm.clubOrganization}
                      onChange={(e) => setQuoteForm({ ...quoteForm, clubOrganization: e.target.value })}
                      placeholder="Club or organization name"
                      className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-md text-base text-[#111111] focus:ring-2 focus:ring-[#C8102E] focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="quote-team-name"
                      className="block text-sm font-bold uppercase tracking-wide text-[#111111] mb-2"
                    >
                      Team Name
                    </label>
                    <input
                      id="quote-team-name"
                      type="text"
                      value={quoteForm.teamName}
                      onChange={(e) => setQuoteForm({ ...quoteForm, teamName: e.target.value })}
                      placeholder="Optional (e.g., Boys 2012)"
                      className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-md text-base text-[#111111] focus:ring-2 focus:ring-[#C8102E] focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="quote-email"
                      className="block text-sm font-bold uppercase tracking-wide text-[#111111] mb-2"
                    >
                      Email Address <span className="text-[#C8102E]">*</span>
                    </label>
                    <input
                      id="quote-email"
                      type="email"
                      required
                      value={quoteForm.email}
                      onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-md text-base text-[#111111] focus:ring-2 focus:ring-[#C8102E] focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="quote-phone"
                      className="block text-sm font-bold uppercase tracking-wide text-[#111111] mb-2"
                    >
                      Phone Number <span className="text-[#C8102E]">*</span>
                    </label>
                    <input
                      id="quote-phone"
                      type="tel"
                      required
                      value={quoteForm.phone}
                      onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                      placeholder="(555) 000-0000"
                      className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-md text-base text-[#111111] focus:ring-2 focus:ring-[#C8102E] focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Products Interested In */}
                <div>
                  <span className="block text-sm font-bold uppercase tracking-wide text-[#111111] mb-1">
                    Products Interested In
                  </span>
                  <span className="block text-sm text-[#555555] mb-3">
                    Select all products that apply:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {PRODUCT_INTEREST_OPTIONS.map((productOption) => {
                      const isChecked = quoteForm.selectedProducts.includes(productOption);
                      return (
                        <label
                          key={productOption}
                          className={`flex items-center gap-3 p-3.5 rounded-md border text-sm font-bold cursor-pointer transition-all select-none ${
                            isChecked
                              ? 'bg-[#0A192F] text-white border-[#0A192F]'
                              : 'bg-gray-50 text-[#111111] border-gray-300 hover:border-[#0A192F]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProductSelection(productOption)}
                            className="w-4 h-4 accent-[#C8102E] shrink-0 cursor-pointer"
                          />
                          <span>{productOption}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity Needed */}
                <div>
                  <label
                    htmlFor="quote-quantity"
                    className="block text-sm font-bold uppercase tracking-wide text-[#111111] mb-2"
                  >
                    Quantity Needed
                  </label>
                  <input
                    id="quote-quantity"
                    type="text"
                    value={quoteForm.quantityNeeded}
                    onChange={(e) => setQuoteForm({ ...quoteForm, quantityNeeded: e.target.value })}
                    placeholder="e.g., 1 canopy, 2 flags, or full club order"
                    className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-md text-base text-[#111111] focus:ring-2 focus:ring-[#C8102E] focus:bg-white outline-none transition-all"
                  />
                </div>

                {/* Project / Design Details */}
                <div>
                  <label
                    htmlFor="quote-project-details"
                    className="block text-sm font-bold uppercase tracking-wide text-[#111111] mb-2"
                  >
                    Project / Design Details
                  </label>
                  <textarea
                    id="quote-project-details"
                    rows={5}
                    value={quoteForm.projectDetails}
                    onChange={(e) => setQuoteForm({ ...quoteForm, projectDetails: e.target.value })}
                    placeholder="Share any details about preferred sizes, club colors, logos, sponsors, or upcoming event dates..."
                    className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-md text-base text-[#111111] focus:ring-2 focus:ring-[#C8102E] focus:bg-white outline-none resize-y transition-all"
                  />
                </div>

                {/* Upload Club / Team Logo Option */}
                <div>
                  <label
                    htmlFor="quote-logo-upload"
                    className="block text-sm font-bold uppercase tracking-wide text-[#111111] mb-1"
                  >
                    Upload Club / Team Logo
                  </label>
                  <span className="block text-sm text-[#555555] mb-3">
                    Attach your club crest, team logo, or sponsor artwork (.PNG, .JPG, .SVG, .PDF, .AI, .EPS — up to 100MB per file).
                  </span>

                  <label
                    htmlFor="quote-logo-upload"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(false);
                      handleLogoFilesSelected(e.dataTransfer.files);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all text-center ${
                      isDraggingLogo
                        ? 'border-[#C8102E] bg-red-50/40'
                        : 'border-gray-300 bg-gray-50 hover:border-[#0A192F] hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-[#0A192F] text-white flex items-center justify-center shadow-sm">
                      <Upload size={20} />
                    </div>
                    <div className="text-sm font-bold text-[#111111]">
                      Click to upload logo files{' '}
                      <span className="font-normal text-[#555555]">or drag and drop here</span>
                    </div>
                    <div className="text-xs text-[#666666]">
                      Vector (.AI, .EPS, .SVG, .PDF) or high-resolution image (.PNG, .JPG)
                    </div>
                    <input
                      id="quote-logo-upload"
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.svg,.webp,.pdf,.ai,.eps"
                      onChange={(e) => {
                        handleLogoFilesSelected(e.target.files);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>

                  {logoUploadError && (
                    <p className="text-xs font-bold text-[#C8102E] mt-2">
                      {logoUploadError}
                    </p>
                  )}

                  {logoFiles.length > 0 && (
                    <div className="mt-4 space-y-2.5">
                      {logoFiles.map((item, idx) => (
                        <div
                          key={`${item.file.name}-${idx}`}
                          className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-md p-3 shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt={item.file.name}
                                className="w-11 h-11 object-contain rounded border border-gray-200 bg-gray-50 p-1 shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded bg-[#0A192F] text-white flex items-center justify-center shrink-0">
                                <FileText size={18} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-[#111111] truncate">
                                {item.file.name}
                              </div>
                              <div className="text-xs text-[#666666]">
                                {formatFileSize(item.file.size)}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveLogoFile(idx)}
                            className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-[#C8102E] p-2 rounded hover:bg-gray-100 transition-colors inline-flex items-center gap-1 cursor-pointer border-none bg-transparent shrink-0"
                            aria-label={`Remove ${item.file.name}`}
                          >
                            <Trash2 size={15} />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preferred Contact Method */}
                <div>
                  <span className="block text-sm font-bold uppercase tracking-wide text-[#111111] mb-2.5">
                    Preferred Contact Method
                  </span>
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    {CONTACT_METHOD_OPTIONS.map((method) => {
                      const isSelected = quoteForm.preferredContactMethod === method;
                      return (
                        <label
                          key={method}
                          className={`flex items-center justify-center gap-2.5 p-3.5 rounded-md border text-sm font-bold cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#0A192F] text-white border-[#0A192F]'
                              : 'bg-gray-50 text-[#111111] border-gray-300 hover:border-[#0A192F]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="preferredContactMethod"
                            value={method}
                            checked={isSelected}
                            onChange={() =>
                              setQuoteForm({
                                ...quoteForm,
                                preferredContactMethod: method
                              })
                            }
                            className="w-4 h-4 accent-[#C8102E] cursor-pointer"
                          />
                          <span>{method}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Required PRSL Affiliation Checkbox */}
                <div className="bg-gray-100 border border-gray-300 border-l-4 border-l-[#C8102E] rounded-md p-4 sm:p-5">
                  <label
                    htmlFor="prslAffiliationRequired"
                    className="flex items-start sm:items-center gap-3.5 cursor-pointer select-none"
                  >
                    <input
                      id="prslAffiliationRequired"
                      type="checkbox"
                      required
                      checked={quoteForm.isPrslAffiliated}
                      onChange={(e) =>
                        setQuoteForm({ ...quoteForm, isPrslAffiliated: e.target.checked })
                      }
                      className="w-5 h-5 mt-0.5 sm:mt-0 accent-[#C8102E] shrink-0 cursor-pointer"
                    />
                    <span className="text-sm sm:text-base font-bold text-[#111111]">
                      I am affiliated with a Pacific Regional Soccer League club or team.{' '}
                      <span className="text-[#C8102E]">*</span>
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full sm:w-auto py-4 px-10 text-base gap-2"
                  >
                    <span>{isSubmitting ? 'SUBMITTING...' : 'REQUEST MY PRSL QUOTE'}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 7 — FINAL CALL TO ACTION                                  */}
      {/* ================================================================= */}
      <section className="py-20 px-[5%]">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#0A192F] text-white rounded-xl p-8 sm:p-12 lg:p-16 text-center border-t-4 border-t-[#C8102E] shadow-xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-white mb-4">
              Ready to Upgrade Your Club&apos;s Look?
            </h2>

            <p className="text-base sm:text-xl font-bold uppercase text-[#D4AF37] tracking-wide mb-6">
              Custom Canopies • Table Covers • Flags • Banners • Backdrops • Signs • Custom Printing &amp; More
            </p>

            <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-9">
              When contacting SoCal Custom Canopies, mention that your club or team participates in the Pacific Regional Soccer League to request PRSL member pricing.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => scrollToQuote()}
                className="btn-primary py-4 px-8 text-sm sm:text-base gap-2"
              >
                <span>REQUEST PRSL MEMBER PRICING</span>
                <ArrowRight size={18} />
              </button>

              <a
                href={SOCAL_WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="py-4 px-8 rounded-md border-2 border-white hover:bg-white text-white hover:text-[#0A192F] font-extrabold uppercase tracking-wider text-sm sm:text-base transition-all inline-flex items-center justify-center gap-2 no-underline"
              >
                <span>VISIT SOCAL CUSTOM CANOPIES</span>
                <ExternalLink size={17} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* PRODUCT LEARN MORE MODAL                                          */}
      {/* ================================================================= */}
      <AnimatePresence>
        {activeProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveProductModal(null)}
            className="fixed inset-0 bg-black/75 z-[2000] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl border-t-4 border-t-[#C8102E] max-w-xl w-full overflow-hidden shadow-2xl"
            >
              <div className="bg-[#0A192F] text-white p-6 sm:p-7 flex items-start justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-[#D4AF37] mb-1">
                    {activeProductModal.subtitle}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-white">
                    {activeProductModal.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveProductModal(null)}
                  className="text-white/70 hover:text-white bg-white/10 rounded-md p-2 cursor-pointer border-none"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <p className="text-[#222222] text-base leading-relaxed">
                  {activeProductModal.description}
                </p>

                <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                  <div className="text-xs font-black uppercase tracking-wider text-[#111111] mb-3">
                    Key Features &amp; Options
                  </div>
                  <ul className="space-y-2.5 text-sm sm:text-base text-[#333333] list-none">
                    {activeProductModal.specs.map((spec) => (
                      <li key={spec} className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-[#C8102E] mt-2 shrink-0" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#555555] mb-2.5">
                    Common Club Uses
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeProductModal.applications.map((app) => (
                      <span
                        key={app}
                        className="bg-[#0A192F] text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => scrollToQuote(activeProductModal.name)}
                    className="btn-primary flex-1 py-3.5 px-5 text-xs gap-2"
                  >
                    <span>Request PRSL Member Pricing</span>
                    <ArrowRight size={15} />
                  </button>
                  <a
                    href={SOCAL_WEBSITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline py-3.5 px-5 text-xs gap-2"
                  >
                    <span>Visit Website</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer - Identical to Home.tsx */}
      <footer className="bg-[#111] text-white py-16 px-5 text-center relative z-10 border-t-4 border-t-[#C8102E] mt-auto">
        <Link to="/">
          <motion.img
            whileHover={{ scale: 1.1, rotate: 5 }}
            src={LOGO_URL}
            alt="PRSL Logo"
            className="h-16 mx-auto mb-6 bg-white rounded-full p-1 aspect-square cursor-pointer"
          />
        </Link>
        <div className="font-black text-xl mb-4 tracking-widest uppercase">
          PACIFIC REGIONAL SOCCER LEAGUE
        </div>
        <div className="flex justify-center gap-6 mb-10">
          <a
            href="https://instagram.com/pacificregionalsoccer"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#C8102E] hover:scale-110 transition-all text-2xl text-white"
          >
            <Instagram />
          </a>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
          ©2015-2026 by Pacific Regional Soccer League.
          <br />
          All Rights Reserved.
        </p>
      </footer>

      {/* Sticky Mobile Bar - Identical to Home.tsx */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-[#111] border-t-2 border-t-[#C8102E] z-[1000] shadow-[0_-10px_25px_rgba(0,0,0,0.2)]">
        <button
          type="button"
          onClick={() => scrollToQuote()}
          className="w-full flex items-center justify-center gap-2 p-4 text-white text-sm font-bold uppercase bg-transparent border-none cursor-pointer"
        >
          <span>Request PRSL Member Pricing</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Back to Top - Identical to Home.tsx */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-20 right-5 w-12 h-12 bg-[#C8102E]/90 text-white border-none rounded-lg cursor-pointer flex justify-center items-center shadow-lg hover:-translate-y-1 hover:bg-[#a00c24] transition-all z-[999]"
            aria-label="Scroll to top"
          >
            <ArrowUp />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
