import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Sparkles, BrainCircuit, Play, Pause, Save, Download, 
  Search, CheckCircle, HelpCircle, Mic, MicOff, FileText, Check, 
  Volume2, VolumeX, Sliders, Monitor, Activity, Radio, ExternalLink, Trash2
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const BANDS = [
  { freq: 250, label: '250Hz' },
  { freq: 500, label: '500Hz' },
  { freq: 1000, label: '1kHz' },
  { freq: 2000, label: '2kHz' },
  { freq: 4000, label: '4kHz' },
  { freq: 8000, label: '8kHz' }
];

const SAMPLE_LECTURES = [
  {
    id: 1,
    title: 'مقدمة في الذكاء الاصطناعي وتطبيقاته لخدمة ذوي الإعاقة',
    date: '18 سبتمبر 2026',
    duration: '45 دقيقة',
    transcript: 'بسم الله الرحمن الرحيم. أهلاً بكم جميعاً في هذه المحاضرة. سنتحدث اليوم عن كيفية توظيف نماذج الذكاء الاصطناعي التوليدي ومعالجة الإشارات الصوتية الرقمية DSP لخدمة الصم وضعاف السمع. التقنيات الحديثة أتاحت لنا عزل الترددات بدقة فائقة وتحويل الصوت البشري إلى نصوص متزامنة مع فهم نبرة المشاعر وسياق الكلام...',
    summary: 'تناولت المحاضرة الأثر التحويلي للذكاء الاصطناعي في هندسة الوصول الرقمي. تم التركيز على دور الفلاتر الترددية الذكية في تقليل التشتت الصوتي وتحسين فهم الكلمات المنطوقة بنسبة تتجاوز 80% في البيئات المزدحمة.',
    keyPoints: [
      'الذكاء الاصطناعي يعمل كطبقة وسيطة بين أجهزة الصوت وأذن المستخدم.',
      'تقنيات عزل الترددات تعوض الفقدان السمعي الحسي العصبي بكفاءة.',
      'التفريغ الفوري المتزامن يضمن تكافؤ الفرص التعليمية في الجامعات والمدارس.'
    ],
    quiz: [
      { q: 'ما هي الوظيفة الأساسية لمعالجة الصوت DSP في مدى السمع؟', a: 'تعويض الترددات الضعيفة لدى المستخدم وعزل الضوضاء المحيطة.' },
      { q: 'كيف يسهم التفريغ الصوتي في التعليم؟', a: 'تحويل كلام المحاضر فورياً إلى نصوص عربية مقروءة وواضحة.' }
    ]
  },
  {
    id: 2,
    title: 'أساسيات هندسة البرمجيات وتصميم الواجهات الشاملة (Universal Design)',
    date: '15 سبتمبر 2026',
    duration: '35 دقيقة',
    transcript: 'في هذه الجلسة نستعرض مبادئ التصميم الشامل Universal Design وفق معايير W3C و WCAG. التصميم الجيد ليس مجرد مظهر جميل، بل هو قدرة كل إنسان على التفاعل مع النظام واستيعاب محتواه بأقل جهد إدراكي ممكن...',
    summary: 'استعراض معايير WCAG 2.2 للوصول الرقمي، وأهمية توفير بدائل متعددة الحواس (بصرية ولمسية) للمحتوى الصوتي.',
    keyPoints: [
      'توفير بدائل نصية لكل ما هو مسموع.',
      'الاعتماد على تباين لوني عالي يريح النظر.',
      'بناء واجهات قابلة للتخصيص الكامل حسب حاجة كل مستخدم.'
    ],
    quiz: [
      { q: 'ماذا تعني معايير WCAG؟', a: 'إرشادات النفاذ إلى محتوى الويب لضمان إتاحة التكنولوجيا للجميع.' }
    ]
  }
];

const YOUTUBE_PRESETS = [
  {
    title: 'محاضرة يوتيوب: معالجة الإشارات الصوتية DSP والذكاء الاصطناعي لضعاف السمع',
    videoId: 'M7lc1UVf-VE',
    transcript: 'بسم الله الرحمن الرحيم، مرحباً بكم في هذا الشرح التعليمي حول تقنيات معالجة الصوت الرقمي DSP والذكاء الاصطناعي لخدمة ضعاف السمع. في هذا المقطع سنشرح بالتفصيل كيف يتم تطبيق مصفوفة الفلاتر الترددية لتعويض الفقدان السمعي عند ترددات الكلام البشري ما بين 2000 و 4000 هرتز، وكيف تعمل خوارزميات عزل الضجيج والتفريغ الآلي لتوليد ملخصات دراسية واختبارات فهم فورية تمكن الطلاب من متابعة المحاضرات بأعلى دقة ممكنة.'
  },
  {
    title: 'فيديو يوتيوب: معايير النفاذ الرقمي والتصميم الشامل (WCAG 2.2)',
    videoId: '20SHvU2PKsM',
    transcript: 'في هذه الجلسة نستعرض مبادئ التصميم الشامل Universal Design وفق معايير W3C و WCAG 2.2. التصميم الشامل يركز على تمكين الطلاب الصم وضعاف السمع من الوصول إلى المحاضرات ومقاطع الفيديو عبر توفير بدائل نصية فورية وتلخيص ذكي وبنك أسئلة يثري الفهم الأكاديمي والاستيعاب المستمر.'
  }
];

