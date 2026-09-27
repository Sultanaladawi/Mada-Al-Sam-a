import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Activity, Volume2, Sparkles, ShieldAlert, 
  BookOpen, Globe, Headphones, ChevronRight, CheckCircle2, 
  Sliders, ArrowUpRight, Zap, RefreshCw, Layers, Monitor, VolumeX, Info, ExternalLink
} from 'lucide-react';

import HearingTest from './HearingTest/HearingTest';
import LiveHearingAid from './LiveHearingAid/LiveHearingAid';
import SmartCaptions from './SmartCaptions/SmartCaptions';
import SoundRadar from './SoundRadar/SoundRadar';
import SmartLectures from './SmartLectures/SmartLectures';
import MadaBrowser from './MadaBrowser/MadaBrowser';
import WindowsAudioGuideModal from './WindowsAudioGuideModal';

const BANDS = [
  { freq: 250, label: '250Hz' },
  { freq: 500, label: '500Hz' },
  { freq: 1000, label: '1kHz' },
  { freq: 2000, label: '2kHz' },
  { freq: 4000, label: '4kHz' },
  { freq: 8000, label: '8kHz' }
];

export default function Dashboard({ activeTab = 'overview', onTabChange, onViewChange }) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [isFloatingCaptions, setIsFloatingCaptions] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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

  // Calculate EQ gains derived from user audiogram
  const calculateEqGains = (audiogram) => {
    return BANDS.map((b, i) => {
      if (!audiogram) return 8;
      const right = audiogram.rightEar?.[i] ?? 25;
      const left = audiogram.leftEar?.[i] ?? 25;
      const earLoss = Math.max(right, left);
      return Math.min(24, Math.max(-6, Math.round((earLoss - 20) * 0.4)));
    });
  };

  const eqGains = calculateEqGains(userAudiogram);

  // --- CENTRAL SYSTEM-WIDE AUDIO PROCESSING ENGINE (OS / CROSS-DEVICE) ---
  const [isCapturingSystem, setIsCapturingSystem] = useState(false);
  const [systemDspActive, setSystemDspActive] = useState(true);
  const [systemDb, setSystemDb] = useState(0);
  const [systemNotice, setSystemNotice] = useState('');

  const audioCtxRef = useRef(null);
  const systemStreamRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const filtersRef = useRef([]);
  const dryGainRef = useRef(null);
  const wetGainRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Dynamically update active filters when audiogram changes
  useEffect(() => {
    if (filtersRef.current.length === 6 && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      eqGains.forEach((gVal, idx) => {
        if (filtersRef.current[idx]) {
          filtersRef.current[idx].gain.setTargetAtTime(gVal, now, 0.05);
        }
      });
    }
  }, [userAudiogram]);

  const toggleSystemAudioCapture = async () => {
    if (isCapturingSystem) {
      stopSystemAudio();
    } else {
      await startSystemAudio();
    }
  };

  const startSystemAudio = async () => {
    setSystemNotice('');
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext({ latencyHint: 'interactive' });
      if (ctx.state === 'suspended') await ctx.resume();
      audioCtxRef.current = ctx;

      // Ask for Screen/Tab + System Audio capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          systemAudio: 'include'
        }
      });
      systemStreamRef.current = stream;

      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        setSystemNotice('⚠️ تنبيه: لم يتم تحديد خيار "مشاركة صوت النظام" عند اختيار الشاشة. يرجى تفعيل خيار الصوت.');
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      const source = ctx.createMediaStreamSource(new MediaStream([audioTracks[0]]));
      sourceNodeRef.current = source;

      // Create EQ Filter Chain based on user's audiogram
      const filters = BANDS.map((b, idx) => {
        const f = ctx.createBiquadFilter();
        f.type = 'peaking';
        f.frequency.value = b.freq;
        f.Q.value = 1.4;
        f.gain.value = eqGains[idx];
        return f;
      });
      filtersRef.current = filters;

      // Vocal clarity filter (+8dB at 3.2kHz)
      const vocalFilter = ctx.createBiquadFilter();
      vocalFilter.type = 'peaking';
      vocalFilter.frequency.value = 3200;
      vocalFilter.Q.value = 1.6;
      vocalFilter.gain.value = 8;

      // Compressor for acoustic ear protection
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-22, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(10, ctx.currentTime);

      // Gains: wet (filtered) and dry (raw bypass)
      const wetGain = ctx.createGain();
      const dryGain = ctx.createGain();
      wetGain.gain.value = systemDspActive ? 1.0 : 0.0;
      dryGain.gain.value = systemDspActive ? 0.0 : 1.0;
      wetGainRef.current = wetGain;
      dryGainRef.current = dryGain;

      // Analyser
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      // Connect Wet Path: Source -> Filters -> VocalFilter -> Compressor -> WetGain -> Analyser -> Destination
      source.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(vocalFilter);
      vocalFilter.connect(compressor);
      compressor.connect(wetGain);
      wetGain.connect(analyser);
      wetGain.connect(ctx.destination);

      // Connect Dry Path: Source -> DryGain -> Destination
      source.connect(dryGain);
      dryGain.connect(ctx.destination);

      setIsCapturingSystem(true);
      setSystemNotice('✅ جاري تكييف صوت الجهاز وكافة المواقع والبرامج في الزمن الحقيقي! استمع عبر سماعاتك.');

      // Listen for stream stop from browser banner
      audioTracks[0].onended = () => {
        stopSystemAudio();
      };

      // Realtime VU meter loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        setSystemDb(Math.min(100, Math.round(30 + (avg / 255) * 65)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();

    } catch (err) {
      console.warn('System capture cancelled or failed:', err);
      setSystemNotice('تم إلغاء التقاط الشاشة أو جهازك لا يدعم مشاركة صوت النظام.');
      setIsCapturingSystem(false);
    }
  };

  const stopSystemAudio = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (systemStreamRef.current) {
      systemStreamRef.current.getTracks().forEach(t => t.stop());
      systemStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsCapturingSystem(false);
  };

  const toggleSystemDsp = () => {
    const nextVal = !systemDspActive;
    setSystemDspActive(nextVal);
    if (audioCtxRef.current && wetGainRef.current && dryGainRef.current) {
      const now = audioCtxRef.current.currentTime;
      wetGainRef.current.gain.setTargetAtTime(nextVal ? 1.0 : 0.0, now, 0.05);
      dryGainRef.current.gain.setTargetAtTime(nextVal ? 0.0 : 1.0, now, 0.05);
    }
  };

  useEffect(() => {
    return () => {
      stopSystemAudio();
    };
  }, []);

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
      {/* Universal Cross-Device & OS Integration Modal */}
      <WindowsAudioGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Floating Captions Widget if toggled */}
      {isFloatingCaptions && (
        <div className="mada-floating-captions-portal">
          <SmartCaptions
            isFloating={true}
            onToggleFloating={() => setIsFloatingCaptions(false)}
          />
        </div>
      )}

      {/* =========================================================================
          GLOBAL UNIVERSAL OS-WIDE AUDIO & AUDIOGRAM DOCK (Always visible across all tabs)
         ========================================================================= */}
      <div className="mada-global-system-dock">
        {/* Module 1: Audiogram Connection Badge */}
        <div className="dock-pill audiogram-pill" onClick={() => handleTabSelect('hearing-test')} title="اضغط لتحديث فحص السمع">
          <Activity className="w-4 h-4 ml-1.5 text-indigo-400" />
          <div className="dock-pill-text">
            <small>ملف السمع السريري النشط:</small>
            <strong>{userAudiogram?.summary?.classification || 'خفيف'} (+{eqGains[3]}dB)</strong>
          </div>
        </div>

        {/* Module 2: System-Wide Device Audio Capture & DSP Toggle */}
        <div className={`dock-pill system-audio-pill ${isCapturingSystem ? 'capturing' : ''}`}>
          <button
            onClick={toggleSystemAudioCapture}
            className={`btn-dock-toggle-capture ${isCapturingSystem ? 'active' : ''}`}
            title="تكييف صوت كامل الجهاز وكافة البرامج والمواقع"
          >
            {isCapturingSystem ? (
              <>
                <VolumeX className="w-4 h-4 ml-1.5 text-rose-300" />
                <span>إيقاف صوت الجهاز</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4 ml-1.5 text-emerald-400" />
                <span>تكييف صوت كامل الجهاز</span>
              </>
            )}
          </button>

          {isCapturingSystem && (
            <>
              <button
                onClick={toggleSystemDsp}
                className={`btn-dock-dsp-mode ${systemDspActive ? 'enhanced' : 'raw'}`}
                title="التبديل بين الصوت المكيّف والصوت العادي"
              >
                {systemDspActive ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 ml-1 text-emerald-400" />
                    <span>مكيّف ⚡</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 ml-1 text-amber-400" />
                    <span>عادي</span>
                  </>
                )}
              </button>

              <div className="dock-meter-tag" title="شدة صوت الجهاز الحالية">
                <span className="meter-live-dot"></span>
                <span>{systemDb} dB</span>
              </div>
            </>
          )}
        </div>

        {/* Module 3: Quick Navigation to Google & All Websites */}
        <div className="dock-pill quick-web-pill">
          <button
            onClick={() => handleTabSelect('browser')}
            className="btn-dock-web"
            title="الانتقال لمتصفح المواقع وبوابة جوجل"
          >
            <Globe className="w-4 h-4 ml-1.5 text-cyan-400" />
            <span>بوابة جوجل وجميع المواقع</span>
          </button>
        </div>

        {/* Module 4: Device & Windows OS Integration Guide */}
        <div className="dock-pill guide-pill">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="btn-dock-guide"
            title="دليل تشغيل مدى السمع لكامل الجهاز وكافة المواقع والأنظمة"
          >
            <Info className="w-4 h-4 ml-1.5 text-amber-400" />
            <span>دليل كافة الأجهزة</span>
          </button>
        </div>
      </div>

      {systemNotice && (
        <div className="dock-notice-strip">
          <span>{systemNotice}</span>
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
            متصفح الوسائط والمواقع
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
                  نظام بيئي متكامل يعمل كطبقة ذكية لتكييف الأصوات وعزل الضوضاء وتوفير ترجمة فورية ورادار أمان للأشخاص ذوي الإعاقة السمعية عبر كافة المواقع والأجهزة.
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
                <h3>المحاضرات الذكية المكيّفة</h3>
                <p>مشغل صوت مكيّف مع فحص السمع، تفريغ آلي وتلخيص بالذكاء الاصطناعي وبنك أسئلة للمراجعة.</p>
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
          <SoundRadar userAudiogram={userAudiogram} />
        )}

        {/* TAB 6: SMART LECTURES */}
        {currentTab === 'lectures' && (
          <SmartLectures
            userAudiogram={userAudiogram}
            isCapturingSystem={isCapturingSystem}
            onToggleSystemCapture={toggleSystemAudioCapture}
          />
        )}

        {/* TAB 7: MADA BROWSER */}
        {currentTab === 'browser' && (
          <MadaBrowser
            userAudiogram={userAudiogram}
            isCapturingSystem={isCapturingSystem}
            systemDspActive={systemDspActive}
            systemDb={systemDb}
            systemNotice={systemNotice}
            onToggleSystemCapture={toggleSystemAudioCapture}
            onToggleSystemDsp={toggleSystemDsp}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}
      </div>
    </div>
  );
}
