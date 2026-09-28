import React, { useState } from 'react';
import { 
  Volume2, Sparkles, Activity, ShieldAlert, BookOpen, LayoutDashboard, 
  Home, Eye, Menu, X, Globe, ChevronLeft, Film 
} from 'lucide-react';
import MadaLogo from './MadaLogo';

export default function Navbar({ 
  currentView, 
  onViewChange, 
  activeTab, 
  onTabChange, 
  highContrast, 
  onToggleContrast,
  onOpenDeafGuide,
  onOpenLogoMotion 
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMobileTabClick = (tabKey) => {
    onTabChange(tabKey);
    setIsDrawerOpen(false);
  };

  const handleMobileViewChange = (viewKey) => {
    onViewChange(viewKey);
    setIsDrawerOpen(false);
  };

  return (
    <>
      <header className="mada-global-navbar">
        <div className="navbar-inner-container">
          {/* Brand Logo */}
          <MadaLogo 
            size={42} 
            showText={true} 
            showBadge={true} 
            badgeText="منظومة الوصول الشامل"
            onClick={() => onViewChange('landing')}
          />

          {/* Desktop Center Nav Links / Tabs */}
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
              <button
                onClick={() => onTabChange('browser')}
                className={`nav-tab-btn ${activeTab === 'browser' ? 'active' : ''}`}
              >
                <Globe className="w-4 h-4 ml-1.5" />
                المتصفح
              </button>
            </nav>
          ) : (
            <nav className="navbar-landing-links">
              <a href="#video-tour" className="landing-link">عروض الشرح</a>
              <a href="#features" className="landing-link">المميزات</a>
              <a href="#how" className="landing-link">كيف يعمل</a>
              <a href="#clinical" className="landing-link">الفحص السريري</a>
              <a href="#impact" className="landing-link">الأثر الإنساني</a>
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="navbar-right-controls">
            {/* Logo Motion 4K Video Theatre Trigger */}
            <button
              onClick={onOpenLogoMotion}
              className="btn-logo-nav-cinema"
              title="عرض فيديو وهوية الشعار السينمائية (4K)"
            >
              <Film className="w-4 h-4 ml-1.5 text-cyan-400" />
              <span className="hidden-mobile">فيديو الشعار</span>
            </button>

            {/* Deaf Accessibility & Sign Language Quick Button */}
            <button
              onClick={onOpenDeafGuide}
              className="btn-deaf-nav-toggle"
              title="دليل لغة الإشارة والشرح البصري للصم"
            >
              <span className="sign-icon">🤟</span>
              <span className="hidden-mobile">دليل الصم</span>
            </button>

            <button
              onClick={onToggleContrast}
              className={`btn-contrast-switch ${highContrast ? 'active' : ''}`}
              title="تبديل وضع التباين العالي لذوي الإعاقة"
            >
              <Eye className="w-4 h-4 ml-1.5" />
              <span className="hidden-mobile">{highContrast ? 'تباين عادي' : 'تباين فائق'}</span>
            </button>

            {currentView === 'landing' ? (
              <button onClick={() => onViewChange('dashboard')} className="btn-navbar-cta hidden-mobile">
                <LayoutDashboard className="w-4 h-4 ml-2" />
                دخول المنصة
              </button>
            ) : (
              <button onClick={() => onViewChange('landing')} className="btn-navbar-secondary hidden-mobile">
                <Home className="w-4 h-4 ml-2" />
                الرئيسية
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsDrawerOpen(prev => !prev)}
              className="btn-mobile-drawer-toggle"
              aria-label="قائمة الهاتف"
              title="القائمة الرئيسية"
            >
              {isDrawerOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Backdrop & Sliding Drawer */}
      {isDrawerOpen && (
        <div className="mada-drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <div className="mada-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-brand">
                <MadaLogo 
                  size={34} 
                  showText={true} 
                  showBadge={false}
                  onClick={() => handleMobileViewChange('landing')}
                />
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="btn-drawer-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-section-label">أقسام المنصة والتحكم</div>
              <div className="drawer-nav-list">
                <button
                  onClick={() => handleMobileTabClick('overview')}
                  className={`drawer-nav-item ${currentView === 'dashboard' && activeTab === 'overview' ? 'active' : ''}`}
                >
                  <LayoutDashboard className="w-5 h-5 ml-3 text-indigo-400" />
                  <span>نظرة عامة</span>
                  <ChevronLeft className="w-4 h-4 mr-auto text-slate-500" />
                </button>

                <button
                  onClick={() => handleMobileTabClick('hearing-test')}
                  className={`drawer-nav-item ${currentView === 'dashboard' && activeTab === 'hearing-test' ? 'active' : ''}`}
                >
                  <Activity className="w-5 h-5 ml-3 text-emerald-400" />
                  <span>فحص السمع السريري</span>
                  <ChevronLeft className="w-4 h-4 mr-auto text-slate-500" />
                </button>

                <button
                  onClick={() => handleMobileTabClick('live-aid')}
                  className={`drawer-nav-item ${currentView === 'dashboard' && activeTab === 'live-aid' ? 'active' : ''}`}
                >
                  <Volume2 className="w-5 h-5 ml-3 text-cyan-400" />
                  <span>المعين السمعي الحي</span>
                  <ChevronLeft className="w-4 h-4 mr-auto text-slate-500" />
                </button>

                <button
                  onClick={() => handleMobileTabClick('captions')}
                  className={`drawer-nav-item ${currentView === 'dashboard' && activeTab === 'captions' ? 'active' : ''}`}
                >
                  <Sparkles className="w-5 h-5 ml-3 text-purple-400" />
                  <span>التفريغ والترجمة الفورية</span>
                  <ChevronLeft className="w-4 h-4 mr-auto text-slate-500" />
                </button>

                <button
                  onClick={() => handleMobileTabClick('radar')}
                  className={`drawer-nav-item ${currentView === 'dashboard' && activeTab === 'radar' ? 'active' : ''}`}
                >
                  <ShieldAlert className="w-5 h-5 ml-3 text-rose-400" />
                  <span>رادار الأمان الصوتي</span>
                  <ChevronLeft className="w-4 h-4 mr-auto text-slate-500" />
                </button>

                <button
                  onClick={() => handleMobileTabClick('lectures')}
                  className={`drawer-nav-item ${currentView === 'dashboard' && activeTab === 'lectures' ? 'active' : ''}`}
                >
                  <BookOpen className="w-5 h-5 ml-3 text-amber-400" />
                  <span>المحاضرات والملخصات الذكية</span>
                  <ChevronLeft className="w-4 h-4 mr-auto text-slate-500" />
                </button>

                <button
                  onClick={() => handleMobileTabClick('browser')}
                  className={`drawer-nav-item ${currentView === 'dashboard' && activeTab === 'browser' ? 'active' : ''}`}
                >
                  <Globe className="w-5 h-5 ml-3 text-teal-400" />
                  <span>متصفح الوسائط المكيّف</span>
                  <ChevronLeft className="w-4 h-4 mr-auto text-slate-500" />
                </button>
              </div>

              <div className="drawer-footer-actions">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenLogoMotion();
                  }}
                  className="btn-drawer-logo-cinema"
                >
                  <Film className="w-5 h-5 ml-2 text-cyan-400" />
                  <span>فيديو وهوية الشعار السينمائية (4K)</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenDeafGuide();
                  }}
                  className="btn-drawer-deaf-guide"
                >
                  <span className="text-lg ml-2">🤟</span>
                  <span>دليل لغة الإشارة والشرح البصري للصم</span>
                </button>

                <button
                  onClick={() => handleMobileViewChange(currentView === 'landing' ? 'dashboard' : 'landing')}
                  className="btn-drawer-switch-view"
                >
                  {currentView === 'landing' ? (
                    <>
                      <LayoutDashboard className="w-4 h-4 ml-2" />
                      الانتقال للوحة التحكم
                    </>
                  ) : (
                    <>
                      <Home className="w-4 h-4 ml-2" />
                      الرجوع للصفحة الترويجية
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