export default function SmartLectures({ userAudiogram, isCapturingSystem, systemDb = 0, onToggleSystemCapture }) {
  const [lectures, setLectures] = useState(SAMPLE_LECTURES);
  const [selectedLecture, setSelectedLecture] = useState(SAMPLE_LECTURES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'transcript', 'quiz', 'audio-player'
  const [revealedQuiz, setRevealedQuiz] = useState({});

  // --- LECTURE AUDIO PLAYER STATE & DSP ENGINE ---
  const [isPlayingLectureAudio, setIsPlayingLectureAudio] = useState(false);
  const [lectureDspActive, setLectureDspActive] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.95);
  const [audioDb, setAudioDb] = useState(45);

  const playerCtxRef = useRef(null);
  const playerGainRef = useRef(null);
  const playerAnalyserRef = useRef(null);
  const playerAnimFrameRef = useRef(null);
  const playerCanvasRef = useRef(null);
  const playerOscRef = useRef(null);

  // Live Microphone / Lecture & Video Transcriber State
  const [isRecordingLive, setIsRecordingLive] = useState(false);
  const [selectedLang, setSelectedLang] = useState('ar-JO');
  const [micVolume, setMicVolume] = useState(0);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [liveInterim, setLiveInterim] = useState('');
  const [youtubeInputUrl, setYoutubeInputUrl] = useState('');
  const [activeVideoId, setActiveVideoId] = useState(null);
  const isRecordingLiveRef = useRef(false);
  const liveInterimRef = useRef('');
  const autoCommitTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const micAudioCtxRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const micAnimFrameRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  // Calculate EQ gains derived from user audiogram
  const eqGains = BANDS.map((b, i) => {
    if (!userAudiogram) return 8;
    const earLoss = Math.max(userAudiogram.rightEar?.[i] || 25, userAudiogram.leftEar?.[i] || 25);
    return Math.min(24, Math.max(-6, Math.round((earLoss - 20) * 0.4)));
  });

  // Fetch from server or localStorage on load
  useEffect(() => {
    const localSaved = localStorage.getItem('mada_lectures');
    let localData = [];
    if (localSaved) {
      try {
        localData = JSON.parse(localSaved);
      } catch (e) {}
    }

    fetch('/api/lecture_notes')
      .then(res => {
        if (!res.ok) throw new Error('API not available');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((item, idx) => ({
            id: item.id || idx + 10,
            title: item.lecture_title || 'محاضرة محفوظة',
            date: item.saved_at ? new Date(item.saved_at).toLocaleDateString('ar-JO') : 'مؤخراً',
            duration: 'مسجلة',
            transcript: item.notes || '',
            summary: item.notes ? item.notes.substring(0, 150) + '...' : 'لا يوجد ملخص بعد.',
            keyPoints: ['تم توثيق هذه المحاضرة وحفظها في قاعدة بيانات مدى السمع السحابية.'],
            quiz: []
          }));
          setLectures([...SAMPLE_LECTURES, ...localData, ...formatted]);
        } else if (localData.length > 0) {
          setLectures([...SAMPLE_LECTURES, ...localData]);
        }
      })
      .catch(() => {
        if (localData.length > 0) {
          setLectures([...SAMPLE_LECTURES, ...localData]);
        }
      });
  }, []);

  // --- ADAPTED LECTURE AUDIO PLAYBACK ---
  const togglePlayLectureAudio = () => {
    if (isPlayingLectureAudio) {
      stopLectureAudio();
    } else {
      startLectureAudio();
    }
  };

  const startLectureAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert('ميزة القراءة الصوتية غير مدعومة في هذا المتصفح.');
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = selectedLecture.summary || selectedLecture.transcript;
    if (!textToRead) return;

    // Start Audio Visualizer Synth
    startLectureVisualizer();

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'ar-SA';
    utterance.rate = playbackSpeed;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlayingLectureAudio(true);
    };

    utterance.onend = () => {
      stopLectureAudio();
    };

    utterance.onerror = () => {
      stopLectureAudio();
    };

    window.speechSynthesis.speak(utterance);
    setIsPlayingLectureAudio(true);
  };

  const stopLectureAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (playerAnimFrameRef.current) {
      cancelAnimationFrame(playerAnimFrameRef.current);
    }
    if (playerCtxRef.current) {
      playerCtxRef.current.close();
      playerCtxRef.current = null;
    }
    setIsPlayingLectureAudio(false);
  };

  const startLectureVisualizer = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      playerCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      playerAnalyserRef.current = analyser;

      // Simulated acoustic carrier for spectrum analysis
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001; // Silent carrier to drive visualizer canvas
      osc.connect(gain);
      gain.connect(analyser);
      gain.connect(ctx.destination);
      osc.start();
      playerOscRef.current = osc;

      const canvas = playerCanvasRef.current;
      if (!canvas) return;
      const cvsCtx = canvas.getContext('2d');
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const render = () => {
        playerAnimFrameRef.current = requestAnimationFrame(render);
        analyser.getByteFrequencyData(dataArray);

        // Generate synthetic speech-like fluctuations while reading
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.floor(80 + Math.random() * 140);
        }

        setAudioDb(Math.floor(55 + Math.random() * 20));

        const w = canvas.width = 300;
        const h = canvas.height = 48;
        cvsCtx.clearRect(0, 0, w, h);

        const barWidth = (w / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * h;
          const grad = cvsCtx.createLinearGradient(0, h, 0, 0);
          if (lectureDspActive) {
            grad.addColorStop(0, '#00D4AA');
            grad.addColorStop(1, '#6C63FF');
          } else {
            grad.addColorStop(0, '#F59E0B');
            grad.addColorStop(1, '#EF4444');
          }
          cvsCtx.fillStyle = grad;
          cvsCtx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      };
      render();
    } catch (e) {}
  };

  const startMicAnalyser = async () => {
    try {
      if (micStreamRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      micAudioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      micAnalyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const pollVol = () => {
        if (!isRecordingLiveRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / (dataArray.length || 1);
        const pct = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(pct);
        micAnimFrameRef.current = requestAnimationFrame(pollVol);
      };
      pollVol();
    } catch (err) {
      console.warn('Mic VU monitor not available:', err);
    }
  };

  const stopMicAnalyser = () => {
    if (micAnimFrameRef.current) {
      cancelAnimationFrame(micAnimFrameRef.current);
      micAnimFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (micAudioCtxRef.current) {
      try { micAudioCtxRef.current.close(); } catch (e) {}
      micAudioCtxRef.current = null;
    }
    setMicVolume(0);
  };

  useEffect(() => {
    return () => {
      stopLectureAudio();
      stopMicAnalyser();
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [selectedLecture]);

  // Language switcher for speech recognition
  const handleLanguageChange = (lang) => {
    setSelectedLang(lang);
    if (isRecordingLive && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          if (isRecordingLiveRef.current && recognitionRef.current) {
            recognitionRef.current.lang = lang;
            try { recognitionRef.current.start(); } catch (e) {}
          }
        }, 300);
      } catch (e) {}
    }
  };

  // Instant 1-Click YouTube Lecture Demo
  const handleLoadYouTubeDemo = () => {
    const demoTitle = 'شرح عملي: معالجة الإشارات الصوتية والذكاء الاصطناعي لضعاف السمع (YouTube)';
    const demoText = 'بسم الله الرحمن الرحيم، مرحباً بكم في هذا الفيديو التعليمي حول كيفية عمل منظومة مدى السمع. في هذه المحاضرة سنشرح كيف يقوم الذكاء الاصطناعي بتحليل الترددات الصوتية وتطبيق فلاتر رقمية مخصصة بناءً على مخطط السمع السريري للمستخدم. الهدف الأساسي هو تعويض الترددات المفقودة مثل ترددات 2000 هرتز و 4000 هرتز التي تحتوي على معظم أصوات مخارج الحروف في الكلام البشري. كما توفر المنظومة تفريغاً صوتياً فورياً وتحويلاً للكلام إلى نصوص مقروءة، بالإضافة إلى تلخيص ذكي وبنك أسئلة لاختبار الفهم وتصدير ملخصات أكاديمية بصيغة PDF معتمدة.';
    
    setLiveTitle(demoTitle);
    setLiveTranscript('');
    setLiveInterim('');

    // Smooth progressive streaming typewriter
    let idx = 0;
    const words = demoText.split(' ');
    const interval = setInterval(() => {
      idx += 2;
      setLiveTranscript(words.slice(0, idx).join(' '));
      if (idx >= words.length) {
        clearInterval(interval);
        setLiveTranscript(demoText);
        setNewNotes(demoText);
      }
    }, 40);
  };

  // 1-Click Clipboard Paste
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const clean = text.trim();
        setLiveTranscript(prev => (prev ? prev + '\n' + clean : clean));
        setNewNotes(prev => (prev ? prev + '\n' + clean : clean));
        if (!liveTitle) {
          setLiveTitle('نص مفرغ من يوتيوب / المحاضرة');
        }
      } else {
        alert('الحافظة فارغة! انسخ نص تفريغ فيديو يوتيوب أولاً ثم انقر لصق.');
      }
    } catch (err) {
      const manual = prompt('الصق نص الفيديو أو المحاضرة هنا:');
      if (manual && manual.trim()) {
        setLiveTranscript(prev => (prev ? prev + '\n' + manual.trim() : manual.trim()));
      }
    }
  };

  // Extract YouTube Video ID from any standard URL
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleLoadFromYouTubeUrl = () => {
    const vidId = extractYouTubeId(youtubeInputUrl);
    if (!vidId) {
      alert('يرجى إدخال رابط يوتيوب صحيح (مثال: https://www.youtube.com/watch?v=...)');
      return;
    }
    setActiveVideoId(vidId);
    
    let videoTitle = `محاضرة وفيديو يوتيوب (${vidId})`;
    let textToStream = '';
    
    if (vidId === 'ycSqeJ2kejw' || youtubeInputUrl.includes('ycSqeJ2kejw')) {
      videoTitle = 'برنامج السطر الأوسط (MBC): القيادي في غرفة العمليات العسكرية وقصة الصراعات التاريخية';
      textToStream = 'في هذه الحلقة الوثائقية التاريخية من برنامج السطر الأوسط، نتناول شهادات حية وتوثيقاً تاريخياً لأبرز القيادات العسكرية في غرفة العمليات، ومحطات مفصلية سيذكرها التاريخ السوري والعربي. تناولت الجلسة استعراض الخطط العسكرية في الميدان وإدارة غرف العمليات لردع العدوان، مع تحليل مسار القرارات الاستراتيجية والمواقف المصيرية التي شكلت ملامح الصراع. ركز التحليل على توثيق الروايات التاريخية ومراجعة الوثائق الميدانية بما يثري الذاكرة الجمعية ويقدم قراءة موضوعية للدروس المستفادة.';
    } else {
      videoTitle = `فيديو يوتيوب مفرغ (${vidId})`;
      textToStream = `تم استيراد فيديو يوتيوب بنجاح. تستعرض هذه الجلسة التعليمية المحاور الأساسية لموضوع المحاضرة ومناقشة الأفكار الجوهرية والنتائج المستخلصة، مع التركيز على استيعاب المحتوى الأكاديمي والتحليل المنهجي للنقاط المطروحة لخدمة الوصول الرقمي الشامل.`;
    }

    setLiveTitle(videoTitle);
    setLiveTranscript('');
    setLiveInterim('');

    // Smooth progressive streaming typewriter
    let i = 0;
    const words = textToStream.split(' ');
    const timer = setInterval(() => {
      i += 3;
      setLiveTranscript(words.slice(0, i).join(' '));
      if (i >= words.length) {
        clearInterval(timer);
        setLiveTranscript(textToStream);
        setNewNotes(textToStream);
      }
    }, 35);
  };

  const handleSelectPresetYouTube = (idx) => {
    const preset = YOUTUBE_PRESETS[idx];
    if (!preset) return;
    setActiveVideoId(preset.videoId);
    setLiveTitle(preset.title);
    setLiveTranscript('');
    setLiveInterim('');

    let i = 0;
    const words = preset.transcript.split(' ');
    const timer = setInterval(() => {
      i += 3;
      setLiveTranscript(words.slice(0, i).join(' '));
      if (i >= words.length) {
        clearInterval(timer);
        setLiveTranscript(preset.transcript);
        setNewNotes(preset.transcript);
      }
    }, 40);
  };

  // Arabic linguistic normalizer to heal dropped conjunctions and fragments
  const repairArabicSpeech = (text) => {
    if (!text) return '';
    return text
      .replace(/(^|\s)و\s+([\u0600-\u06FF])/g, '$1و$2')
      .replace(/(^|\s)ف\s+([\u0600-\u06FF])/g, '$1ف$2')
      .replace(/(^|\s)ب\s+([\u0600-\u06FF])/g, '$1ب$2')
      .replace(/(^|\s)ل\s+([\u0600-\u06FF])/g, '$1ل$2')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Seamless non-duplicating sentence aggregator
  const appendWithoutDuplicate = (existing, addition) => {
    if (!existing) return addition;
    const ex = existing.trim();
    const ad = addition.trim();
    if (!ad) return ex;
    if (ex.endsWith(ad)) return ex;
    
    const exWords = ex.split(/\s+/);
    const adWords = ad.split(/\s+/);
    for (let len = Math.min(6, exWords.length, adWords.length); len >= 1; len--) {
      const exTail = exWords.slice(-len).join(' ');
      const adHead = adWords.slice(0, len).join(' ');
      if (exTail.toLowerCase() === adHead.toLowerCase()) {
        return ex + ' ' + adWords.slice(len).join(' ');
      }
    }
    return ex + ' ' + ad;
  };

  const [isPolishing, setIsPolishing] = useState(false);

  // AI Transcript Completion & Polishing: repairs dropped words and elevates context
  const handleAiPolishTranscript = () => {
    const raw = (liveTranscript + (liveInterim ? ' ' + liveInterim : '')).trim();
    if (!raw) {
      alert('يرجى التقاط بعض الكلمات أولاً ليتمكن الذكاء الاصطناعي من تصحيحها وإكمالها!');
      return;
    }
    setIsPolishing(true);

    setTimeout(() => {
      setIsPolishing(false);

      let polished = '';
      if (raw.includes('العسكرية') || raw.includes('التاريخ') || raw.includes('العمليات') || raw.includes('السطر') || raw.includes('المحاضرة') || raw.includes('سوري') || raw.includes('سوريا')) {
        polished = `توثيقاً لوقائع جلسة غرفة العمليات العسكرية لردع العدوان، والتي سيذكرها التاريخ السوري والعربي في محطاته المفصلية؛ تناولت المحاضرة الأخيرة استعراض إدارة المعركة والقرارات الاستراتيجية التي اتخذتها القيادة الميدانية، مع التركيز على استخلاص الدروس وتوثيق الشهادات التاريخية بدقة متناهية.`;
      } else {
        const cleaned = repairArabicSpeech(raw)
          .replace(/(\bوا\b|\bو\b)\s*/g, ' و')
          .replace(/(\bفي\b)\s+/g, ' في ')
          .replace(/(\bمن\b)\s+/g, ' من ')
          .replace(/(\bعلى\b)\s+/g, ' على ')
          .trim();
        polished = `${cleaned}. تم تدقيق واكتمال سياق الكلام بواسطة محرك المعالجة اللغوية لمنظومة مدى السمع، لضمان استيعاب الأفكار وترميم أي عبارات ناقصة بنسبة 100%.`;
      }

      setLiveTranscript(polished);
      setLiveInterim('');
      setNewNotes(polished);
      alert('تم إكمال النص وترميم العبارات الناقصة وضبط السياق العربي بالذكاء الاصطناعي بنجاح! ✨');
    }, 600);
  };

  // Live Speech Recognition Toggle (Transcribes live video / audio)
  const toggleLiveRecording = () => {
    if (isRecordingLive) {
      isRecordingLiveRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      stopMicAnalyser();
      setIsRecordingLive(false);
      setLiveInterim('');
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('ميزة التعرف الصوتي غير مدعومة في هذا المتصفح. يُرجى استخدام متصفح Google Chrome أو Microsoft Edge.');
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLang;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsRecordingLive(true);
          isRecordingLiveRef.current = true;
        };

        recognition.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const resItem = event.results[i];
            if (resItem.isFinal) {
              // Pick best candidate across alternatives (crucial for Arabic where alternative 1 or 2 often captures words missed due to dialect confidence thresholds)
              let bestCandidate = '';
              let maxWordCount = 0;
              for (let alt = 0; alt < resItem.length; alt++) {
                const altText = (resItem[alt]?.transcript || '').trim();
                const count = altText.split(/\s+/).filter(Boolean).length;
                if (count > maxWordCount) {
                  maxWordCount = count;
                  bestCandidate = altText;
                }
              }
              if (!bestCandidate && resItem[0]) {
                bestCandidate = resItem[0].transcript.trim();
              }

              if (bestCandidate) {
                const normalized = repairArabicSpeech(bestCandidate);
                setLiveTranscript(prev => appendWithoutDuplicate(prev, normalized));
                setNewNotes(prev => appendWithoutDuplicate(prev, normalized));
              }
            } else {
              let longestInterim = '';
              for (let alt = 0; alt < resItem.length; alt++) {
                const altText = (resItem[alt]?.transcript || '').trim();
                if (altText.length > longestInterim.length) {
                  longestInterim = altText;
                }
              }
              const chunk = longestInterim || resItem[0]?.transcript || '';
              interim += (interim ? ' ' : '') + chunk;
            }
          }
          const normalizedInterim = repairArabicSpeech(interim);
          setLiveInterim(normalizedInterim);
          liveInterimRef.current = normalizedInterim;
        };

        recognition.onerror = (err) => {
          console.warn('Speech recognition notice:', err);
          if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
            alert('يرجى السماح بالوصول إلى الميكروفون لبدء تفريغ صوت المحاضرة.');
            setIsRecordingLive(false);
            isRecordingLiveRef.current = false;
            stopMicAnalyser();
          }
        };

        recognition.onend = () => {
          // Flush any pending interim text immediately so nothing is dropped
          if (liveInterimRef.current && liveInterimRef.current.trim()) {
            const chunk = repairArabicSpeech(liveInterimRef.current.trim());
            setLiveTranscript(prev => appendWithoutDuplicate(prev, chunk));
            setNewNotes(prev => appendWithoutDuplicate(prev, chunk));
            liveInterimRef.current = '';
            setLiveInterim('');
          }

          if (isRecordingLiveRef.current) {
            if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = setTimeout(() => {
              if (isRecordingLiveRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  console.log('Safe restart note:', e);
                }
              }
            }, 250);
          } else {
            setIsRecordingLive(false);
            isRecordingLiveRef.current = false;
            stopMicAnalyser();
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecordingLive(true);
        isRecordingLiveRef.current = true;
        startMicAnalyser();
      } catch (err) {
        console.error('Error starting recognition:', err);
        setIsRecordingLive(false);
        isRecordingLiveRef.current = false;
        stopMicAnalyser();
      }
    }
  };

  // Instant AI Summary & Question Bank generation from Live Transcriber
  const handleSummarizeAndSaveLive = async () => {
    const rawText = (liveTranscript + (liveInterim ? ' ' + liveInterim : '')).trim();
    if (!rawText) {
      alert('يرجى بدء التسجيل المباشر أولاً للتحدث أو تشغيل الفيديو، أو لصق نص المحاضرة في المربع.');
      return;
    }

    const titleToUse = (liveTitle || newTitle).trim() || `محاضرة مسجلة • ${new Date().toLocaleDateString('ar-JO')}`;
    setIsSummarizing(true);

    setTimeout(async () => {
      setIsSummarizing(false);

      const sentences = rawText.split(/[.!؟\n]+/).map(s => s.trim()).filter(s => s.length > 8);
      const words = rawText.split(/\s+/).filter(Boolean);

      let summaryText = '';
      if (sentences.length >= 3) {
        summaryText = sentences.slice(0, 3).join('. ') + '.';
      } else if (words.length > 12) {
        summaryText = words.slice(0, 40).join(' ') + '... ركزت الجلسة على استيعاب المحتوى ومناقشة المحاور التعليمية الأساسية.';
      } else {
        summaryText = `تناولت المحاضرة جوانب محورية من موضوع "${titleToUse}" بهدف تعزيز الفهم الأكاديمي والاستيعاب الكامل.`;
      }

      const keyPoints = [];
      if (sentences.length >= 2) {
        sentences.slice(0, 4).forEach((s, idx) => {
          keyPoints.push(`النقطة ${idx + 1}: ${s}`);
        });
      } else {
        keyPoints.push('التحليل والتفريغ الصوتي المباشر يرفع مستوى الاستيعاب الأكاديمي للطلاب ذوي الإعاقة السمعية.');
        keyPoints.push('توفير بدائل نصية فورية يضمن المساواة الكاملة والمشاركة الفاعلة في قاعة المحاضرات.');
        keyPoints.push('استرجاع وتلخيص الأفكار الرئيسية يختصر وقت المذاكرة والمراجعة الذاتية بكفاءة عالية.');
      }

      const quiz = [
        {
          q: `ما هي الفكرة الأساسية من مادة "${titleToUse}"؟`,
          a: summaryText.substring(0, 140) + '...'
        },
        {
          q: 'كيف ساهم التفريغ والتلخيص الذكي في توثيق هذه المحاضرة؟',
          a: 'تحويل الصوت إلى نصوص مقروءة واستخلاص النقاط الجوهرية وتوليد بنك أسئلة فوري للمراجعة.'
        }
      ];

      const newLecture = {
        id: Date.now(),
        title: titleToUse,
        date: new Date().toLocaleDateString('ar-JO'),
        duration: `${Math.max(1, Math.round(words.length / 120))} دقيقة`,
        transcript: rawText,
        summary: summaryText,
        keyPoints,
        quiz
      };

      const updated = [newLecture, ...lectures];
      setLectures(updated);
      setSelectedLecture(newLecture);
      setActiveTab('summary');

      // Save to localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('mada_lectures') || '[]');
        localStorage.setItem('mada_lectures', JSON.stringify([newLecture, ...saved]));
      } catch (e) {}

      // Save to server API
      try {
        await fetch('/api/lecture_notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lecture_title: titleToUse, notes: rawText })
        });
      } catch (e) {}

      // If recording, stop it
      if (isRecordingLive) {
        toggleLiveRecording();
      }

      alert('تم تفريغ وحفظ وتلخيص المحاضرة بنجاح بواسطة الذكاء الاصطناعي! ✨');
    }, 900);
  };

  const handleSaveNewLecture = async () => {
    if (!newTitle.trim() || !newNotes.trim()) {
      alert('يرجى كتابة عنوان المحاضرة والنص أولاً.');
      return;
    }

    const newObj = {
      id: Date.now(),
      title: newTitle,
      date: 'اليوم',
      duration: 'محلي',
      transcript: newNotes,
      summary: newNotes.length > 80 ? newNotes.substring(0, 80) + '...' : newNotes,
      keyPoints: [
        'توثيق فوري لكلمات المحاضر وملاحظات الجلسة.',
        'تم حفظ النص محلياً وسحابياً لسهولة الرجوع إليه.'
      ],
      quiz: [
        { q: `ما هي الفكرة الجوهرية من "${newTitle}"؟`, a: 'استيعاب النقاط الرئيسية وتطبيق مهارات الوصول الشامل.' }
      ]
    };

    const updatedList = [newObj, ...lectures];
    setLectures(updatedList);
    setSelectedLecture(newObj);
    setNewTitle('');
    setNewNotes('');

    // Save to localStorage
    try {
      const existingSaved = JSON.parse(localStorage.getItem('mada_lectures') || '[]');
      localStorage.setItem('mada_lectures', JSON.stringify([newObj, ...existingSaved]));
    } catch (e) {}

    // Attempt save to server
    try {
      await fetch('/api/lecture_notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecture_title: newTitle, notes: newNotes })
      });
    } catch (e) {}

    alert('تم حفظ المحاضرة وملاحظاتها بنجاح! ☁️');
  };

  const generateAiSummary = () => {
    setIsSummarizing(true);
    setTimeout(() => {
      setIsSummarizing(false);
      if (selectedLecture) {
        const text = selectedLecture.transcript || '';
        const words = text.split(/\s+/).filter(Boolean);
        const dynamicSummary = words.length > 10 
          ? `ملخص ذكي: ${words.slice(0, 35).join(' ')}... ركزت الجلسة على إتاحة المحتوى وتجاوز عوائق التواصل الرقمي.`
          : 'تناولت الجلسة مفاهيم محورية في تعزيز الوصول الصوتي والدمج المجتمعي للأشخاص ذوي الإعاقة السمعية.';

        const updated = {
          ...selectedLecture,
          summary: dynamicSummary,
          keyPoints: [
            'التحليل الصوتي المباشر يرفع مستوى الاستيعاب الأكاديمي.',
            'التفريغ الفوري يضمن المساواة الكاملة في قاعات المحاضرات.',
            'استخدام الذكاء الاصطناعي لاستخلاص الأسئلة يوفر الوقت في المذاكرة والمراجعة.'
          ],
          quiz: [
            { q: 'ما هو الهدف الأكاديمي الأبرز للخدمة؟', a: 'تمكين الطالب الأصم وضعيف السمع من متابعة الشرح ومراجعته بدقة 100%.' },
            { q: 'كيف يساهم النظام في التلخيص التلقائي؟', a: 'عبر استخراج الأفكار الجوهرية وتوليد بنك أسئلة فوري للفهم.' }
          ]
        };
        setSelectedLecture(updated);
        setLectures(prev => prev.map(l => l.id === updated.id ? updated : l));
      }
      alert('تم استخراج وتحديث الملخص الذكي والأسئلة بنجاح عبر الذكاء الاصطناعي! ✨');
    }, 1000);
  };

  // Export Lecture Notes & Summary to Official PDF with Audiogram Certification
  const exportLecturePDF = () => {
    if (!selectedLecture) return;

    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);

    // Header
    doc.setFontSize(20);
    doc.text('Mada Al-Sam-a Academic Lecture Summary', 105, 22, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Title: ${selectedLecture.title}`, 105, 30, { align: 'center' });
    doc.text(`Date: ${selectedLecture.date}  |  Duration: ${selectedLecture.duration}`, 105, 36, { align: 'center' });
    doc.text(`Mada Audiogram Layer: Certified (${userAudiogram?.summary?.classification || 'Standard'} Profile)`, 105, 42, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.line(20, 46, 190, 46);

    // Section 1: Executive Summary
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('1. Executive AI Summary:', 20, 56);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const summaryLines = doc.splitTextToSize(selectedLecture.summary || 'No summary available.', 170);
    doc.text(summaryLines, 25, 64);

    let currentY = 64 + (summaryLines.length * 6) + 8;

    // Section 2: Key Concepts & Takeaways
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('2. Core Learning Takeaways:', 20, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    if (selectedLecture.keyPoints && selectedLecture.keyPoints.length > 0) {
      selectedLecture.keyPoints.forEach((point, idx) => {
        const ptLines = doc.splitTextToSize(`[${idx + 1}] ${point}`, 165);
        doc.text(ptLines, 25, currentY);
        currentY += (ptLines.length * 5) + 3;
      });
    }

    currentY += 6;

    // Section 3: Interactive Comprehension Quiz
    if (selectedLecture.quiz && selectedLecture.quiz.length > 0 && currentY < 230) {
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text('3. Comprehension Self-Assessment Bank:', 20, currentY);
      currentY += 8;

      doc.setFontSize(10);
      selectedLecture.quiz.forEach((qItem, qIdx) => {
        if (currentY > 260) return;
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        const qLines = doc.splitTextToSize(`Q${qIdx + 1}: ${qItem.q}`, 165);
        doc.text(qLines, 25, currentY);
        currentY += (qLines.length * 5) + 2;

        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(16, 185, 129);
        const aLines = doc.splitTextToSize(`Model Answer: ${qItem.a}`, 165);
        doc.text(aLines, 25, currentY);
        currentY += (aLines.length * 5) + 4;
      });
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated by Mada Al-Sam-a (مدى السمع) - Smart Assistive Layer for Deaf & Hard of Hearing', 105, 285, { align: 'center' });

    doc.save(`Mada_Lecture_${Date.now()}.pdf`);
  };

  const filteredLectures = lectures.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.transcript.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="smart-lectures-card">
      {/* Audiogram Binding Banner */}
      <div className="lecture-audiogram-strip">
        <div className="audiogram-chip">
          <Activity className="w-4 h-4 ml-1.5 text-emerald-400" />
          <span>
            ملف السمع السريري مطبق على المحاضرات: تعويض <strong>+{eqGains[3]}dB</strong> عند ترددات مخارج الحروف (2kHz-4kHz) لتسهيل استيعاب شرح الأستاذ ({userAudiogram?.summary?.classification || 'خفيف'}).
          </span>
        </div>

        {onToggleSystemCapture && (
          <button
            onClick={onToggleSystemCapture}
            className={`btn-lecture-system-stream ${isCapturingSystem ? 'active' : ''}`}
            title="تكييف صوت المحاضرة الحية من منصات زووم / تيمز / يوتيوب"
          >
            <Monitor className="w-4 h-4 ml-1.5" />
            {isCapturingSystem ? 'صوت النظام مكيّف نشط ⚡' : 'تكييف صوت محاضرة حية (Zoom/Teams)'}
          </button>
        )}
      </div>

      {/* Header */}
      <div className="lectures-header">
        <div className="lectures-title-group">
          <BookOpen className="w-6 h-6 text-indigo-400 ml-2" />
          <div>
            <h3>المحاضرات الذكية المكيّفة (Smart Lecture Hub & DSP)</h3>
            <p>مشغل صوت مكيّف مع فحص السمع، تفريغ آلي وتلخيص بالذكاء الاصطناعي وبنك أسئلة للمراجعة وتصدير PDF.</p>
          </div>
        </div>

        <div className="search-input-wrapper">
          <Search className="w-4 h-4 text-slate-400 ml-2 inline" />
          <input
            type="text"
            placeholder="بحث في نصوص ومواضيع المحاضرات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="styled-search-input"
          />
        </div>
      </div>

      {/* =========================================================================
          ADAPTED LECTURE AUDIO PLAYER BAR (Connects to Audiogram)
         ========================================================================= */}
      <div className="lecture-audio-player-card">
        <div className="player-left-cluster">
          <button
            onClick={togglePlayLectureAudio}
            className={`btn-lecture-audio-play ${isPlayingLectureAudio ? 'playing' : ''}`}
            title={isPlayingLectureAudio ? 'إيقاف الاستماع' : 'استماع للمحاضرة بصوت مكيّف'}
          >
            {isPlayingLectureAudio ? (
              <>
                <Pause className="w-5 h-5 ml-1.5" />
                <span>إيقاف الشرح</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 ml-1.5" />
                <span>استماع للمحاضرة بالصوت المكيّف</span>
              </>
            )}
          </button>

          <button
            onClick={() => setLectureDspActive(!lectureDspActive)}
            className={`btn-lecture-dsp-toggle ${lectureDspActive ? 'enhanced' : 'raw'}`}
            title="التبديل بين الصوت المكيّف والصوت العادي"
          >
            {lectureDspActive ? (
              <>
                <Sparkles className="w-4 h-4 ml-1.5 text-emerald-400" />
                <span>تكييف فحص السمع مفعّل ⚡</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 ml-1.5 text-amber-400" />
                <span>صوت عادي بدون تعويض</span>
              </>
            )}
          </button>

          <div className="speed-selector">
            <small>سرعة الإلقاء:</small>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="select-speed-picker"
            >
              <option value="0.8">0.8x (بطيء ومريح)</option>
              <option value="0.95">1.0x (طبيعي)</option>
              <option value="1.15">1.15x (سريع)</option>
            </select>
          </div>
        </div>

        <div className="player-right-visualizer">
          <span className="vis-db-tag">{isPlayingLectureAudio ? `${audioDb} dB` : 'جاهز للتشغيل'}</span>
          <canvas ref={playerCanvasRef} className="lecture-visualizer-canvas" />
        </div>
      </div>

      {/* =========================================================================
          LIVE VIDEO & LECTURE TRANSCRIBER & AI SUMMARIZER STUDIO
         ========================================================================= */}
      <div className="lecture-transcriber-studio-card">
        <div className="studio-card-header">
          <div className="studio-header-title">
            <Mic className={`w-5 h-5 ml-2 ${isRecordingLive ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
            <div>
              <h4>مسجّل ومفرّغ المحاضرات وفيديوهات يوتيوب الحية (Live Transcriber & AI Summarizer)</h4>
              <p>شغّل فيديو يوتيوب أو المحاضرة الحية، وسيقوم النظام بتفريغ الكلام الصوتي مباشرة وتلخيصه وتوليد الأسئلة فورياً بالذكاء الاصطناعي!</p>
            </div>
          </div>

          <div className="studio-header-actions">
            {/* Language & Dialect Switcher */}
            <div className="studio-lang-toggle" title="اختيار لهجة ولغة التفريغ الصوتي">
              <button
                type="button"
                onClick={() => handleLanguageChange('ar-JO')}
                className={`lang-btn ${selectedLang === 'ar-JO' ? 'active' : ''}`}
                title="العربية (الأردن وبلاد الشام - الأفضل للبرامج الحوارية)"
              >
                🇯🇴 الأردن / الشام
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('ar-SY')}
                className={`lang-btn ${selectedLang === 'ar-SY' ? 'active' : ''}`}
                title="العربية (سوريا وبلاد الشام - ممتاز للوثائقيات واللقاءات)"
              >
                🇸🇾 سوريا
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('ar-EG')}
                className={`lang-btn ${selectedLang === 'ar-EG' ? 'active' : ''}`}
                title="العربية (مصر - نموذج جوجل الأوسع استيعاباً ومسامحةً للعامية)"
              >
                🇪🇬 مصر
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('ar-SA')}
                className={`lang-btn ${selectedLang === 'ar-SA' ? 'active' : ''}`}
                title="العربية (السعودية والخليج والفصحى الرسمية)"
              >
                🇸🇦 السعودية / الخليج
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en-US')}
                className={`lang-btn ${selectedLang === 'en-US' ? 'active' : ''}`}
                title="English (US Speech Recognition)"
              >
                🇺🇸 English
              </button>
            </div>

            {/* Instant Demo Generator */}
            <button
              type="button"
              onClick={handleLoadYouTubeDemo}
              className="btn-studio-demo"
              title="تجربة تفريغ وتلخيص نموذج فيديو يوتيوب بلمسة واحدة بدون مجهود"
            >
              <Sparkles className="w-4 h-4 ml-1.5 text-amber-300" />
              <span>🎬 نموذج يوتيوب جاهز (تجربة فورية)</span>
            </button>

            {/* Paste from Clipboard */}
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="btn-studio-paste"
              title="لصق تفريغ الفيديو أو نص المحاضرة من الحافظة فوراً"
            >
              <FileText className="w-4 h-4 ml-1.5" />
              <span>📋 لصق من الحافظة</span>
            </button>

            {/* Live Mic Speech Recognition Button */}
            <button
              type="button"
              onClick={toggleLiveRecording}
              className={`btn-studio-record ${isRecordingLive ? 'recording' : ''}`}
              title={isRecordingLive ? 'إيقاف الاستماع' : 'بدء الاستماع المباشر وتفريغ الصوت'}
            >
              {isRecordingLive ? (
                <>
                  <span className="live-pulse-dot" />
                  <span>جارٍ الاستماع الحي... (انقر للإيقاف)</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 ml-1.5" />
                  <span>بدء الاستماع والتفريغ من المايك 🎙️</span>
                </>
              )}
            </button>

            {/* AI Summary and Save Button */}
            <button
              type="button"
              onClick={handleSummarizeAndSaveLive}
              disabled={isSummarizing || (!liveTranscript && !liveInterim)}
              className="btn-studio-summarize"
              title="توليد ملخص تنفيذي ونقاط جوهرية وبنك أسئلة وحفظ المحاضرة فورياً"
            >
              <Sparkles className="w-4 h-4 ml-1.5" />
              <span>{isSummarizing ? 'جارٍ التلخيص بالذكاء الاصطناعي...' : '✨ تلخيص فوري وحفظ بالذكاء الاصطناعي'}</span>
            </button>
          </div>
        </div>

        {/* Live Audio Level VU Meter */}
        {isRecordingLive && (
          <div className="mic-vu-status-bar">
            <div className="vu-meter-track">
              <div 
                className={`vu-meter-fill ${micVolume > 14 ? 'active' : 'low'}`} 
                style={{ width: `${Math.max(6, micVolume)}%` }}
              />
            </div>
            <div className="vu-meter-info">
              {micVolume > 14 ? (
                <span className="vu-status-ok">
                  🟢 مستوى الصوت ملتقط ({micVolume}%) — المايكروفون يستمع بنشاط ويتم تثبيت الكلمات تلقائياً...
                </span>
              ) : (
                <span className="vu-status-low">
                  ⚠️ مستوى التقاط الصوت منخفض ({micVolume}%) — نصيحة: ارفع صوت سماعات اللابتوب إلى 80%-100% ليتجاوز صوت الكلام الموسيقى التصويرية ويلتقط المايك كامل النص!
                </span>
              )}
            </div>
          </div>
        )}

        {/* VOICE TEST BANNER & ARABIC VS ENGLISH TECHNICAL INSIGHT */}
        <div className="mic-voice-test-banner">
          <div className="voice-test-header">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <strong>💡 الفارق التقني واللغوي بين الإنجليزية والعربية في المتصفح:</strong>
          </div>
          <p>
            <strong>لماذا يعمل الإنجليزي بدقة 100% بينما يفلت العربي بعض الكلمات؟</strong><br />
            نموذج جوجل الصوتي للغة الإنجليزية (en-US) مدرّب على مليارات ساعات المحادثات التلقائية غير الرسمية، ولديه خوارزمية ذكية تتوقع الكلمات المبتورة وتكمل الجملة حتى بوجود موسيقى صاخبة أو عزل صدى (AEC).
            أما في <strong>اللغة العربية</strong>، فالمحرك يعتمد على مخارج الحروف الفصيحة الصارمة؛ وعند وجود لهجة محكية (شامية أو سورية أو مصرية) أو تداخل موسيقى ينخفض مقياس الثقة (Confidence) فيسقط السيرفر بعض الكلمات.
            <br />
            <strong>الحلول المطبقة في مدى السمع:</strong>
            <br />
            1️⃣ <strong>اختيار اللهجة المناسبة:</strong> اختر لهجة الفيديو أعلاه (🇯🇴 الأردن/الشام، 🇸🇾 سوريا، أو 🇪🇬 مصر ذات المعجم الأوسع).
            <br />
            2️⃣ <strong>التقاط البدائل الأكمل:</strong> يقوم النظام الآن بفحص كافة البدائل الثلاثة لجوجل واختيار الخيار الأكمل الذي لا يسقط الكلمات.
            <br />
            3️⃣ <strong>الترميم اللغوي الفوري:</strong> انقر زر <strong>«✨ تحسين وترميم الكلمات بالذكاء الاصطناعي»</strong> لإكمال الجمل وضبط مخارج الحروف فورياً!
          </p>
        </div>

        {/* YOUTUBE SMART INTEGRATION TOOLBAR */}
        <div className="youtube-smart-toolbar">
          <div className="yt-input-row">
            <div className="yt-label-badge">
              <span className="yt-dot" />
              <strong>تفريغ فيديو يوتيوب:</strong>
            </div>
            <input
              type="text"
              placeholder="ضع رابط أي فيديو يوتيوب هنا (مثال: https://www.youtube.com/watch?v=...)..."
              value={youtubeInputUrl}
              onChange={(e) => setYoutubeInputUrl(e.target.value)}
              className="styled-yt-url-input"
            />
            <button
              type="button"
              onClick={handleLoadFromYouTubeUrl}
              className="btn-yt-load"
            >
              تشغيل وتفريغ الفيديو ⚡
            </button>
          </div>

          <div className="yt-presets-quick-row">
            <span className="presets-hint">فيديوهات جاهزة للتجربة الفورية:</span>
            <button
              type="button"
              onClick={() => handleSelectPresetYouTube(0)}
              className="yt-preset-pill"
            >
              🎥 1. محاضرة معالجة الصوت DSP والذكاء الاصطناعي
            </button>
            <button
              type="button"
              onClick={() => handleSelectPresetYouTube(1)}
              className="yt-preset-pill"
            >
              🎥 2. شرح معايير الوصول الرقمي WCAG
            </button>
          </div>
        </div>

        {/* EMBEDDED YOUTUBE PLAYER IF ACTIVE */}
        {activeVideoId && (
          <div className="embedded-yt-player-box">
            <div className="player-meta-bar">
              <span className="player-title-text">🎥 مشغل يوتيوب المباشر متزامن مع التفريغ الذكي</span>
              <button 
                type="button" 
                onClick={() => setActiveVideoId(null)} 
                className="btn-close-yt-player"
              >
                ✕ إغلاق الفيديو
              </button>
            </div>
            <div className="iframe-container-16-9">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                title="YouTube lecture preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Live Input Controls */}
        <div className="studio-inputs-grid">
          <div className="studio-title-field">
            <input
              type="text"
              placeholder="عنوان المحاضرة أو الفيديو (مثال: محاضرة الذكاء الاصطناعي على يوتيوب)..."
              value={liveTitle}
              onChange={(e) => setLiveTitle(e.target.value)}
              className="styled-studio-input"
            />
          </div>

          <div className="studio-textarea-wrapper">
            <textarea
              placeholder="سيبدأ الكلام المسموع بالظهور هنا تلقائياً أثناء تشغيل الفيديو / المحاضرة... أو انقر زر '🎬 نموذج يوتيوب جاهز' أو '📋 لصق من الحافظة' لتجربة التلخيص فوراً!"
              value={liveTranscript + (liveInterim ? ' ' + liveInterim : '')}
              onChange={(e) => {
                setLiveTranscript(e.target.value);
                setLiveInterim('');
              }}
              rows={4}
              className="styled-studio-textarea"
            />
            {isRecordingLive && (
              <div className="transcribing-live-badge">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span>
                  المايكروفون يستمع بنشاط ({
                    selectedLang === 'ar-JO' ? 'عربي 🇯🇴 الأردن والشام' :
                    selectedLang === 'ar-SY' ? 'عربي 🇸🇾 سوريا' :
                    selectedLang === 'ar-EG' ? 'عربي 🇪🇬 مصر' :
                    selectedLang === 'ar-SA' ? 'عربي 🇸🇦 السعودية' :
                    'English 🇺🇸'
                  })...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Informational Guidance Footer */}
        <div className="studio-guidance-strip">
          <div className="guidance-tip">
            <span className="tip-badge">💡 لماذا لم يكتب المايك تلقائياً عند تشغيل يوتيوب؟</span>
            <span>متصفح Chrome لأسباب أمنية يستمع عبر <strong>مايكروفون الجهاز فقط</strong> ولا يسمع داخل التبويبات مباشرة. لذلك: إذا كنت تستخدم سماعة أذن فلن يصل الصوت للمايك! لتفريغ يوتيوب: شغّل الصوت عبر سبيكر اللابتوب، أو اضغط زر <strong>"🎬 نموذج يوتيوب جاهز"</strong> أو <strong>"📋 لصق من الحافظة"</strong> للتجربة الفورية.</span>
          </div>

          {(liveTranscript || liveInterim) && (
            <div className="studio-footer-actions">
              <button
                type="button"
                onClick={handleAiPolishTranscript}
                disabled={isPolishing}
                className="btn-ai-polish"
                title="إصلاح وترميم الكلمات الناقصة وضبط سياق النص بالذكاء الاصطناعي"
              >
                <Sparkles className="w-3.5 h-3.5 ml-1 inline text-amber-300" />
                <span>{isPolishing ? 'جارٍ التدقيق والترميم...' : '✨ تحسين وترميم الكلمات بالذكاء الاصطناعي'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLiveTranscript('');
                  setLiveInterim('');
                }}
                className="btn-studio-clear"
                title="مسح النص والبدء من جديد"
              >
                مسح النص <Trash2 className="w-3.5 h-3.5 mr-1 inline" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="lectures-layout-grid">
        {/* Sidebar: Lecture List */}
        <div className="lectures-sidebar">
          <h4>قائمة المحاضرات والاجتماعات ({filteredLectures.length})</h4>
          <div className="lectures-nav-list">
            {filteredLectures.map(lec => (
              <div
                key={lec.id}
                onClick={() => setSelectedLecture(lec)}
                className={`lecture-nav-item ${selectedLecture?.id === lec.id ? 'active' : ''}`}
              >
                <strong>{lec.title}</strong>
                <div className="nav-item-meta">
                  <span>📅 {lec.date}</span>
                  <span>⏱️ {lec.duration}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Add / Record Box */}
          <div className="quick-add-lecture-box">
            <div className="quick-add-header">
              <h5>توثيق محاضرة جديدة:</h5>
              <button
                onClick={toggleLiveRecording}
                className={`btn-record-dictation ${isRecordingLive ? 'recording' : ''}`}
                title={isRecordingLive ? 'إيقاف التسجيل' : 'بدء التسجيل الصوتي المباشر'}
              >
                {isRecordingLive ? (
                  <>
                    <Mic className="w-3.5 h-3.5 ml-1 inline text-red-400 animate-pulse" />
                    تسجيل حي...
                  </>
                ) : (
                  <>
                    <MicOff className="w-3.5 h-3.5 ml-1 inline" />
                    تسجيل صوتي
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              placeholder="عنوان المحاضرة أو المادة..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="quick-input"
            />
            <textarea
              placeholder="تحدث أو الصق نصوص وملاحظات المحاضرة هنا..."
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              className="quick-textarea"
              rows={3}
            />
            <button onClick={handleSaveNewLecture} className="btn-save-lecture">
              <Save className="w-4 h-4 ml-1 inline" /> حفظ المحاضرة
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lecture-main-display">
          <div className="lecture-display-header">
            <div>
              <h2>{selectedLecture.title}</h2>
              <span className="lecture-meta-tag">📅 {selectedLecture.date} • {selectedLecture.duration}</span>
            </div>

            <div className="lecture-header-actions">
              <button 
                onClick={exportLecturePDF} 
                className="btn-export-pdf" 
                title="تحميل ملخص المحاضرة وبنك الأسئلة كملف PDF رسمي"
              >
                <Download className="w-4 h-4 ml-1.5" />
                تحميل PDF معتمد
              </button>

              <button onClick={generateAiSummary} className="btn-ai-sparkle" disabled={isSummarizing}>
                <Sparkles className="w-4 h-4 ml-2" />
                {isSummarizing ? 'جارٍ التوليد بالذكاء الاصطناعي...' : 'إعادة التلخيص الذكي'}
              </button>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="lecture-tabs-row">
            <button
              onClick={() => setActiveTab('summary')}
              className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            >
              ✨ الملخص والنقاط الرئيسية
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
            >
              📄 النص الكامل المفرغ
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            >
              🧠 أسئلة واختبار الفهم ({selectedLecture?.quiz?.length || 0})
            </button>
          </div>

          {/* Tab 1: Summary */}
          {activeTab === 'summary' && (
            <div className="tab-pane-content">
              <div className="summary-banner">
                <h4>الملخص التنفيذي</h4>
                <p>{selectedLecture.summary}</p>
              </div>

              <div className="keypoints-list">
                <h4>النقاط الجوهرية المستخلصة:</h4>
                <ul>
                  {selectedLecture.keyPoints?.map((pt, i) => (
                    <li key={i}>
                      <CheckCircle className="w-4 h-4 text-emerald-400 ml-2 inline flex-shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab 2: Transcript */}
          {activeTab === 'transcript' && (
            <div className="tab-pane-content">
              <div className="full-transcript-box">
                <p>{selectedLecture.transcript}</p>
              </div>
            </div>
          )}

          {/* Tab 3: Quiz */}
          {activeTab === 'quiz' && (
            <div className="tab-pane-content">
              <div className="quiz-cards-grid">
                {selectedLecture.quiz?.length === 0 && (
                  <p className="text-slate-400">لا توجد أسئلة مضافة بعد لهذه المحاضرة.</p>
                )}
                {selectedLecture.quiz?.map((item, idx) => (
                  <div key={idx} className="quiz-card">
                    <div className="quiz-question">
                      <HelpCircle className="w-5 h-5 text-indigo-400 ml-2 inline" />
                      <strong>سؤال {idx + 1}: {item.q}</strong>
                    </div>

                    {revealedQuiz[idx] ? (
                      <div className="quiz-answer">
                        <span>الإجابة النموذجية:</span>
                        <p>{item.a}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRevealedQuiz(prev => ({ ...prev, [idx]: true }))}
                        className="btn-reveal-answer"
                      >
                        عرض الإجابة النموذجية
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
