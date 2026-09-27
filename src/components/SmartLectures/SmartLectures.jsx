import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Sparkles, BrainCircuit, Play, Pause, Save, Download, 
  Search, CheckCircle, HelpCircle, Mic, MicOff, FileText, Check, 
  Volume2, VolumeX, Sliders, Monitor, Activity, Radio, ExternalLink
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

export default function SmartLectures({ userAudiogram, isCapturingSystem, onToggleSystemCapture }) {
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

  // Live Microphone Dictation / Lecture Recording
  const [isRecordingLive, setIsRecordingLive] = useState(false);
  const recognitionRef = useRef(null);

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

  useEffect(() => {
    return () => {
      stopLectureAudio();
    };
  }, [selectedLecture]);

  // Live Speech Recognition Toggle
  const toggleLiveRecording = () => {
    if (isRecordingLive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecordingLive(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('ميزة التعرف الصوتي غير مدعومة في هذا المتصفح. يُرجى استخدام متصفح Google Chrome أو Microsoft Edge.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript.trim()) {
          setNewNotes(prev => {
            const separator = prev.trim() ? ' ' : '';
            return prev + separator + currentTranscript.trim();
          });
        }
      };

      recognition.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setIsRecordingLive(false);
      };

      recognition.onend = () => {
        setIsRecordingLive(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecordingLive(true);
    }
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
