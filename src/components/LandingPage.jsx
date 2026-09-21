import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Volume2, Sparkles, ShieldAlert, Award, FileText, 
  CheckCircle2, ArrowLeft, ArrowUpRight, Headphones, Heart, 
  Users, GraduationCap, Briefcase, Zap, Play, Pause, RefreshCw, 
  BarChart2, ShieldCheck, ChevronRight, Sliders, Eye
} from 'lucide-react';

export default function LandingPage({ onViewChange }) {
  const [currentCaption, setCurrentCaption] = useState(0);
  const [eqHeights, setEqHeights] = useState([12, 24, 8, 16, 20, 14, 28, 10, 18]);
  const [simMode, setSimMode] = useState('mada'); // 'normal', 'loss', 'mada'
  const waveCanvasRef = useRef(null);

  const captionLines = [
    '"أهلاً بكم في محاضرة اليوم..."',
    '"سنتحدث عن الذكاء الاصطناعي"',
    '"وتطبيقاته في التعليم"'
  ];

  // Cycles captions
  useEffect(() => {
    const captionInterval = setInterval(() => {
      setCurrentCaption(prev => (prev + 1) % captionLines.length);
    }, 2500);
    return () => clearInterval(captionInterval);
  }, []);

  // Animates EQ Bars
  useEffect(() => {
    const eqInterval = setInterval(() => {
      setEqHeights(
        Array.from({ length: 9 }, () => Math.floor(Math.random() * 28) + 4)
      );
    }, 150);
    return () => clearInterval(eqInterval);
  }, []);

  // Animates waves
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animFrame;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawWaves = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const waves = [
        { amp: 60, freq: 0.008, speed: 0.02, color: 'rgba(108,99,255,0.15)', y: canvas.height * 0.5 },
        { amp: 40, freq: 0.012, speed: 0.03, color: 'rgba(0,212,170,0.1)', y: canvas.height * 0.55 },
        { amp: 80, freq: 0.005, speed: 0.015, color: 'rgba(108,99,255,0.08)', y: canvas.height * 0.45 },
      ];
      waves.forEach(w => {
        ctx.beginPath();
        ctx.moveTo(0, w.y);
        for (let x = 0; x <= canvas.width; x += 4) {
          const y = w.y + Math.sin(x * w.freq + time * w.speed * 60) * w.amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fillStyle = w.color;
        ctx.fill();
      });
      time += 1;
      animFrame = requestAnimationFrame(drawWaves);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawWaves();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="hero" id="hero">
        <div className="hero-bg">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
          <canvas id="waveCanvas" ref={waveCanvasRef}></canvas>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            مشروع مقدّم لجائزة مدى للابتكار 2026
          </div>
          <h1 className="hero-title">
            <span className="gradient-text">مدى السمع</span>
            <br/>
            صوتك يصلك.. كما تحتاجه
          </h1>
          <p className="hero-subtitle">
            نظام بيئي ذكي يعمل كطبقة وصول في نظام التشغيل لتطويع كافة الأصوات والمحتوى<br/>
            لذوي الإعاقة السمعية — في كل التطبيقات، على كل الأجهزة
          </p>
          <div className="hero-actions">
            <button onClick={() => onViewChange('dashboard')} className="btn-primary" id="hero-cta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              جرّب لوحة التحكم
            </button>
            <a href="#how" className="btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg>
              كيف يعمل؟
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-num">+466M</span>
              <span className="stat-label">شخص يعاني من فقدان السمع عالمياً</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">3</span>
              <span className="stat-label">منصات مدعومة (Android, Windows, Web)</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">∞</span>
              <span className="stat-label">تطبيقات مدعومة بدون إضافات</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="phone-caption-bar">
                <div className="caption-live-dot"></div>
                <span>ترجمة فورية</span>
              </div>
              <div className="phone-caption-text">
                {captionLines.map((line, idx) => (
                  <p key={idx} className={`caption-line ${currentCaption === idx ? 'active' : ''}`}>
                    {line}
                  </p>
                ))}
              </div>
              <div className="phone-eq">
                <div className="eq-bars">
                  {eqHeights.map((h, idx) => (
                    <div key={idx} className="eq-bar" style={{ height: `${h}px`, '--h': `${h}px`, background: 'var(--gradient)' }}></div>
                  ))}
                </div>
              </div>
              <div className="phone-emotion-tag">😊 نبرة إيجابية</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PROBLEM SECTION ========== */}
      <section className="problem-section" id="problem">
        <div className="container">
          <div className="problem-grid">
            <div className="problem-card problem-before">
              <div className="card-tag tag-red">قبل مدى السمع</div>
              <ul className="problem-list">
                <li>🔇 لا تسمع المحاضرة على Teams بوضوح</li>
                <li>😕 كل تطبيق يحتاج أداة مختلفة</li>
                <li>📵 WhatsApp بدون ترجمة فورية</li>
                <li>😰 الضجيج يُغرق صوت المتحدث</li>
                <li>📚 لا توجد محاضرات محفوظة للمراجعة</li>
              </ul>
            </div>
            <div className="problem-arrow">
              <svg viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="28" fill="url(#arrowGrad)" fillOpacity="0.15" stroke="url(#arrowGrad)" strokeWidth="1.5"/>
                <path d="M20 30 H40 M32 22 L40 30 L32 38" stroke="url(#arrowGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="arrowGrad" x1="0" y1="0" x2="60" y2="60">
                    <stop stopColor="#6C63FF"/><stop offset="1" stopColor="#00D4AA"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="problem-card problem-after">
              <div className="card-tag tag-green">مع مدى السمع</div>
              <ul className="problem-list">
                <li>🎯 صوت مُعدَّل حسب منحنى سمعك الشخصي</li>
                <li>✨ نظام واحد يعمل على كل التطبيقات</li>
                <li>💬 ترجمة عائمة فورية فوق أي تطبيق</li>
                <li>🔇 فصل الضجيج وتعزيز صوت المتحدث</li>
                <li>📖 محاضرات مُلخَّصة وأسئلة مراجعة تلقائية</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">المميزات الأساسية</span>
            <h2 className="section-title">تقنية تتكيّف معك<br/><span className="gradient-text">لا العكس</span></h2>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" fill="url(#f1)" fillOpacity="0.15"/>
                  <path d="M16 24 Q20 14 24 24 Q28 34 32 24" stroke="url(#f1)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <defs><linearGradient id="f1"><stop stopColor="#6C63FF"/><stop offset="1" stopColor="#00D4AA"/></linearGradient></defs>
                </svg>
              </div>
              <h3>الملف السمعي الذكي</h3>
              <p>اختبار سمع تفاعلي داخلي يبني ملفك السمعي الشخصي ويحدّثه تلقائياً مع الوقت</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" fill="url(#f2)" fillOpacity="0.15"/>
                  <rect x="12" y="18" width="24" height="12" rx="6" stroke="url(#f2)" strokeWidth="2"/>
                  <circle cx="24" cy="24" r="3" fill="url(#f2)"/>
                  <defs><linearGradient id="f2"><stop stopColor="#6C63FF"/><stop offset="1" stopColor="#00D4AA"/></linearGradient></defs>
                </svg>
              </div>
              <h3>ترجمة عائمة فورية</h3>
              <p>نصوص ترجمة عربية تظهر كطبقة شفافة فوق أي تطبيق — Teams، WhatsApp، YouTube</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" fill="url(#f3)" fillOpacity="0.15"/>
                  <path d="M14 30 L18 22 L22 28 L26 18 L30 26 L34 22" stroke="url(#f3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <defs><linearGradient id="f3"><stop stopColor="#6C63FF"/><stop offset="1" stopColor="#00D4AA"/></linearGradient></defs>
                </svg>
              </div>
              <h3>فصل الأصوات بالذكاء الاصطناعي</h3>
              <p>خوارزميات متقدمة تُعزّز صوت المتحدث وتُقلّل الضجيج الخلفي فوراً</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" fill="url(#f4)" fillOpacity="0.15"/>
                  <path d="M20 14 L28 14 L28 24 L32 24 L24 34 L16 24 L20 24 Z" stroke="url(#f4)" strokeWidth="2" fill="none" strokeLinejoin="round"/>
                  <defs><linearGradient id="f4"><stop stopColor="#6C63FF"/><stop offset="1" stopColor="#00D4AA"/></linearGradient></defs>
                </svg>
              </div>
              <h3>الذاكرة الدراسية الذكية</h3>
              <p>كل محاضرة تُحفظ مُلخَّصة مع أسئلة مراجعة تلقائية وخريطة ذهنية</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" fill="url(#f5)" fillOpacity="0.15"/>
                  <path d="M24 16 Q30 16 30 22 Q30 28 24 30" stroke="url(#f5)" strokeWidth="2" fill="none"/>
                  <defs><linearGradient id="f5"><stop stopColor="#6C63FF"/><stop offset="1" stopColor="#00D4AA"/></linearGradient></defs>
                </svg>
              </div>
              <h3>مؤشر النبرة العاطفية</h3>
              <p>يُظهر للمستخدم هل المتحدث يسأل، يصرخ، أم يضحك — بمؤشر بصري فوري</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" fill="url(#f6)" fillOpacity="0.15"/>
                  <path d="M16 20 Q16 14 24 14 Q32 14 32 20" stroke="url(#f6)" strokeWidth="2" fill="none"/>
                  <defs><linearGradient id="f6"><stop stopColor="#6C63FF"/><stop offset="1" stopColor="#00D4AA"/></linearGradient></defs>
                </svg>
              </div>
              <h3>الاهتزاز الإيقاعي</h3>
              <p>تحويل الموسيقى والأصوات لأنماط اهتزاز منتظمة — مفيد لذوي الإعاقة الكلية</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="how-section" id="how">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">كيف يعمل؟</span>
            <h2 className="section-title">ثلاث خطوات فقط<br/><span className="gradient-text">وأنت جاهز</span></h2>
            <p className="section-desc">خطوات مبسطة تنقلك من المعاناة اليومية إلى وضوح صوتي تام وتواصل سلس بدون عوائق</p>
          </div>

          <div className="steps-container">
            <div className="step-item">
              <div className="step-num">01</div>
              <div className="step-content">
                <h3>اختبر سمعك</h3>
                <p>اجري اختبار السمع التفاعلي السريري داخل المنصة — يستغرق دقيقتين فقط ويبني ملفك السمعي الشخصي بدقة طبية</p>
                <button onClick={() => onViewChange('dashboard', 'hearing-test')} className="btn-step-action">
                  بدء فحص السمع الآن <ArrowLeft className="w-3.5 h-3.5 mr-1 inline" />
                </button>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step-item">
              <div className="step-num">02</div>
              <div className="step-content">
                <h3>فعّل الطبقة الذكية</h3>
                <p>بضغطة واحدة، يصبح مدى السمع المعين السمعي الحي لجهازك — يعوض الترددات الناقصة ويعزل الضوضاء فوراً</p>
                <button onClick={() => onViewChange('dashboard', 'live-aid')} className="btn-step-action">
                  تشغيل المعين الحي <ArrowLeft className="w-3.5 h-3.5 mr-1 inline" />
                </button>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step-item">
              <div className="step-num">03</div>
              <div className="step-content">
                <h3>استمتع بكل شيء</h3>
                <p>تصفح، ادرس، وتحدث — نصوص ترجمة فورية عائمة ورادار أمان حسي يحميك وينبهك للأصوات الطارئة خلف الكواليس</p>
                <button onClick={() => onViewChange('dashboard', 'captions')} className="btn-step-action">
                  استعراض المنظومة <ArrowLeft className="w-3.5 h-3.5 mr-1 inline" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live Hearing & Frequency Simulator */}
          <div className="interactive-hearing-simulator">
            <div className="sim-widget-header">
              <div className="sim-widget-title">
                <Sliders className="w-5 h-5 text-indigo-400 ml-2 inline" />
                <strong>محاكي السمع ومعالجة الترددات الحية (Interactive DSP Simulator)</strong>
              </div>
              <span className="sim-badge">تجربة تفاعلية مباشرة</span>
            </div>

            <p className="sim-lead-text">
              جرّب بنفسك الفرق بين السمع الطبيعي، وفقدان السمع الحسي العصبي، وكيف تعيد خوارزميات "مدى السمع" وضوح الكلام فورياً:
            </p>

            <div className="sim-mode-toggles">
              <button
                onClick={() => setSimMode('normal')}
                className={`sim-toggle-pill ${simMode === 'normal' ? 'active' : ''}`}
              >
                👂 1. سمع طبيعي (Normal)
              </button>
              <button
                onClick={() => setSimMode('loss')}
                className={`sim-toggle-pill ${simMode === 'loss' ? 'active alert-loss' : ''}`}
              >
                ⚠️ 2. ضعف الترددات العالية (High-Freq Loss)
              </button>
              <button
                onClick={() => setSimMode('mada')}
                className={`sim-toggle-pill ${simMode === 'mada' ? 'active success-mada' : ''}`}
              >
                ✨ 3. معالجة مدى السمع الذكية (Mada DSP Boost)
              </button>
            </div>

            <div className="sim-comparison-display">
              <div className="sim-speech-box">
                <span className="speech-box-label">الجملة المنطوقة كما يستقبلها الدماغ:</span>
                <p className={`simulated-speech-text mode-${simMode}`}>
                  {simMode === 'normal' && '« أهلاً وسهلاً بكم في جلسة اليوم، نناقش موضوعاً هاماً للجميع. »'}
                  {simMode === 'loss' && '« أهـ... وسـ...ـكم في جـ...ـة اليوم، ...اقش مـ...ـوعاً ...اماً. »'}
                  {simMode === 'mada' && '« أهلاً وسهلاً بكم في جلسة اليوم، نناقش موضوعاً هاماً للجميع. »'}
                </p>
                <div className="sim-speech-note">
                  {simMode === 'normal' && '✅ توازن كامل بين الترددات المنخفضة والعالية ووضوح تام لجميع الحروف.'}
                  {simMode === 'loss' && '❌ ضياع أحرف الصفير والاحتكاك (س، ش، ت، ف) بسبب انحدار الترددات فوق 2000Hz، مما يجعل الكلام مبهماً.'}
                  {simMode === 'mada' && '⚡ قامت خوارزمية مدى السمع برفع الترددات العالية (+18dB) وعزل ضجيج الخلفية، فعادت مخارج الحروف فائقة النقاء.'}
                </div>
              </div>

              <div className="sim-eq-visualizer">
                <span className="eq-box-label">منحنى الترددات المعالج (DSP Response):</span>
                <div className="sim-eq-bars-row">
                  {[
                    { freq: '250Hz', val: simMode === 'loss' ? 85 : (simMode === 'mada' ? 65 : 70) },
                    { freq: '500Hz', val: simMode === 'loss' ? 75 : (simMode === 'mada' ? 70 : 70) },
                    { freq: '1kHz', val: simMode === 'loss' ? 55 : (simMode === 'mada' ? 75 : 70) },
                    { freq: '2kHz', val: simMode === 'loss' ? 25 : (simMode === 'mada' ? 90 : 70) },
                    { freq: '4kHz', val: simMode === 'loss' ? 10 : (simMode === 'mada' ? 95 : 70) },
                    { freq: '8kHz', val: simMode === 'loss' ? 5 : (simMode === 'mada' ? 85 : 70) }
                  ].map((bar, idx) => (
                    <div key={idx} className="sim-bar-item">
                      <div className="sim-bar-track">
                        <div
                          className={`sim-bar-fill mode-${simMode}`}
                          style={{ height: `${bar.val}%` }}
                        ></div>
                      </div>
                      <span className="sim-freq-tag">{bar.freq}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CLINICAL AUDIOMETRY SECTION ========== */}
      <section className="clinical-section" id="clinical">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">المعايير الطبية والسريرية</span>
            <h2 className="section-title">فحص نغمات نقي متوافق مع<br/><span className="gradient-text">بروتوكولات WHO و ANSI S3.6</span></h2>
            <p className="section-desc">
              لا نعتمد على التخمين، بل نوفر فحص سمع سريري حقيقي يقيس عتبات السمع (Hearing Thresholds) عبر 6 ترددات جوهرية ويصدر تقريراً طبياً معتمداً.
            </p>
          </div>

          <div className="clinical-grid">
            <div className="clinical-feature-card">
              <div className="clinical-icon-wrap">
                <Activity className="w-8 h-8 text-indigo-400" />
              </div>
              <h3>نغمات نقية (Pure Tone Audiometry)</h3>
              <p>قياس دقيق لحساسية الأذنين بترددات تبدأ من 250Hz وحتى 8000Hz لمعرفة الترددات المتضررة بدقة متناهية.</p>
              <div className="clinical-standards-tag">ANSI S3.6 Calibrated</div>
            </div>

            <div className="clinical-feature-card">
              <div className="clinical-icon-wrap">
                <BarChart2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3>مخطط سمعي طبي تفاعلي</h3>
              <p>تمثيل بصري معتمد دولياً: الأذن اليمنى باللون الأحمر ودوائر (○) والأذن اليسرى باللون الأزرق وعلامات (×).</p>
              <div className="clinical-standards-tag">WHO Hearing Loss Scales</div>
            </div>

            <div className="clinical-feature-card">
              <div className="clinical-icon-wrap">
                <FileText className="w-8 h-8 text-pink-400" />
              </div>
              <h3>تصدير تقرير طبي رسمي (PDF)</h3>
              <p>تحميل تقرير تشخيصي متكامل بضغطة زر يحتوي على المخطط البياني والتوصيات لمشاركته مع الطبيب المختص.</p>
              <div className="clinical-standards-tag">One-Click PDF Export</div>
            </div>
          </div>

          <div className="clinical-cta-banner">
            <div className="cta-banner-text">
              <h3>هل ترغب في فحص سمعك الآن وبناء ملفك الطبي المخصص؟</h3>
              <p>الفحص مجاني بالكامل، يستغرق دقيقتين فقط باستخدام أي سماعة رأس عادية.</p>
            </div>
            <button onClick={() => onViewChange('dashboard', 'hearing-test')} className="btn-glow-primary">
              <Headphones className="w-5 h-5 ml-2" />
              بدء فحص السمع السريري الآن
            </button>
          </div>
        </div>
      </section>

      {/* ========== HUMAN IMPACT SECTION ========== */}
      <section className="impact-section" id="impact">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">الأثر الإنساني والمجتمعي</span>
            <h2 className="section-title">تمكين حقيقي لأكثر من<br/><span className="gradient-text">466 مليون إنسان حول العالم</span></h2>
            <p className="section-desc">
              مشروع مقدّم لجائزة مدى للابتكار 2026 لتحقيق الشمول الرقمي وتكافؤ الفرص في التعليم والعمل والحياة اليومية.
            </p>
          </div>

          <div className="impact-pillars-grid">
            <div className="impact-pillar-card">
              <div className="pillar-header">
                <GraduationCap className="w-6 h-6 text-indigo-400 ml-2" />
                <h4>التعليم وتكافؤ الفرص</h4>
              </div>
              <p>
                تمكين الطالب الأصم وضعيف السمع من متابعة شرح المحاضر في الجامعة والمدرسة دون فوات أي كلمة عبر التفريغ النصي والتلخيص الذكي التلقائي.
              </p>
            </div>

            <div className="impact-pillar-card">
              <div className="pillar-header">
                <Briefcase className="w-6 h-6 text-emerald-400 ml-2" />
                <h4>الدمج الوظيفي والمهني</h4>
              </div>
              <p>
                المشاركة الفعالة في اجتماعات العمل عبر Teams و Zoom ومكالمات الهاتف اليومية دون حرج أو حاجة مستمرة لمترجم إشارة بشري.
              </p>
            </div>

            <div className="impact-pillar-card">
              <div className="pillar-header">
                <ShieldAlert className="w-6 h-6 text-pink-400 ml-2" />
                <h4>السلامة والأمان الحسي</h4>
              </div>
              <p>
                حماية الأرواح من خلال رادار صوتي حسي يرصد أصوات الإنذارات وأجراس الأبواب وأبواق السيارات ويحولها لاهتزازات ووميض بصري منقذ للحياة.
              </p>
            </div>

            <div className="impact-pillar-card">
              <div className="pillar-header">
                <ShieldCheck className="w-6 h-6 text-amber-400 ml-2" />
                <h4>الخصوصية والكرامة الرقمية</h4>
              </div>
              <p>
                معالجة الإشارات الصوتية تتم محلياً 100% على جهاز المستخدم (On-Device DSP) لضمان الخصوصية التامة وسرية المكالمات والمحادثات.
              </p>
            </div>
          </div>

          {/* Impact Numbers */}
          <div className="impact-stats-bar">
            <div className="impact-stat-col">
              <strong>+466M</strong>
              <span>مستفيد محتمل من ذوي الإعاقة السمعية</span>
            </div>
            <div className="stat-separator"></div>
            <div className="impact-stat-col">
              <strong>0 ms</strong>
              <span>تأخير معالجة الصوت المباشر عبر الويب</span>
            </div>
            <div className="stat-separator"></div>
            <div className="impact-stat-col">
              <strong>100%</strong>
              <span>خصوصية ومعالجة محلية على جهاز المستخدم</span>
            </div>
            <div className="stat-separator"></div>
            <div className="impact-stat-col">
              <strong>WCAG 2.2 AAA</strong>
              <span>أعلى معايير الوصول الرقمي الشامل</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PLATFORMS ========== */}
      <section className="platforms-section" id="platforms">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">المنصات المدعومة</span>
            <h2 className="section-title">معك في كل مكان<br/><span className="gradient-text">على كل جهاز</span></h2>
          </div>
          <div className="platforms-grid">
            <div className="platform-card">
              <div className="platform-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <path d="M12 18 Q12 10 24 10 Q36 10 36 18 L36 34 Q36 38 24 38 Q12 38 12 34 Z" fill="url(#android)"/>
                  <defs><linearGradient id="android"><stop stopColor="#6C63FF"/><stop offset="1" stopColor="#00D4AA"/></linearGradient></defs>
                </svg>
              </div>
              <h3>Android</h3>
              <p>تطبيق Google Play مع خدمة الوصول المدمجة</p>
              <ul className="platform-features">
                <li>ترجمة عائمة فوق كل التطبيقات</li>
                <li>التقاط الصوت الداخلي للجهاز</li>
                <li>اهتزاز إيقاعي ذكي</li>
              </ul>
              <span className="platform-status status-progress">قيد التطوير</span>
            </div>
            <div className="platform-card platform-featured">
              <div className="platform-badge-top">⭐ ابدأ هنا</div>
              <div className="platform-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="url(#web)" strokeWidth="2"/>
                  <path d="M24 4 Q30 14 30 24" stroke="url(#web)" strokeWidth="2" fill="none"/>
                  <defs><linearGradient id="web"><stop stopColor="#6C63FF"/><stop offset="1" stopColor="#00D4AA"/></linearGradient></defs>
                </svg>
              </div>
              <h3>Cloud Dashboard</h3>
              <p>لوحة التحكم الموحدة — من أي جهاز وأي متصفح</p>
              <ul className="platform-features">
                <li>الملف السمعي الشخصي</li>
                <li>سجل المحاضرات والملخصات</li>
                <li>إحصائيات الاستخدام</li>
              </ul>
              <button onClick={() => onViewChange('dashboard')} className="platform-btn">جرّب الآن</button>
            </div>
            <div className="platform-card">
              <div className="platform-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <rect x="6" y="6" width="16" height="16" rx="2" fill="url(#win)"/>
                  <defs><linearGradient id="win"><stop stopColor="#6C63FF"/><stop offset="1" stopColor="#00D4AA"/></linearGradient></defs>
                </svg>
              </div>
              <h3>Windows</h3>
              <p>برنامج طبقة الصوت الافتراضية عبر WASAPI</p>
              <ul className="platform-features">
                <li>معالجة كل أصوات النظام</li>
                <li>Plugin رسمي لـ Teams/Zoom</li>
                <li>اختصارات لوحة المفاتيح</li>
              </ul>
              <span className="platform-status status-planned">قريباً</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>جاهز لتجربة المستقبل؟</h2>
            <p>استكشف لوحة التحكم وشاهد كيف سيبدو يومك مع مدى السمع</p>
            <button onClick={() => onViewChange('dashboard')} className="btn-primary btn-large">
              ابدأ التجربة الآن
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
