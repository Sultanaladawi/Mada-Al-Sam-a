import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CheckCircle2, RotateCcw, Download, Sparkles, Headphones, ShieldAlert, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';

const FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000];

export default function HearingTest({ onProfileGenerated, onApplyToAid }) {
  const [testState, setTestState] = useState('intro'); // 'intro', 'testing', 'completed'
  const [currentEar, setCurrentEar] = useState('right'); // 'right' then 'left'
  const [freqIndex, setFreqIndex] = useState(0);
  const [currentDb, setCurrentDb] = useState(30); // starts at 30 dB HL
  const [isPlaying, setIsPlaying] = useState(false);
  const [headphoneCheck, setHeadphoneCheck] = useState(true);

  // Results: Array of dB values corresponding to FREQUENCIES
  const [rightEarResults, setRightEarResults] = useState([25, 25, 30, 35, 30, 25]);
  const [leftEarResults, setLeftEarResults] = useState([30, 35, 40, 45, 40, 35]);
  const [profileSummary, setProfileSummary] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);
  const pannerRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize Web Audio
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Convert dB HL to Linear Gain
  const dbToGain = (db) => {
    // Map -10dB to 100dB HL into appropriate digital amplitude (0.001 to 0.5 safe max)
    const normalized = Math.max(-10, Math.min(100, db));
    return Math.pow(10, (normalized - 60) / 35) * 0.15;
  };

  // Play Pure Tone at current frequency and dB
  const playTone = (freq, db, ear) => {
    initAudio();
    stopTone();

    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    let panner = null;

    if (ctx.createStereoPanner) {
      panner = ctx.createStereoPanner();
      panner.pan.value = ear === 'right' ? 1.0 : -1.0;
    }

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Fade in softly to avoid clicking
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    const targetGain = dbToGain(db);
    gain.gain.exponentialRampToValueAtTime(Math.max(targetGain, 0.0001), ctx.currentTime + 0.08);

    if (panner) {
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);
    } else {
      osc.connect(gain);
      gain.connect(ctx.destination);
    }

    osc.start();
    oscRef.current = osc;
    gainRef.current = gain;
    pannerRef.current = panner;
    setIsPlaying(true);
  };

  const stopTone = () => {
    if (gainRef.current && audioCtxRef.current) {
      try {
        gainRef.current.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.05);
        setTimeout(() => {
          if (oscRef.current) {
            try { oscRef.current.stop(); oscRef.current.disconnect(); } catch (e) {}
            oscRef.current = null;
          }
        }, 60);
      } catch (e) {
        if (oscRef.current) {
          try { oscRef.current.stop(); } catch (err) {}
          oscRef.current = null;
        }
      }
    }
    setIsPlaying(false);
  };

  const startTest = () => {
    initAudio();
    setTestState('testing');
    setCurrentEar('right');
    setFreqIndex(0);
    setCurrentDb(30);
    playTone(FREQUENCIES[0], 30, 'right');
  };

  // User Response: Heard
  const handleHeard = () => {
    stopTone();
    // If heard, record this dB as threshold or test next frequency
    recordThreshold(currentDb);
  };

  // User Response: Didn't Hear -> Increase Volume
  const handleNotHeard = () => {
    stopTone();
    if (currentDb < 90) {
      const nextDb = currentDb + 10;
      setCurrentDb(nextDb);
      setTimeout(() => {
        playTone(FREQUENCIES[freqIndex], nextDb, currentEar);
      }, 200);
    } else {
      // Threshold reached max
      recordThreshold(95);
    }
  };

  const recordThreshold = (db) => {
    if (currentEar === 'right') {
      const updated = [...rightEarResults];
      updated[freqIndex] = db;
      setRightEarResults(updated);

      if (freqIndex < FREQUENCIES.length - 1) {
        const nextIdx = freqIndex + 1;
        setFreqIndex(nextIdx);
        setCurrentDb(30);
        setTimeout(() => playTone(FREQUENCIES[nextIdx], 30, 'right'), 300);
      } else {
        // Switch to Left Ear
        setCurrentEar('left');
        setFreqIndex(0);
        setCurrentDb(30);
        setTimeout(() => playTone(FREQUENCIES[0], 30, 'left'), 600);
      }
    } else {
      const updated = [...leftEarResults];
      updated[freqIndex] = db;
      setLeftEarResults(updated);

      if (freqIndex < FREQUENCIES.length - 1) {
        const nextIdx = freqIndex + 1;
        setFreqIndex(nextIdx);
        setCurrentDb(30);
        setTimeout(() => playTone(FREQUENCIES[nextIdx], 30, 'left'), 300);
      } else {
        // All Complete!
        finishTest(rightEarResults, updated);
      }
    }
  };

  const finishTest = (right, left) => {
    stopTone();
    setTestState('completed');

    // Calculate WHO hearing loss classification
    // Average loss across speech frequencies (500, 1000, 2000, 4000 Hz)
    const rightAvg = Math.round((right[1] + right[2] + right[3] + right[4]) / 4);
    const leftAvg = Math.round((left[1] + left[2] + left[3] + left[4]) / 4);
    const overallAvg = Math.round((rightAvg + leftAvg) / 2);

    let classification = 'طبيعي (Normal)';
    let classEn = 'normal';
    let severityColor = '#00D4AA';
    let advice = 'سمعك ضمن الحدود الطبيعية، استمر في حماية أذنيك من الأصوات الصاخبة.';

    if (overallAvg > 80) {
      classification = 'فقدان سمع عميق (Profound)';
      classEn = 'profound';
      severityColor = '#FF4D6D';
      advice = 'تحتاج إلى معينات سمعية عالية التعويض، وقد يفيدك تفعيل التفريغ البصري ورادار الأمان الصوتي.';
    } else if (overallAvg > 60) {
      classification = 'فقدان سمع شديد (Severe)';
      classEn = 'severe';
      severityColor = '#FF758F';
      advice = 'ينصح بتشغيل المعين السمعي الحي لتعزيز الترددات الصوتية وتفعيل التنبيهات البصرية.';
    } else if (overallAvg > 40) {
      classification = 'فقدان سمع متوسط (Moderate)';
      classEn = 'moderate';
      severityColor = '#FFAA00';
      advice = 'ينصح بتعويض الترددات العالية لعزل الكلام عن الضوضاء المحيطة وضمان وضوح مخارج الحروف.';
    } else if (overallAvg > 20) {
      classification = 'فقدان سمع خفيف (Mild)';
      classEn = 'mild';
      severityColor = '#6C63FF';
      advice = 'قد تواجه صعوبة خفيفة في الأماكن المزدحمة، موازن مدى السمع الذكي سيعزز أصوات الحديث بوضوح.';
    }

    const summary = {
      rightAvg,
      leftAvg,
      overallAvg,
      classification,
      classEn,
      severityColor,
      advice,
      date: new Date().toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' })
    };
    setProfileSummary(summary);

    // Save to localStorage
    const profileData = {
      frequencies: FREQUENCIES,
      rightEar: right,
      leftEar: left,
      summary
    };
    localStorage.setItem('mada_audiogram', JSON.stringify(profileData));

    // Notify parent
    if (onProfileGenerated) {
      onProfileGenerated(profileData);
    }

    // Save to server
    fetch('/api/audiograms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loss_left: leftAvg,
        loss_right: rightAvg,
        data: profileData
      })
    })
      .then(res => res.json())
      .then(() => setSavedSuccess(true))
      .catch(err => console.warn('Could not sync to cloud, stored locally:', err));

    // Trigger celebration
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  // Draw Audiogram Chart
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = 650;
    const height = canvas.height = 380;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    const padLeft = 60;
    const padRight = 30;
    const padTop = 40;
    const padBottom = 40;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    // Normal hearing green zone (0 to 20 dB)
    const normH = (25 / 110) * chartH;
    ctx.fillStyle = 'rgba(0, 212, 170, 0.08)';
    ctx.fillRect(padLeft, padTop, chartW, normH);

    // Grid lines - dB (0 to 100 dB HL)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px Tajawal, sans-serif';
    ctx.textAlign = 'right';

    for (let db = 0; db <= 100; db += 10) {
      const y = padTop + (db / 100) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(`${db} dB`, padLeft - 10, y + 4);
    }

    // Grid lines - Frequencies
    ctx.textAlign = 'center';
    FREQUENCIES.forEach((freq, idx) => {
      const x = padLeft + (idx / (FREQUENCIES.length - 1)) * chartW;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();
      ctx.fillText(`${freq}Hz`, x, height - padBottom + 20);
    });

    // Draw Right Ear (Red Line with 'O' circles - Clinical Standard)
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    FREQUENCIES.forEach((freq, idx) => {
      const x = padLeft + (idx / (FREQUENCIES.length - 1)) * chartW;
      const y = padTop + ((rightEarResults[idx] || 0) / 100) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    FREQUENCIES.forEach((freq, idx) => {
      const x = padLeft + (idx / (FREQUENCIES.length - 1)) * chartW;
      const y = padTop + ((rightEarResults[idx] || 0) / 100) * chartH;
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Draw Left Ear (Blue Line with 'X' marks - Clinical Standard)
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    FREQUENCIES.forEach((freq, idx) => {
      const x = padLeft + (idx / (FREQUENCIES.length - 1)) * chartW;
      const y = padTop + ((leftEarResults[idx] || 0) / 100) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    FREQUENCIES.forEach((freq, idx) => {
      const x = padLeft + (idx / (FREQUENCIES.length - 1)) * chartW;
      const y = padTop + ((leftEarResults[idx] || 0) / 100) * chartH;
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2.5;
      const s = 5;
      ctx.beginPath();
      ctx.moveTo(x - s, y - s);
      ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y - s);
      ctx.lineTo(x - s, y + s);
      ctx.stroke();
    });

  }, [rightEarResults, leftEarResults, testState]);

  // Export PDF Report
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);

    doc.setFontSize(22);
    doc.text('Mada Al-Sam-a Medical Audiogram Report', 105, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-GB')}`, 105, 34, { align: 'center' });
    doc.text('Submitted for Mada Innovation Award 2026', 105, 40, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.line(20, 45, 190, 45);

    // Summary Box
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.text('Clinical Assessment & Summary:', 20, 56);

    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    doc.text(`- Right Ear Hearing Loss: ${profileSummary?.rightAvg || 0} dB HL`, 25, 66);
    doc.text(`- Left Ear Hearing Loss: ${profileSummary?.leftAvg || 0} dB HL`, 25, 74);
    doc.text(`- Overall Classification: ${profileSummary?.classification || 'Normal'}`, 25, 82);

    if (canvasRef.current) {
      const imgData = canvasRef.current.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 25, 95, 160, 95);
    }

    doc.setFont('Helvetica', 'bold');
    doc.text('Personalized DSP Recommendations:', 20, 205);
    doc.setFont('Helvetica', 'normal');
    doc.text('1. Frequency selective amplification calibrated for high-frequency speech consonants.', 25, 215);
    doc.text('2. Environmental sound radar activated for safety alerts and door chime detection.', 25, 223);
    doc.text('3. Live Arabic speech-to-text overlay recommended during group meetings.', 25, 231);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Mada Al-Sam-a System - Assistive Audio Layer for the Hearing Impaired', 105, 280, { align: 'center' });

    doc.save(`Mada_Hearing_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="hearing-test-container">
      {/* Header */}
      <div className="test-header">
        <div className="test-badge">
          <Headphones className="w-4 h-4 text-emerald-400 inline ml-2" />
          فحص السمع السريري النقي التفاعلي (Pure Tone Audiometry)
        </div>
        <h2>اكتشف قدرات سمعك بدقة طبية خلال دقيقتين</h2>
        <p>نظام ذكي يعاير الترددات بدقة لبناء ملفك السمعي الشخصي وتطبيق المعين السمعي الحي المباشر فوراً.</p>
      </div>

      {testState === 'intro' && (
        <div className="test-intro-card">
          <div className="intro-steps-grid">
            <div className="step-box">
              <div className="step-num">1</div>
              <Headphones className="w-8 h-8 text-indigo-400 mb-3" />
              <h4>ضع سماعات الرأس</h4>
              <p>يُفضل استخدام سماعات الرأس أو الأذن للحصول على فحص دقيق لكل أذن على حدة.</p>
            </div>
            <div className="step-box">
              <div className="step-num">2</div>
              <Volume2 className="w-8 h-8 text-emerald-400 mb-3" />
              <h4>مكان هادئ</h4>
              <p>تأكد من تواجدك في غرفة هادئة بعيدة عن الضوضاء ومصادر التشتيت.</p>
            </div>
            <div className="step-box">
              <div className="step-num">3</div>
              <CheckCircle2 className="w-8 h-8 text-blue-400 mb-3" />
              <h4>اضغط عند السماع</h4>
              <p>سنصدر نغمات نقية بترددات مختلفة، اضغط فور سماعك للصوت حتى لو كان خافتاً جداً.</p>
            </div>
          </div>

          <div className="test-start-cta">
            <button onClick={startTest} className="btn-glow-primary">
              <Sparkles className="w-5 h-5 ml-2" />
              ابدأ الفحص السمعي الآن
            </button>
          </div>
        </div>
      )}

      {testState === 'testing' && (
        <div className="testing-active-card">
          <div className="testing-progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(((currentEar === 'right' ? 0 : 6) + freqIndex + 1) / 12) * 100}%`
              }}
            ></div>
          </div>

          <div className="testing-status-badge">
            <span className={`ear-tag ${currentEar}`}>
              {currentEar === 'right' ? '🔴 الأذن اليمنى (Right Ear)' : '🔵 الأذن اليسرى (Left Ear)'}
            </span>
            <span className="freq-tag">تردد: {FREQUENCIES[freqIndex]} هرتز</span>
            <span className="db-tag">الشدة: {currentDb} dB HL</span>
          </div>

          <div className="tone-pulse-indicator">
            <div className={`pulse-circle ${isPlaying ? 'pulsing' : ''}`}>
              <Volume2 className="w-12 h-12 text-white" />
            </div>
            <p className="pulse-instruction">
              استمع جيداً عبر {currentEar === 'right' ? 'السماعة اليمنى' : 'السماعة اليسرى'}...
            </p>
          </div>

          <div className="testing-controls">
            <button onClick={handleHeard} className="btn-heard">
              <CheckCircle2 className="w-6 h-6 ml-2" />
              نعم، أسمع الصوت بوضوح
            </button>
            <button onClick={handleNotHeard} className="btn-not-heard">
              <VolumeX className="w-6 h-6 ml-2" />
              لا أسمع شيئاً (ارفع الشدة)
            </button>
          </div>
        </div>
      )}

      {testState === 'completed' && profileSummary && (
        <div className="test-results-card">
          <div className="results-top-bar">
            <div className="classification-pill" style={{ borderColor: profileSummary.severityColor }}>
              <span className="dot" style={{ background: profileSummary.severityColor }}></span>
              النتيجة: <strong>{profileSummary.classification}</strong>
            </div>
            <div className="actions-cluster">
              <button onClick={exportPDF} className="btn-glass-secondary">
                <Download className="w-4 h-4 ml-2" />
                تحميل التقرير الطبي PDF
              </button>
              <button onClick={startTest} className="btn-glass-secondary">
                <RotateCcw className="w-4 h-4 ml-2" />
                إعادة الفحص
              </button>
            </div>
          </div>

          <div className="chart-and-insights-grid">
            <div className="chart-wrapper">
              <canvas ref={canvasRef} className="audiogram-canvas" />
              <div className="chart-legend">
                <span className="legend-item"><span className="symbol-red">○</span> الأذن اليمنى (Right)</span>
                <span className="legend-item"><span className="symbol-blue">✕</span> الأذن اليسرى (Left)</span>
                <span className="legend-item"><span className="symbol-green">■</span> النطاق السمعي الصحي</span>
              </div>
            </div>

            <div className="insights-card">
              <h3>التشخيص والتوصيات الشخصية</h3>
              <p className="insight-advice">{profileSummary.advice}</p>

              <div className="ear-stat-bars">
                <div className="ear-stat">
                  <span>الأذن اليمنى (متوسط الفقد):</span>
                  <strong>{profileSummary.rightAvg} dB</strong>
                </div>
                <div className="ear-stat">
                  <span>الأذن اليسرى (متوسط الفقد):</span>
                  <strong>{profileSummary.leftAvg} dB</strong>
                </div>
              </div>

              <div className="apply-aid-box">
                <h4>🦻 تفعيل المعين السمعي الذكي</h4>
                <p>تم استخراج قيم الترددات بدقة. اضغط لتطبيق المعايرة فوراً على موازن الصوت الحي.</p>
                <button
                  onClick={() => {
                    if (onApplyToAid) onApplyToAid(profileSummary);
                  }}
                  className="btn-glow-primary w-full"
                >
                  تطبيق التعويض على المعين السمعي الحي
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
