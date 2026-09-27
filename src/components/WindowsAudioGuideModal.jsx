import React, { useState } from 'react';
import { 
  Monitor, Smartphone, Laptop, Headphones, Volume2, Shield, 
  Check, X, Sparkles, ExternalLink, ArrowRight, Radio, Cpu, Layers
} from 'lucide-react';

export default function WindowsAudioGuideModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('browser-loopback'); // 'browser-loopback', 'virtual-cable', 'mobile-devices'

  if (!isOpen) return null;

  return (
    <div className="mada-modal-overlay" onClick={onClose}>
      <div className="mada-guide-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-top-header">
          <div className="modal-title-cluster">
            <span className="modal-kicker">🌍 معايير النفاذ الشامل لكافة الأجهزة</span>
            <h3>دليل تشغيل مدى السمع لكامل الجهاز وجميع المواقع والأنظمة</h3>
          </div>
          <button onClick={onClose} className="btn-modal-close" title="إغلاق">
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="modal-device-tabs">
          <button
            onClick={() => setActiveTab('browser-loopback')}
            className={`modal-tab-pill ${activeTab === 'browser-loopback' ? 'active' : ''}`}
          >
            <Monitor className="w-4 h-4 ml-1.5" />
            الحواسيب واللابتوب (نقرة واحدة)
          </button>
          <button
            onClick={() => setActiveTab('virtual-cable')}
            className={`modal-tab-pill ${activeTab === 'virtual-cable' ? 'active' : ''}`}
          >
            <Cpu className="w-4 h-4 ml-1.5" />
            ويندوز ونظام التشغيل (دائم OS-Level)
          </button>
          <button
            onClick={() => setActiveTab('mobile-devices')}
            className={`modal-tab-pill ${activeTab === 'mobile-devices' ? 'active' : ''}`}
          >
            <Smartphone className="w-4 h-4 ml-1.5" />
            الهواتف والسماعات الطبية الذكية
          </button>
        </div>

        {/* Tab 1: Browser Screen & Audio Capture (Zero Install) */}
        {activeTab === 'browser-loopback' && (
          <div className="modal-body-section">
            <div className="guide-hero-banner">
              <Sparkles className="w-5 h-5 text-emerald-400 ml-2 flex-shrink-0" />
              <div>
                <strong>الوضع الفوري المباشر (Direct Audio Loopback - بدون أي برامج خارجية)</strong>
                <p>يعمل على كافة المتصفحات (Chrome, Edge, Brave, Opera) في أنظمة Windows, macOS, Linux.</p>
              </div>
            </div>

            <div className="guide-steps-vertical">
              <div className="guide-step-card">
                <span className="step-badge">خطوة 1</span>
                <div className="step-body">
                  <h5>اضغط على زر "بدء تكييف صوت الجهاز"</h5>
                  <p>من الشريط العلوي للمنصة أو من داخل متصفح مدى السمع، اضغط على زر تفعيل صوت الجهاز.</p>
                </div>
              </div>

              <div className="guide-step-card">
                <span className="step-badge">خطوة 2</span>
                <div className="step-body">
                  <h5>اختر "كامل الشاشة (Entire Screen)" أو تبويب معين</h5>
                  <p>ستظهر نافذة النظام؛ تأكد من تفعيل علامة الصح بجانب: <strong>"مشاركة صوت النظام (Also share system audio)"</strong>.</p>
                </div>
              </div>

              <div className="guide-step-card">
                <span className="step-badge">خطوة 3</span>
                <div className="step-body">
                  <h5>استمع لأي موقع أو برنامج عبر سماعاتك بوضوح تام</h5>
                  <p>الآن افتح جوجل، يوتيوب، زووم، تيمز، نتفليكس أو أي لعبة على جهازك. صوت الجهاز بالكامل سيمر تلقائياً عبر مصفوفة فحص السمع الخاصة بك!</p>
                </div>
              </div>
            </div>

            <div className="guide-footer-badge">
              <Shield className="w-4 h-4 text-emerald-400 ml-1.5" />
              <span>ميزة الحماية الصوتية: محدد ديسيبل تلقائي (Acoustic Limiter) يحمي أذن المستخدم من الأصوات العالية المفاجئة.</span>
            </div>
          </div>
        )}

        {/* Tab 2: Virtual Audio Cable (OS-Level Routing for Windows) */}
        {activeTab === 'virtual-cable' && (
          <div className="modal-body-section">
            <div className="guide-hero-banner">
              <Cpu className="w-5 h-5 text-indigo-400 ml-2 flex-shrink-0" />
              <div>
                <strong>الربط على مستوى نظام التشغيل (OS-Level Kernel Driver)</strong>
                <p>مخصص للتشغيل الدائم مع كافة برامج ويندوز وألعاب الفيديو بدون الحاجة لمشاركة الشاشة كل مرة.</p>
              </div>
            </div>

            <div className="guide-steps-vertical">
              <div className="guide-step-card">
                <span className="step-badge">1</span>
                <div className="step-body">
                  <h5>تثبيت كابل الصوت الافتراضي (VB-Audio Virtual Cable)</h5>
                  <p>برنامج مجاني ومعتمد عالمياً ينشئ مدخل ومخرج صوت وهمي في نظام ويندوز.</p>
                </div>
              </div>

              <div className="guide-step-card">
                <span className="step-badge">2</span>
                <div className="step-body">
                  <h5>ضبط مخرج صوت ويندوز الافتراضي على (CABLE Input)</h5>
                  <p>من إعدادات الصوت في شريط مهام ويندوز، اجعل المخرج الافتراضي هو الكابل الوهمي.</p>
                </div>
              </div>

              <div className="guide-step-card">
                <span className="step-badge">3</span>
                <div className="step-body">
                  <h5>ربط مدى السمع بمدخل (CABLE Output)</h5>
                  <p>يقوم محرك مدى السمع بالتقاط الصوت وتمريره عبر فلاتر فحص السمع وإخراجه لسماعات رأسك الحقيقية في أقل من 10 ملي ثانية!</p>
                </div>
              </div>
            </div>

            <div className="os-ext-banner">
              <strong>💡 خطة التوسع المعتمدة لمسابقة SAIF 2026:</strong>
              <p>تم تصميم المعمارية لتكون جاهزة للإطلاق كإضافة رسمية لمتصفح كروم (Google Chrome Extension) وتطبيق في صينية النظام (Windows Tray Utility).</p>
            </div>
          </div>
        )}

        {/* Tab 3: Mobile Devices & Smart Hearing Aids */}
        {activeTab === 'mobile-devices' && (
          <div className="modal-body-section">
            <div className="guide-hero-banner">
              <Smartphone className="w-5 h-5 text-pink-400 ml-2 flex-shrink-0" />
              <div>
                <strong>الهواتف الذكية والسماعات الطبية (iOS / Android / Bluetooth Aids)</strong>
                <p>تحويل هاتفك المحمول إلى معين سمعي فائق الذكاء يرافقك في القاعات الدراسية والاجتماعات ومواقع الإنترنت.</p>
              </div>
            </div>

            <div className="mobile-features-grid">
              <div className="mobile-feat-box">
                <Headphones className="w-5 h-5 text-indigo-400 ml-2" />
                <div>
                  <strong>التوافق مع السماعات الطبية الذكية:</strong>
                  <p>يتصل مباشرة عبر Bluetooth LE Audio مع السماعات الطبية الذكية (Cochlear, Oticon, Phonak, AirPods Pro).</p>
                </div>
              </div>

              <div className="mobile-feat-box">
                <Volume2 className="w-5 h-5 text-emerald-400 ml-2" />
                <div>
                  <strong>وضع القاعات والمحاضرات:</strong>
                  <p>ضع الهاتف بالقرب من المحاضر، واستمع للشرح مكيّفاً مع قراءة التفريغ الفوري المتزامن.</p>
                </div>
              </div>

              <div className="mobile-feat-box">
                <Radio className="w-5 h-5 text-amber-400 ml-2" />
                <div>
                  <strong>تطبيق ويب تقدمي (PWA):</strong>
                  <p>يمكن تثبيته كأيقونة على شاشة الهاتف الرئيسية، يعمل بلا إنترنت وبدون استهلاك مفرط للبطارية.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Close */}
        <div className="modal-footer-row">
          <button onClick={onClose} className="btn-modal-action">
            فهمت، العودة للمنظومة
          </button>
        </div>
      </div>
    </div>
  );
}
