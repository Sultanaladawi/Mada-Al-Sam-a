import React from 'react';
import { Heart, ShieldCheck, Award, ExternalLink } from 'lucide-react';

export default function Footer({ onViewChange }) {
  return (
    <footer className="mada-global-footer">
      <div className="footer-inner-container">
        <div className="footer-top-grid">
          {/* Col 1 */}
          <div className="footer-col-about">
            <div className="footer-brand-title">مدى السمع (Mada Al-Sam'a)</div>
            <p>
              المنظومة البيئية الشاملة لتمكين ذوي الإعاقة السمعية عبر طبقة وصول ذكية توفق بين التقنية الحديثة والأذن البشرية.
            </p>
            <div className="award-ribbon-tag">
              <Award className="w-4 h-4 ml-1.5 text-amber-400" />
              مشروع مرشح لجائزة مدى للابتكار 2026 — الدوحة، قطر
            </div>
          </div>

          {/* Col 2 */}
          <div className="footer-col-links">
            <h5>روابط سريعة</h5>
            <ul>
              <li><button onClick={() => onViewChange('landing')}>الرئيسية</button></li>
              <li><button onClick={() => onViewChange('dashboard')}>لوحة التحكم والمعين الحي</button></li>
              <li><a href="#features">المميزات الأساسية</a></li>
              <li><a href="#clinical">الفحص السريري النقي</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="footer-col-accessibility">
            <h5>معايير النفاذ الرقمي</h5>
            <p>
              مصمم بالكامل وفق معايير W3C / WCAG 2.2 للوصول الرقمي، متوافق مع قارئات الشاشة وأنماط التباين العالي وأجهزة المعينات السمعية.
            </p>
            <div className="wcag-badge">
              <ShieldCheck className="w-4 h-4 ml-1.5 text-emerald-400" />
              متوافق مع معايير النفاذ الرقمي العالمية WCAG 2.2
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>جميع الحقوق محفوظة © 2026 — مبادرة مدى السمع للوصول الرقمي الشامل.</span>
          <span className="heart-note">
            صُمم بشغف لدعم وتمكين مجتمع الصم وضعاف السمع في الوطن العربي <Heart className="w-3.5 h-3.5 text-red-500 inline mr-1" />
          </span>
        </div>
      </div>
    </footer>
  );
}
