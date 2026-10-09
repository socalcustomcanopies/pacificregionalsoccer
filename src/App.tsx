/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Rules from './pages/Rules';
import SpringLeague from './pages/SpringLeague';
import Tournaments from './pages/Tournaments';
import AgeMatrix from './pages/AgeMatrix';
import Success from './pages/Success';
import SoCalCustomCanopies from './pages/SoCalCustomCanopies';

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.substring(1);
      const timer = window.setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
      return () => window.clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/spring-league" element={<SpringLeague />} />
        <Route path="/spring-2026" element={<SpringLeague />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/age-matrix" element={<AgeMatrix />} />
        <Route path="/success" element={<Success />} />
        <Route path="/socal-custom" element={<SoCalCustomCanopies />} />
        <Route path="/socal-custom-canopies" element={<SoCalCustomCanopies />} />
        <Route path="/partners" element={<SoCalCustomCanopies />} />
        <Route path="/partners/socal-custom-canopies" element={<SoCalCustomCanopies />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}
