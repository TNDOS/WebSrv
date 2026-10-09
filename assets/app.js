/* ============================================================================
 * TNDDOS 官网脚本
 *
 * 两件事：
 *   1. 语言切换（中 / EN）—— 正文在 HTML 里两种都写好了，这里只切 data-lang
 *   2. 下载页从 data/versions.json 渲染组件列表
 *
 * 仍然**不依赖 GitHub API** —— 页面只读仓库里的 versions.json。
 * ==========================================================================*/

(function () {
  'use strict';

  /* ---------------------------------------------------------- 语言切换 */

  var KEY = 'tnd-lang';
  var root = document.documentElement;
  var btn = document.getElementById('lang');

  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l === 'zh' ? 'zh-Hans' : 'en');
    if (btn) btn.textContent = (l === 'zh' ? 'EN' : '中文');
    try { localStorage.setItem(KEY, l); } catch (e) { /* 隐私模式下算了 */ }
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var guess = (navigator.language || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
  setLang(saved || guess);

  if (btn) btn.addEventListener('click', function () {
    setLang(root.getAttribute('data-lang') === 'zh' ? 'en' : 'zh');
  });

  /* ------------------------------------------------------ 下载页渲染 */

  var box = document.getElementById('components');
  if (!box) return;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined && txt !== null) e.textContent = txt;
    return e;
  }

  /* 两种语言各写一个，交给 CSS 按 data-lang 只显示一个 */
  function bi(tag, cls, zh, en) {
    var e = el(tag, cls);
    e.appendChild(el('span', null, zh || en || '')).setAttribute('lang', 'zh');
    e.appendChild(el('span', null, en || zh || '')).setAttribute('lang', 'en');
    return e;
  }

  function repoUrl(repo) { return 'https://github.com/TNDOS/' + repo; }

  function render(data) {
    (data.components || []).forEach(function (c) {
      var box2 = el('div', 'comp');

      var head = el('div', 'comp-head');
      var t = el('div', 'comp-title');
      t.appendChild(el('span', null, c.zh || c.id)).setAttribute('lang', 'zh');
      t.appendChild(el('span', null, c.en || c.id)).setAttribute('lang', 'en');
      head.appendChild(t);
      head.appendChild(el('div', 'comp-sub', c.repo));
      box2.appendChild(head);

      var d = el('div', 'comp-desc');
      d.appendChild(el('div', null, c.desc_zh || '')).setAttribute('lang', 'zh');
      d.appendChild(el('div', null, c.desc_en || '')).setAttribute('lang', 'en');
      box2.appendChild(d);

      (c.versions || []).forEach(function (v) {
        var row = el('div', 'ver');
        row.appendChild(el('span', 'ver-tag', v.tag));
        if (v.latest) row.appendChild(el('span', 'ver-latest', 'latest'));
        if (v.pre) row.appendChild(el('span', 'ver-latest', 'pre'));
        row.appendChild(el('span', 'ver-date', v.date || ''));

        var sub = el('div', 'ver-sub');
        sub.appendChild(el('span', null, v.subject_zh || '')).setAttribute('lang', 'zh');
        sub.appendChild(el('span', null, v.subject_en || '')).setAttribute('lang', 'en');
        row.appendChild(sub);

        var links = el('div', 'ver-links');
        var a1 = el('a', null, 'Releases');
        a1.href = repoUrl(c.repo) + '/releases/tag/' + encodeURIComponent(v.tag);
        links.appendChild(a1);
        var a2 = el('a', null, 'tar.gz');
        a2.href = repoUrl(c.repo) + '/archive/refs/tags/' + encodeURIComponent(v.tag) + '.tar.gz';
        links.appendChild(a2);
        var a3 = el('a', null, 'zip');
        a3.href = repoUrl(c.repo) + '/archive/refs/tags/' + encodeURIComponent(v.tag) + '.zip';
        links.appendChild(a3);
        row.appendChild(links);

        box2.appendChild(row);
      });

      box.appendChild(box2);
    });

    var g = el('p', 'note');
    g.appendChild(el('span', null, '生成于 ' + (data.generated || '?') + '。数据源是仓库里的 data/versions.json，不依赖 GitHub API。')).setAttribute('lang', 'zh');
    g.appendChild(el('span', null, 'Generated ' + (data.generated || '?') + '. The source is data/versions.json in the repository; no GitHub API involved.')).setAttribute('lang', 'en');
    box.appendChild(g);
  }

  function fail(msg) {
    var p = el('p', 'note');
    p.appendChild(el('span', null, '读不到版本清单：' + msg)).setAttribute('lang', 'zh');
    p.appendChild(el('span', null, 'Could not load the version list: ' + msg)).setAttribute('lang', 'en');
    box.appendChild(p);
  }

  var req;
  try { req = new XMLHttpRequest(); } catch (e) { fail('浏览器不支持 XMLHttpRequest'); return; }
  req.open('GET', 'data/versions.json', true);
  req.onreadystatechange = function () {
    if (req.readyState !== 4) return;
    if (req.status !== 200 && req.status !== 0) { fail('HTTP ' + req.status); return; }
    var data;
    try { data = JSON.parse(req.responseText); } catch (e) { fail('JSON 不合法：' + e.message); return; }
    render(data);
  };
  req.send();
})();
