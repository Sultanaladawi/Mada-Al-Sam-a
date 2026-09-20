import React, { useState } from 'react';
import { Globe, Play, Pause, Volume2, Sparkles, Captions, RefreshCw, ExternalLink } from 'lucide-react';

const MEDIA_DEMOS = [
  {
    id: 1,
    title: 'محاضرة جامعة قطر: معايير النفاذ الرقمي الشامل 2026',
    platform: 'YouTube',
    category: 'تعليمي',
    caption: '“...يجب أن نضمن أن كل منصة تعليمية تمتلك ترجمة فورية وكتابة متزامنة للأشخاص ذوي الإعاقة السمعية...”',
    embedId: 'dQw4w9WgXcQ'
  },
  {
    id: 2,
    title: 'اجتماع Microsoft Teams: مناقشة حلول الذكاء الاصطناعي',
    platform: 'Teams',
    category: 'مكالمة عمل',
    caption: '“...فريق التطوير يعمل الآن على دمج معالجة الصوت المباشرة لتحسين جودة الصوت في المكالمة...”',
    embedId: 'test2'
  }
];

export default function MadaBrowser() {
  const [activeMedia, setActiveMedia] = useState(MEDIA_DEMOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dspBoostActive, setDspBoostActive] = useState(true);
  const [captionsActive, setCaptionsActive] = useState(true);
  const [urlInput, setUrlInput] = useState('https://youtube.com/watch?v=education_mada');

  return (
    <div className="mada-browser-card">
      <div className="browser-top-bar">
        <div className="browser-window-dots">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
        </div>

        <div className="browser-url-field">
          <Globe className="w-4 h-4 text-slate-400 ml-2 inline" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="browser-url-input"
          />
        </div>

        <button className="btn-browser-refresh" title="تحديث">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="browser-content-area">
        <div className="player-viewport">
          <div className="mock-video-screen">
            <div className="video-overlay-gradient"></div>
            <div className="video-inner-content">
              <span className="badge-platform">{activeMedia.platform} • {activeMedia.category}</span>
              <h4>{activeMedia.title}</h4>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="btn-play-pause-circle"
              >
                {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white mr-1" />}
              </button>
            </div>

            {/* Live Synchronized Floating Captions Layer */}
            {captionsActive && (
              <div className="floating-video-caption-bar">
                <div className="caption-live-indicator">
                  <span className="live-dot-green"></span>
                  ترجمة فورية متزامنة
                </div>
                <p className="caption-live-text">{activeMedia.caption}</p>
              </div>
            )}
          </div>

          {/* Player DSP & Captions Toolbar */}
          <div className="player-controls-toolbar">
            <div className="toolbar-left">
              <button
                onClick={() => setDspBoostActive(!dspBoostActive)}
                className={`tool-toggle-btn ${dspBoostActive ? 'active' : ''}`}
              >
                <Volume2 className="w-4 h-4 ml-2" />
                تعويض الترددات السمعية (DSP): {dspBoostActive ? 'مفعّل ⚡' : 'معطل'}
              </button>
              <button
                onClick={() => setCaptionsActive(!captionsActive)}
                className={`tool-toggle-btn ${captionsActive ? 'active' : ''}`}
              >
                <Captions className="w-4 h-4 ml-2" />
                الترجمة المرئية (Captions): {captionsActive ? 'ظاهرة 💬' : 'مخفية'}
              </button>
            </div>

            <span className="dsp-status-note">
              {dspBoostActive ? '✨ الصوت مكيّف تلقائياً لتعويض فقدان السمع' : 'صوت عادي بدون معالجة'}
            </span>
          </div>
        </div>

        {/* Media Playlist */}
        <div className="browser-playlist">
          <h5>فيديوهات وتطبيقات تعليمية تجريبية:</h5>
          <div className="playlist-items">
            {MEDIA_DEMOS.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveMedia(item);
                  setUrlInput(`https://${item.platform.toLowerCase()}.com/watch?id=${item.embedId}`);
                }}
                className={`playlist-card ${activeMedia.id === item.id ? 'active' : ''}`}
              >
                <strong>{item.title}</strong>
                <small>{item.platform} • {item.category}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
