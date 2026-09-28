import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import DeafGuideModal from './components/DeafGuideModal';
import LogoMotionIntro from './components/LogoMotionIntro';

function App() {
  const [view, setView] = useState('landing');
  const [activeTab, setActiveTab] = useState('overview');
  const [highContrast, setHighContrast] = useState(false);
  const [isDeafGuideOpen, setIsDeafGuideOpen] = useState(false);
  const [isLogoMotionOpen, setIsLogoMotionOpen] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace('#', '');
        setView(prev => {
          if (prev !== 'landing') return 'landing';
          return prev;
        });
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (view !== 'dashboard') {
      setView('dashboard');
    }
  };

  const handleViewChange = (newView, targetTab) => {
    setView(newView);
    if (targetTab) {
      setActiveTab(targetTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`mada-app-root ${highContrast ? 'high-contrast-mode' : ''}`}>
      <Navbar
        currentView={view}
        onViewChange={handleViewChange}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        highContrast={highContrast}
        onToggleContrast={() => setHighContrast(prev => !prev)}
        onOpenDeafGuide={() => setIsDeafGuideOpen(true)}
        onOpenLogoMotion={() => setIsLogoMotionOpen(true)}
      />

      <main className="mada-main-content">
        {view === 'landing' ? (
          <LandingPage 
            onViewChange={handleViewChange}
            onOpenDeafGuide={() => setIsDeafGuideOpen(true)}
            onOpenLogoMotion={() => setIsLogoMotionOpen(true)}
          />
        ) : (
          <Dashboard
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onViewChange={handleViewChange}
            onOpenDeafGuide={() => setIsDeafGuideOpen(true)}
            onOpenLogoMotion={() => setIsLogoMotionOpen(true)}
          />
        )}
      </main>

      <Footer onViewChange={handleViewChange} />

      {/* Global Deaf Accessibility & Sign Language Modal */}
      <DeafGuideModal 
        isOpen={isDeafGuideOpen} 
        onClose={() => setIsDeafGuideOpen(false)} 
      />

      {/* Official 4K Logo Motion Cinema & Video Downloader */}
      <LogoMotionIntro 
        isOpen={isLogoMotionOpen} 
        onClose={() => setIsLogoMotionOpen(false)} 
      />
    </div>
  );
}

export default App;

