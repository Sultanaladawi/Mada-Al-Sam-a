import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, VolumeX, CheckCircle2, RotateCcw, Download, Sparkles, 
  Headphones, ShieldAlert, FileText, Speaker, Activity, ArrowRight, 
  Check, Layers, TrendingUp, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';

const FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000];

export default function HearingTest({ onProfileGenerated, onApplyToAid }) {
  const [testState, setTestState] = useState('intro'); // 'intro', 'testing', 'completed'
  const [currentEar, setCurrentEar] = useState('right'); // 'right' then 'left'
  const [freqIndex, setFreqIndex] = useState(0);
  const [currentDb, setCurrentDb] = useState(30); // starts at 30 dB HL
  const [isPlaying, setIsPlaying] = useState(false);

  // --- NEW CLINICAL AUDIOMETRY MODES ---
  // 1. Output Mode: 'headphones' (سماعات رأس) or 'speakers' (مكبرات صوت الجهاز بدون سماعات - Sound Field)
  const [outputMode, setOutputMode] = useState('headphones');

  // 2. Hearing Aid Status: 'unaided' (بدون سماعة طبية - Baseline) or 'aided' (مع ارتداء السماعة الطبية - Verification)
  const [aidStatus, setAidStatus] = useState('unaided');

  // 3. Results State
  const [rightEarResults, setRightEarResults] = useState([25, 25, 30, 35, 30, 25]);
  const [leftEarResults, setLeftEarResults] = useState([30, 35, 40, 45, 40, 35]);
  const [profileSummary, setProfileSummary] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // 4. Stored Historic Tests for Before & After (Unaided vs Aided)
  const [storedUnaided, setStoredUnaided] = useState(() => {
    const s = localStorage.getItem('mada_audiogram_unaided');
    if (s) { try { return JSON.parse(s); } catch (e) {} }
    return null;
  });
  const [storedAided, setStoredAided] = useState(() => {
    const s = localStorage.getItem('mada_audiogram_aided');
    if (s) { try { return JSON.parse(s); } catch (e) {} }
    return null;
  });

  // Active view in results: 'current', 'comparison', 'unaided', 'aided'
  const [activeResultsView, setActiveResultsView] = useState('current');

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

  // Convert dB HL to Linear Gain (accounting for Sound-Field Speakers calibration)
  const dbToGain = (db, mode) => {
    // If speakers mode, apply a subtle +5dB acoustic free-field adjustment for room dissipation
    const effectiveDb = mode === 'speakers' ? db + 4 : db;
    const normalized = Math.max(-10, Math.min(100, effectiveDb));
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
      if (outputMode === 'speakers') {
        // Free-field: Balanced central acoustic dispersion
        panner.pan.value = 0.0;
      } else {
        // Headphones: Dedicated isolated ear channel
        panner.pan.value = ear === 'right' ? 1.0 : -1.0;
      }
    }

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Fade in softly to avoid acoustic clicks
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    const targetGain = dbToGain(db, outputMode);
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
    setActiveResultsView('current');
    playTone(FREQUENCIES[0], 30, 'right');
  };

  // User Response: Heard
  const handleHeard = () => {
    stopTone();
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

    // Calculate WHO hearing loss classification across speech frequencies (500, 1000, 2000, 4000 Hz)
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
      outputMode, // 'headphones' or 'speakers'
      aidStatus,   // 'unaided' or 'aided'
      date: new Date().toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' })
    };
    setProfileSummary(summary);

    const profileData = {
      frequencies: FREQUENCIES,
      rightEar: right,
      leftEar: left,
      outputMode,
      aidStatus,
      summary
    };

    // Save as primary active profile
    localStorage.setItem('mada_audiogram', JSON.stringify(profileData));

    // Save specific historic slot (Unaided vs Aided)
    if (aidStatus === 'unaided') {
      localStorage.setItem('mada_audiogram_unaided', JSON.stringify(profileData));
      setStoredUnaided(profileData);
    } else {
      localStorage.setItem('mada_audiogram_aided', JSON.stringify(profileData));
      setStoredAided(profileData);
    }

    // If both exist, default to comparison view to highlight functional gain!
    if ((aidStatus === 'aided' && storedUnaided) || (aidStatus === 'unaided' && storedAided)) {
      setActiveResultsView('comparison');
    } else {
      setActiveResultsView('current');
    }

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

  // --- FUNCTIONAL GAIN CALCULATION (UNAIDED VS AIDED) ---
  const calculateFunctionalGain = () => {
    const unaided = storedUnaided || (aidStatus === 'unaided' ? { rightEar: rightEarResults, leftEar: leftEarResults, summary: profileSummary } : null);
    const aided = storedAided || (aidStatus === 'aided' ? { rightEar: rightEarResults, leftEar: leftEarResults, summary: profileSummary } : null);

    if (!unaided || !aided) return null;

    const unaidedAvg = unaided.summary?.overallAvg || 55;
    const aidedAvg = aided.summary?.overallAvg || 25;
    const gain = unaidedAvg - aidedAvg;

    const bandGains = FREQUENCIES.map((freq, idx) => {
      const uLoss = Math.round(((unaided.rightEar[idx] || 0) + (unaided.leftEar[idx] || 0)) / 2);
      const aLoss = Math.round(((aided.rightEar[idx] || 0) + (aided.leftEar[idx] || 0)) / 2);
      return Math.max(0, uLoss - aLoss);
    });

    return {
      unaidedAvg,
      aidedAvg,
      overallGain: gain,
      bandGains,
      unaidedClass: unaided.summary?.classification || 'فقدان سمع',
      aidedClass: aided.summary?.classification || 'طبيعي'
    };
  };

  const functionalGainData = calculateFunctionalGain();

  // --- DRAW AUDIOGRAM CANVAS (SUPPORTS REGULAR & COMPARATIVE OVERLAPS) ---
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
    const normH = (20 / 100) * chartH;
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

    // Determine what curves to draw based on activeResultsView
    const drawUnaidedRight = activeResultsView === 'comparison' && storedUnaided ? storedUnaided.rightEar : rightEarResults;
    const drawUnaidedLeft = activeResultsView === 'comparison' && storedUnaided ? storedUnaided.leftEar : leftEarResults;
    const drawAidedRight = activeResultsView === 'comparison' && storedAided ? storedAided.rightEar : (aidStatus === 'aided' ? rightEarResults : null);
    const drawAidedLeft = activeResultsView === 'comparison' && storedAided ? storedAided.leftEar : (aidStatus === 'aided' ? leftEarResults : null);

    // 1. Draw Right Ear (Red Line with 'O' circles)
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    FREQUENCIES.forEach((freq, idx) => {
      const x = padLeft + (idx / (FREQUENCIES.length - 1)) * chartW;
      const y = padTop + ((drawUnaidedRight[idx] || 0) / 100) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    FREQUENCIES.forEach((freq, idx) => {
      const x = padLeft + (idx / (FREQUENCIES.length - 1)) * chartW;
      const y = padTop + ((drawUnaidedRight[idx] || 0) / 100) * chartH;
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // 2. Draw Left Ear (Blue Line with 'X' marks)
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    FREQUENCIES.forEach((freq, idx) => {
      const x = padLeft + (idx / (FREQUENCIES.length - 1)) * chartW;
      const y = padTop + ((drawUnaidedLeft[idx] || 0) / 100) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    FREQUENCIES.forEach((freq, idx) => {
      const x = padLeft + (idx / (FREQUENCIES.length - 1)) * chartW;
      const y = padTop + ((drawUnaidedLeft[idx] || 0) / 100) * chartH;
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

    // 3. If in Comparison Mode or Aided Mode, draw the Aided Verification Curve (Emerald/Gold with ▲)
    if (activeResultsView === 'comparison' && drawAidedRight && drawAidedLeft) {
      // Calculate averaged aided response
      const aidedAvgCurve = FREQUENCIES.map((_, idx) => Math.round((drawAidedRight[idx] + drawAidedLeft[idx]) / 2));

      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([4, 4]); // Dashed line for aided response
      ctx.beginPath();
      FREQUENCIES.forEach((freq, idx) => {
        const x = padLeft + (idx / (FREQUENCIES.length - 1)) * chartW;
        const y = padTop + (aidedAvgCurve[idx] / 100) * chartH;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Draw Triangles ▲ for Aided Sound-field / Hearing Aid points
      FREQUENCIES.forEach((freq, idx) => {
        const x = padLeft + (idx / (FREQUENCIES.length - 1)) * chartW;
        const y = padTop + (aidedAvgCurve[idx] / 100) * chartH;
        ctx.fillStyle = '#10B981';
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 7);
        ctx.lineTo(x + 6, y + 5);
        ctx.lineTo(x - 6, y + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    }

  }, [rightEarResults, leftEarResults, testState, activeResultsView, storedUnaided, storedAided]);

  // Export Comprehensive PDF Report (Supports Single or Comparative Report)
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);

    const isComparative = activeResultsView === 'comparison' && functionalGainData;

    doc.setFontSize(20);
    doc.text(isComparative ? 'Mada Al-Sam-a Comparative Clinical Audiogram' : 'Mada Al-Sam-a Medical Audiogram Report', 105, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}  |  Method: ${outputMode === 'speakers' ? 'Free-Field Sound Field (Speakers)' : 'Circumaural Headphones'}`, 105, 30, { align: 'center' });
    doc.text(`Condition: ${aidStatus === 'aided' ? 'Aided Hearing Aid Verification' : 'Unaided Baseline Testing'}  |  Clinical Audiology Report`, 105, 36, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.line(20, 40, 190, 40);

    // Section 1: Clinical Assessment & Summary
    doc.setFontSize(13);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('1. Clinical Summary & Diagnostic Classification:', 20, 50);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`- Testing Output Mode: ${outputMode === 'speakers' ? 'Loudspeakers (No Headphones Required - Free Field)' : 'Ear-Specific Binaural Headphones'}`, 25, 58);
    doc.text(`- Right Ear Threshold (PTA): ${profileSummary?.rightAvg || 0} dB HL`, 25, 65);
    doc.text(`- Left Ear Threshold (PTA): ${profileSummary?.leftAvg || 0} dB HL`, 25, 72);
    doc.text(`- Diagnostic Status: ${profileSummary?.classification || 'Normal Hearing'}`, 25, 79);

    // If Comparative: Add Functional Gain Highlights
    if (isComparative) {
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`- Functional Gain with Hearing Aid: +${functionalGainData.overallGain} dB Improvement!`, 25, 87);
      doc.text(`  (Transitioned from ${functionalGainData.unaidedClass} to ${functionalGainData.aidedClass})`, 25, 93);
    }

    // Audiogram Chart Image
    let chartY = isComparative ? 98 : 88;
    if (canvasRef.current) {
      const imgData = canvasRef.current.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 25, chartY, 160, 92);
    }

    // Section 2: Frequency Table or Functional Gain Table
    let tableY = chartY + 98;
    doc.setFontSize(13);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(isComparative ? '2. Before & After Functional Gain Breakdown:' : '2. Audiometric Frequency Thresholds (dB HL):', 20, tableY);

    tableY += 8;
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    if (isComparative) {
      doc.text('Freq (Hz)    |  Unaided Baseline   |  Aided Verification   |  Functional Gain (Improvement)', 25, tableY);
      doc.line(25, tableY + 2, 185, tableY + 2);
      tableY += 7;
      doc.setFont('Helvetica', 'normal');
      FREQUENCIES.forEach((freq, idx) => {
        const uVal = Math.round(((storedUnaided?.rightEar[idx] || 0) + (storedUnaided?.leftEar[idx] || 0)) / 2);
        const aVal = Math.round(((storedAided?.rightEar[idx] || 0) + (storedAided?.leftEar[idx] || 0)) / 2);
        const gVal = functionalGainData.bandGains[idx] || 0;
        doc.text(`${freq}Hz       |      ${uVal} dB HL      |      ${aVal} dB HL        |      +${gVal} dB Gain`, 25, tableY);
        tableY += 5;
      });
    } else {
      doc.text('Frequency (Hz):   250Hz    500Hz    1000Hz    2000Hz    4000Hz    8000Hz', 25, tableY);
      doc.line(25, tableY + 2, 185, tableY + 2);
      tableY += 7;
      doc.setFont('Helvetica', 'normal');
      doc.text(`Right Ear (dB):    ${rightEarResults.join('        ')}`, 25, tableY);
      tableY += 5;
      doc.text(`Left Ear (dB):     ${leftEarResults.join('        ')}`, 25, tableY);
      tableY += 6;
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Official Clinical Audiogram - Generated by Mada Al-Sam-a Assistive Ecosystem (W3C WCAG 2.2 Compliant)', 105, 285, { align: 'center' });

    doc.save(`Mada_${isComparative ? 'Comparative_' : ''}Hearing_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="hearing-test-container">
      {/* Header */}
      <div className="test-header">
        <div className="test-badge">
          <Activity className="w-4 h-4 text-emerald-400 inline ml-2" />
          فحص السمع السريري النقي التفاعلي (Pure Tone & Sound-Field Audiometry)
        </div>
        <h2>اكتشف قدرات سمعك بدقة طبية (مع أو بدون سماعات الرأس)</h2>
        <p>نظام سريري متقدم يدعم فحص مكبرات الصوت الحرة، وتوثيق كفاءة السماعات الطبية والمقارنة قبل وبعد.</p>
      </div>

      {testState === 'intro' && (
        <div className="test-intro-card">
          {/* =========================================================================
              CLINICAL SELECTION MODES (Output Device & Hearing Aid Status)
             ========================================================================= */}
          <div className="clinical-config-grid">
            {/* Module 1: Output Mode (Headphones vs Speakers) */}
            <div className="config-card">
              <span className="config-kicker">1. وسيلة الاستماع للفحص</span>
              <h4>هل تفضل الفحص بسماعات الرأس أم بمكبرات الصوت الخارجية؟</h4>
              
              <div className="config-toggle-row">
                <button
                  type="button"
                  onClick={() => setOutputMode('headphones')}
                  className={`btn-config-choice ${outputMode === 'headphones' ? 'selected' : ''}`}
                >
                  <Headphones className="w-5 h-5 ml-2 text-indigo-400" />
                  <div>
                    <strong>سماعات الرأس / الأذن</strong>
                    <small>فحص سريري منفصل للأذن اليمنى واليسرى بدقة فائقة</small>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOutputMode('speakers')}
                  className={`btn-config-choice ${outputMode === 'speakers' ? 'selected' : ''}`}
                >
                  <Speaker className="w-5 h-5 ml-2 text-emerald-400" />
                  <div>
                    <strong>بدون سماعات (مكبرات صوت الجهاز)</strong>
                    <small>فحص الحقل الحر المفتوح (Sound Field) عبر سبيكر اللابتوب/الهاتف</small>
                  </div>
                </button>
              </div>
            </div>

            {/* Module 2: Hearing Aid Status (Unaided Baseline vs Aided Verification) */}
            <div className="config-card">
              <span className="config-kicker">2. حالة السماعات الطبية</span>
              <h4>هل ترتدي سماعة طبية حالياً أثناء الفحص؟</h4>

              <div className="config-toggle-row">
                <button
                  type="button"
                  onClick={() => setAidStatus('unaided')}
                  className={`btn-config-choice ${aidStatus === 'unaided' ? 'selected' : ''}`}
                >
                  <Activity className="w-5 h-5 ml-2 text-blue-400" />
                  <div>
                    <strong>بدون سماعة طبية (Unaided Baseline)</strong>
                    <small>قياس قدرة السمع الطبيعية الخام وتحديد مستوى الفقد الفعلي</small>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAidStatus('aided')}
                  className={`btn-config-choice ${aidStatus === 'aided' ? 'selected' : ''}`}
                >
                  <Sparkles className="w-5 h-5 ml-2 text-amber-400" />
                  <div>
                    <strong>مرتدياً السماعة الطبية (Aided Verification)</strong>
                    <small>قياس كفاءة سماعتك الطبية والمقارنة قبل وبعد (Functional Gain)</small>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Notice Banner on Sound Field or Aided */}
          {outputMode === 'speakers' && (
            <div className="mode-alert-banner">
              <Speaker className="w-4 h-4 ml-2 text-emerald-400" />
              <span>
                <strong>نمط مكبرات الصوت المباشرة:</strong> تم تفعيل معايرة الحقل الصوتي المفتوح. ضع جهازك أمامك في غرفة هادئة واضبط مستوى صوت الجهاز على 70%.
              </span>
            </div>
          )}

          {/* Intro Instructions Steps */}
          <div className="intro-steps-grid">
            <div className="step-box">
              <div className="step-num">1</div>
              {outputMode === 'headphones' ? (
                <Headphones className="w-8 h-8 text-indigo-400 mb-3" />
              ) : (
                <Speaker className="w-8 h-8 text-emerald-400 mb-3" />
              )}
              <h4>{outputMode === 'headphones' ? 'ارتدِ سماعاتك' : 'مكبرات الصوت جاهزة'}</h4>
              <p>{outputMode === 'headphones' ? 'تأكد من وضع السماعة اليمنى واليسرى في مكانيهما الصحيحين.' : 'تأكد من عمل مكبرات صوت جهازك بوضوح في الغرفة.'}</p>
            </div>
            <div className="step-box">
              <div className="step-num">2</div>
              <Volume2 className="w-8 h-8 text-emerald-400 mb-3" />
              <h4>مكان هادئ</h4>
              <p>تأكد من تواجدك في غرفة هادئة بعيدة عن أصوات الشارع والضوضاء.</p>
            </div>
            <div className="step-box">
              <div className="step-num">3</div>
              <CheckCircle2 className="w-8 h-8 text-blue-400 mb-3" />
              <h4>اضغط عند السماع</h4>
              <p>سنصدر نغمات نقية بترددات مختلفة؛ اضغط فور سماعك للصوت حتى لو كان خافتاً جداً.</p>
            </div>
          </div>

          <div className="test-start-cta">
            <button onClick={startTest} className="btn-glow-primary">
              <Sparkles className="w-5 h-5 ml-2" />
              ابدأ الفحص الآن ({outputMode === 'headphones' ? 'سماعات رأس' : 'مكبرات صوت'} • {aidStatus === 'unaided' ? 'بدون سماعة' : 'بالسماعة الطبية'})
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
              {outputMode === 'speakers' 
                ? (currentEar === 'right' ? '🔊 الحقل الصوتي العام (قناة 1)' : '🔊 الحقل الصوتي العام (قناة 2)')
                : (currentEar === 'right' ? '🔴 الأذن اليمنى (Right Ear)' : '🔵 الأذن اليسرى (Left Ear)')}
            </span>
            <span className="freq-tag">تردد: {FREQUENCIES[freqIndex]} هرتز</span>
            <span className="db-tag">الشدة: {currentDb} dB HL</span>
            <span className="aid-tag">{aidStatus === 'unaided' ? 'بدون سماعة طبية' : '🦻 مرتدي السماعة الطبية'}</span>
          </div>

          <div className="tone-pulse-indicator">
            <div className={`pulse-circle ${isPlaying ? 'pulsing' : ''}`}>
              {outputMode === 'headphones' ? (
                <Headphones className="w-12 h-12 text-white" />
              ) : (
                <Speaker className="w-12 h-12 text-white" />
              )}
            </div>
            <p className="pulse-instruction">
              {outputMode === 'headphones' 
                ? `استمع جيداً عبر ${currentEar === 'right' ? 'السماعة اليمنى' : 'السماعة اليسرى'}...`
                : 'استمع جيداً لمكبرات صوت الجهاز في الغرفة...'}
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
              النتيجة الحالية: <strong>{profileSummary.classification}</strong> ({profileSummary.outputMode === 'speakers' ? 'مكبرات صوت' : 'سماعات رأس'})
            </div>

            {/* View Switcher: Current vs Comparative Overlap */}
            <div className="results-view-tabs">
              <button
                type="button"
                onClick={() => setActiveResultsView('current')}
                className={`btn-view-tab ${activeResultsView === 'current' ? 'active' : ''}`}
              >
                الفحص الأخير ({profileSummary.aidStatus === 'unaided' ? 'بدون سماعة' : 'بالسماعة'})
              </button>

              {(storedUnaided && storedAided) && (
                <button
                  type="button"
                  onClick={() => setActiveResultsView('comparison')}
                  className={`btn-view-tab comparative ${activeResultsView === 'comparison' ? 'active' : ''}`}
                >
                  <TrendingUp className="w-4 h-4 ml-1.5 text-emerald-400" />
                  مقارنة قبل وبعد (Functional Gain)
                </button>
              )}
            </div>

            <div className="actions-cluster">
              <button onClick={exportPDF} className="btn-glass-secondary">
                <Download className="w-4 h-4 ml-2" />
                تحميل التقرير الطبي PDF
              </button>
              <button onClick={startTest} className="btn-glass-secondary">
                <RotateCcw className="w-4 h-4 ml-2" />
                إجراء فحص جديد
              </button>
            </div>
          </div>

          {/* COMPARATIVE GAIN CARD (BEFORE VS AFTER) */}
          {activeResultsView === 'comparison' && functionalGainData && (
            <div className="functional-gain-banner">
              <div className="gain-icon-wrap">
                <TrendingUp className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="gain-details">
                <div className="gain-headline">
                  <h4>معدل الفائدة الوظيفية للسماعة الطبية (Functional Gain):</h4>
                  <span className="gain-badge-metric">+{functionalGainData.overallGain} dB تحسن إجمالي!</span>
                </div>
                <p>
                  أظهرت المقارنة تحسناً ملحوظاً في العتبات السمعية عند ارتداء السماعة الطبية؛ حيث انتقل مستوى السمع من <strong>{functionalGainData.unaidedClass} ({functionalGainData.unaidedAvg} dB)</strong> إلى <strong>{functionalGainData.aidedClass} ({functionalGainData.aidedAvg} dB)</strong>.
                </p>
              </div>
            </div>
          )}

          <div className="chart-and-insights-grid">
            <div className="chart-wrapper">
              <canvas ref={canvasRef} className="audiogram-canvas" />
              <div className="chart-legend">
                <span className="legend-item"><span className="symbol-red">○</span> الأذن اليمنى (Right Ear)</span>
                <span className="legend-item"><span className="symbol-blue">✕</span> الأذن اليسرى (Left Ear)</span>
                {activeResultsView === 'comparison' && (
                  <span className="legend-item"><span className="symbol-gold">▲</span> مع السماعة الطبية (Aided Verification)</span>
                )}
                <span className="legend-item"><span className="symbol-green">■</span> النطاق السمعي الطبيعي (0-20 dB)</span>
              </div>
            </div>

            <div className="insights-card">
              <h3>التشخيص السريري والتوصيات</h3>
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

              {/* Functional Gain Breakdown Strip if Available */}
              {functionalGainData && (
                <div className="gain-breakdown-box">
                  <div className="gain-row">
                    <span>السمع الطبيعي الخام (بدون سماعة):</span>
                    <strong>{functionalGainData.unaidedAvg} dB</strong>
                  </div>
                  <div className="gain-row">
                    <span>السمع مع السماعة الطبية:</span>
                    <strong className="text-emerald-400">{functionalGainData.aidedAvg} dB</strong>
                  </div>
                  <div className="gain-row highlight">
                    <span>الفائدة الوظيفية المحققة:</span>
                    <strong className="text-amber-400">+{functionalGainData.overallGain} dB</strong>
                  </div>
                </div>
              )}

              <div className="apply-aid-box">
                <h4>🦻 تفعيل المعين السمعي الرقمي الحي</h4>
                <p>تم استخراج وتحديث مصفوفة التعويض السمعي تلقائياً في كافة أدوات المنصة والمحاضرات ومتصفح جوجل.</p>
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
