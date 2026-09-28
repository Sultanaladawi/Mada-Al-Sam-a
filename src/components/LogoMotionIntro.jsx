import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Download, 
  Maximize2, X, Sparkles, Film, CheckCircle2, ShieldCheck, Heart 
} from 'lucide-react';

/**
 * LogoMotionIntro — المعرض السينمائي الرسمي ومولد فيديو أنيميشن شعار "مدى السمع"
 * 
 * الميزات:
 * 1. أنيميشن سينمائي كودي فائق الدقة (60 FPS بدقة 1920x1080 Canvas).
 * 2. تصميم صوتي مخصص (Futuristic Acoustic Chime) بواسطة Web Audio API بترددات 432Hz و 528Hz.
 * 3. إمكانية تسجيل وتحميل الفيديو بصيغة WebM / Video بجودة عالية بنقرة واحدة (MediaRecorder).
 * 4. واجهة سينمائية فاخرة مع وضع الشاشة الكاملة (Fullscreen) والتحكم بالصوت والإعادة.
 * 5. خلو تام من أي ذكر لمسابقات، مع تثبيت الهوية الرسمية:
 *    تطوير وابتكار: سلطان العدوي — مهندس برمجيات.
 */
export default function LogoMotionIntro({ isOpen, isSplashMode = false, onClose }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const audioCtxRef = useRef(null);
  const isPlayingRef = useRef(true);
  const isMutedRef = useRef(false);

  const TOTAL_DURATION = 4200; // 4.2 seconds

  const handleCloseWithFade = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 450);
  }, [onClose]);

  // Synchronize refs
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Audio synthesizer for the logo chime
  const playLogoAudio = useCallback(() => {
    if (isMutedRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.01, now);
      masterGain.gain.exponentialRampToValueAtTime(0.35, now + 0.15);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);
      masterGain.connect(ctx.destination);

      // 1. Sub-bass swell (Foundation)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(55, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + 1.2);
      subGain.gain.setValueAtTime(0.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(now);
      subOsc.stop(now + 2.1);

      // 2. Harmonics (432Hz & 528Hz Solfeggio & Clarity Chimes)
      const freqs = [216, 432, 528, 648, 864, 1296];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const startTime = now + idx * 0.12;
        g.gain.setValueAtTime(0.001, startTime);
        g.gain.exponentialRampToValueAtTime(0.2 / (idx + 1), startTime + 0.2);
        g.gain.exponentialRampToValueAtTime(0.0001, startTime + 3.0);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(startTime);
        osc.stop(startTime + 3.2);
      });

      // 3. Shimmer Sparkle (White noise high-pass sweep)
      const bufferSize = ctx.sampleRate * 1.5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(6000, now + 2.2);
      filter.Q.setValueAtTime(4.0, now + 2.2);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now + 2.2);
      noiseGain.gain.exponentialRampToValueAtTime(0.08, now + 2.4);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now + 2.2);
      noise.stop(now + 3.6);

    } catch (e) {
      console.warn('Audio synthesis warning:', e);
    }
  }, []);

  // Main canvas animation renderer
  const renderFrame = useCallback((ctx, p, width, height) => {
    // p is progress: 0.0 to 1.0
    ctx.clearRect(0, 0, width, height);

    // Deep Obsidian Cinema Background
    const bgGrad = ctx.createRadialGradient(
      width / 2, height / 2 - 40, 50,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    bgGrad.addColorStop(0, '#0d1326');
    bgGrad.addColorStop(0.4, '#070a14');
    bgGrad.addColorStop(1, '#020409');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Center origin for emblem
    const cx = width / 2;
    const cy = height / 2 - 70;
    const emblemScale = Math.min(width, height) * 0.32; // size around 300-400px

    // --- PHASE 1: Acoustic Resonance Ripple Waves (0.0 to 0.7) ---
    if (p > 0.05) {
      const rippleCount = 4;
      for (let i = 0; i < rippleCount; i++) {
        const offset = i * 0.15;
        const rProgress = Math.max(0, Math.min(1, (p - offset) / 0.6));
        if (rProgress > 0 && rProgress < 1) {
          const radius = emblemScale * (0.6 + rProgress * 1.8);
          const alpha = (1 - rProgress) * 0.45;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = i % 2 === 0 ? `rgba(56, 189, 248, ${alpha})` : `rgba(0, 212, 170, ${alpha})`;
          ctx.lineWidth = 2.5 * (1 - rProgress);
          ctx.stroke();
        }
      }
    }

    // --- PHASE 2: Background Squircle Shield (Emerges at p: 0.2 to 0.5) ---
    const shieldP = Math.max(0, Math.min(1, (p - 0.2) / 0.3));
    if (shieldP > 0) {
      ctx.save();
      ctx.translate(cx, cy);
      const s = emblemScale * 0.5 * (0.85 + shieldP * 0.15);
      const halfS = s;
      const cornerR = s * 0.32;

      // Outer glow
      ctx.shadowColor = 'rgba(0, 212, 170, 0.4)';
      ctx.shadowBlur = 30 * shieldP;

      // Dark obsidian squircle body
      const squircleGrad = ctx.createLinearGradient(-halfS, -halfS, halfS, halfS);
      squircleGrad.addColorStop(0, '#111827');
      squircleGrad.addColorStop(0.5, '#080C1A');
      squircleGrad.addColorStop(1, '#03050B');

      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-halfS, -halfS, halfS * 2, halfS * 2, cornerR);
      } else {
        ctx.rect(-halfS, -halfS, halfS * 2, halfS * 2);
      }
      ctx.fillStyle = squircleGrad;
      ctx.globalAlpha = shieldP;
      ctx.fill();

      // Spectral Chromatic Rim Border
      const rimGrad = ctx.createLinearGradient(-halfS, -halfS, halfS, halfS);
      rimGrad.addColorStop(0, '#818CF8');
      rimGrad.addColorStop(0.5, '#38BDF8');
      rimGrad.addColorStop(1, '#00D4AA');
      ctx.strokeStyle = rimGrad;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.restore();
    }

    // --- PHASE 3: Anatomical Ear Helix & Cochlea Path Tracing (p: 0.25 to 0.75) ---
    const earP = Math.max(0, Math.min(1, (p - 0.25) / 0.5));
    if (earP > 0) {
      ctx.save();
      ctx.translate(cx, cy);
      const baseScale = (emblemScale / 100);

      // SVG Coordinates mapped to center: [0, 100] -> [-50, 50]
      const toX = (val) => (val - 50) * baseScale;
      const toY = (val) => (val - 50) * baseScale;

      ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
      ctx.shadowBlur = 18;

      // Draw ear path with progressive length
      ctx.beginPath();
      ctx.moveTo(toX(33), toY(22));
      // First curve
      ctx.bezierCurveTo(toX(20), toY(22), toX(14), toY(33), toX(14), toY(48));
      // Second curve
      if (earP > 0.25) {
        ctx.bezierCurveTo(toX(14), toY(63), toX(22), toY(75), toX(35), toY(77));
      }
      // Cochlea inner spiral
      if (earP > 0.55) {
        ctx.bezierCurveTo(toX(40), toY(78), toX(43), toY(74), toX(43), toY(70));
        ctx.bezierCurveTo(toX(43), toY(66), toX(39), toY(63), toX(35), toY(63));
      }
      if (earP > 0.8) {
        ctx.bezierCurveTo(toX(28), toY(63), toX(23), toY(57), toX(23), toY(48));
        ctx.bezierCurveTo(toX(23), toY(39), toX(27), toY(31), toX(34), toY(31));
      }

      const earGrad = ctx.createLinearGradient(toX(20), toY(20), toX(80), toY(80));
      earGrad.addColorStop(0, '#A5B4FC');
      earGrad.addColorStop(0.5, '#38BDF8');
      earGrad.addColorStop(1, '#00D4AA');

      ctx.strokeStyle = earGrad;
      ctx.lineWidth = 5 * baseScale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = Math.min(1, earP * 1.5);
      ctx.stroke();

      ctx.restore();
    }

    // --- PHASE 4: 3-Band Frequency Equalizer Spectrum (p: 0.45 to 0.85) ---
    const eqP = Math.max(0, Math.min(1, (p - 0.45) / 0.4));
    if (eqP > 0) {
      ctx.save();
      ctx.translate(cx, cy);
      const baseScale = (emblemScale / 100);
      const toX = (val) => (val - 50) * baseScale;
      const toY = (val) => (val - 50) * baseScale;

      // Bar 1: Bass (Cyan/Blue)
      const b1H = 16 * baseScale * Math.min(1, eqP * 1.3);
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(toX(44.5), toY(58) - b1H, 4.5 * baseScale, b1H, 2.25 * baseScale);
      } else {
        ctx.rect(toX(44.5), toY(58) - b1H, 4.5 * baseScale, b1H);
      }
      ctx.fill();

      // Bar 2: Speech Core (White & Mint Emerald)
      const b2H = 46 * baseScale * Math.min(1, eqP * 1.2);
      const b2Grad = ctx.createLinearGradient(0, toY(73) - b2H, 0, toY(73));
      b2Grad.addColorStop(0, '#FFFFFF');
      b2Grad.addColorStop(0.5, '#2DD4BF');
      b2Grad.addColorStop(1, '#00D4AA');

      ctx.shadowColor = '#00D4AA';
      ctx.shadowBlur = 15;
      ctx.fillStyle = b2Grad;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(toX(52.5), toY(73) - b2H, 5 * baseScale, b2H, 2.5 * baseScale);
      } else {
        ctx.rect(toX(52.5), toY(73) - b2H, 5 * baseScale, b2H);
      }
      ctx.fill();

      // Bar 3: Treble (Teal)
      const b3H = 28 * baseScale * Math.min(1, eqP * 1.1);
      ctx.fillStyle = '#2DD4BF';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(toX(61), toY(64) - b3H, 4.5 * baseScale, b3H, 2.25 * baseScale);
      } else {
        ctx.rect(toX(61), toY(64) - b3H, 4.5 * baseScale, b3H);
      }
      ctx.fill();

      // Expanding Range Soundwaves (Right Side)
      if (eqP > 0.4) {
        const waveP = (eqP - 0.4) / 0.6;
        ctx.strokeStyle = `rgba(0, 212, 170, ${waveP})`;
        ctx.lineWidth = 4 * baseScale;
        ctx.lineCap = 'round';

        // Inner wave
        ctx.beginPath();
        ctx.moveTo(toX(70.5), toY(35));
        ctx.bezierCurveTo(toX(75.5), toY(42), toX(75.5), toY(58), toX(70.5), toY(65));
        ctx.stroke();

        // Outer wave
        if (waveP > 0.5) {
          ctx.beginPath();
          ctx.moveTo(toX(79), toY(26));
          ctx.bezierCurveTo(toX(87.5), toY(38), toX(87.5), toY(62), toX(79), toY(74));
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // --- PHASE 5: Diamond Spark Lens Flare (p: 0.65 to 0.95) ---
    const flareP = Math.max(0, Math.min(1, (p - 0.65) / 0.3));
    if (flareP > 0) {
      ctx.save();
      ctx.translate(cx, cy);
      const baseScale = (emblemScale / 100);
      const sparkX = (55 - 50) * baseScale;
      const sparkY = (27 - 50) * baseScale;

      // Anamorphic horizontal flare line
      const flareWidth = emblemScale * 0.9 * Math.sin(flareP * Math.PI);
      const flareGrad = ctx.createLinearGradient(sparkX - flareWidth / 2, sparkY, sparkX + flareWidth / 2, sparkY);
      flareGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      flareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
      flareGrad.addColorStop(1, 'rgba(0, 212, 170, 0)');

      ctx.strokeStyle = flareGrad;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(sparkX - flareWidth / 2, sparkY);
      ctx.lineTo(sparkX + flareWidth / 2, sparkY);
      ctx.stroke();

      // Glowing central starburst
      const starR = 7 * baseScale * (0.8 + 0.4 * Math.sin(flareP * Math.PI));
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, starR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // --- PHASE 6: Royal Typography & Subtitle (p: 0.7 to 1.0) ---
    const textP = Math.max(0, Math.min(1, (p - 0.7) / 0.3));
    if (textP > 0) {
      ctx.save();
      ctx.globalAlpha = textP;

      const textY = cy + emblemScale * 0.65 + 35;

      // 1. Primary Title: "مَدَى السَّمْع"
      const fontSize = Math.max(28, Math.min(54, width * 0.04));
      ctx.font = `900 ${fontSize}px "Cairo", "Tajawal", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Title Gradient with Shimmer Sheen
      const shimmerOffset = (p - 0.7) * 4; // travels across
      const titleGrad = ctx.createLinearGradient(
        cx - fontSize * 3 + shimmerOffset * 100, textY,
        cx + fontSize * 3 + shimmerOffset * 100, textY
      );
      titleGrad.addColorStop(0, '#FFFFFF');
      titleGrad.addColorStop(0.4, '#38BDF8');
      titleGrad.addColorStop(0.7, '#00D4AA');
      titleGrad.addColorStop(1, '#FFFFFF');

      ctx.shadowColor = 'rgba(0, 212, 170, 0.4)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = titleGrad;
      ctx.fillText('مَدَى السَّمْع', cx, textY);

      // 2. Subtitle: "طبقة الوصول الصوتي الذكي"
      const subFontSize = Math.max(15, Math.min(22, fontSize * 0.42));
      ctx.font = `600 ${subFontSize}px "Tajawal", sans-serif`;
      ctx.fillStyle = '#94A3B8';
      ctx.shadowBlur = 0;
      ctx.fillText('طبقة الوصول الصوتي الذكي ونظام التأهيل السمعي المتكامل', cx, textY + fontSize * 0.85);

      // 3. Creator Badge: "تطوير وابتكار: سلطان العدوي — مهندس برمجيات"
      const badgeFontSize = Math.max(13, Math.min(18, fontSize * 0.35));
      ctx.font = `700 ${badgeFontSize}px "Cairo", sans-serif`;
      ctx.fillStyle = '#00D4AA';
      ctx.fillText('تطوير وابتكار: سلطان العدوي — مهندس برمجيات', cx, textY + fontSize * 1.5);

      ctx.restore();
    }
  }, []);

  // Main animation loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // High resolution setup (1920x1080)
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    startTimeRef.current = performance.now();
    playLogoAudio();

    const loop = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const currentProgress = Math.min(1, elapsed / TOTAL_DURATION);

      setProgress(currentProgress);
      renderFrame(ctx, currentProgress, canvas.width, canvas.height);

      if (currentProgress < 1 && isPlayingRef.current) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else if (currentProgress >= 1) {
        setIsPlaying(false);
        if (isSplashMode) {
          // Linger 1.2s to admire the final glowing emblem, then smoothly dissolve into the website!
          setTimeout(() => {
            handleCloseWithFade();
          }, 1200);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isSplashMode, playLogoAudio, renderFrame, handleCloseWithFade]);

  // Handle user gesture for audio unlock and escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape' || (isSplashMode && (e.key === ' ' || e.key === 'Enter'))) {
        handleCloseWithFade();
      }
    };

    const handleGesture = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
        playLogoAudio();
      }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('click', handleGesture);
    window.addEventListener('touchstart', handleGesture);

    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, [isOpen, isSplashMode, handleCloseWithFade, playLogoAudio]);

  // Replay animation
  const handleReplay = () => {
    setIsPlaying(true);
    setProgress(0);
    startTimeRef.current = performance.now();
    playLogoAudio();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = (timestamp) => {
      const elapsed = timestamp - startTimeRef.current;
      const currentProgress = Math.min(1, elapsed / TOTAL_DURATION);
      setProgress(currentProgress);
      renderFrame(ctx, currentProgress, canvas.width, canvas.height);

      if (currentProgress < 1 && isPlayingRef.current) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else if (currentProgress >= 1) {
        setIsPlaying(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  // Export & Download Video (WebM / 60FPS)
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    setExportProgress(10);

    try {
      const stream = canvas.captureStream(60);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6000000 });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);

        // Auto trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `mada-al-sama-logo-intro.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setIsExporting(false);
        setExportProgress(100);
      };

      recorder.start();

      // Render all frames cleanly
      const ctx = canvas.getContext('2d');
      const totalFrames = 60 * (TOTAL_DURATION / 1000); // 252 frames
      let currentFrame = 0;

      const recordStep = () => {
        const p = currentFrame / totalFrames;
        renderFrame(ctx, p, canvas.width, canvas.height);
        setExportProgress(Math.round(p * 100));
        currentFrame++;

        if (currentFrame <= totalFrames) {
          requestAnimationFrame(recordStep);
        } else {
          recorder.stop();
        }
      };

      recordStep();

    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
      alert('حدث خطأ أثناء تصدير الفيديو، يرجى المحاولة مرة أخرى.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`logo-cinema-overlay ${isSplashMode ? 'splash-mode' : ''} ${isClosing ? 'splash-fade-out' : ''}`} role="dialog" aria-modal="true">
      <div className="logo-cinema-backdrop" onClick={handleCloseWithFade} />

      <div className="logo-cinema-container">
        {/* Cinema Header */}
        <div className="logo-cinema-header">
          <div className="cinema-brand-title">
            <Sparkles className="w-5 h-5 text-teal-400 ml-2" />
            <div>
              <h3>{isSplashMode ? 'منظومة «مَدَى السَّمْع»' : 'المسرح السينمائي لشعار «مدى السمع»'}</h3>
              <p>{isSplashMode ? 'طبقة الوصول الصوتي الذكي • تطوير وابتكار: سلطان العدوي' : 'الهوية البصرية والموشن جرافيك الرسمي بدقة 4K فائقة الوضوح'}</p>
            </div>
          </div>
          
          <div className="cinema-header-actions">
            {isSplashMode && (
              <button 
                onClick={handleCloseWithFade} 
                className="btn-cinema-skip"
                title="تخطي المقدمة والدخول المباشر للمنصة"
              >
                <span>تخطي للموقع ⏩</span>
              </button>
            )}
            <button 
              onClick={handleCloseWithFade} 
              className="btn-cinema-close"
              title={isSplashMode ? 'دخول الموقع' : 'إغلاق المسرح'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cinema Screen (Canvas 16:9 Viewport) */}
        <div className="logo-cinema-screen-wrap">
          <canvas 
            ref={canvasRef} 
            className="logo-cinema-canvas"
          />

          {/* Progress bar line */}
          <div className="cinema-progress-track">
            <div 
              className="cinema-progress-fill" 
              style={{ width: `${progress * 100}%` }} 
            />
          </div>
        </div>

        {/* Cinema Control Deck */}
        <div className="logo-cinema-controls">
          <div className="controls-left">
            <button 
              onClick={handleReplay} 
              className="btn-cinema-action btn-cinema-play"
              title="إعادة تشغيل الحركة"
            >
              <RotateCcw className="w-4 h-4 ml-1.5" />
              إعادة التشغيل
            </button>

            <button 
              onClick={() => setIsMuted(prev => !prev)} 
              className={`btn-cinema-action ${isMuted ? 'muted' : ''}`}
              title={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 ml-1.5" /> : <Volume2 className="w-4 h-4 ml-1.5" />}
              {isMuted ? 'الصوت مكتوم' : 'صوت الشعار (432Hz)'}
            </button>
          </div>

          <div className="controls-center hidden-mobile">
            <span className="cinema-badge-meta">
              <Film className="w-3.5 h-3.5 ml-1 text-teal-400" />
              60 FPS • 1080p Ultra-HD
            </span>
            <span className="cinema-badge-meta">
              <ShieldCheck className="w-3.5 h-3.5 ml-1 text-sky-400" />
              ابتكار: سلطان العدوي
            </span>
          </div>

          <div className="controls-right">
            <button 
              onClick={handleExportVideo} 
              disabled={isExporting}
              className="btn-cinema-action btn-cinema-download"
              title="تصدير وتحميل الفيديو مباشرة لجهازك"
            >
              <Download className="w-4 h-4 ml-1.5" />
              {isExporting ? `جاري التصدير (${exportProgress}%)` : 'تحميل الفيديو (WebM)'}
            </button>
          </div>
        </div>

        {/* Narrative & Symbolic Explanation */}
        <div className="logo-cinema-story-footer">
          <div className="story-chip">
            <strong className="text-sky-400">1. انحناء القوقعة:</strong> يعبّر عن التركيب العضوي للأذن الداخلية والتوافق الطبيعي.
          </div>
          <div className="story-chip">
            <strong className="text-emerald-400">2. أعمدة التردد الثلاثية:</strong> تمثل معالجة الأصوات الحيوية (البيز، مخارج الحروف، والتردد العالي).
          </div>
          <div className="story-chip">
            <strong className="text-white">3. نواة الوضوح الذهبية:</strong> ترمز إلى استعادة الإدراك واليقين الصوتي للمستخدم.
          </div>
        </div>
      </div>
    </div>
  );
}
