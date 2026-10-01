/* ============================================================================
 * TNDDOS 下载页
 *
 * 唯一的数据来源是 data/versions.json —— **不依赖 GitHub API**。
 * 原因：匿名调 api.github.com 是每小时 60 次、按 IP 计，共享出口很容易吃 403，
 * 而一个会因为限流白屏的下载页是没有意义的。
 *
 * 下载链接走的是 github.com 的归档地址，那是不受限流影响的，也是确定性的。
 * ==========================================================================*/
(function () {
  'use strict';

  var OWNER = 'TNDOS';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text !== undefined && text !== null) { e.textContent = text; }
    return e;
  }

  function link(href, cls, text) {
    var a = document.createElement('a');
    a.href = href;
    if (cls) { a.className = cls; }
    a.textContent = text;
    a.rel = 'noopener';
    return a;
  }

  function archive(repo, kind, ref, ext) {
    return 'https://github.com/' + OWNER + '/' + repo +
           '/archive/refs/' + kind + '/' + ref + '.' + ext;
  }

  function releasePage(repo, tag) {
    return 'https://github.com/' + OWNER + '/' + repo + '/releases/tag/' + encodeURIComponent(tag);
  }

  function assetUrl(repo, tag, name) {
    return 'https://github.com/' + OWNER + '/' + repo +
           '/releases/download/' + encodeURIComponent(tag) + '/' + name;
  }

  function humanSize(n) {
    if (!n && n !== 0) { return ''; }
    var u = ['B', 'KB', 'MB', 'GB'];
    var i = 0;
    while (n >= 1024 && i < u.length - 1) { n = n / 1024; i++; }
    return (i === 0 ? n : n.toFixed(1)) + ' ' + u[i];
  }

  function renderVersion(comp, v) {
    var row = el('div', 'ver');

    var tagCls = 'tag';
    if (v.latest) { tagCls += ' latest'; }
    if (v.pre) { tagCls += ' pre'; }
    var tag = el('span', tagCls, v.tag);
    tag.title = v.latest ? '最新版本 / latest' : (v.pre ? '早期快照 / early snapshot' : '');
    row.appendChild(tag);

    row.appendChild(el('span', 'ver-date', v.date || ''));

    var subj = el('div', 'ver-subj');
    subj.appendChild(document.createTextNode(v.subject_zh || ''));
    if (v.subject_en) {
      var en = el('span', 'en', v.subject_en);
      subj.appendChild(en);
    }
    row.appendChild(subj);

    if (v.sha) { row.appendChild(el('span', 'ver-sha', v.sha)); }

    var dl = el('div', 'dl');

    // Releases 页面放第一个，而且是主按钮。
    // 成品二进制是人工传到那里的，所以"下载"这件事的入口就是它 ——
    // 页面不假装自己能猜出附件名。
    dl.appendChild(link(releasePage(comp.repo, v.tag), 'primary', '下载 / Releases'));

    // 源码归档：永远存在，GitHub 按 tag 自动生成，不受 API 限流影响
    dl.appendChild(link(archive(comp.repo, 'tags', v.tag, 'zip'), '', '源码 .zip'));
    dl.appendChild(link(archive(comp.repo, 'tags', v.tag, 'tar.gz'), '', '源码 .tar.gz'));

    // Release 附件（内核 / 构建产物）—— 只在清单里写了才渲染，
    // 免得出现指向不存在的附件的悬空链接。
    if (v.assets && v.assets.length) {
      for (var i = 0; i < v.assets.length; i++) {
        var a = v.assets[i];
        var label = a.label || a.name;
        if (a.size) { label += ' (' + humanSize(a.size) + ')'; }
        var al = link(assetUrl(comp.repo, v.tag, a.name), 'asset', label);
        al.title = a.name;
        dl.appendChild(al);
      }
    }

    row.appendChild(dl);

    return row;
  }

  function renderComponent(comp) {
    var box = el('div', 'comp');

    var head = el('div', 'comp-head');
    head.appendChild(el('div', 'comp-title', comp.zh));
    head.appendChild(el('div', 'comp-sub', comp.en));
    box.appendChild(head);

    var desc = el('div', 'comp-desc');
    desc.appendChild(document.createTextNode(comp.desc_zh));
    if (comp.desc_en) { desc.appendChild(el('span', 'en', comp.desc_en)); }
    box.appendChild(desc);

    var repoLine = el('div', 'comp-repo');
    repoLine.appendChild(link('https://github.com/' + OWNER + '/' + comp.repo, '', OWNER + '/' + comp.repo));
    box.appendChild(repoLine);

    var vers = comp.versions || [];
    for (var i = 0; i < vers.length; i++) {
      box.appendChild(renderVersion(comp, vers[i]));
    }
    if (!vers.length) {
      box.appendChild(el('div', 'ver', '（还没有发布版本 / no releases yet）'));
    }

    // dev 分支：永远可下，但不是版本
    var dev = el('div', 'ver');
    dev.appendChild(el('span', 'tag pre', 'main'));
    dev.appendChild(el('span', 'ver-date', 'dev'));
    dev.appendChild(el('div', 'ver-subj', '开发分支最新代码 / tip of the development branch'));
    var ddl = el('div', 'dl');
    ddl.appendChild(link(archive(comp.repo, 'heads', 'main', 'zip'), '', '源码 .zip'));
    ddl.appendChild(link(archive(comp.repo, 'heads', 'main', 'tar.gz'), '', '源码 .tar.gz'));
    dev.appendChild(ddl);
    box.appendChild(dev);

    return box;
  }

  function fail(msg) {
    var c = document.getElementById('components');
    if (!c) { return; }
    c.innerHTML = '';
    var p = el('p', 'error', msg);
    c.appendChild(p);
    var p2 = el('p', 'note');
    p2.appendChild(document.createTextNode('你仍然可以直接从 GitHub 的标签页下载：'));
    p2.appendChild(document.createTextNode(' '));
    p2.appendChild(link('https://github.com/' + OWNER + '?tab=repositories', '', 'github.com/' + OWNER));
    c.appendChild(p2);
  }

  function boot() {
    var box = document.getElementById('components');
    if (!box) { return; }

    var req;
    try { req = new XMLHttpRequest(); } catch (e) { fail('浏览器不支持 XMLHttpRequest。'); return; }

    req.open('GET', 'data/versions.json', true);
    req.onreadystatechange = function () {
      if (req.readyState !== 4) { return; }
      if (req.status < 200 || req.status >= 300) {
        fail('读不到 data/versions.json（HTTP ' + req.status + '）。');
        return;
      }
      var data;
      try { data = JSON.parse(req.responseText); }
      catch (e) { fail('data/versions.json 不是合法的 JSON：' + e.message); return; }

      box.innerHTML = '';
      var comps = data.components || [];
      for (var i = 0; i < comps.length; i++) {
        box.appendChild(renderComponent(comps[i]));
      }

      var g = document.getElementById('generated');
      if (g && data.generated) {
        g.textContent = '版本清单生成于 ' + data.generated +
                        ' —— 数据源是仓库里的 data/versions.json，不依赖 GitHub API。';
      }
    };
    req.send(null);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
