import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, 
  CheckCircle2, BookOpen, Activity, ShieldAlert, Monitor, 
  ChevronRight, ChevronLeft, ExternalLink, Layers, Eye 
} from 'lucide-react';
import MadaLogo from './MadaLogo';

const CHAPTERS = [
  {
    id: 1,
    title: 'نظرة عامة على المنظومة',
    subtitle: 'المفهوم الشامل وطبقة الوصول الصوتي الذكي في نظام التشغيل',
    duration: '01:30',
    tag: 'مقدمة المنصة',
    icon: Sparkles,
    color: '#00D4AA',
    badge: 'فصل 1',
    description: 'تعرّف في دقيقة ونصف كيف تعمل «مدى السمع» كطبقة نظام تشغيل وسيطة توفق بين التقنيات الرقمية والأذن البشرية لتمكين ذوي الإعاقة السمعية في الدراسة والعمل.',
    bulletPoints: [
      'طبقة وصول مركزية تعمل على مستوى نظام التشغيل (OS-Level).',
      'دعم كامل لجميع المواقع (جوجل، يوتيوب، إدراك، زووم، وتيمز).',
      'تصميم بمعايير النفاذ الرقمي العالمية WCAG 2.2 AAA.'
    ],
    demoScene: 'overview'
  },
  {
    id: 2,
    title: 'فحص السمع وتكييف كامل الجهاز',
    subtitle: 'الفحص السريري ومعايرة الترددات بالسماعة الطبية وبدونها',
    duration: '02:15',
    tag: 'طبي وسريري',
    icon: Activity,
    color: '#38BDF8',
    badge: 'فصل 2',
    description: 'شرح عملي لكيفية إجراء فحص السمع السريري من 250Hz إلى 8000Hz بالسماعات أو سبيكر الجهاز، وحساب الفائدة الوظيفية وتطبيق المرشحات الصوتية فوراً.',
    bulletPoints: [
      'فحص السمع في المجال الحر عبر سبيكر اللابتوب دون سماعات.',
      'حساب الفائدة الوظيفية (Functional Gain) بدقة متناهية (dB).',
      'تطبيق تكييف فوري لكافة البرامج عبر Web Audio DSP.'
    ],
    demoScene: 'testing'
  },
  {
    id: 3,
    title: 'رادار الأمان والتفريغ الفوري',
    subtitle: 'الاستشعار المتعدد الحواس وتفريغ المحاضرات المتزامن',
    duration: '02:00',
    tag: 'سلامة وتعليم',
    icon: ShieldAlert,
    color: '#F43F5E',
    badge: 'فصل 3',
    description: 'اكتشف كيف يحمي رادار الأمان الصم في منازلهم والشارع عبر تحويل صفارات الإنذار إلى وميض شاشة واهتزاز لمسي، مع تفريغ فوري دقيق بنسبة 98%.',
    bulletPoints: [
      'رادار أمان صوتي يتعرف على إنذارات الحريق، الإسعاف، وطرق الباب.',
      'تفريغ فوري ذكي مع طبقة عائمة مستمرة فوق كل النوافذ.',
      'تلوين الكلمات وتظليل مخارج الحروف لتسهيل القراءة السريعة.'
    ],
    demoScene: 'safety'
  }
];

