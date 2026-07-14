(function () {
  'use strict';

  var THEMES = {
    rest: { label: '休息日', emoji: '🛌', color: '#a0c4ff', glow: '12px', speed: '4s' },
    relaxed: { label: '轻松日', emoji: '🌱', color: '#80ed99', glow: '18px', speed: '3s' },
    productive: { label: '充实日', emoji: '⚡', color: '#f5af19', glow: '24px', speed: '2s' },
    focused: { label: '专注日', emoji: '🔥', color: '#ff4b2b', glow: '30px', speed: '1s' },
    intense: { label: '极限日', emoji: '🌟', color: '#8e2de2', glow: '38px', speed: '.8s' },
    legendary: { label: '超神日', emoji: '💥', color: '#00c6ff', glow: '50px', speed: '.5s' }
  };

  function loadScript(url, callback) {
    var script = document.createElement('script');
    script.src = url + (url.indexOf('?') === -1 ? '?t=' + Date.now() : '');
    script.onload = function () { callback(null); };
    script.onerror = function () { callback(new Error('Unable to load ' + url)); };
    document.body.appendChild(script);
  }

  function setText(element, text) { element.textContent = String(text || ''); }

  function renderModal(data, theme) {
    var old = document.querySelector('.weekly-modal');
    if (old) old.remove();
    var modal = document.createElement('div');
    modal.className = 'weekly-modal';
    var card = document.createElement('section');
    card.className = 'weekly-card';
    card.style.setProperty('--wakatime-theme-color', theme.color);
    var header = document.createElement('header');
    header.className = 'weekly-card__header';
    var title = document.createElement('strong');
    setText(title, (data.ai && data.ai.tarot) || 'SYSTEM MONITOR');
    var close = document.createElement('button');
    close.className = 'weekly-card__close';
    close.type = 'button';
    close.setAttribute('aria-label', '关闭周报');
    setText(close, '×');
    header.append(title, close);
    var body = document.createElement('div');
    body.className = 'weekly-card__body';
    var quote = document.createElement('p');
    quote.className = 'weekly-card__quote';
    setText(quote, (data.ai && data.ai.quote) || '本周报告暂不可用。');
    var stats = data.stats || {};
    var grid = document.createElement('div');
    grid.className = 'weekly-stats';
    [['TOTAL', Number(stats.total_hours || 0).toFixed(1) + 'h'], ['AVG', Number(stats.daily_avg || 0).toFixed(1) + 'h'], ['PEAK', Number(stats.max_day && stats.max_day.hours || 0).toFixed(1) + 'h']].forEach(function (item) {
      var block = document.createElement('div'); block.className = 'weekly-stat';
      var value = document.createElement('strong'); setText(value, item[1]);
      var key = document.createElement('span'); setText(key, item[0]);
      block.append(value, key); grid.appendChild(block);
    });
    var days = Array.isArray(data.days) ? data.days : [];
    var maximum = Math.max.apply(Math, days.map(function (day) { return Number(day.hours) || 0; }).concat([1]));
    var bars = document.createElement('div'); bars.className = 'weekly-days';
    days.forEach(function (day) { var bar = document.createElement('i'); bar.title = day.date + ': ' + day.hours + 'h'; bar.style.height = Math.max(3, ((Number(day.hours) || 0) / maximum) * 70) + 'px'; bars.appendChild(bar); });
    body.append(quote, grid, bars); card.append(header, body); modal.appendChild(card);
    function dismiss() { modal.remove(); }
    close.addEventListener('click', dismiss);
    modal.addEventListener('click', function (event) { if (event.target === modal) dismiss(); });
    document.body.appendChild(modal);
  }

  function showWeekly(config, theme) {
    var url = 'assets/json/weekly.js';
    if (config.updated_at || config.date) url += '?v=' + encodeURIComponent(config.updated_at || config.date);
    loadScript(url, function (error) {
      if (error || !window.WAKATIME_WEEKLY) {
        renderModal({ ai: { quote: '周报数据尚未生成，请稍后再试。' }, stats: {}, days: [] }, theme);
        return;
      }
      renderModal(window.WAKATIME_WEEKLY, theme);
    });
  }

  function applyTheme(config) {
    config = config || {};
    var theme = THEMES[config.theme_name] || THEMES.rest;
    document.documentElement.style.setProperty('--wakatime-theme-color', theme.color);
    document.documentElement.style.setProperty('--glow-size', theme.glow);
    document.documentElement.style.setProperty('--pulse-speed', theme.speed);
    var avatar = document.querySelector('.js-avatar');
    if (avatar) avatar.classList.add('glowing');
    var status = document.getElementById('wakatime-status');
    if (!status) { status = document.createElement('button'); status.id = 'wakatime-status'; status.type = 'button'; status.className = 'wakatime-status'; document.body.appendChild(status); }
    setText(status, theme.emoji + ' ' + (config.theme_display || theme.label) + ' · ' + Number(config.hours || 0).toFixed(2) + 'h');
    status.title = '点击查看本周编码报告';
    status.onclick = function () { showWeekly(config, theme); };
  }

  function boot() {
    var params = new URLSearchParams(window.location.search);
    if (params.has('theme') || params.has('hours')) {
      applyTheme({ theme_name: params.get('theme'), hours: params.get('hours') || 0 });
      return;
    }
    loadScript('assets/json/config.js', function () { applyTheme(window.WAKATIME_CONFIG); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
