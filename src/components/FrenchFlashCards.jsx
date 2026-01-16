import React, { useState, useEffect, useRef } from 'react';

// Подключаем Geist из Google Fonts и отключаем зум на мобилках
if (typeof document !== 'undefined') {
  // Set viewport to prevent zoom
  let viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, viewport-fit=cover');
  } else {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, viewport-fit=cover';
    document.head.appendChild(viewport);
  }
  
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // === iOS / Safari icons (favicon + Home Screen) ===
  // Note: files must exist in /public: /favicon.ico, /apple-touch-icon.png, /site.webmanifest
  const ensureLink = ({ rel, href, sizes, type }) => {
    const selector = `link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ''}`;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      if (sizes) el.sizes = sizes;
      if (type) el.type = type;
      document.head.appendChild(el);
    }
    el.href = href;
    return el;
  };

  ensureLink({ rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' });
  ensureLink({ rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' });
  ensureLink({ rel: 'manifest', href: '/site.webmanifest' });

  const ensureMeta = ({ name, content, property }) => {
    const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      if (name) el.setAttribute('name', name);
      if (property) el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
    return el;
  };

  // Recommended for PWA-ish appearance; safe even if not used
  ensureMeta({ name: 'theme-color', content: '#F6F2F2' });
  ensureMeta({ name: 'apple-mobile-web-app-capable', content: 'yes' });
  ensureMeta({ name: 'apple-mobile-web-app-status-bar-style', content: 'default' });

  // Add CSS for back button
  const style = document.createElement('style');
  style.textContent = `
    html, body {
      background-color: #F6F2F2;
      -webkit-user-select: none;
      user-select: none;
      padding-bottom: env(safe-area-inset-bottom);
    }

    /* iOS Home Screen overscroll background fix (keep bounce) */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background: #F6F2F2;
      z-index: -1;
    }

    /* === Hide scrollbars (mobile & desktop) === */
    html, body {
      scrollbar-width: none; /* Firefox */
    }
    html::-webkit-scrollbar,
    body::-webkit-scrollbar {
      display: none; /* Chrome, Safari */
    }
    
    input, button, textarea, select {
      font-size: 16px !important;
      -webkit-user-select: text;
      user-select: text;
    }
    
    .sidebar-buttons-container {
      position: fixed;
      left: 48px !important;
      top: 48px !important;
      display: flex !important;
      flex-direction: column !important;
      flex-wrap: nowrap !important;
      gap: 8px;
      z-index: 10;
      width: auto;
      height: auto;
      transition: all 0.3s ease;
    }
    
    [draggable="true"],
    .cursor-move,
    .cursor-pointer {
      -webkit-user-select: none;
      user-select: none;
    }
    
    .topic-item {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      /* Allow normal vertical scrolling; long-press drag will temporarily switch to 'none' via inline styles */
      touch-action: pan-y;
    }
    .topic-item * {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      /* Critical for iOS: ensure children don't override the parent touch-action */
      touch-action: inherit;
    }
    
    .back-button-sidebar, .export-button-sidebar, .import-button-sidebar {
      width: 56px;
      height: 56px;
      background: #EEEAEA;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
      padding: 0;
    }
    
    .back-button-sidebar:hover, .export-button-sidebar:hover, .import-button-sidebar:hover {
      background: #D9D8D5;
    }
    
    .export-button-sidebar:disabled, .import-button-sidebar:disabled {
      background: #D1D0CE;
      cursor: not-allowed;
      opacity: 0.5;
    }
    
    .export-button-sidebar:disabled:hover, .import-button-sidebar:disabled:hover {
      background: #D1D0CE;
    }
    
    .back-button-sidebar div, .export-button-sidebar div, .import-button-sidebar div {
      background: transparent;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      flex-shrink: 0;
    }
    
    .sidebar-buttons-container-right {
      position: fixed;
      left: 48px !important;
      right: auto !important;
      top: 50%;
      transform: translateY(-50%);
      display: flex !important;
      flex-direction: column !important;
      flex-wrap: nowrap !important;
      gap: 8px;
      z-index: 10;
      width: auto;
      height: auto;
    }
    
    /* Celebration Modal Styles */
    .celebration-modal-overlay {
      padding: 16px;
      box-sizing: border-box;
    }
    
    .celebration-modal-content {
      width: 100%;
      padding: 16px;
    }
    
    /* API Key Modal Styles */
    .api-key-modal-overlay {
      padding: 16px;
      box-sizing: border-box;
    }
    
    .api-key-modal-content {
      width: 100%;
      padding: 16px;
      max-width: 480px;
      border-radius: 20px !important;
    }
    
    /* Fix autofill transparency issue */
    input[type="password"]:-webkit-autofill,
    input[type="password"]:-webkit-autofill:hover,
    input[type="password"]:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
      box-shadow: 0 0 0 1000px #ffffff inset !important;
    }
    
    input[type="password"]:-webkit-autofill {
      -webkit-text-fill-color: #000000 !important;
    }
    
    /* Fix selection text color */
    input[type="password"]::selection {
      background-color: rgba(0, 0, 0, 0.1);
      color: #000000;
    }
    
    input[type="password"]::-moz-selection {
      background-color: rgba(0, 0, 0, 0.1);
      color: #000000;
    }
    
    .api-key-input-wrapper {
      /* margin-bottom removed */
    }
    
    .celebration-modal-content {
      border-radius: 20px !important;
    }
    
    /* Gap between input and buttons */
    .api-key-modal-content input {
      /* margin-bottom removed */
    }
    
    @media (min-width: 769px) {
      .celebration-modal-content {
        border-radius: 24px !important;
        width: 480px !important;
        padding: 32px !important;
      }
      
      .celebration-modal-content h1 {
        font-size: 38px !important;
        line-height: 50px !important;
      }
      
      .api-key-modal-content {
        border-radius: 24px !important;
        padding: 32px 32px !important;
      }
      
      .api-key-input-wrapper {
        /* margin-bottom removed */
      }
      
      .api-key-modal-content h2 {
        font-size: 38px !important;
        line-height: 50px !important;
      }
      
      /* Gap between input and buttons on desktop */
      .api-key-modal-content input {
        /* margin-bottom removed */
      }
    }
    
    /* Mobile styles for modal titles */
    .celebration-modal-content h1 {
      font-size: 30px !important;
      line-height: 38px !important;
    }
    
    .api-key-modal-content h2 {
      font-size: 30px !important;
      line-height: 38px !important;
    }
    
    /* Десктоп когда не хватает места - кнопки в верхнюю часть */
    @media (max-width: 1200px) {
      .sidebar-buttons-container {
        position: fixed;
        left: 48px !important;
        top: 48px !important;
        flex-direction: row !important;
        gap: 8px;
      }
      
      .sidebar-buttons-container-right {
        position: fixed;
        left: auto !important;
        right: 48px !important;
        top: 48px !important;
        transform: none;
        flex-direction: row !important;
        gap: 8px;
      }
    }
    
    @media (max-width: 768px) {
      .py-28 {
        padding-top: 20px !important;
        padding-bottom: 20px !important;
      }
      
      .px-8 {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      
      .max-w-2xl {
        max-width: 100% !important;
      }
      
      .mobile-614 {
        width: 100% !important;
        padding: 16px !important;
        box-sizing: border-box !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      
      .mobile-614.mobile-slider {
        padding: 0 16px 0 16px !important;
      }
      
      .mobile-614.mobile-word-form {
        padding-top: 16px !important;
        padding-bottom: 16px !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      
      .mobile-614.mobile-word-form > * {
        padding-left: 0 !important;
        padding-right: 0 !important;
        box-sizing: border-box !important;
      }
      
      .mobile-614.mobile-word-form > *:not(h2) {
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      
      .mobile-614.mobile-word-form > .mobile-header-section {
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      
      .mobile-614.mobile-word-form .mobile-header-section h2 {
        padding-left: 6px !important;
        padding-right: 6px !important;
      }
      
      .mobile-614.mobile-word-form .mobile-flex-column {
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      
      .mobile-614.mobile-word-form .px-5 {
        margin-left: 0 !important;
        margin-right: 0 !important;
        border-radius: 12px !important;
      }
      
      .mobile-word-form .h-28 {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      
      /* Buttons and inputs border radius on mobile */
      .mobile-614 input,
      .mobile-614 button,
      .rounded-xl {
        border-radius: 12px !important;
      }
      
      .mobile-word-form h2 {
        padding-left: 6px !important;
        padding-right: 6px !important;
      }
      
      .mobile-word-form .mobile-header-section {
        padding-left: 6px !important;
        padding-right: 6px !important;
      }
      
      .mobile-cards-container .mobile-614 {
        margin: 0 16px 16px 16px !important;
      }
      
      .mobile-cards-container .mobile-slider {
        margin: 0 0 16px 0 !important;
      }
      
      /* Table wrapper on mobile */
      @media (max-width: 768px) {
        .conjugation-table-wrapper {
          padding-left: 16px !important;
          padding-right: 16px !important;
          margin-left: -16px !important;
          margin-right: -16px !important;
          width: calc(100% + 32px) !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
      }
      
      /* Card table wrapper styles */
      .card-table-wrapper {
        display: block;
        margin-top: auto;
        margin-left: -32px;
        margin-right: -32px;
        margin-bottom: -16px;
        padding: 0 16px 16px 16px !important;
        box-sizing: border-box;
      }
      
      /* Mobile override for inline styles */
      @media (max-width: 768px) {
        .card-table-wrapper {
          padding-bottom: 16px !important;
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
        
        /* Override card list font size on mobile */
        .card-french-title {
          font-size: 16px !important;
          line-height: 28px !important;
        }
        
        .topic-name {
          font-size: 16px !important;
          line-height: 28px !important;
        }
      }
      
      /* Desktop styles */
      .card-french-title {
        font-size: 16px !important;
        line-height: 28px !important;
      }
      
      .topic-name {
        font-size: 16px !important;
        line-height: 28px !important;
      }
      
      /* Desktop styles */
      @media (min-width: 769px) {
        .card-table-wrapper {
          margin-left: 0 !important;
          margin-right: 0 !important;
          margin-bottom: 0 !important;
        }
      }
      
      /* Card back side responsive padding */
      .card-back {
        padding: 32px 32px 16px 32px !important;
      }
      
      @media (min-width: 769px) {
        .card-back {
          padding: 32px 32px 32px 32px !important;
          overflow: hidden !important;
        }
      }
      
      .mobile-section-spacing {
        margin-top: 48px !important;
      }
      
      .mobile-cards-container {
        padding: 0 !important;
      }
      
      .mobile-cards-container p {
        margin-bottom: 20px !important;
      }
      
      .mobile-614[style*="height: '560px'"],
      .mobile-614[style*='height: "560px"'] {
        height: auto !important;
        max-height: 500px !important;
      }
      
      .mobile-header-section {
        padding-left: 6px !important;
        padding-right: 6px !important;
      }
      
      h2.mobile-header-section {
        padding-left: 6px !important;
        padding-right: 6px !important;
      }
      
      .unified-section-header {
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      
      @media (max-width: 768px) {
        .unified-section-header {
          margin-left: 8px !important;
          margin-right: 8px !important;
        }
      }
      
      .mobile-word-form h2.mobile-header-section {
        padding-left: 6px !important;
        padding-right: 6px !important;
      }
      
      .mobile-flex-column {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 12px !important;
      }
      
      .mobile-input-group {
        width: 100% !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 8px !important;
        min-width: 0 !important;
        overflow: hidden !important;
      }
      
      .mobile-input-group input {
        flex: 1 !important;
        width: auto !important;
        min-width: 0 !important;
      }
      
      .mobile-flex-column button {
        width: 100% !important;
      }
      
      /* Reduce border radius on mobile */
      [style*="borderRadius: '24px'"],
      [style*='borderRadius: "32px"'],
      [style*="borderRadius: 32px"],
      [style*="borderRadius:'32px'"],
      [style*='borderRadius:"32px"'],
      .mobile-614[style*="borderRadius"],
      .bg-white[style*="borderRadius"] {
        border-radius: 24px !important;
      }
    }
    
    /* Reduce border radius everywhere */
    [style*="borderRadius: '24px'"],
    [style*='borderRadius: "32px"'],
    [style*="borderRadius: 32px"],
    [style*="borderRadius:'32px'"],
    [style*='borderRadius:"32px"'],
    .mobile-614[style*="borderRadius"],
    .bg-white[style*="borderRadius"] {
      border-radius: 24px !important;
    }
    
    /* Universal input styling */
    .uniform-input {
      border: 1.5px solid rgba(0, 0, 0, 0.12) !important;
      boxSizing: border-box !important;
      fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" !important;
      fontSize: 16px !important;
      fontWeight: 500 !important;
      lineHeight: 24px !important;
      letterSpacing: 0% !important;
      color: rgba(0, 0, 0, 0.5) !important;
      outline: none !important;
      background: transparent !important;
      padding: 16px 20px !important;
    }
    
    /* Global input styles */
    input {
      outline: none !important;
      outline-width: 0 !important;
      box-shadow: none !important;
      -webkit-focus-ring-color: transparent !important;
    }
    
    /* Remove focus effects */
    input:focus,
    input:active {
      outline: none !important;
      outline-width: 0 !important;
      outline-style: none !important;
      outline-offset: 0 !important;
      box-shadow: none !important;
      -webkit-focus-ring-color: transparent !important;
    }
    
    input:focus-visible {
      outline: none !important;
      outline-width: 0 !important;
      outline-style: none !important;
      outline-offset: 0 !important;
      box-shadow: none !important;
      -webkit-focus-ring-color: transparent !important;
    }
    
    /* Mobile keyboard handling */
    @supports (padding-bottom: max(0px)) {
      body {
        padding-bottom: env(safe-area-inset-bottom);
      }
    }
    
    input:-webkit-autofill:focus {
      outline: none !important;
      outline-width: 0 !important;
      box-shadow: none !important;
      -webkit-focus-ring-color: transparent !important;
    }
    
    input:-moz-focusring {
      outline: none !important;
      outline-width: 0 !important;
      box-shadow: none !important;
    }
    
    /* Slider container - reset margins and padding */
    .overflow-hidden.rounded-2xl.relative.mobile-614.mobile-slider {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Slider transform layer - reset margins and padding */
    .flex.h-full.transition-transform {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Individual card wrapper - reset margins and padding */
    .flex-shrink-0.w-full.h-full.flex.items-center.justify-center {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Card flip element - reset margins and padding */
    .relative.w-full.h-full.transition-transform.duration-500 {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Marquee animation for long topic names */
    @keyframes marquee {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    
    .marquee-container {
      position: relative;
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
    }
    
    .topic-title-marquee {
      white-space: nowrap;
      display: block;
      margin: 0;
      transform: translateX(0);
    }
    
    .topic-title-marquee.animate {
      display: inline-block;
      animation: marquee var(--animation-duration, 20s) linear infinite;
      will-change: transform;
    }
    
    /* Delete button styles */
    button.delete-card-button {
      width: 40px !important;
      height: 56px !important;
      border-radius: 8px !important;
      border: none !important;
      background-color: transparent !important;
      cursor: pointer !important;
      transition: background-color 0.2s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      padding: 0 !important;
      pointer-events: auto !important;
      z-index: 100 !important;
      position: relative !important;
    }
    
    button.delete-card-button:hover {
      background-color: rgba(0, 0, 0, 0.25) !important;
    }
    
    /* Mobile sidebar positioning - LAST TO ENSURE PRIORITY */
    @media (max-width: 768px) {
      .sidebar-buttons-container {
        left: 16px !important;
        top: 16px !important;
      }
      
      .sidebar-buttons-container-right {
        left: auto !important;
        right: 16px !important;
        top: 16px !important;
        transform: none !important;
      }
    }
    /* === Capitalize Russian text (display only) === */
.russian-word,
.word-translation,
.word-title,
.word-title-ru {
  text-transform: capitalize;
}

/* Inline-styled Russian titles/subtitles */
p[style*="font-size: 32px"],
p[style*="font-size: 14px"] {
  text-transform: capitalize;
}

`;
  document.head.appendChild(style);
}

// Компонент для таблицы информации о слове
const InfoTable = ({ partOfSpeech, gender }) => {
  return (
    <table className="w-full text-white text-sm mb-3">
      <tbody>
        <tr className="border-b border-gray-300">
          <td className="py-2 px-3 font-semibold text-left bg-green-600">Часть речи:</td>
          <td className="py-2 px-3 text-left">{partOfSpeech}</td>
        </tr>
        <tr>
          <td className="py-2 px-3 font-semibold text-left bg-green-600">Род:</td>
          <td className="py-2 px-3 text-left">{gender}</td>
        </tr>
      </tbody>
    </table>
  );
};

// Компонент для таблицы на белом фоне (обратная сторона карточки)
const ConjugationTableWhite = ({ conjugation, word }) => {
  
  const lines = conjugation.split('\n');
  const formsStart = lines.findIndex(line => !line.startsWith('Часть речи:') && !line.startsWith('Род:') && line.trim());
  const forms = formsStart !== -1 ? lines.slice(formsStart) : [];

  // Функция для выделения окончания
  const highlightEnding = (verbForm, baseWord) => {
    if (!baseWord || !verbForm) return verbForm;

    const cleanVerb = String(verbForm).trim();
    let cleanBase = String(baseWord).trim();

    // Remove reflexive prefix from base word for comparison
    if (cleanBase.toLowerCase().startsWith('se ')) {
      cleanBase = cleanBase.substring(3).trim();
    } else if (cleanBase.toLowerCase().startsWith("s'")) {
      cleanBase = cleanBase.substring(2).trim();
    }

    // Split reflexive pronoun prefix from the conjugated form (me/te/se/nous/vous/m'/t'/s')
    const reflexiveMatch = cleanVerb.match(/^((?:(?:m'|t'|s')|(?:(?:me|te|se|nous|vous)\s+)))/i);
    const reflexivePrefix = reflexiveMatch ? reflexiveMatch[1] : '';
    const verbWithoutReflexive = cleanVerb.slice(reflexivePrefix.length).trim();

    // For matching, compare stems in lowercase
    let baseForMatching = cleanBase.toLowerCase();

    // Remove typical French infinitive endings to better match the stem
    if (baseForMatching.endsWith('er')) {
      baseForMatching = baseForMatching.slice(0, -2);
    } else if (baseForMatching.endsWith('ir')) {
      baseForMatching = baseForMatching.slice(0, -2);
    } else if (baseForMatching.endsWith('re')) {
      baseForMatching = baseForMatching.slice(0, -2);
    } else if (baseForMatching.endsWith('oir')) {
      baseForMatching = baseForMatching.slice(0, -3);
    }

    const comparison = verbWithoutReflexive.toLowerCase();

    // Find common prefix length (stem)
    let commonLength = 0;
    const minLength = Math.min(baseForMatching.length, comparison.length);

    for (let i = 0; i < minLength; i++) {
      if (baseForMatching[i] === comparison[i]) {
        commonLength = i + 1;
      } else {
        break;
      }
    }

    // If the match is too short, don't highlight
    if (commonLength < 3) {
      return cleanVerb;
    }

    if (commonLength > 0 && commonLength < verbWithoutReflexive.length) {
      const root = verbWithoutReflexive.substring(0, commonLength);
      const ending = verbWithoutReflexive.substring(commonLength);
      return `${reflexivePrefix}${root}<b>${ending}</b>`;
    }

    return cleanVerb;
  };

  const parseConjugation = () => {
    // Support common Gemini variations: j', je, il, elle, ils, elles, and separators (commas/newlines/semicolons)
    const pronouns = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'];

    const aliases = {
      'je': ["je", "j'"],
      'tu': ["tu"],
      'il/elle': ["il/elle", "il", "elle"],
      'nous': ["nous"],
      'vous': ["vous"],
      'ils/elles': ["ils/elles", "ils", "elles"],
    };

    const result = {};
    pronouns.forEach((p) => { result[p] = ''; });

    // Normalize whitespace & separators
    let text = forms.join(' ').replace(/\s+/g, ' ').trim();
    if (!text) {
      return pronouns.map(p => ({ pronoun: p, verbForm: '' }));
    }

    // Build a regex that finds pronoun tokens anywhere in the string.
    // Note: "j'" can be attached, so we handle it separately.
    const tokenMap = [];
    for (const p of pronouns) {
      for (const a of (aliases[p] || [])) tokenMap.push({ canonical: p, token: a });
    }
    // Longest tokens first to avoid matching "il" inside "il/elle"
    tokenMap.sort((a, b) => b.token.length - a.token.length);

    const tokenPattern = tokenMap
      .map(t => t.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    const reToken = new RegExp(`(?:^|\\s)(${tokenPattern})(?=\\s|$)`, 'ig');

    const matches = [];
    for (const m of text.matchAll(reToken)) {
      const raw = (m[1] || '').toLowerCase();
      const start = m.index + (m[0].startsWith(' ') ? 1 : 0); // skip leading space if matched via (?:^|\s)
      const end = start + (m[1] || '').length;

      // Resolve canonical pronoun
      let canonical = null;
      for (const tm of tokenMap) {
        if (tm.token.toLowerCase() === raw) { canonical = tm.canonical; break; }
      }
      if (canonical) matches.push({ canonical, start, end });
    }

    // Special case: "j'" is often attached (no spaces). Catch it if not found above.
    if (!matches.some(m => m.canonical === 'je')) {
      const jIdx = text.toLowerCase().indexOf("j'");
      if (jIdx === 0) {
        matches.unshift({ canonical: 'je', start: 0, end: 2 });
      }
    }

    if (matches.length === 0) {
      // If no pronouns detected, put everything under 'je'
      result['je'] = text;
      return pronouns.map(p => ({ pronoun: p, verbForm: result[p] || '' }));
    }

    // Sort and de-duplicate by earliest occurrence
    matches.sort((a, b) => a.start - b.start);
    const compact = [];
    for (const m of matches) {
      const prev = compact[compact.length - 1];
      if (!prev || (prev.start !== m.start || prev.canonical !== m.canonical)) {
        compact.push(m);
      }
    }

    for (let i = 0; i < compact.length; i++) {
      const cur = compact[i];
      const next = compact[i + 1];
      const startIdx = cur.end;
      const endIdx = next ? next.start : text.length;
      let form = text.substring(startIdx, endIdx).trim();

      // Clean common separators right after pronoun
      form = form.replace(/^[:\-–—]/, '').trim();
      form = form.replace(/^[,;]+/, '').trim();

      // Remove trailing commas (Gemini sometimes returns forms like "Apprends,")
      form = form.replace(/[,，]+\s*$/g, '').trim();

      result[cur.canonical] = form;
    }

    return pronouns.map(p => ({
      pronoun: p,
      verbForm: result[p] || ''
    }));
  };

  const parsedForms = parseConjugation();
  const baseWord = word ? word.toLowerCase() : '';

  return (
    <table className="text-gray-800 text-base w-full" style={{ borderRadius: '16px', overflow: 'hidden', borderCollapse: 'separate', borderSpacing: 0, margin: 0 }}>
      <tbody>
        {parsedForms.map((form, idx) => {
          const highlighted = highlightEnding(form.verbForm, baseWord);
          const isFirst = idx === 0;
          const isLast = idx === parsedForms.length - 1;
          
          return (
            <tr 
              key={idx} 
              style={{
                borderTopLeftRadius: isFirst ? '16px' : '0',
                borderTopRightRadius: isFirst ? '16px' : '0',
                borderBottomLeftRadius: isLast ? '16px' : '0',
                borderBottomRightRadius: isLast ? '16px' : '0',
              }}
            >
              <td 
                className="text-left font-semibold"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  borderTopLeftRadius: isFirst ? '16px' : '0',
                  borderBottomLeftRadius: isLast ? '16px' : '0',
                  borderLeft: '2px solid rgba(0, 0, 0, 0.08)',
                  borderRight: '2px solid rgba(0, 0, 0, 0.08)',
                  borderTop: isFirst ? '2px solid rgba(0, 0, 0, 0.08)' : 'none',
                  borderBottom: '2px solid rgba(0, 0, 0, 0.08)',
                  padding: '12px 16px',
                  width: '100px',
                  boxSizing: 'border-box',
                  textTransform: 'capitalize'
                }}
              >
                {form.pronoun}
              </td>
              <td 
                className="text-left"
                dangerouslySetInnerHTML={{ __html: highlighted }}
                style={{
                  borderTopRightRadius: isFirst ? '16px' : '0',
                  borderBottomRightRadius: isLast ? '16px' : '0',
                  borderRight: '2px solid rgba(0, 0, 0, 0.08)',
                  borderTop: isFirst ? '2px solid rgba(0, 0, 0, 0.08)' : 'none',
                  borderBottom: '2px solid rgba(0, 0, 0, 0.08)',
                  padding: '12px 16px',
                  flex: 1,
                  textTransform: 'capitalize'
                }}
              />
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

// Компонент для отображения спряжения в таблице
const ConjugationTable = ({ conjugation, word }) => {
  const lines = conjugation.split('\n');
  const formsStart = lines.findIndex(line => !line.startsWith('Часть речи:') && !line.startsWith('Род:') && line.trim());
  const forms = formsStart !== -1 ? lines.slice(formsStart) : [];

  // Функция для выделения окончания
  const highlightEnding = (verbForm, baseWord) => {
    if (!baseWord || !verbForm) return verbForm;

    const cleanVerb = String(verbForm).trim();
    let cleanBase = String(baseWord).trim();

    // Remove reflexive prefix from base word for comparison
    if (cleanBase.toLowerCase().startsWith('se ')) {
      cleanBase = cleanBase.substring(3).trim();
    } else if (cleanBase.toLowerCase().startsWith("s'")) {
      cleanBase = cleanBase.substring(2).trim();
    }

    // Split reflexive pronoun prefix from the conjugated form (me/te/se/nous/vous/m'/t'/s')
    const reflexiveMatch = cleanVerb.match(/^((?:(?:m'|t'|s')|(?:(?:me|te|se|nous|vous)\s+)))/i);
    const reflexivePrefix = reflexiveMatch ? reflexiveMatch[1] : '';
    const verbWithoutReflexive = cleanVerb.slice(reflexivePrefix.length).trim();

    // For matching, compare stems in lowercase
    let baseForMatching = cleanBase.toLowerCase();

    // Remove typical French infinitive endings to better match the stem
    if (baseForMatching.endsWith('er')) {
      baseForMatching = baseForMatching.slice(0, -2);
    } else if (baseForMatching.endsWith('ir')) {
      baseForMatching = baseForMatching.slice(0, -2);
    } else if (baseForMatching.endsWith('re')) {
      baseForMatching = baseForMatching.slice(0, -2);
    } else if (baseForMatching.endsWith('oir')) {
      baseForMatching = baseForMatching.slice(0, -3);
    }

    const comparison = verbWithoutReflexive.toLowerCase();

    // Find common prefix length (stem)
    let commonLength = 0;
    const minLength = Math.min(baseForMatching.length, comparison.length);

    for (let i = 0; i < minLength; i++) {
      if (baseForMatching[i] === comparison[i]) {
        commonLength = i + 1;
      } else {
        break;
      }
    }

    // If the match is too short, don't highlight
    if (commonLength < 3) {
      return cleanVerb;
    }

    if (commonLength > 0 && commonLength < verbWithoutReflexive.length) {
      const root = verbWithoutReflexive.substring(0, commonLength);
      const ending = verbWithoutReflexive.substring(commonLength);
      return `${reflexivePrefix}${root}<b>${ending}</b>`;
    }

    return cleanVerb;
  };

  const parseConjugation = () => {
    // Support common Gemini variations: j', je, il, elle, ils, elles, and separators (commas/newlines/semicolons)
    const pronouns = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'];

    const aliases = {
      'je': ["je", "j'"],
      'tu': ["tu"],
      'il/elle': ["il/elle", "il", "elle"],
      'nous': ["nous"],
      'vous': ["vous"],
      'ils/elles': ["ils/elles", "ils", "elles"],
    };

    const result = {};
    pronouns.forEach((p) => { result[p] = ''; });

    // Normalize whitespace & separators
    let text = forms.join(' ').replace(/\s+/g, ' ').trim();
    if (!text) {
      return pronouns.map(p => ({ pronoun: p, verbForm: '' }));
    }

    // Build a regex that finds pronoun tokens anywhere in the string.
    // Note: "j'" can be attached, so we handle it separately.
    const tokenMap = [];
    for (const p of pronouns) {
      for (const a of (aliases[p] || [])) tokenMap.push({ canonical: p, token: a });
    }
    // Longest tokens first to avoid matching "il" inside "il/elle"
    tokenMap.sort((a, b) => b.token.length - a.token.length);

    const tokenPattern = tokenMap
      .map(t => t.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    const reToken = new RegExp(`(?:^|\\s)(${tokenPattern})(?=\\s|$)`, 'ig');

    const matches = [];
    for (const m of text.matchAll(reToken)) {
      const raw = (m[1] || '').toLowerCase();
      const start = m.index + (m[0].startsWith(' ') ? 1 : 0); // skip leading space if matched via (?:^|\s)
      const end = start + (m[1] || '').length;

      // Resolve canonical pronoun
      let canonical = null;
      for (const tm of tokenMap) {
        if (tm.token.toLowerCase() === raw) { canonical = tm.canonical; break; }
      }
      if (canonical) matches.push({ canonical, start, end });
    }

    // Special case: "j'" is often attached (no spaces). Catch it if not found above.
    if (!matches.some(m => m.canonical === 'je')) {
      const jIdx = text.toLowerCase().indexOf("j'");
      if (jIdx === 0) {
        matches.unshift({ canonical: 'je', start: 0, end: 2 });
      }
    }

    if (matches.length === 0) {
      // If no pronouns detected, put everything under 'je'
      result['je'] = text;
      return pronouns.map(p => ({ pronoun: p, verbForm: result[p] || '' }));
    }

    // Sort and de-duplicate by earliest occurrence
    matches.sort((a, b) => a.start - b.start);
    const compact = [];
    for (const m of matches) {
      const prev = compact[compact.length - 1];
      if (!prev || (prev.start !== m.start || prev.canonical !== m.canonical)) {
        compact.push(m);
      }
    }

    for (let i = 0; i < compact.length; i++) {
      const cur = compact[i];
      const next = compact[i + 1];
      const startIdx = cur.end;
      const endIdx = next ? next.start : text.length;
      let form = text.substring(startIdx, endIdx).trim();

      // Clean common separators right after pronoun
      form = form.replace(/^[:\-–—]/, '').trim();
      form = form.replace(/^[,;]+/, '').trim();

      // Remove trailing commas (Gemini sometimes returns forms like "Apprends,")
      form = form.replace(/[,，]+\s*$/g, '').trim();

      result[cur.canonical] = form;
    }

    return pronouns.map(p => ({
      pronoun: p,
      verbForm: result[p] || ''
    }));
  };

  const parsedForms = parseConjugation();
  const baseWord = word ? word.toLowerCase() : '';

  return (
    <table className="text-white text-base w-full" style={{ margin: 0 }}>
      <tbody>
        {parsedForms.map((form, idx) => {
          const highlighted = highlightEnding(form.verbForm, baseWord);
          
          return (
            <tr key={idx} className="border-b border-gray-300">
              <td 
                className="py-4 px-4 text-left font-semibold bg-green-600"
                style={{ width: '100px', boxSizing: 'border-box' }}
              >
                {form.pronoun}
              </td>
              <td 
                className="py-4 px-4 text-left"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

// Основной компонент приложения
export default function FrenchFlashCardsApp() {
  // Константы для слайдера карточек
  const CARD_WIDTH = 614;  // Ширина контейнера слайдера
  const CARD_GAP = 16;     // Gap между карточками
  const SLIDE_WIDTH = CARD_WIDTH + CARD_GAP;  // 630px - полная ширина одного слайда

  // Persist / restore last screen (home vs topic)
  const VIEW_STATE_KEY = "french_view_state_v1";
  const didRestoreViewStateRef = useRef(false);
  
  const [topics, setTopics] = useState([]);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [newFrench, setNewFrench] = useState('');
  const [newRussian, setNewRussian] = useState('');
  const [conjugation, setConjugation] = useState(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [wordsAddedCount, setWordsAddedCount] = useState(0);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [successes, setSuccesses] = useState([]);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [mouseDown, setMouseDown] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);
  const [dragStart, setDragStart] = useState(0);
  const [wasDragged, setWasDragged] = useState(false);
  const [canFlip, setCanFlip] = useState(true);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [draggedTopicId, setDraggedTopicId] = useState(null);
  const [dragOverTopicId, setDragOverTopicId] = useState(null);
  const [draggedCardIndex, setDraggedCardIndex] = useState(null);
  const [dragOverCardIndex, setDragOverCardIndex] = useState(null);
  const [touchDragTopicId, setTouchDragTopicId] = useState(null);
  const [touchDragOverTopicId, setTouchDragOverTopicId] = useState(null);
  // Mobile long-press drag for word cards list
  const [touchDraggedWordCardIndex, setTouchDraggedWordCardIndex] = useState(null);
  const [touchDragOverWordCardIndex, setTouchDragOverWordCardIndex] = useState(null);
  const [isTouchWordCardDragging, setIsTouchWordCardDragging] = useState(false);
  const [pointerDownTopic, setPointerDownTopic] = useState(null);
  const [pointerDownTime, setPointerDownTime] = useState(null);
  const [editablePartOfSpeech, setEditablePartOfSpeech] = useState('');
  const [editableTypeOfWord, setEditableTypeOfWord] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // API Key states
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Функция валидации Gemini API ключа
  const validateApiKey = (key) => {
    const trimmedKey = key.trim();
    
    // Проверка на пустое значение
    if (!trimmedKey) {
      return 'API Key cannot be empty';
    }
    
    // Проверка на корректный формат Gemini API ключа
    if (!trimmedKey.startsWith('AIza')) {
      return 'Invalid API Key format. Must start with "AIza"';
    }
    
    // Проверка минимальной длины (достаточно 35 символов для Gemini ключа)
    if (trimmedKey.length < 35) {
      return 'API Key is too short (minimum 35 characters)';
    }
    
    return '';
  };
  
  // States для настроек типографии карточек
  const [cardFontFamily, setCardFontFamily] = useState('Geist');
  const [cardFontWeight, setCardFontWeight] = useState('500');
  const [cardFontSize, setCardFontSize] = useState('32');
  const [cardLineHeight, setCardLineHeight] = useState('24');
  const [cardLetterSpacing, setCardLetterSpacing] = useState('0');
  const [cardTextAlign, setCardTextAlign] = useState('center');
  const [shouldDuplicateTitle, setShouldDuplicateTitle] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(20);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUserId, setLoginUserId] = useState('');
  const [tempLoginUserId, setTempLoginUserId] = useState('');
  
  const inputRef = useRef(null);
  const topicTitleRef = useRef(null);

  // We use HTML5 drag&drop only on non-touch devices. Touch devices use the long-press pointer implementation.
  const IS_TOUCH_DEVICE = (typeof window !== 'undefined') && (('ontouchstart' in window) || (navigator?.maxTouchPoints > 0));

  // ===== Mobile long-press drag (TOPICS list) =====
  // Keep normal scrolling; start drag only after a short hold.
  const TOPIC_HOLD_MS = 140;
  const topicHoldTimeoutRef = useRef(null);
  const topicPointerIdRef = useRef(null);
  const topicPointerTargetRef = useRef(null);
  const topicDragActivatedRef = useRef(false);
  const topicDragMovedRef = useRef(false);
  const topicStartYRef = useRef(null);
  const topicStartIdRef = useRef(null);
  const topicHoverIdRef = useRef(null);
  const suppressNextTopicClickRef = useRef(0);

  // Prevent page scroll while a topic drag is active on touch devices (iOS Safari needs a non-passive touchmove listener)
  const topicScrollBlockerRef = useRef(null);
  const TOPIC_TOUCHMOVE_OPTIONS = useRef({ passive: false });
  const topicPrevTouchActionRef = useRef(null);

  const enableTopicScrollBlock = () => {
    if (topicScrollBlockerRef.current) return;
    const blocker = (ev) => {
      ev.preventDefault();
    };
    topicScrollBlockerRef.current = blocker;
    window.addEventListener('touchmove', blocker, TOPIC_TOUCHMOVE_OPTIONS.current);
  };

  const disableTopicScrollBlock = () => {
    if (!topicScrollBlockerRef.current) return;
    window.removeEventListener('touchmove', topicScrollBlockerRef.current, TOPIC_TOUCHMOVE_OPTIONS.current);
    topicScrollBlockerRef.current = null;
  };

  const cleanupTopicTouchDrag = () => {
    if (topicHoldTimeoutRef.current) {
      clearTimeout(topicHoldTimeoutRef.current);
      topicHoldTimeoutRef.current = null;
    }
    disableTopicScrollBlock();

    // Restore original touch-action to keep the page scrollable
    try {
      if (topicPointerTargetRef.current) {
        topicPointerTargetRef.current.style.touchAction = topicPrevTouchActionRef.current ?? '';
      }
    } catch (_) {}
    topicPrevTouchActionRef.current = null;

    // Release capture (if any)
    try {
      if (topicPointerTargetRef.current && topicPointerIdRef.current != null) {
        topicPointerTargetRef.current.releasePointerCapture?.(topicPointerIdRef.current);
      }
    } catch (_) {}

    // Ensure we always restore scrolling after a drag
    disableTopicScrollBlock();
    try {
      if (topicPointerTargetRef.current) {
        topicPointerTargetRef.current.style.touchAction = topicPrevTouchActionRef.current ?? '';
      }
    } catch (_) {}
    topicPrevTouchActionRef.current = null;

    topicPointerIdRef.current = null;
    topicPointerTargetRef.current = null;
    topicDragActivatedRef.current = false;
    topicDragMovedRef.current = false;
    topicStartIdRef.current = null;
    topicHoverIdRef.current = null;

    setPointerDownTopic(null);
    setPointerDownTime(null);
    setTouchDragTopicId(null);
    setTouchDragOverTopicId(null);
  };

  // Safety net: on iOS Safari pointerup can be lost; always cleanup to avoid "page stuck / not scrollable" bugs
  useEffect(() => {
    const onUp = () => cleanupTopicTouchDrag();
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('blur', onUp);
    document.addEventListener('visibilitychange', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onUp);
      document.removeEventListener('visibilitychange', onUp);
    };
  }, []);


  // Загрузка данных из storage при загрузке
  useEffect(() => {
    loadTopics();
    
    // Загружаем API ключ
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      setApiKeyError('');
      setShowApiKeyModal(true);
    }
  }, []);
  
  // Close modals with Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (showApiKeyModal) {
        e.preventDefault();
        closeApiKeyModal();
        return;
      }
      if (showLoginModal) {
        e.preventDefault();
        closeLoginModal();
        return;
      }
      if (showCelebrationModal) {
        e.preventDefault();
        setShowCelebrationModal(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showApiKeyModal, showLoginModal, showCelebrationModal]);


  // Глобальные обработчики для drag-drop на странице
  useEffect(() => {
    const preventDragDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('dragover', preventDragDefault);
    document.addEventListener('drop', preventDragDefault);
    document.addEventListener('dragenter', preventDragDefault);
    document.addEventListener('dragleave', preventDragDefault);

    return () => {
      document.removeEventListener('dragover', preventDragDefault);
      document.removeEventListener('drop', preventDragDefault);
      document.removeEventListener('dragenter', preventDragDefault);
      document.removeEventListener('dragleave', preventDragDefault);
    };
  }, []);

  // Check if topic title overflows and apply marquee animation
  useEffect(() => {
    if (topicTitleRef.current && currentTopic) {
      const element = topicTitleRef.current;
      const container = element.parentElement;
      
      const checkOverflow = () => {
        // Force reflow
        element.offsetHeight;
        
        if (element.scrollWidth > container.clientWidth) {
          setShouldDuplicateTitle(true);
          
          // Calculate animation duration based on text width
          // 60px per second = smooth speed regardless of text length
          const textWidth = element.scrollWidth;
          const duration = Math.max(5, textWidth / 60); // minimum 5 seconds
          setAnimationDuration(duration);
          
          // Add small delay to ensure rendering is complete before animation starts
          // This prevents jitter on first open
          setTimeout(() => {
            element.classList.add('animate');
          }, 50);
        } else {
          element.classList.remove('animate');
          setShouldDuplicateTitle(false);
          setAnimationDuration(20);
        }
      };
      
      // Check immediately with requestAnimationFrame for better timing
      requestAnimationFrame(() => checkOverflow());
      
      // Add animation class with small delay to prevent jitter on first open
      // This ensures element is fully rendered before animation starts
      const timeoutId = setTimeout(() => {
        checkOverflow();
      }, 100);
      
      // Also check on window resize
      window.addEventListener('resize', checkOverflow);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', checkOverflow);
      };
    }
  }, [currentTopic]);

  
  // Scroll to top when opening a topic (mobile-friendly)
  useEffect(() => {
    if (currentTopic && currentTopic.id) {
      requestAnimationFrame(() => {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        } catch (e) {
          window.scrollTo(0, 0);
        }
      });
    }
  }, [currentTopic?.id]);

// ========== API CONFIG ==========

  // Helper функция для запроса к Claude API напрямую
  const callGeminiAPI = async (prompt) => {
    if (!apiKey) {
      throw new Error('API key not set. Please enter your Gemini API key.');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Проверяем что ответ содержит ожидаемые данные
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Unexpected API response structure:', JSON.stringify(data, null, 2));
      // Проверяем есть ли сообщение об ошибке от API
      if (data.error) {
        throw new Error(`API Error: ${data.error.message}`);
      }
      throw new Error('Could not parse translation from response');
    }
    
    return data.candidates[0].content.parts[0].text;
  };

  // ========== NOTIFICATION HELPERS ==========
  
  const addNotification = (setState, message, timeout = 10000) => {
    const id = Date.now();
    setState(prev => [...prev, { id, message }]);
    setTimeout(() => setState(prev => prev.filter(item => item.id !== id)), timeout);
  };

  const removeNotification = (setState, id) => {
    setState(prev => prev.filter(item => item.id !== id));
  };

  const addError = (message) => addNotification(setErrors, message, 10000);
  const removeError = (id) => removeNotification(setErrors, id);
  const addSuccess = (message) => addNotification(setSuccesses, message, 5000);
  const removeSuccess = (id) => removeNotification(setSuccesses, id);

  // Hide keyboard on mobile
  const hideKeyboard = () => {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      activeElement.blur();
    }
  };
  
  // Close modals by ESC / outside click (same behavior as Cancel buttons)
  const closeApiKeyModal = () => {
    setShowApiKeyModal(false);
    setTempApiKey('');
    setApiKeyError('');
    setShowPassword(false);
    hideKeyboard();
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setTempLoginUserId('');
    hideKeyboard();
  };


  // Функция экспорта всех тем
  // Загрузка всех тем
  const loadTopics = async () => {
    try {
      const result = localStorage.getItem('french-topics');
      if (result) {
        const data = JSON.parse(result);
        setTopics(data);
      }
    } catch (error) {
      console.log('Нет сохранённых тем');
    }
    setLoading(false);
  };

  // Сохранение тем в storage
  const saveTopics = async (updatedTopics) => {
    try {
      localStorage.setItem('french-topics', JSON.stringify(updatedTopics));
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  // Helper функция для обновления topics
  const updateTopics = (updatedTopics) => {
    console.log('updateTopics called with:', updatedTopics);
    setTopics(updatedTopics);
    saveTopics(updatedTopics);
    console.log('Topics saved and state updated');
  };

  // Helper функция для обновления текущей темы
  const updateCurrentTopic = (updatedTopics) => {
    updateTopics(updatedTopics);
    setCurrentTopic(updatedTopics.find(t => t.id === currentTopic.id));
  };

  // Очистка поля перевода и спряжения
  const clearTranslation = () => {
    setNewRussian('');
    setConjugation(null);
  };

  // Парсинг response и построение conjugationText
  const parseAndSetConjugation = (responseText, isRussianInput = false) => {
    const keys = isRussianInput 
      ? { word: 'ФРАНЦУЗСКОЕ СЛОВО', translation: null, partOfSpeech: 'ЧАСТЬ РЕЧИ', gender: 'РОД', forms: 'ФОРМЫ' }
      : { translation: 'ПЕРЕВОД', word: null, partOfSpeech: 'ЧАСТЬ РЕЧИ', gender: 'РОД', forms: 'ФОРМЫ' };

    const frenchMatch = keys.word ? responseText.match(new RegExp(`${keys.word}:\\s*(.+?)(?=\\n|$)`,'s')) : null;
    const translationMatch = keys.translation ? responseText.match(new RegExp(`${keys.translation}:\\s*(.+?)(?=\\n|$)`, 's')) : null;
    const partOfSpeechMatch = responseText.match(new RegExp(`${keys.partOfSpeech}:\\s*(.+?)(?=\\n|$)`, 's'));
    const genderMatch = responseText.match(new RegExp(`${keys.gender}:\\s*(.+?)(?=\\n|$)`, 's'));
    const formsMatch = responseText.match(/ФОРМЫ:\s*(.+?)$/s);

    let conjugationText = '';
    if (partOfSpeechMatch) {
      let partOfSpeech = partOfSpeechMatch[1].trim();
      // Берём только первое слово (первую часть речи)
      partOfSpeech = partOfSpeech.split(/[\s\n,;/]+/)[0];
      conjugationText += `Часть речи: ${partOfSpeech}\n`;
      setEditablePartOfSpeech(partOfSpeech);
    }
    if (genderMatch) {
      let gender = genderMatch[1].trim();
      // Берём только первое значение (м/ж/-)
      gender = gender.split(/[\s\n,;/]+/)[0];
      conjugationText += `Род: ${gender}\n`;
      setEditableTypeOfWord(gender);
    }
    if (formsMatch) {
      conjugationText += `\n${formsMatch[1].trim()}`;
    }
    
    if (conjugationText) setConjugation(conjugationText.trim());
    
    return { frenchMatch, translationMatch };
  };

  // Автоматический перевод и получение спряжения
  const getTranslationAndConjugation = async (inputWord) => {
    if (!inputWord.trim()) {
      clearTranslation();
      return;
    }

    // Проверяем что в слове только буквы, апострофы, дефисы и пробелы
    const validWordPattern = /^[а-яёА-ЯЁa-zA-Z\-' ]+$/;
    if (!validWordPattern.test(inputWord.trim())) {
      addError('Only letters, hyphens, spaces, and apostrophes are allowed');
      clearTranslation();
      return;
    }

    setLoadingTranslation(true);
    setConjugation(null);

    try {
      // Определяем язык по буквам (кириллица = русский)
      const cyrillic = /[а-яёА-ЯЁ]/;
      const isRussian = cyrillic.test(inputWord);

      if (isRussian) {
        // Пользователь ввёл русское слово - ищем французский эквивалент
        const prompt = `Для русского слова "${inputWord}":

1. Переведи на французский язык (в начальную форму)
2. Определи часть речи (глагол, существительное, прилагательное, наречие и т.д.)
3. Если есть, укажи род (м. - мужской, ж. - женский, или -)
4. Покажи все формы ТОЛЬКО в компактном формате:
   - Для глаголов: je/j', tu, il/elle, nous, vous, ils/elles
   - Для существительных/прилагательных: единственное число, множественное число

Ответь ТОЛЬКО в этом формате БЕЗ дополнительного текста:
ФРАНЦУЗСКОЕ СЛОВО: [французское слово в начальной форме]
ЧАСТЬ РЕЧИ: [глагол/существительное/прилагательное и т.д.]
РОД: [м./ж./-]
ФОРМЫ:
[компактный список форм без пояснений]`;

        const responseText = await callGeminiAPI(prompt);

        // Парсим ответ
        const frenchMatch = responseText.match(/ФРАНЦУЗСКОЕ СЛОВО:\s*(.+?)(?=\nЧАСТЬ|$)/s);
        const partOfSpeechMatch = responseText.match(/ЧАСТЬ РЕЧИ:\s*(.+?)(?=\nРОД:|$)/s);
        const genderMatch = responseText.match(/РОД:\s*(.+?)(?=\nФОРМЫ:|$)/s);
        const formsMatch = responseText.match(/ФОРМЫ:\s*(.+?)$/s);

        if (frenchMatch) {
          let frenchWord = frenchMatch[1].trim();
          // Для возвратных глаголов (начинаются с "se " или "s'") - берём всё
          // Для обычных слов - берём первое слово
          if (frenchWord.toLowerCase().startsWith('se ') || frenchWord.toLowerCase().startsWith("s'")) {
            // Возвратный глагол - берём до первого переноса строки или знака препинания
            frenchWord = frenchWord.split(/[\n,;:]/)[0].trim().toLowerCase();
          } else {
            // Обычное слово - берём только первое
            frenchWord = frenchWord.split(/[\s\n,;:]+/)[0].toLowerCase();
          }
          setNewFrench(frenchWord);
          setNewRussian(inputWord);
        } else {
          throw new Error('Could not parse French word from response');
        }

        parseAndSetConjugation(responseText, true);
      } else {
        // Пользователь ввёл французское слово - получаем информацию о нём
        // Сначала нормализуем слово
        const normalizePrompt = `Преобразуй французское слово в начальную форму без личного местоимения:
- Для глаголов: инфинитив (например: être, avoir, aller)
- Для существительных/прилагательных: начальную форму единственного числа

Слово: "${inputWord}"

Ответь ТОЛЬКО самим словом, ничего больше.`;

        const normalizedText = await callGeminiAPI(normalizePrompt);
        const normalizedWord = normalizedText.trim().toLowerCase();

        // Теперь получаем информацию о нормализованном слове
        const prompt = `Для французского слова "${normalizedWord}":

1. Дай краткий перевод на русский (одно-три слова)
2. Определи часть речи (глагол, существительное, прилагательное, наречие и т.д.)
3. Если есть, укажи род (м. - мужской, ж. - женский, или -)
4. Покажи все формы ТОЛЬКО в компактном формате:
   - Для глаголов: je/j', tu, il/elle, nous, vous, ils/elles
   - Для существительных/прилагательных: единственное число, множественное число

Ответь ТОЛЬКО в этом формате БЕЗ дополнительного текста:
ПЕРЕВОД: [перевод]
ЧАСТЬ РЕЧИ: [глагол/существительное/прилагательное и т.д.]
РОД: [м./ж./-]
ФОРМЫ:
[компактный список форм без пояснений]`;

        const responseText = await callGeminiAPI(prompt);

        // Обновляем поле французского слова на нормализованное
        setNewFrench(normalizedWord);

        // Парсим ответ
        const translationMatch = responseText.match(/ПЕРЕВОД:\s*(.+?)(?=\nЧАСТЬ|$)/s);

        if (translationMatch) {
          let translation = translationMatch[1].trim();
          // Берём только первый перевод (если их несколько, разделены запятой или точкой)
          translation = translation.split(/[,;\/]/)[0].trim();
          setNewRussian(translation);
        } else {
          throw new Error('Could not parse translation from response');
        }

        parseAndSetConjugation(responseText, false);
      }
    } catch (error) {
      console.error('Ошибка при переводе:', error);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack
      });
      
      const errorMessage = error.message.includes('quota') || error.message.includes('rate') 
        ? 'Rate limit exceeded. Please try again later.'
        : error.message.includes('API Error') || error.message.includes('Could not parse')
        ? error.message
        : `Error: ${error.message}`
      
      addError(errorMessage);
      clearTranslation();
    } finally {
      setLoadingTranslation(false);
      setSearchInput('');
      // Focus on input for next search
      // Do not autofocus search input on mobile
      const isTouch = (typeof window !== 'undefined') && (('ontouchstart' in window) || (navigator?.maxTouchPoints > 0));
      if (!isTouch && inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Создание новой темы
  const createTopic = () => {
    if (!newTopicName.trim()) return;
    
    const newTopic = {
      id: Date.now(),
      name: newTopicName,
      cards: []
    };
    
    const updated = [...topics, newTopic];
    setTopics(updated);
    saveTopics(updated);
    setNewTopicName('');
    hideKeyboard();
  };

  // Удаление темы
  const deleteTopic = (id) => {
    const updated = topics.filter(t => t.id !== id);
    setTopics(updated);
    saveTopics(updated);
    if (currentTopic?.id === id) {
      setCurrentTopic(null);
    }
  };

  // Добавление слова в текущую тему
  const addCard = () => {
    if (!newFrench.trim() || !newRussian.trim() || !currentTopic) return;

    // Обновляем conjugation с отредактированными значениями
    let updatedConjugation = conjugation;
    if (conjugation && (editablePartOfSpeech || editableTypeOfWord)) {
      let newConjugation = conjugation;
      if (editablePartOfSpeech) {
        newConjugation = newConjugation.replace(/Часть речи: [^\n]+/, `Часть речи: ${editablePartOfSpeech}`);
      }
      if (editableTypeOfWord) {
        newConjugation = newConjugation.replace(/Род: [^\n]+/, `Род: ${editableTypeOfWord}`);
      }
      updatedConjugation = newConjugation;
    }

    const updated = topics.map(topic => {
      if (topic.id === currentTopic.id) {
        return {
          ...topic,
          cards: [...topic.cards, { 
            french: newFrench.trim(), 
            russian: newRussian.trim(),
            conjugation: updatedConjugation || null,
            partOfSpeech: editablePartOfSpeech || null
          }]
        };
      }
      return topic;
    });

    updateCurrentTopic(updated);
    clearTranslation();
    setEditablePartOfSpeech('');
    setEditableTypeOfWord('');
    setLoadingTranslation(false);
    
    // Increment words added count
    const newCount = wordsAddedCount + 1;
    setWordsAddedCount(newCount);
    
    // Подсчитываем общее количество слов во всех темах
    const totalWords = updated.reduce((sum, topic) => sum + topic.cards.length, 0);
    
    // Show celebration modal after every 100 words
    if (totalWords % 100 === 0) {
      setShowCelebrationModal(true);
    }

    // Do not autofocus search input on mobile after adding a word
    const isTouch = (typeof window !== 'undefined') && (('ontouchstart' in window) || (navigator?.maxTouchPoints > 0));
    if (!isTouch && inputRef.current) {
      inputRef.current.focus();
    } else {
      // Ensure keyboard doesn't pop on mobile
      hideKeyboard();
      // Scroll to top to show search form on mobile
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    }
  };

  // Удаление слова из темы
  const deleteCard = (cardIndex) => {
    const updated = topics.map(topic => {
      if (topic.id === currentTopic.id) {
        return {
          ...topic,
          cards: topic.cards.filter((_, idx) => idx !== cardIndex)
        };
      }
      return topic;
    });

    updateCurrentTopic(updated);
    if (currentCardIndex >= currentTopic.cards.length - 1) {
      setCurrentCardIndex(0);
    }
  };

  // ========== EXPORT FUNCTIONS ==========
  
  // Экспорт СЛОВ из текущего топика (на странице топика)
  const exportWords = () => {
    if (!currentTopic || !currentTopic.cards || currentTopic.cards.length === 0) {
      addError('No words to export');
      return;
    }

    const dataToExport = {
      version: 1,
      exportDate: new Date().toISOString(),
      topicName: currentTopic.name,
      words: currentTopic.cards,
      topic: currentTopic
    };

    console.log('Exporting words from topic:', currentTopic.name);
    console.log('Words count:', currentTopic.cards.length);

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `french-words-${currentTopic.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addSuccess(`Exported ${currentTopic.cards.length} word${currentTopic.cards.length !== 1 ? 's' : ''} from "${currentTopic.name}"`);
  };

  // Экспорт ВСЕХ ТОПИКОВ (на главной странице)
  const exportAllTopics = () => {
    if (topics.length === 0) {
      addError('No topics to export');
      return;
    }

    const dataToExport = {
      version: 1,
      exportDate: new Date().toISOString(),
      topics: topics
    };

    console.log('Exporting all topics:', topics.length);

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `french-topics-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addSuccess(`Exported ${topics.length} topic${topics.length !== 1 ? 's' : ''}`);
  };

  // ========== IMPORT FUNCTIONS ==========

  // Импорт СЛОВ в текущий топик (на странице топика)
  const processImportWords = (file) => {
    console.log('processImportWords called with:', file.name);
    
    if (!currentTopic) {
      console.log('No current topic selected');
      addError('Please open a topic first');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        console.log('File read, parsing JSON');
        const imported = JSON.parse(e.target.result);
        console.log('Imported data:', imported);
        
        let wordsToAdd = [];
        
        // Проверяем есть ли слова (новый формат - массив слов)
        if (imported.words && Array.isArray(imported.words)) {
          console.log('Words array detected, adding to current topic');
          wordsToAdd = imported.words;
        }
        // Если есть topic с cards - извлекаем слова из топика
        else if (imported.topic && imported.topic.cards && Array.isArray(imported.topic.cards)) {
          console.log('Topic with cards detected, extracting words');
          wordsToAdd = imported.topic.cards;
        }
        else {
          console.log('Invalid format: no words array or topic');
          addError('Invalid file format. This file should contain words exported from a topic.');
          return;
        }
        
        console.log('Current words count:', currentTopic.cards.length);
        console.log('Imported words count:', wordsToAdd.length);
        
        // Добавляем слова к текущему топику
        const updatedCards = [...currentTopic.cards, ...wordsToAdd];
        const updatedTopic = { ...currentTopic, cards: updatedCards };
        
        // Обновляем в списке всех топиков
        const updatedTopics = topics.map(t => t.id === currentTopic.id ? updatedTopic : t);
        updateTopics(updatedTopics);
        setCurrentTopic(updatedTopic);
        
        addSuccess(`Imported ${wordsToAdd.length} word${wordsToAdd.length !== 1 ? 's' : ''}!`);
      } catch (error) {
        console.log('Error parsing JSON:', error);
        addError(`Error reading file: ${error.message}`);
      }
    };
    
    reader.onerror = () => {
      console.log('FileReader error');
      addError('Error reading file');
    };
    
    console.log('Starting to read file as text');
    reader.readAsText(file);
  };

  // Импорт ТОПИКА (на главной странице - drag-drop)
  const processImportTopic = (file) => {
    console.log('processImportTopic called with:', file.name);

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        console.log('File read, parsing JSON');
        const imported = JSON.parse(e.target.result);
        console.log('Imported data:', imported);
        
        // Проверяем есть ли топик (новый формат - один топик со словами)
        if (imported.topic && typeof imported.topic === 'object' && imported.topic.cards) {
          console.log('Single topic detected, adding to topics list');
          console.log('Current topics count:', topics.length);
          
          const newTopics = [...topics, imported.topic];
          console.log('New topics count will be:', newTopics.length);
          
          updateTopics(newTopics);
          addSuccess(`Successfully imported topic: ${imported.topic.name}!`);
        } 
        // Формат с words - создаём новый топик из слов
        else if (imported.words && Array.isArray(imported.words)) {
          console.log('Words array detected, creating new topic');
          const topicName = imported.topicName || 'Imported Topic';
          const newTopic = {
            id: Date.now(),
            name: topicName,
            cards: imported.words
          };
          
          const newTopics = [...topics, newTopic];
          updateTopics(newTopics);
          addSuccess(`Successfully imported topic: ${topicName}!`);
        }
        // Fallback для старого формата (массив топиков)
        else if (imported.topics && Array.isArray(imported.topics)) {
          console.log('Multiple topics detected (old format), adding to list');
          const mergedTopics = [...topics, ...imported.topics];
          updateTopics(mergedTopics);
          addSuccess(`Successfully imported ${imported.topics.length} topic${imported.topics.length !== 1 ? 's' : ''}!`);
        } 
        else {
          console.log('Invalid format: no topic or topics array');
          addError('Invalid file format. Please use a file exported from the app.');
        }
      } catch (error) {
        console.log('Error parsing JSON:', error);
        addError(`Error reading file: ${error.message}`);
      }
    };
    
    reader.onerror = () => {
      console.log('FileReader error');
      addError('Error reading file');
    };
    
    console.log('Starting to read file as text');
    reader.readAsText(file);
  };

  // Импорт СЛОВ из file input (на странице топика)
  const importData = (event) => {
    console.log('importData called (words import)');
    
    if (!event.target.files || event.target.files.length === 0) {
      console.log('No files in event');
      return;
    }
    
    const file = event.target.files[0];
    console.log('File from input:', file.name);
    processImportWords(file);

    try {
      event.target.value = '';
    } catch (e) {
      console.log('Could not clear input value');
    }
  };

  // Импорт ТОПИКА из file input (на главной странице)
  const importTopicFromFile = (event) => {
    console.log('importTopicFromFile called (topic import)');
    
    if (!event.target.files || event.target.files.length === 0) {
      console.log('No files in event');
      return;
    }
    
    const file = event.target.files[0];
    console.log('File from input:', file.name);
    processImportTopic(file);

    try {
      event.target.value = '';
    } catch (e) {
      console.log('Could not clear input value');
    }
  };

  // Обработчики для drag and drop переупорядочивания тем - простой способ
  const handleTopicDragStart = (e, topicId) => {
    setDraggedTopicId(topicId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTopicDragOver = (e, targetTopicId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Сразу меняем порядок при dragover (как в примере)
    if (draggedTopicId && draggedTopicId !== targetTopicId) {
      const draggedIndex = topics.findIndex(t => t.id === draggedTopicId);
      const targetIndex = topics.findIndex(t => t.id === targetTopicId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newTopics = [...topics];
        const [draggedTopic] = newTopics.splice(draggedIndex, 1);
        newTopics.splice(targetIndex, 0, draggedTopic);
        
        setDraggedTopicId(draggedTopic.id); // Обновляем ID в случае если его переставили
        updateTopics(newTopics);
      }
    }
    
    // Добавляем визуальный feedback
    setDragOverTopicId(targetTopicId);
  };

  const handleTopicDragLeave = () => {
    setDragOverTopicId(null);
  };

  const handleTopicDragEnd = (e) => {
    e.preventDefault();
    setDraggedTopicId(null);
    setDragOverTopicId(null);
  };

  // Drag and drop для тем на мобильных используя pointer events
  const handleTopicPointerDown = (e, topicId) => {
    // Touch long-press to start dragging topics (keeps normal scrolling)
    if (e.pointerType === 'mouse') return;

    // If user pressed on delete button (or inside it) — don't start drag
    const pressedDelete = e.target && e.target.closest && e.target.closest('button');
    if (pressedDelete) return;

    try {
      // Capture pointer so move/up are reliable on iOS
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch (_) {}

    setPointerDownTopic(topicId);
    setPointerDownTime(Date.now());

    // Start a hold timer; if user moves before it fires — we cancel and allow scroll
    if (topicHoldTimeoutRef.current) {
      clearTimeout(topicHoldTimeoutRef.current);
      topicHoldTimeoutRef.current = null;
    }

    topicPointerIdRef.current = e.pointerId;
    topicPointerTargetRef.current = e.currentTarget;
    topicDragActivatedRef.current = false;
    topicDragMovedRef.current = false;
    topicStartYRef.current = e.clientY;
    topicStartIdRef.current = topicId;
    topicHoverIdRef.current = topicId;

    topicHoldTimeoutRef.current = setTimeout(() => {
      // Activate drag
      topicDragActivatedRef.current = true;
      enableTopicScrollBlock();
      try {
        if (topicPointerTargetRef.current) {
          topicPrevTouchActionRef.current = topicPointerTargetRef.current.style.touchAction;
          topicPointerTargetRef.current.style.touchAction = 'none';
        }
      } catch (_) {}
      setTouchDragTopicId(topicId);
    }, TOPIC_HOLD_MS);
  };

  const handleTopicPointerMove = (e, topicId) => {
    if (e.pointerType === 'mouse') return;

    // If hold hasn't activated yet — cancel drag if user starts scrolling
    if (!topicDragActivatedRef.current) {
      const dy = Math.abs(e.clientY - (topicStartYRef.current ?? e.clientY));
      if (dy > 12) {
        // User is scrolling; cancel hold-to-drag
        if (topicHoldTimeoutRef.current) {
          clearTimeout(topicHoldTimeoutRef.current);
          topicHoldTimeoutRef.current = null;
        }
        cleanupTopicTouchDrag();
      }
      return;
    }

    // Drag activated
    topicDragMovedRef.current = true;
    e.preventDefault();
    
    try {
      const currentY = e.clientY;
      
      const topicsList = document.querySelector('.topic-list-container');
      if (!topicsList) return;
      
      const allTopicElements = Array.from(topicsList.querySelectorAll('.topic-item'));
      let foundElement = false;
      
      for (let element of allTopicElements) {
        const rect = element.getBoundingClientRect();
        if (currentY >= rect.top && currentY <= rect.bottom) {
          foundElement = true;
          const hoveredId = element.getAttribute('data-topic-id');
          const hoveredIdNum = hoveredId ? Number(hoveredId) : null;

          if (hoveredIdNum != null) {
            topicHoverIdRef.current = hoveredIdNum;
            setTouchDragOverTopicId(hoveredIdNum);
          }
          break;
        }
      }
      
      if (!foundElement) {
        setTouchDragOverTopicId(null);
      }
    } catch (error) {
      console.error('Error in handleTopicPointerMove:', error);
    }
  };

  const handleTopicPointerUp = (e) => {
    if (e.pointerType === 'mouse') return;

    // Always clear hold timer
    if (topicHoldTimeoutRef.current) {
      clearTimeout(topicHoldTimeoutRef.current);
      topicHoldTimeoutRef.current = null;
    }

    // If we started drag, ensure page scroll is re-enabled
    disableTopicScrollBlock();

    // Release capture
    try {
      if (topicPointerTargetRef.current && topicPointerIdRef.current != null) {
        topicPointerTargetRef.current.releasePointerCapture?.(topicPointerIdRef.current);
      }
    } catch (_) {}

    // If we were dragging — suppress the click that may fire on iOS
    if (topicDragActivatedRef.current && topicDragMovedRef.current) {
      suppressNextTopicClickRef.current = Date.now();
    }

    // Apply reorder ONCE on release (iOS Safari can lose pointer events if DOM reorders during move)
    if (topicDragActivatedRef.current) {
      const fromId = topicStartIdRef.current;
      const toId = topicHoverIdRef.current;

      if (fromId != null && toId != null && fromId !== toId) {
        const fromIdx = topics.findIndex(t => t.id === fromId);
        const toIdx = topics.findIndex(t => t.id === toId);
        if (fromIdx !== -1 && toIdx !== -1) {
          const newTopics = [...topics];
          const [moved] = newTopics.splice(fromIdx, 1);
          newTopics.splice(toIdx, 0, moved);
          updateTopics(newTopics);
        }
      }
    }

    // Ensure we always restore scrolling after a drag
    disableTopicScrollBlock();
    try {
      if (topicPointerTargetRef.current) {
        topicPointerTargetRef.current.style.touchAction = topicPrevTouchActionRef.current ?? '';
      }
    } catch (_) {}
    topicPrevTouchActionRef.current = null;

    topicPointerIdRef.current = null;
    topicPointerTargetRef.current = null;
    topicDragActivatedRef.current = false;
    topicDragMovedRef.current = false;
    topicStartIdRef.current = null;
    topicHoverIdRef.current = null;

    setPointerDownTopic(null);
    setPointerDownTime(null);
    setTouchDragTopicId(null);
    setTouchDragOverTopicId(null);
  };

  // Drag and drop для карточек слов
  const handleCardDragStart = (e, cardIndex) => {
    // Don't start drag when user interacts with the delete button
    if (e.target && e.target.closest && e.target.closest('button')) {
      e.preventDefault();
      return;
    }
    setDraggedCardIndex(cardIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleCardDragOver = (e, cardIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Reorder on dragover (same behavior as topics)
    if (!currentTopic) return;
    if (draggedCardIndex == null) {
      setDragOverCardIndex(cardIndex);
      return;
    }

    if (draggedCardIndex !== cardIndex) {
      const newCards = [...currentTopic.cards];
      const [moved] = newCards.splice(draggedCardIndex, 1);
      newCards.splice(cardIndex, 0, moved);

      const updatedTopics = topics.map(t =>
        t.id === currentTopic.id ? { ...t, cards: newCards } : t
      );
      updateTopics(updatedTopics);
      setCurrentTopic(prev => (prev ? { ...prev, cards: newCards } : prev));

      // Keep dragged index in sync after reorder
      setDraggedCardIndex(cardIndex);
    }

    setDragOverCardIndex(cardIndex);
  };

  const handleCardDragLeave = () => {
    setDragOverCardIndex(null);
  };

  const handleCardDragEnd = (e) => {
    try {
      e?.preventDefault?.();
    } catch (_) {}
    setDraggedCardIndex(null);
    setDragOverCardIndex(null);
  };

  const handleCardDrop = (e, targetCardIndex) => {
    e.preventDefault();
    e.stopPropagation();

    // Reorder is applied on dragover for a smoother experience (like topics).
    setDraggedCardIndex(null);
    setDragOverCardIndex(null);
  };

  // ========== MOBILE LONG-PRESS DRAG (WORD CARDS LIST) ==========
  const WORD_CARD_HOLD_MS = 140;
  const wordCardHoldTimeoutRef = useRef(null);
  const wordCardPointerIdRef = useRef(null);
  const wordCardPointerTargetRef = useRef(null);
  const wordCardScrollBlockerRef = useRef(null);
  const wordCardStartIndexRef = useRef(null);
  const wordCardHoverIndexRef = useRef(null);
  const wordCardStartYRef = useRef(null);
  // Use the same options object for add/remove on iOS Safari reliability
  const WORD_CARD_TOUCHMOVE_OPTIONS = useRef({ passive: false });
  const wordCardPrevTouchActionRef = useRef(null);

  const enableWordCardScrollBlock = () => {
    if (wordCardScrollBlockerRef.current) return;
    const blocker = (ev) => {
      // Important for iOS: must be non-passive to actually block scroll
      ev.preventDefault();
    };
    wordCardScrollBlockerRef.current = blocker;
    window.addEventListener('touchmove', blocker, WORD_CARD_TOUCHMOVE_OPTIONS.current);
  };

  const disableWordCardScrollBlock = () => {
    if (!wordCardScrollBlockerRef.current) return;
    // Must match the same capture flag/options as addEventListener
    window.removeEventListener('touchmove', wordCardScrollBlockerRef.current, WORD_CARD_TOUCHMOVE_OPTIONS.current);
    wordCardScrollBlockerRef.current = null;
  };

  const cleanupWordCardTouchDrag = () => {
    if (wordCardHoldTimeoutRef.current) {
      clearTimeout(wordCardHoldTimeoutRef.current);
      wordCardHoldTimeoutRef.current = null;
    }
    disableWordCardScrollBlock();

    // Restore original touch-action to keep the page scrollable
    try {
      if (wordCardPointerTargetRef.current) {
        wordCardPointerTargetRef.current.style.touchAction = wordCardPrevTouchActionRef.current ?? '';
      }
    } catch (_) {}
    wordCardPrevTouchActionRef.current = null;

    setIsTouchWordCardDragging(false);
    setTouchDraggedWordCardIndex(null);
    setTouchDragOverWordCardIndex(null);
    wordCardStartYRef.current = null;
    // Ensure we don't keep pointer captured (iOS can "stick" gestures)
    try {
      if (wordCardPointerTargetRef.current && wordCardPointerIdRef.current != null) {
        wordCardPointerTargetRef.current.releasePointerCapture(wordCardPointerIdRef.current);
      }
    } catch (_) {}
    wordCardPointerIdRef.current = null;
    wordCardPointerTargetRef.current = null;
  };

  // Safety net: iOS Safari can "lose" pointerup; always cleanup
  useEffect(() => {
    const onUp = () => cleanupWordCardTouchDrag();
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('blur', onUp);
    document.addEventListener('visibilitychange', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onUp);
      document.removeEventListener('visibilitychange', onUp);
    };
  }, []);

  const handleWordCardPointerDown = (e, cardIndex) => {
    if (e.pointerType === 'mouse') return;
    if (!currentTopic) return;
    if (!currentTopic.cards || currentTopic.cards.length < 2) return;

    // Start hold timer (allow normal scroll until drag actually activates)
    wordCardPointerIdRef.current = e.pointerId;
    wordCardPointerTargetRef.current = e.currentTarget;
    wordCardStartYRef.current = e.clientY;
    setTouchDraggedWordCardIndex(cardIndex);

    // Track original index and current hover target (commit reorder on release for iOS stability)
    wordCardStartIndexRef.current = cardIndex;
    wordCardHoverIndexRef.current = cardIndex;

    // Capture pointer so we reliably receive move/up events
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    wordCardHoldTimeoutRef.current = setTimeout(() => {
      setIsTouchWordCardDragging(true);
      enableWordCardScrollBlock();
      try {
        if (wordCardPointerTargetRef.current) {
          wordCardPrevTouchActionRef.current = wordCardPointerTargetRef.current.style.touchAction;
          wordCardPointerTargetRef.current.style.touchAction = 'none';
        }
      } catch (_) {}
    }, WORD_CARD_HOLD_MS);
  };

  const handleWordCardPointerMove = (e) => {
    if (e.pointerType === 'mouse') return;

    // Before long-press activates, allow scroll and cancel if finger moves (prevents accidental drags)
    if (!isTouchWordCardDragging) {
      const dy = Math.abs(e.clientY - (wordCardStartYRef.current ?? e.clientY));
      if (dy > 12) {
        if (wordCardHoldTimeoutRef.current) {
          clearTimeout(wordCardHoldTimeoutRef.current);
          wordCardHoldTimeoutRef.current = null;
        }
        cleanupWordCardTouchDrag();
      }
      return;
    }

    if (touchDraggedWordCardIndex === null) return;
    if (!currentTopic) return;

    e.preventDefault();

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cardEl = el ? el.closest('[data-word-card-index]') : null;
    if (!cardEl) return;

    const hoveredRaw = cardEl.getAttribute('data-word-card-index');
    if (hoveredRaw == null) return;
    const hoveredIndex = Number(hoveredRaw);

    if (Number.isNaN(hoveredIndex)) return;
    setTouchDragOverWordCardIndex(hoveredIndex);

    // Only update hover state during drag; commit reorder on release (prevents iOS scroll lock/unmount issues)
    wordCardHoverIndexRef.current = hoveredIndex;
  };

  const handleWordCardPointerUp = (e) => {
    if (e.pointerType === 'mouse') return;

    // If user released before hold time, cancel drag
    if (wordCardHoldTimeoutRef.current) {
      clearTimeout(wordCardHoldTimeoutRef.current);
      wordCardHoldTimeoutRef.current = null;
    }

    // Release capture
    try {
      if (wordCardPointerIdRef.current != null) {
        e.currentTarget.releasePointerCapture(wordCardPointerIdRef.current);
      }
    } catch (_) {}


    // Commit reorder on release (stable on iOS Safari)
    try {
      if (isTouchWordCardDragging && currentTopic && Array.isArray(currentTopic.cards)) {
        const fromIdx = wordCardStartIndexRef.current;
        const toIdx = wordCardHoverIndexRef.current;
        if (fromIdx != null && toIdx != null && fromIdx !== toIdx) {
          const newCards = [...currentTopic.cards];
          const [dragged] = newCards.splice(fromIdx, 1);
          newCards.splice(toIdx, 0, dragged);

          const updatedTopics = topics.map(t =>
            t.id === currentTopic.id ? { ...t, cards: newCards } : t
          );
          updateTopics(updatedTopics);
          setCurrentTopic(prev => (prev ? { ...prev, cards: newCards } : prev));
        }
      }
    } catch (_) {}

    // Reset refs
    wordCardStartIndexRef.current = null;
    wordCardHoverIndexRef.current = null;

    cleanupWordCardTouchDrag();
  };

  // Обработка свайпа и drag на мобильных устройствах
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setDragStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !dragStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diff = currentTouch - dragStart;
    const diffY = Math.abs(currentY - (touchStartY || 0));
    
    // Если вертикальное движение больше горизонтального - это скролл
    if (diffY > Math.abs(diff)) {
      return; // Позволить браузеру обработать скролл
    }
    
    // Если движение больше 10px - считаем это свайпом
    if (Math.abs(diff) > 10) {
      setWasDragged(true);
      e.preventDefault(); // Блокируем скролл только при горизонтальном свайпе
    }
    
    setSlideOffset(diff * 0.5);
  };

  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    setTouchStartY(null);
    const endTouch = e.changedTouches[0].clientX;
    const distance = endTouch - dragStart;

    const topicCardsCount = currentTopic?.cards?.length || 0;
    if (Math.abs(distance) > 50 && topicCardsCount > 0 && wasDragged) {
      setCanFlip(false);
      e.preventDefault();
      if (distance > 0) {
        // Свайп вправо → предыдущая карточка
        setCurrentCardIndex((prev) => (prev - 1 + topicCardsCount) % topicCardsCount);
      } else {
        // Свайп влево → следующая карточка
        setCurrentCardIndex((prev) => (prev + 1) % topicCardsCount);
      }
      setFlipped(false);
    }

    // Вернуть слайдер в исходное положение
    setSlideOffset(0);
    setTouchEnd(endTouch);
    setDragStart(0);
    
    // Восстановить возможность переворота через задержку
    setTimeout(() => {
      setWasDragged(false);
      setCanFlip(true);
    }, 150);
  };

  // Обработка мыши для слайдера на ПК
  const handleMouseDown = (e) => {
    setDragStart(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const diff = e.clientX - dragStart;
    // Если движение больше 10px - считаем это свайпом
    if (Math.abs(diff) > 10) {
      setWasDragged(true);
    }
    // Слегка уменьшаем смещение для более "липкого" ощущения
    setSlideOffset(diff * 0.5);
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const distance = e.clientX - dragStart;

    // iOS Safari может триггерить совместимые mouse events после touch-свайпа.
    // Поэтому здесь нельзя использовать несуществующий `cards` и нужно безопасно брать cards из currentTopic.
    const topicCardsCount = currentTopic?.cards?.length || 0;

    if (Math.abs(distance) > 50 && topicCardsCount > 0 && wasDragged) {
      setCanFlip(false);
      if (distance > 0) {
        // Свайп вправо → предыдущая карточка
        setCurrentCardIndex((prev) => (prev - 1 + topicCardsCount) % topicCardsCount);
      } else {
        // Свайп влево → следующая карточка
        setCurrentCardIndex((prev) => (prev + 1) % topicCardsCount);
      }
      setFlipped(false);
    }
    
    // Вернуть слайдер в исходное положение
    setSlideOffset(0);
    setDragStart(0);
    
    // Восстановить возможность переворота через задержку
    setTimeout(() => {
      setWasDragged(false);
      setCanFlip(true);
    }, 150);
  };

  // Экспорт слов из текущей темы
  const exportWordsFromTopic = () => {
    if (!currentTopic || currentTopic.cards.length === 0) {
      alert('❌ Нет слов для экспорта!');
      return;
    }

    const dataToExport = {
      version: 1,
      exportDate: new Date().toISOString(),
      topicName: currentTopic.name,
      words: currentTopic.cards
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTopic.name}-words-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Импорт слов в текущую тему
  const importWordsToTopic = (event) => {
    const file = event.target.files[0];
    if (!file || !currentTopic) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        if (imported.words && Array.isArray(imported.words)) {
          const updated = topics.map(topic => {
            if (topic.id === currentTopic.id) {
              return {
                ...topic,
                cards: [...topic.cards, ...imported.words]
              };
            }
            return topic;
          });

          setTopics(updated);
          saveTopics(updated);
          
          const updatedTopic = updated.find(t => t.id === currentTopic.id);
          setCurrentTopic(updatedTopic);
          
          alert(`✅ Успешно импортировано ${imported.words.length} слов в тему "${currentTopic.name}"!`);
        } else {
          alert('❌ Неверный формат файла. Пожалуйста, используйте файл, экспортированный из приложения.');
        }
      } catch (error) {
        alert(`❌ Ошибка при чтении файла: ${error.message}`);
      }
    };
    reader.readAsText(file);

    // Очищаем input
    event.target.value = '';
  };

  // Drag handlers for import - available everywhere
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
  };

  const handleDropFiles = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
    
    console.log('Drop event triggered', e.dataTransfer);
    
    const files = e.dataTransfer.files;
    console.log('Files from drop:', files, 'Count:', files.length);
    
    if (files.length > 0) {
      const file = files[0];
      console.log('File dropped:', file.name, file.type, 'Size:', file.size);
      
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        console.log('JSON file detected, calling processImportTopic');
        processImportTopic(file);
      } else {
        console.log('Invalid file type:', file.type);
        addError('Please drag and drop a JSON file');
      }
    }
  };


  // ===== Global Modals (used on both Home and Topic screens) =====
  const renderGlobalModals = () => (
    <>
      {showApiKeyModal && (
        <div className="celebration-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeApiKeyModal(); }} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="celebration-modal-content" style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            padding: '32px',
            boxSizing: 'border-box',
            minHeight: '600px',
          }}>
            {/* API Key Icon */}
            <div style={{ marginBottom: '32px', fontSize: '80px' }}>
              🔑
            </div>

            {/* Title */}
            <h1 className="celebration-modal-title" style={{
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: '30px',
              fontWeight: '500',
              lineHeight: '38px',
              letterSpacing: '0',
              marginBottom: '12px',
              color: '#000000',
              textAlign: 'center',
            }}>
              Gemini API Key
            </h1>

            {/* Subtitle */}
            <p style={{
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '26px',
              color: 'rgba(0, 0, 0, 0.6)',
              marginBottom: '24px',
            }}>
              This app needs a Gemini API Key to translate and analyze.
            </p>

            {/* API Key Input + Error Wrapper */}
            <div style={{
              marginBottom: '32px',
              width: '100%',
            }}>
              {/* Input + Error Container */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {/* Input Row */}
                <div className="api-key-input-wrapper" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  {/* Icon */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="24" height="24" viewBox="0 -960 960 960" fill="#000000">
                      <path d="M280-400q-33 0-56.5-23.5T200-480q0-33 23.5-56.5T280-560q33 0 56.5 23.5T360-480q0 33-23.5 56.5T280-400Zm0 160q-100 0-170-70T40-480q0-100 70-170t170-70q67 0 121.5 33t86.5 87h352l120 120-180 180-80-60-80 60-85-60h-47q-32 54-86.5 87T280-240Zm0-80q56 0 98.5-34t56.5-86h125l58 41 82-61 71 55 75-75-40-40H435q-14-52-56.5-86T280-640q-66 0-113 47t-47 113q0 66 47 113t113 47Z"/>
                    </svg>
                  </div>
                  
                  {/* Input Container */}
                  <div style={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {/* Input */}
                    <input
                      type={showPassword ? "text" : "password"}
                      value={tempApiKey}
                      onChange={(e) => {
                        setTempApiKey(e.target.value);
                        setApiKeyError(''); // Очищаем ошибку при вводе
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const error = validateApiKey(tempApiKey);
                          if (!error) {
                            localStorage.setItem('gemini_api_key', tempApiKey);
                            setApiKey(tempApiKey);
                            setShowApiKeyModal(false);
                            setApiKeyError('');
                            setTempApiKey('');
                            setShowPassword(false);
                          } else {
                            setApiKeyError(error);
                          }
                        }
                      }}
                      placeholder="Starts with Alza"
                      style={{
                        width: '100%',
                        height: '56px',
                        padding: '0 50px 0 20px',
                        border: apiKeyError ? '1.5px solid #DC2626' : '1.5px solid rgba(0, 0, 0, 0.12)',
                        boxSizing: 'border-box',
                        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontSize: '16px',
                        fontWeight: '500',
                        lineHeight: '24px',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        colorScheme: 'light',
                        outline: 'none',
                      }}
                    />
                    
                    {/* Show/Hide Password Button - Inside Input */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.6'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      {showPassword ? (
                        // Eye icon (show password)
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#000000">
                          <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/>
                        </svg>
                      ) : (
                        // Eye off icon (hide password)
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#000000">
                          <path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {apiKeyError && (
                  <div style={{
                    fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: '14px',
                    fontWeight: '500',
                    lineHeight: '20px',
                    color: '#DC2626',
                    textAlign: 'left',
                  }}>
                    {apiKeyError}
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              marginTop: 'auto',
            }}>
              {/* Save Button */}
              <button
                onClick={() => {
                  const error = validateApiKey(tempApiKey);
                  if (error) {
                    setApiKeyError(error);
                  } else {
                    localStorage.setItem('gemini_api_key', tempApiKey);
                    setApiKey(tempApiKey);
                    setShowApiKeyModal(false);
                    setApiKeyError('');
                    setTempApiKey('');
                    setShowPassword(false);
                    hideKeyboard();
                  }
                }}
                style={{
                  width: '100%',
                  height: '56px',
                  padding: '0 20px',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  lineHeight: '24px',
                  cursor: 'pointer',
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#333333'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#000000'}
              >
                Save this key
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  closeApiKeyModal();
                }}
                style={{
                  width: '100%',
                  height: '56px',
                  padding: '0 20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.07)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  lineHeight: '24px',
                  cursor: 'pointer',
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.12)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.07)'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) closeLoginModal(); }} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '0 16px',
          boxSizing: 'border-box',
        }}>
          <div className="celebration-modal-content" style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            padding: '32px',
            boxSizing: 'border-box',
            minHeight: '600px',
          }}>
            {/* Icon */}
            <div style={{ marginBottom: '32px', fontSize: '80px' }}>
              👤
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: '30px',
              fontWeight: '500',
              lineHeight: '38px',
              letterSpacing: '0',
              marginBottom: '12px',
              color: '#000000',
              textAlign: 'center',
            }}>
              Welcome
            </h1>

            {/* Subtitle */}
            <p style={{
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '26px',
              color: 'rgba(0, 0, 0, 0.6)',
              marginBottom: '24px',
            }}>
              Sign in to your account
            </p>

            {/* Input with Icon */}
            <div style={{
              marginBottom: '32px',
              width: '100%',
            }}>
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}>
                {/* Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '12px',
                }}>
                  <svg width="26" height="26" viewBox="0 -960 960 960" fill="#000000" xmlns="http://www.w3.org/2000/svg">
                    <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/>
                  </svg>
                </div>

                {/* Input Wrapper */}
                <div style={{
                  flex: 1,
                  position: 'relative',
                }}>
                  <input
                    type="text"
                    value={loginUserId}
                    onChange={(e) => setLoginUserId(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && loginUserId.trim()) {
                        setShowLoginModal(false);
                        setLoginUserId('');
                      }
                    }}
                    placeholder="Enter your username"
                    maxLength="50"
                    style={{
                      width: '100%',
                      height: '56px',
                      padding: '0 20px',
                      border: '1.5px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '500',
                      fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      lineHeight: '24px',
                      letterSpacing: '0%',
                      color: '#000000',
                      backgroundColor: '#ffffff',
                      colorScheme: 'light',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />

                  {/* Char count */}
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '14px',
                    lineHeight: '14px',
                    color: 'rgba(0, 0, 0, 0.4)',
                    backgroundColor: '#F5F5F5',
                    padding: '6px',
                    borderRadius: '6px',
                  }}>
                    {loginUserId.length}/50
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons Wrapper */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              marginTop: 'auto',
            }}>
              {/* Sign In Button */}
              <button
                onClick={() => {
                  if (loginUserId.trim()) {
                    setShowLoginModal(false);
                    setLoginUserId('');
                    addSuccess(`Welcome, ${loginUserId}!`);
                  }
                }}
                style={{
                  width: '100%',
                  height: '56px',
                  padding: '0 20px',
                  backgroundColor: loginUserId.trim() ? '#000000' : 'rgba(0, 0, 0, 0.05)',
                  color: loginUserId.trim() ? '#ffffff' : 'rgba(0, 0, 0, 0.3)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  cursor: loginUserId.trim() ? 'pointer' : 'default',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (loginUserId.trim()) {
                    e.target.style.backgroundColor = '#333333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (loginUserId.trim()) {
                    e.target.style.backgroundColor = '#000000';
                  }
                }}
              >
                Sign In
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginUserId('');
                }}
                style={{
                  width: '100%',
                  height: '56px',
                  padding: '0 20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.07)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.12)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.07)'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Главная страница - список тем
  if (!currentTopic) {

    return (
      <div className="min-h-screen py-28 px-8" style={{ backgroundColor: '#F6F2F2' }}>
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          {/* Заголовок */}
          <h1 style={{
            fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: '42px',
            fontWeight: '500',
            lineHeight: '54px',
            letterSpacing: '0',
            textAlign: 'center',
            margin: 0,
            marginTop: '120px',
          }} className="text-black">
            My topics
          </h1>

          {/* Секция Add new topic и Drag & Drop */}
          <div className="flex flex-col mobile-614 mobile-section-spacing mobile-word-form w-full" style={{
            maxWidth: '614px', 
            margin: '72px auto 0 auto',
            padding: '32px',
            borderRadius: '24px',
            backgroundColor: '#ffffff',
            gap: '20px'
          }}>
            {/* Add new topic */}
            <div className="flex flex-col gap-3">
              <h2 style={{
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: '17px',
                fontWeight: '500',
                lineHeight: '28px',
              }} className="text-black unified-section-header">Add new topic</h2>
              <div className="flex gap-2 items-center mobile-flex-column w-full">
                {/* Icon + Input wrapper */}
                <div className="flex gap-2 items-center mobile-input-group flex-1">
                  {/* Иконка новое окно */}
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h240v80H200v560h560v-240h80v240q0 33-23.5 56.5T760-120H200Zm440-400v-120H520v-80h120v-120h80v120h120v80H720v120h-80Z"/></svg>
                  </div>
                  {/* Input */}
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createTopic()}
                    placeholder="Type a topic name"
                    style={{ 
                      flex: 1,
                      minWidth: 0,
                      height: '56px',
                      padding: '0 20px',
                      border: '1.5px solid rgba(0, 0, 0, 0.12)',
                      boxSizing: 'border-box',
                      fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '24px',
                      letterSpacing: '0%',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      colorScheme: 'light',
                      outline: 'none',
                    }}
                  />
                </div>
                {/* Кнопка Add */}
                <button
                  onClick={createTopic}
                  disabled={!newTopicName.trim()}
                  style={{
                    fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '24px',
                    letterSpacing: '0%',
                    width: '200px',
                    height: '56px',
                    backgroundColor: newTopicName.trim() ? '#000000' : 'rgba(0, 0, 0, 0.05)',
                    color: newTopicName.trim() ? '#ffffff' : 'rgba(0, 0, 0, 0.3)',
                    border: 'none',
                    cursor: newTopicName.trim() ? 'pointer' : 'default',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (newTopicName.trim()) {
                      e.target.style.backgroundColor = '#333333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newTopicName.trim()) {
                      e.target.style.backgroundColor = '#000000';
                    }
                  }}
                  className="rounded-xl transition flex-shrink-0"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Drag & Drop зона */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDropFiles}
              onClick={() => {
                console.log('Drop zone clicked');
                document.getElementById('file-input-main')?.click();
              }}
              style={{
                border: isDraggingFiles ? '1.5px dashed rgba(0, 0, 0, 0.3)' : '1.5px dashed rgba(0, 0, 0, 0.12)',
                boxSizing: 'border-box',
                borderRadius: '12px',
                pointerEvents: 'auto',
              }}
              className={`h-28 px-5 py-4 rounded-xl bg-transparent flex items-center justify-center cursor-pointer transition ${
                isDraggingFiles ? 'bg-black/5' : 'hover:bg-black/2'
              }`}
            >
              <input
                type="file"
                accept=".json"
                onChange={importTopicFromFile}
                style={{ display: 'none' }}
                id="file-input-main"
              />
              <span style={{
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '24px',
                letterSpacing: '0%',
                color: 'rgba(0, 0, 0, 0.5)',
                pointerEvents: 'auto',
                cursor: 'pointer',
                textAlign: 'center',
              }}>
                Drag and drop your .json file
              </span>
            </div>
          </div>

          {/* Список тем */}
          {topics.length > 0 && (
            <div className="bg-white mobile-614 w-full" style={{ 
              borderRadius: '24px', 
              maxWidth: '614px', 
              margin: '16px auto 0 auto',
              padding: '32px'
            }}>
              <div className="flex flex-col gap-4">
                <h2 style={{
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: '17px',
                  fontWeight: '500',
                  lineHeight: '28px',
                }} className="text-black unified-section-header">
                  {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
                </h2>
                <div className="flex flex-col topic-list-container" style={{ gap: '12px' }}>
                  {topics.map((topic, index) => {
                    return (
                    <div
                      key={topic.id}
                      data-topic-id={topic.id}
                      draggable={!IS_TOUCH_DEVICE}
                      onDragStart={(e) => {
                        handleTopicDragStart(e, topic.id);
                      }}
                      onDragOver={(e) => {
                        handleTopicDragOver(e, topic.id);
                      }}
                      onDragLeave={handleTopicDragLeave}
                      onDragEnd={handleTopicDragEnd}
                      onPointerDown={(e) => {
                        handleTopicPointerDown(e, topic.id);
                      }}
                      onPointerMove={(e) => {
                        handleTopicPointerMove(e, topic.id);
                      }}
                      onPointerUp={handleTopicPointerUp}
                      onPointerCancel={handleTopicPointerUp}
                      onClick={() => {
                        // If a drag just happened, iOS may still fire a click after pointerup
                        if (Date.now() - (suppressNextTopicClickRef.current || 0) < 450) {
                          return;
                        }
                        setCurrentTopic(topic);
                        setCurrentCardIndex(0);
                        setFlipped(false);
                        // Ensure we land at the top of the topic page after navigation
                        requestAnimationFrame(() => {
                          try {
                            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                          } catch (e) {
                            window.scrollTo(0, 0);
                          }
                        });
                        setTimeout(() => {
                          try {
                            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                          } catch (e) {
                            window.scrollTo(0, 0);
                          }
                        }, 0);
                      }}
                      style={{
                        border: (touchDragTopicId === topic.id || draggedTopicId === topic.id) 
                          ? '2px dashed rgba(0, 0, 0, 0.3)' 
                          : '1.5px solid rgba(0, 0, 0, 0.08)',
                        boxSizing: 'border-box',
                        borderRadius: '24px',
                        backgroundColor: (dragOverTopicId === topic.id || touchDragOverTopicId === topic.id) ? 'rgba(0, 0, 0, 0.06)' : 'transparent',
                        opacity: (draggedTopicId === topic.id || touchDragTopicId === topic.id) ? 0.5 : 1,
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        touchAction: (touchDragTopicId || draggedTopicId) ? 'none' : 'pan-y',
                        pointerEvents: 'auto',
                        transition: 'all 0.15s ease',
                        borderRadius: '20px',
                        padding: '0.9rem',
                      }}
                      className="topic-item flex items-center gap-4 cursor-pointer hover:bg-black/2"
                    >
                      {/* Иконка список - зона для drag and drop */}
                      <svg 
                        width="32" 
                        height="56" 
                        viewBox="0 0 32 56" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0 cursor-move hover:opacity-70 transition"
                        style={{ userSelect: 'none' }}
                      >
                        <path d="M9 23L23 23" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 28.375L23 28.375" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 33.75L17.75 33.75" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>

                      {/* Информация о теме */}
                      <div className="flex-1 min-w-0">
                        <p style={{
                          fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          fontSize: '14px',
                          fontWeight: '500',
                          lineHeight: '20px',
                          color: 'rgba(0, 0, 0, 0.4)',
                        }}>
                          {topic.cards.length} {topic.cards.length === 1 ? 'word' : 'words'}
                        </p>
                        <p style={{
                          fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          fontSize: '16px',
                          fontWeight: '500',
                          lineHeight: '28px',
                          color: '#000000',
                          padding: '0px',
                          paddingTop: '0px',
                        }} className="truncate topic-name">{topic.name}</p>
                      </div>

                      {/* Кнопка удаления */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTopic(topic.id);
                        }}
                        className="text-black/50 hover:text-red-500 transition flex-shrink-0"
                      >
                        <svg width="32" height="56" viewBox="0 0 32 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 28V33" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18 28V33" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 23H24" stroke="#7D7D7D" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 26V34C10 35.6569 11.3432 37 13 37H19C20.6569 37 22 35.6569 22 34V26" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M13 21C13 19.8954 13.8954 19 15 19H17C18.1046 19 19 19.8954 19 21V23H13V21Z" stroke="#7D7D7D" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Export all topics button - Main screen only */}
          <div className="sidebar-buttons-container">
            {/* API Key Button */}
            <button
              onClick={() => {
                setTempApiKey(apiKey);
                setApiKeyError('');
                setShowApiKeyModal(true);
              }}
              className="export-button-sidebar"
              style={{
                border: 'none',
                padding: 0,
              }}
              title="Change Gemini API Key"
            >
              <div>
                <svg width="20" height="20" viewBox="0 -960 960 960" fill="#000000">
                  <path d="M280-400q-33 0-56.5-23.5T200-480q0-33 23.5-56.5T280-560q33 0 56.5 23.5T360-480q0 33-23.5 56.5T280-400Zm0 160q-100 0-170-70T40-480q0-100 70-170t170-70q67 0 121.5 33t86.5 87h352l120 120-180 180-80-60-80 60-85-60h-47q-32 54-86.5 87T280-240Zm0-80q56 0 98.5-34t56.5-86h125l58 41 82-61 71 55 75-75-40-40H435q-14-52-56.5-86T280-640q-66 0-113 47t-47 113q0 66 47 113t113 47Z"/>
                </svg>
              </div>
            </button>

            {/* Login Button */}
            <button
              onClick={() => setShowLoginModal(true)}
              className="export-button-sidebar"
              style={{
                border: 'none',
                padding: 0,
              }}
              title="Login"
            >
              <div>
                <svg width="22" height="22" viewBox="0 -960 960 960" fill="#000000" xmlns="http://www.w3.org/2000/svg">
                  <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/>
                </svg>
              </div>
            </button>

            </div>

      {renderGlobalModals()}
      </div>
    </div>
    );
  }

  // Страница темы - карточки и добавление слов
  const cards = currentTopic.cards;
  const currentCard = cards[currentCardIndex];

  return (
    <>
    <div className="min-h-screen py-28 px-8" style={{ backgroundColor: '#F6F2F2' }}>
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .error-toast {
          animation: slideUp 0.3s ease-out;
        }
        .success-toast {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>

      {renderGlobalModals()}

      {/* Celebration Modal */}
      {showCelebrationModal && (
        <div className="celebration-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCelebrationModal(false); }} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="celebration-modal-content" style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            padding: '32px',
            boxSizing: 'border-box',
          }}>
            {/* Flower Icon */}
            <div style={{ marginBottom: '32px', fontSize: '80px' }}>
              🌼
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: '500',
              letterSpacing: '0',
              marginBottom: '12px',
              color: '#000000',
              textAlign: 'center',
            }}>
              You're the best!
            </h1>

            {/* Subtitle */}
            <p style={{
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '26px',
              color: 'rgba(0, 0, 0, 0.6)',
              marginBottom: '32px',
            }}>
              Keep moving forward, my beloved. I believe in you with all my heart!
            </p>

            {/* Confirm Button */}
            <button
              onClick={() => setShowCelebrationModal(false)}
              style={{
                width: '100%',
                padding: '16px 20px',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: '16px',
                fontWeight: '600',
                lineHeight: '24px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                marginTop: 'auto',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#333333'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#000000'}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
      
      {/* Error Toast Stack */}
      <div style={{ 
        position: 'fixed', 
        bottom: '16px', 
        left: 0, 
        right: 0, 
        zIndex: 1000, 
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '12px',
        alignItems: 'center',
        padding: '0 16px',
        boxSizing: 'border-box'
      }}>
        {errors.map((error, index) => (
          <div
            key={error.id}
            style={{
              width: '512px',
              maxWidth: 'calc(100% - 32px)',
              padding: '16px 20px',
              backgroundColor: '#fee2e2',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxSizing: 'border-box',
              animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              pointerEvents: 'auto',
            }}
            className="error-toast"
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              minWidth: 0,
            }}>
              <svg width="24" height="24" viewBox="0 -960 960 960" fill="#7f1d1d" style={{ flexShrink: 0 }}>
                <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
              </svg>
              <div style={{
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '24px',
                color: '#7f1d1d',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'normal',
              }}>
                {error.message}
              </div>
            </div>
            <button
              onClick={() => removeError(error.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Close"
            >
              <svg width="24" height="24" viewBox="0 -960 960 960" fill="#7f1d1d">
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Success Toast Stack */}
      <div style={{ 
        position: 'fixed', 
        bottom: '16px', 
        left: 0, 
        right: 0, 
        zIndex: 1000, 
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '12px',
        alignItems: 'center',
        padding: '0 16px',
        boxSizing: 'border-box'
      }}>
        {successes.map((success, index) => (
          <div
            key={success.id}
            style={{
              width: '512px',
              maxWidth: 'calc(100% - 32px)',
              padding: '16px 20px',
              backgroundColor: '#dcfce7',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxSizing: 'border-box',
              animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              pointerEvents: 'auto',
            }}
            className="success-toast"
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
            }}>
              <svg width="24" height="24" viewBox="0 -960 960 960" fill="#15803d" style={{ flexShrink: 0 }}>
                <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
              </svg>
              <div style={{
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '24px',
                color: '#15803d',
              }}>
                {success.message}
              </div>
            </div>
            <button
              onClick={() => removeSuccess(success.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Close"
            >
              <svg width="24" height="24" viewBox="0 -960 960 960" fill="#15803d">
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      {/* API Key & Login Buttons - Available on topic page */}
      <div className="sidebar-buttons-container">
        {/* API Key Button */}
        <button
          onClick={() => {
            setTempApiKey(apiKey);
            setApiKeyError('');
            setShowApiKeyModal(true);
          }}
          className="export-button-sidebar"
          style={{
            border: 'none',
            padding: 0,
          }}
          title="Change Gemini API Key"
        >
          <div>
            <svg width="20" height="20" viewBox="0 -960 960 960" fill="#000000">
              <path d="M280-400q-33 0-56.5-23.5T200-480q0-33 23.5-56.5T280-560q33 0 56.5 23.5T360-480q0 33-23.5 56.5T280-400Zm0 160q-100 0-170-70T40-480q0-100 70-170t170-70q67 0 121.5 33t86.5 87h352l120 120-180 180-80-60-80 60-85-60h-47q-32 54-86.5 87T280-240Zm0-80q56 0 98.5-34t56.5-86h125l58 41 82-61 71 55 75-75-40-40H435q-14-52-56.5-86T280-640q-66 0-113 47t-47 113q0 66 47 113t113 47Z"/>
            </svg>
          </div>
        </button>

        {/* Login Button */}
        <button
          onClick={() => setShowLoginModal(true)}
          className="export-button-sidebar"
          style={{
            border: 'none',
            padding: 0,
          }}
          title="Login"
        >
          <div>
            <svg width="22" height="22" viewBox="0 -960 960 960" fill="#000000" xmlns="http://www.w3.org/2000/svg">
              <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/>
            </svg>
          </div>
        </button>
      </div>
      
      <div className="sidebar-buttons-container-right">
        <button
          onClick={() => {
            setCurrentTopic(null);
            setCurrentCardIndex(0);
            setFlipped(false);
          }}
          className="back-button-sidebar"
          style={{
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>

        {/* Export button - Export words from current topic */}
        <button
          onClick={exportWords}
          disabled={!currentTopic || currentTopic.cards.length === 0}
          className="export-button-sidebar"
          style={{
            border: 'none',
            padding: 0,
          }}
          title="Export words"
        >
          <div>
            <svg width="20" height="20" viewBox="0 -960 960 960" fill="#000000">
              <path d="M480-480ZM202-65l-56-57 118-118h-90v-80h226v226h-80v-89L202-65Zm278-15v-80h240v-440H520v-200H240v400h-80v-400q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H480Z"/>
            </svg>
          </div>
        </button>

        {/* Import button - Import words to current topic */}
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
              const file = e.target.files[0];
              if (file) {
                processImportWords(file);
              }
            };
            input.click();
          }}
          className="import-button-sidebar"
          style={{
            border: 'none',
            padding: 0,
          }}
          title="Import cards"
        >
          <div>
            <svg width="20" height="20" viewBox="0 -960 960 960" fill="#000000">
              <path d="m480-280 160-160-56-56-64 62v-166h-80v166l-64-62-56 56 160 160ZM240-80q-33 0-56.5-23.5T160-160v-480l240-240h320q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm0-80h480v-640H434L240-606v446Zm0 0h480-480Z"/>
            </svg>
          </div>
        </button>
      </div>
      
      {/* Marquee Container - Full Width */}
      <div className="marquee-container" style={{ 
        marginBottom: '0', 
        marginTop: '120px',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        overflow: 'hidden',
      }}>
        <h1 
          ref={topicTitleRef}
          className="topic-title-marquee text-black"
          style={{
            fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: '42px',
            fontWeight: '500',
            lineHeight: '54px',
            letterSpacing: '0',
            textAlign: 'center',
            padding: '0',
            margin: '0',
            '--animation-duration': `${animationDuration}s`,
          }} 
        >
          {shouldDuplicateTitle ? (
            <>
              <span style={{ paddingRight: '20px' }}>{currentTopic.name}</span>
              <span>{currentTopic.name}</span>
            </>
          ) : currentTopic.name}
        </h1>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col items-center w-full">

        {/* Форма добавления нового слова */}
        <div className="bg-white mobile-614 mobile-section-spacing mobile-word-form w-full" style={{ 
          borderRadius: '24px', 
          maxWidth: '614px', 
          margin: '72px auto 0 auto',
          padding: '32px',
          height: 'fit-content',
        }}>
          <div className="flex flex-col" style={{ gap: '12px' }}>
            
            {/* Заголовок */}
            <div style={{
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: '17px',
              fontWeight: '500',
              lineHeight: '28px',
            }} className="text-black unified-section-header">
              Add new word
            </div>

            {/* Универсальный инпут для французского или русского слова */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mobile-flex-column w-full">
                {/* Icon + Input wrapper */}
                <div className="flex items-center gap-2 mobile-input-group flex-1">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M280-280v-80h400v80H280ZM120-440v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80ZM120-600v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Z"/></svg>
                  </div>
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    height: '56px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    gap: '8px',
                    position: 'relative',
                  }}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                      }}
                      onFocus={(e) => {
                        // Скроллим input в видимую область когда он получает фокус
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && searchInput.trim() && !loadingTranslation) {
                          getTranslationAndConjugation(searchInput);
                          hideKeyboard();
                        }
                      }}
                      placeholder="Type French or Russian word..."
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: '56px',
                        padding: '0 50px 0 20px',
                        border: '1.5px solid rgba(0, 0, 0, 0.12)',
                        borderRadius: '12px',
                        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontSize: '16px',
                        fontWeight: '500',
                        lineHeight: '24px',
                        letterSpacing: '0%',
                        boxSizing: 'border-box',
                        color: '#000000',
                        backgroundColor: '#ffffff',
                        colorScheme: 'light',
                        outline: 'none',
                      }}
                    />
                    {loadingTranslation && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spin-animation" style={{ position: 'absolute', right: '15px', flexShrink: 0 }}>
                        <path fill="#000000" fillOpacity="0.5" d="M11.6203 2.01871C11.3335 2.10717 11.1682 2.26441 11.0881 2.52116C11.0429 2.6649 11.0351 2.99904 11.0351 4.74349C11.0351 7.05426 11.0326 7.02478 11.2805 7.26065C11.6125 7.57514 12.3875 7.57514 12.7195 7.26065C12.9675 7.02478 12.9649 7.05426 12.9649 4.74349C12.9649 2.50765 12.961 2.46834 12.7698 2.25213C12.6097 2.07154 12.4379 2.01134 12.0517 2.00152C11.8618 1.9966 11.668 2.00397 11.6203 2.01871ZM5.22268 4.4462C5.0186 4.53465 4.71764 4.81474 4.61302 5.01376C4.50452 5.22137 4.49935 5.45232 4.59752 5.65871C4.6931 5.86141 7.69491 8.72623 7.93128 8.84048C8.26582 9.00387 8.6094 8.92402 8.95557 8.60215C9.29657 8.2852 9.38698 7.94123 9.2139 7.6206C9.09377 7.39578 6.08163 4.54079 5.86851 4.44988C5.67218 4.36512 5.41385 4.36389 5.22268 4.4462ZM18.2684 4.46585C18.1095 4.53588 17.8383 4.77789 16.544 6.01251C15.3544 7.1464 14.9915 7.51249 14.9334 7.63288C14.8352 7.83558 14.8365 8.07022 14.9346 8.26923C15.0251 8.45351 15.3221 8.74343 15.5223 8.84294C15.7251 8.94367 16.0261 8.94244 16.2366 8.84048C16.4523 8.73483 19.4361 5.89703 19.5471 5.69188C19.6544 5.49286 19.6556 5.2054 19.551 5.01498C19.4451 4.82211 19.1713 4.56659 18.9646 4.46708C18.7334 4.35529 18.5203 4.35529 18.2684 4.46585ZM2.56962 10.6205C2.18858 10.7348 2 11.0235 2 11.4891C2.00129 11.9645 2.18729 12.2495 2.56833 12.3576C2.72074 12.4006 3.06045 12.408 4.90623 12.408C6.8295 12.408 7.08654 12.4018 7.24412 12.3527C7.47662 12.2815 7.6652 12.1021 7.74012 11.881C7.8512 11.5554 7.79566 11.0935 7.6187 10.865C7.57995 10.8159 7.46887 10.7336 7.372 10.6832L7.19504 10.5898L4.9566 10.5825C3.15474 10.5776 2.68845 10.5849 2.56962 10.6205ZM16.8373 10.6034C16.6784 10.6402 16.4588 10.7667 16.3813 10.8662C16.2043 11.0935 16.1488 11.5554 16.2599 11.881C16.3348 12.1021 16.5234 12.2815 16.7559 12.3527C16.9135 12.4018 17.1705 12.408 19.0938 12.408C20.9396 12.408 21.2793 12.4006 21.4317 12.3576C21.8127 12.2495 21.9987 11.9645 22 11.4891C22 11.0161 21.8101 10.7323 21.4162 10.6193C21.2831 10.5812 20.8659 10.5739 19.0989 10.5763C17.9132 10.5788 16.8954 10.5911 16.8373 10.6034ZM7.93516 14.2937C7.77629 14.3637 7.50504 14.6057 6.2108 15.8404C5.02118 16.9743 4.65823 17.3403 4.6001 17.4607C4.50194 17.6634 4.50323 17.8981 4.6014 18.0971C4.69181 18.2814 4.98889 18.5713 5.1891 18.6708C5.39189 18.7715 5.69284 18.7703 5.90338 18.6683C6.11909 18.5627 9.10282 15.7249 9.2139 15.5197C9.32111 15.3207 9.3224 15.0333 9.21777 14.8428C9.11186 14.65 8.83803 14.3944 8.63136 14.2949C8.40016 14.1831 8.18703 14.1831 7.93516 14.2937ZM15.5559 14.2741C15.3518 14.3625 15.0509 14.6426 14.9463 14.8416C14.8378 15.0492 14.8326 15.2802 14.9308 15.4866C15.0264 15.6893 18.0282 18.5541 18.2645 18.6683C18.5991 18.8317 18.9427 18.7519 19.2888 18.43C19.6298 18.1131 19.7202 17.7691 19.5471 17.4485C19.427 17.2236 16.4149 14.3687 16.2018 14.2777C16.0054 14.193 15.7471 14.1917 15.5559 14.2741ZM11.6706 15.5161C11.5092 15.5554 11.2909 15.6819 11.2147 15.7802C11.0364 16.0087 11.0351 16.0246 11.0351 18.2335C11.0351 19.9926 11.0429 20.3157 11.0881 20.4607C11.2018 20.8231 11.5027 21 12 21C12.4973 21 12.7982 20.8231 12.9119 20.4607C12.992 20.2003 12.9907 16.2507 12.9093 16.0234C12.8318 15.8072 12.7427 15.704 12.5425 15.6008C12.4004 15.5271 12.3177 15.5087 12.0736 15.5001C11.9096 15.4939 11.7288 15.5013 11.6706 15.5161Z"/>
                      </svg>
                    )}
                  </div>
                </div>
                {/* Кнопка поиска */}
                <button
                  onClick={() => {
                    if (searchInput.trim()) {
                      getTranslationAndConjugation(searchInput);
                      hideKeyboard();
                    }
                  }}
                  disabled={!searchInput || loadingTranslation}
                  title="Search for the word translation (or press Enter)"
                  aria-label="Search for word translation"
                  style={{
                    width: '160px',
                    height: '56px',
                    backgroundColor: (!searchInput || loadingTranslation) ? 'rgba(0, 0, 0, 0.05)' : '#000000',
                    color: (!searchInput || loadingTranslation) ? 'rgba(0, 0, 0, 0.3)' : '#ffffff',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: (!searchInput || loadingTranslation) ? 'not-allowed' : 'pointer',
                    fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '24px',
                    letterSpacing: '0%',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (searchInput && !loadingTranslation) {
                      e.target.style.backgroundColor = '#333333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (searchInput && !loadingTranslation) {
                      e.target.style.backgroundColor = '#000000';
                    }
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Форма информации о слове - отдельная секция, появляется после поиска */}
        {newFrench && newRussian && (
          <div className="bg-white mobile-614 mobile-word-form w-full" style={{ 
            borderRadius: '24px', 
            maxWidth: '614px', 
            margin: '0 auto',
            padding: '32px'
          }}>
            <div className="flex flex-col gap-6">
              
              {/* French word */}
              <div className="flex flex-col gap-3">
                <div style={{
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: '17px',
                  fontWeight: '500',
                  lineHeight: '28px',
                  letterSpacing: '0%',
                }} className="text-black unified-section-header">
                  French word
                </div>
                <div className="flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 -960 960 960" fill="#000000" style={{ flexShrink: 0 }}>
                    <path d="M222-200 80-342l56-56 85 85 170-170 56 57-225 226Zm0-320L80-662l56-56 85 85 170-170 56 57-225 226Zm298 240v-80h360v80H520Zm0-320v-80h360v80H520Z"/>
                  </svg>
                  <input
                    type="text"
                    value={newFrench}
                    onChange={(e) => setNewFrench(e.target.value)}
                    style={{
                      flex: 1,
                      height: '56px',
                      padding: '0 20px',
                      borderRadius: '12px',
                      border: '1.5px solid rgba(0, 0, 0, 0.12)',
                      fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '24px',
                      letterSpacing: '0%',
                      color: '#000000',
                      backgroundColor: '#ffffff',
                      colorScheme: 'light',
                      outline: 'none',
                      boxSizing: 'border-box',
                      textTransform: 'capitalize'
                    }}
                  />
                </div>
              </div>

              {/* French translation */}
              <div className="flex flex-col gap-3">
                <div style={{
                  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: '17px',
                  fontWeight: '500',
                  lineHeight: '28px',
                  letterSpacing: '0%',
                }} className="text-black unified-section-header">
                  French translation
                </div>
                <div className="flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 -960 960 960" fill="#000000" style={{ flexShrink: 0 }}>
                    <path d="m480-80-40-120H160q-33 0-56.5-23.5T80-280v-520q0-33 23.5-56.5T160-880h240l35 120h365q35 0 57.5 22.5T880-680v520q0 33-22.5 56.5T800-80H480ZM286-376q69 0 113.5-44.5T444-536q0-8-.5-14.5T441-564H283v62h89q-8 28-30.5 43.5T287-443q-39 0-67-28t-28-69q0-41 28-69t67-28q18 0 34 6.5t29 19.5l49-47q-21-22-50.5-34T286-704q-67 0-114.5 47.5T124-540q0 69 47.5 116.5T286-376Zm268 20 22-21q-14-17-25.5-33T528-444l26 88Zm50-51q28-33 42.5-63t19.5-47H507l12 42h40q8 15 19 32.5t26 35.5Zm-84 287h280q18 0 29-11.5t11-28.5v-520q0-18-11-29t-29-11H447l47 162h79v-42h41v42h146v41h-51q-10 38-30 74t-47 67l109 107-29 29-108-108-36 37 32 111-80 80Z"/>
                  </svg>
                  <input
                    type="text"
                    value={newRussian}
                    onChange={(e) => setNewRussian(e.target.value)}
                    style={{
                      flex: 1,
                      height: '56px',
                      padding: '0 20px',
                      borderRadius: '12px',
                      border: '1.5px solid rgba(0, 0, 0, 0.12)',
                      fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      fontSize: '16px',
                      fontWeight: '500',
                      lineHeight: '24px',
                      letterSpacing: '0%',
                      color: '#000000',
                      backgroundColor: '#ffffff',
                      colorScheme: 'light',
                      outline: 'none',
                      boxSizing: 'border-box',
                      textTransform: 'capitalize'
                    }}
                  />
                </div>
              </div>

              {/* Partie du discours (Part of speech) */}
              {conjugation && (
                <>
                  <div className="flex flex-col gap-3">
                    <div style={{
                      fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      fontSize: '17px',
                      fontWeight: '500',
                      lineHeight: '28px',
                      letterSpacing: '0%',
                    }} className="text-black unified-section-header">
                      Part of speech
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="24" height="24" viewBox="0 -960 960 960" fill="#000000" style={{ flexShrink: 0 }}>
                        <path d="M160-391h45l23-66h104l24 66h44l-97-258h-46l-97 258Zm81-103 38-107h2l38 107h-78Zm319-70v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-600q-38 0-73 9.5T560-564Zm0 220v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-380q-38 0-73 9t-67 27Zm0-110v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-490q-38 0-73 9.5T560-454ZM260-320q47 0 91.5 10.5T440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6Zm260 42q44-21 88.5-31.5T700-320q36 0 70.5 6t69.5 18v-396q-33-14-68.5-21t-71.5-7q-47 0-93 12t-87 36v394Zm-40 118q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740q51-30 106.5-45T700-800q52 0 102 12t96 36q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59ZM280-499Z"/>
                      </svg>
                      <input
                        type="text"
                        value={editablePartOfSpeech}
                        onChange={(e) => setEditablePartOfSpeech(e.target.value)}
                        style={{
                          flex: 1,
                          height: '56px',
                          padding: '0 20px',
                          borderRadius: '12px',
                          border: '1.5px solid rgba(0, 0, 0, 0.12)',
                          fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          fontSize: '16px',
                          fontWeight: '500',
                          lineHeight: '24px',
                          letterSpacing: '0%',
                          color: '#000000',
                          backgroundColor: '#ffffff',
                          colorScheme: 'light',
                          outline: 'none',
                          boxSizing: 'border-box',
                          textTransform: 'capitalize'
                        }}
                      />
                    </div>
                  </div>

                  {/* Type de mot (Type of word / Gender) */}
                  <div className="flex flex-col gap-3">
                    <div style={{
                      fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      fontSize: '17px',
                      fontWeight: '500',
                      lineHeight: '28px',
                      letterSpacing: '0%',
                    }} className="text-black unified-section-header">
                      Type of word
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="24" height="24" viewBox="0 -960 960 960" fill="#000000" style={{ flexShrink: 0 }}>
                        <path d="M120-160v-640h80v640h-80Zm640 0v-640h80v640h-80ZM294-280l150-400h72l150 400h-70l-34-102H400l-36 102h-70Zm126-160h120l-58-166-62 166Z"/>
                      </svg>
                      <input
                        type="text"
                        value={editableTypeOfWord}
                        onChange={(e) => setEditableTypeOfWord(e.target.value)}
                        style={{
                          flex: 1,
                          height: '56px',
                          padding: '0 20px',
                          borderRadius: '12px',
                          border: '1.5px solid rgba(0, 0, 0, 0.12)',
                          fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          fontSize: '16px',
                          fontWeight: '500',
                          lineHeight: '24px',
                          letterSpacing: '0%',
                          color: '#000000',
                          backgroundColor: '#ffffff',
                          colorScheme: 'light',
                          outline: 'none',
                          boxSizing: 'border-box',
                          textTransform: 'capitalize'
                        }}
                      />
                    </div>
                  </div>

                  {/* Conjugation table */}
                  {conjugation && (editablePartOfSpeech.toLowerCase().includes('verb') || editablePartOfSpeech.toLowerCase().includes('глагол')) && (
                    <div className="conjugation-table-wrapper">
                      <ConjugationTableWhite 
                        conjugation={conjugation}
                        word={newFrench}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNewFrench('');
                    setNewRussian('');
                    setConjugation(null);
                    setEditablePartOfSpeech('');
                    setEditableTypeOfWord('');
                  }}
                  style={{
                    width: '56px',
                    height: '56px',
                    padding: '12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background-color 0.2s ease',
                    borderRadius: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Delete word"
                >
                  <svg width="32" height="56" viewBox="0 0 32 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 28V33" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 28V33" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 23H24" stroke="#7D7D7D" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 26V34C10 35.6569 11.3432 37 13 37H19C20.6569 37 22 35.6569 22 34V26" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13 21C13 19.8954 13.8954 19 15 19H17C18.1046 19 19 19.8954 19 21V23H13V21Z" stroke="#7D7D7D" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={addCard}
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    borderRadius: '12px',
                    fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '24px',
                    letterSpacing: '0%',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Add word
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Карточки для изучения */}
        {cards.length > 0 && (
          <div className="mobile-cards-container mx-auto" style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            maxWidth: '614px',
            paddingBottom: '56px',
            position: 'relative'
          }}>
            {/* Счетчик карточек */}
            <p style={{
              textAlign: 'center',
              color: '#888888',
              marginBottom: '24px',
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: '16px',
              fontWeight: '500'
            }}>
              <span style={{ color: '#000000', fontWeight: '600' }}>{currentCardIndex + 1}</span>
              <span style={{ color: '#888888' }}> / {cards.length}</span>
            </p>

            {/* Горизонтальный слайдер с карточками */}
            <div
              className="overflow-hidden rounded-2xl relative mobile-614 mobile-slider"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                if (isDragging) {
                  setIsDragging(false);
                  setSlideOffset(0);
                  setDragStart(0);
                  setWasDragged(false);
                  setCanFlip(true);
                }
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ cursor: isDragging ? 'grabbing' : 'grab', width: `${CARD_WIDTH}px`, height: '560px', touchAction: 'pan-y', userSelect: 'none' }}
            >
              {/* Контейнер слайдера */}
              <div
                className="flex h-full transition-transform"
                style={{
                  transform: `translateX(calc(${-currentCardIndex * SLIDE_WIDTH}px + ${slideOffset}px))`,
                  transitionDuration: isDragging ? '0ms' : '300ms',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
                  gap: `${CARD_GAP}px`,
                }}
              >
                {cards.map((card, idx) => (
                  <div
                    key={`${currentTopic.id}-${idx}`}
                    className="flex-shrink-0 w-full h-full flex items-center justify-center"
                    onClick={() => canFlip && !isDragging && setFlipped(!flipped)}
                    style={{
                      padding: '0 16px',
                      boxSizing: 'border-box',
                      userSelect: 'none'
                    }}
                  >
                    <div
                      className="relative w-full h-full transition-transform duration-500"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: flipped && idx === currentCardIndex ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                      {/* Фронт */}
                      <div
                        className="absolute w-full h-full flex items-center justify-center p-8"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          backgroundColor: '#FFE5F6',
                          borderRadius: '24px',
                          userSelect: 'none'
                        }}
                      >
                        <div className="text-center">
                          <p style={{
                            fontFamily: cardFontFamily === 'Geist' ? "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" : cardFontFamily,
                            fontSize: `${cardFontSize}px`,
                            fontWeight: cardFontWeight,
                            lineHeight: `${cardLineHeight}px`,
                            letterSpacing: `${cardLetterSpacing}px`,
                            textAlign: cardTextAlign,
                            color: '#000000'
                          }}>{card.french.charAt(0).toUpperCase() + card.french.slice(1)}</p>
                        </div>
                      </div>

                      {/* Обратная сторона */}
                      <div
                        className="absolute w-full h-full bg-white card-back"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          borderRadius: '24px',
                          userSelect: 'none',
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%' }}>
                          <div className="text-center" style={{ width: '100%' }}>
                            <p style={{
                              fontFamily: cardFontFamily === 'Geist' ? "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" : cardFontFamily,
                              fontSize: `${cardFontSize}px`,
                              fontWeight: cardFontWeight,
                              lineHeight: `${cardLineHeight}px`,
                              letterSpacing: `${cardLetterSpacing}px`,
                              textAlign: cardTextAlign,
                              color: '#1f2937',
                              margin: '0 0 8px 0'
                            }}>{card.russian}</p>
                            <p className="text-base text-gray-600 font-medium" style={{ margin: 0 }}>
                              {card.conjugation.match(/Род: (.+?)(?:\n|$)/)?.[1]} | {card.conjugation.match(/Часть речи: (.+?)(?:\n|$)/)?.[1]}
                            </p>
                          </div>
                        </div>
                        
                        {card.conjugation && (card.partOfSpeech?.toLowerCase().includes('verb') || card.partOfSpeech?.toLowerCase().includes('глагол')) && (
                          <div className="card-table-wrapper" style={{ paddingBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
                            <ConjugationTableWhite 
                              conjugation={card.conjugation}
                              word={card.french}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>


            </div>
          </div>
        )}

        {/* Список всех слов в теме */}
        {cards.length > 0 && (
            <div className="bg-white rounded-2xl mobile-614 w-full" style={{ 
              borderRadius: '24px', 
              maxWidth: '614px', 
              margin: '0 auto',
              padding: '32px'
            }}>
              <h2 style={{
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: '17px',
                fontWeight: '500',
                lineHeight: '28px',
                marginBottom: '16px',
              }} className="text-black unified-section-header">
                {cards.length} {cards.length === 1 ? 'word' : 'words'}
              </h2>
              <div className="flex flex-col" style={{ gap: '12px' }}>
                {cards.map((card, idx) => (
                  <div
                    key={idx}
                    data-word-card-index={idx}
                    draggable={!IS_TOUCH_DEVICE}
                    onDragStart={(e) => handleCardDragStart(e, idx)}
                    onDragOver={(e) => handleCardDragOver(e, idx)}
                    onDragLeave={handleCardDragLeave}
                    onDrop={(e) => handleCardDrop(e, idx)}
                    onDragEnd={handleCardDragEnd}
                    onPointerDown={(e) => handleWordCardPointerDown(e, idx)}
                    onPointerMove={handleWordCardPointerMove}
                    onPointerUp={handleWordCardPointerUp}
                    onPointerCancel={handleWordCardPointerUp}
                    style={{
                      border: ((isTouchWordCardDragging && touchDraggedWordCardIndex === idx) || draggedCardIndex === idx)
                        ? '2px dashed rgba(0, 0, 0, 0.3)'
                        : '1.5px solid rgba(0, 0, 0, 0.08)',
                      boxSizing: 'border-box',
                      borderRadius: '20px',
                      overflow: 'visible',
                      padding: '0.9rem',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      touchAction: (isTouchWordCardDragging || draggedCardIndex != null) ? 'none' : 'pan-y',
                      backgroundColor: ((dragOverCardIndex === idx) || (isTouchWordCardDragging && touchDragOverWordCardIndex === idx))
                        ? 'rgba(0, 0, 0, 0.06)'
                        : 'transparent',
                      opacity: ((isTouchWordCardDragging && touchDraggedWordCardIndex === idx) || draggedCardIndex === idx) ? 0.6 : 1,
                      pointerEvents: 'auto',
                      transition: 'all 0.15s ease',
                    }}
                    className="topic-item flex items-center gap-4 cursor-pointer hover:bg-black/2"
                  >
                    {/* Left icon */}
                    <svg 
                      width="32" 
                      height="56" 
                      viewBox="0 0 32 56" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0"
                      style={{ userSelect: 'none' }}
                    >
                      <path d="M9 23L23 23" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 28.375L23 28.375" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 33.75L17.75 33.75" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>

                    {/* Card info */}
                    <div className="flex-1 min-w-0">
                      <p style={{
                        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontSize: '14px',
                        fontWeight: '500',
                        lineHeight: '20px',
                        color: 'rgba(0, 0, 0, 0.4)',
                      }}>
                        {card.russian}
                      </p>
                      <p style={{
                        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontSize: '16px',
                        fontWeight: '500',
                        lineHeight: '28px',
                        color: '#000000',
                      }} className="truncate card-french-title">
                        {card.french.charAt(0).toUpperCase() + card.french.slice(1)}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onPointerDown={(e) => { e.stopPropagation(); }}
                      onPointerUp={(e) => { e.stopPropagation(); }}
                      onPointerCancel={(e) => { e.stopPropagation(); }}
                      onTouchStart={(e) => { e.stopPropagation(); }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        deleteCard(idx);
                      }}
                      className="text-black/50 hover:text-red-500 transition flex-shrink-0"
                    >
                      <svg 
                        width="32" 
                        height="56" 
                        viewBox="0 0 32 56" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ 
                          pointerEvents: 'none',
                          userSelect: 'none',
                          display: 'block',
                        }}
                      >
                        <path d="M14 28V33" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18 28V33" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 23H24" stroke="#7D7D7D" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 26V34C10 35.6569 11.3432 37 13 37H19C20.6569 37 22 35.6569 22 34V26" stroke="black" strokeOpacity="0.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13 21C13 19.8954 13.8954 19 15 19H17C18.1046 19 19 19.8954 19 21V23H13V21Z" stroke="#7D7D7D" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
        )}
      </div>
    </div>
    </>
  );
}
