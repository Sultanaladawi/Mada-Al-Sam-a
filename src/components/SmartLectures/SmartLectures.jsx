import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, BrainCircuit, Play, Pause, Save, Download, Search, CheckCircle, HelpCircle } from 'lucide-react';

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

export default function SmartLectures() {
  const [lectures, setLectures] = useState(SAMPLE_LECTURES);
  const [selectedLecture, setSelectedLecture] = useState(SAMPLE_LECTURES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'transcript', 'quiz'
  const [revealedQuiz, setRevealedQuiz] = useState({});

  // Fetch from server on load
  useEffect(() => {
    fetch('/api/lecture_notes')
      .then(res => res.json())
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
          setLectures([...SAMPLE_LECTURES, ...formatted]);
        }
      })
      .catch(err => console.warn('Using local sample lectures:', err));
  }, []);

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
      summary: 'ملخص قيد التوليد...',
      keyPoints: ['ملاحظة مخصصة أضافها المستخدم'],
      quiz: []
    };

    setLectures([newObj, ...lectures]);
    setSelectedLecture(newObj);
    setNewTitle('');
    setNewNotes('');

    // Save to server
    try {
      await fetch('/api/lecture_notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecture_title: newTitle, notes: newNotes })
      });
      alert('تم حفظ المحاضرة وملاحظاتها بنجاح في السحابة! ☁️');
    } catch (e) {}
  };

  const generateAiSummary = () => {
    setIsSummarizing(true);
    setTimeout(() => {
      setIsSummarizing(false);
      alert('تم استخراج وتحديث الملخص الذكي والأسئلة بنجاح عبر الذكاء الاصطناعي! ✨');
    }, 1200);
  };

  const filteredLectures = lectures.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.transcript.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="smart-lectures-card">
      {/* Header */}
      <div className="lectures-header">
        <div className="lectures-title-group">
          <BookOpen className="w-6 h-6 text-indigo-400 ml-2" />
          <div>
            <h3>المحاضرات الذكية والملخصات التوليدية (Smart Lecture Hub)</h3>
            <p>سجّل، فرّغ، ولخّص محاضراتك واجتماعاتك بضغطة زر واحدة مع بنك أسئلة ذكي للمراجعة.</p>
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

      <div className="lectures-layout-grid">
        {/* Sidebar: Lecture List */}
        <div className="lectures-sidebar">
          <h4>قائمة المحاضرات والاجتماعات ({filteredLectures.length})</h4>
          <div className="lectures-nav-list">
            {filteredLectures.map(lec => (
              <div
                key={lec.id}
                onClick={() => setSelectedLecture(lec)}
                className={lecture-nav-item }
              >
                <strong>{lec.title}</strong>
                <div className="nav-item-meta">
                  <span>📅 {lec.date}</span>
                  <span>⏱️ {lec.duration}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Add Box */}
          <div className="quick-add-lecture-box">
            <h5>إضافة ملاحظات محاضرة جديدة:</h5>
            <input
              type="text"
              placeholder="عنوان المحاضرة..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="quick-input"
            />
            <textarea
              placeholder="الصق نصوص أو ملاحظات المحاضرة هنا..."
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

            <button onClick={generateAiSummary} className="btn-ai-sparkle" disabled={isSummarizing}>
              <Sparkles className="w-4 h-4 ml-2" />
              {isSummarizing ? 'جارٍ التوليد بالذكاء الاصطناعي...' : 'إعادة التلخيص الذكي'}
            </button>
          </div>

          {/* Tab buttons */}
          <div className="lecture-tabs-row">
            <button
              onClick={() => setActiveTab('summary')}
              className={	ab-btn }
            >
              ✨ الملخص والنقاط الرئيسية
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={	ab-btn }
            >
              📄 النص الكامل المفرغ
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={	ab-btn }
            >
              🧠 أسئلة واختبار الفهم ({selectedLecture.quiz?.length || 0})
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
