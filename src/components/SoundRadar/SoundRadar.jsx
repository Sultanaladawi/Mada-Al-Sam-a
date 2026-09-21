import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Bell, Flame, Car, Baby, Volume2, AlertOctagon, Radio, Sparkles, Check } from 'lucide-react';

export default function SoundRadar() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sensitivity, setSensitivity] = useState(65); // 20 to 95 dB threshold
  const [currentDb, setCurrentDb] = useState(38);
  const [activeAlert, setActiveAlert] = useState(null);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [flashEnabled, setFlashEnabled] = useState(true);

  const [alertsLog, setAlertsLog] = useState([
    { id: 1, type: 'doorbell', title: 'جرس الباب', time: 'منذ 10 دقائق', db: 78, icon: '🔔' },
    { id: 2, type: 'alarm', title: 'إنذار صوتي حاد', time: 'منذ ساعة', db: 85, icon: '🚨' }
  ]);

  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const radarCanvasRef = useRef(null);
  const lastAlertTimeRef = useRef(0);

  // Trigger Multi-sensory Alert with 3.5s cooldown
  const triggerAlert = (type, title, db, icon) => {
    const now = Date.now();
    if (now - lastAlertTimeRef.current < 3500) return;
    lastAlertTimeRef.current = now;

    const alertObj = { id: now, type, title, time: 'الآن', db, icon };
    setActiveAlert(alertObj);
    setAlertsLog(prev => [alertObj, ...prev.slice(0, 19)]);

    // Vibration API (Haptic feedback for deaf individuals)
    if (hapticEnabled && navigator.vibrate) {
      try {
        navigator.vibrate([300, 100, 300, 100, 600]);
      } catch (e) {}
    }

    // Auto dismiss active banner after 4 seconds
    setTimeout(() => {
      setActiveAlert(null);
    }, 4500);
  };

  const startMonitoring = async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      audioCtxRef.current = ctx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);
      setIsMonitoring(true);
      startRadarLoop();
    } catch (err) {
      console.error('Error starting sound radar:', err);
      alert('يرجى السماح بالوصول للميكروفون لتشغيل رادار الأمان الصوتي.');
    }
  };

  const stopMonitoring = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsMonitoring(false);
  };

  const startRadarLoop = () => {
    const canvas = radarCanvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let angle = 0;

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      // Calculate loudness
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const avg = sum / bufferLength;
      const db = Math.min(110, Math.round(30 + (avg / 255) * 70));
      setCurrentDb(db);

      // Check threshold trigger
      if (db >= sensitivity) {
        // Classify based on dominant frequency
        let highFreqSum = 0;
        for (let i = Math.floor(bufferLength * 0.6); i < bufferLength; i++) highFreqSum += dataArray[i];
        
        if (highFreqSum > 3000) {
          triggerAlert('alarm', 'إنذار أو صفارة حادة', db, '🚨');
        } else {
          triggerAlert('doorbell', 'صوت قوي أو طرق / جرس', db, '🔔');
        }
      }

      // Draw Circular Radar
      const w = canvas.width = 280;
      const h = canvas.height = 280;
      const cx = w / 2;
      const cy = h / 2;
      const radius = 120;

      ctx.clearRect(0, 0, w, h);

      // Concentric circles
      ctx.strokeStyle = 'rgba(108, 99, 255, 0.2)';
      ctx.lineWidth = 1.5;
      [0.3, 0.6, 0.9].forEach(factor => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * factor, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Radar Sweep Line
      angle += 0.04;
      const sweepX = cx + Math.cos(angle) * radius;
      const sweepY = cy + Math.sin(angle) * radius;

      const grad = ctx.createLinearGradient(cx, cy, sweepX, sweepY);
      grad.addColorStop(0, 'rgba(0, 212, 170, 0)');
      grad.addColorStop(1, 'rgba(0, 212, 170, 0.8)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // Center glowing dot
      ctx.fillStyle = '#00D4AA';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    render();
  };

  useEffect(() => {
    return () => stopMonitoring();
  }, []);

  return (
    <div className={`sound-radar-card ${activeAlert && flashEnabled ? 'flash-alert-active' : ''}`}>
      {/* Alert Overlay Banner */}
      {activeAlert && (
        <div className="radar-urgent-banner">
          <div className="urgent-badge-icon">{activeAlert.icon}</div>
          <div className="urgent-info">
            <h4>رصد صوت طارئ: {activeAlert.title}</h4>
            <p>مستوى الشدة المسجل: <strong>{activeAlert.db} dB</strong></p>
          </div>
          <button onClick={() => setActiveAlert(null)} className="btn-dismiss-alert">
            تم الانتباه ✓
          </button>
        </div>
      )}

      {/* Header */}
      <div className="radar-header">
        <div className="radar-title-group">
          <div className={`radar-indicator-dot ${isMonitoring ? 'active' : ''}`}></div>
          <div>
            <h3>رادار الأمان الصوتي الحسي (Sensory Sound Radar)</h3>
            <p>كشف فوري للأصوات البيئية والطارئة (جرس الباب، الإنذار، بوق السيارة) وتنبيهك بومضات واهتزازات حسية.</p>
          </div>
        </div>

        <button
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          className={`btn-power-toggle ${isMonitoring ? 'active' : ''}`}
        >
          {isMonitoring ? 'إيقاف المراقبة' : 'تفعيل رادار الأمان'}
        </button>
      </div>

      {/* Main Grid: Radar Canvas + Settings & History */}
      <div className="radar-main-grid">
        {/* Radar Visualizer */}
        <div className="radar-visualizer-box">
          <canvas ref={radarCanvasRef} className="radar-canvas" />
          <div className="radar-db-gauge">
            <span>شدة الصوت الحالية:</span>
            <strong className="db-value">{isMonitoring ? currentDb : '--'} dB</strong>
            <small>حساسية التنبيه: {sensitivity} dB</small>
          </div>
        </div>

        {/* Controls & Triggers */}
        <div className="radar-controls-panel">
          <div className="sensitivity-slider-box">
            <div className="slider-label-row">
              <span>حساسية التقاط الأصوات (Threshold)</span>
              <strong>{sensitivity} dB</strong>
            </div>
            <input
              type="range"
              min="35"
              max="90"
              step="1"
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="styled-slider"
            />
            <div className="sensitivity-hints">
              <span>أصوات هادئة (حساس جداً)</span>
              <span>أصوات صاخبة فقط</span>
            </div>
          </div>

          {/* Toggles: Flash & Haptic */}
          <div className="radar-toggles-cluster">
            <button
              onClick={() => setHapticEnabled(!hapticEnabled)}
              className={`toggle-pill-btn ${hapticEnabled ? 'active' : ''}`}
            >
              <Radio className="w-4 h-4 ml-2" />
              الاهتزاز اللمسي (Haptic): {hapticEnabled ? 'مفعل ✅' : 'معطل ❌'}
            </button>
            <button
              onClick={() => setFlashEnabled(!flashEnabled)}
              className={`toggle-pill-btn ${flashEnabled ? 'active' : ''}`}
            >
              <Sparkles className="w-4 h-4 ml-2" />
              الوميض البصري (Screen Flash): {flashEnabled ? 'مفعل ✅' : 'معطل ❌'}
            </button>
          </div>

          {/* Manual Test Simulation */}
          <div className="manual-sim-box">
            <span className="sim-title">محاكاة واختبار التنبيهات الحسية:</span>
            <div className="sim-buttons-grid">
              <button
                onClick={() => triggerAlert('doorbell', 'جرس الباب الخارجي', 78, '🔔')}
                className="sim-btn"
              >
                🔔 جرس الباب
              </button>
              <button
                onClick={() => triggerAlert('alarm', 'إنذار حريق أو غاز', 92, '🚨')}
                className="sim-btn"
              >
                🚨 إنذار حريق
              </button>
              <button
                onClick={() => triggerAlert('car', 'بوق سيارة في الشارع', 86, '🚗')}
                className="sim-btn"
              >
                🚗 بوق سيارة
              </button>
              <button
                onClick={() => triggerAlert('baby', 'بكاء طفل أو نداء', 72, '👶')}
                className="sim-btn"
              >
                👶 بكاء طفل
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History Log */}
      <div className="radar-history-section">
        <h4>سجل الأصوات والتنبيهات المرصودة</h4>
        <div className="history-list">
          {alertsLog.map((log) => (
            <div key={log.id} className="history-item">
              <span className="log-icon">{log.icon}</span>
              <div className="log-details">
                <strong>{log.title}</strong>
                <small>{log.time} • شدة الصوت: {log.db} dB</small>
              </div>
              <span className="log-badge">تم التوثيق ✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
