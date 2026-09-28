import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, 
  CheckCircle2, BookOpen, Activity, ShieldAlert, Monitor, 
  ChevronRight, ChevronLeft, ExternalLink, Layers, Eye, Film,
  Mic, MicOff, Settings, Download, FileText, ArrowRight, Smartphone,
  Radio, Sliders, Check, Lock, Info
} from 'lucide-react';
import MadaLogo from './MadaLogo';

/**
 * 6 Comprehensive Chapters covering the entirety of Mada Al-Sam'a:
 * 1. OS-Level Architecture & Unified System Layer
 * 2. Clinical Audiometry: Headphones, Speaker (Free-field), Aided vs Unaided
 * 3. Live DSP Hearing Aid, Speech Clarity Boost & Audio Presets
 * 4. Smart Floating Live Captions with Phoneme Highlighting
 * 5. Multi-Sensory Safety Radar: Fire, Ambulance, Door Knocks
 * 6. Clinical Privacy, .mada Profile Export/Import & PDF Reports
 */
const CHAPTERS = [
  {
    id: 1,
    title: 'نظرة عامة على المنظومة وطبقة النظام الموحدة',
    subtitle: 'طبقة وصول مركزية توفق بين برامج الكمبيوتر والأذن البشرية',
    duration: '01:30',
    tag: 'هندسة النظام',
    icon: Sparkles,
    color: '#00D4AA',
    badge: 'فصل 1',
    description: 'تعمل «مدى السمع» كطبقة نظام تشغيل وسيطة (OS-Level Access Layer) تلتقط الصوت من كافة التطبيقات (Zoom, Teams, YouTube, Google Meet) وتكيّفه رقمياً لحظة بلحظة ليلائم احتياجك السمعي الشخصي بدقة.',
    bulletPoints: [
      'طبقة وصول مركزية تعمل على مستوى نظام التشغيل لكافة التطبيقات.',
      'معالجة رقمية فائقة السرعة بزمن استجابة فوري أقل من 12 ميلي ثانية.',
      'متوافق بالكامل مع معايير النفاذ الرقمي الدولية WCAG 2.2 AAA.'
    ],
    narrationText: 'منظومة مدى السمع هي طبقة وصول ذكية تعمل على مستوى نظام التشغيل، حيث تلتقط تيار الصوت الرقمي من كافة التطبيقات مثل زووم وتيمز ويوتيوب، وتُجري عليه معالجة رقمية فائقة الدقة لتكييفه مع احتياجاتك السمعية.',
    captions: [
      { start: 0, end: 32, text: 'منظومة «مدى السمع» تعمل كطبقة نظام وسيطة موحدة في نظام التشغيل (OS-Level)...' },
      { start: 33, end: 68, text: 'التقاط تيار الصوت الرقمي من Zoom و Teams و YouTube وتكييفه لحظياً دون أي تأخير...' },
      { start: 69, end: 100, text: 'توافق كامل مع معايير النفاذ الرقمي العالمية WCAG 2.2 AAA لتمكين ذوي الإعاقة السمعية.' }
    ],
    demoType: 'os-layer'
  },
  {
    id: 2,
    title: 'فحص السمع السريري ومعايرة الترددات',
    subtitle: 'الفحص بدون سماعات عبر سبيكر اللابتوب، والمقارنة قبل وبعد المعينات',
    duration: '02:15',
    tag: 'فحص سريري وطبي',
    icon: Activity,
    color: '#38BDF8',
    badge: 'فصل 2',
    description: 'إجراء فحص نغمي سريري نقي (Pure Tone Audiometry) من 250Hz إلى 8000Hz. يشمل ميزة حصرية للفحص في المجال الحر بسبيكر الجهاز دون سماعات، وحساب الفائدة الوظيفية قبل وبعد ارتداء السماعة الطبية بدقة.',
    bulletPoints: [
      'إمكانية الفحص في المجال الحر (Free-Field) عبر سبيكر اللابتوب دون سماعات.',
      'مقارنة العتبات السمعية قبل وبعد المعين الطبي لحساب الفائدة الوظيفية (Functional Gain).',
      'تحديد نوع وشدة الفقدان السمعي فوراً وفق معايير منظمة الصحة العالمية (WHO).'
    ],
    narrationText: 'يتيح لك فحص السمع السريري اختبار الترددات الستة بدقة تامة. والأهم، يمكنك إجراء الفحص بدون سماعات عبر سبيكر اللابتوب في المجال الحر، أو إجراؤه قبل وبعد ارتداء السماعات الطبية لحساب الفائدة الوظيفية.',
    captions: [
      { start: 0, end: 35, text: 'فحص سريري نغمي دقيق يغطي الترددات الستة من 250Hz إلى 8000Hz...' },
      { start: 36, end: 70, text: 'ميزة حصرية: الفحص في المجال الحر بسبيكر اللابتوب دون الحاجة لارتداء سماعات رأس...' },
      { start: 71, end: 100, text: 'حساب الفائدة الوظيفية التلقائية ومقارنة المنحنى قبل وبعد ارتداء السماعة الطبية.' }
    ],
    demoType: 'audiometry'
  },
  {
    id: 3,
    title: 'المعين السمعي الرقمي الحي وموازن الترددات',
    subtitle: 'تضخيم مخارج الحروف وعزل الضجيج والأوضاع السمعية الذكية',
    duration: '02:00',
    tag: 'معالجة صوتية حية',
    icon: Volume2,
    color: '#818CF8',
    badge: 'فصل 3',
    description: 'تحويل جهازك إلى معين سمعي فائق الذكاء يقوم برفع وضوح مخارج الحروف (+10dB) وكبح الضوضاء المحيطة، مع 4 أوضاع صوتية جاهزة بنقرة واحدة (محاضرات، شارع وأمان، اجتماعات، وهدوء).',
    bulletPoints: [
      'تعزيز حزمة مخارج الحروف الكلامية (1000Hz - 4000Hz) لتسهيل الفهم.',
      'مرشحات عزل الصدى والضوضاء المحيطة لبيئة استماع مريحة ونقية.',
      'أوضاع سمعية فورية بنقرة واحدة مبرمجة لمختلف البيئات الحياتية.'
    ],
    narrationText: 'يعمل المعين السمعي الحي كجهاز طبي افتراضي، يقوم بتضخيم مخارج الحروف الكلامية بنسبة تصل إلى عشرة ديسيبل، مع عزل تشويش الغرفة عبر مرشحات متقدمة وأوضاع سريعة بلمسة واحدة.',
    captions: [
      { start: 0, end: 32, text: 'معالجة صوتية فورية مع تركيز هندسي على حزمة وضوح الكلام ومخارج الحروف...' },
      { start: 33, end: 68, text: 'عزل فوري للصدى والضجيج الخلفي لضمان راحة الأذن أثناء الاستماع الطويل...' },
      { start: 69, end: 100, text: 'أوضاع سريعة بنقرة واحدة: وضع المحاضرات، الشارع والأمان، الاجتماعات، والهدوء.' }
    ],
    demoType: 'hearing-aid'
  },
  {
    id: 4,
    title: 'التفريغ والترجمة الفورية العائمة الذكية',
    subtitle: 'طبقة نصوص عائمة فوق كل التطبيقات مع تحليل النبرة ومخارج الحروف',
    duration: '01:45',
    tag: 'ذكاء اصطناعي وتفريغ',
    icon: BookOpen,
    color: '#A855F7',
    badge: 'فصل 4',
    description: 'نافذة تفريغ ذكية تطفو باستمرار فوق أي فيديو أو اجتماع (Zoom, YouTube, Teams) لتحويل الكلام المنطوق إلى نصوص عربية دقيقة بنسبة 98%، مع تلوين الكلمات وتظليل الحروف المتشابهة لتسهيل القراءة.',
    bulletPoints: [
      'طبقة نصوص عائمة مستمرة تظهر فوق كافة نوافذ وتطبيقات النظام.',
      'تظليل الحروف المتشابهة وتلوين الكلمات لتسهيل القراءة السريعة للصم.',
      'استشعار ذكي لنبرة الصوت والمشاعر وتلخيص المحاضرات بملف نصي.'
    ],
    narrationText: 'تتيح نافذة التفريغ الفوري العائمة متابعة المحاضرات والاجتماعات بدقة تصل إلى ثمانية وتسعين بالمئة، مع تمييز نبرة المتحدث وتلوين الكلمات لتسهيل القراءة السريعة.',
    captions: [
      { start: 0, end: 34, text: 'نافذة تفريغ ذكية تطفو فوق أي تطبيق (Zoom, Teams, YouTube) باستمرار...' },
      { start: 35, end: 69, text: 'دقة تفريغ عربي تفوق 98% مع تظليل مخارج الحروف وتلوين الكلمات للقراءة السريعة...' },
      { start: 70, end: 100, text: 'كشف نبرة الصوت والمشاعر وحفظ النصوص كملخص دراسي منظم بضغطة زر.' }
    ],
    demoType: 'captions'
  },
  {
    id: 5,
    title: 'رادار الأمان واستشعار الخطر متعدد الحواس',
    subtitle: 'حماية الصم بتحويل صفارات الإنذار وطرق الباب إلى وميض واهتزاز',
    duration: '01:45',
    tag: 'سلامة واستشعار حسي',
    icon: ShieldAlert,
    color: '#F43F5E',
    badge: 'فصل 5',
    description: 'نظام حماية ذكي يراقب البيئة الصوتية في المنزل أو الشارع باستمرار، ويتعرف على صفارات الحريق، وأبواق السيارات، والإسعاف، وطرقات الباب، ويحولها فوراً إلى وميض شاشة واهتزاز لمسي.',
    bulletPoints: [
      'استشعار صوتي دائم لصفارات الإنذار، الإسعاف، وطرقات الباب.',
      'تحويل الإشارات الصوتية غير المسموعة إلى وميض بصري ملون واهتزاز لمسي.',
      'حماية مدار الساعة للصم وضعاف السمع في المنزل وقاعات الدراسة والعمل.'
    ],
    narrationText: 'يراقب رادار الأمان البيئة الصوتية باستمرار. وعند رصد صفارة حريق أو بوق سيارة أو طرق باب، يحولها فوراً إلى وميض شاشة ملون واهتزاز لمسي لضمان سلامة الأصم في كل مكان.',
    captions: [
      { start: 0, end: 32, text: 'استشعار صوتي ذكي يتعرف على صفارات الحريق، الإسعاف، وطرقات الباب...' },
      { start: 33, end: 68, text: 'تحويل الخطر الصوتي فوراً إلى وميض بصري كامل الشاشة واهتزاز لمسي بالجهاز...' },
      { start: 69, end: 100, text: 'حماية متكاملة تمنح الأصم الأمان والاستقلالية الكاملة في البيت والشارع.' }
    ],
    demoType: 'safety'
  },
  {
    id: 6,
    title: 'الخصوصية الطبية وملفات .mada والتقارير',
    subtitle: 'خصوصية مطلقة بدون سحابة، وتصدير واستيراد الملف السمعي وتقارير PDF',
    duration: '01:30',
    tag: 'خصوصية وتوثيق طبي',
    icon: CheckCircle2,
    color: '#10B981',
    badge: 'فصل 6',
    description: 'حماية خصوصية متناهية بدون سحابة (Zero-Cloud / HIPAA). حفظ وتصدير واستيراد ملفات الفحص بصيغة .mada المشفرة محلياً، وتوليد تقارير تخطيط السمع الرسمية بصيغة PDF لتقديمها للأطباء والمراكز.',
    bulletPoints: [
      'بياناتك الطبية والسمعية لا تغادر جهازك نهائياً (خصوصية 100% Zero-Cloud).',
      'تصدير واستيراد ملفك السمعي الشخصي بصيغة .mada بنقرة واحدة.',
      'توليد تقارير سريرية رسمية بصيغة PDF متوافقة مع متطلبات أطباء السمعيات.'
    ],
    narrationText: 'تضمن المنظومة خصوصية طبية تامة بدون سحابة. حيث تُحفظ بياناتك محلياً على جهازك، ويمكنك تصدير ملفك السمعي بصيغة مدى، أو إنشاء تقرير سريري بصيغة بي دي إف لتقديمه لطبيبك.',
    captions: [
      { start: 0, end: 34, text: 'خصوصية طبية صارمة بدون سحابة (Zero-Cloud) متوافقة مع معايير HIPAA...' },
      { start: 35, end: 69, text: 'إمكانية تصدير واستيراد ملفك السمعي الشخصي بصيغة .mada المشفرة محلياً...' },
      { start: 70, end: 100, text: 'إنشاء تقارير سريرية موثقة بصيغة PDF قابلة للطباعة والمشاركة مع أخصائي السمعيات.' }
    ],
    demoType: 'privacy'
  }
];

