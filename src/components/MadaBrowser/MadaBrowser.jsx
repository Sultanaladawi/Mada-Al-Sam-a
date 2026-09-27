import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, Play, Pause, Volume2, Sparkles, Captions, RefreshCw, 
  ExternalLink, Monitor, Search, Headphones, Check, VolumeX, 
  Shield, Radio, ArrowUpRight, Copy, Share2, Layers, AlertTriangle, 
  BookOpen, Video, Info, Laptop, Smartphone
} from 'lucide-react';

const BANDS = [
  { freq: 250, label: '250Hz' },
  { freq: 500, label: '500Hz' },
  { freq: 1000, label: '1kHz' },
  { freq: 2000, label: '2kHz' },
  { freq: 4000, label: '4kHz' },
  { freq: 8000, label: '8kHz' }
];

const QUICK_SITES = [
  { name: 'بحث Google الشامل', url: 'https://www.google.com', icon: '🔍', desc: 'محرك البحث لجميع مواقع الإنترنت', queryUrl: 'https://www.google.com/search?q=' },
  { name: 'Google Scholar (الأبحاث)', url: 'https://scholar.google.com', icon: '🎓', desc: 'البحث الأكاديمي والمراجع العلمية', queryUrl: 'https://scholar.google.com/scholar?q=' },
  { name: 'YouTube التعليمي', url: 'https://www.youtube.com', icon: '📺', desc: 'فيديوهات الشرح والمحاضرات المرئية', queryUrl: 'https://www.youtube.com/results?search_query=' },
  { name: 'Microsoft Teams Web', url: 'https://teams.microsoft.com', icon: '💼', desc: 'الاجتماعات والمحاضرات الجامعية', queryUrl: '' },
  { name: 'Zoom Meetings Web', url: 'https://zoom.us/join', icon: '🎥', desc: 'قاعات المحاضرات والمكالمات الحية', queryUrl: '' },
  { name: 'ويكيبيديا العربية', url: 'https://ar.wikipedia.org', icon: '📖', desc: 'الموسوعة الحرة والمقالات', queryUrl: 'https://ar.wikipedia.org/wiki/Special:Search?search=' },
  { name: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu', icon: '🏛️', desc: 'محاضرات إم آي تي المجانية', queryUrl: 'https://www.google.com/search?q=site:ocw.mit.edu+' },
  { name: 'منصة إدراك التعليمية', url: 'https://www.edraak.org', icon: '📚', desc: 'مساقات تعليمية جامعية عربية', queryUrl: '' }
];

const MEDIA_DEMOS = [
  {
    id: 1,
    title: 'محاضرة جامعة قطر: معايير النفاذ الرقمي الشامل 2026',
    platform: 'YouTube',
    category: 'تعليمي',
    caption: '“...يجب أن نضمن أن كل منصة تعليمية تمتلك ترجمة فورية وكتابة متزامنة للأشخاص ذوي الإعاقة السمعية...”',
    embedId: 'dQw4w9WgXcQ'
  },
  {
    id: 2,
    title: 'اجتماع Microsoft Teams: مناقشة حلول الذكاء الاصطناعي',
    platform: 'Teams',
    category: 'مكالمة عمل',
    caption: '“...فريق التطوير يعمل الآن على دمج معالجة الصوت المباشرة لتحسين جودة الصوت في المكالمة...”',
    embedId: 'test2'
  }
];

export default function MadaBrowser({ 
  userAudiogram, 
  isCapturingSystem, 
  systemDspActive, 
  systemDb, 
  systemNotice, 
  onToggleSystemCapture, 
  onToggleSystemDsp,
  onOpenGuide
}) {
  // Navigation & Browser State
  const [activeMedia, setActiveMedia] = useState(MEDIA_DEMOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dspBoostActive, setDspBoostActive] = useState(true);
  const [captionsActive, setCaptionsActive] = useState(true);
  const [urlInput, setUrlInput] = useState('https://www.google.com');
  const [captionIndex, setCaptionIndex] = useState(0);
  const [browserMode, setBrowserMode] = useState('web-search'); // 'web-search', 'system-audio', 'media-player'

  // Text-To-Speech Reader State
  const [readText, setReadText] = useState('نظام مدى السمع يوفر طبقة نفاذ صوتي شاملة تعمل مع متصفح جوجل وكافة برامج ومواقع الحاسوب والهواتف الذكية.');
  const [isReading, setIsReading] = useState(false);

  // Calculate EQ gains derived from user audiogram
  const eqGains = BANDS.map((b, i) => {
    if (!userAudiogram) return 8;
    const earLoss = Math.max(userAudiogram.rightEar?.[i] || 25, userAudiogram.leftEar?.[i] || 25);
    return Math.min(24, Math.max(-6, Math.round((earLoss - 20) * 0.4)));
  });

  const dynamicCaptions = [
    activeMedia.caption,
    '“...نظام مدى السمع يوفر طبقة وصول عائمة تعمل فوق أي مشغل فيديو أو مكالمة تفاعلية...”',
    '“...تعويض الترددات الناقصة يتم في الزمن الحقيقي بدون أي تأخير ملحوظ في الصوت...”',
    '“...يضمن هذا الحل تكافؤ الفرص التعليمية للطلاب الصم وضعاف السمع في كل المحاضرات...”'
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCaptionIndex(prev => (prev + 1) % dynamicCaptions.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle URL / Google Search submission
  const handleUrlSubmit = (e) => {
    if (e) e.preventDefault();
    let target = urlInput.trim();
    if (!target) return;

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        // Treat as Google Search Query
        target = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
      }
    }
    setUrlInput(target);
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  // Launch site AND enable system-wide audio capture if not active
  const handleLaunchWithAdaptedAudio = (siteUrl) => {
    if (!isCapturingSystem && onToggleSystemCapture) {
      onToggleSystemCapture();
    }
    window.open(siteUrl, '_blank', 'noopener,noreferrer');
  };

  const handleQuickSiteClick = (site) => {
    setUrlInput(site.url);
    handleLaunchWithAdaptedAudio(site.url);
  };

  // Text-To-Speech Reader
  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert('ميزة قراءة النصوص غير مدعومة في متصفحك.');
      return;
    }
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    if (!readText.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(readText);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.92;
    utterance.pitch = 1.05;

    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="mada-browser-card">
      {/* Audiogram Binding Badge */}
      <div className="audiogram-binding-banner">
        <div className="binding-badge">
          <Check className="w-4 h-4 ml-1.5 text-emerald-400" />
          <span>
            ملف السمع مرتبط مع كافة المواقع والأجهزة: تم ضبط مصفوفة تعويض الترددات بنسبة <strong>+{eqGains[3]}dB</strong> حسب فحصك السريري ({userAudiogram?.summary?.classification || 'خفيف'}).
          </span>
        </div>

        {onOpenGuide && (
          <button onClick={onOpenGuide} className="btn-banner-guide">
            <Info className="w-4 h-4 ml-1" /> دليل كافة الأجهزة والأنظمة
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="browser-mode-tabs-row">
        <button
          onClick={() => setBrowserMode('web-search')}
          className={`mode-tab-btn ${browserMode === 'web-search' ? 'active' : ''}`}
        >
          <Search className="w-4 h-4 ml-1.5" />
          بوابة جوجل وجميع مواقع الإنترنت المكيّفة
        </button>
        <button
          onClick={() => setBrowserMode('system-audio')}
          className={`mode-tab-btn ${browserMode === 'system-audio' ? 'active' : ''}`}
        >
          <Monitor className="w-4 h-4 ml-1.5" />
          معالجة صوت كامل الجهاز (OS-Wide Audio Engine)
        </button>
        <button
          onClick={() => setBrowserMode('media-player')}
          className={`mode-tab-btn ${browserMode === 'media-player' ? 'active' : ''}`}
        >
          <Play className="w-4 h-4 ml-1.5" />
          مشغل الوسائط والترجمة العائمة
        </button>
      </div>

      {/* TAB 1: GOOGLE SEARCH & ACCESSIBLE ALL-WEBSITES NAVIGATOR */}
      {browserMode === 'web-search' && (
        <div className="web-search-engine-panel">
          {/* Omnibox / URL Search Bar */}
          <form onSubmit={handleUrlSubmit} className="browser-top-bar">
            <div className="browser-window-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>

            <div className="browser-url-field">
              <Search className="w-4 h-4 text-indigo-400 ml-2 inline" />
              <input
                type="text"
                placeholder="اكتب عنوان أي موقع (مثال: google.com أو youtube.com أو بوابة جامعتك) أو ابحث في جوجل..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="browser-url-input"
              />
            </div>

            <button type="submit" className="btn-browser-go" title="انتقال">
              <ArrowUpRight className="w-4 h-4 ml-1" /> فتح في نافذة مكيّفة
            </button>
          </form>

          {/* Device & System Audio Sync Prompt */}
          <div className="system-sync-callout">
            <div className="callout-text">
              <Sparkles className="w-5 h-5 text-emerald-400 ml-2" />
              <div>
                <strong>تكييف صوت كافة المواقع التي تفتحها:</strong>
                <span>عند الضغط على أي موقع أدناه، سيتم توجيه صوته تلقائياً عبر مصفوفة فحص السمع لسماعات رأسك.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleSystemCapture}
              className={`btn-sync-capture ${isCapturingSystem ? 'active' : ''}`}
            >
              {isCapturingSystem ? (
                <>
                  <VolumeX className="w-4 h-4 ml-1.5 text-rose-300" />
                  صوت الجهاز مكيّف حالياً ⚡
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4 ml-1.5 text-emerald-400" />
                  تفعيل تكييف صوت كامل الجهاز الآن
                </>
              )}
            </button>
          </div>

          {/* Quick Sites Grid */}
          <div className="quick-sites-cluster">
            <div className="quick-sites-header">
              <h5>بوابات سريعة ومنصات تعليمية وعالمية مكيّفة:</h5>
              <small>اختر أي منصة لفتحها مع استمرار تكييف الصوت في الخلفية</small>
            </div>

            <div className="quick-sites-cards-grid">
              {QUICK_SITES.map((site, i) => (
                <div
                  key={i}
                  onClick={() => handleQuickSiteClick(site)}
                  className="quick-site-card"
                  title={`فتح ${site.name} مع تكييف الصوت`}
                >
                  <div className="site-icon-title">
                    <span className="site-emoji">{site.icon}</span>
                    <div>
                      <strong>{site.name}</strong>
                      <small>{site.desc}</small>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 site-arrow" />
                </div>
              ))}
            </div>
          </div>

          {/* Text-To-Speech Reader Module */}
          <div className="tts-reader-card">
            <div className="tts-header">
              <div className="tts-title">
                <Volume2 className="w-5 h-5 text-emerald-400 ml-1.5" />
                <h4>قارئ الشاشة والمقالات الذكي لجميع المواقع (Web Article Reader)</h4>
              </div>
              <button
                type="button"
                onClick={handleReadAloud}
                className={`btn-tts-speak ${isReading ? 'reading' : ''}`}
              >
                {isReading ? (
                  <>
                    <Pause className="w-4 h-4 ml-1.5" />
                    إيقاف القراءة
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 ml-1.5" />
                    قراءة المقال بصوت مكيّف ومضخم
                  </>
                )}
              </button>
            </div>
            <textarea
              value={readText}
              onChange={(e) => setReadText(e.target.value)}
              placeholder="الصق أي مقال أو نص من جوجل أو ويكيبيديا أو المحاضرات هنا ليستمع إليه ضعيف السمع بنبرة صوت مكيّفة حسب فحص السمع..."
              className="tts-textarea"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM-WIDE AUDIO PROCESSING (FOR ALL APPS/DEVICE) */}
      {browserMode === 'system-audio' && (
        <div className="system-audio-engine-panel">
          <div className="system-engine-header">
            <div className="engine-title-cluster">
              <span className="engine-badge">⚡ ابتكار فريد لمسابقة SAIF 2026</span>
              <h3>التقاط وتكييف صوت كامل الجهاز ونظام التشغيل (OS-Wide Audio Layer)</h3>
              <p>
                شغّل أي برنامج على جهازك (زووم Zoom، تيمز Teams، يوتيوب، سبوتيفاي، أو ألعاب)؛ سيقوم مدى السمع باعتراض الصوت وتكييفه وترشيحه من الضوضاء لحظياً لسماعات أذنك في كافة الأجهزة!
              </p>
            </div>

            <button
              onClick={onToggleSystemCapture}
              className={`btn-system-capture ${isCapturingSystem ? 'capturing' : ''}`}
            >
              {isCapturingSystem ? (
                <>
                  <VolumeX className="w-5 h-5 ml-2 text-rose-300" />
                  إيقاف التقاط صوت الجهاز
                </>
              ) : (
                <>
                  <Monitor className="w-5 h-5 ml-2 text-white" />
                  بدء تكييف صوت كامل الجهاز
                </>
              )}
            </button>
          </div>

          {systemNotice && (
            <div className="system-notice-banner">
              <span>{systemNotice}</span>
            </div>
          )}

          {/* System Audio Visualizer & Toggle */}
          <div className="system-dsp-strip">
            <div className="dsp-state-box">
              <span className="dsp-label">حالة التكييف السمعي للجهاز:</span>
              <button
                onClick={onToggleSystemDsp}
                disabled={!isCapturingSystem}
                className={`btn-dsp-toggle ${systemDspActive ? 'enhanced' : 'raw'}`}
              >
                {systemDspActive ? (
                  <>
                    <Sparkles className="w-4 h-4 ml-1.5 text-emerald-400" />
                    معالجة مدى السمع مفعّلة (صوت مكيّف ومضخم)
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 ml-1.5 text-amber-400" />
                    صوت النظام العادي (بدون معالجة)
                  </>
                )}
              </button>
            </div>

            <div className="system-meter-box">
              <span>مستوى شدة صوت النظام: <strong>{isCapturingSystem ? systemDb : '--'} dB</strong></span>
              <div className="spectrum-placeholder">
                <span className="live-status-pill">{isCapturingSystem ? '🟢 الصوت متصل عبر سماعاتك' : '⚪ بانتظار التفعيل'}</span>
              </div>
            </div>
          </div>

          {/* Step Instructions */}
          <div className="system-instructions-grid">
            <div className="instruction-step">
              <span className="step-number">1</span>
              <strong>اضغط على زر البدء</strong>
              <small>ستظهر لك نافذة المتصفح لاختيار شاشة أو تبويب.</small>
            </div>
            <div className="instruction-step">
              <span className="step-number">2</span>
              <strong>فعّل خيار مشاركة الصوت</strong>
              <small>تأكد من تحديد "مشاركة صوت النظام (Share System Audio)".</small>
            </div>
            <div className="instruction-step">
              <span className="step-number">3</span>
              <strong>استمتع بالصوت المكيّف</strong>
              <small>شغّل أي مكالمة أو فيديو في أي برنامج، وستسمعه بوضوح فائق ومخارج حروف واضحة!</small>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEDIA PLAYER & FLOATING CAPTIONS */}
      {browserMode === 'media-player' && (
        <div className="browser-content-area">
          <div className="player-viewport">
            <div className="mock-video-screen">
              <div className="video-overlay-gradient"></div>
              <div className="video-inner-content">
                <span className="badge-platform">{activeMedia.platform} • {activeMedia.category}</span>
                <h4>{activeMedia.title}</h4>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="btn-play-pause-circle"
                >
                  {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white mr-1" />}
                </button>
              </div>

              {/* Live Synchronized Floating Captions Layer */}
              {captionsActive && (
                <div className="floating-video-caption-bar">
                  <div className="caption-live-indicator">
                    <span className="live-dot-green"></span>
                    ترجمة فورية متزامنة
                  </div>
                  <p className="caption-live-text">{dynamicCaptions[captionIndex]}</p>
                </div>
              )}
            </div>

            {/* Player DSP & Captions Toolbar */}
            <div className="player-controls-toolbar">
              <div className="toolbar-left">
                <button
                  onClick={() => setDspBoostActive(!dspBoostActive)}
                  className={`tool-toggle-btn ${dspBoostActive ? 'active' : ''}`}
                >
                  <Volume2 className="w-4 h-4 ml-2" />
                  تعويض الترددات السمعية (DSP): {dspBoostActive ? 'مفعّل ⚡' : 'معطل'}
                </button>
                <button
                  onClick={() => setCaptionsActive(!captionsActive)}
                  className={`tool-toggle-btn ${captionsActive ? 'active' : ''}`}
                >
                  <Captions className="w-4 h-4 ml-2" />
                  الترجمة المرئية (Captions): {captionsActive ? 'ظاهرة 💬' : 'مخفية'}
                </button>
              </div>

              <span className="dsp-status-note">
                {dspBoostActive ? '✨ الصوت مكيّف تلقائياً لتعويض فقدان السمع' : 'صوت عادي بدون معالجة'}
              </span>
            </div>
          </div>

          {/* Media Playlist */}
          <div className="browser-playlist">
            <h5>فيديوهات وتطبيقات تعليمية تجريبية:</h5>
            <div className="playlist-items">
              {MEDIA_DEMOS.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveMedia(item);
                    setUrlInput(`https://${item.platform.toLowerCase()}.com/watch?id=${item.embedId}`);
                  }}
                  className={`playlist-card ${activeMedia.id === item.id ? 'active' : ''}`}
                >
                  <strong>{item.title}</strong>
                  <small>{item.platform} • {item.category}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
