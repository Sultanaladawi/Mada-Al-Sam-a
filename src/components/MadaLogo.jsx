import React, { useId } from 'react';

/**
 * MadaLogo — الشعار الرسمي لمنظومة "مدى السمع" (Mada Al-Sam'a)
 * 
 * المكونات البصرية:
 * 1. إطار السكويركل (Squircle) الفضائي بلون العقيق الأسود (Obsidian Noir) مع حافة نيون متعددة الأطياف.
 * 2. قوس الأذن التشريحي الانسيابي مع حلقة القوقعة (Anatomical Ear Helix & Cochlea).
 * 3. طيف معالجة الصوت العصبي ثلاثي الترددات (Neural 3-Band Formant Spectrum).
 * 4. أمواج المدى الصوتي المتوسعة (Expanding Range Waves).
 * 5. النواة اللحظية المضيئة فائقة النقاء (Luminous Clarity Core).
 */
export default function MadaLogo({
  size = 40,
  showText = true,
  showBadge = true,
  badgeText = 'منظومة الوصول الشامل',
  className = '',
  iconOnly = false,
  onClick
}) {
  const rawId = useId();
  const id = rawId.replace(/[:]/g, '');

  const iconElement = (
    <div 
      className="mada-logo-icon-wrap" 
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="mada-logo-svg"
      >
        <defs>
          {/* خلفية العقيق الكوني */}
          <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="50%" stopColor="#080C1A" />
            <stop offset="100%" stopColor="#02040A" />
          </linearGradient>

          {/* حافة النيون الترددية */}
          <linearGradient id={`rim-${id}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#00D4AA" />
          </linearGradient>

          {/* تدرج قوس الأذن والأمواج */}
          <linearGradient id={`wave-${id}`} x1="20" y1="20" x2="85" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A5B4FC" />
            <stop offset="45%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#00D4AA" />
          </linearGradient>

          {/* الهالة المضيئة الداخلية */}
          <radialGradient id={`aura-${id}`} cx="45%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0, 212, 170, 0.35)" />
            <stop offset="60%" stopColor="rgba(99, 102, 241, 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* تأثير التوهج النيوني */}
          <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* إطار السكويركل المتقن */}
        <rect x="3" y="3" width="94" height="94" rx="25" fill={`url(#bg-${id})`} />
        <rect x="3" y="3" width="94" height="94" rx="25" fill={`url(#aura-${id})`} />
        <rect x="3" y="3" width="94" height="94" rx="25" stroke={`url(#rim-${id})`} strokeWidth="2.2" />
        <rect x="6.5" y="6.5" width="87" height="87" rx="22" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />

        {/* الرمز الأيقوني المكتمل */}
        <g filter={`url(#glow-${id})`}>
          {/* 1. قوس الأذن والقوقعة الانسيابي */}
          <path 
            d="M 33 22 C 20 22 14 33 14 48 C 14 63 22 75 35 77 C 40 78 43 74 43 70 C 43 66 39 63 35 63 C 28 63 23 57 23 48 C 23 39 27 31 34 31 C 37 31 39 33 40 36" 
            stroke={`url(#wave-${id})`} 
            strokeWidth="4.8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* 2. أطياف الترددات الصوتية المعالجة */}
          {/* التردد المنخفض (Bass) */}
          <rect x="44.5" y="42" width="4.5" height="16" rx="2.25" fill="#38BDF8" />
          {/* تردد وضوح مخارج الحروف الأساسي (Speech Formant) */}
          <rect x="52.5" y="27" width="5" height="46" rx="2.5" fill="#FFFFFF" />
          <rect x="52.5" y="45" width="5" height="28" rx="2.5" fill="#00D4AA" />
          {/* التردد العالي (Treble) */}
          <rect x="61" y="36" width="4.5" height="28" rx="2.25" fill="#2DD4BF" />

          {/* 3. أمواج المدى الصوتي الشامل */}
          <path d="M 70.5 35 C 75.5 42 75.5 58 70.5 65" stroke="#00D4AA" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M 79 26 C 87.5 38 87.5 62 79 74" stroke="#00D4AA" strokeWidth="3.8" strokeLinecap="round" strokeOpacity="0.8" />

          {/* نواة الوضوح المضيئة */}
          <circle cx="55" cy="27" r="2.2" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );

  if (iconOnly || !showText) {
    return (
      <div 
        className={`mada-logo-standalone ${className}`} 
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {iconElement}
      </div>
    );
  }

  return (
    <div 
      className={`mada-brand-cluster ${className}`} 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {iconElement}
      <div className="brand-text-cluster">
        <span className="brand-title">
          مَدَى <span className="brand-title-accent">السَّمْع</span>
        </span>
        {showBadge && (
          <span className="brand-badge-modern">
            <span className="brand-pulse-dot" />
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
