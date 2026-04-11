/**
 * Universal Theme Switcher for yth-ai.github.io
 * 
 * Reads theme preference from localStorage (shared with index.html / en.html).
 * Each sub-page declares its native theme via <html data-native-theme="dark|light">.
 * When user's preferred theme differs from native, override CSS is injected.
 * 
 * Usage: 
 *   1. On <html> add: data-native-theme="dark" (or "light")
 *   2. Before </body> add: <script src="/theme-switcher.js"></script>
 *      (use relative path like ../theme-switcher.js for subdirectories)
 */
(function () {
  'use strict';

  var html = document.documentElement;
  var nativeTheme = html.getAttribute('data-native-theme') || 'dark';
  var stored = localStorage.getItem('theme') || 'dark';

  // ─── Create floating button group (home + theme toggle) ───
  var btnWrap = document.createElement('div');
  btnWrap.id = 'ts-float';

  // Home button
  var homeBtn = document.createElement('a');
  homeBtn.id = 'ts-home';
  homeBtn.title = '返回首页 / Back to Home';
  homeBtn.textContent = '🏠';
  // Compute relative path to index.html
  var pathParts = location.pathname.replace(/^\//, '').split('/');
  if (pathParts.length > 1) {
    // In a subdirectory like /涌现/xxx.html → ../index.html
    homeBtn.href = '../index.html';
  } else {
    homeBtn.href = 'index.html';
  }

  // Theme toggle button
  var btn = document.createElement('button');
  btn.id = 'ts-btn';
  btn.title = '切换深浅主题 / Toggle theme';

  btnWrap.appendChild(homeBtn);
  btnWrap.appendChild(btn);

  // ─── Inject button styles (always present) ───
  var btnStyle = document.createElement('style');
  btnStyle.textContent = [
    '#ts-float{position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:10px;align-items:center}',
    '#ts-float a,#ts-float button{width:42px;height:42px;border-radius:50%;border:1.5px solid rgba(128,128,128,.35);',
    'background:rgba(128,128,128,.12);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
    'cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;',
    'transition:transform .2s,border-color .2s,box-shadow .2s;box-shadow:0 2px 12px rgba(0,0,0,.15);',
    'text-decoration:none;color:inherit}',
    '#ts-float a:hover,#ts-float button:hover{transform:scale(1.12);border-color:rgba(128,128,128,.6);box-shadow:0 4px 20px rgba(0,0,0,.25)}'
  ].join('\n');
  document.head.appendChild(btnStyle);

  // ─── Override CSS for dark-native pages switching to light ───
  var DARK_TO_LIGHT_CSS = [
    // Common overrides for all dark-native pages
    'html[data-theme="light"]{',
    '  color-scheme: light;',
    '}',

    // === 涌现 chapters (--primary/#1a1a2e style) ===
    'html[data-theme="light"][data-tpl="yongxian"] {--primary:#f8f9fa;--secondary:#edf2f7;--accent:#d63031;--accent2:#2d6cb5;--text:#1a202c;--text-muted:#64748b;--light-bg:#f1f5f9;--card-bg:#ffffff;--border:#e2e8f0;--highlight:#f8f4e8;--quote-color:#d63031}',
    'html[data-theme="light"][data-tpl="yongxian"] body{background:var(--primary);color:var(--text)}',
    'html[data-theme="light"][data-tpl="yongxian"] .book-header{background:linear-gradient(135deg,#1e40af 0%,#2563eb 100%)}',
    'html[data-theme="light"][data-tpl="yongxian"] .book-title{color:#fff}',
    'html[data-theme="light"][data-tpl="yongxian"] .chapter-header{background:#edf2f7}',
    'html[data-theme="light"][data-tpl="yongxian"] .chapter-title{color:#1a202c}',
    'html[data-theme="light"][data-tpl="yongxian"] h2{color:#1a202c;border-bottom-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="yongxian"] .toc{background:#fff;border-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="yongxian"] .toc a{color:#64748b}',
    'html[data-theme="light"][data-tpl="yongxian"] .timeline-card{background:#fff;border-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="yongxian"] .timeline-card .event{color:#1a202c}',
    'html[data-theme="light"][data-tpl="yongxian"] .nav-btn{background:#fff;border-color:#e2e8f0;color:#1a202c}',
    'html[data-theme="light"][data-tpl="yongxian"] .nav-btn:hover{background:#d63031;color:#fff;border-color:#d63031}',
    'html[data-theme="light"][data-tpl="yongxian"] blockquote{background:#f8f4e8;color:#1a202c}',
    'html[data-theme="light"][data-tpl="yongxian"] .highlight-box{background:#f8f4e8;border-color:#e2e8f0}',

    // === 涌现 目录 (--primary/#1a1a2e, card-bg:#1e2a3e) ===
    'html[data-theme="light"][data-tpl="yongxian-toc"] {--primary:#f8f9fa;--secondary:#edf2f7;--accent:#d63031;--accent2:#2563eb;--text:#1a202c;--text-muted:#64748b;--card-bg:#ffffff;--border:#e2e8f0}',
    'html[data-theme="light"][data-tpl="yongxian-toc"] body{background:var(--primary);color:var(--text)}',
    'html[data-theme="light"][data-tpl="yongxian-toc"] .book-header{background:linear-gradient(135deg,#0a1628 0%,#1e40af 50%,#2563eb 100%)}',
    'html[data-theme="light"][data-tpl="yongxian-toc"] .part-header{background:#fff;border-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="yongxian-toc"] .part-num{color:#d63031}',
    'html[data-theme="light"][data-tpl="yongxian-toc"] .part-name{color:#1a202c}',
    'html[data-theme="light"][data-tpl="yongxian-toc"] .ch-item{background:#fff;border-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="yongxian-toc"] .ch-item:hover{border-color:#cbd5e1;box-shadow:0 2px 12px rgba(0,0,0,.06)}',
    'html[data-theme="light"][data-tpl="yongxian-toc"] .ch-title{color:#1a202c}',
    'html[data-theme="light"][data-tpl="yongxian-toc"] .ch-desc{color:#64748b}',
    'html[data-theme="light"][data-tpl="yongxian-toc"] .toc-intro{color:#64748b;border-bottom-color:#e2e8f0}',

    // === GitHub dark style (#0e1117 bg) ===
    'html[data-theme="light"][data-tpl="gh-dark"]{--bg:#f8fafc;--card:#ffffff;--border:#e2e8f0;--text:#1e293b;--text-muted:#64748b;--text-dim:#94a3b8}',
    'html[data-theme="light"][data-tpl="gh-dark"] body{background:var(--bg);color:var(--text)}',
    'html[data-theme="light"][data-tpl="gh-dark"] nav{background:rgba(248,250,252,.92);border-bottom-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="gh-dark"] nav .brand{color:#1e293b}',
    'html[data-theme="light"][data-tpl="gh-dark"] nav .nav-links a{color:#64748b}',
    'html[data-theme="light"][data-tpl="gh-dark"] nav .nav-links a:hover{color:#1e293b;background:rgba(0,0,0,.04)}',
    'html[data-theme="light"][data-tpl="gh-dark"] .hero{background:linear-gradient(160deg,#f0f4ff 0%,#e8edf5 40%,#f0f4ff 100%);border-bottom-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="gh-dark"] .hero h1,.hero .hero-title{color:#1e293b}',
    'html[data-theme="light"][data-tpl="gh-dark"] .hero p,.hero .hero-desc{color:#64748b}',
    'html[data-theme="light"][data-tpl="gh-dark"] .section-title,.section-heading,h2{color:#1e293b}',
    'html[data-theme="light"][data-tpl="gh-dark"] .card,.survey-card,.info-card,.method-card,.content-card{background:#fff;border-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="gh-dark"] .card:hover,.survey-card:hover,.info-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.06)}',
    'html[data-theme="light"][data-tpl="gh-dark"] table th{background:#f1f5f9;color:#1e293b}',
    'html[data-theme="light"][data-tpl="gh-dark"] table td{border-bottom-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="gh-dark"] pre,code{background:#f1f5f9;color:#334155}',
    'html[data-theme="light"][data-tpl="gh-dark"] blockquote{background:#f8f9fa;border-left-color:#3b82f6}',
    'html[data-theme="light"][data-tpl="gh-dark"] .footer,.page-footer{background:#f1f5f9;border-top-color:#e2e8f0;color:#64748b}',
    'html[data-theme="light"][data-tpl="gh-dark"] .toc-panel,.sidebar,#sidebar{background:#f8fafc;border-right-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="gh-dark"] .toc-panel a,.sidebar a,#sidebar a{color:#64748b}',
    'html[data-theme="light"][data-tpl="gh-dark"] .toc-panel a:hover,.sidebar a:hover,#sidebar a:hover{color:#1e293b;background:rgba(0,0,0,.04)}',
    'html[data-theme="light"][data-tpl="gh-dark"] .toc-panel a.active,.sidebar a.active,#sidebar a.active,.nav-item.active{color:#2563eb;background:rgba(37,99,235,.06)}',

    // === Numbered accent system (--bg1/#0a0f1a, --accent1~N) ===
    'html[data-theme="light"][data-tpl="numbered"]{--bg1:#f8fafc;--bg2:#f1f5f9;--card:#ffffff;--border:#e2e8f0;--text1:#1e293b;--text2:#64748b;--text3:#94a3b8}',
    'html[data-theme="light"][data-tpl="numbered"] body{background:var(--bg1);color:var(--text1)}',
    'html[data-theme="light"][data-tpl="numbered"] #sidebar,.sidebar{background:#f1f5f9;border-right-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="numbered"] .nav-logo h2{color:#2563eb}',
    'html[data-theme="light"][data-tpl="numbered"] .nav-item{color:#64748b}',
    'html[data-theme="light"][data-tpl="numbered"] .nav-item:hover{color:#1e293b;background:rgba(37,99,235,.06)}',
    'html[data-theme="light"][data-tpl="numbered"] .nav-item.active{color:#2563eb;background:rgba(37,99,235,.08)}',
    'html[data-theme="light"][data-tpl="numbered"] .hero{background:linear-gradient(135deg,#f0f4ff 0%,#e8edf5 50%,#f0f4ff 100%);border-bottom-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="numbered"] .hero h1,.hero-title{color:#1e293b}',
    'html[data-theme="light"][data-tpl="numbered"] .card,.section-card,.bench-card{background:#fff;border-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="numbered"] table th{background:#f1f5f9;color:#1e293b}',
    'html[data-theme="light"][data-tpl="numbered"] table td{border-bottom-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="numbered"] .footer{background:#f1f5f9;border-top-color:#e2e8f0}',

    // === 数据珠玑 目录 (same numbered style but specific classes) ===
    'html[data-theme="light"][data-tpl="sjzj-toc"]{--bg1:#f8fafc;--bg2:#f1f5f9;--card:#ffffff;--border:#e2e8f0;--text1:#1e293b;--text2:#64748b;--text3:#94a3b8}',
    'html[data-theme="light"][data-tpl="sjzj-toc"] body{background:var(--bg1);color:var(--text1);padding:20px}',
    'html[data-theme="light"][data-tpl="sjzj-toc"] .book-title{color:#1e293b}',
    'html[data-theme="light"][data-tpl="sjzj-toc"] .book-subtitle{color:#059669}',
    'html[data-theme="light"][data-tpl="sjzj-toc"] .book-desc{color:#64748b}',
    'html[data-theme="light"][data-tpl="sjzj-toc"] .part-block{background:#fff;border-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="sjzj-toc"] .part-header{color:#1e293b;border-bottom-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="sjzj-toc"] .chapter-item{background:rgba(0,0,0,.02);border-left-color:#2563eb}',
    'html[data-theme="light"][data-tpl="sjzj-toc"] .chapter-item:hover{background:rgba(0,0,0,.04)}',
    'html[data-theme="light"][data-tpl="sjzj-toc"] .chapter-title{color:#1e293b}',
    'html[data-theme="light"][data-tpl="sjzj-toc"] .section-list li{color:#64748b;background:rgba(0,0,0,.03);border-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="sjzj-toc"] .part-desc{color:#64748b}',

    // === BEM semantic (--bg-primary etc.) ===
    'html[data-theme="light"][data-tpl="bem"]{--bg-primary:#f8fafc;--bg-secondary:#f1f5f9;--bg-tertiary:#e2e8f0;--bg-card:#ffffff;--bg-hover:rgba(0,0,0,.03);--border:#e2e8f0;--border-muted:#f1f5f9;--text-primary:#1e293b;--text-secondary:#475569;--text-muted:#94a3b8}',
    'html[data-theme="light"][data-tpl="bem"] body{background:var(--bg-primary);color:var(--text-primary)}',
    'html[data-theme="light"][data-tpl="bem"] nav{background:rgba(248,250,252,.92)}',
    'html[data-theme="light"][data-tpl="bem"] .hero{background:linear-gradient(160deg,#f0f4ff 0%,#edf2f7 40%,#f0f4ff 100%)}',
    'html[data-theme="light"][data-tpl="bem"] .card,.metric-card,.info-card{background:#fff;border-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="bem"] h2,h3{color:#1e293b}',
    'html[data-theme="light"][data-tpl="bem"] table th{background:#f1f5f9;color:#1e293b}',
    'html[data-theme="light"][data-tpl="bem"] #sidebar,.sidebar{background:#f1f5f9;border-right-color:#e2e8f0}',

    // === SAE report (--bg1/#070c14, short vars --a1~a6, --t1~t3) ===
    'html[data-theme="light"][data-tpl="sae"]{--bg1:#f8fafc;--bg2:#f1f5f9;--card:#ffffff;--card2:#f8fafc;--border:#e2e8f0;--border2:#cbd5e1;--t1:#1e293b;--t2:#64748b;--t3:#94a3b8}',
    'html[data-theme="light"][data-tpl="sae"] body{background:var(--bg1);color:var(--t1)}',
    'html[data-theme="light"][data-tpl="sae"] .hero{background:linear-gradient(135deg,#f0f4ff 0%,#e8edf5 100%)}',
    'html[data-theme="light"][data-tpl="sae"] .hero h1{color:#1e293b}',
    'html[data-theme="light"][data-tpl="sae"] .card,.section-card{background:#fff;border-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="sae"] #sidebar,.sidebar,.toc-panel{background:#f1f5f9;border-color:#e2e8f0}',

    // === llm_book/advanced.html ===
    'html[data-theme="light"][data-tpl="llmbook-adv"]{--bg:#f8fafc;--bg-card:#ffffff;--bg-code:#f1f5f9;--border:#e2e8f0;--text:#1e293b;--text-sec:#64748b}',
    'html[data-theme="light"][data-tpl="llmbook-adv"] body{background:var(--bg);color:var(--text)}',

    // === llm_development_history ===
    'html[data-theme="light"][data-tpl="llm-history"] body{background:#f8fafc;color:#1e293b}',
    'html[data-theme="light"][data-tpl="llm-history"] .hero,.hero-section{background:linear-gradient(135deg,#f0f4ff 0%,#e8edf5 100%)}',
    'html[data-theme="light"][data-tpl="llm-history"] .card,.era-card,.timeline-card{background:#fff;border-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="llm-history"] h2,h3{color:#1e293b}',
    'html[data-theme="light"][data-tpl="llm-history"] .footer{background:#f1f5f9}',

    // === Document parsing survey (--accent1~6, text1~3) ===
    'html[data-theme="light"][data-tpl="doc-parse"]{--bg:#f8fafc;--card:#ffffff;--card2:#f8fafc;--border:#e2e8f0;--text1:#1e293b;--text2:#64748b;--text3:#94a3b8}',
    'html[data-theme="light"][data-tpl="doc-parse"] body{background:var(--bg);color:var(--text1)}',
    'html[data-theme="light"][data-tpl="doc-parse"] nav{background:rgba(248,250,252,.92)}',
    'html[data-theme="light"][data-tpl="doc-parse"] .hero{background:linear-gradient(160deg,#f0f4ff 0%,#edf2f7 100%)}',
    'html[data-theme="light"][data-tpl="doc-parse"] .card{background:#fff;border-color:#e2e8f0}',
    'html[data-theme="light"][data-tpl="doc-parse"] table th{background:#f1f5f9;color:#1e293b}',

    // === agent_data_optimization_survey ===
    'html[data-theme="light"][data-tpl="agent-opt"]{--bg:#f8fafc;--card:#ffffff;--border:#e2e8f0;--text:#1e293b;--text-secondary:#64748b;--accent-light:#dbeafe}',
    'html[data-theme="light"][data-tpl="agent-opt"] body{background:var(--bg);color:var(--text)}',
    'html[data-theme="light"][data-tpl="agent-opt"] .hero{background:linear-gradient(135deg,#f0f4ff 0%,#e8edf5 100%)}',
    'html[data-theme="light"][data-tpl="agent-opt"] .card{background:#fff;border-color:#e2e8f0}',

    // Scrollbar for light mode
    'html[data-theme="light"] ::-webkit-scrollbar-track{background:#f1f5f9}',
    'html[data-theme="light"] ::-webkit-scrollbar-thumb{background:#cbd5e1}',
  ].join('\n');

  // ─── Override CSS for light-native pages switching to dark ───
  var LIGHT_TO_DARK_CSS = [
    'html[data-theme="dark"]{',
    '  color-scheme: dark;',
    '}',

    // === 数据珠玑 chapters (--primary/#1a3a5c, bg:#fff) ===
    'html[data-theme="dark"][data-tpl="sjzj"]{--primary:#93c5fd;--accent:#60a5fa;--light-bg:#1e293b;--text:#e2e8f0;--muted:#94a3b8;--border:#334155;--highlight:#332b00;--green-bg:#0d3320;--green-border:#22c55e;--red-bg:#3b1111;--red-border:#ef4444;--orange-bg:#3b2506;--orange-border:#f59e0b;--purple-bg:#2e1065;--purple-border:#a78bfa}',
    'html[data-theme="dark"][data-tpl="sjzj"] body{background:#0f172a;color:var(--text)}',
    'html[data-theme="dark"][data-tpl="sjzj"] .chapter-header{background:#1e293b;border-bottom-color:#334155}',
    'html[data-theme="dark"][data-tpl="sjzj"] .chapter-title{color:#f1f5f9}',
    'html[data-theme="dark"][data-tpl="sjzj"] .chapter-intro{color:#94a3b8}',
    'html[data-theme="dark"][data-tpl="sjzj"] .chapter-label{color:#60a5fa}',
    'html[data-theme="dark"][data-tpl="sjzj"] h2{color:#f1f5f9;border-bottom-color:#60a5fa}',
    'html[data-theme="dark"][data-tpl="sjzj"] h3{color:#93c5fd}',
    'html[data-theme="dark"][data-tpl="sjzj"] h4{color:#93c5fd}',
    'html[data-theme="dark"][data-tpl="sjzj"] blockquote{background:#1e293b;color:#cbd5e1;border-left-color:#60a5fa}',
    'html[data-theme="dark"][data-tpl="sjzj"] .highlight-box{background:#332b00;border-color:#854d0e}',
    'html[data-theme="dark"][data-tpl="sjzj"] .highlight-box strong{color:#fbbf24}',
    'html[data-theme="dark"][data-tpl="sjzj"] .info-box{background:#1e293b;border-color:#334155}',
    'html[data-theme="dark"][data-tpl="sjzj"] .info-box h4{color:#60a5fa}',
    'html[data-theme="dark"][data-tpl="sjzj"] .success-box{background:#0d3320;border-color:#22c55e}',
    'html[data-theme="dark"][data-tpl="sjzj"] table th{background:#1e3a5c;color:#f1f5f9}',
    'html[data-theme="dark"][data-tpl="sjzj"] table td{border-bottom-color:#334155}',
    'html[data-theme="dark"][data-tpl="sjzj"] tr:nth-child(even) td{background:#1e293b}',
    'html[data-theme="dark"][data-tpl="sjzj"] .formula-box{background:#1e1b4b;border-color:#4338ca;color:#c4b5fd}',
    'html[data-theme="dark"][data-tpl="sjzj"] .timeline-year{background:#60a5fa}',
    'html[data-theme="dark"][data-tpl="sjzj"] .footnote{color:#94a3b8;border-top-color:#334155}',
    'html[data-theme="dark"][data-tpl="sjzj"] .nav-bar{border-top-color:#334155}',
    'html[data-theme="dark"][data-tpl="sjzj"] .nav-bar a{color:#60a5fa}',
    'html[data-theme="dark"][data-tpl="sjzj"] .section-tag{background:#60a5fa}',
    'html[data-theme="dark"][data-tpl="sjzj"] a{color:#60a5fa}',

    // === Light professional reports (agentic_coding, Terminal_Agent, etc.) ===
    'html[data-theme="dark"][data-tpl="light-report"]{--primary:#93c5fd;--accent:#60a5fa;--accent-light:#1e3a5c;--text:#e2e8f0;--text-muted:#94a3b8;--text-light:#94a3b8;--border:#334155;--bg:#0f172a;--bg-alt:#1e293b;--highlight:#332b00;--highlight-border:#854d0e;--success:#0d3320;--success-border:#22c55e;--code-bg:#1e293b;--card-shadow:0 2px 12px rgba(0,0,0,.3);--radius:12px;--primary-light:#1e3a5c;--secondary:#22c55e}',
    'html[data-theme="dark"][data-tpl="light-report"] body{background:#0f172a;color:#e2e8f0}',
    'html[data-theme="dark"][data-tpl="light-report"] #sidebar{background:#1a2332;color:#cbd5e1}',
    'html[data-theme="dark"][data-tpl="light-report"] #sidebar .sidebar-header{background:#0f1d2f;border-bottom-color:#334155}',
    'html[data-theme="dark"][data-tpl="light-report"] #sidebar .sidebar-header h2{color:#93c5fd}',
    'html[data-theme="dark"][data-tpl="light-report"] #sidebar .sidebar-header p{color:#94a3b8}',
    'html[data-theme="dark"][data-tpl="light-report"] #sidebar nav a{color:#94a3b8}',
    'html[data-theme="dark"][data-tpl="light-report"] #sidebar nav a:hover{background:rgba(255,255,255,.06);color:#f1f5f9}',
    'html[data-theme="dark"][data-tpl="light-report"] #sidebar nav a.h1-link{color:#93c5fd}',
    'html[data-theme="dark"][data-tpl="light-report"] #sidebar nav a.h2-link{color:#64748b}',
    'html[data-theme="dark"][data-tpl="light-report"] .cover{border-bottom-color:#334155}',
    'html[data-theme="dark"][data-tpl="light-report"] .cover .badge{background:#2563eb}',
    'html[data-theme="dark"][data-tpl="light-report"] h2{color:#f1f5f9;border-bottom-color:#334155}',
    'html[data-theme="dark"][data-tpl="light-report"] h3{color:#93c5fd}',
    'html[data-theme="dark"][data-tpl="light-report"] blockquote{background:#1e293b;border-left-color:#60a5fa;color:#cbd5e1}',
    'html[data-theme="dark"][data-tpl="light-report"] .callout,.insight-box,.tip-box,.warning-box,.info-box{background:#1e293b;border-color:#334155}',
    'html[data-theme="dark"][data-tpl="light-report"] .callout h4,.insight-box h4,.tip-box h4{color:#60a5fa}',
    'html[data-theme="dark"][data-tpl="light-report"] table th{background:#1e293b;color:#f1f5f9}',
    'html[data-theme="dark"][data-tpl="light-report"] table td{border-bottom-color:#334155;color:#e2e8f0}',
    'html[data-theme="dark"][data-tpl="light-report"] tr:nth-child(even) td{background:rgba(255,255,255,.02)}',
    'html[data-theme="dark"][data-tpl="light-report"] pre,code{background:#1e293b;color:#e2e8f0}',
    'html[data-theme="dark"][data-tpl="light-report"] .formula-box{background:#1e1b4b;border-color:#4338ca;color:#c4b5fd}',
    'html[data-theme="dark"][data-tpl="light-report"] .highlight-box{background:#332b00;border-color:#854d0e}',
    'html[data-theme="dark"][data-tpl="light-report"] .highlight-box strong{color:#fbbf24}',
    'html[data-theme="dark"][data-tpl="light-report"] .success-box{background:#0d3320;border-color:#22c55e}',
    'html[data-theme="dark"][data-tpl="light-report"] a{color:#60a5fa}',

    // === Specific: Terminal_Agent layout (grid + sticky toc) ===
    'html[data-theme="dark"][data-tpl="light-report"] .container{background:transparent}',
    'html[data-theme="dark"][data-tpl="light-report"] .toc{background:#1e293b;border-color:#334155;box-shadow:0 2px 12px rgba(0,0,0,.3)}',
    'html[data-theme="dark"][data-tpl="light-report"] .toc h3{color:#93c5fd}',
    'html[data-theme="dark"][data-tpl="light-report"] .toc a{color:#94a3b8}',
    'html[data-theme="dark"][data-tpl="light-report"] .toc a:hover{color:#f1f5f9}',
    'html[data-theme="dark"][data-tpl="light-report"] .main-col,.main-content{background:transparent}',
    'html[data-theme="dark"][data-tpl="light-report"] .card,.content-card,.method-card{background:#1e293b;border-color:#334155;box-shadow:0 2px 12px rgba(0,0,0,.2)}',
    'html[data-theme="dark"][data-tpl="light-report"] .metric-card{background:#1e293b;border-color:#334155}',
    'html[data-theme="dark"][data-tpl="light-report"] .metric-card .value{color:#f1f5f9}',
    'html[data-theme="dark"][data-tpl="light-report"] .tag{background:#334155;color:#94a3b8}',
    'html[data-theme="dark"][data-tpl="light-report"] .footer{background:#1e293b;border-top-color:#334155}',
    'html[data-theme="dark"][data-tpl="light-report"] .nav-bar{border-top-color:#334155}',
    'html[data-theme="dark"][data-tpl="light-report"] .nav-bar a{color:#60a5fa}',

    // === llm_book/index.html (warm white) ===
    'html[data-theme="dark"][data-tpl="llmbook"]{--bg:#0f172a;--blue:#93c5fd;--orange:#fb923c;--green:#34d399;--light-blue:#1e293b;--light-orange:#3b1800;--light-green:#0d3320;--yellow:#332b00;--text:#e2e8f0;--text-light:#94a3b8;--shadow:0 4px 24px rgba(0,0,0,.3)}',
    'html[data-theme="dark"][data-tpl="llmbook"] body{background:var(--bg);color:var(--text)}',
    'html[data-theme="dark"][data-tpl="llmbook"] #cover{background:linear-gradient(135deg,#1e3a5f 0%,#1e40af 45%,#c2410c 100%)}',
    'html[data-theme="dark"][data-tpl="llmbook"] .toc-container{background:#1e293b}',
    'html[data-theme="dark"][data-tpl="llmbook"] .toc-item{background:#0f172a;border-color:#334155}',
    'html[data-theme="dark"][data-tpl="llmbook"] .toc-item:hover{background:#1e293b}',
    'html[data-theme="dark"][data-tpl="llmbook"] .chapter-box{background:#1e293b;border-color:#334155}',
    'html[data-theme="dark"][data-tpl="llmbook"] h2,h3{color:#f1f5f9}',

    // === llm_rubric_report ===
    'html[data-theme="dark"][data-tpl="llm-rubric"] body{background:#0f172a;color:#e2e8f0}',
    'html[data-theme="dark"][data-tpl="llm-rubric"] .container{background:transparent}',
    'html[data-theme="dark"][data-tpl="llm-rubric"] .card,.content-card,.report-card{background:#1e293b;border-color:#334155}',
    'html[data-theme="dark"][data-tpl="llm-rubric"] h2,h3{color:#f1f5f9}',
    'html[data-theme="dark"][data-tpl="llm-rubric"] blockquote{background:#1e293b;color:#cbd5e1}',
    'html[data-theme="dark"][data-tpl="llm-rubric"] table th{background:#1e293b;color:#f1f5f9}',
    'html[data-theme="dark"][data-tpl="llm-rubric"] table td{border-bottom-color:#334155}',
    'html[data-theme="dark"][data-tpl="llm-rubric"] tr:nth-child(even) td{background:rgba(255,255,255,.02)}',
    'html[data-theme="dark"][data-tpl="llm-rubric"] #sidebar{background:#1a2332;color:#cbd5e1}',
    'html[data-theme="dark"][data-tpl="llm-rubric"] #sidebar a{color:#94a3b8}',
    'html[data-theme="dark"][data-tpl="llm-rubric"] #sidebar a:hover{color:#f1f5f9;background:rgba(255,255,255,.06)}',
    'html[data-theme="dark"][data-tpl="llm-rubric"] .tag{background:#334155;color:#94a3b8}',
    'html[data-theme="dark"][data-tpl="llm-rubric"] a{color:#60a5fa}',

    // === terminal_bench_training_data ===
    'html[data-theme="dark"][data-tpl="tb-train"]{--primary:#93c5fd;--accent:#60a5fa;--accent2:#34d399;--bg:#0f172a;--card:#1e293b;--border:#334155;--text:#e2e8f0;--text-muted:#94a3b8;--code-bg:#1e293b;--code-text:#e2e8f0;--tag-bg:#334155;--tag-text:#94a3b8;--warn:#332b00;--warn-border:#854d0e;--tip:#0d3320;--tip-border:#22c55e}',
    'html[data-theme="dark"][data-tpl="tb-train"] body{background:var(--bg);color:var(--text)}',
    'html[data-theme="dark"][data-tpl="tb-train"] h2,h3{color:#f1f5f9}',
    'html[data-theme="dark"][data-tpl="tb-train"] table th{background:#1e293b;color:#f1f5f9}',
    'html[data-theme="dark"][data-tpl="tb-train"] table td{border-bottom-color:#334155}',
    'html[data-theme="dark"][data-tpl="tb-train"] .card{background:#1e293b;border-color:#334155}',

    // === 预训练数据研发_研究报告 ===
    'html[data-theme="dark"][data-tpl="pretrain-report"]{--primary:#93c5fd;--primary-light:#1e3a5c;--secondary:#22c55e;--accent:#fbbf24;--text:#e2e8f0;--text-light:#94a3b8;--border:#334155;--bg:#0f172a;--card:#1e293b;--code-bg:#1e293b;--code-text:#e2e8f0}',
    'html[data-theme="dark"][data-tpl="pretrain-report"] body{background:var(--bg);color:var(--text)}',
    'html[data-theme="dark"][data-tpl="pretrain-report"] h2,h3{color:#f1f5f9}',
    'html[data-theme="dark"][data-tpl="pretrain-report"] .card{background:#1e293b;border-color:#334155}',
    'html[data-theme="dark"][data-tpl="pretrain-report"] table th{background:#1e293b;color:#f1f5f9}',
    'html[data-theme="dark"][data-tpl="pretrain-report"] table td{border-bottom-color:#334155}',
    'html[data-theme="dark"][data-tpl="pretrain-report"] blockquote{background:#1e293b;color:#cbd5e1}',
    'html[data-theme="dark"][data-tpl="pretrain-report"] #sidebar{background:#1a2332}',
    'html[data-theme="dark"][data-tpl="pretrain-report"] #sidebar a{color:#94a3b8}',
    'html[data-theme="dark"][data-tpl="pretrain-report"] a{color:#60a5fa}',

    // Scrollbar for dark mode on native-light pages
    'html[data-theme="dark"] ::-webkit-scrollbar-track{background:#1e293b}',
    'html[data-theme="dark"] ::-webkit-scrollbar-thumb{background:#475569}',
  ].join('\n');

  // ─── Template detection by filename/path ───
  function detectTemplate() {
    var path = location.pathname;
    var filename = path.split('/').pop() || '';

    // 涌现 series
    if (path.indexOf('/涌现/') !== -1 || path.indexOf('/%E6%B6%8C%E7%8E%B0/') !== -1) {
      if (filename === '目录.html' || filename === '%E7%9B%AE%E5%BD%95.html') return 'yongxian-toc';
      return 'yongxian';
    }

    // 数据珠玑 series
    if (path.indexOf('/数据珠玑/') !== -1 || path.indexOf('/%E6%95%B0%E6%8D%AE%E7%8F%A0%E7%8E%91/') !== -1) {
      if (filename === '目录.html' || filename === '%E7%9B%AE%E5%BD%95.html') return 'sjzj-toc';
      return 'sjzj';
    }

    // llm_book
    if (path.indexOf('/llm_book/') !== -1) {
      if (filename === 'advanced.html') return 'llmbook-adv';
      return 'llmbook';
    }

    // Specific reports (light-native)
    if (filename === 'agentic_coding_research_report.html') return 'light-report';
    if (filename === 'Terminal_Agent_技术报告.html' || filename === 'Terminal_Agent_%E6%8A%80%E6%9C%AF%E6%8A%A5%E5%91%8A.html') return 'light-report';
    if (filename === 'long_context_data_research_report.html') return 'light-report';
    if (filename === 'midtrain_research_report.html') return 'light-report';
    if (filename === 'terminal_bench_training_data.html') return 'tb-train';
    if (filename === '预训练数据研发_研究报告.html' || filename === '%E9%A2%84%E8%AE%AD%E7%BB%83%E6%95%B0%E6%8D%AE%E7%A0%94%E5%8F%91_%E7%A0%94%E7%A9%B6%E6%8A%A5%E5%91%8A.html') return 'pretrain-report';
    if (filename === 'llm_rubric_report.html') return 'llm-rubric';

    // GitHub-dark style reports
    if (filename === 'agent_midtraining_survey.html') return 'gh-dark';
    if (filename === 'factual_knowledge_synthesis_slides.html') return 'gh-dark';
    if (filename === 'pretraining_rewriting_survey.html') return 'gh-dark';
    if (filename === 'knowledge_rewriting_survey.html') return 'gh-dark';
    if (filename === 'agent_data_optimization_survey.html') return 'agent-opt';
    if (filename === 'document_parsing_survey.html') return 'doc-parse';
    if (filename === 'simpleqa_failure_analysis.html') return 'bem';
    if (filename === 'pretrain_data_survey.html') return 'bem';

    // Numbered accent system
    if (filename === 'llm_benchmark_survey.html') return 'numbered';
    if (filename === 'llm_data_synthesis_survey.html') return 'numbered';

    // SAE
    if (filename === 'sae_data_selection_report.html') return 'sae';

    // llm_development_history
    if (filename === 'llm_development_history.html') return 'llm-history';

    // Fallback — use generic dark or light based on native theme
    return nativeTheme === 'dark' ? 'gh-dark' : 'light-report';
  }

  var tpl = detectTemplate();
  html.setAttribute('data-tpl', tpl);

  // ─── Inject the appropriate CSS ───
  var overrideStyle = document.createElement('style');
  overrideStyle.id = 'theme-switcher-override';
  if (nativeTheme === 'dark') {
    overrideStyle.textContent = DARK_TO_LIGHT_CSS;
  } else {
    overrideStyle.textContent = LIGHT_TO_DARK_CSS;
  }
  document.head.appendChild(overrideStyle);

  // ─── Apply theme ───
  function applyTheme(theme) {
    if (theme !== nativeTheme) {
      html.setAttribute('data-theme', theme);
    } else {
      html.removeAttribute('data-theme');
    }
    updateButtonUI(theme);
  }

  function updateButtonUI(theme) {
    btn.textContent = theme === 'light' ? '🌙' : '☀️';
  }

  // Initialize
  applyTheme(stored);
  document.body.appendChild(btnWrap);

  // Toggle on click
  btn.addEventListener('click', function () {
    var current = localStorage.getItem('theme') || 'dark';
    var next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });
})();
