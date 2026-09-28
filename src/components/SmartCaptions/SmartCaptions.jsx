import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Maximize2, Minimize2, Copy, Trash2, Smile, HelpCircle, 
  AlertCircle, Type, Sparkles, Volume2, Download, Play, Check, FileText 
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const DEMO_CONVERSATION = [
  { text: 'أهلاً بكم في جلسة اليوم لمنظومة مدى السمع.', emotion: 'happy' },
  { text: 'هل يمكن توضيح كيفية تعويض الترددات السمعية بدقة؟', emotion: 'question' },
  { text: 'بكل تأكيد، النظام يعتمد على مصفوفة فلاتر رقمية DSP تعوض الفقدان السمعي فورياً.', emotion: 'neutral' },
  { text: 'شكراً جزيلاً، التوضيح ممتاز ورائع ومفيد جداً!', emotion: 'happy' },
  { text: 'انتبهوا! هناك تنبيه طارئ من رادار الأمان في الممر الخارجي!', emotion: 'urgent' }
];

export default function SmartCaptions({ isFloating, onToggleFloating }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [history, setHistory] = useState([
    { id: 1, text: 'أهلاً بكم في منظومة مدى السمع الذكية لتمكين ذوي الإعاقة السمعية.', time: '10:00 ص', emotion: 'happy' },
    { id: 2, text: 'يتم التقاط الصوت البشري وتحويله إلى نصوص واضحة في الوقت الفعلي.', time: '10:01 ص', emotion: 'neutral' }
  ]);

  const [fontSize, setFontSize] = useState('large'); // 'normal', 'large', 'xlarge'
  const [highContrast, setHighContrast] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState({ label: 'هادئ ومتزن', emoji: '😊', type: 'happy' });
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  const recognitionRef = useRef(null);

  // Analyze simple tone/emotion from text
  const analyzeEmotion = (text) => {
    if (!text) return { label: 'هادئ ومتزن', emoji: '😊', type: 'happy' };
    const happyWords = ['شكرا', 'ممتاز', 'رائع', 'جميل', 'سعيد', 'أهلا', 'مرحبا', 'فخور', 'إنجاز', 'مبروك', 'تأكيد'];
    const questionWords = ['هل', 'كيف', 'ماذا', 'لماذا', 'أين', 'متى', 'كم', 'مين', 'شو', 'وين', '?'];
    const urgentWords = ['انتبه', 'احذر', 'خطر', 'طوارئ', 'بسرعة', 'مهم', 'ضروري', 'حريق', 'توقف'];

    const lower = text.toLowerCase();
    if (urgentWords.some(w => lower.includes(w))) {
      return { label: 'تنبيه طارئ ومهم', emoji: '⚠️', type: 'urgent' };
    }
    if (questionWords.some(w => lower.includes(w))) {
      return { label: 'متسائل أو استفسار', emoji: '🤔', type: 'question' };
    }
    if (happyWords.some(w => lower.includes(w))) {
      return { label: 'إيجابي وودود', emoji: '😄', type: 'happy' };
    }
    return { label: 'نبرة حديث معتادة', emoji: '💬', type: 'neutral' };
  };

  // Initialize Web Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('متصفحك لا يدعم التعرف على الصوت المباشر (Web Speech API). يرجى استخدام متصفح Chrome أو Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ar-JO';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript + ' ';
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }

        if (interimStr) {
          setInterimText(interimStr);
          setCurrentEmotion(analyzeEmotion(interimStr));
        }

        if (finalStr.trim()) {
          const newEmotion = analyzeEmotion(finalStr);
          setCurrentEmotion(newEmotion);
          setHistory(prev => [
            {
              id: Date.now(),
              text: finalStr.trim(),
              time: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }),
              emotion: newEmotion.type
            },
            ...prev
          ]);
          setInterimText('');
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech Recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          alert('يرجى السماح للمتصفح بالوصول إلى الميكروفون لبدء التفريغ الصوتي الحي.');
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListening) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      console.error('Failed to init speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setInterimText('');
  };

  // Run interactive demo simulation for evaluators/judges
  const runSmartDialogueDemo = () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    let step = 0;

    const interval = setInterval(() => {
      if (step >= DEMO_CONVERSATION.length) {
        clearInterval(interval);
        setIsDemoRunning(false);
        return;
      }

      const item = DEMO_CONVERSATION[step];
      const emotionMeta = analyzeEmotion(item.text);
      setCurrentEmotion(emotionMeta);
      setHistory(prev => [
        {
          id: Date.now() + step,
          text: item.text,
          time: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }),
          emotion: item.emotion
        },
        ...prev
      ]);
      step++;
    }, 1400);
  };

  const copyTranscript = () => {
    const fullText = history.map(h => `[${h.time}] ${h.text}`).join('\n');
    navigator.clipboard.writeText(fullText);
    alert('تم نسخ كامل نص المحادثة إلى الحافظة بنجاح! 📋');
  };

  const clearTranscript = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح سجل الترجمة الحالي؟')) {
      setHistory([]);
      setInterimText('');
    }
  };

  // Export Transcript to PDF
  const exportCaptionsPDF = () => {
    if (history.length === 0) {
      alert('لا توجد نصوص في السجل لتصديرها.');
      return;
    }

    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);

    doc.setFontSize(20);
    doc.text('Mada Al-Sam-a Meeting Transcript & Captions', 105, 22, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`, 105, 30, { align: 'center' });
    doc.text('Real-time Speech Recognition with Tone Sentiment Analysis', 105, 36, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.line(20, 42, 190, 42);

    let y = 52;
    doc.setFontSize(10);

    const reversed = [...history].reverse();
    reversed.forEach((entry, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 25;
      }
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text(`[${entry.time}] (Tone: ${entry.emotion})`, 22, y);
      y += 6;

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(entry.text, 165);
      doc.text(lines, 25, y);
      y += (lines.length * 5) + 6;
    });

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Mada Al-Sam-a Accessibility Platform - Assistive Audio Ecosystem', 105, 285, { align: 'center' });

    doc.save(`Mada_Captions_${Date.now()}.pdf`);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <div className={`smart-captions-card ${highContrast ? 'high-contrast' : ''} ${isFloating ? 'floating-mode' : ''}`}>
      {/* Header */}
      <div className="captions-header">
        <div className="captions-title-group">
          <div className={`live-radar-dot ${isListening ? 'listening' : ''}`}></div>
          <div>
            <h3>التفريغ والترجمة الفورية الذكية (Live Smart Captions)</h3>
            <p>طبقة نصوص عربية مباشرة مع كاشف نبرة المشاعر وتصدير السجل لتسهيل الاجتماعات والمحاضرات.</p>
          </div>
        </div>

        <div className="captions-actions">
          {/* Demo Dialogue Trigger */}
          <button
            onClick={runSmartDialogueDemo}
            disabled={isDemoRunning}
            className={`btn-captions-demo ${isDemoRunning ? 'running' : ''}`}
            title="تشغيل محاكاة محادثة ذكية جاهزة للمعاينة"
          >
            <Play className="w-3.5 h-3.5 ml-1 text-emerald-400" />
            {isDemoRunning ? 'جارٍ المحاكاة...' : 'محاكاة حوار'}
          </button>

          {/* Export PDF */}
          <button onClick={exportCaptionsPDF} className="btn-icon-toggle" title="تصدير السجل كـ PDF">
            <Download className="w-4 h-4 text-indigo-400" />
          </button>

          {/* Font Size Toggle */}
          <div className="font-size-cluster">
            <button
              onClick={() => setFontSize('normal')}
              className={`size-btn ${fontSize === 'normal' ? 'active' : ''}`}
              title="خط عادي"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`size-btn ${fontSize === 'large' ? 'active' : ''}`}
              title="خط كبير"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              className={`size-btn ${fontSize === 'xlarge' ? 'active' : ''}`}
              title="خط فائق الوضوح"
            >
              A++
            </button>
          </div>

          {/* High Contrast Toggle */}
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`btn-icon-toggle ${highContrast ? 'active' : ''}`}
            title="تباين لوني عالي"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Floating Toggle */}
          {onToggleFloating && (
            <button
              onClick={onToggleFloating}
              className="btn-icon-toggle"
              title={isFloating ? 'توسيع الواجهة' : 'تحويل لنافذة عائمة'}
            >
              {isFloating ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {/* Copy & Clear */}
          <button onClick={copyTranscript} className="btn-icon-toggle" title="نسخ النصوص">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={clearTranscript} className="btn-icon-toggle" title="مسح">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Mic Trigger & Emotion Pill Bar */}
      <div className="captions-status-bar">
        <button
          onClick={toggleListening}
          className={`btn-mic-action ${isListening ? 'active' : ''}`}
        >
          {isListening ? (
            <>
              <Mic className="w-5 h-5 ml-2" />
              جارٍ الاستماع الفوري... (انقر للإيقاف)
            </>
          ) : (
            <>
              <MicOff className="w-5 h-5 ml-2" />
              ابدأ الاستماع والتفريغ الحي
            </>
          )}
        </button>

        <div className={`emotion-display-pill emotion-${currentEmotion.type || 'neutral'}`}>
          <span className="emotion-emoji">{currentEmotion.emoji}</span>
          <span className="emotion-label">نبرة المتحدث: <strong>{currentEmotion.label}</strong></span>
        </div>
      </div>

      {/* Live Captions Display Stream */}
      <div className={`captions-viewport font-scale-${fontSize}`}>
        {interimText && (
          <div className="caption-live-bubble interim-bubble">
            <span className="live-sparkle-icon">✨</span>
            <span className="interim-text-content">{interimText}...</span>
          </div>
        )}

        {history.length === 0 && !interimText && (
          <div className="captions-empty-hint">
            <Volume2 className="w-10 h-10 text-slate-500 mb-2" />
            <p>اضغط على زر الاستماع وابدأ الحديث، أو اضغط "محاكاة حوار" لتجربة كاشف المشاعر والنصوص تلقائياً.</p>
          </div>
        )}

        {history.map((item) => (
          <div key={item.id} className={`caption-live-bubble item-emotion-${item.emotion}`}>
            <div className="bubble-meta">
              <span className="bubble-time">{item.time}</span>
              <span className="bubble-tag">
                {item.emotion === 'urgent' && '⚠️ تنبيه مهم'}
                {item.emotion === 'question' && '❓ سؤال / استفسار'}
                {item.emotion === 'happy' && '😊 إيجابي وودود'}
                {item.emotion === 'neutral' && '💬 كلام معتاد'}
              </span>
            </div>
            <p className="bubble-text">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
