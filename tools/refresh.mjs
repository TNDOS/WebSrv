#!/usr/bin/env node
/* ============================================================================
 * 从 GitHub API 刷新 data/versions.json 的版本列表。
 *
 * 这个脚本是**可选的**。页面本身不依赖 API —— 它只读 versions.json。
 * 手动加版本也完全可以（见 README）。这个脚本只是让"别忘了更新"这件事自动化。
 *
 * 设计上有个要紧的地方：**API 失败不能破坏文件**。
 * 拿不到数据时就原样保留旧的 versions 数组，只记一条警告。
 * 让一次限流把已经正确的清单写坏，比不刷新糟得多。
 *
 *   node tools/refresh.mjs
 *   GH_TOKEN=xxx node tools/refresh.mjs     （有 token 时限额高得多）
 * ==========================================================================*/
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../data/versions.json', import.meta.url);
const API = 'https://api.github.com';

function headers() {
  const h = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'tndos-site-refresh' };
  if (process.env.GH_TOKEN) h['Authorization'] = 'Bearer ' + process.env.GH_TOKEN;
  return h;
}

async function listReleases(repo) {
  const url = API + '/repos/' + repo + '/releases?per_page=100';
  const r = await fetch(url, { headers: headers() });
  if (!r.ok) throw new Error(repo + ': HTTP ' + r.status + ' ' + r.statusText);
  return r.json();
}

function toVersion(rel, latestTag) {
  const v = {
    tag: rel.tag_name,
    date: (rel.published_at || '').slice(0, 10)
  };
  if (rel.target_commitish) v.branch = rel.target_commitish;
  const lines = (rel.body || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (lines.length) {
    v.subject_zh = lines[0];
    if (lines[1] && /^[\x20-\x7E]+$/.test(lines[1])) v.subject_en = lines[1];
  }
  if (rel.assets && rel.assets.length) {
    v.assets = rel.assets.map(a => ({ name: a.name, size: a.size }));
  }
  if (rel.tag_name === latestTag) v.latest = true;
  return v;
}

async function main() {
  const data = JSON.parse(await readFile(FILE, 'utf8'));
  let changed = false;

  for (const comp of data.components) {
    try {
      const rels = await listReleases(comp.repo);
      if (!rels.length) {
        console.warn('  ' + comp.repo + ': 没有 release（页面仍可用源码归档）');
        continue;
      }
      const latestTag = rels[rels.length - 1].tag_name;
      const old = JSON.stringify(comp.versions || []);
      // 保留手写的说明；API 提供 tag / 日期 / sha / 附件
      const byTag = new Map((comp.versions || []).map(v => [v.tag, v]));
      comp.versions = rels.map(rel => {
        const nv = toVersion(rel, latestTag);
        const prev = byTag.get(nv.tag);
        if (prev) {
          if (prev.subject_zh) nv.subject_zh = prev.subject_zh;
          if (prev.subject_en) nv.subject_en = prev.subject_en;
          if (prev.pre) nv.pre = true;
          delete nv.latest;
          if (nv.tag === latestTag) nv.latest = true;
        }
        return nv;
      });
      if (JSON.stringify(comp.versions) !== old) changed = true;
      console.log('  ' + comp.repo + ': ' + comp.versions.length + ' release(s)');
    } catch (e) {
      console.warn('  ' + comp.repo + ': 刷新失败，保留原清单 -- ' + e.message);
    }
  }

  if (!changed) {
    console.log('清单没有变化。');
    return;
  }
  data.generated = new Date().toISOString().slice(0, 10);
  await writeFile(FILE, JSON.stringify(data, null, 2) + '\n');
  console.log('已更新 data/versions.json');
}

main().catch(e => { console.error('刷新失败：' + e.message); process.exit(1); });
