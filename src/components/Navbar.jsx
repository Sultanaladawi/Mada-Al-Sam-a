import React from 'react';
import { Volume2, Sparkles, Activity, ShieldAlert, BookOpen, LayoutDashboard, Home, Eye } from 'lucide-react';

export default function Navbar({ currentView, onViewChange, activeTab, onTabChange, highContrast, onToggleContrast }) {
  return (
    <header className="mada-global-navbar">
      <div className="navbar-inner-container">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => onViewChange('landing')}>
          <div className="brand-logo-icon">
            <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
              <circle cx="20" cy="20" r="18" stroke="url(#madaGrad)" strokeWidth="2.5" />
              <path d="M12 20 Q16 10 20 20 Q24 30 28 20" stroke="url(#madaGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="20" cy="20" r="3" fill="url(#madaGrad)" />
              <defs>
                <linearGradient id="madaGrad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#6C63FF" />
                  <stop offset="1" stopColor="#00D4AA" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text-cluster">
            <span className="brand-title">مدى السمع</span>
            <span className="brand-badge">جائزة مدى 2026</span>
          </div>
        </div>

        {/* Center Nav Links / Tabs */}
        {currentView === 'dashboard' ? (
          <nav className="navbar-dashboard-tabs">
            <button
              onClick={() => onTabChange('overview')}
              className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <LayoutDashboard className="w-4 h-4 ml-1.5" />
              نظرة عامة
            </button>
            <button
              onClick={() => onTabChange('hearing-test')}
              className={`nav-tab-btn ${activeTab === 'hearing-test' ? 'active' : ''}`}
            >
              <Activity className="w-4 h-4 ml-1.5" />
              فحص السمع
            </button>
            <button
              onClick={() => onTabChange('live-aid')}
              className={`nav-tab-btn ${activeTab === 'live-aid' ? 'active' : ''}`}
            >
              <Volume2 className="w-4 h-4 ml-1.5" />
              المعين السمعي
            </button>
            <button
              onClick={() => onTabChange('captions')}
              className={`nav-tab-btn ${activeTab === 'captions' ? 'active' : ''}`}
            >
              <Sparkles className="w-4 h-4 ml-1.5" />
              التفريغ الفوري
            </button>
            <button
              onClick={() => onTabChange('radar')}
              className={`nav-tab-btn ${activeTab === 'radar' ? 'active' : ''}`}
            >
              <ShieldAlert className="w-4 h-4 ml-1.5" />
              رادار الأمان
            </button>
            <button
              onClick={() => onTabChange('lectures')}
              className={`nav-tab-btn ${activeTab === 'lectures' ? 'active' : ''}`}
            >
              <BookOpen className="w-4 h-4 ml-1.5" />
              المحاضرات
            </button>
          </nav>
        ) : (
          <nav className="navbar-landing-links">
            <a href="#features" className="landing-link">المميزات</a>
            <a href="#how" className="landing-link">كيف يعمل</a>
            <a href="#clinical" className="landing-link">الفحص السريري</a>
            <a href="#impact" className="landing-link">الأثر الإنساني</a>
          </nav>
        )}

        {/* Right Action Controls */}
        <div className="navbar-right-controls">
          <button
            onClick={onToggleContrast}
            className={`btn-contrast-switch ${highContrast ? 'active' : ''}`}
            title="تبديل وضع التباين العالي لذوي الإعاقة"
          >
            <Eye className="w-4 h-4 ml-1.5" />
            <span className="hidden-mobile">{highContrast ? 'تباين عادي' : 'تباين فائق'}</span>
          </button>

          {currentView === 'landing' ? (
            <button onClick={() => onViewChange('dashboard')} className="btn-navbar-cta">
              <LayoutDashboard className="w-4 h-4 ml-2" />
              دخول المنصة
            </button>
          ) : (
            <button onClick={() => onViewChange('landing')} className="btn-navbar-secondary">
              <Home className="w-4 h-4 ml-2" />
              الصفحة الرئيسية
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
