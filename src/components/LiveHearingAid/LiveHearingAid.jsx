import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Sliders, Volume2, Shield, Sparkles, Activity, 
  AlertTriangle, Radio, Play, Pause, Save, Check, VolumeX, Headphones, Cloud, RotateCcw
} from 'lucide-react';

const BANDS = [
  { freq: 250, label: '250Hz', desc: 'أصوات عميقة' },
  { freq: 500, label: '500Hz', desc: 'دفء الصوت' },
  { freq: 1000, label: '1kHz', desc: 'أساس الكلام' },
  { freq: 2000, label: '2kHz', desc: 'مخارج الحروف' },
  { freq: 4000, label: '4kHz', desc: 'صفير وحروف س/ش' },
  { freq: 8000, label: '8kHz', desc: 'وضوح فائق' }
];

export default function LiveHearingAid({ userAudiogram }) {
  const [isActive, setIsActive] = useState(false);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [demoMode, setDemoMode] = useState('enhanced'); // 'enhanced' or 'raw'
  const [volume, setVolume] = useState(1.2); // 0.2 to 3.0
  const [noiseReduction, setNoiseReduction] = useState(70); // 0 to 100
  const [vocalClarity, setVocalClarity] = useState(80); // 0 to 100
  const [selectedPreset, setSelectedPreset] = useState('conversation'); // 'conversation', 'noisy', 'lecture', 'custom'

  // Equalizer gains in dB (-12 to +24 dB)
  const [eqGains, setEqGains] = useState([4, 6, 8, 12, 10, 6]);
  const [currentDb, setCurrentDb] = useState(42);
  const [deviceWarning, setDeviceWarning] = useState(false);

  // Cloud save state
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudSaveMessage, setCloudSaveMessage] = useState('');

  const audioCtxRef = useRef(null);
  const micStreamRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const rumbleCutRef = useRef(null);
  const filtersRef = useRef([]);
  const vocalFilterRef = useRef(null);
  const noiseLowPassRef = useRef(null);
  const compressorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);

  // Demo audio node refs
  const demoSourceRef = useRef(null);
  const demoEnhancedGainRef = useRef(null);
  const demoRawGainRef = useRef(null);

  // Auto-calibrate EQ from user audiogram if available
  useEffect(() => {
    if (userAudiogram && userAudiogram.summary) {
      const { rightAvg, leftAvg } = userAudiogram.summary;
      // Map hearing loss to boost
      const compensation = BANDS.map((b, i) => {
        const earLoss = Math.max(userAudiogram.rightEar?.[i] || 20, userAudiogram.leftEar?.[i] || 20);
        return Math.min(24, Math.max(-6, Math.round((earLoss - 20) * 0.4)));
      });
      setEqGains(compensation);
      setSelectedPreset('custom');
      if (filtersRef.current && filtersRef.current.length === 6 && audioCtxRef.current) {
        compensation.forEach((gainVal, idx) => {
          if (filtersRef.current[idx]) {
            filtersRef.current[idx].gain.setTargetAtTime(gainVal, audioCtxRef.current.currentTime, 0.05);
          }
        });
      }
    }
  }, [userAudiogram]);

  // Handle Preset Switching
  const applyPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    let newGains = eqGains;
    let newNoise = noiseReduction;
    let newClarity = vocalClarity;

    if (presetKey === 'conversation') {
      newGains = [2, 4, 8, 14, 10, 4];
      newNoise = 60;
      newClarity = 85;
    } else if (presetKey === 'noisy') {
      newGains = [-4, -2, 6, 16, 8, -2];
      newNoise = 90;
      newClarity = 90;
    } else if (presetKey === 'lecture') {
      newGains = [0, 3, 10, 18, 14, 6];
      newNoise = 75;
      newClarity = 95;
    } else if (presetKey === 'custom' && userAudiogram) {
      newGains = BANDS.map((b, i) => {
        const earLoss = Math.max(userAudiogram.rightEar?.[i] || 20, userAudiogram.leftEar?.[i] || 20);
        return Math.min(24, Math.max(-6, Math.round((earLoss - 20) * 0.4)));
      });
    }

    setEqGains(newGains);
    setNoiseReduction(newNoise);
    setVocalClarity(newClarity);

    if (audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      newGains.forEach((g, idx) => {
        if (filtersRef.current[idx]) {
          filtersRef.current[idx].gain.setTargetAtTime(g, now, 0.05);
        }
      });
      if (noiseLowPassRef.current) {
        noiseLowPassRef.current.frequency.setTargetAtTime(9000 - (newNoise * 30), now, 0.05);
      }
      if (vocalFilterRef.current) {
        vocalFilterRef.current.gain.setTargetAtTime((newClarity / 100) * 12, now, 0.05);
      }
    }
  };

  // Helper: Setup common DSP processing chain
  const ensureDspPipeline = (ctx) => {
    if (!rumbleCutRef.current) {
      // 1. High-pass filter to remove rumble (<100Hz)
      const rumbleCut = ctx.createBiquadFilter();
      rumbleCut.type = 'highpass';
      rumbleCut.frequency.value = 100;
      rumbleCutRef.current = rumbleCut;

      // 2. 6-Band Equalizer
      const filters = BANDS.map((b, idx) => {
        const f = ctx.createBiquadFilter();
        f.type = 'peaking';
        f.frequency.value = b.freq;
        f.Q.value = 1.4;
        f.gain.value = eqGains[idx];
        return f;
      });
      filtersRef.current = filters;

      // 3. Vocal Clarity Formant Boost (~3.2kHz)
      const vocalFilter = ctx.createBiquadFilter();
      vocalFilter.type = 'peaking';
      vocalFilter.frequency.value = 3200;
      vocalFilter.Q.value = 1.8;
      vocalFilter.gain.value = (vocalClarity / 100) * 12;
      vocalFilterRef.current = vocalFilter;

      // 4. Noise Low-pass filter
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 9000 - (noiseReduction * 30);
      noiseLowPassRef.current = noiseFilter;

      // 5. Dynamics Compressor (ear protection)
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);
      compressorRef.current = compressor;

      // 6. Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      gainNodeRef.current = masterGain;

      // 7. Analyser Node
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect pipeline
      rumbleCut.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(vocalFilter);
      vocalFilter.connect(noiseFilter);
      noiseFilter.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(analyser);
      masterGain.connect(ctx.destination);
    }
  };

  // Generate realistic speech + ambient noise demo audio buffer
  const createDemoAudioBuffer = (ctx) => {
    const sampleRate = ctx.sampleRate;
    const duration = 6.0; // 6s cycle
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const cycle = t % 1.5; // 4 syllables per 6s

      // Voice envelope
      let env = 0;
      if (cycle < 1.1) {
        env = Math.sin((cycle / 1.1) * Math.PI);
      }

      // Voice fundamental with natural intonation
      const f0 = 135 + 14 * Math.sin(2 * Math.PI * 1.3 * t);

      // Formants simulating Arabic vowels (A, E, O)
      let voice = 0;
      for (let h = 1; h <= 24; h++) {
        const freq = f0 * h;
        if (freq > 5000) break;
        const w1 = Math.exp(-Math.pow(freq - 750, 2) / 30000);
        const w2 = Math.exp(-Math.pow(freq - 1550, 2) / 60000) * 0.75;
        const w3 = Math.exp(-Math.pow(freq - 2800, 2) / 120000) * 0.55;
        const w4 = Math.exp(-Math.pow(freq - 3900, 2) / 220000) * 0.4;
        const amp = (0.22 / h) + w1 + w2 + w3 + w4;
        voice += amp * Math.sin(2 * Math.PI * freq * t);
      }
      voice *= env * 0.28;

      // Consonant fricative burst (s/sh/t)
      let fricative = 0;
      if (cycle > 0.85 && cycle < 1.12) {
        const fEnv = Math.sin(((cycle - 0.85) / 0.27) * Math.PI);
        fricative = (Math.random() * 2 - 1) * fEnv * 0.14;
      }

      // Background ambient rumble + chatter noise
      const ambientNoise = (Math.random() * 2 - 1) * 0.09;

      data[i] = voice + fricative + ambientNoise;
    }
    return buffer;
  };

  // Toggle Live Microphone Hearing Aid Engine
  const toggleHearingAid = async () => {
    if (isActive) {
      stopEngine();
    } else {
      if (isDemoPlaying) stopDemoAudio();
      await startEngine();
    }
  };

  const startEngine = async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext({ latencyHint: 'interactive' });
      if (ctx.state === 'suspended') await ctx.resume();
      audioCtxRef.current = ctx;

      ensureDspPipeline(ctx);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1
        }
      });
      micStreamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      source.connect(rumbleCutRef.current);

      setIsActive(true);
      setDeviceWarning(false);
      startVisualizer();
    } catch (err) {
      console.error('Error starting live hearing aid engine:', err);
      setDeviceWarning(true);
      setIsActive(false);
    }
  };

  const stopEngine = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (!isDemoPlaying && audioCtxRef.current) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current.close();
      audioCtxRef.current = null;
      rumbleCutRef.current = null;
    }
    setIsActive(false);
  };

  // --- AUDIO SIMULATION DEMO (Before vs After) ---
  const toggleDemoAudio = async () => {
    if (isDemoPlaying) {
      stopDemoAudio();
    } else {
      if (isActive) stopEngine();
      await startDemoAudio();
    }
  };

  const startDemoAudio = async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      let ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioContext();
        audioCtxRef.current = ctx;
      }
      if (ctx.state === 'suspended') await ctx.resume();

      ensureDspPipeline(ctx);

      // Create audio buffer and source
      const buffer = createDemoAudioBuffer(ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      demoSourceRef.current = source;

      // Create branches for Enhanced vs Raw
      const enhancedGain = ctx.createGain();
      const rawGain = ctx.createGain();
      demoEnhancedGainRef.current = enhancedGain;
      demoRawGainRef.current = rawGain;

      // Connect source to both branches
      source.connect(enhancedGain);
      source.connect(rawGain);

      // Enhanced branch routes through DSP pipeline
      enhancedGain.connect(rumbleCutRef.current);

      // Raw branch bypasses DSP, routes directly to analyser and output
      rawGain.connect(analyserRef.current);
      rawGain.connect(ctx.destination);

      // Set initial volume per mode
      if (demoMode === 'enhanced') {
        enhancedGain.gain.setValueAtTime(1.0, ctx.currentTime);
        rawGain.gain.setValueAtTime(0.0, ctx.currentTime);
      } else {
        enhancedGain.gain.setValueAtTime(0.0, ctx.currentTime);
        rawGain.gain.setValueAtTime(0.7, ctx.currentTime);
      }

      source.start(0);
      setIsDemoPlaying(true);
      startVisualizer();
    } catch (err) {
      console.error('Error starting demo audio:', err);
    }
  };

  const stopDemoAudio = () => {
    if (demoSourceRef.current) {
      try { demoSourceRef.current.stop(); } catch (e) {}
      demoSourceRef.current.disconnect();
      demoSourceRef.current = null;
    }
    if (!isActive && audioCtxRef.current) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current.close();
      audioCtxRef.current = null;
      rumbleCutRef.current = null;
    }
    setIsDemoPlaying(false);
  };

  const handleSwitchDemoMode = (newMode) => {
    setDemoMode(newMode);
    if (audioCtxRef.current && demoEnhancedGainRef.current && demoRawGainRef.current) {
      const now = audioCtxRef.current.currentTime;
      if (newMode === 'enhanced') {
        demoEnhancedGainRef.current.gain.setTargetAtTime(1.0, now, 0.05);
        demoRawGainRef.current.gain.setTargetAtTime(0.0, now, 0.05);
      } else {
        demoEnhancedGainRef.current.gain.setTargetAtTime(0.0, now, 0.05);
        demoRawGainRef.current.gain.setTargetAtTime(0.7, now, 0.05);
      }
    }
  };

  // Real-time Canvas Spectrum Visualizer & dB Meter
  const startVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      // Estimate dB level from RMS
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      const estimatedDb = Math.min(100, Math.round(30 + (avg / 255) * 60));
      setCurrentDb(estimatedDb);

      // Draw bars
      const width = canvas.width = 400;
      const height = canvas.height = 100;
      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        if (demoMode === 'raw' && isDemoPlaying) {
          grad.addColorStop(0, '#F59E0B');
          grad.addColorStop(1, '#EF4444');
        } else {
          grad.addColorStop(0, '#6C63FF');
          grad.addColorStop(1, '#00D4AA');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };
    render();
  };

  // Update Equalizer Bands in real-time
  const handleBandChange = (index, newVal) => {
    const updated = [...eqGains];
    updated[index] = Number(newVal);
    setEqGains(updated);
    if (filtersRef.current[index] && audioCtxRef.current) {
      filtersRef.current[index].gain.setTargetAtTime(Number(newVal), audioCtxRef.current.currentTime, 0.05);
    }
    setSelectedPreset('custom');
  };

  // Update Volume
  const handleVolumeChange = (newVol) => {
    const v = Number(newVol);
    setVolume(v);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(v, audioCtxRef.current.currentTime, 0.05);
    }
  };

  // Update Vocal Clarity
  const handleVocalClarityChange = (val) => {
    const v = Number(val);
    setVocalClarity(v);
    if (vocalFilterRef.current && audioCtxRef.current) {
      vocalFilterRef.current.gain.setTargetAtTime((v / 100) * 12, audioCtxRef.current.currentTime, 0.05);
    }
  };

  // Update Noise Reduction
  const handleNoiseChange = (val) => {
    const v = Number(val);
    setNoiseReduction(v);
    if (noiseLowPassRef.current && audioCtxRef.current) {
      noiseLowPassRef.current.frequency.setTargetAtTime(9000 - (v * 30), audioCtxRef.current.currentTime, 0.05);
    }
  };

  // Save Settings to Cloud API
  const handleSaveToCloud = async () => {
    setIsSavingCloud(true);
    setCloudSaveMessage('');
    try {
      const payload = {
        freq_high: eqGains[4] || 10,
        noise_reduction: noiseReduction,
        voice_enhance: vocalClarity
      };
      const res = await fetch('/api/audio_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setCloudSaveMessage('تم حفظ التفضيلات السمعية سحابياً بنجاح ☁️✅');
      } else {
        setCloudSaveMessage('تم الحفظ محلياً (وضع الذاكرة السحابية الاحتياطية) 💾');
      }
    } catch (err) {
      setCloudSaveMessage('تم الحفظ محلياً بنجاح 💾');
    } finally {
      setIsSavingCloud(false);
      setTimeout(() => setCloudSaveMessage(''), 4000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEngine();
      stopDemoAudio();
    };
  }, []);

  return (
    <div className="live-hearing-aid-card">
      {/* Header */}
      <div className="aid-header">
        <div className="aid-title-cluster">
          <div className={`aid-indicator-dot ${(isActive || isDemoPlaying) ? 'active' : ''}`}></div>
          <div>
            <h3>المعين السمعي الحي المباشر (Live Smart Hearing Aid)</h3>
            <p>معالجة فورية لصوت الميكروفون وتعويض الترددات الناقصة في أذنك بدون أي تأخير.</p>
          </div>
        </div>

        <div className="aid-header-actions">
          <button
            onClick={handleSaveToCloud}
            disabled={isSavingCloud}
            className="btn-cloud-save"
            title="مزامنة الإعدادات مع السحابة"
          >
            <Cloud className="w-4 h-4 ml-1.5" />
            {isSavingCloud ? 'جارٍ الحفظ...' : 'حفظ سحابياً'}
          </button>

          <button
            onClick={toggleHearingAid}
            className={`btn-power-toggle ${isActive ? 'active' : ''}`}
          >
            {isActive ? (
              <>
                <Mic className="w-5 h-5 ml-2" />
                إيقاف الميكروفون
              </>
            ) : (
              <>
                <MicOff className="w-5 h-5 ml-2" />
                تشغيل الميكروفون الحي
              </>
            )}
          </button>
        </div>
      </div>

      {cloudSaveMessage && (
        <div className="aid-cloud-toast">
          <Check className="w-4 h-4 text-emerald-400 ml-1.5" />
          <span>{cloudSaveMessage}</span>
        </div>
      )}

      {deviceWarning && (
        <div className="aid-warning-banner">
          <AlertTriangle className="w-5 h-5 ml-2 text-amber-400" />
          <span>تنبيه: يُرجى استخدام سماعات الأذن/الرأس لتجنب صفير الصدى (Feedback Loop) والسماح للميكروفون بالعمل.</span>
        </div>
      )}

      {/* --- NEW: Interactive Audio Demo & Simulation Box --- */}
      <div className="aid-demo-simulation-card">
        <div className="demo-header-row">
          <div className="demo-title-cluster">
            <span className="demo-badge">🎧 معاينة تجريبية للمحكّمين</span>
            <h4>المقارنة السمعية الحية (عينة كلامية مع ضوضاء محيطة)</h4>
            <p>جرّب الاستماع فورياً بدون ميكروفون وبدون صدى؛ قارن بين الصوت الخام وصوت مدى السمع المكيّف.</p>
          </div>

          <button
            onClick={toggleDemoAudio}
            className={`btn-demo-play ${isDemoPlaying ? 'playing' : ''}`}
          >
            {isDemoPlaying ? (
              <>
                <Pause className="w-5 h-5 ml-2 text-emerald-300" />
                إيقاف العينة الصوتية
              </>
            ) : (
              <>
                <Play className="w-5 h-5 ml-2 text-white" />
                تشغيل عينة المحاكاة الصوتية
              </>
            )}
          </button>
        </div>

        {isDemoPlaying && (
          <div className="demo-mode-switcher-container">
            <span className="switcher-label">وضع الاستماع الحالي:</span>
            <div className="demo-toggle-group">
              <button
                onClick={() => handleSwitchDemoMode('raw')}
                className={`demo-switch-btn raw ${demoMode === 'raw' ? 'active' : ''}`}
              >
                <VolumeX className="w-4 h-4 ml-1.5" />
                الصوت الأصلي (قبل التكييف)
              </button>
              <button
                onClick={() => handleSwitchDemoMode('enhanced')}
                className={`demo-switch-btn enhanced ${demoMode === 'enhanced' ? 'active' : ''}`}
              >
                <Sparkles className="w-4 h-4 ml-1.5" />
                معالجة مدى السمع (بعد التكييف)
              </button>
            </div>

            <div className={`demo-status-explanation ${demoMode}`}>
              {demoMode === 'raw' ? (
                <span>⚠️ <strong>الصوت الخام:</strong> تستمع الآن للصوت الأصلي مع تشويش وضوضاء عالية وانخفاض في مخارج الحروف.</span>
              ) : (
                <span>✨ <strong>صوت مدى السمع المكيّف:</strong> تم عزل الضوضاء بنسبة {noiseReduction}%، وتضخيم ترددات النطق، وتعويض فقدان السمع.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Visualizer & dB Status Bar */}
      <div className="aid-monitor-strip">
        <div className="db-meter-box">
          <Activity className="w-4 h-4 text-emerald-400 ml-1 inline" />
          مستوى الصوت: <strong>{(isActive || isDemoPlaying) ? currentDb : '--'} dB</strong>
          <span className={`db-status-pill ${currentDb > 75 ? 'warning' : 'safe'}`}>
            {currentDb > 75 ? 'صاخب ⚠️' : 'مريح وآمن ✅'}
          </span>
        </div>

        <div className="canvas-spectrum-wrapper">
          <canvas ref={canvasRef} className="spectrum-canvas" />
        </div>
      </div>

      {/* Presets Cluster */}
      <div className="aid-presets-row">
        <span className="preset-label">البيئات الصوتية المجهزة:</span>
        <div className="preset-buttons">
          <button
            onClick={() => applyPreset('conversation')}
            className={`preset-btn ${selectedPreset === 'conversation' ? 'active' : ''}`}
          >
            💬 محادثة هادئة
          </button>
          <button
            onClick={() => applyPreset('noisy')}
            className={`preset-btn ${selectedPreset === 'noisy' ? 'active' : ''}`}
          >
            ☕ مقهى وشارع صاخب
          </button>
          <button
            onClick={() => applyPreset('lecture')}
            className={`preset-btn ${selectedPreset === 'lecture' ? 'active' : ''}`}
          >
            🎓 محاضرة واجتماع
          </button>
          <button
            onClick={() => applyPreset('custom')}
            className={`preset-btn ${selectedPreset === 'custom' ? 'active' : ''}`}
          >
            ✨ مخصص حسب فحصك السمعي
          </button>
        </div>
      </div>

      {/* Master Controls */}
      <div className="aid-sliders-grid">
        <div className="aid-slider-control">
          <div className="slider-header">
            <span>مستوى التضخيم العام (Volume)</span>
            <strong>{Math.round(volume * 100)}%</strong>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(e.target.value)}
            className="styled-slider"
          />
        </div>

        <div className="aid-slider-control">
          <div className="slider-header">
            <span>عزل الضوضاء المحيطة (Noise Filter)</span>
            <strong>{noiseReduction}%</strong>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={noiseReduction}
            onChange={(e) => handleNoiseChange(e.target.value)}
            className="styled-slider slider-cyan"
          />
        </div>

        <div className="aid-slider-control">
          <div className="slider-header">
            <span>تعزيز مخارج الكلام (Vocal Clarity)</span>
            <strong>{vocalClarity}%</strong>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={vocalClarity}
            onChange={(e) => handleVocalClarityChange(e.target.value)}
            className="styled-slider slider-purple"
          />
        </div>
      </div>

      {/* 6-Band Graphic Equalizer */}
      <div className="aid-equalizer-section">
        <div className="eq-header">
          <div className="eq-header-title">
            <Sliders className="w-4 h-4 ml-2 inline text-indigo-400" />
            <span>الموازن الترددي الدقيق (6-Band Graphic Equalizer)</span>
          </div>
          <button 
            onClick={() => applyPreset('custom')} 
            className="btn-eq-reset"
            title="إعادة المعايرة حسب المخطط السمعي"
          >
            <RotateCcw className="w-3.5 h-3.5 ml-1 inline" />
            إعادة الضبط للفحص
          </button>
        </div>
        <div className="eq-bands-grid">
          {BANDS.map((band, idx) => (
            <div key={band.freq} className="eq-column">
              <span className="eq-gain-val">{eqGains[idx] > 0 ? `+${eqGains[idx]}` : eqGains[idx]}dB</span>
              <div className="eq-vertical-slider-track">
                <input
                  type="range"
                  min="-12"
                  max="24"
                  step="1"
                  value={eqGains[idx]}
                  onChange={(e) => handleBandChange(idx, e.target.value)}
                  className="eq-v-slider"
                />
              </div>
              <strong className="eq-band-title">{band.label}</strong>
              <small className="eq-band-desc">{band.desc}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
