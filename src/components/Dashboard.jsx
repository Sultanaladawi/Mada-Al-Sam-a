import React, { useState, useEffect, useRef } from 'react';

export default function Dashboard({ onViewChange }) {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLectureId, setActiveLectureId] = useState('1');
  const [activeSubtab, setActiveSubtab] = useState('text');
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());
  
  // Test Overlay Simulation
  const [showTestOverlay, setShowTestOverlay] = useState(false);
  const [headphoneDetected, setHeadphoneDetected] = useState(false);
  const [waitingForHeadphones, setWaitingForHeadphones] = useState(false);
  const [testMode, setTestMode] = useState('speaker'); // 'headphones' or 'speaker'
  const [testStep, setTestStep] = useState(0);
  const [isTestingRight, setIsTestingRight] = useState(true);
  const [tempRightEar, setTempRightEar] = useState([]);
  const [tempLeftEar, setTempLeftEar] = useState([]);

  // Headphone detection and simulation states
  const [detectedDevices, setDetectedDevices] = useState([]);
  const [manualHeadphoneOverride, setManualHeadphoneOverride] = useState(false);

  // Live DSP / Voice Recorder states
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoFileLoaded, setDemoFileLoaded] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const demoAudioRef = useRef(null);
  const demoSourceRef = useRef(null);
  const demoHighShelfRef = useRef(null);
  const demoLowPassRef = useRef(null);
  const demoHighPassRef = useRef(null);
  const demoGainRef = useRef(null);

  // Mada Browser states
  const [browserPage, setBrowserPage] = useState('home'); // 'home', 'youtube', 'teams', 'wiki', 'facebook', 'instagram', 'search'
  const [browserSubpage, setBrowserSubpage] = useState('login'); // 'login', 'feed'
  const [fbEmail, setFbEmail] = useState('');
  const [fbPass, setFbPass] = useState('');
  const [igUser, setIgUser] = useState('');
  const [igPass, setIgPass] = useState('');

  const [ytUrlInput, setYtUrlInput] = useState('');
  const [customYtId, setCustomYtId] = useState('');
  const [customYtTimer, setCustomYtTimer] = useState(0);

  const [activeYtVideo, setActiveYtVideo] = useState(null);
  const [ytPlaying, setYtPlaying] = useState(false);
  const [ytCurrentTime, setYtCurrentTime] = useState(0);

  const [teamsJoined, setTeamsJoined] = useState(false);
  const [teamsTime, setTeamsTime] = useState(0);

  const [wikiSelectedTerm, setWikiSelectedTerm] = useState(null);

  const [browserUrlInput, setBrowserUrlInput] = useState('https://mada.browser/dashboard');
  const [browserSearchInput, setBrowserSearchInput] = useState('');
  const [browserSearchQuery, setBrowserSearchQuery] = useState('');

  // Database and Notes States
  const [selectedTable, setSelectedTable] = useState('audiograms');
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [noteSaveStatus, setNoteSaveStatus] = useState('');

  // Audio refs for Mada Browser DSP
  const ytAudioRef = useRef(null);
  const ytSourceRef = useRef(null);
  const ytHighShelfRef = useRef(null);
  const ytLowPassRef = useRef(null);
  const ytHighPassRef = useRef(null);
  const ytGainRef = useRef(null);

  const teamsAudioRef = useRef(null);
  const teamsSourceRef = useRef(null);
  const teamsHighShelfRef = useRef(null);
  const teamsLowPassRef = useRef(null);
  const teamsHighPassRef = useRef(null);
  const teamsGainRef = useRef(null);

  // Live Sound Settings
  const [sliders, setSliders] = useState({
    freqHigh: 65,
    noiseReduction: 80,
    voiceEnhance: 70,
    hapticIntensity: 40
  });

  const [toggles, setToggles] = useState({
    liveCaptions: true,
    emotionIndicator: true,
    environmentAlerts: false
  });

  // Audiogram Data State
  const [audiogramData, setAudiogramData] = useState({
    frequencies: [250, 500, 1000, 2000, 4000, 8000],
    rightEar: [25, 30, 35, 40, 35, 30],
    leftEar: [30, 35, 40, 45, 40, 35]
  });

  // Personalized Hearing Profile — set automatically after test
  const [hearingProfile, setHearingProfile] = useState(null);
  // null = no test done yet
  // { level: 'mild'|'moderate'|'severe'|'profound', avgLoss, gainMultiplier, label, color, icon, freqBoosts }
  
  const personalizedGainRef = useRef(null); // Web Audio GainNode for super boost

  const previewCanvasRef = useRef(null);
  const fullCanvasRef = useRef(null);
  const audioCtxRef = useRef(null);

  const testFrequencies = [250, 500, 1000, 2000, 4000, 8000];

  // ===== WEB AUDIO API — Real Tone Generator =====
  const playTone = (frequency, side = 'both') => {
    // If in headphones mode and headphones are not detected, DO NOT play sound
    if (testMode === 'headphones' && !headphoneDetected) {
      console.warn("Attempted to play tone in headphone mode but no headphones were detected.");
      return;
    }

    // Create or resume AudioContext (browsers require user gesture first)
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // Oscillator (pure sine wave = pure tone used in audiometry)
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Gain (envelope: fade in → sustain → fade out to avoid clicks)
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.35, ctx.currentTime + 0.55);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.7);

    // Panner (for headphone mode: L / R / both)
    const panner = ctx.createStereoPanner();
    panner.pan.value = side === 'right' ? 1 : side === 'left' ? -1 : 0;

    // Connect graph: oscillator → gain → panner → output
    oscillator.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.75);
  };

  // ===== Headphone Detection via enumerateDevices =====
  const checkHeadphones = async (requestPermission = false) => {
    try {
      let devices = await navigator.mediaDevices.enumerateDevices();
      let hasLabels = devices.some(d => d.label !== '');

      // Request microphone permission temporarily if needed to get labels
      if (!hasLabels && requestPermission) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(t => t.stop());
          devices = await navigator.mediaDevices.enumerateDevices();
          hasLabels = true;
        } catch (e) {
          console.warn("Microphone permission denied, listing devices without labels.");
        }
      }

      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
      setDetectedDevices(audioOutputs);

      // Search for headphone/earphone indicators in labels
      const headphoneKeywords = ['headphone', 'headset', 'earphone', 'buds', 'audio jack', 'سماعة', 'سماعات', 'external', 'line out', 'usb audio'];
      const hasHeadphonesLabel = audioOutputs.some(d =>
        d.label && headphoneKeywords.some(keyword => d.label.toLowerCase().includes(keyword))
      );

      // We treat manual override as headphone detected
      const detected = hasHeadphonesLabel || manualHeadphoneOverride;
      setHeadphoneDetected(detected);
      return detected;
    } catch {
      // Fallback
      const fallbackDetected = manualHeadphoneOverride || true;
      setHeadphoneDetected(fallbackDetected);
      return fallbackDetected;
    }
  };

  // Listen for devices being plugged / unplugged in real time
  useEffect(() => {
    checkHeadphones(false); // Check initially without popup
    const handler = () => checkHeadphones(false);
    navigator.mediaDevices?.addEventListener('devicechange', handler);
    return () => navigator.mediaDevices?.removeEventListener('devicechange', handler);
  }, [manualHeadphoneOverride]);

  // When waiting for headphones and they get detected → auto-start or resume the test
  useEffect(() => {
    if (waitingForHeadphones && headphoneDetected) {
      setWaitingForHeadphones(false);
      setShowTestOverlay(true);
      
      // Calculate current frequency and side to resume testing
      const currentFreq = testFrequencies[testStep % testFrequencies.length];
      const side = isTestingRight ? 'right' : 'left';
      
      setTimeout(() => playTone(currentFreq, side), 150);
    }
  }, [headphoneDetected, waitingForHeadphones, testStep, isTestingRight]);

  // Auto-pause test if headphones are unplugged during the test
  useEffect(() => {
    if (testMode === 'headphones' && showTestOverlay && !headphoneDetected) {
      setShowTestOverlay(false);
      setWaitingForHeadphones(true);
    }
  }, [headphoneDetected, testMode, showTestOverlay]);

  // ===== Live Audio DSP Test Helper Logic =====
  const initDemoAudioDSP = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (!demoSourceRef.current && demoAudioRef.current) {
      demoSourceRef.current = ctx.createMediaElementSource(demoAudioRef.current);

      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 100 + (sliders.noiseReduction / 100) * 200;
      demoHighPassRef.current = highPass;

      const lowPass = ctx.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.frequency.value = 8000 - (sliders.noiseReduction / 100) * 4000;
      demoLowPassRef.current = lowPass;

      const highShelf = ctx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 2500;
      highShelf.gain.value = (sliders.freqHigh / 100) * 15;
      demoHighShelfRef.current = highShelf;

      const gainNode = ctx.createGain();
      gainNode.gain.value = 1 + (sliders.voiceEnhance / 100) * 0.8;
      demoGainRef.current = gainNode;

      demoSourceRef.current.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(highShelf);
      highShelf.connect(gainNode);
      gainNode.connect(ctx.destination);
    }
  };

  const initYtAudioDSP = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (!ytSourceRef.current && ytAudioRef.current) {
      ytSourceRef.current = ctx.createMediaElementSource(ytAudioRef.current);

      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 100 + (sliders.noiseReduction / 100) * 200;
      ytHighPassRef.current = highPass;

      const lowPass = ctx.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.frequency.value = 8000 - (sliders.noiseReduction / 100) * 4000;
      ytLowPassRef.current = lowPass;

      const highShelf = ctx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 2500;
      highShelf.gain.value = (sliders.freqHigh / 100) * 15;
      ytHighShelfRef.current = highShelf;

      const gainNode = ctx.createGain();
      gainNode.gain.value = 1 + (sliders.voiceEnhance / 100) * 0.8;
      ytGainRef.current = gainNode;

      ytSourceRef.current.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(highShelf);
      highShelf.connect(gainNode);
      gainNode.connect(ctx.destination);
    }
  };

  const initTeamsAudioDSP = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (!teamsSourceRef.current && teamsAudioRef.current) {
      teamsSourceRef.current = ctx.createMediaElementSource(teamsAudioRef.current);

      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 100 + (sliders.noiseReduction / 100) * 200;
      teamsHighPassRef.current = highPass;

      const lowPass = ctx.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.frequency.value = 8000 - (sliders.noiseReduction / 100) * 4000;
      teamsLowPassRef.current = lowPass;

      const highShelf = ctx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 2500;
      highShelf.gain.value = (sliders.freqHigh / 100) * 15;
      teamsHighShelfRef.current = highShelf;

      const gainNode = ctx.createGain();
      gainNode.gain.value = 1 + (sliders.voiceEnhance / 100) * 0.8;
      teamsGainRef.current = gainNode;

      teamsSourceRef.current.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(highShelf);
      highShelf.connect(gainNode);
      gainNode.connect(ctx.destination);
    }
  };

  // Live Slider Updaters for Audio DSP
  useEffect(() => {
    if (demoHighShelfRef.current) demoHighShelfRef.current.gain.value = (sliders.freqHigh / 100) * 15;
    if (ytHighShelfRef.current) ytHighShelfRef.current.gain.value = (sliders.freqHigh / 100) * 15;
    if (teamsHighShelfRef.current) teamsHighShelfRef.current.gain.value = (sliders.freqHigh / 100) * 15;
  }, [sliders.freqHigh]);

  useEffect(() => {
    const hpVal = 100 + (sliders.noiseReduction / 100) * 200;
    const lpVal = 8000 - (sliders.noiseReduction / 100) * 4000;
    if (demoHighPassRef.current) demoHighPassRef.current.frequency.value = hpVal;
    if (demoLowPassRef.current) demoLowPassRef.current.frequency.value = lpVal;
    if (ytHighPassRef.current) ytHighPassRef.current.frequency.value = hpVal;
    if (ytLowPassRef.current) ytLowPassRef.current.frequency.value = lpVal;
    if (teamsHighPassRef.current) teamsHighPassRef.current.frequency.value = hpVal;
    if (teamsLowPassRef.current) teamsLowPassRef.current.frequency.value = lpVal;
  }, [sliders.noiseReduction]);

  useEffect(() => {
    const gainVal = 1 + (sliders.voiceEnhance / 100) * 0.8;
    if (demoGainRef.current) demoGainRef.current.gain.value = gainVal;
    if (ytGainRef.current) ytGainRef.current.gain.value = gainVal;
    if (teamsGainRef.current) teamsGainRef.current.gain.value = gainVal;
  }, [sliders.voiceEnhance]);

  // Voice Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setDemoFileLoaded(true);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('تعذر الوصول إلى الميكروفون للتسجيل. يرجى التحقق من صلاحيات المتصفح.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setDemoFileLoaded(true);
    }
  };

  // Draw Canvas Charts
  const drawAudiogramChart = (canvas, data, isPreview = false) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Fit canvas resolution to CSS size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Draw background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    
    const paddingLeft = isPreview ? 20 : 40;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = isPreview ? 15 : 30;
    
    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    const numFreqs = data.frequencies.length;
    
    for (let i = 0; i < numFreqs; i++) {
      const x = paddingLeft + (i / (numFreqs - 1)) * chartW;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, paddingTop + chartH);
      ctx.stroke();

      if (!isPreview) {
        ctx.fillStyle = 'rgba(240,240,255,0.4)';
        ctx.font = '10px Tajawal';
        ctx.textAlign = 'center';
        ctx.fillText(data.frequencies[i] + 'Hz', x, paddingTop + chartH + 15);
      }
    }

    const dbSteps = isPreview ? 4 : 10;
    const maxDb = 100;
    for (let i = 0; i <= dbSteps; i++) {
      const dbVal = (i / dbSteps) * maxDb;
      const y = paddingTop + (i / dbSteps) * chartH;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + chartW, y);
      ctx.stroke();

      if (!isPreview) {
        ctx.fillStyle = 'rgba(240,240,255,0.4)';
        ctx.font = '10px Tajawal';
        ctx.textAlign = 'right';
        ctx.fillText(dbVal + 'dB', paddingLeft - 8, y + 3);
      }
    }

    // Right Ear Curve (Red)
    drawEarCurve(ctx, data.rightEar, chartW, chartH, paddingLeft, paddingTop, '#ff4444', 'O');
    // Left Ear Curve (Teal)
    drawEarCurve(ctx, data.leftEar, chartW, chartH, paddingLeft, paddingTop, '#00D4AA', 'X');
  };

  const drawEarCurve = (ctx, values, w, h, oX, oY, color, markerSymbol) => {
    const numPoints = values.length;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fillStyle = color;

    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const x = oX + (i / (numPoints - 1)) * w;
      const y = oY + (values[i] / 100) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    for (let i = 0; i < numPoints; i++) {
      const x = oX + (i / (numPoints - 1)) * w;
      const y = oY + (values[i] / 100) * h;
      
      ctx.beginPath();
      if (markerSymbol === 'O') {
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.moveTo(x - 3, y - 3);
        ctx.lineTo(x + 3, y + 3);
        ctx.moveTo(x + 3, y - 3);
        ctx.lineTo(x - 3, y + 3);
        ctx.stroke();
      }
    }
  };

  // Re-render chart canvases
  useEffect(() => {
    if (activeTab === 'home') {
      drawAudiogramChart(previewCanvasRef.current, audiogramData, true);
    } else if (activeTab === 'audiogram') {
      drawAudiogramChart(fullCanvasRef.current, audiogramData, false);
    }
  }, [activeTab, audiogramData]);

  // Preloaded data for lecture transcripts
  const lectureData = {
    '1': {
      title: 'محاضرة هندسة البرمجيات',
      meta: 'جامعة قطر • 4 يونيو 2026 • المدة: 45 دقيقة',
      bubbles: [
        { speaker: 'الدكتور', role: 'teacher', text: 'أهلاً بكم يا شباب في محاضرة اليوم. سنتحدث اليوم عن مراحل تطوير البرمجيات ونموذج الشلال (Waterfall Model).', time: '10:15 ص' },
        { speaker: 'طالب', role: 'student', text: 'دكتور، هل ما زال نموذج الشلال مستخدماً بكثرة في المشاريع الحديثة أم تم استبداله تماماً بـ Agile؟', time: '10:18 ص' },
        { speaker: 'الدكتور', role: 'teacher', text: 'سؤال ممتاز. نموذج الشلال لا يزال مستخدماً في الأنظمة الحساسة للغاية مثل أنظمة الطيران أو الأجهزة الطبية حيث تكون المتطلبات ثابتة ولا تقبل التغيير بعد البدء. أما في التطبيقات السحابية وتطبيقات الهاتف فـ Agile هو الخيار المفضل بالتأكيد.', time: '10:20 ص' }
      ],
      summaryPoints: [
        'تطوير البرمجيات (SDLC): شرح الخطوات الأساسية من تحديد المتطلبات وحتى مرحلة الصيانة.',
        'نموذج الشلال (Waterfall): نموذج تقليدي خطي، يتميز بالصلابة والتوثيق الممتاز، ومناسب للأنظمة الحساسة.',
        'منهجية الرشاقة (Agile): نموذج مرن وتكراري، يركز على التسليم السريع والتعاون المستمر مع العميل.'
      ],
      recommendations: 'قراءة الفصل الثالث من الكتاب المنهجي، وحل التمرين رقم 4 وتسليمه قبل يوم الخميس القادم عبر بوابة الجامعة.',
      questions: [
        { q: 'ما هو الفرق الجوهري بين نموذج الشلال ومنهجية Agile؟', a: 'الشلال نموذج خطي صلب يتطلب متطلبات ثابتة في البداية، بينما Agile نموذج تكراري مرن يسمح بالتغيير المستمر والتطوير السريع.' },
        { q: 'متى يفضل استخدام نموذج الشلال (Waterfall) في المشاريع؟', a: 'في المشاريع الطبية أو العسكرية أو أنظمة الطيران حيث لا يمكن قبول الأخطاء أو التغييرات بعد بدء التنفيذ وتكون القوانين صارمة.' }
      ]
    },
    '2': {
      title: 'اجتماع العمل الأسبوعي',
      meta: 'Microsoft Teams • 3 يونيو 2026 • المدة: 30 دقيقة',
      bubbles: [
        { speaker: 'المدير المالي', role: 'teacher', text: 'سنقوم بمراجعة الميزانية التشغيلية للربع الثاني اليوم.', time: '09:02 ص' },
        { speaker: 'أحمد', role: 'student', text: 'هل تشمل الميزانية الجديدة الدعم المالي لتجربة نظام مدى السمع لذوي الإعاقة السمعية بالشركة؟', time: '09:05 ص' },
        { speaker: 'المدير المالي', role: 'teacher', text: 'نعم، تم إدراج ميزانية خاصة بالشمول الرقمي وتجهيز طبقات الوصول المساعدة لأعضاء الفريق.', time: '09:08 ص' }
      ],
      summaryPoints: [
        'الميزانية التشغيلية: استعراض البنود الأساسية للميزانية واعتمادها للربع الثاني.',
        'التسهيلات والشمول الرقمي: الموافقة الرسمية على تخصيص ميزانية لمدى السمع لدعم العاملين من ذوي التحديات السمعية.'
      ],
      recommendations: 'إرسال الفواتير المتعلقة بالاختبار الأولي للنظام المالي بحلول يوم الإثنين.',
      questions: [
        { q: 'ما هو الهدف من اجتماع اليوم؟', a: 'مراجعة واعتماد الميزانية التشغيلية للربع الثاني، ومناقشة الشمول الرقمي بالشركة.' }
      ]
    },
    '3': {
      title: 'فيديو تعليمي: مقدمة في الـ AI',
      meta: 'يوتيوب • 1 يونيو 2026 • المدة: 15 دقيقة',
      bubbles: [
        { speaker: 'المعلق', role: 'teacher', text: 'الذكاء الاصطناعي ليس مجرد نماذج لغوية، بل هو ثورة متكاملة تبدأ من معالجة الإشارات وحتى الرؤية الحاسوبية.', time: '01:02 م' },
        { speaker: 'النظام الذكي', role: 'student', text: '[توضيح] يقصد أن الذكاء التوليدي هو جزء بسيط من بحر خوارزميات الذكاء الاصطناعي الكامل.', time: '01:05 م' }
      ],
      summaryPoints: [
        'ماهية الذكاء الاصطناعي: تصحيح المفهوم الشائع بكونه مجرد دردشة آلية.',
        'معالجة الإشارات: التطرق لأهمية التعرف الصوتي وتفريغ الكلام كأدوات تمكين حاسوبية.'
      ],
      recommendations: 'متابعة سلسلة الفيديوهات للحصول على فهم متقدم للمصطلحات الرياضية.',
      questions: [
        { q: 'ما الفكرة المغلوطة التي صححها الفيديو عن الـ AI؟', a: 'أن الذكاء الاصطناعي ينحصر فقط في النماذج اللغوية التوليدية (مثل الشات بوت)، بينما هو مجال واسع يشمل معالجة الإشارات والرؤية الحاسوبية.' }
      ]
    }
  };

  const startHearingTest = async () => {
    // Reset manual override and get permission if in headphone mode
    setManualHeadphoneOverride(false);
    if (testMode === 'headphones') {
      const has = await checkHeadphones(true);
      if (!has) {
        // Block start — show waiting screen instead
        setWaitingForHeadphones(true);
        return;
      }
    }
    setTestStep(0);
    setTempRightEar([]);
    setTempLeftEar([]);
    setIsTestingRight(true);
    setShowTestOverlay(true);
    const firstFreq = testFrequencies[0];
    const side = testMode === 'headphones' ? 'right' : 'both';
    setTimeout(() => playTone(firstFreq, side), 100);
  };

  const handleTestResponse = (canHear) => {
    const calculatedDb = canHear
      ? Math.floor(Math.random() * 20 + 20)
      : Math.floor(Math.random() * 30 + 45);

    let nextStep;
    let nextIsTestingRight = isTestingRight;

    if (testMode === 'speaker') {
      const updatedRight = [...tempRightEar, calculatedDb];
      const updatedLeft = [...tempLeftEar, calculatedDb];
      setTempRightEar(updatedRight);
      setTempLeftEar(updatedLeft);
      nextStep = testStep + 1;
      setTestStep(nextStep);

      if (nextStep >= testFrequencies.length) {
        setShowTestOverlay(false);
        setAudiogramData({
          frequencies: [250, 500, 1000, 2000, 4000, 8000],
          rightEar: updatedRight,
          leftEar: updatedLeft
        });
        saveAudiogramToDB(updatedRight, updatedLeft);
        // 🔑 Auto-calculate personalized DSP profile from test results
        const profile = calculateAndApplyHearingProfile(updatedRight, updatedLeft);
        alert(`✅ اكتمل اختبار السمع!\n\n${profile.icon} الملف السمعي: ${profile.label}\nمتوسط الفقدان: ${profile.avgLoss} dB\n\n${profile.message}`);
        return;
      }
    } else {
      // Headphones mode
      if (isTestingRight) {
        const updated = [...tempRightEar, calculatedDb];
        setTempRightEar(updated);
        if (updated.length === testFrequencies.length) {
          nextIsTestingRight = false;
          setIsTestingRight(false);
        }
      } else {
        const updated = [...tempLeftEar, calculatedDb];
        setTempLeftEar(updated);
        if (updated.length === testFrequencies.length) {
          setShowTestOverlay(false);
          const finalLeft = [...updated];
          setAudiogramData({
            frequencies: [250, 500, 1000, 2000, 4000, 8000],
            rightEar: tempRightEar,
            leftEar: finalLeft
          });
          saveAudiogramToDB(tempRightEar, finalLeft);
          // 🔑 Auto-calculate personalized DSP profile from test results
          const profile = calculateAndApplyHearingProfile(tempRightEar, finalLeft);
          alert(`✅ اكتمل اختبار السمع!\n\n${profile.icon} الملف السمعي: ${profile.label}\nمتوسط الفقدان: ${profile.avgLoss} dB\n\n${profile.message}`);
          return;
        }
      }
      nextStep = testStep + 1;
      setTestStep(nextStep);
    }

    // Play next tone directly (inside click handler = allowed by browsers)
    const nextFreqIndex = nextStep % testFrequencies.length;
    const nextFreq = testFrequencies[nextFreqIndex];
    const nextSide = testMode === 'headphones'
      ? (nextIsTestingRight ? 'right' : 'left')
      : 'both';
    setTimeout(() => playTone(nextFreq, nextSide), 150);
  };

  const currentHz = testFrequencies[testStep % testFrequencies.length];
  const currentEarLabel = testMode === 'speaker' ? 'الأذنين معاً (مكبر الصوت)' : (isTestingRight ? 'الأذن اليمنى (Right)' : 'الأذن اليسرى (Left)');

  // Calculate Average DB Loss
  const rightAvg = Math.round(audiogramData.rightEar.reduce((a, b) => a + b, 0) / audiogramData.rightEar.length);
  const leftAvg = Math.round(audiogramData.leftEar.reduce((a, b) => a + b, 0) / audiogramData.leftEar.length);

  // Toggle Answer view helper
  const toggleAnswer = (qIndex) => {
    setRevealedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(qIndex)) next.delete(qIndex);
      else next.add(qIndex);
      return next;
    });
  };

  // Helper alerts
  const showNotifications = () => {
    alert('تنبيهات مدى السمع:\n1. تم كشف اتصال سماعات رأس جديدة بنجاح.\n2. تم إعداد تلخيص AI لمحاضرة هندسة البرمجيات بالكامل.');
  };

  const startLiveSession = () => {
    alert('جاري إطلاق بث مدى السمع... تم تفعيل الترجمة العائمة الفورية في الخلفية بنجاح.');
  };

  const saveSettings = () => {
    fetch(`${API_BASE_URL}/audio_settings.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        freq_high: sliders.freqHigh,
        noise_reduction: sliders.noiseReduction,
        voice_enhance: sliders.voiceEnhance
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        alert('تم حفظ وتطبيق التغييرات الصوتية في قاعدة البيانات (MySQL) بنجاح!');
      } else {
        alert('حدث خطأ أثناء حفظ الإعدادات في قاعدة البيانات: ' + data.message);
      }
    })
    .catch(err => {
      console.error(err);
      alert('تم تطبيق التغييرات الصوتية، ولكن تعذر الاتصال بـ MySQL. تأكد من تشغيل XAMPP (Port 3307).');
    });
  };

  const shareWithDoctor = () => {
    alert('تم إرسال نسخة من ملفك السمعي (PDF) إلى الطبيب المسجل في حسابك بنجاح.');
  };

  const newCommunityPost = () => {
    const postText = prompt('اكتب ما تود مشاركته مع المجتمع:');
    if (postText) {
      alert('تم نشر منشورك بنجاح! سيظهر في المجتمع بعد المراجعة.');
    }
  };

  // YouTube URL extraction helper
  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleBrowserNavigate = (val) => {
    if (!val) return;
    const cleanVal = val.toLowerCase().trim();
    
    let pageTitle = 'Google Search Sandbox';
    // Check if it is a Youtube link
    const ytId = getYoutubeId(val);
    if (ytId) {
      setCustomYtId(ytId);
      setActiveYtVideo({
        id: ytId,
        title: 'فيديو يوتيوب خارجي',
        author: 'قناة يوتيوب الحرة',
        views: 'مشاهدة حية',
        duration: '0:00',
        audioUrl: '',
        captions: []
      });
      setBrowserPage('youtube');
      setYtPlaying(true);
      setYtCurrentTime(0);
      setCustomYtTimer(0);
      setBrowserUrlInput(`https://www.youtube.com/watch?v=${ytId}`);
      pageTitle = 'YouTube Video Embed';
    } else if (cleanVal.includes('youtube') || cleanVal.includes('يوتيوب') || cleanVal.includes('youtu.be')) {
      setBrowserPage('youtube');
      setBrowserUrlInput('https://www.youtube.com/mada-hearing-hub');
      pageTitle = 'YouTube Portal';
    } else if (cleanVal.includes('facebook') || cleanVal.includes('فيسبوك') || cleanVal.includes('فيس')) {
      setBrowserPage('facebook');
      setBrowserSubpage('login');
      setBrowserUrlInput('https://www.facebook.com/login');
      pageTitle = 'Facebook Portal';
    } else if (cleanVal.includes('instagram') || cleanVal.includes('انستغرام') || cleanVal.includes('انستقرام')) {
      setBrowserPage('instagram');
      setBrowserSubpage('login');
      setBrowserUrlInput('https://www.instagram.com/accounts/login');
      pageTitle = 'Instagram Portal';
    } else if (cleanVal.includes('teams') || cleanVal.includes('تيمز') || cleanVal.includes('microsoft')) {
      setBrowserPage('teams');
      setBrowserUrlInput('https://teams.microsoft.com/meeting/room-203');
      pageTitle = 'Teams Meeting';
    } else if (cleanVal.includes('wiki') || cleanVal.includes('ويكيبيديا') || cleanVal.includes('موسوعة')) {
      setBrowserPage('wiki');
      setBrowserUrlInput('https://ar.wikipedia.org/wiki/Sensorineural_Hearing_Loss');
      pageTitle = 'Wikipedia Assist';
    } else {
      // General search query
      setBrowserPage('search');
      setBrowserSearchQuery(val);
      setBrowserSearchInput(val);
      setBrowserUrlInput(`https://www.google.com/search?q=${encodeURIComponent(val)}`);
      pageTitle = `Search for: ${val}`;
    }

    // Save browser history to MySQL
    fetch(`${API_BASE_URL}/browser_history.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: val,
        title: pageTitle
      })
    }).catch(err => console.log('History DB save failed:', err));
  };

  const API_BASE_URL = 'http://localhost/mada-api';

  const fetchTableData = async (tableName) => {
    setTableLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${tableName}.php`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setTableData(data);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.error('Error fetching table:', error);
      setTableData([]);
    } finally {
      setTableLoading(false);
    }
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    fetchTableData(table);
  };

  const exportTableData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tableData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `mada_hearing_${selectedTable}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const saveAudiogramToDB = (rightEar, leftEar) => {
    const avgRight = rightEar.reduce((a, b) => a + b, 0) / rightEar.length;
    const avgLeft = leftEar.reduce((a, b) => a + b, 0) / leftEar.length;

    fetch(`${API_BASE_URL}/audiograms.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loss_left: avgLeft,
        loss_right: avgRight,
        data: { rightEar, leftEar }
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Audiogram saved to MySQL:', data);
    })
    .catch(err => console.error('Error saving audiogram to MySQL:', err));
  };

  // ===== PERSONALIZED HEARING PROFILE ENGINE =====
  // Reads audiogram results → calculates individual DSP profile → applies to ALL audio
  const calculateAndApplyHearingProfile = (rightEar, leftEar) => {
    // Use the worse ear (higher dB loss = more deficit) as the reference
    const allValues = [...rightEar, ...leftEar];
    const avgLoss = allValues.reduce((a, b) => a + b, 0) / allValues.length;

    // High-frequency loss: average of 2000, 4000, 8000 Hz (speech clarity)
    const freqIndices = [3, 4, 5]; // indices for 2kHz, 4kHz, 8kHz
    const highFreqRight = freqIndices.map(i => rightEar[i] || 0);
    const highFreqLeft  = freqIndices.map(i => leftEar[i] || 0);
    const highFreqLoss  = [...highFreqRight, ...highFreqLeft].reduce((a, b) => a + b, 0) / 6;

    // Classify severity level and set DSP parameters
    let profile;
    if (avgLoss < 25) {
      profile = {
        level: 'normal',
        label: 'سمع طبيعي',
        icon: '✅',
        color: '#34A853',
        gainMultiplier: 1.0,
        freqHighBoost: 30,
        noiseReduction: 20,
        voiceEnhance: 30,
        liveCaptionsForced: false,
        superBoost: false,
        message: 'سمعك ضمن المعدل الطبيعي. تم ضبط الفلاتر على الوضع الأمثل.'
      };
    } else if (avgLoss < 40) {
      profile = {
        level: 'mild',
        label: 'فقدان خفيف (Mild)',
        icon: '🟡',
        color: '#FBBC05',
        gainMultiplier: 1.8,
        freqHighBoost: Math.min(100, 40 + highFreqLoss),
        noiseReduction: 55,
        voiceEnhance: 60,
        liveCaptionsForced: false,
        superBoost: false,
        message: 'تم ضبط تضخيم الكلام وتنقية الضجيج تلقائياً لتعويض الفقدان الخفيف.'
      };
    } else if (avgLoss < 70) {
      profile = {
        level: 'moderate',
        label: 'فقدان متوسط (Moderate)',
        icon: '🟠',
        color: '#FF8C00',
        gainMultiplier: 3.5,
        freqHighBoost: Math.min(100, 60 + highFreqLoss * 0.5),
        noiseReduction: 80,
        voiceEnhance: 85,
        liveCaptionsForced: false,
        superBoost: false,
        message: 'تم تفعيل تضخيم ×3.5 لتعويض الفقدان المتوسط مع فلترة الضجيج بقوة 80%.'
      };
    } else if (avgLoss < 95) {
      profile = {
        level: 'severe',
        label: 'فقدان شديد (Severe)',
        icon: '🔴',
        color: '#EA4335',
        gainMultiplier: 5.5,
        freqHighBoost: 100,
        noiseReduction: 100,
        voiceEnhance: 100,
        liveCaptionsForced: true,
        superBoost: true,
        message: 'تم تفعيل التضخيم الفائق ×5.5 وإجبار الترجمة الفورية والفلاتر بأعلى قوة.'
      };
    } else {
      profile = {
        level: 'profound',
        label: 'فقدان كلي (Profound / صمم)',
        icon: '⚫',
        color: '#9C27B0',
        gainMultiplier: 8.0,
        freqHighBoost: 100,
        noiseReduction: 100,
        voiceEnhance: 100,
        liveCaptionsForced: true,
        superBoost: true,
        message: 'وضع الاعتماد البصري الكامل: الترجمة الفورية + تنبيهات مرئية + تضخيم أقصى.'
      };
    }

    profile.avgLoss = Math.round(avgLoss);

    // Apply to sliders state (updates UI visually)
    setSliders(prev => ({
      ...prev,
      freqHigh: Math.round(profile.freqHighBoost),
      noiseReduction: Math.round(profile.noiseReduction),
      voiceEnhance: Math.round(profile.voiceEnhance)
    }));

    // Force live captions for severe/profound
    if (profile.liveCaptionsForced) {
      setToggles(prev => ({ ...prev, liveCaptions: true }));
    }

    // Apply to Web Audio API GainNodes immediately if context exists
    if (audioCtxRef.current) {
      // YT DSP
      if (ytGainRef.current) {
        ytGainRef.current.gain.setTargetAtTime(profile.gainMultiplier, audioCtxRef.current.currentTime, 0.1);
      }
      if (ytHighShelfRef.current) {
        ytHighShelfRef.current.gain.setTargetAtTime(profile.freqHighBoost * 0.3, audioCtxRef.current.currentTime, 0.1);
      }
      // Teams DSP
      if (teamsGainRef.current) {
        teamsGainRef.current.gain.setTargetAtTime(profile.gainMultiplier, audioCtxRef.current.currentTime, 0.1);
      }
      if (teamsHighShelfRef.current) {
        teamsHighShelfRef.current.gain.setTargetAtTime(profile.freqHighBoost * 0.3, audioCtxRef.current.currentTime, 0.1);
      }
      // Demo DSP
      if (demoGainRef.current) {
        demoGainRef.current.gain.setTargetAtTime(profile.gainMultiplier, audioCtxRef.current.currentTime, 0.1);
      }
      if (demoHighShelfRef.current) {
        demoHighShelfRef.current.gain.setTargetAtTime(profile.freqHighBoost * 0.3, audioCtxRef.current.currentTime, 0.1);
      }
    }

    setHearingProfile(profile);
    return profile;
  };

  const fetchLectureNotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lecture_notes.php`);
      const notes = await response.json();
      if (Array.isArray(notes)) {
        const matchingNote = notes.find(n => n.lecture_title === lectureData[activeLectureId]?.title);
        if (matchingNote) {
          setCurrentNoteText(matchingNote.notes);
        } else {
          setCurrentNoteText('');
        }
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const saveLectureNote = async () => {
    if (!lectureData[activeLectureId]) return;
    setNoteSaveStatus('جاري الحفظ في MySQL...');
    try {
      const response = await fetch(`${API_BASE_URL}/lecture_notes.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lecture_title: lectureData[activeLectureId]?.title,
          notes: currentNoteText
        })
      });
      const resData = await response.json();
      if (resData.status === 'success') {
        setNoteSaveStatus('✅ تم الحفظ بنجاح في قاعدة البيانات!');
        setTimeout(() => setNoteSaveStatus(''), 3000);
      } else {
        setNoteSaveStatus('❌ فشل الحفظ: ' + resData.message);
      }
    } catch (err) {
      setNoteSaveStatus('❌ فشل الاتصال بالسيرفر المحلي');
      console.error('Error saving note:', err);
    }
  };

  // YouTube Simulated Data
  const ytVideoData = [
    {
      id: '1',
      title: 'محاضرة: مستقبل الذكاء الاصطناعي في التعليم الجامعي',
      author: 'جامعة قطر التعليمية',
      views: '12 ألف مشاهدة • قبل يومين',
      duration: '0:35',
      audioUrl: 'https://ia802508.us.archive.org/5/items/testmp3testfile/mpthreetest.mp3',
      poster: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
      captions: [
        { time: 0, text: 'مرحباً بكم اليوم سنتكلم عن لغات البرمجة ودورها في بناء البرمجيات الذكية.' },
        { time: 5, text: '[توضيح] الكمبيوتر يفهم فقط لغة الآلة، وهي الأصفار والواحد.' },
        { time: 10, text: '[هام] لذلك نستخدم لغات عالية المستوى مثل بايثون لتسهيل عملية التطوير.' },
        { time: 15, text: '[تحليل] لغة بايثون تتميز بالبساطة والسهولة وهي الخيار المفضل لمشاريع الذكاء الاصطناعي.' },
        { time: 20, text: '[سؤال] هل تعتقد أن بايثون مناسبة لبرمجة الألعاب الكبيرة أم نفضل لغات أخرى؟' },
        { time: 25, text: 'بايثون ممتازة للذكاء الاصطناعي، ولكن للألعاب الكبيرة نفضل لغات ذات سرعة عالية مثل C++.' },
        { time: 30, text: 'سنتطرق في الدرس القادم لكيفية تثبيت المترجم وإعداد بيئة التطوير الخاصة بكم.' }
      ]
    },
    {
      id: '2',
      title: 'ندوة: الشمول الرقمي وتسهيل الوصول لذوي التحديات السمعية',
      author: 'مؤسسة قطر للابتكار',
      views: '5.4 ألف مشاهدة • قبل أسبوع',
      duration: '0:30',
      audioUrl: 'https://ia802508.us.archive.org/5/items/testmp3testfile/mpthreetest.mp3',
      poster: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&auto=format&fit=crop&q=60',
      captions: [
        { time: 0, text: 'نرحب بكم في هذه الندوة الهامة حول تمكين الأشخاص ذوي الإعاقة السمعية رقمياً.' },
        { time: 5, text: '[إحصائية] تشير الدراسات إلى أن أكثر من 5% من سكان العالم يعانون من درجات ضعف سمع مختلفة.' },
        { time: 10, text: '[هام] توفير الترجمة الفورية والاهتزاز الإيقاعي يغير جودة حياتهم اليومية بشكل كامل.' },
        { time: 15, text: 'يسعى مشروع مدى السمع إلى دمج تقنيات المعالجة الذكية في الفصول والاجتماعات.' },
        { time: 20, text: '[تحليل] الفلترة الصوتية المخصصة تساعد على حماية السمع وتوضيح النطق بشكل مريح.' },
        { time: 25, text: 'نشكر حضوركم وتفاعلكم، ونلتقي في حلقة نقاشية قادمة لتطوير الابتكارات المساعدة.' }
      ]
    }
  ];

  // Teams simulated meeting captions
  const teamsMeetingCaptions = [
    { time: 0, speaker: 'الدكتورة سارة (المحاضِرة)', role: 'teacher', tone: '😊 هادئ', text: 'السلام عليكم ورحمة الله، أهلاً بكم في درس هندسة البرمجيات اليوم.' },
    { time: 5, speaker: 'الدكتورة سارة (المحاضِرة)', role: 'teacher', tone: '💡 توضيح', text: 'اليوم سنركز على مرحلة جمع المتطلبات (Requirements Gathering) وأهميتها في دورة حياة البرمجيات.' },
    { time: 10, speaker: 'طالب 1 (خالد)', role: 'student', tone: '🙋 سؤال', text: 'دكتورة، هل نقوم بجمع المتطلبات من العميل مباشرة أم نعتمد على استبيانات وإحصائيات السوق؟' },
    { time: 15, speaker: 'الدكتورة سارة (المحاضِرة)', role: 'teacher', tone: '😊 هادئ', text: 'سؤال رائع يا خالد. نستخدم المقابلات الشخصية للمتطلبات المعقدة، بينما نستخدم الاستبيانات للمجموعات والأسواق الكبيرة.' },
    { time: 20, speaker: 'الدكتورة سارة (المحاضِرة)', role: 'teacher', tone: '⚠️ تنبيه', text: 'تذكروا جيداً: أي خطأ في مرحلة تحديد المتطلبات قد يكلفنا 10 أضعاف تكلفته في مرحلة البرمجة أو الصيانة!' },
    { time: 25, speaker: 'طالب 1 (خالد)', role: 'student', tone: '😮 متحمس', text: 'فهمت الآن، هذا يفسر لماذا تفشل الكثير من التطبيقات والشركات الناشئة بسبب سوء التخطيط وتحديد المتطلبات.' },
    { time: 30, speaker: 'الدكتورة سارة (المحاضِرة)', role: 'teacher', tone: '😊 هادئ', text: 'بالظبط، وهذا هو دور مهندس البرمجيات في التوجيه والتحليل السليم قبل كتابة سطر كود واحد.' }
  ];

  // Wikipedia simulated article
  const wikiArticle = {
    title: 'فقدان السمع الحسي العصبي (Sensorineural Hearing Loss)',
    p1: 'فقدان السمع الحسي العصبي هو نوع من أنواع ضعف السمع، ويحدث نتيجة تلف الخلايا الشعرية الدقيقة في الأذن الداخلية (القوقعة) أو تلف المسارات العصبية التي تنقل الإشارات الصوتية من الأذن إلى الدماغ (العصب السمعي).',
    p2: 'يعتبر هذا النوع هو الشكل الأكثر شيوعاً لفقدان السمع الدائم، ويمكن أن يكون ناجماً عن عدة أسباب مثل التقدم في العمر (الشيخوخة السمعية)، التعرض للضوضاء العالية لفترات طويلة، العوامل الوراثية، أو تناول بعض الأدوية السامة للأذن.',
    p3: 'بالنسبة للأشخاص المصابين بفقدان السمع الحسي العصبي، غالباً ما تظهر الصعوبة في تمييز الأصوات ذات الترددات العالية (مثل أصوات النساء والأطفال، أو حروف مثل السين والشين والثاء)، مما يجعل فهم الكلام في البيئات المزدحمة والمليئة بالضوضاء أمراً صعباً ومجهداً للأذن.',
    p4: 'يساعد نظام مدى السمع على معالجة هذه الحالة عن طريق تضخيم الترددات المفقودة بشكل تفاعلي بناءً على مخطط السمع (Audiogram) الخاص بالمستخدم، مع تطبيق فلاتر تقليل الضوضاء وفصل المتحدثين لتعزيز الفهم المريح بنسبة تصل إلى 94%.'
  };

  const wikiTermDefinitions = {
    'الأذن الداخلية (القوقعة)': 'العضو الحلزوني الممتلئ بسائل والمسؤول عن تحويل الموجات الصوتية الميكانيكية إلى نبضات عصبية كهربائية يفهمها الدماغ.',
    'العصب السمعي': 'حزمة الألياف العصبية التي تنقل الإشارات الكهربائية الصوتية من خلايا القوقعة إلى الفص الصدغي في الدماغ لمعالجة الصوت وفهمه.',
    'الترددات العالية': 'الأصوات الحادة والمرتفعة (أعلى من 2000Hz)، وهي أول ما يفقده مريض ضعف السمع الحسي العصبي، وتتضمن أصوات النساء والطيور والعديد من الحروف الساكنة.',
    'مخطط السمع (Audiogram)': 'رسم بياني يُظهر عتبة السمع للشخص عند ترددات مختلفة ويستخدم لتخصيص فلاتر مدى السمع الذكية بناءً على قياس الفقد الفعلي بالديسيبل.'
  };

  // YouTube audio playback sync handler
  const handleYtTimeUpdate = (e) => {
    setYtCurrentTime(e.target.currentTime);
  };

  // Custom YouTube video caption simulation loop
  useEffect(() => {
    let interval;
    if (ytPlaying && customYtId) {
      interval = setInterval(() => {
        setCustomYtTimer(t => t + 1);
      }, 1000);
    } else {
      setCustomYtTimer(0);
    }
    return () => clearInterval(interval);
  }, [ytPlaying, customYtId]);

  // Combined caption function
  const getActiveYtCaption = () => {
    if (customYtId) {
      const t = customYtTimer;
      if (t < 3) return '🔍 جاري الاتصال بمشغل يوتيوب والتقاط البث الصوتي...';
      if (t < 6) return '⚡ جاري تفعيل فلتر مدى السمع وعزل الترددات المنخفضة...';
      if (t < 9) return '🎙️ [ذكاء اصطناعي]: تم كشف صوت المتحدث باللغة العربية. جاري معالجة الكلام...';
      
      const lines = [
        'مرحباً بكم أعزائي المتابعين في هذا المقطع الجديد.',
        'سنتحدث اليوم عن أحدث التطورات التكنولوجية في عالمنا المعاصر.',
        '[تحليل]: تركز الأبحاث الحالية على تطوير واجهات تفاعلية سهلة الوصول.',
        '[ملاحظة]: يهدف التصميم الشامل إلى تمكين كافة فئات المجتمع من التكنولوجيا.',
        'تعتبر تقنيات التعرف على الكلام ومعالجة الإشارة أساساً في هذا التحول.',
        'سنستعرض معاً بعض الأمثلة التطبيقية لكيفية عمل هذه الأنظمة الذكية.',
        'شكراً لمتابعتكم، ونرجو أن ينال هذا الشرح إعجابكم وتفاعلكم المستمر.'
      ];
      const index = Math.floor((t - 9) / 4) % lines.length;
      return `✨ [تفريغ تلقائي حي]: ${lines[index]}`;
    }

    if (!activeYtVideo) return '';
    const caps = activeYtVideo.captions;
    let currentText = 'في انتظار بدء تشغيل المقطع...';
    for (let i = 0; i < caps.length; i++) {
      if (ytCurrentTime >= caps[i].time) {
        currentText = caps[i].text;
      }
    }
    return currentText;
  };

  // Teams call timer hook
  useEffect(() => {
    let interval;
    if (teamsJoined) {
      interval = setInterval(() => {
        setTeamsTime(t => t + 1);
      }, 1000);
    } else {
      setTeamsTime(0);
    }
    return () => clearInterval(interval);
  }, [teamsJoined]);

  const getActiveTeamsCaption = () => {
    let activeCap = { speaker: 'الدكتورة سارة (المحاضِرة)', text: 'السلام عليكم ورحمة الله، أهلاً بكم في درس هندسة البرمجيات اليوم.', tone: '😊 هادئ' };
    const time = teamsTime % 35; // Loop the meeting dialogue for continuous demo
    for (let i = 0; i < teamsMeetingCaptions.length; i++) {
      if (time >= teamsMeetingCaptions[i].time) {
        activeCap = teamsMeetingCaptions[i];
      }
    }
    return activeCap;
  };

  // Load settings from MySQL on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/audio_settings.php`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.status) {
          setSliders({
            freqHigh: parseFloat(data.freq_high),
            noiseReduction: parseFloat(data.noise_reduction),
            voiceEnhance: parseFloat(data.voice_enhance),
            hapticIntensity: 40
          });
        }
      })
      .catch(err => console.log('Error loading settings from MySQL:', err));
  }, []);

  // Fetch table data when activeTab changes to database
  useEffect(() => {
    if (activeTab === 'database') {
      fetchTableData(selectedTable);
    }
  }, [activeTab]);

  // Fetch lecture notes on lecture change or lectures tab select
  useEffect(() => {
    if (activeTab === 'lectures') {
      fetchLectureNotes();
    }
  }, [activeLectureId, activeTab]);

  return (
    <div className="db-container">
      
      {/* Sidebar Navigation */}
      <aside className="db-sidebar">
        <div className="db-brand">
          <div className="nav-logo" onClick={() => onViewChange('landing')}>
            <div className="logo-icon small">
              <svg viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="url(#dbLg)" strokeWidth="2"/>
                <path d="M12 20 Q16 10 20 20 Q24 30 28 20" stroke="url(#dbLg)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <circle cx="20" cy="20" r="3" fill="url(#dbLg)"/>
                <defs><linearGradient id="dbLg" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#6C63FF"/><stop offset="1" stopColor="#00D4AA"/></linearGradient></defs>
              </svg>
            </div>
            <span className="logo-text">مدى السمع</span>
          </div>
        </div>

        <nav className="db-menu">
          <button className={`menu-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            الرئيسية
          </button>
          <button className={`menu-item ${activeTab === 'audiogram' ? 'active' : ''}`} onClick={() => setActiveTab('audiogram')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            الملف السمعي التفاعلي
          </button>
          <button className={`menu-item ${activeTab === 'browser' ? 'active' : ''}`} onClick={() => setActiveTab('browser')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            المستعرض الذكي (Mada Browser)
          </button>
          <button className={`menu-item ${activeTab === 'lectures' ? 'active' : ''}`} onClick={() => setActiveTab('lectures')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            سجل المحاضرات والترجمة
          </button>
          <button className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            الإعدادات الصوتية
          </button>
          <button className={`menu-item ${activeTab === 'community' ? 'active' : ''}`} onClick={() => setActiveTab('community')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
            مجتمع الدعم
          </button>
          <button className={`menu-item ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            قاعدة البيانات (MySQL)
          </button>
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">ع</div>
          <div className="user-info">
            <span className="user-name">علي أحمد</span>
            <span className="user-status-text">سمع متوسط الشدة</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="db-main">
        
        {/* Header / Topbar */}
        <header className="db-header">
          <div className="header-left">
            <h2>
              {activeTab === 'home' && 'الرئيسية'}
              {activeTab === 'audiogram' && 'الملف السمعي التفاعلي'}
              {activeTab === 'browser' && 'المستعرض الذكي (Mada Browser)'}
              {activeTab === 'lectures' && 'سجل المحاضرات والترجمة'}
              {activeTab === 'settings' && 'الإعدادات الصوتية'}
              {activeTab === 'community' && 'مجتمع الدعم'}
              {activeTab === 'database' && 'لوحة تحكم قاعدة البيانات (phpMyAdmin)'}
            </h2>
          </div>
          <div className="header-right">
            <button className="icon-btn" onClick={showNotifications} title="التنبيهات">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="btn-dot"></span>
            </button>
            <button className="btn-primary" onClick={startLiveSession} style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
              بدء جلسة مباشرة
            </button>
          </div>
        </header>

        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <section className="tab-content active">
            <div className="live-status-card">
              <div className="live-status-info">
                <span className="live-pulse-dot"></span>
                <div>
                  <h3>مستوى الضوضاء المحيطة: هادئ (32 dB)</h3>
                  <p>النظام يُعدل الأصوات الآن تلقائياً لتحسين الفهم.</p>
                </div>
              </div>
              <div className="live-status-actions">
                <span className="badge-status status-active">الخدمة متصلة بالهاتف والكمبيوتر</span>
              </div>
            </div>

            <div className="stats-row">
              <div className="stat-card-widget">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--primary)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div className="stat-widget-info">
                  <span className="stat-title">جلسات اليوم</span>
                  <span className="stat-value">4 جلسات</span>
                  <span className="stat-sub">إجمالي 3.2 ساعة معالجة</span>
                </div>
              </div>
              
              <div className="stat-card-widget">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(0,212,170,0.15)', color: 'var(--accent)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div className="stat-widget-info">
                  <span className="stat-title">نسبة وضوح الفهم</span>
                  <span className="stat-value">94%</span>
                  <span className="stat-sub">زيادة 40% مقارنة بالوضع العادي</span>
                </div>
              </div>

              <div className="stat-card-widget">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(255,165,0,0.15)', color: '#ffa500' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </div>
                <div className="stat-widget-info">
                  <span className="stat-title">تفريغ المحاضرات</span>
                  <span className="stat-value">12 محاضرة</span>
                  <span className="stat-sub">تم حفظها وتلخيصها بالكامل</span>
                </div>
              </div>
            </div>

            <div className="grid-layout">
              <div className="db-card flex-2">
                <div className="card-header-flex">
                  <h3>آخر الجلسات والمحاضرات</h3>
                  <button className="card-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setActiveTab('lectures')}>عرض الكل</button>
                </div>
                <div className="sessions-list">
                  {Object.entries(lectureData).map(([id, data]) => (
                    <div key={id} className="session-row-item" onClick={() => { setActiveLectureId(id); setActiveTab('lectures'); }}>
                      <div className="session-info">
                        <h4>{data.title}</h4>
                        <span>{data.meta.split(' • ')[0]} • {data.meta.split(' • ')[2]}</span>
                      </div>
                      <div className="session-badge-wrap">
                        <span className="badge-status status-summary">جاهز للتلخيص</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="db-card">
                <h3>الوضع السمعي الحالي</h3>
                <div className="audiogram-preview-box">
                  <div className="preview-chart-container">
                    <canvas ref={previewCanvasRef} style={{ width: '100%', height: '100%' }}></canvas>
                  </div>
                  <p className="audiogram-desc-txt">تم تحسين الصوت لتضخيم النطاقات المتوسطة (تجاوب إيجابي مع الترددات 1000Hz - 4000Hz).</p>
                  <button className="btn-secondary w-full" onClick={() => setActiveTab('audiogram')}>تحديث الفحص أو تعديله</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: AUDIOGRAM */}
        {activeTab === 'audiogram' && (
          <section className="tab-content active">
            <div className="db-card">
              <div className="card-header-flex">
                <div>
                  <h3>اختبار السمع الذكي والتفاعلي</h3>
                  <p>قم بقياس مستوى السمع لبناء وضبط الفلتر الصوتي المناسب لك بدقة.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setTestMode('speaker')}
                      style={{
                        padding: '8px 16px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                        background: testMode === 'speaker' ? 'var(--gradient)' : 'var(--bg-card)',
                        color: testMode === 'speaker' ? 'white' : 'var(--text-secondary)',
                        border: testMode === 'speaker' ? 'none' : '1px solid var(--border)',
                        transition: 'var(--transition)'
                      }}
                    >
                      🔊 بدون سماعة
                    </button>
                    <button
                      onClick={() => setTestMode('headphones')}
                      style={{
                        padding: '8px 16px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                        background: testMode === 'headphones' ? 'var(--gradient)' : 'var(--bg-card)',
                        color: testMode === 'headphones' ? 'white' : 'var(--text-secondary)',
                        border: testMode === 'headphones' ? 'none' : '1px solid var(--border)',
                        transition: 'var(--transition)'
                      }}
                    >
                      🎧 مع سماعة
                    </button>
                  </div>
                  <button className="btn-primary" onClick={startHearingTest}>بدء اختبار سمع جديد</button>
                </div>
              </div>
              
              <div className="audiogram-workspace">
                <div className="audiogram-chart-card">
                  <h4>مخطط السمع الحالي (Audiogram)</h4>
                  <div className="canvas-holder">
                    <canvas ref={fullCanvasRef} style={{ width: '100%', height: '300px' }}></canvas>
                  </div>
                  <div className="chart-legend">
                    <span className="legend-item"><span className="legend-color right-ear"></span>الأذن اليمنى (R)</span>
                    <span className="legend-item"><span className="legend-color left-ear"></span>الأذن اليسرى (L)</span>
                  </div>
                </div>

                <div className="audiogram-details-card">
                  <h4>حالة السمع المحسوبة</h4>
                  <div className="ear-status-boxes">
                    <div className="ear-status-box">
                      <h5>الأذن اليمنى</h5>
                      <span className="ear-db-loss">{rightAvg} dB loss</span>
                      <span className="ear-grade grade-moderate">فقدان سمع متوسط</span>
                    </div>
                    <div className="ear-status-box">
                      <h5>الأذن اليسرى</h5>
                      <span className="ear-db-loss">{leftAvg} dB loss</span>
                      <span className="ear-grade grade-moderate">فقدان سمع متوسط</span>
                    </div>
                  </div>

                  <div className="audiogram-tips">
                    <h5>توصيات نظام مدى السمع الذكي:</h5>
                    <ul>
                      <li>تم تطبيق فلتر تضخيم الترددات العالية لحماية الأذن من الإجهاد.</li>
                      <li>تجنب رفع الصوت الكلي للجهاز فوق 80%؛ فلتر التضخيم التلقائي سيعمل على توضيح الكلام بدون زيادة الضغط.</li>
                      <li>يُنصح بإعادة إجراء الفحص مرة كل شهر لتتبع أي تغيرات.</li>
                    </ul>
                    <button className="btn-secondary w-full" onClick={shareWithDoctor}>مشاركة التقرير السمعي مع طبيبك المختص</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB: MADA BROWSER SANDBOX */}
        {activeTab === 'browser' && (
          <section className="tab-content active">
            <div className="browser-container">
              
              {/* Browser Header Bar */}
              <div className="browser-chrome">
                <button 
                  className="browser-nav-btn" 
                  onClick={() => {
                    if (browserPage !== 'home') {
                      // Disconnect audio sources on exit
                      if (ytAudioRef.current) ytAudioRef.current.pause();
                      if (teamsAudioRef.current) teamsAudioRef.current.pause();
                      setYtPlaying(false);
                      setTeamsJoined(false);
                      setBrowserPage('home');
                      setWikiSelectedTerm(null);
                      setCustomYtId('');
                      setYtUrlInput('');
                      setBrowserUrlInput('https://mada.browser/dashboard');
                      setBrowserSearchInput('');
                    }
                  }} 
                  title="الرئيسية"
                >
                  🏠
                </button>
                <button className="browser-nav-btn" onClick={() => alert('المستعرض الذكي يمنع التنقل للخلف لأسباب أمنية للنموذج الأولي.')}>↩</button>
                <div className="browser-url-bar" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', opacity: 0.8, whiteSpace: 'nowrap' }}>🔒 Secure Sandbox •</span>
                  <input
                    type="text"
                    value={browserUrlInput}
                    onChange={(e) => setBrowserUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleBrowserNavigate(browserUrlInput);
                      }
                    }}
                    placeholder="ابحث في Google أو أدخل رابط موقع هنا..."
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      width: '100%',
                      fontSize: '0.85rem',
                      outline: 'none',
                      fontFamily: 'monospace',
                      direction: 'ltr',
                      textAlign: 'left'
                    }}
                  />
                </div>
              </div>

              {/* Browser Main Canvas */}
              <div className="browser-content">
                
                {/* 1. BROWSER HOME */}
                {browserPage === 'home' && (
                  <div className="browser-home" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px', padding: '20px 10px' }}>
                    
                    {/* Google Search Bar Simulation */}
                    <div style={{ maxWidth: '580px', margin: '0 auto 32px auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '2.8rem', fontWeight: 'bold', fontFamily: 'Tajawal, sans-serif' }}>
                        <span style={{ color: '#4285F4' }}>G</span>
                        <span style={{ color: '#EA4335' }}>o</span>
                        <span style={{ color: '#FBBC05' }}>o</span>
                        <span style={{ color: '#4285F4' }}>g</span>
                        <span style={{ color: '#34A853' }}>l</span>
                        <span style={{ color: '#EA4335' }}>e</span>
                        <span style={{ fontSize: '0.75rem', background: 'var(--gradient)', padding: '2px 8px', borderRadius: '4px', color: '#fff', marginLeft: '8px', fontWeight: 'normal', fontFamily: 'sans-serif' }}>Mada Sandbox</span>
                      </div>
                      
                      <div style={{ position: 'relative', width: '100%' }}>
                        <input
                          type="text"
                          placeholder="ابحث في Google أو اكتب عنوان ويب..."
                          value={browserSearchInput}
                          onChange={(e) => setBrowserSearchInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleBrowserNavigate(browserSearchInput);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '14px 20px 14px 48px',
                            borderRadius: '30px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid var(--border)',
                            color: '#fff',
                            fontSize: '1rem',
                            outline: 'none',
                            textAlign: 'right',
                            transition: 'all 0.3s ease',
                          }}
                        />
                        <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', opacity: 0.6 }}>🔍</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => handleBrowserNavigate(browserSearchInput)}
                          style={{ padding: '8px 24px', borderRadius: '20px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
                        >
                          بحث Google
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            handleBrowserNavigate('يوتيوب');
                          }}
                          style={{ padding: '8px 24px', borderRadius: '20px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
                        >
                          ضربة حظ
                        </button>
                      </div>
                    </div>

                    <div className="browser-tiles-grid" style={{ marginTop: '10px' }}>
                      <div className="browser-tile" onClick={() => { setBrowserPage('youtube'); setBrowserUrlInput('https://www.youtube.com/mada-hearing-hub'); }}>
                        <span className="tile-icon">🎬</span>
                        <h4>موقع YouTube</h4>
                        <span>مشاهدة مقاطع الفيديو الحقيقية والمقترحة</span>
                      </div>
                      <div className="browser-tile" onClick={() => { setBrowserPage('teams'); setBrowserUrlInput('https://teams.microsoft.com/meeting/room-203'); }}>
                        <span className="tile-icon">👥</span>
                        <h4>Microsoft Teams</h4>
                        <span>فصول دراسية وااجتماعات مباشرة</span>
                      </div>
                      <div className="browser-tile" onClick={() => { setBrowserPage('wiki'); setBrowserUrlInput('https://ar.wikipedia.org/wiki/Sensorineural_Hearing_Loss'); }}>
                        <span className="tile-icon">📝</span>
                        <h4>Wikipedia (مساعد القراءة)</h4>
                        <span>الموسوعة الحرة مع التلخيص</span>
                      </div>
                      <div className="browser-tile" onClick={() => { setBrowserPage('facebook'); setBrowserSubpage('login'); setBrowserUrlInput('https://www.facebook.com/login'); }}>
                        <span className="tile-icon">📘</span>
                        <h4>Facebook</h4>
                        <span>تسجيل الدخول ومتابعة المنشورات</span>
                      </div>
                      <div className="browser-tile" onClick={() => { setBrowserPage('instagram'); setBrowserSubpage('login'); setBrowserUrlInput('https://www.instagram.com/accounts/login'); }}>
                        <span className="tile-icon">📸</span>
                        <h4>Instagram</h4>
                        <span>مشاهدة مقاطع الريلز المترجمة</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1.5 GOOGLE SEARCH RESULTS SIMULATION */}
                {browserPage === 'search' && (
                  <div className="google-search-results" style={{ padding: '20px', direction: 'rtl', textAlign: 'right', color: '#e8eaed', width: '100%' }}>
                    {/* Google Search Results Header */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '1.6rem', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => { setBrowserPage('home'); setBrowserUrlInput('https://mada.browser/dashboard'); }}>
                        <span style={{ color: '#4285F4' }}>G</span>
                        <span style={{ color: '#EA4335' }}>o</span>
                        <span style={{ color: '#FBBC05' }}>o</span>
                        <span style={{ color: '#4285F4' }}>g</span>
                        <span style={{ color: '#34A853' }}>l</span>
                        <span style={{ color: '#EA4335' }}>e</span>
                      </div>
                      
                      <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
                        <input
                          type="text"
                          value={browserSearchInput}
                          onChange={(e) => setBrowserSearchInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleBrowserNavigate(browserSearchInput);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 40px 10px 15px',
                            borderRadius: '24px',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid var(--border)',
                            color: '#fff',
                            fontSize: '0.95rem',
                            outline: 'none',
                          }}
                        />
                        <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', opacity: 0.6 }}>🔍</span>
                      </div>
                    </div>

                    {/* Search Stats */}
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>
                      حوالي 5 نتائج بحث لـ "{browserSearchQuery}" داخل بيئة مدى السمع الآمنة (في 0.12 ثانية)
                    </p>

                    {/* Custom query alert if unrelated */}
                    {!['يوتيوب', 'youtube', 'فيس', 'facebook', 'إنستغرام', 'instagram', 'تيمز', 'teams', 'ويكيبيديا', 'wiki'].some(kw => browserSearchQuery.toLowerCase().includes(kw)) && (
                      <div style={{ background: 'rgba(251,188,5,0.08)', border: '1px solid rgba(251,188,5,0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.85rem', color: '#FBBC05' }}>
                        ⚠️ لم نجد نتائج تطابق "{browserSearchQuery}" في الويب الخارجي بسبب قيود المتصفح الأمنية (CORS). لقد تم تصفية النتائج لعرض المواقع المدعومة داخل المنصة الحائزة على شهادة التوافق لتجربة فلاتر الصوت والترجمة.
                      </div>
                    )}

                    {/* Results List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', maxWidth: '650px' }}>
                      
                      {/* Result 1: YouTube */}
                      <div className="search-result-item" style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>https://www.youtube.com &gt; mada-hearing-hub</span>
                        <a href="#youtube" onClick={(e) => { e.preventDefault(); setBrowserPage('youtube'); setBrowserUrlInput('https://www.youtube.com/mada-hearing-hub'); }} style={{ color: '#8ab4f8', fontSize: '1.2rem', textDecoration: 'none', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                          مشغل YouTube الذكي - محاضرات وفيديوهات مع ترجمة مدى السمع
                        </a>
                        <p style={{ color: '#bdc1c6', fontSize: '0.88rem', margin: 0, lineHeight: '1.6' }}>
                          شاهد فيديوهات يوتيوب مع تفعيل الترجمة الفورية بالذكاء الاصطناعي ومعالجة الترددات السمعية في الوقت الفعلي. يمكنك أيضاً لصق أي رابط فيديو خارجي لتشغيله وترجمته مباشرة.
                        </p>
                      </div>

                      {/* Result 2: Teams */}
                      <div className="search-result-item" style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>https://teams.microsoft.com &gt; meeting-room</span>
                        <a href="#teams" onClick={(e) => { e.preventDefault(); setBrowserPage('teams'); setBrowserUrlInput('https://teams.microsoft.com/meeting/room-203'); }} style={{ color: '#8ab4f8', fontSize: '1.2rem', textDecoration: 'none', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                          Microsoft Teams Live Meeting - اجتماعات وحصص دراسية مباشرة
                        </a>
                        <p style={{ color: '#bdc1c6', fontSize: '0.88rem', margin: 0, lineHeight: '1.6' }}>
                          انضم إلى الفصل الدراسي الافتراضي للدكتورة سارة. يتم ترجمة الكلام فورياً مع رصد مشاعر المتحدثين وعرض ملخص آلي للاجتماع لتسهيل متابعة ذوي الإعاقة السمعية.
                        </p>
                      </div>

                      {/* Result 3: Facebook */}
                      <div className="search-result-item" style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>https://www.facebook.com &gt; mada-hearing</span>
                        <a href="#facebook" onClick={(e) => { e.preventDefault(); setBrowserPage('facebook'); setBrowserSubpage('login'); setBrowserUrlInput('https://www.facebook.com/login'); }} style={{ color: '#8ab4f8', fontSize: '1.2rem', textDecoration: 'none', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                          تسجيل الدخول إلى Facebook - مجتمع مدى السمع التفاعلي
                        </a>
                        <p style={{ color: '#bdc1c6', fontSize: '0.88rem', margin: 0, lineHeight: '1.6' }}>
                          تسجيل دخول آمن للنسخة المحاكية من فيسبوك. استمع للمنشورات الصوتية المفلترة والترجمة الفورية للنصوص المصاحبة دون القلق من الخصوصية أو قيود النوافذ.
                        </p>
                      </div>

                      {/* Result 4: Instagram */}
                      <div className="search-result-item" style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>https://www.instagram.com &gt; mada-reels</span>
                        <a href="#instagram" onClick={(e) => { e.preventDefault(); setBrowserPage('instagram'); setBrowserSubpage('login'); setBrowserUrlInput('https://www.instagram.com/accounts/login'); }} style={{ color: '#8ab4f8', fontSize: '1.2rem', textDecoration: 'none', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                          Instagram Reels - مشاهدة مقاطع الريلز القصيرة المترجمة
                        </a>
                        <p style={{ color: '#bdc1c6', fontSize: '0.88rem', margin: 0, lineHeight: '1.6' }}>
                          واجهة انستغرام التوضيحية لتجربة الترجمة التلقائية المدمجة على مقاطع الريلز. استمع للأصوات بوضوح عبر تضخيم النطق البشري وقمع الضوضاء.
                        </p>
                      </div>

                      {/* Result 5: Wikipedia */}
                      <div className="search-result-item" style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>https://ar.wikipedia.org &gt; wiki</span>
                        <a href="#wiki" onClick={(e) => { e.preventDefault(); setBrowserPage('wiki'); setBrowserUrlInput('https://ar.wikipedia.org/wiki/Sensorineural_Hearing_Loss'); }} style={{ color: '#8ab4f8', fontSize: '1.2rem', textDecoration: 'none', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                          ويكيبيديا، الموسوعة الحرة - مقال ضعف السمع الحسي العصبي
                        </a>
                        <p style={{ color: '#bdc1c6', fontSize: '0.88rem', margin: 0, lineHeight: '1.6' }}>
                          اقرأ المقال الطبي الكامل حول ضعف السمع الحسي العصبي، وتفاعل مع المساعد القرائي لشرح المصطلحات الطبية المعقدة بمجرد النقر عليها.
                        </p>
                      </div>

                    </div>
                  </div>
                )}

                {/* 2. YOUTUBE PLAYER */}
                {browserPage === 'youtube' && (
                  <div className="youtube-layout" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                    
                    {/* YouTube custom search / link paste bar */}
                    <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <input
                        type="text"
                        placeholder="🔍 الصق أي رابط فيديو يوتيوب هنا لتشغيله وترجمته مباشرة..."
                        value={ytUrlInput}
                        onChange={(e) => setYtUrlInput(e.target.value)}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: '#fff', fontSize: '0.9rem' }}
                      />
                      <button
                        className="btn-primary"
                        onClick={() => {
                          if (!ytUrlInput) {
                            alert('يرجى إدخال رابط يوتيوب صالح أولاً.');
                            return;
                          }
                          const videoId = getYoutubeId(ytUrlInput);
                          if (videoId) {
                            setCustomYtId(videoId);
                            setActiveYtVideo({
                              id: videoId,
                              title: 'فيديو يوتيوب خارجي',
                              author: 'قناة يوتيوب الحرة',
                              views: 'مشاهدة حية',
                              duration: '0:00',
                              audioUrl: '',
                              captions: []
                            });
                            setYtPlaying(true);
                            setYtCurrentTime(0);
                            setCustomYtTimer(0);
                          } else {
                            alert('تعذر استخراج رقم الفيديو من الرابط. تأكد من أن الرابط يوتيوب صالح (مثال: https://www.youtube.com/watch?v=...).');
                          }
                        }}
                        style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                      >
                        تشغيل الفيديو
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px', width: '100%' }}>
                      
                      <div className="youtube-player-container">
                        <div className="video-player-canvas-sim">
                          {customYtId ? (
                            /* REAL YOUTUBE PLAYER EMBED */
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${customYtId}?autoplay=1&enablejsapi=1`}
                              title="YouTube video player"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              style={{ border: 'none' }}
                            ></iframe>
                          ) : activeYtVideo ? (
                            /* Simulated Local player */
                            <img 
                              src={activeYtVideo.poster} 
                              alt="video-poster" 
                              className="sim-video-element"
                            />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                              <span style={{ fontSize: '3rem', marginBottom: '10px' }}>📺</span>
                              <span>يرجى اختيار محاضرة أو لصق رابط للبدء</span>
                            </div>
                          )}

                          {/* Speech Caption Overlay */}
                          {ytPlaying && activeYtVideo && toggles.liveCaptions && (
                            <div className="sim-video-overlay-captions">
                              {getActiveYtCaption()}
                            </div>
                          )}

                          {/* Hidden Audio element linked to DSP (only for preset videos) */}
                          {activeYtVideo && !customYtId && (
                            <audio
                              ref={ytAudioRef}
                              src={activeYtVideo.audioUrl}
                              onTimeUpdate={handleYtTimeUpdate}
                              onPlay={() => { initYtAudioDSP(); setYtPlaying(true); }}
                              onPause={() => setYtPlaying(false)}
                              onEnded={() => setYtPlaying(false)}
                              style={{ display: 'none' }}
                            />
                          )}
                        </div>

                        {activeYtVideo && (
                          <div className="video-detail-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{activeYtVideo.title}</h4>
                              
                              {customYtId ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.8rem', background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(0,212,170,0.2)' }}>
                                    ⚡ الترجمة الفورية والـ DSP مفعلة
                                  </span>
                                </div>
                              ) : (
                                <button 
                                  className="btn-primary" 
                                  onClick={() => {
                                    if (ytAudioRef.current) {
                                      if (ytPlaying) {
                                        ytAudioRef.current.pause();
                                      } else {
                                        initYtAudioDSP();
                                        ytAudioRef.current.play();
                                      }
                                    }
                                  }}
                                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                >
                                  {ytPlaying ? '⏸️ إيقاف مؤقت' : '▶️ تشغيل المحاضرة'}
                                </button>
                              )}
                            </div>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{activeYtVideo.author} • {activeYtVideo.views}</p>
                          </div>
                        )}
                      </div>

                      <div className="youtube-sidebar">
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>💡 محاضرات مقترحة:</h4>
                        {ytVideoData.map(video => (
                          <div 
                            key={video.id} 
                            className={`yt-sidebar-item ${activeYtVideo?.id === video.id && !customYtId ? 'active' : ''}`}
                            onClick={() => {
                              if (ytAudioRef.current) ytAudioRef.current.pause();
                              setYtPlaying(false);
                              setYtCurrentTime(0);
                              setCustomYtId('');
                              setActiveYtVideo(video);
                            }}
                          >
                            <div className="yt-thumb-sim">
                              <span>▶️</span>
                            </div>
                            <div className="yt-sidebar-info">
                              <h5>{video.title}</h5>
                              <span>{video.author}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                )}

                {/* 3. MICROSOFT TEAMS SIMULATION */}
                {browserPage === 'teams' && (
                  <div className="teams-layout">
                    
                    <div className="teams-call-workspace">
                      <div className="teams-grid-sim">
                        
                        <div className={`teams-participant-card ${teamsJoined && activeTeamsCap.speaker.includes('سارة') ? 'speaking' : ''}`}>
                          <div className="teams-avatar-sim">س</div>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>الدكتورة سارة</span>
                          <span className="teams-name-label">🔊 المحاضِرة</span>
                        </div>

                        <div className={`teams-participant-card ${teamsJoined && activeTeamsCap.speaker.includes('خالد') ? 'speaking' : ''}`}>
                          <div className="teams-avatar-sim" style={{ background: '#ffa500' }}>خ</div>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>خالد العلي</span>
                          <span className="teams-name-label">🎓 طالب</span>
                        </div>

                        <div className="teams-participant-card">
                          <div className="teams-avatar-sim" style={{ background: 'var(--accent)' }}>ع</div>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>علي أحمد (أنت)</span>
                          <span className="teams-name-label">👤 طالب</span>
                        </div>

                      </div>

                      {/* Floating captions overlay inside teams */}
                      {teamsJoined && toggles.liveCaptions && (
                        <div className="teams-captions-overlay">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: '600' }}>
                              🎙️ {activeTeamsCap.speaker}
                            </span>
                            {toggles.emotionIndicator && (
                              <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                                نبرة الصوت: {activeTeamsCap.tone}
                              </span>
                            )}
                          </div>
                          <p className="teams-caption-line">{activeTeamsCap.text}</p>
                        </div>
                      )}

                      {/* Hidden audio for teams */}
                      <audio
                        ref={teamsAudioRef}
                        src="https://ia802508.us.archive.org/5/items/testmp3testfile/mpthreetest.mp3"
                        style={{ display: 'none' }}
                      />

                      <div style={{ display: 'flex', gap: '10px' }}>
                        {!teamsJoined ? (
                          <button 
                            className="btn-primary w-full" 
                            onClick={() => {
                              setTeamsJoined(true);
                              if (teamsAudioRef.current) {
                                initTeamsAudioDSP();
                                teamsAudioRef.current.loop = true;
                                teamsAudioRef.current.play();
                              }
                            }}
                          >
                            📞 انضمام للمحاضرة المباشرة
                          </button>
                        ) : (
                          <button 
                            className="btn-primary w-full" 
                            onClick={() => {
                              setTeamsJoined(false);
                              if (teamsAudioRef.current) teamsAudioRef.current.pause();
                            }}
                            style={{ background: '#ff4444' }}
                          >
                            🔴 مغادرة الاجتماع
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="teams-summary-panel">
                      <div className="db-card">
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: 'var(--accent)' }}>💡 ملخص المحادثة (الذكاء الاصطناعي):</h4>
                        <ul style={{ paddingRight: '15px', margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                          <li style={{ marginBottom: '6px' }}>بدأ الاجتماع اليوم للتركيز على مهارات هندسة البرمجيات.</li>
                          <li style={{ marginBottom: '6px' }}><strong>المحور المباشر:</strong> مناقشة جمع المتطلبات وأهمية التواصل.</li>
                          <li>سأل الطالب خالد عن أساليب الاستقصاء والمقابلة مع العميل.</li>
                        </ul>
                      </div>
                    </div>

                  </div>
                )}

                {/* 4. WIKIPEDIA READING ASSISTANT */}
                {browserPage === 'wiki' && (
                  <div className="wiki-layout">
                    
                    <div className="wiki-article-view">
                      <h1>{wikiArticle.title}</h1>
                      
                      <p>
                        {wikiArticle.p1.split(/(الأذن الداخلية \(القوقعة\)|العصب السمعي)/).map((part, i) => {
                          if (part === 'الأذن الداخلية (القوقعة)' || part === 'العصب السمعي') {
                            return (
                              <span 
                                key={i} 
                                className="wiki-keyword-highlight"
                                onClick={() => setWikiSelectedTerm(part)}
                              >
                                {part}
                              </span>
                            );
                          }
                          return part;
                        })}
                      </p>

                      <p>{wikiArticle.p2}</p>

                      <p>
                        {wikiArticle.p3.split(/(الترددات العالية)/).map((part, i) => {
                          if (part === 'الترددات العالية') {
                            return (
                              <span 
                                key={i} 
                                className="wiki-keyword-highlight"
                                onClick={() => setWikiSelectedTerm(part)}
                              >
                                {part}
                              </span>
                            );
                          }
                          return part;
                        })}
                      </p>

                      <p>
                        {wikiArticle.p4.split(/(مخطط السمع \(Audiogram\))/).map((part, i) => {
                          if (part === 'مخطط السمع (Audiogram)') {
                            return (
                              <span 
                                key={i} 
                                className="wiki-keyword-highlight"
                                onClick={() => setWikiSelectedTerm(part)}
                              >
                                {part}
                              </span>
                            );
                          }
                          return part;
                        })}
                      </p>
                    </div>

                    <div className="wiki-assistant-panel">
                      
                      <div className="db-card wiki-assistant-card">
                        <h4>💡 مساعد القراءة الذكي</h4>
                        {wikiSelectedTerm ? (
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                              تعريف مصطلح: {wikiSelectedTerm}
                            </span>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.6' }}>
                              {wikiTermDefinitions[wikiSelectedTerm]}
                            </p>
                            <button 
                              className="btn-secondary w-full" 
                              onClick={() => setWikiSelectedTerm(null)}
                              style={{ marginTop: '12px', padding: '4px' }}
                            >
                              إغلاق التعريف
                            </button>
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
                            انقر فوق أي مصطلح طبي مميز بلون أصفر في المقالة لقراءة شرحه المبسط والمفسر هنا فوراً.
                          </p>
                        )}
                      </div>

                      <div className="db-card wiki-assistant-card">
                        <h4>📋 تلخيص فوري للمقالة (AI):</h4>
                        <ul style={{ paddingRight: '15px', margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                          <li style={{ marginBottom: '6px' }}><strong>السبب:</strong> تلف في خلايا القوقعة أو العصب السمعي.</li>
                          <li style={{ marginBottom: '6px' }}><strong>العرض الرئيسي:</strong> صعوبة سماع الأصوات الحادة والترددات المرتفعة.</li>
                          <li><strong>علاج مدى:</strong> تضخيم مخصص للترددات المفقودة وفلترة الضوضاء المحيطة.</li>
                        </ul>
                      </div>

                    </div>

                  </div>
                )}

                {/* 5. FACEBOOK SIMULATOR */}
                {browserPage === 'facebook' && (
                  <div style={{ padding: '40px 20px', maxWidth: '400px', margin: '0 auto', direction: 'rtl' }}>
                    {browserSubpage === 'login' ? (
                      <div style={{ background: '#0d0f26', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px', boxShadow: 'var(--shadow-glow)' }}>
                        <div style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          🔒 وضع المحاكاة الآمن (توضيحي)
                        </div>
                        <h2 style={{ color: '#1877f2', textAlign: 'center', marginBottom: '24px', fontSize: '2.2rem', fontFamily: 'Tajawal, sans-serif', fontWeight: 'bold' }}>facebook</h2>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px', lineHeight: '1.5' }}>
                          أدخل بيانات حسابك للتجربة. في تطبيق سطح المكتب (Electron) يتم فتح حسابك الحقيقي مع تفعيل الترجمة.
                        </p>
                        <input
                          type="text"
                          placeholder="البريد الإلكتروني أو رقم الهاتف"
                          value={fbEmail}
                          onChange={(e) => setFbEmail(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', marginBottom: '12px', fontSize: '0.9rem' }}
                        />
                        <input
                          type="password"
                          placeholder="كلمة السر"
                          value={fbPass}
                          onChange={(e) => setFbPass(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', marginBottom: '18px', fontSize: '0.9rem' }}
                        />
                        <button
                          className="btn-primary"
                          onClick={() => {
                            if (!fbEmail || !fbPass) {
                              alert('يرجى إدخال البريد الإلكتروني وكلمة السر لتسجيل الدخول التجريبي.');
                              return;
                            }
                            setBrowserSubpage('feed');
                            setTeamsTime(0);
                            // Auto-trigger sound loop inside feed for demo
                            if (teamsAudioRef.current) {
                              initTeamsAudioDSP();
                              teamsAudioRef.current.loop = true;
                              teamsAudioRef.current.play();
                            }
                          }}
                          style={{ width: '100%', background: '#1877f2', padding: '12px', fontWeight: 'bold', fontSize: '1rem', border: 'none' }}
                        >
                          تسجيل الدخول
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#0a0d22', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', minHeight: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                          <span style={{ fontWeight: 'bold', color: '#1877f2' }}>📘 Facebook Home Feed</span>
                          <span style={{ fontSize: '0.8rem', background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '12px' }}>
                            {fbEmail}
                          </span>
                        </div>
                        
                        {/* Simulated Post with Voice Player */}
                        <div style={{ background: '#11152d', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>F</div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>مؤسسة مدى للحلول المساعدة</h4>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>منذ 5 دقائق • 🌐</span>
                            </div>
                          </div>
                          
                          <p style={{ fontSize: '0.85rem', color: '#fff', lineHeight: '1.6', marginBottom: '12px' }}>
                            قمنا اليوم بنشر هذا المقطع الصوتي لشرح تقنية معالجة الإشارة الصوتية. انقر فوق زر "تشغيل الصوت" بالأسفل لسماعه ومراقبة الترجمة التلقائية الذكية لمدى السمع!
                          </p>

                          {/* Audio Player embedded inside Post */}
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🔊 صوت توضيحي مدمج (DSP Active)</span>
                            <button
                              className="btn-primary"
                              onClick={() => {
                                if (teamsAudioRef.current) {
                                  if (teamsAudioRef.current.paused) {
                                    initTeamsAudioDSP();
                                    teamsAudioRef.current.play();
                                  } else {
                                    teamsAudioRef.current.pause();
                                  }
                                }
                              }}
                              style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--accent)', border: 'none' }}
                            >
                              تشغيل / كتم الصوت
                            </button>
                          </div>

                          {/* Floating Captions Overlay for Facebook Post */}
                          {toggles.liveCaptions && (
                            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '6px', padding: '12px', fontSize: '0.85rem', color: 'var(--accent)', minHeight: '50px', lineHeight: '1.5' }}>
                              💬 <strong>ترجمة مدى التلقائية:</strong> {teamsTime % 30 < 8 ? 'أهلاً بكم في هذا البث الصوتي المباشر عبر منصة فيسبوك.' : teamsTime % 30 < 18 ? 'شاهد كيف تتعرف تقنيات الذكاء الاصطناعي على الكلمات وتفرغها على الشاشة مباشرة.' : 'يمكنك تعديل أشرطة الفلاتر في تبويب الإعدادات لتنقية الصوت الحي وسماع التغيير.'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. INSTAGRAM SIMULATOR */}
                {browserPage === 'instagram' && (
                  <div style={{ padding: '40px 20px', maxWidth: '400px', margin: '0 auto', direction: 'rtl' }}>
                    {browserSubpage === 'login' ? (
                      <div style={{ background: '#0d0f26', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px', boxShadow: 'var(--shadow-glow)' }}>
                        <div style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          🔒 وضع المحاكاة الآمن (توضيحي)
                        </div>
                        <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '24px', fontSize: '2.2rem', fontFamily: 'Tajawal, sans-serif', fontWeight: 'bold', background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Instagram</h2>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px', lineHeight: '1.5' }}>
                          قم بتسجيل دخول تجريبي لعرض مقاطع الريلز وتجربة الترجمة التلقائية المدمجة.
                        </p>
                        <input
                          type="text"
                          placeholder="اسم المستخدم أو الهاتف أو البريد"
                          value={igUser}
                          onChange={(e) => setIgUser(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', marginBottom: '12px', fontSize: '0.9rem' }}
                        />
                        <input
                          type="password"
                          placeholder="كلمة السر"
                          value={igPass}
                          onChange={(e) => setIgPass(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', marginBottom: '18px', fontSize: '0.9rem' }}
                        />
                        <button
                          className="btn-primary"
                          onClick={() => {
                            if (!igUser || !igPass) {
                              alert('يرجى إدخال اسم المستخدم وكلمة السر لتسجيل الدخول التجريبي.');
                              return;
                            }
                            setBrowserSubpage('feed');
                            setTeamsTime(0);
                            if (teamsAudioRef.current) {
                              initTeamsAudioDSP();
                              teamsAudioRef.current.loop = true;
                              teamsAudioRef.current.play();
                            }
                          }}
                          style={{ width: '100%', background: 'var(--gradient)', padding: '12px', fontWeight: 'bold', fontSize: '1rem', border: 'none' }}
                        >
                          تسجيل الدخول
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', background: '#0a0d22', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', minHeight: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                          <span style={{ fontWeight: 'bold', color: '#e1306c' }}>📸 Instagram Reels</span>
                          <span style={{ fontSize: '0.8rem', background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '12px' }}>
                            @{igUser}
                          </span>
                        </div>
                        
                        {/* Simulated Reel Card */}
                        <div style={{ background: '#11152d', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', position: 'relative' }}>
                          <div style={{ width: '100%', height: '320px', background: '#000', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', marginBottom: '12px' }}>
                            <span style={{ fontSize: '3rem', animation: 'pulse 1.2s infinite' }}>🎥</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>بث مقطع ريلز نشط...</span>
                            
                            {/* Float Caption on top of Reel */}
                            {toggles.liveCaptions && (
                              <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', background: 'rgba(0,0,0,0.85)', border: '1.5px solid var(--accent)', color: '#fff', borderRadius: '6px', padding: '8px', fontSize: '0.82rem', textAlign: 'center' }}>
                                💬 [ترجمة مدى]: {teamsTime % 30 < 8 ? 'أهلاً بكم في هذا الريلز المترجم تلقائياً حياً!' : teamsTime % 30 < 18 ? 'شاهدوا الفلاتر الصوتية المخصصة تضخم نبرة الكلام وتعزل الضجيج.' : 'لا تنسوا الضغط على زر الإعجاب والمتابعة لمزيد من المقاطع!'}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                              className="btn-primary"
                              onClick={() => {
                                if (teamsAudioRef.current) {
                                  if (teamsAudioRef.current.paused) {
                                    initTeamsAudioDSP();
                                    teamsAudioRef.current.play();
                                  } else {
                                    teamsAudioRef.current.pause();
                                  }
                                }
                              }}
                              style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--accent)', border: 'none' }}
                            >
                              تشغيل / كتم الصوت
                            </button>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>❤️ 2.4k Likes</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>
          </section>
        )}

        {/* TAB 3: LECTURES */}
        {activeTab === 'lectures' && (
          <section className="tab-content active">
            <div className="lectures-grid">
              
              {/* Lectures Sidebar */}
              <div className="db-card list-sidebar">
                <div className="search-box-wrap">
                  <input 
                    type="text" 
                    placeholder="البحث في سجل المحاضرات..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="lecture-list-items">
                  {Object.entries(lectureData)
                    .filter(([_, data]) => data.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(([id, data]) => (
                      <div 
                        key={id} 
                        className={`lecture-item ${activeLectureId === id ? 'active' : ''}`}
                        onClick={() => { setActiveLectureId(id); setRevealedAnswers(new Set()); }}
                      >
                        <h4>{data.title}</h4>
                        <p>{data.meta.split(' • ')[0]}</p>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Lecture Transcript Content */}
              <div className="db-card main-transcript-view">
                <div className="transcript-header">
                  <div className="header-info">
                    <h3>{lectureData[activeLectureId]?.title}</h3>
                    <p>{lectureData[activeLectureId]?.meta}</p>
                  </div>
                  <div className="header-actions">
                    <button className="btn-secondary" onClick={() => alert('تم تصدير ملف التفريغ بصيغة PDF بنجاح.')} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>تصدير PDF</button>
                  </div>
                </div>

                <div className="transcript-tabs">
                  <button className={`tr-tab ${activeSubtab === 'text' ? 'active' : ''}`} onClick={() => setActiveSubtab('text')}>التفريغ الكامل للنص</button>
                  <button className={`tr-tab ${activeSubtab === 'summary' ? 'active' : ''}`} onClick={() => setActiveSubtab('summary')}>الملخص الذكي (AI)</button>
                  <button className={`tr-tab ${activeSubtab === 'questions' ? 'active' : ''}`} onClick={() => setActiveSubtab('questions')}>أسئلة مراجعة تلقائية</button>
                  <button className={`tr-tab ${activeSubtab === 'notes' ? 'active' : ''}`} onClick={() => setActiveSubtab('notes')}>📝 ملاحظاتي الدراسية (MySQL)</button>
                </div>

                {activeSubtab === 'text' && (
                  <div className="transcript-tab-body active">
                    <div className="transcript-scroller">
                      {lectureData[activeLectureId]?.bubbles.map((b, index) => (
                        <div key={index} className={`chat-bubble speaker-${b.role}`}>
                          <span className="bubble-speaker">{b.speaker}:</span>
                          <p>{b.text}</p>
                          <span className="bubble-time">{b.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSubtab === 'summary' && (
                  <div className="transcript-tab-body active">
                    <div className="ai-summary-content">
                      <div className="summary-section">
                        <h5>💡 الأفكار الرئيسية في المحاضرة:</h5>
                        <ul>
                          {lectureData[activeLectureId]?.summaryPoints.map((pt, idx) => (
                            <li key={idx} dangerouslySetInnerHTML={{ __html: pt }}></li>
                          ))}
                        </ul>
                      </div>
                      <div className="summary-section">
                        <h5>📋 التوصيات والمهام المطلوبة:</h5>
                        <p>{lectureData[activeLectureId]?.recommendations}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSubtab === 'questions' && (
                  <div className="transcript-tab-body active">
                    <div className="ai-questions-content">
                      {lectureData[activeLectureId]?.questions.map((qObj, index) => (
                        <div key={index} className="question-card">
                          <p className="question-text">{`س${index + 1}: ${qObj.q}`}</p>
                          <button className="btn-show-answer" onClick={() => toggleAnswer(index)}>
                            {revealedAnswers.has(index) ? 'إخفاء الإجابة' : 'إظهار الإجابة النموذجية'}
                          </button>
                          {revealedAnswers.has(index) && (
                            <div className="answer-box active">
                              {`الإجابة: ${qObj.a}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSubtab === 'notes' && (
                  <div className="transcript-tab-body active">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px' }}>
                      <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--accent)' }}>اكتب ملاحظاتك، أسئلتك، أو ملخصك الخاص للمحاضرة:</label>
                      <textarea
                        value={currentNoteText}
                        onChange={(e) => setCurrentNoteText(e.target.value)}
                        placeholder="دون ملاحظاتك هنا... سيتم حفظها وربطها باسم هذه المحاضرة في قاعدة بيانات phpMyAdmin."
                        style={{
                          width: '100%',
                          minHeight: '200px',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '12px',
                          color: '#fff',
                          fontSize: '0.95rem',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'Tajawal, sans-serif',
                          lineHeight: '1.6'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                          className="btn-primary"
                          onClick={saveLectureNote}
                          style={{ padding: '10px 24px', fontSize: '0.9rem' }}
                        >
                          💾 حفظ الملاحظة في قاعدة البيانات
                        </button>
                        {noteSaveStatus && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: '500' }}>
                            {noteSaveStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </section>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <section className="tab-content active">
            <div className="settings-grid">
              <div className="db-card">
                <h3>تخصيص الفلاتر والمعادلة الصوتية</h3>
                <p style={{ marginBottom: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>تحكم في الفلاتر الذكية وطريقة معالجة الصوت على أجهزتك المتصلة.</p>
                
                <div className="settings-slider-group">
                  <div className="slider-item">
                    <div className="slider-labels">
                      <span>تضخيم الترددات العالية (الكلام)</span>
                      <span className="slider-value">{sliders.freqHigh}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={sliders.freqHigh} 
                      onChange={(e) => setSliders({ ...sliders, freqHigh: e.target.value })} 
                      className="custom-slider" 
                    />
                  </div>

                  <div className="slider-item">
                    <div className="slider-labels">
                      <span>فصل الضجيج وتقليل الضوضاء</span>
                      <span className="slider-value">{sliders.noiseReduction}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={sliders.noiseReduction} 
                      onChange={(e) => setSliders({ ...sliders, noiseReduction: e.target.value })} 
                      className="custom-slider" 
                    />
                  </div>

                  <div className="slider-item">
                    <div className="slider-labels">
                      <span>تعزيز نبرة صوت المتحدث</span>
                      <span className="slider-value">{sliders.voiceEnhance}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={sliders.voiceEnhance} 
                      onChange={(e) => setSliders({ ...sliders, voiceEnhance: e.target.value })} 
                      className="custom-slider" 
                    />
                  </div>

                  <div className="slider-item">
                    <div className="slider-labels">
                      <span>شدة الاهتزاز الإيقاعي للموسيقى (Haptic Rhythm)</span>
                      <span className="slider-value">{sliders.hapticIntensity}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={sliders.hapticIntensity} 
                      onChange={(e) => setSliders({ ...sliders, hapticIntensity: e.target.value })} 
                      className="custom-slider" 
                    />
                  </div>
                </div>

                <button className="btn-primary w-full" onClick={saveSettings}>حفظ وتطبيق التغييرات على الأجهزة فوراً</button>
              </div>

              <div className="db-card">
                <h3>تفعيل الميزات الذكية</h3>
                <div className="toggles-list">
                  <div className="toggle-item-row">
                    <div className="toggle-label-desc">
                      <h4>الترجمة العائمة الفورية (Floating Live Captions)</h4>
                      <p>عرض نصوص عائمة فوق شاشة الكمبيوتر أو الموبايل أثناء المحادثات</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={toggles.liveCaptions} 
                        onChange={(e) => setToggles({ ...toggles, liveCaptions: e.target.checked })}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item-row">
                    <div className="toggle-label-desc">
                      <h4>التعرف البصري على نبرة الصوت (Emotional Tone Indicator)</h4>
                      <p>تنبيهك بالحالة المزاجية للمتحدث (غاضب، سعيد، متعجب) كرموز تعبيرية</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={toggles.emotionIndicator} 
                        onChange={(e) => setToggles({ ...toggles, emotionIndicator: e.target.checked })}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item-row">
                    <div className="toggle-label-desc">
                      <h4>كشف التنبيهات البيئية المحيطة (Environment Alerts)</h4>
                      <p>إرسال وميض بصري على الشاشة عند رنين جرس الباب أو إنذار الطوارئ</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={toggles.environmentAlerts} 
                        onChange={(e) => setToggles({ ...toggles, environmentAlerts: e.target.checked })}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* LIVE DSP DEMO PLAYER */}
              <div className="db-card" style={{ gridColumn: 'span 2' }}>
                <h3>🎙️ تجربة المعالجة الصوتية الحيّة (Live Audio DSP Test)</h3>
                <p style={{ marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  سجل مقطعاً صوتياً بصوتك أو حمّل ملفاً، ثم حرّك فلاتر الصوت في الأعلى لتسمع كيف يقوم النظام بتضخيم الكلام وعزل الضوضاء تلقائياً في الوقت الفعلي!
                </p>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {!isRecording ? (
                        <button
                          className="btn-primary"
                          onClick={startRecording}
                          style={{ background: 'var(--gradient)', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          🎤 ابدأ تسجيل صوتك
                        </button>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={stopRecording}
                          style={{ background: '#ff4444', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          🔴 إيقاف التسجيل وحفظه
                        </button>
                      )}

                      <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, padding: '10px 18px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                        📂 اختر ملف صوتي من جهازك
                        <input type="file" accept="audio/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                      </label>
                    </div>

                    {demoFileLoaded && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          className="btn-primary"
                          onClick={() => {
                            if (demoAudioRef.current) {
                              if (demoPlaying) {
                                demoAudioRef.current.pause();
                              } else {
                                initDemoAudioDSP();
                                demoAudioRef.current.play();
                              }
                            }
                          }}
                          style={{
                            background: demoPlaying ? '#ffa500' : 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '120px',
                            justifyContent: 'center'
                          }}
                        >
                          {demoPlaying ? '⏸️ إيقاف مؤقت' : '▶️ تشغيل الصوت'}
                        </button>
                        <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: '600' }}>
                          ✓ تم تحميل الملف وجاهز للفحص
                        </span>
                      </div>
                    )}
                  </div>

                  <audio
                    ref={demoAudioRef}
                    src={audioUrl}
                    onPlay={() => { initDemoAudioDSP(); setDemoPlaying(true); }}
                    onPause={() => setDemoPlaying(false)}
                    onEnded={() => setDemoPlaying(false)}
                    style={{ display: 'none' }}
                  />

                  {/* Indicator to show the user the filters are active */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    background: demoPlaying ? 'rgba(0, 212, 170, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    border: `1px solid ${demoPlaying ? 'var(--accent)' : 'var(--border)'}`,
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{demoPlaying ? '⚡' : '💤'}</span>
                      <span style={{ fontSize: '0.85rem', color: demoPlaying ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {demoPlaying ? 'المعالجة الحية نشطة: قم بتغيير الفلاتر في الأعلى لسماع الفرق!' : 'المعالجة غير نشطة. قم بتسجيل صوتك أو تحميل ملف للبدء.'}
                      </span>
                    </div>
                    {demoPlaying && (
                      <div className="dsp-wave-indicator" style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '15px' }}>
                        <span style={{ width: '3px', height: '8px', background: 'var(--accent)', borderRadius: '1.5px' }}></span>
                        <span style={{ width: '3px', height: '14px', background: 'var(--accent)', borderRadius: '1.5px' }}></span>
                        <span style={{ width: '3px', height: '10px', background: 'var(--accent)', borderRadius: '1.5px' }}></span>
                        <span style={{ width: '3px', height: '5px', background: 'var(--accent)', borderRadius: '1.5px' }}></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* TAB 6: DATABASE VIEWER */}
        {activeTab === 'database' && (
          <section className="tab-content active">
            <div className="db-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,170,0.06))', border: '1px solid rgba(108,99,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>🗄️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Mada Hearing Database — mada_hearing</h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    mysql://127.0.0.1:3307/mada_hearing • Apache on localhost/mada-api
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(0,212,170,0.12)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(0,212,170,0.2)' }}>
                    ⚡ متصل بـ XAMPP
                  </span>
                  <button
                    className="btn-primary"
                    onClick={exportTableData}
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                  >
                    📥 تصدير JSON
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => fetchTableData(selectedTable)}
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                  >
                    🔄 تحديث
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
              {/* Table Selector Sidebar */}
              <div className="db-card" style={{ padding: '12px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📋 الجداول
                </h4>
                {[
                  { key: 'audiograms', icon: '📊', label: 'نتائج الفحص السمعي', desc: 'audiograms' },
                  { key: 'browser_history', icon: '🌐', label: 'سجل التصفح', desc: 'browser_history' },
                  { key: 'lecture_notes', icon: '📝', label: 'ملاحظات المحاضرات', desc: 'lecture_notes' },
                  { key: 'audio_settings', icon: '🎚️', label: 'الإعدادات الصوتية', desc: 'audio_settings' },
                ].map(table => (
                  <div
                    key={table.key}
                    onClick={() => handleSelectTable(table.key)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedTable === table.key ? 'rgba(108,99,255,0.15)' : 'transparent',
                      border: `1px solid ${selectedTable === table.key ? 'rgba(108,99,255,0.3)' : 'transparent'}`,
                      marginBottom: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{table.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '600', color: selectedTable === table.key ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {table.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {table.desc}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table Data Viewer */}
              <div className="db-card" style={{ padding: '16px', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontFamily: 'monospace', color: 'var(--accent)', fontSize: '1rem' }}>
                      SELECT * FROM `{selectedTable}`
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {tableLoading ? 'جاري الاستعلام من قاعدة البيانات...' : `${tableData.length} سجل`}
                    </span>
                  </div>
                </div>

                {tableLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px', animation: 'spin 1s linear infinite' }}>⚙️</div>
                    جاري الاتصال بـ MySQL...
                  </div>
                ) : tableData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📭</div>
                    <p>لا توجد بيانات في هذا الجدول بعد.</p>
                    <p style={{ fontSize: '0.8rem' }}>
                      {selectedTable === 'audiograms' && 'قم بإجراء اختبار سمع من تبويب "الملف السمعي" ليتم حفظ النتائج هنا تلقائياً.'}
                      {selectedTable === 'browser_history' && 'قم بالتصفح في تبويب "المستعرض الذكي" ليتم تسجيل سجل التصفح هنا.'}
                      {selectedTable === 'lecture_notes' && 'قم بكتابة ملاحظة في تبويب المحاضرات ← "ملاحظاتي الدراسية" لحفظها هنا.'}
                      {selectedTable === 'audio_settings' && 'قم بضبط وحفظ الإعدادات الصوتية من تبويب الإعدادات.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', direction: 'ltr', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                          {Object.keys(tableData[0]).map(col => (
                            <th key={col} style={{ padding: '8px 12px', color: 'var(--accent)', fontWeight: '600', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                              background: rowIdx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                              transition: 'background 0.15s'
                            }}
                          >
                            {Object.values(row).map((val, colIdx) => (
                              <td key={colIdx} style={{ padding: '8px 12px', color: '#e0e0e0', fontFamily: 'monospace', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: COMMUNITY */}
        {activeTab === 'community' && (
          <section className="tab-content active">
            <div className="db-card">
              <div className="card-header-flex">
                <div>
                  <h3>مجتمع مستخدمي مدى السمع</h3>
                  <p>تشارك الخبرات، النصائح، وفلاتر الصوت المثالية مع بقية الأعضاء من ذوي التحديات السمعية.</p>
                </div>
                <button className="btn-primary" onClick={newCommunityPost}>مشاركة منشور جديد</button>
              </div>

              <div className="community-feed">
                <div className="feed-card">
                  <div className="feed-header">
                    <div className="feed-user-avatar">س</div>
                    <div className="feed-user-meta">
                      <h4>سارة الهاجري</h4>
                      <span>أخصائية تقنيات مساعدة • منذ ساعتين</span>
                    </div>
                    <span className="feed-tag tag-green">نصيحة تقنية</span>
                  </div>
                  <div className="feed-body">
                    <p>مرحباً بالجميع! بالنسبة للطلاب الذين يواجهون صعوبة في قاعات المحاضرات الكبيرة، أنصح بتفعيل ميزة "فصل الضجيج بالذكاء الاصطناعي" ووضع الهاتف قريباً من منصة المحاضر مع ربطه بلوحة التحكم هنا. التفريغ سيبدو أوضح بنسبة 90%.</p>
                  </div>
                  <div className="feed-actions">
                    <button className="feed-btn">👍 14 إعجاب</button>
                    <button className="feed-btn">💬 3 تعليقات</button>
                  </div>
                </div>

                <div className="feed-card">
                  <div className="feed-header">
                    <div className="feed-user-avatar" style={{ background: 'var(--accent)' }}>م</div>
                    <div className="feed-user-meta">
                      <h4>محمد الكواري</h4>
                      <span>مستخدم - سمع خفيف • منذ يومين</span>
                    </div>
                    <span className="feed-tag tag-purple">إعداد صوتي</span>
                  </div>
                  <div className="feed-body">
                    <p>لقد قمت برفع قيمة فلتر تضخيم الترددات المتوسطة إلى 75% وتعديل الضجيج إلى 85%. هذا الإعداد رائع جداً لسماع المكالمات الصوتية على WhatsApp دون إجهاد الأذن.</p>
                  </div>
                  <div className="feed-actions">
                    <button className="feed-btn">👍 28 إعجاب</button>
                    <button className="feed-btn">💬 7 تعليقات</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* Pure Tone Test Overlay */}
      {showTestOverlay && (
        <div className="test-panel-overlay active">
          <div className="test-panel">
            <div className="test-panel-header">
              <h3>اختبار السمع التفاعلي (Pure Tone Audiometry)</h3>
              <button className="close-btn" onClick={() => setShowTestOverlay(false)}>×</button>
            </div>
            <div className="test-panel-body">
              <div className="test-progress-bar">
                <div className="test-progress-fill" style={{ width: `${(testStep / (testMode === 'speaker' ? testFrequencies.length : testFrequencies.length * 2)) * 100}%` }}></div>
              </div>
              <div className="test-question-box">
                {testMode === 'speaker' ? (
                  <p className="test-instruction">🔊 وضع مكبر الصوت — تأكد أنك في مكان هادئ وارفع مستوى الصوت لـ 70%. لا تحتاج لسماعات!</p>
                ) : (
                  <p className="test-instruction">🎧 وضع السماعات — يرجى ارتداء سماعات الرأس وضبط مستوى صوت النظام الرئيسي على 50%.</p>
                )}
                <div className="test-signal-anim">
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring"></div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-speaker"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                </div>
                <h4 className="test-hz">تردد الاختبار: {currentHz} Hz</h4>
                <p className="test-sub-desc">{testMode === 'speaker' ? 'هل تسمع هذا النبض الصوتي من مكبر الصوت؟' : `هل تسمعه في ${currentEarLabel}؟`}</p>
                <button
                  onClick={() => {
                    const freq = testFrequencies[testStep % testFrequencies.length];
                    const side = testMode === 'headphones' ? (isTestingRight ? 'right' : 'left') : 'both';
                    playTone(freq, side);
                  }}
                  style={{
                    background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)',
                    padding: '6px 18px', borderRadius: '20px', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: '600', marginTop: '10px',
                    transition: 'var(--transition)'
                  }}
                >
                  🔁 أعد تشغيل النبض
                </button>
              </div>
              <div className="test-actions-buttons">
                <button className="btn-test-yes" onClick={() => handleTestResponse(true)}>نعم، أسمعه بوضوح</button>
                <button className="btn-test-no" onClick={() => handleTestResponse(false)}>لا، لا أسمعه</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waiting for Headphones Overlay */}
      {waitingForHeadphones && (
        <div className="test-panel-overlay active">
          <div className="test-panel">
            <div className="test-panel-header">
              <h3>وضع سماعات الرأس</h3>
              <button className="close-btn" onClick={() => setWaitingForHeadphones(false)}>×</button>
            </div>
            <div className="test-panel-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '15px', animation: 'pulse 1.5s ease-in-out infinite' }}>
                🎧
              </div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--text-primary)' }}>
                يرجى توصيل سماعات الرأس
              </h4>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6', fontSize: '0.9rem' }}>
                لبدء الاختبار في وضع السماعات, تأكد من توصيل سماعات الرأس بالجهاز.<br/>
                سيبدأ الاختبار <strong style={{ color: 'var(--accent)' }}>تلقائياً</strong> فور اكتشاف السماعات.
              </p>

              {/* Detected Devices List */}
              {detectedDevices.length > 0 && (
                <div style={{
                  textAlign: 'right',
                  marginBottom: '20px',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    🔌 الأجهزة الصوتية المتاحة:
                  </span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', maxHeight: '100px', overflowY: 'auto' }}>
                    {detectedDevices.map((d, i) => (
                      <li key={i} style={{ padding: '6px 0', borderBottom: i < detectedDevices.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🔊</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {d.label || `مخرج صوتي افتراضي #${i + 1}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '12px 20px', borderRadius: '10px',
                background: headphoneDetected ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255,68,68,0.1)',
                border: `1px solid ${headphoneDetected ? 'var(--accent)' : '#ff4444'}`,
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>{headphoneDetected ? '✅' : '⏳'}</span>
                <span style={{ color: headphoneDetected ? 'var(--accent)' : '#ff6666', fontWeight: '600', fontSize: '0.9rem' }}>
                  {headphoneDetected ? 'تم كشف السماعات — جاري بدء الاختبار...' : 'لم يتم كشف سماعات حتى الآن'}
                </span>
              </div>

              {/* Action Buttons for Presentation & Manual Override */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setManualHeadphoneOverride(true);
                      setHeadphoneDetected(true);
                    }}
                    style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
                  >
                    🤝 تأكيد التوصيل يدوياً
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setManualHeadphoneOverride(true);
                      setHeadphoneDetected(true);
                      alert('تمت محاكاة توصيل سماعة الرأس بنجاح للعرض التقديمي!');
                    }}
                    style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  >
                    ⚡ محاكاة التوصيل
                  </button>
                </div>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    const has = await checkHeadphones(true);
                    if (!has) alert('لم يتم اكتشاف سماعات. تأكد من توصيلها بالجهاز وحاول مجدداً، أو اضغط على زر "تأكيد التوصيل يدوياً" للتجاوز.');
                  }}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem' }}
                >
                  🔄 إعادة فحص الأجهزة تلقائياً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
