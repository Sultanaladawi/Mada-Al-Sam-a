import React, { useState, useEffect, useRef } from 'react';

export default function LandingPage({ onViewChange }) {
  const [currentCaption, setCurrentCaption] = useState(0);
  const [eqHeights, setEqHeights] = useState([12, 24, 8, 16, 20, 14, 28, 10, 18]);
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
      {/* ========== NAVBAR ========== */}
      <nav className="navbar scrolled">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => onViewChange('landing')}>
            <div className="logo-icon">
              <svg viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="url(#lg1)" strokeWidth="2"/>
                <path d="M12 20 Q16 10 20 20 Q24 30 28 20" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <circle cx="20" cy="20" r="3" fill="url(#lg1)"/>
                <defs>
                  <linearGradient id="lg1" x1="0" y1="0" x2="40" y2="40">
                    <stop stopColor="#6C63FF"/>
                    <stop offset="1" stopColor="#00D4AA"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-text">مدى السمع</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">المميزات</a>
            <a href="#how" className="nav-link">كيف يعمل</a>
            <a href="#platforms" className="nav-link">المنصات</a>
            <button onClick={() => onViewChange('dashboard')} className="nav-btn">لوحة التحكم</button>
          </div>
        </div>
      </nav>

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
          </div>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-num">01</div>
              <div className="step-content">
                <h3>اختبر سمعك</h3>
                <p>اجري اختبار السمع التفاعلي البسيط داخل التطبيق — يستغرق 3 دقائق فقط ويبني ملفك السمعي الشخصي</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step-item">
              <div className="step-num">02</div>
              <div className="step-content">
                <h3>فعّل الطبقة الذكية</h3>
                <p>بضغطة واحدة، يصبح مدى السمع الطبقة الصوتية الرئيسية على جهازك — كل الأصوات تمر عبره تلقائياً</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step-item">
              <div className="step-num">03</div>
              <div className="step-content">
                <h3>استمتع بكل شيء</h3>
                <p>تصفح، ادرس، اجتمع، وتواصل — النظام يعمل خلف الكواليس ويطوّع كل صوت حسب احتياجك</p>
              </div>
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

      {/* ========== FOOTER ========== */}
      <footer className="footer">
        <div className="container">
          <p className="footer-tagline">مشروع مقدّم لجائزة مدى للابتكار 2026 — قطر</p>
          <p className="footer-copy">صُنع بـ ❤️ من شخص يفهم الحاجة حقاً</p>
        </div>
      </footer>
    </>
  );
}
