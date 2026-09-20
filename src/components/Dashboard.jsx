import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Activity, Volume2, Sparkles, ShieldAlert, 
  BookOpen, Globe, Headphones, ChevronRight, CheckCircle2, 
  Sliders, ArrowUpRight, Zap, RefreshCw, Layers
} from 'lucide-react';

import HearingTest from './HearingTest/HearingTest';
import LiveHearingAid from './LiveHearingAid/LiveHearingAid';
import SmartCaptions from './SmartCaptions/SmartCaptions';
import SoundRadar from './SoundRadar/SoundRadar';
import SmartLectures from './SmartLectures/SmartLectures';
import MadaBrowser from './MadaBrowser/MadaBrowser';

export default function Dashboard({ activeTab = 'overview', onTabChange, onViewChange }) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [isFloatingCaptions, setIsFloatingCaptions] = useState(false);

  // User Audiogram Data
  const [userAudiogram, setUserAudiogram] = useState(() => {
    const saved = localStorage.getItem('mada_audiogram');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      frequencies: [250, 500, 1000, 2000, 4000, 8000],
      rightEar: [25, 30, 35, 40, 35, 30],
      leftEar: [30, 35, 40, 45, 40, 35],
      summary: {
        rightAvg: 32,
        leftAvg: 37,
        overallAvg: 35,
        classification: 'فقدان سمع خفيف (Mild)',
        severityColor: '#6C63FF',
        advice: 'ملف سمعي أولي تم إعداده مسبقاً، يمكنك إجراء فحص سريري جديد لتحديثه بدقة.'
      }
    };
  });

  // Sync prop change
  useEffect(() => {
    if (activeTab) setCurrentTab(activeTab);
  }, [activeTab]);

  const handleTabSelect = (tabKey) => {
    setCurrentTab(tabKey);
    if (onTabChange) onTabChange(tabKey);
  };

  const handleProfileGenerated = (newProfile) => {
    setUserAudiogram(newProfile);
  };

  const handleApplyToAid = () => {
    handleTabSelect('live-aid');
  };

  return (
    <div className="mada-dashboard-container">
      {/* Floating Captions Widget if toggled */}
      {isFloatingCaptions && (
        <div className="mada-floating-captions-portal">
          <SmartCaptions
            isFloating={true}
            onToggleFloating={() => setIsFloatingCaptions(false)}
          />
        </div>
      )}

      {/* Dashboard Sub-Header / Quick Navigation Pill Bar */}
      <div className="dashboard-subnav-bar">
        <div className="subnav-pill-group">
          <button
            onClick={() => handleTabSelect('overview')}
            className={`subnav-pill ${currentTab === 'overview' ? 'active' : ''}`}
          >
            <LayoutDashboard className="w-4 h-4 ml-1.5" />
            نظرة عامة
          </button>
          <button
            onClick={() => handleTabSelect('hearing-test')}
            className={`subnav-pill ${currentTab === 'hearing-test' ? 'active' : ''}`}
          >
            <Activity className="w-4 h-4 ml-1.5" />
            فحص السمع السريري
          </button>
          <button
            onClick={() => handleTabSelect('live-aid')}
            className={`subnav-pill ${currentTab === 'live-aid' ? 'active' : ''}`}
          >
            <Volume2 className="w-4 h-4 ml-1.5" />
            المعين السمعي الحي
          </button>
          <button
            onClick={() => handleTabSelect('captions')}
            className={`subnav-pill ${currentTab === 'captions' ? 'active' : ''}`}
          >
            <Sparkles className="w-4 h-4 ml-1.5" />
            التفريغ والترجمة الفورية
          </button>
          <button
            onClick={() => handleTabSelect('radar')}
            className={`subnav-pill ${currentTab === 'radar' ? 'active' : ''}`}
          >
            <ShieldAlert className="w-4 h-4 ml-1.5" />
            رادار الأمان الصوتي
          </button>
          <button
            onClick={() => handleTabSelect('lectures')}
            className={`subnav-pill ${currentTab === 'lectures' ? 'active' : ''}`}
          >
            <BookOpen className="w-4 h-4 ml-1.5" />
            المحاضرات الذكية
          </button>
          <button
            onClick={() => handleTabSelect('browser')}
            className={`subnav-pill ${currentTab === 'browser' ? 'active' : ''}`}
          >
            <Globe className="w-4 h-4 ml-1.5" />
            متصفح الوسائط المكيّف
          </button>
        </div>

        <button
          onClick={() => setIsFloatingCaptions(!isFloatingCaptions)}
          className={`btn-floating-launcher ${isFloatingCaptions ? 'active' : ''}`}
          title="تشغيل شريط الترجمة كطبقة عائمة مستمرة"
        >
          <Layers className="w-4 h-4 ml-1.5" />
          {isFloatingCaptions ? 'إغلاق الطبقة العائمة' : 'تشغيل الترجمة العائمة'}
        </button>
      </div>

      {/* Main Dynamic Viewport */}
      <div className="dashboard-content-viewport">
        {/* TAB 1: OVERVIEW */}
        {currentTab === 'overview' && (
          <div className="overview-tab-grid">
            {/* Hero Welcome & Hearing Status Card */}
            <div className="overview-welcome-card">
              <div className="welcome-text-cluster">
                <span className="tech-badge">✨ مرحباً بك في منظومة مدى السمع</span>
                <h2>مركز التحكم الصوتي والوصول الشامل</h2>
                <p>
                  نظام بيئي متكامل يعمل كطبقة ذكية لتكييف الأصوات وعزل الضوضاء وتوفير ترجمة فورية ورادار أمان للأشخاص ذوي الإعاقة السمعية.
                </p>
              </div>

              {/* Hearing Health Status Widget */}
              <div className="hearing-health-status-box">
                <div className="status-top-row">
                  <span className="status-label">حالة الملف السمعي الحالي:</span>
                  <strong className="status-val" style={{ color: userAudiogram?.summary?.severityColor || '#00D4AA' }}>
                    {userAudiogram?.summary?.classification || 'طبيعي'}
                  </strong>
                </div>

                <div className="ear-meters-row">
                  <div className="ear-mini-bar">
                    <small>الأذن اليمنى (R)</small>
                    <div className="mini-progress-track">
                      <div className="fill red" style={{ width: `${Math.min(100, (userAudiogram?.summary?.rightAvg || 30))}%` }}></div>
                    </div>
                    <span>{userAudiogram?.summary?.rightAvg || 30} dB</span>
                  </div>

                  <div className="ear-mini-bar">
                    <small>الأذن اليسرى (L)</small>
                    <div className="mini-progress-track">
                      <div className="fill blue" style={{ width: `${Math.min(100, (userAudiogram?.summary?.leftAvg || 35))}%` }}></div>
                    </div>
                    <span>{userAudiogram?.summary?.leftAvg || 35} dB</span>
                  </div>
                </div>

                <div className="status-action-row">
                  <button onClick={() => handleTabSelect('hearing-test')} className="btn-status-test">
                    تحديث فحص السمع السريري <ChevronRight className="w-4 h-4 mr-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Modules Cards Grid */}
            <div className="modules-cards-grid">
              {/* Card 1 */}
              <div className="module-feature-card" onClick={() => handleTabSelect('live-aid')}>
                <div className="module-icon-wrap icon-purple">
                  <Volume2 className="w-6 h-6 text-indigo-400" />
                </div>
                <h3>المعين السمعي الحي</h3>
                <p>تحويل الهاتف أو الحاسوب لسماعة طبية حية مع تعويض الترددات الناقصة في الوقت الفعلي.</p>
                <span className="card-explore-link">
                  فتح المعين الحي <ArrowUpRight className="w-4 h-4 mr-1" />
                </span>
              </div>

              {/* Card 2 */}
              <div className="module-feature-card" onClick={() => handleTabSelect('captions')}>
                <div className="module-icon-wrap icon-cyan">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <h3>التفريغ والترجمة الفورية</h3>
                <p>كتابة متزامنة للكلام باللغة العربية مع كاشف للمشاعر ونبرة المتحدث لتسهيل التواصل.</p>
                <span className="card-explore-link">
                  بدء الاستماع المباشر <ArrowUpRight className="w-4 h-4 mr-1" />
                </span>
              </div>

              {/* Card 3 */}
              <div className="module-feature-card" onClick={() => handleTabSelect('radar')}>
                <div className="module-icon-wrap icon-pink">
                  <ShieldAlert className="w-6 h-6 text-pink-400" />
                </div>
                <h3>رادار الأمان الصوتي</h3>
                <p>رصد فوري لأصوات الخطر والطوارئ (جرس، إنذار حريق، بوق) مع وميض بصري واهتزاز لمسي.</p>
                <span className="card-explore-link">
                  تفعيل الرادار <ArrowUpRight className="w-4 h-4 mr-1" />
                </span>
              </div>

              {/* Card 4 */}
              <div className="module-feature-card" onClick={() => handleTabSelect('lectures')}>
                <div className="module-icon-wrap icon-amber">
                  <BookOpen className="w-6 h-6 text-amber-400" />
                </div>
                <h3>المحاضرات الذكية</h3>
                <p>تسجيل المحاضرات والاجتماعات وتلخيصها تلقائياً بالذكاء الاصطناعي مع بنك أسئلة للمراجعة.</p>
                <span className="card-explore-link">
                  استعراض المحاضرات <ArrowUpRight className="w-4 h-4 mr-1" />
                </span>
              </div>
            </div>

            {/* Quick Live Aid Embed on Overview for Immediate Tuning */}
            <div className="overview-live-aid-preview">
              <LiveHearingAid userAudiogram={userAudiogram} />
            </div>
          </div>
        )}

        {/* TAB 2: HEARING TEST */}
        {currentTab === 'hearing-test' && (
          <HearingTest
            onProfileGenerated={handleProfileGenerated}
            onApplyToAid={handleApplyToAid}
          />
        )}

        {/* TAB 3: LIVE HEARING AID */}
        {currentTab === 'live-aid' && (
          <LiveHearingAid userAudiogram={userAudiogram} />
        )}

        {/* TAB 4: SMART CAPTIONS */}
        {currentTab === 'captions' && (
          <SmartCaptions
            isFloating={false}
            onToggleFloating={() => setIsFloatingCaptions(true)}
          />
        )}

        {/* TAB 5: SOUND RADAR */}
        {currentTab === 'radar' && (
          <SoundRadar />
        )}

        {/* TAB 6: SMART LECTURES */}
        {currentTab === 'lectures' && (
          <SmartLectures />
        )}

        {/* TAB 7: MADA BROWSER */}
        {currentTab === 'browser' && (
          <MadaBrowser />
        )}
      </div>
    </div>
  );
}
