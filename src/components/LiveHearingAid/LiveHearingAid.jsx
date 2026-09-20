import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sliders, Volume2, Shield, Sparkles, Activity, AlertTriangle, Radio } from 'lucide-react';

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
  const [volume, setVolume] = useState(1.2); // 0.2 to 3.0
  const [noiseReduction, setNoiseReduction] = useState(70); // 0 to 100
  const [vocalClarity, setVocalClarity] = useState(80); // 0 to 100
  const [selectedPreset, setSelectedPreset] = useState('conversation'); // 'conversation', 'noisy', 'lecture', 'custom'

  // Equalizer gains in dB (-12 to +24 dB)
  const [eqGains, setEqGains] = useState([4, 6, 8, 12, 10, 6]);
  const [currentDb, setCurrentDb] = useState(42);
  const [deviceWarning, setDeviceWarning] = useState(false);

  const audioCtxRef = useRef(null);
  const micStreamRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const filtersRef = useRef([]);
  const vocalFilterRef = useRef(null);
  const noiseLowPassRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);

  // Auto-calibrate EQ from user audiogram if available
  useEffect(() => {
    if (userAudiogram && userAudiogram.summary) {
      const { rightAvg, leftAvg } = userAudiogram.summary;
      const avg = (rightAvg + leftAvg) / 2;
      // Map hearing loss to boost
      const compensation = BANDS.map((b, i) => {
        const earLoss = Math.max(userAudiogram.rightEar[i] || 20, userAudiogram.leftEar[i] || 20);
        return Math.min(24, Math.max(-6, Math.round((earLoss - 20) * 0.4)));
      });
      setEqGains(compensation);
      setSelectedPreset('custom');
    }
  }, [userAudiogram]);

  // Handle Preset Switching
  const applyPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    if (presetKey === 'conversation') {
      setEqGains([2, 4, 8, 14, 10, 4]);
      setNoiseReduction(60);
      setVocalClarity(85);
    } else if (presetKey === 'noisy') {
      setEqGains([-4, -2, 6, 16, 8, -2]);
      setNoiseReduction(90);
      setVocalClarity(90);
    } else if (presetKey === 'lecture') {
      setEqGains([0, 3, 10, 18, 14, 6]);
      setNoiseReduction(75);
      setVocalClarity(95);
    } else if (presetKey === 'custom' && userAudiogram) {
      // Re-apply personal audiogram
      const compensation = BANDS.map((b, i) => {
        const earLoss = Math.max(userAudiogram.rightEar[i] || 20, userAudiogram.leftEar[i] || 20);
        return Math.min(24, Math.max(-6, Math.round((earLoss - 20) * 0.4)));
      });
      setEqGains(compensation);
    }
  };

  // Toggle Live Hearing Aid Engine
  const toggleHearingAid = async () => {
    if (isActive) {
      stopEngine();
    } else {
      await startEngine();
    }
  };

  const startEngine = async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext({ latencyHint: 'interactive' });
      if (ctx.state === 'suspended') await ctx.resume();
      audioCtxRef.current = ctx;

      // Microphone Stream with advanced constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // We do custom DSP
          autoGainControl: false,
          channelCount: 1
        }
      });
      micStreamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // High-pass filter to remove low rumble/wind noise
      const rumbleCut = ctx.createBiquadFilter();
      rumbleCut.type = 'highpass';
      rumbleCut.frequency.value = 100;

      // Create 6-Band Graphic Equalizer
      const filters = BANDS.map((b, idx) => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = b.freq;
        filter.Q.value = 1.4;
        filter.gain.value = eqGains[idx];
        return filter;
      });
      filtersRef.current = filters;

      // Vocal Clarity Formant Boost (around 3kHz)
      const vocalFilter = ctx.createBiquadFilter();
      vocalFilter.type = 'peaking';
      vocalFilter.frequency.value = 3200;
      vocalFilter.Q.value = 1.8;
      vocalFilter.gain.value = (vocalClarity / 100) * 12;
      vocalFilterRef.current = vocalFilter;

      // Dynamic Noise Low-pass filter
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 9000 - (noiseReduction * 30);
      noiseLowPassRef.current = noiseFilter;

      // Master Gain Node with Dynamics Compressor to protect ears
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);

      const masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      gainNodeRef.current = masterGain;

      // Analyser for visualizer & dB meter
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect the processing chain:
      // Source -> RumbleCut -> Filters[0..5] -> VocalFilter -> NoiseFilter -> Compressor -> MasterGain -> Analyser -> Destination
      source.connect(rumbleCut);
      let prevNode = rumbleCut;

      filters.forEach(f => {
        prevNode.connect(f);
        prevNode = f;
      });

      prevNode.connect(vocalFilter);
      vocalFilter.connect(noiseFilter);
      noiseFilter.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(analyser);

      // Connect to headphones output
      masterGain.connect(ctx.destination);

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
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsActive(false);
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
        grad.addColorStop(0, '#6C63FF');
        grad.addColorStop(1, '#00D4AA');
        ctx.fillStyle = grad;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };
    render();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEngine();
    };
  }, []);

  return (
    <div className="live-hearing-aid-card">
      {/* Header */}
      <div className="aid-header">
        <div className="aid-title-cluster">
          <div className={`aid-indicator-dot ${isActive ? 'active' : ''}`}></div>
          <div>
            <h3>المعين السمعي الحي المباشر (Live Smart Hearing Aid)</h3>
            <p>معالجة فورية لصوت الميكروفون وتعويض الترددات الناقصة في أذنك بدون أي تأخير.</p>
          </div>
        </div>

        <button
          onClick={toggleHearingAid}
          className={`btn-power-toggle ${isActive ? 'active' : ''}`}
        >
          {isActive ? (
            <>
              <Mic className="w-5 h-5 ml-2" />
              إيقاف المعين السمعي
            </>
          ) : (
            <>
              <MicOff className="w-5 h-5 ml-2" />
              تشغيل المعين السمعي الحي
            </>
          )}
        </button>
      </div>

      {deviceWarning && (
        <div className="aid-warning-banner">
          <AlertTriangle className="w-5 h-5 ml-2 text-amber-400" />
          <span>تنبيه: يُرجى استخدام سماعات الأذن/الرأس لتجنب صفير الصدى (Feedback Loop) والسماح للميكروفون بالعمل.</span>
        </div>
      )}

      {/* Visualizer & dB Status Bar */}
      <div className="aid-monitor-strip">
        <div className="db-meter-box">
          <Activity className="w-4 h-4 text-emerald-400 ml-1 inline" />
          مستوى الصوت المحيط: <strong>{isActive ? currentDb : '--'} dB</strong>
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
            className={`preset-btn ${activePreset === 'conversation' ? 'active' : ''}`}
          >
            💬 محادثة هادئة
          </button>
          <button
            onClick={() => applyPreset('noisy')}
            className={`preset-btn ${activePreset === 'noisy' ? 'active' : ''}`}
          >
            ☕ مقهى وشارع صاخب
          </button>
          <button
            onClick={() => applyPreset('lecture')}
            className={`preset-btn ${activePreset === 'lecture' ? 'active' : ''}`}
          >
            🎓 محاضرة واجتماع
          </button>
          <button
            onClick={() => applyPreset('custom')}
            className={`preset-btn ${activePreset === 'custom' ? 'active' : ''}`}
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
          <Sliders className="w-4 h-4 ml-2 inline text-indigo-400" />
          <span>الموازن الترددي الدقيق (6-Band Graphic Equalizer)</span>
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
