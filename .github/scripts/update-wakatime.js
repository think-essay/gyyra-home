const fs = require('fs');
const https = require('https');
const path = require('path');

const token = String(process.env.WAKATIME_TOKEN || '').trim();
const githubToken = String(process.env.GH_TOKEN || '').trim();
const modelName = process.env.MODEL_NAME || 'openai/gpt-4.1';
const manualHours = process.env.MANUAL_HOURS;
const manualTheme = process.env.MANUAL_THEME;
const timeZone = process.env.TZ || 'Asia/Shanghai';
const debug = process.env.MODEL_DEBUG === '1';

const themes = [
  [1, 'rest', '休息日'], [3, 'relaxed', '轻松日'], [5, 'productive', '充实日'],
  [7, 'focused', '专注日'], [9, 'intense', '极限日'], [Infinity, 'legendary', '超神日']
];

function requestJson(url, options, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, options, (response) => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { raw += chunk; });
      response.on('end', () => {
        if (response.statusCode >= 400) return reject(new Error(`HTTP ${response.statusCode}: ${raw.slice(0, 300)}`));
        try { resolve(JSON.parse(raw)); } catch (error) { reject(error); }
      });
    });
    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function dateBefore(days) { const date = new Date(); date.setDate(date.getDate() - days); return formatDate(date); }

async function getWakaTimeData() {
  if (process.env.WAKATIME_RAW_JSON) return JSON.parse(process.env.WAKATIME_RAW_JSON);
  if (!token) throw new Error('WAKATIME_TOKEN is required.');
  const authorization = /^waka_/i.test(token) ? `Basic ${Buffer.from(`${token}:`).toString('base64')}` : (/^bearer\s/i.test(token) ? token : `Bearer ${token}`);
  return requestJson(`https://wakatime.com/api/v1/users/current/summaries?start=${dateBefore(6)}&end=${dateBefore(0)}`, { method: 'GET', headers: { Authorization: authorization } });
}

function parseDays(raw) {
  if (!raw || !Array.isArray(raw.data)) throw new Error('Invalid WakaTime summaries response.');
  return raw.data.map((day) => ({
    date: day.range && day.range.date || '',
    hours: Number((((day.grand_total && day.grand_total.total_seconds) || 0) / 3600).toFixed(2)),
    text: day.grand_total && day.grand_total.text || '0 secs'
  }));
}

function statsFor(days) {
  const total = days.reduce((sum, day) => sum + day.hours, 0);
  const peak = days.reduce((best, day) => day.hours > best.hours ? day : best, { date: '', hours: 0, text: '0 secs' });
  const pivot = Math.ceil(days.length / 2);
  const first = days.slice(0, pivot).reduce((sum, day) => sum + day.hours, 0);
  const second = days.slice(pivot).reduce((sum, day) => sum + day.hours, 0);
  return { total, average: days.length ? total / days.length : 0, peak, trend: second >= first ? 'rising' : 'falling' };
}

function selectTheme(hours) {
  if (manualTheme && themes.some((theme) => theme[1] === manualTheme)) return themes.find((theme) => theme[1] === manualTheme);
  return themes.find((theme) => hours < theme[0]) || themes[themes.length - 1];
}

function fallbackAi(average) {
  if (average < 1.5) return { title: '休养生息', quote: '代码写得少，Bug 自然少。', tarot: '🛌 The Hermit', theme_color: '#a0c4ff' };
  if (average < 4.5) return { title: '渐入佳境', quote: '保持节奏，每一行代码都在积累。', tarot: '🌱 The Empress', theme_color: '#80ed99' };
  if (average < 8) return { title: '火力全开', quote: '键盘在喊累，但 Commit 还在飞。', tarot: '⚡ The Magician', theme_color: '#f5af19' };
  return { title: '赛博飞升', quote: '你不是在写代码，而是在编织未来。', tarot: '💥 The World', theme_color: '#00c6ff' };
}

function normaliseAi(value, fallback) {
  const text = (input, length) => Array.from(String(input || '')).filter((char) => char !== '\ufffd').slice(0, length).join('');
  return {
    title: text(value && value.title, 12) || fallback.title,
    quote: text(value && value.quote, 60) || fallback.quote,
    tarot: text(value && value.tarot, 60) || fallback.tarot,
    theme_color: /^#[0-9a-f]{6}$/i.test(value && value.theme_color || '') ? value.theme_color : fallback.theme_color
  };
}

async function generateAi(stats) {
  const fallback = fallbackAi(stats.average);
  if (!githubToken) return fallback;
  const prompt = `根据本周编码数据生成严格 JSON：title（4-6字）、quote（30字以内中文点评）、tarot（含 emoji）、theme_color（#RRGGBB）。数据：总计 ${stats.total.toFixed(1)} 小时，日均 ${stats.average.toFixed(1)} 小时，趋势 ${stats.trend}，峰值 ${stats.peak.date} ${stats.peak.hours} 小时。`;
  try {
    const result = await requestJson('https://models.github.ai/inference/chat/completions', {
      method: 'POST', headers: { Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', Authorization: `Bearer ${githubToken}` }
    }, JSON.stringify({ model: modelName, temperature: 0.8, max_tokens: 180, messages: [{ role: 'system', content: 'Return JSON only.' }, { role: 'user', content: prompt }] }));
    const content = result && result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content;
    return normaliseAi(JSON.parse(String(content || '').replace(/```json|```/gi, '').trim()), fallback);
  } catch (error) {
    if (debug) console.warn('GitHub Models unavailable:', error.message);
    return fallback;
  }
}

function writeJs(file, name, value) { fs.writeFileSync(file, `window.${name} = ${JSON.stringify(value, null, 2)};\n`); }

async function main() {
  const days = parseDays(await getWakaTimeData());
  const stats = statsFor(days);
  const yesterday = dateBefore(1);
  const recorded = days.find((day) => day.date === yesterday);
  const hours = manualHours === undefined || manualHours === '' ? (recorded ? recorded.hours : 0) : (Number(manualHours) || 0);
  const theme = selectTheme(hours);
  const ai = await generateAi(stats);
  const output = path.resolve(__dirname, '../../assets/json');
  fs.mkdirSync(output, { recursive: true });
  writeJs(path.join(output, 'config.js'), 'WAKATIME_CONFIG', { date: yesterday, hours, theme_name: theme[1], theme_display: theme[2], updated_at: new Date().toISOString() });
  writeJs(path.join(output, 'weekly.js'), 'WAKATIME_WEEKLY', { updated_at: new Date().toISOString(), stats: { total_hours: Number(stats.total.toFixed(2)), daily_avg: Number(stats.average.toFixed(2)), trend: stats.trend, max_day: stats.peak }, days, ai });
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `theme_name=${theme[1]}\n`);
  console.log('Generated WakaTime theme and weekly report.');
}

main().catch((error) => { console.error(error.message); process.exit(1); });