export default function VideoShowcase({ onOpenDeafGuide, onViewChange }) {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(25);
  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef(null);

  const activeChapter = CHAPTERS[activeChapterIndex];

  // Dynamic visual soundwave canvas simulator
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

      // Draw simulated spectrum bars
      const numBars = 32;
      const barWidth = (w / numBars) - 3;
      
      for (let i = 0; i < numBars; i++) {
        const heightMultiplier = isPlaying 
          ? (Math.sin(phase + i * 0.3) * 0.5 + 0.5) * (Math.cos(phase * 0.7 + i * 0.2) * 0.4 + 0.6)
          : (Math.sin(i * 0.4) * 0.2 + 0.3);

        const barHeight = Math.max(8, heightMultiplier * (h * 0.7));
        const x = i * (barWidth + 3);
        const y = (h - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (activeChapter.id === 1) {
          grad.addColorStop(0, '#818CF8');
          grad.addColorStop(1, '#00D4AA');
        } else if (activeChapter.id === 2) {
          grad.addColorStop(0, '#38BDF8');
          grad.addColorStop(1, '#2DD4BF');
        } else {
          grad.addColorStop(0, '#FB7185');
          grad.addColorStop(1, '#F59E0B');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barWidth, barHeight, 3);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      phase += isPlaying ? 0.08 : 0.02;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, activeChapter.id]);

  // Simulate video playback progress
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleChapterSelect = (index) => {
    setActiveChapterIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <section id="video-tour" className="video-showcase-section">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="section-pill-tag">
            <Sparkles className="w-4 h-4 ml-1.5 text-cyan-400" />
            <span>شروحات مرئية وعروض حية تفاعلية</span>
          </div>
          <h2 className="section-title-luxury">
            شاهد منظومة <span className="highlight-text">«مدى السمع»</span> أثناء العمل
          </h2>
          <p className="section-subtitle-luxury">
            جولة مرئية تفاعلية مقسمة إلى ثلاثة فصول تشرح كيفية الاستفادة الكاملة من المنصة في الفحص السريري، وتكييف صوت النظام، ورادار الأمان الصوتي.
          </p>
        </div>

        {/* Master Showcase Layout */}
        <div className="showcase-player-grid">
          {/* Main Video & Interactive Canvas Stage */}
          <div className="player-stage-card">
            <div className="player-stage-viewport">
              {/* Dynamic Sound Canvas Background */}
              <canvas ref={canvasRef} width={640} height={260} className="player-wave-canvas" />

              {/* Watermark / Brand Header */}
              <div className="player-top-overlay">
                <div className="player-chapter-badge" style={{ borderColor: activeChapter.color }}>
                  <span className="dot" style={{ backgroundColor: activeChapter.color }}></span>
                  <span>{activeChapter.badge}: {activeChapter.tag}</span>
                </div>
                <div className="player-timing-badge">
                  {isPlaying ? 'عرض حي نشط ⚡' : 'جاهز للتشغيل'} | {activeChapter.duration}
                </div>
              </div>

              {/* Center Play / Pause Trigger */}
              <div className="player-center-action">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`btn-master-play ${isPlaying ? 'playing' : ''}`}
                  style={{ boxShadow: `0 0 35px ${activeChapter.color}55` }}
                  aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل العرض'}
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white fill-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white fill-white mr-1" />
                  )}
                </button>
              </div>

              {/* Live Captioning Simulation Strip */}
              <div className="player-subtitles-strip">
                <span className="captions-indicator">تفريغ متزامن:</span>
                <p>
                  {activeChapter.id === 1 && '“...تقوم منصة مدى السمع بالتقاط صوت كامل الجهاز وتكييفه بما يلائم منحنى السمع الطبيعي...”'}
                  {activeChapter.id === 2 && '“...تحديد العتبات السمعية بدقة عبر فحص المجال الحر وحساب الفائدة الوظيفية للسماعات...”'}
                  {activeChapter.id === 3 && '“...تحويل صفارات الإنذار وطرقات الباب إلى وميض بصري واهتزاز فوري لسلامة تامة...”'}
                </p>
              </div>

              {/* Bottom Video Controls Bar */}
              <div className="player-controls-bottom">
                <div className="progress-bar-track" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  setProgress(Math.round((clickX / rect.width) * 100));
                }}>
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${progress}%`, backgroundColor: activeChapter.color }}
                  ></div>
                </div>

                <div className="controls-row">
                  <div className="controls-left">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="btn-ctrl">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setProgress(0)} className="btn-ctrl" title="إعادة من البداية">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} className="btn-ctrl">
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="time-code">{Math.floor((progress / 100) * 90)}s / {activeChapter.duration}</span>
                  </div>

                  <div className="controls-right">
                    <button onClick={onOpenDeafGuide} className="btn-deaf-helper" title="فتح الشرح بلغة الإشارة">
                      <span>🤟 شرح لغة الإشارة</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Meta Info */}
            <div className="player-meta-box">
              <div className="meta-title-cluster">
                <h3>{activeChapter.title}</h3>
                <p>{activeChapter.subtitle}</p>
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
            </div>
          </div>

          {/* Chapters Sidebar Playlist */}
          <div className="chapters-playlist-col">
            <div className="playlist-header">
              <h4>فصول الشرح والعروض</h4>
              <span className="playlist-count">3 فصول متكاملة</span>
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
                    style={isSelected ? { borderColor: chap.color } : {}}
                  >
                    <div className="chapter-item-icon" style={{ backgroundColor: `${chap.color}22`, color: chap.color }}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="chapter-item-info">
                      <div className="chapter-tag-row">
                        <span className="chap-badge">{chap.badge}</span>
                        <span className="chap-duration">{chap.duration}</span>
                      </div>
                      <h5>{chap.title}</h5>
                      <small>{chap.subtitle}</small>
                    </div>
                    {isSelected && (
                      <div className="chapter-playing-indicator">
                        <span className="dot" style={{ backgroundColor: chap.color }}></span>
                      </div>
                    )}
                  </div>
                );
              })}
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

            {/* Direct Dashboard Launch Button */}
            <button onClick={() => onViewChange('dashboard')} className="btn-showcase-try">
              <span>جرّب المنظومة عملياً الآن</span>
              <ChevronLeft className="w-4 h-4 mr-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
