import React, { useState } from 'react';
import { 
  X, Sparkles, ShieldAlert, Activity, BookOpen, Volume2, 
  Smartphone, Eye, Layers, Heart, BellRing, CheckCircle2, ChevronLeft 
} from 'lucide-react';
import MadaLogo from './MadaLogo';

export default function DeafGuideModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('sign-basics'); // 'sign-basics', 'visual-steps', 'haptic-sim', 'cochlear'
  const [simulatedAlert, setSimulatedAlert] = useState(null);

  if (!isOpen) return null;

  const triggerVisualAlert = (type) => {
    setSimulatedAlert(type);
    // Trigger navigator.vibrate if supported on device
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'fire') navigator.vibrate([200, 100, 200, 100, 400]);
      if (type === 'door') navigator.vibrate([150, 80, 150]);
      if (type === 'ambulance') navigator.vibrate([100, 50, 100, 50, 100]);
    }
    setTimeout(() => {
      setSimulatedAlert(null);
    }, 2500);
  };

  const SIGN_VOCAB = [
    {
      id: 'hearing',
      wordAr: 'سَمْع / أُذُن',
      wordEn: 'Hearing / Ear',
      category: 'أساسي',
      gestureDesc: 'وضع السبابة والوسطى بجانب شحمة الأذن مع حركة دائرية خفيفة للدلالة على الاستماع.',
      meaning: 'تحديد الملف السمعي للشخص وبدء معايرة طبقة الصوت في النظام.',
      icon: '👂'
    },
    {
      id: 'test',
      wordAr: 'فَحْص واختبار',
      wordEn: 'Audiometry Test',
      category: 'طبي',
      gestureDesc: 'مد الكفين إلى الأمام مع تحريك أصابع اليدين كأنك تقيس أو تفحص الترددات بدقة.',
      meaning: 'فحص الترددات الستة من 250Hz إلى 8000Hz بالسماعات أو سبيكر الجهاز.',
      icon: '📊'
    },
    {
      id: 'amplify',
      wordAr: 'تَكْيِيف وتوضيح الصوت',
      wordEn: 'DSP Audio Boost',
      category: 'تقني',
      gestureDesc: 'فتح قبضة اليد للأعلى تدريجياً لبيان تضخيم النقاء وعزل الضجيج الخلفي.',
      meaning: 'رفع أصوات مخارج الحروف الكلامية (+10dB) وخفض تشويش الغرفة.',
      icon: '⚡'
    },
    {
      id: 'captions',
      wordAr: 'تَفْرِيغ وكِتَابَة فَوْرِيَّة',
      wordEn: 'Live Subtitles',
      category: 'تواصل',
      gestureDesc: 'تحريك سبابة اليدين أفقياً كأنك ترسم سطور الكلمات المتدفقة على الشاشة.',
      meaning: 'تحويل كلام المحاضر أو فيديو اليوتيوب إلى نصوص مقروءة بدقة 98%.',
      icon: '💬'
    },
    {
      id: 'safety',
      wordAr: 'إِنْذَار ورَادَار أَمَان',
      wordEn: 'Safety Radar',
      category: 'سلامة',
      gestureDesc: 'تلويح باليد المفتوحة أمام الصدر مع وميض الأصابع دلالة على إشعار عاجل.',
      meaning: 'استشعار صفارات الإنذار، وأبواق السيارات، وطرقات الباب وتنبيهك فوراً.',
      icon: '🚨'
    }
  ];

  return (
    <div className="mada-modal-backdrop" onClick={onClose}>
      <div 
        className={`mada-modal-container deaf-guide-modal-container ${simulatedAlert ? `flash-active flash-${simulatedAlert}` : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="modal-header-luxury">
          <div className="header-brand-cluster">
            <MadaLogo size={36} showText={false} />
            <div>
              <div className="guide-kicker">
                <span className="badge-sign">🤟 لغة الإشارة والنفاذ الرقمي الصامت</span>
                <span className="badge-standard">WCAG 2.2 AAA Compliant</span>
              </div>
              <h3>دليل «مدى السمع» الشامل للصم وضعاف السمع</h3>
            </div>
          </div>
          <button onClick={onClose} className="btn-modal-close" aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="deaf-guide-tabs-bar">
          <button 
            onClick={() => setActiveTab('sign-basics')} 
            className={`deaf-tab-btn ${activeTab === 'sign-basics' ? 'active' : ''}`}
          >
            <span>🤟</span>
            <span>قاموس إشارات المنظومة</span>
          </button>
          <button 
            onClick={() => setActiveTab('visual-steps')} 
            className={`deaf-tab-btn ${activeTab === 'visual-steps' ? 'active' : ''}`}
          >
            <span>👁️</span>
            <span>خطوات الاستخدام بالصور</span>
          </button>
          <button 
            onClick={() => setActiveTab('haptic-sim')} 
            className={`deaf-tab-btn ${activeTab === 'haptic-sim' ? 'active' : ''}`}
          >
            <span>📳</span>
            <span>محاكي الوميض والاهتزاز</span>
          </button>
          <button 
            onClick={() => setActiveTab('cochlear')} 
            className={`deaf-tab-btn ${activeTab === 'cochlear' ? 'active' : ''}`}
          >
            <span>🦻</span>
            <span>زراعة القوقعة والسماعات</span>
          </button>
        </div>

        {/* Modal Dynamic Body */}
        <div className="deaf-guide-content-body">
          {/* TAB 1: ARABIC SIGN LANGUAGE VOCABULARY */}
          {activeTab === 'sign-basics' && (
            <div className="sign-vocab-section">
              <div className="tab-lead-intro">
                <p>
                  تم تصميم هذه المنظومة بالتعاون مع المعايير الدولية للإعاقة السمعية لتربط بين المفاهيم الطبية والتقنية ولغة الإشارة المعتمدة. إليك الإشارات البصرية المعيارية لكل وظيفة في «مدى السمع»:
                </p>
              </div>

              <div className="sign-cards-grid">
                {SIGN_VOCAB.map((item) => (
                  <div key={item.id} className="sign-card">
                    <div className="sign-card-top">
                      <span className="sign-emoji">{item.icon}</span>
                      <span className="sign-tag">{item.category}</span>
                    </div>
                    <h4>{item.wordAr}</h4>
                    <span className="sign-en-sub">{item.wordEn}</span>

                    <div className="gesture-box">
                      <strong>حركة الإشارة:</strong>
                      <p>{item.gestureDesc}</p>
                    </div>

                    <div className="sign-app-role">
                      <small>دورها في المنظومة:</small>
                      <p>{item.meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL STEPS (SILENT STEP-BY-STEP TOUR) */}
          {activeTab === 'visual-steps' && (
            <div className="visual-steps-section">
              <div className="tab-lead-intro">
                <p>
                  لا تحتاج إلى سماع أي صوت للتعامل مع «مدى السمع»! تم بناء كامل الواجهات بلغة بصرية حية ترشدك بالرموز والألوان والوميض خطوة بخطوة:
                </p>
              </div>

              <div className="visual-steps-timeline">
                {/* Step 1 */}
                <div className="step-timeline-item">
                  <div className="step-num-pill">1</div>
                  <div className="step-content-card">
                    <div className="step-badge">فحص السمع الصامت</div>
                    <h4>معايرة السمع بالوميض البصري</h4>
                    <p>
                      عند بدء الفحص، ستظهر لك إشارة وميض خضراء متزامنة مع التردد الصادر. إذا كنت تستخدم سماعة طبية أو قوقعة، اضغط على زر <strong>«سمعت الصوت»</strong>؛ وإذا لم تسمعه سيزيد النظام الشدة تلقائياً حتى تجد عتبتك بدقة.
                    </p>
                    <div className="step-cue-tag">
                      <Eye className="w-3.5 h-3.5 ml-1 text-cyan-400" /> إشعار مرئي: مؤشر تردد حي + مخطط بياني يتشكل تلقائياً
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="step-timeline-item">
                  <div className="step-num-pill">2</div>
                  <div className="step-content-card">
                    <div className="step-badge">التفريغ والترجمة الفورية</div>
                    <h4>قراءة الكلام الحي أثناء المحاضرات والاجتماعات</h4>
                    <p>
                      افتح نافذة <strong>«التفريغ الفوري»</strong> أو شغّل <strong>«الطبقة العائمة»</strong> فوق أي برنامج (Zoom أو Teams أو محاضرات الجامعة)؛ ستتحول كلمات المتحدثين إلى نصوص عربية واضحة فوراً بألوان تميز المتحدثين.
                    </p>
                    <div className="step-cue-tag">
                      <Layers className="w-3.5 h-3.5 ml-1 text-emerald-400" /> إشعار مرئي: نصوص متدفقة مع تحديد سرعة القراءة
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="step-timeline-item">
                  <div className="step-num-pill">3</div>
                  <div className="step-content-card">
                    <div className="step-badge">رادار الأمان المتعدد الحواس</div>
                    <h4>تحويل الأصوات المحيطة إلى ألوان واهتزاز</h4>
                    <p>
                      شغّل رادار الأمان في منزلك أو أثناء سيرك في الشارع. يقوم المايكروفون بالاستماع الدائم للبيئة؛ فور رصد صوت خطر، سيتحول الصوت إلى وميض شاشة واهتزاز لمسي سريع في جيبك.
                    </p>
                    <div className="step-cue-tag">
                      <ShieldAlert className="w-3.5 h-3.5 ml-1 text-rose-400" /> إشعار مرئي: أحمر (حريق/خطر)، أزرق (إسعاف)، أخضر (طرق باب)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HAPTIC & VISUAL ALERT SIMULATOR */}
          {activeTab === 'haptic-sim' && (
            <div className="haptic-sim-section">
              <div className="tab-lead-intro">
                <p>
                  جرّب الآن كيف يشعرك النظام بالأمان التام عبر تحويل الأصوات إلى وميض لوني واهتزاز لمسي فوري (Haptic Feedback) في جهازك:
                </p>
              </div>

              <div className="sim-buttons-grid">
                <div className="sim-card sim-card-fire">
                  <div className="sim-icon">🔥</div>
                  <h4>إنذار حريق أو غاز</h4>
                  <p>وميض شاشة أحمر ساطع ومستمر مع اهتزازات متقطعة قوية لإيقاظك وتنبيهك فوراً.</p>
                  <button 
                    onClick={() => triggerVisualAlert('fire')}
                    className="btn-trigger-sim btn-fire"
                  >
                    تجربة وميض واهتزاز الحريق 🚨
                  </button>
                </div>

                <div className="sim-card sim-card-ambulance">
                  <div className="sim-icon">🚑</div>
                  <h4>صفارة إسعاف أو شرطة</h4>
                  <p>وميض لوني أزرق متردد مع نمط نبض مزدوج ينبهك في الشارع للابتعاد عن مسار الطوارئ.</p>
                  <button 
                    onClick={() => triggerVisualAlert('ambulance')}
                    className="btn-trigger-sim btn-ambulance"
                  >
                    تجربة وميض الإسعاف ⚡
                  </button>
                </div>

                <div className="sim-card sim-card-door">
                  <div className="sim-icon">🚪</div>
                  <h4>طرقات الباب أو جرس المنزل</h4>
                  <p>وميض زمردي لطيف واهتزاز ثلاثي خفيف لإعلامك بوجود زائر دون إزعاج أو إفزاع.</p>
                  <button 
                    onClick={() => triggerVisualAlert('door')}
                    className="btn-trigger-sim btn-door"
                  >
                    تجربة وميض جرس الباب 🔔
                  </button>
                </div>
              </div>

              {simulatedAlert && (
                <div className={`active-simulation-banner alert-theme-${simulatedAlert}`}>
                  <BellRing className="w-6 h-6 ml-2 animate-bounce" />
                  <div>
                    <strong>محاكاة نشطة الآن:</strong> تم تفعيل الوميض البصري واهتزاز الجهاز لمستوى 
                    {simulatedAlert === 'fire' ? ' [خطر حريق - أولوية قصوى]' : simulatedAlert === 'ambulance' ? ' [مركبة طوارئ - انتباه]' : ' [جرس الباب - إشعار منزلي]'}.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COCHLEAR & BLUETOOTH HEARABLES */}
          {activeTab === 'cochlear' && (
            <div className="cochlear-section">
              <div className="tab-lead-intro">
                <p>
                  إرشادات خاصة لمستخدمي زراعة القوقعة الإلكترونية (Cochlear Implants) والسماعات الطبية المتصلة بالبلوتوث (MFi / ASHA):
                </p>
              </div>

              <div className="cochlear-tips-grid">
                <div className="cochlear-card">
                  <div className="cochlear-card-header">
                    <Smartphone className="w-6 h-6 text-emerald-400 ml-2" />
                    <h4>البث المباشر للقوقعة (Direct Audio Streaming)</h4>
                  </div>
                  <p>
                    تتوافق منصة «مدى السمع» مع بروتوكولات <strong>ASHA</strong> (أندرويد) و <strong>MFi</strong> (آبل)؛ حيث يرسل المتصفح تيار الصوت المكيّف رقمياً مباشرة إلى معالج القوقعة بدون ميكروفونات وسيطة، مما يمنع الصدى ويضاعف وضوح الكلام.
                  </p>
                </div>

                <div className="cochlear-card">
                  <div className="cochlear-card-header">
                    <Activity className="w-6 h-6 text-sky-400 ml-2" />
                    <h4>معايرة خريطة القوقعة (MAP Alignment)</h4>
                  </div>
                  <p>
                    يمكنك إجراء فحص السمع بالمنظومة أثناء ارتداء معالج القوقعة لمعرفة الترددات التي تحتاج إلى تعزيز وظيفي (Functional Gain)، ومن ثم تطبيق مرشحات عزل التشويه التلقائية.
                  </p>
                </div>

                <div className="cochlear-card">
                  <div className="cochlear-card-header">
                    <BookOpen className="w-6 h-6 text-indigo-400 ml-2" />
                    <h4>الدمج ثنائي الحواس في قاعات المحاضرات</h4>
                  </div>
                  <p>
                    نوصي الطلاب زارعي القوقعة بتشغيل <strong>المعين السمعي الحي</strong> في أذنهم وبالتوازي فتح <strong>التفريغ الفوري</strong> على شاشة اللابتوب؛ لقراءة الكلمات الصعبة والاطلاع عليها متزامنة مع الصوت.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="modal-footer-luxury">
          <div className="deaf-support-badge">
            <Heart className="w-4 h-4 text-rose-400 ml-1.5" />
            <span>نظام بيئي صُمم خصيصاً ليضمن استقلاليتك الكاملة وكرامتك الإنسانية</span>
          </div>
          <button onClick={onClose} className="btn-modal-action-primary">
            فهمت الدليل، ابدأ الاستخدام <CheckCircle2 className="w-4 h-4 mr-1.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