export default function VideoShowcase({ onOpenDeafGuide, onViewChange, onOpenLogoMotion }) {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(15);
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceoverEnabled, setIsVoiceoverEnabled] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [liveEqGain, setLiveEqGain] = useState(12);
  const [activeSimAlert, setActiveSimAlert] = useState(null);

  const canvasRef = useRef(null);
  const synthRef = useRef(null);

  const activeChapter = CHAPTERS[activeChapterIndex];

  // Helper for voiceover narration
  const speakNarration = useCallback((text) => {
    if (!isVoiceoverEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang && v.lang.startsWith('ar'));
      if (arVoice) utterance.voice = arVoice;
      utterance.rate = playbackSpeed === 1 ? 0.95 : playbackSpeed === 1.25 ? 1.15 : 1.35;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis warning:', e);
    }
  }, [isVoiceoverEnabled, playbackSpeed]);

  const stopNarration = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Sync narration with chapter change or play toggle
  useEffect(() => {
    if (isPlaying && isVoiceoverEnabled) {
      speakNarration(activeChapter.narrationText);
    } else {
      stopNarration();
    }
    return () => stopNarration();
  }, [isPlaying, activeChapterIndex, isVoiceoverEnabled, speakNarration, stopNarration, activeChapter.narrationText]);

  // Audio spectrum & interactive canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // Draw subtle background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Draw rhythmic audio spectrum waves in background
      const numBars = 36;
      const barWidth = (w / numBars) - 3;
      
      for (let i = 0; i < numBars; i++) {
        const heightMultiplier = isPlaying 
          ? (Math.sin(phase + i * 0.25) * 0.4 + 0.6) * (Math.cos(phase * 0.6 + i * 0.15) * 0.3 + 0.7)
          : (Math.sin(i * 0.3) * 0.15 + 0.25);

        const barHeight = Math.max(6, heightMultiplier * (h * 0.55));
        const x = i * (barWidth + 3);
        const y = h - barHeight - 12;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, `${activeChapter.color}99`);
        grad.addColorStop(1, `${activeChapter.color}11`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barWidth, barHeight, 3);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      phase += isPlaying ? 0.06 * playbackSpeed : 0.015;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, activeChapter.color, playbackSpeed]);

  // Video playback progress ticker
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            // Auto advance to next chapter if available
            if (activeChapterIndex < CHAPTERS.length - 1) {
              setActiveChapterIndex(idx => idx + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return 100;
            }
          }
          return prev + 1;
        });
      }, 300 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, activeChapterIndex]);

  const handleChapterSelect = (index) => {
    setActiveChapterIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const handlePrevChapter = () => {
    if (activeChapterIndex > 0) {
      handleChapterSelect(activeChapterIndex - 1);
    }
  };

  const handleNextChapter = () => {
    if (activeChapterIndex < CHAPTERS.length - 1) {
      handleChapterSelect(activeChapterIndex + 1);
    }
  };

  // Find active live caption based on progress
  const currentCaption = activeChapter.captions.find(
    c => progress >= c.start && progress <= c.end
  ) || activeChapter.captions[0];

  return (
    <section id="video-tour" className="video-showcase-section">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="section-pill-tag">
            <Sparkles className="w-4 h-4 ml-1.5 text-cyan-400" />
            <span>المسرح التعليمي الشامل وعروض المحاكاة الحية</span>
          </div>
          <h2 className="section-title-luxury">
            كيف تعمل منظومة <span className="highlight-text">«مدى السمع»</span> بالتفصيل؟
          </h2>
          <p className="section-subtitle-luxury">
            جولة مرئية تفاعلية مقسمة إلى ستة فصول عملية تشرح كل تقنية في المنظومة: من فحص السمع بالسبيكر وبدون سماعات، إلى المعين الحي، والتفريغ الفوري، ورادار الأمان الصوتي.
          </p>
        </div>

        {/* Master Showcase Layout */}
        <div className="showcase-player-grid">
          {/* Main Video & Interactive Stage */}
          <div className="player-stage-card">
            {/* Visual Viewport Stage */}
            <div className="player-stage-viewport">
              {/* Animated Canvas Background */}
              <canvas ref={canvasRef} width={800} height={380} className="player-wave-canvas" />

              {/* Viewport Top Bar Overlay */}
              <div className="player-top-overlay">
                <div className="player-chapter-badge" style={{ borderColor: activeChapter.color }}>
                  <span className="dot" style={{ backgroundColor: activeChapter.color }}></span>
                  <span>{activeChapter.badge}: {activeChapter.tag}</span>
                </div>

                <div className="player-top-actions">
                  {/* Voiceover status pill */}
                  <button 
                    onClick={() => setIsVoiceoverEnabled(!isVoiceoverEnabled)}
                    className={`btn-voiceover-pill ${isVoiceoverEnabled ? 'active' : ''}`}
                    title={isVoiceoverEnabled ? 'التعليق الصوتي العربي مفعّل' : 'تفعيل التعليق الصوتي'}
                  >
                    {isVoiceoverEnabled ? <Mic className="w-3.5 h-3.5 ml-1 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 ml-1 text-slate-400" />}
                    <span>{isVoiceoverEnabled ? 'تعليق صوتي نشط' : 'كتم التعليق'}</span>
                  </button>

                  <div className="player-timing-badge">
                    {isPlaying ? 'محاكاة حية ⚡' : 'جاهز للتشغيل'} | {activeChapter.duration}
                  </div>
                </div>
              </div>

              {/* INTERACTIVE CHAPTER SIMULATION STAGE (Centers on screen) */}
              <div className="player-interactive-stage">
                {/* 1. OS-LAYER ARCHITECTURE DEMO */}
                {activeChapter.demoType === 'os-layer' && (
                  <div className="sim-os-stage animate-fade-in">
                    <div className="os-apps-grid">
                      <div className="os-app-chip">Zoom Meetings</div>
                      <div className="os-app-chip">Microsoft Teams</div>
                      <div className="os-app-chip">YouTube & Media</div>
                    </div>
                    <div className="os-flow-connector">
                      <div className="flow-pulse-line"></div>
                      <span className="flow-badge">تيار صوتي رقمي مباشر</span>
                    </div>
                    <div className="os-core-card">
                      <MadaLogo size={32} iconOnly={true} />
                      <div className="core-info">
                        <strong>نواة معالجة «مدى السمع» DSP Core</strong>
                        <small>معالجة فورية بزمن استجابة أقل من 12ms • معايير WCAG 2.2 AAA</small>
                      </div>
                    </div>
                    <div className="os-output-badge">
                      <Volume2 className="w-4 h-4 ml-1.5 text-emerald-400" />
                      <span>صوت مكيّف بالكامل للأذن وقوقعة السمع</span>
                    </div>
                  </div>
                )}

                {/* 2. CLINICAL AUDIOMETRY & FUNCTIONAL GAIN DEMO */}
                {activeChapter.demoType === 'audiometry' && (
                  <div className="sim-audiometry-stage animate-fade-in">
                    <div className="audio-test-top-tags">
                      <span className="tag-freefield">🔊 الفحص في المجال الحر (سبيكر اللابتوب بدون سماعات)</span>
                      <span className="tag-gain">🦻 الفائدة الوظيفية: +18dB</span>
                    </div>
                    <div className="mini-audiogram-visual">
                      <div className="audiogram-freqs-header">
                        <span>250Hz</span><span>500Hz</span><span>1000Hz</span><span>2000Hz</span><span>4000Hz</span><span>8000Hz</span>
                      </div>
                      <div className="audiogram-chart-area">
                        <div className="chart-line-before" title="قبل المعين السمعي (55dB HL)"></div>
                        <div className="chart-line-after" title="بعد المعين السمعي (20dB HL - نطاق طبيعي)"></div>
                        <div className="chart-marker marker-r" style={{ top: '25%', left: '45%' }}>O</div>
                        <div className="chart-marker marker-l" style={{ top: '35%', left: '70%' }}>X</div>
                      </div>
                    </div>
                    <div className="audio-methods-note">
                      <span>✓ فحص بسماعات الرأس</span>
                      <span>✓ فحص بسبيكر الجهاز</span>
                      <span>✓ مقارنة قبل وبعد السماعة الطبية</span>
                    </div>
                  </div>
                )}

                {/* 3. LIVE HEARING AID & DSP DEMO */}
                {activeChapter.demoType === 'hearing-aid' && (
                  <div className="sim-hearing-aid-stage animate-fade-in">
                    <div className="aid-presets-row">
                      <span className="aid-preset-pill active">🎓 وضع المحاضرات</span>
                      <span className="aid-preset-pill">🚨 وضع الشارع</span>
                      <span className="aid-preset-pill">💼 وضع الاجتماعات</span>
                      <span className="aid-preset-pill">🌙 وضع الهدوء</span>
                    </div>
                    <div className="mini-eq-bars">
                      {[
                        { label: 'Bass', val: '+4dB', h: '35%' },
                        { label: 'Low-Mid', val: '+6dB', h: '45%' },
                        { label: 'Speech 1', val: '+14dB', h: '85%', highlight: true },
                        { label: 'Speech 2', val: '+18dB', h: '95%', highlight: true },
                        { label: 'Presence', val: '+10dB', h: '65%' },
                        { label: 'Treble', val: '+5dB', h: '40%' },
                      ].map((b, idx) => (
                        <div key={idx} className={`mini-eq-col ${b.highlight ? 'speech-highlight' : ''}`}>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ height: b.h }}></div>
                          </div>
                          <span className="bar-label">{b.label}</span>
                          <span className="bar-val">{b.val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="clarity-banner">
                      <Sparkles className="w-3.5 h-3.5 ml-1.5 text-cyan-400" />
                      <span>تعزيز ترددات مخارج الحروف الكلامية (+14dB) مع عزل ضجيج الغرفة</span>
                    </div>
                  </div>
                )}

                {/* 4. SMART FLOATING CAPTIONS DEMO */}
                {activeChapter.demoType === 'captions' && (
                  <div className="sim-captions-stage animate-fade-in">
                    <div className="mock-window-container">
                      <div className="mock-window-header">
                        <span className="mock-dot red"></span>
                        <span className="mock-dot yellow"></span>
                        <span className="mock-dot green"></span>
                        <span className="mock-title">نافذة التفريغ الذكية المستمرة — مدى السمع</span>
                      </div>
                      <div className="mock-captions-content">
                        <div className="sentiment-row">
                          <span className="sentiment-tag">😊 نبرة صوت المتحدث: إيجابية وواضحة</span>
                          <span className="acc-tag">دقة 98.8% • ذكاء اصطناعي عربي</span>
                        </div>
                        <p className="typed-text-flow">
                          «أهلاً بكم في محاضرة اليوم... سنناقش حلول النفاذ الرقمي الشامل لتمكين الطلاب في بيئة التعلم...»
                        </p>
                        <div className="phoneme-tags-row">
                          <span className="phoneme-chip">تظليل مخارج الحروف</span>
                          <span className="phoneme-chip">تمييز الأسئلة تلقائياً</span>
                          <span className="phoneme-chip">حفظ التلخيص PDF</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. MULTI-SENSORY SAFETY RADAR DEMO */}
                {activeChapter.demoType === 'safety' && (
                  <div className="sim-safety-stage animate-fade-in">
                    <div className="safety-radar-wrap">
                      <div className="radar-sweep-circle">
                        <div className="radar-scanner-beam"></div>
                        <div className="radar-blip-siren">🚨</div>
                        <div className="radar-blip-door">🚪</div>
                      </div>
                      <div className="safety-alert-card-demo alert-fire">
                        <ShieldAlert className="w-6 h-6 text-rose-400 ml-2" />
                        <div>
                          <strong>رصد فوري لصفارة إنذار حريق (3100Hz)</strong>
                          <p>تم تحويل الصوت إلى وميض شاشة أحمر واهتزاز هاتف مستمر لحمايتك.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. CLINICAL PRIVACY & .MADA EXPORT DEMO */}
                {activeChapter.demoType === 'privacy' && (
                  <div className="sim-privacy-stage animate-fade-in">
                    <div className="privacy-card-preview">
                      <div className="privacy-header-row">
                        <div className="privacy-badge-lock">
                          <Lock className="w-4 h-4 ml-1.5 text-emerald-400" />
                          <span>خصوصية مطلقة بدون سحابة (Zero-Cloud / HIPAA)</span>
                        </div>
                        <span className="profile-id-tag">ملف مريض مشفر #MADA-8841</span>
                      </div>
                      <div className="privacy-details-grid">
                        <div className="detail-item">
                          <span>المتوسط النغمي PTA:</span>
                          <strong>25 dB (طبيعي إلى بسيط)</strong>
                        </div>
                        <div className="detail-item">
                          <span>فحص السبيكر الحر:</span>
                          <strong>تم بنجاح (معايرة ANSI)</strong>
                        </div>
                        <div className="detail-item">
                          <span>تنسيق الملف:</span>
                          <strong>ملف .mada مشفر محلياً</strong>
                        </div>
                      </div>
                      <div className="privacy-actions-row">
                        <button className="btn-demo-mada-file">
                          <Download className="w-3.5 h-3.5 ml-1.5" />
                          تصدير ملف .mada
                        </button>
                        <button className="btn-demo-pdf-file">
                          <FileText className="w-3.5 h-3.5 ml-1.5" />
                          طباعة تقرير PDF الطبي
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Synced Subtitles Strip */}
              <div className="player-subtitles-strip">
                <span className="captions-indicator">تفريغ فوري متزامن:</span>
                <p className="caption-text-body">{currentCaption.text}</p>
              </div>

              {/* Bottom Video Controls Bar */}
              <div className="player-controls-bottom">
                {/* Progress bar line */}
                <div 
                  className="progress-bar-track" 
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    setProgress(Math.round((clickX / rect.width) * 100));
                  }}
                  title="انقر للتقديم أو التأخير"
                >
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${progress}%`, backgroundColor: activeChapter.color }}
                  ></div>
                </div>

                <div className="controls-row">
                  {/* Left Playback Buttons */}
                  <div className="controls-left">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)} 
                      className="btn-ctrl btn-play-pause"
                      title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل العرض'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>

                    <button 
                      onClick={handlePrevChapter} 
                      disabled={activeChapterIndex === 0}
                      className="btn-ctrl" 
                      title="الفصل السابق"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={handleNextChapter} 
                      disabled={activeChapterIndex === CHAPTERS.length - 1}
                      className="btn-ctrl" 
                      title="الفصل التالي"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => {
                        setProgress(0);
                        if (isPlaying && isVoiceoverEnabled) speakNarration(activeChapter.narrationText);
                      }} 
                      className="btn-ctrl" 
                      title="إعادة تشغيل هذا الفصل"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Speed Selector */}
                    <div className="speed-selector-group">
                      {[1, 1.25, 1.5].map(speed => (
                        <button
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`btn-speed-pill ${playbackSpeed === speed ? 'active' : ''}`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>

                    <span className="time-code">
                      {Math.floor((progress / 100) * 90)}s / {activeChapter.duration}
                    </span>
                  </div>

                  {/* Right Tools & Modals */}
                  <div className="controls-right">
                    <button 
                      onClick={onOpenLogoMotion} 
                      className="btn-logo-motion-helper" 
                      title="عرض موشن جرافيك وفيديو الشعار (4K)"
                    >
                      <Film className="w-3.5 h-3.5 ml-1 text-cyan-400" />
                      <span className="hidden-mobile">فيديو الشعار (4K)</span>
                    </button>

                    <button 
                      onClick={onOpenDeafGuide} 
                      className="btn-deaf-helper" 
                      title="فتح الشرح بلغة الإشارة"
                    >
                      <span>🤟 شرح لغة الإشارة</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Meta Info & Action Bar */}
            <div className="player-meta-box">
              <div className="meta-title-cluster">
                <div className="meta-header-row">
                  <h3>{activeChapter.title}</h3>
                  <span className="active-badge-pill" style={{ color: activeChapter.color, borderColor: activeChapter.color }}>
                    {activeChapter.badge}
                  </span>
                </div>
                <p className="meta-subtitle">{activeChapter.subtitle}</p>
              </div>

              <p className="meta-paragraph">{activeChapter.description}</p>

              {/* Key Takeaways Checklist */}
              <div className="takeaways-list">
                {activeChapter.bulletPoints.map((point, idx) => (
                  <div key={idx} className="takeaway-item">
                    <CheckCircle2 className="w-4 h-4 ml-2 text-emerald-400 flex-shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              {/* Direct Jump CTA */}
              <div className="meta-footer-actions">
                <button 
                  onClick={() => onViewChange('dashboard')} 
                  className="btn-jump-try"
                >
                  <span>جرّب هذه الميزة عملياً في المنظومة الآن</span>
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chapters Sidebar Playlist (All 6 Chapters) */}
          <div className="chapters-playlist-col">
            <div className="playlist-header">
              <div>
                <h4>فصول الدليل المرئي الكامل</h4>
                <p className="playlist-sub">6 محطات تشرح المنظومة بنسبة 100%</p>
              </div>
              <span className="playlist-count">6 فصول</span>
            </div>

            <div className="chapters-list">
              {CHAPTERS.map((chap, idx) => {
                const IconComp = chap.icon;
                const isSelected = activeChapterIndex === idx;
                return (
                  <div 
                    key={chap.id}
                    onClick={() => handleChapterSelect(idx)}
                    className={`chapter-item-card ${isSelected ? 'selected' : ''}`}
                    style={isSelected ? { borderColor: chap.color, background: `${chap.color}10` } : {}}
                  >
                    <div className="chapter-item-icon" style={{ backgroundColor: `${chap.color}22`, color: chap.color }}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="chapter-item-info">
                      <div className="chapter-tag-row">
                        <span className="chap-badge" style={{ color: chap.color }}>{chap.badge}</span>
                        <span className="chap-duration">{chap.duration}</span>
                      </div>
                      <h5>{chap.title}</h5>
                      <small>{chap.subtitle}</small>
                    </div>
                    {isSelected && (
                      <div className="chapter-playing-indicator">
                        <span className="dot animate-pulse" style={{ backgroundColor: chap.color }}></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick 4K Logo Motion Callout */}
            <div className="logo-cinema-callout" onClick={onOpenLogoMotion}>
              <div className="callout-icon-film">
                <Film className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="callout-text">
                <strong>فيديو وأنيميشن الشعار الرسمي (4K)</strong>
                <p>شاهد رمزية القوقعة والترددات مع خيار تحميل الفيديو لجهازك بنقرة واحدة.</p>
              </div>
              <Sparkles className="w-4 h-4 text-cyan-400 mr-auto" />
            </div>

            {/* Quick Deaf Mode Access Banner */}
            <div className="deaf-banner-callout" onClick={onOpenDeafGuide}>
              <div className="callout-icon">🤟</div>
              <div className="callout-text">
                <strong>هل تفضل الشرح بلغة الإشارة؟</strong>
                <p>دليل مرئي بالكامل مع رسوم متحركة وقاموس الإشارات المعتمد بدون الحاجة لسماع أي صوت.</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-emerald-400 mr-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
