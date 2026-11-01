/* Ürün Tanık Denetim — 2014/33/AB modül bazlı akreditasyon denetim çeklistleri (PWA) */
"use strict";
const D = window.CEKLIST;
const CODES = ["U", "K", "UY", "UD", "İ"];
const CODE_TXT = { U: "Uygun", K: "Kısmen uygun / gözlem", UY: "Uygunsuzluk", UD: "Uygulanabilir değil", "İ": "İncelenmedi" };
const MOD = Object.fromEntries(D.modules.map(m => [m.id, m]));
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------- IndexedDB ---------- */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open("urun-tanik-denetim", 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        db.createObjectStore("audits", { keyPath: "id" });
        const p = db.createObjectStore("photos", { keyPath: "id" });
        p.createIndex("audit", "auditId");
      };
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  tx(store, mode, fn) {
    return new Promise((res, rej) => {
      const t = this.db.transaction(store, mode); const s = t.objectStore(store);
      const out = fn(s); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error);
    });
  },
  all(store) { return this.tx(store, "readonly", s => s.getAll()); },
  get(store, k) { return this.tx(store, "readonly", s => s.get(k)); },
  put(store, v) { return this.tx(store, "readwrite", s => s.put(v)); },
  del(store, k) { return this.tx(store, "readwrite", s => s.delete(k)); },
  photosOf(auditId) { return this.tx("photos", "readonly", s => s.index("audit").getAll(auditId)); },
};

/* ---------- state ---------- */
let A = null;          // aktif denetim
let tab = "info";
let filt = "all", q = "";
let saveTimer = null;
const photoCache = new Map();

function toast(msg, ms = 2200) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => t.hidden = true, ms); }
function setBar(title, sub, back) { $("#barTitle").textContent = title; $("#barSub").textContent = sub || ""; $("#btnBack").hidden = !back; $("#btnMenu").hidden = !A; }
function markDirty() { $("#saveState").textContent = "kaydediliyor…"; clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 500); }
async function saveNow() { if (!A) return; A.updated = new Date().toISOString(); await DB.put("audits", A); $("#saveState").textContent = "✓ kaydedildi"; }

function sheetsOf(a) { return [{ id: "O", ad: "Ortak Şartlar", items: D.ortak }, ...a.modules.map(id => ({ id, ad: MOD[id].ad, items: MOD[id].items, mod: MOD[id] }))]; }
function key(sheet, no) { return sheet + "|" + no; }
function stats(a, sheet) {
  const s = { n: sheet.items.length, U: 0, K: 0, UY: 0, UD: 0, "İ": 0 };
  sheet.items.forEach(it => { const v = a.answers[key(sheet.id, it.no)]?.v; if (v) s[v]++; });
  s.done = CODES.reduce((t, c) => t + s[c], 0); s.pct = s.n ? Math.round(100 * s.done / s.n) : 0; return s;
}
function totalStats(a) {
  const t = { n: 0, done: 0, U: 0, K: 0, UY: 0, UD: 0, "İ": 0 };
  sheetsOf(a).forEach(sh => { const s = stats(a, sh); ["n", "done", ...CODES].forEach(k => t[k] += s[k]); });
  t.pct = t.n ? Math.round(100 * t.done / t.n) : 0; return t;
}

/* ---------- Ana ekran ---------- */
async function home() {
  A = null; tab = "info"; $("#saveState").textContent = "";
  setBar("Ürün Tanık Denetim", "2014/33/AB · " + D.modules.length + " modül · v" + D.surum, false);
  const list = (await DB.all("audits")).sort((x, y) => (y.updated || "").localeCompare(x.updated || ""));
  const v = $("#view");
  v.innerHTML = `
    <div class="row"><h2 class="grow">Denetimler</h2>
      <button class="btn sec sm" id="imp">JSON içe aktar</button></div>
    ${list.length ? "" : `<div class="empty">Henüz denetim yok. Sağ alttaki <b>+ Yeni denetim</b> ile başlayın.</div>`}
    <div id="alist"></div>
    <h2>Modüller</h2>
    <div class="card muted">Güvenlik aksamları (Md. 15): ${D.modules.filter(m => m.grup === "aksam").map(m => `<b>${m.code}</b> ${esc(m.ad)}`).join(" · ")}<br>
    Asansörler (Md. 16): ${D.modules.filter(m => m.grup === "asansor").map(m => `<b>${m.code}</b> ${esc(m.ad)}`).join(" · ")}<br>
    Her denetimde ayrıca ${D.ortak.length} maddelik Ortak Şartlar (Md. 24, 26, 30, 32–34, 36) yer alır.</div>
    <div class="installhint" id="ih"><b>Kurulum:</b> Windows (Edge/Chrome): adres çubuğundaki <i>Uygulamayı yükle</i> simgesi ·
      iPhone/iPad (Safari): Paylaş → <i>Ana Ekrana Ekle</i> · Android (Chrome): ⋮ → <i>Uygulamayı yükle</i>.
      Kurulduktan sonra internet olmadan çalışır; veriler yalnız bu cihazda saklanır — cihazlar arası aktarım için JSON yedeğini kullanın.</div>
    <button class="btn fab" id="new">+ Yeni denetim</button>`;
  const al = $("#alist");
  list.forEach(a => {
    const t = totalStats(a);
    const d = document.createElement("div"); d.className = "card audit";
    d.innerHTML = `<div class="row"><div class="grow"><b>${esc(a.info.kurulus || "(kuruluş adı yok)")}</b>
      <div class="muted">${esc(a.info.tarih || "")} · ${esc(a.info.tur || "")} · ${a.modules.map(id => MOD[id].code).join(", ")}</div></div>
      <div class="muted" style="text-align:right">${t.done}/${t.n}<br>${t.UY ? `<span class="badge b-UY">${t.UY} UY</span> ` : ""}${t.K ? `<span class="badge b-K">${t.K} K</span>` : ""}</div></div>
      <div class="bar"><i style="width:${t.pct}%"></i></div>`;
    d.onclick = () => openAudit(a.id); al.appendChild(d);
  });
  $("#new").onclick = () => editInfo(null);
  $("#imp").onclick = () => $("#fileImport").click();
}

/* ---------- Denetim bilgileri ---------- */
const INFO = [
  ["kurulus", "Denetlenen kuruluş"], ["nando", "Onaylanmış kuruluş kimlik no (NANDO)"], ["akrNo", "Akreditasyon / başvuru no"],
  ["tur", "Denetim türü", ["İlk akreditasyon", "Yeniden akreditasyon", "Gözetim", "Kapsam genişletme", "Tanık denetimi", "Diğer"]],
  ["tarih", "Denetim tarihi", "date"], ["yer", "Denetim yeri(leri)"], ["basDenetci", "Baş denetçi"], ["uzman", "Teknik uzman(lar)"],
  ["dosyaNo", "İncelenen dosya / belge no(ları)"], ["not", "Genel not", "area"],
];
function infoFields(info) {
  return `<div class="grid2">${INFO.map(([k, l, t]) => {
    const v = esc(info[k] || "");
    if (Array.isArray(t)) return `<label class="f"><span>${l}</span><select class="t" data-k="${k}"><option value=""></option>${t.map(o => `<option ${info[k] === o ? "selected" : ""}>${o}</option>`).join("")}</select></label>`;
    if (t === "area") return `<label class="f" style="grid-column:1/-1"><span>${l}</span><textarea class="t" data-k="${k}">${v}</textarea></label>`;
    return `<label class="f"><span>${l}</span><input class="t" data-k="${k}" type="${t === "date" ? "date" : "text"}" value="${v}"></label>`;
  }).join("")}</div>`;
}
function modPicker(sel) {
  const g = (grup, title) => `<h2>${title}</h2><div class="modpick">${D.modules.filter(m => m.grup === grup).map(m =>
    `<label><input type="checkbox" value="${m.id}" ${sel.includes(m.id) ? "checked" : ""}><div><b>${m.code}</b> ${esc(m.ad)}<div class="muted">${m.items.length} madde</div></div></label>`).join("")}</div>`;
  return g("aksam", "Güvenlik aksamı modülleri (Md. 15)") + g("asansor", "Asansör modülleri (Md. 16)");
}
function editInfo(a) {
  const isNew = !a;
  const info = a ? a.info : { tarih: new Date().toISOString().slice(0, 10) };
  const sel = a ? a.modules : [];
  setBar(isNew ? "Yeni denetim" : "Denetim bilgileri", "", true);
  $("#view").innerHTML = `<div class="card">${infoFields(info)}</div>${modPicker(sel)}
    <div class="row" style="margin-top:16px"><button class="btn" id="ok">${isNew ? "Denetimi başlat" : "Kaydet"}</button></div>`;
  $("#ok").onclick = async () => {
    const inf = {}; document.querySelectorAll("[data-k]").forEach(e => inf[e.dataset.k] = e.value.trim());
    const mods = [...document.querySelectorAll(".modpick input:checked")].map(e => e.value);
    if (!mods.length) return toast("En az bir modül seçin");
    if (isNew) { A = { id: uid(), created: new Date().toISOString(), info: inf, modules: mods, answers: {}, tanik: {} }; }
    else { A.info = inf; A.modules = D.modules.map(m => m.id).filter(id => mods.includes(id)); }
    await saveNow(); openAudit(A.id);
  };
}

/* ---------- Denetim görünümü ---------- */
async function openAudit(id) {
  A = await DB.get("audits", id); if (!A) return home();
  A.tanik = A.tanik || {};
  if (tab === "info") tab = A.modules[0] || "O";
  renderAudit();
}
function renderAudit() {
  setBar(A.info.kurulus || "Denetim", (A.info.tarih || "") + " · " + A.modules.map(id => MOD[id].code).join(", "), true);
  const sh = sheetsOf(A);
  const tabs = [...sh.map(s => { const st = stats(A, s); return { id: s.id, t: (s.mod ? s.mod.code + " " : "") + s.ad, sub: st.done + "/" + st.n }; }),
    { id: "tanik", t: "Tanık planı" }, { id: "ozet", t: "Özet ve bulgular" }];
  const v = $("#view");
  v.innerHTML = `<nav class="tabs">${tabs.map(x => `<button class="tab ${x.id === tab ? "on" : ""}" data-t="${x.id}">${esc(x.t)}${x.sub ? `<small>${x.sub}</small>` : ""}</button>`).join("")}</nav><div id="pane"></div>`;
  v.querySelectorAll(".tab").forEach(b => b.onclick = () => { tab = b.dataset.t; renderAudit(); window.scrollTo(0, 0); });
  const on = v.querySelector(".tab.on"); if (on) on.scrollIntoView({ inline: "center", block: "nearest" });
  if (tab === "ozet") return renderSummary();
  if (tab === "tanik") return renderTanik();
  renderSheet(sh.find(s => s.id === tab) || sh[0]);
}

function renderSheet(sheet) {
  const p = $("#pane");
  const m = sheet.mod;
  const st = stats(A, sheet);
  let html = "";
  if (m) html += `<details class="card kunye" ${st.done ? "" : "open"}><summary><b>${esc(m.baslik)}</b></summary>${m.ozet.map(([l, x]) => `<div><b>${esc(l)}</b><span>${esc(x)}</span></div>`).join("")}</details>`;
  else html += `<div class="card muted">Kuruluş düzeyinde bir kez değerlendirilir; modül sayfaları bu maddeleri tekrar etmez.</div>`;
  html += `<div class="tools">
    ${[["all", "Tümü"], ["empty", "Boş"], ["UY", "UY"], ["K", "K"], ["note", "Notlu"]].map(([k, l]) => `<button class="chip ${filt === k ? "on" : ""}" data-f="${k}">${l}</button>`).join("")}
    <input class="search" placeholder="Ara (madde, dayanak…)" value="${esc(q)}">
    <span class="muted">${st.done}/${st.n} · %${st.pct}</span></div><div id="items"></div>`;
  p.innerHTML = html;
  p.querySelectorAll(".chip").forEach(c => c.onclick = () => { filt = c.dataset.f; renderSheet(sheet); });
  const si = p.querySelector(".search"); si.oninput = () => { q = si.value; drawItems(sheet); };
  drawItems(sheet);
}
function secTitle(sheet, sec) { return sheet.mod ? (D.sec[sec] || sec) : sec; }
function drawItems(sheet) {
  const box = $("#items"); box.innerHTML = "";
  const qq = q.toLocaleLowerCase("tr");
  let last = null, shown = 0;
  sheet.items.forEach(it => {
    const k = key(sheet.id, it.no), a = A.answers[k] || {};
    if (filt === "empty" && a.v) return;
    if ((filt === "UY" || filt === "K") && a.v !== filt) return;
    if (filt === "note" && !(a.kanit || a.bulgu || (a.photos || []).length)) return;
    if (qq && !(it.no + " " + it.t + " " + it.d).toLocaleLowerCase("tr").includes(qq)) return;
    if (it.sec !== last) { const h = document.createElement("div"); h.className = "sec"; h.textContent = secTitle(sheet, it.sec); box.appendChild(h); last = it.sec; }
    box.appendChild(itemEl(sheet, it)); shown++;
  });
  if (!shown) box.innerHTML = `<div class="empty">Filtreye uyan madde yok.</div>`;
}
function itemEl(sheet, it) {
  const k = key(sheet.id, it.no);
  const a = A.answers[k] || {};
  const d = document.createElement("div"); d.className = "item"; d.dataset.v = a.v || "";
  const italic = /öneri|iyi uygulama/i.test(it.t);
  const hasNote = a.kanit || a.bulgu || (a.photos || []).length;
  d.innerHTML = `<div class="h"><span class="no">${esc(it.no)}</span><span class="tx ${italic ? "i" : ""}">${esc(it.t)}</span></div>
    <div class="meta">📘 ${esc(it.d)} · 🔎 ${esc(it.k)}</div>
    <div class="codes">${CODES.map(c => `<button class="code ${a.v === c ? "on" : ""}" data-c="${c}" title="${CODE_TXT[c]}">${c}</button>`).join("")}</div>
    <details class="more" ${a.v === "UY" || a.v === "K" ? "open" : ""}><summary>Kanıt, bulgu, fotoğraf${hasNote ? '<span class="dot"></span>' : ""}</summary>
      <label class="f"><span>Kanıt / dosya referansı</span><textarea class="t" data-n="kanit" rows="2">${esc(a.kanit || "")}</textarea></label>
      <label class="f"><span>Bulgu / not</span><textarea class="t" data-n="bulgu" rows="2">${esc(a.bulgu || "")}</textarea></label>
      <div class="row"><button class="btn sec sm" data-ph>📷 Fotoğraf ekle</button><span class="muted">${(a.photos || []).length} fotoğraf</span></div>
      <div class="photos"></div></details>`;
  const ans = () => (A.answers[k] = A.answers[k] || {});
  d.querySelectorAll(".code").forEach(b => b.onclick = () => {
    const c = b.dataset.c, cur = ans();
    cur.v = cur.v === c ? "" : c; if (!cur.v) delete cur.v;
    d.dataset.v = cur.v || ""; d.querySelectorAll(".code").forEach(x => x.classList.toggle("on", x.dataset.c === cur.v));
    if (cur.v === "UY" || cur.v === "K") d.querySelector(".more").open = true;
    cur.t = new Date().toISOString(); markDirty(); refreshTabCounts();
  });
  d.querySelectorAll("textarea[data-n]").forEach(t => t.oninput = () => { ans()[t.dataset.n] = t.value; markDirty(); });
  d.querySelector("[data-ph]").onclick = () => pickPhoto(k, d);
  d.querySelector(".more").addEventListener("toggle", e => { if (e.target.open) drawPhotos(k, d); });
  if (a.v === "UY" || a.v === "K") drawPhotos(k, d);
  return d;
}
function refreshTabCounts() {
  sheetsOf(A).forEach(s => { const b = document.querySelector(`.tab[data-t="${s.id}"] small`); if (b) { const st = stats(A, s); b.textContent = st.done + "/" + st.n; } });
  const sp = document.querySelector(".tools .muted"); const cur = sheetsOf(A).find(s => s.id === tab);
  if (sp && cur) { const st = stats(A, cur); sp.textContent = `${st.done}/${st.n} · %${st.pct}`; }
}

/* ---------- Fotoğraflar ---------- */
let photoTarget = null;
function pickPhoto(k, el) { photoTarget = { k, el }; const f = $("#filePhoto"); f.value = ""; f.click(); }
function shrink(file, max = 1600, q = 0.75) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", q)); };
    img.onerror = rej; img.src = url;
  });
}
$("#filePhoto").onchange = async e => {
  const f = e.target.files[0]; if (!f || !photoTarget) return;
  try {
    const data = await shrink(f); const id = uid();
    await DB.put("photos", { id, auditId: A.id, key: photoTarget.k, data, t: new Date().toISOString() });
    const a = (A.answers[photoTarget.k] = A.answers[photoTarget.k] || {}); (a.photos = a.photos || []).push(id);
    markDirty(); photoTarget.el.querySelector(".row .muted").textContent = a.photos.length + " fotoğraf"; drawPhotos(photoTarget.k, photoTarget.el);
  } catch (err) { toast("Fotoğraf eklenemedi"); }
};
async function drawPhotos(k, el) {
  const box = el.querySelector(".photos"); box.innerHTML = "";
  for (const id of (A.answers[k]?.photos || [])) {
    let p = photoCache.get(id); if (!p) { p = await DB.get("photos", id); if (p) photoCache.set(id, p); }
    if (!p) continue;
    const fg = document.createElement("figure"); fg.innerHTML = `<img src="${p.data}" alt=""><button title="Sil">×</button>`;
    fg.querySelector("img").onclick = () => { const lb = document.createElement("div"); lb.className = "lightbox"; lb.innerHTML = `<img src="${p.data}">`; lb.onclick = () => lb.remove(); document.body.appendChild(lb); };
    fg.querySelector("button").onclick = async () => {
      if (!confirm("Fotoğraf silinsin mi?")) return;
      await DB.del("photos", id); photoCache.delete(id); A.answers[k].photos = A.answers[k].photos.filter(x => x !== id);
      markDirty(); el.querySelector(".row .muted").textContent = A.answers[k].photos.length + " fotoğraf"; drawPhotos(k, el);
    };
    box.appendChild(fg);
  }
}

/* ---------- Tanık planı ---------- */
const DURUM = ["", "Planlandı", "Yapıldı", "Ertelendi (18 ay)", "Gruplamayla karşılandı", "Dosya incelemesi/mülakat"];
function renderTanik() {
  const p = $("#pane");
  p.innerHTML = `<div class="card muted">EA-2/17 M:2026 Annex B: sahadaki faaliyetler normalde tanıkla değerlendirilir; Modül B tasarımı için dosya incelemesi/teknik mülakat tercih edilir; benzer modüller gruplanabilir (daha karmaşık olan seçilir); ertelenen tanık en geç 18 ay.</div>` +
    A.modules.map(id => { const m = MOD[id], t = A.tanik[id] || {};
      return `<div class="card"><b>${m.code} ${esc(m.ad)}</b>
      <div class="muted">Tanık edilecek faaliyet: ${esc(m.tanik.faaliyet)}<br>Tablo 2 gruplama: ${esc(m.tanik.grup)}<br>${esc(m.tanik.not)}</div>
      <div class="grid2"><label class="f"><span>Durum</span><select class="t" data-m="${id}" data-x="durum">${DURUM.map(d => `<option ${t.durum === d ? "selected" : ""}>${d}</option>`).join("")}</select></label>
      <label class="f"><span>Tarih</span><input class="t" type="date" data-m="${id}" data-x="tarih" value="${esc(t.tarih || "")}"></label>
      <label class="f" style="grid-column:1/-1"><span>Planlanan tanık / gruplama gerekçesi</span><textarea class="t" data-m="${id}" data-x="plan">${esc(t.plan || "")}</textarea></label></div></div>`; }).join("");
  p.querySelectorAll("[data-m]").forEach(e => e.oninput = e.onchange = () => { (A.tanik[e.dataset.m] = A.tanik[e.dataset.m] || {})[e.dataset.x] = e.value; markDirty(); });
}

/* ---------- Özet ---------- */
function findings(a) {
  const out = [];
  sheetsOf(a).forEach(sh => sh.items.forEach(it => { const x = a.answers[key(sh.id, it.no)]; if (x && (x.v === "UY" || x.v === "K")) out.push({ sh, it, x }); }));
  return out.sort((p, q) => (p.x.v === "UY" ? 0 : 1) - (q.x.v === "UY" ? 0 : 1));
}
function renderSummary() {
  const p = $("#pane"); const sh = sheetsOf(A); const t = totalStats(A); const F = findings(A);
  p.innerHTML = `<div class="card"><table class="sum"><tr><th>Sayfa</th><th>Madde</th>${CODES.map(c => `<th>${c}</th>`).join("")}<th>Boş</th><th>%</th></tr>
    ${sh.map(s => { const st = stats(A, s); return `<tr><td>${s.mod ? s.mod.code + " " : ""}${esc(s.ad)}</td><td>${st.n}</td>${CODES.map(c => `<td>${st[c] || ""}</td>`).join("")}<td>${st.n - st.done}</td><td>${st.pct}</td></tr>`; }).join("")}
    <tr class="tot"><td>TOPLAM</td><td>${t.n}</td>${CODES.map(c => `<td>${t[c]}</td>`).join("")}<td>${t.n - t.done}</td><td>${t.pct}</td></tr></table></div>
    <div class="row"><button class="btn" id="xl">⬇ Excel (.xlsx)</button><button class="btn sec" id="pr">🖨 Yazdır / PDF</button><button class="btn sec" id="js">⬇ JSON yedek</button></div>
    <h2>Bulgular (${F.length})</h2>
    ${F.length ? F.map(f => `<div class="card"><span class="badge b-${f.x.v}">${f.x.v}</span> <b>${f.sh.mod ? f.sh.mod.code : "O"} · ${esc(f.it.no)}</b> — ${esc(f.it.t)}
      <div class="muted">Dayanak: ${esc(f.it.d)}</div>${f.x.bulgu ? `<div><b>Bulgu:</b> ${esc(f.x.bulgu)}</div>` : `<div class="muted">Bulgu metni girilmemiş.</div>`}
      ${f.x.kanit ? `<div class="muted">Kanıt: ${esc(f.x.kanit)}</div>` : ""}</div>`).join("") : `<div class="empty">UY veya K işaretli madde yok.</div>`}`;
  $("#xl").onclick = exportXlsx; $("#pr").onclick = printReport; $("#js").onclick = exportJson;
}

/* ---------- Dışa aktarma ---------- */
function fname(ext) { const n = (A.info.kurulus || "denetim").replace(/[^\wçğıöşüÇĞİÖŞÜ-]+/g, "_").slice(0, 40); return `Tanik_Denetim_${n}_${A.info.tarih || ""}.${ext}`; }
function download(blob, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
function exportXlsx() {
  if (!window.XLSX) return toast("Excel kütüphanesi yükleniyor, birkaç saniye sonra tekrar deneyin");
  const wb = XLSX.utils.book_new();
  const info = [["2014/33/AB MODÜL BAZLI AKREDİTASYON DENETİM ÇEKLİSTİ"], ["Uygulama sürümü", D.surum], [], ...INFO.map(([k, l]) => [l, A.info[k] || ""]),
    ["Modüller", A.modules.map(id => MOD[id].code + " " + MOD[id].ad).join("; ")], [], ["Kodlar", CODES.map(c => c + " = " + CODE_TXT[c]).join(" · ")]];
  const ws0 = XLSX.utils.aoa_to_sheet(info); ws0["!cols"] = [{ wch: 38 }, { wch: 90 }]; XLSX.utils.book_append_sheet(wb, ws0, "1. Bilgiler");
  const used = new Set();
  sheetsOf(A).forEach((s, i) => {
    const rows = [["No", "Bölüm", "Kontrol maddesi", "Dayanak", "Kanıt türü / teknik", "Değerlendirme", "Kanıt / dosya referansı", "Bulgu / Not", "Fotoğraf"]];
    s.items.forEach(it => { const x = A.answers[key(s.id, it.no)] || {}; rows.push([it.no, secTitle(s, it.sec), it.t, it.d, it.k, x.v || "", x.kanit || "", x.bulgu || "", (x.photos || []).length || ""]); });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 7 }, { wch: 26 }, { wch: 80 }, { wch: 34 }, { wch: 24 }, { wch: 12 }, { wch: 34 }, { wch: 40 }, { wch: 9 }];
    ws["!autofilter"] = { ref: "A1:I" + rows.length };
    let nm = (i + 2) + ". " + (s.mod ? s.mod.code + " " + s.mod.ad : s.ad); nm = nm.replace(/[\\/?*[\]:]/g, "").slice(0, 31);
    while (used.has(nm)) nm = nm.slice(0, 29) + "_" + i; used.add(nm);
    XLSX.utils.book_append_sheet(wb, ws, nm);
  });
  const tr = [["Modül", "Tanık edilecek faaliyet", "Tablo 2 gruplama", "Durum", "Tarih", "Plan / gerekçe"]];
  A.modules.forEach(id => { const m = MOD[id], t = A.tanik[id] || {}; tr.push([m.code + " " + m.ad, m.tanik.faaliyet, m.tanik.grup, t.durum || "", t.tarih || "", t.plan || ""]); });
  const wt = XLSX.utils.aoa_to_sheet(tr); wt["!cols"] = [{ wch: 30 }, { wch: 40 }, { wch: 34 }, { wch: 20 }, { wch: 12 }, { wch: 50 }]; XLSX.utils.book_append_sheet(wb, wt, "Tanık Planı");
  const sm = [["Sayfa", "Madde", ...CODES, "Boş", "Tamamlanma %"]];
  sheetsOf(A).forEach(s => { const st = stats(A, s); sm.push([(s.mod ? s.mod.code + " " : "") + s.ad, st.n, ...CODES.map(c => st[c]), st.n - st.done, st.pct]); });
  const T = totalStats(A); sm.push(["TOPLAM", T.n, ...CODES.map(c => T[c]), T.n - T.done, T.pct]);
  const wsS = XLSX.utils.aoa_to_sheet(sm); wsS["!cols"] = [{ wch: 36 }, ...Array(8).fill({ wch: 10 })]; XLSX.utils.book_append_sheet(wb, wsS, "Bulgu Özeti");
  const fl = [["No", "Tür", "Sayfa", "Madde no", "Kontrol maddesi", "Bulgu", "Kanıt", "Dayanak"]];
  findings(A).forEach((f, i) => fl.push([i + 1, f.x.v === "UY" ? "Uygunsuzluk" : "Gözlem", f.sh.mod ? f.sh.mod.code : "O", f.it.no, f.it.t, f.x.bulgu || "", f.x.kanit || "", f.it.d]));
  const wf = XLSX.utils.aoa_to_sheet(fl); wf["!cols"] = [{ wch: 5 }, { wch: 14 }, { wch: 8 }, { wch: 9 }, { wch: 70 }, { wch: 50 }, { wch: 34 }, { wch: 34 }]; XLSX.utils.book_append_sheet(wb, wf, "Bulgu Listesi");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fname("xlsx"));
  toast("Excel dosyası indirildi");
}
async function exportJson() {
  const photos = await DB.photosOf(A.id);
  const blob = new Blob([JSON.stringify({ app: "urun-tanik-denetim", surum: D.surum, audit: A, photos }, null, 1)], { type: "application/json" });
  download(blob, fname("json")); toast("JSON yedeği indirildi (fotoğraflar dahil)");
}
$("#fileImport").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text()); if (j.app !== "urun-tanik-denetim" || !j.audit) throw 0;
    const ex = await DB.get("audits", j.audit.id);
    if (ex && !confirm("Bu denetim cihazda zaten var. Üzerine yazılsın mı? (İptal = kopya olarak ekle)")) {
      const nid = uid(); const map = {};
      (j.photos || []).forEach(p => { map[p.id] = uid(); });
      Object.values(j.audit.answers).forEach(x => { if (x.photos) x.photos = x.photos.map(id => map[id] || id); });
      j.photos = (j.photos || []).map(p => ({ ...p, id: map[p.id], auditId: nid })); j.audit.id = nid; j.audit.info.kurulus = (j.audit.info.kurulus || "") + " (kopya)";
    }
    await DB.put("audits", j.audit); for (const p of j.photos || []) await DB.put("photos", { ...p, auditId: j.audit.id });
    toast("Denetim içe aktarıldı"); home();
  } catch { toast("Geçersiz dosya"); }
  e.target.value = "";
};
function printReport() {
  const t = totalStats(A); const F = findings(A);
  const w = window.open("", "_blank"); if (!w) return toast("Açılır pencere engellendi");
  const row = (s, it) => { const x = A.answers[key(s.id, it.no)] || {}; return `<tr><td>${esc(it.no)}</td><td>${esc(it.t)}<div class="m">${esc(it.d)}</div></td><td class="c ${x.v ? "v" : ""}">${x.v || ""}</td><td>${esc(x.kanit || "")}</td><td>${esc(x.bulgu || "")}</td></tr>`; };
  w.document.write(`<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${esc(fname("pdf"))}</title><style>
    body{font:11px Arial,sans-serif;margin:16px;color:#111}h1{font-size:16px;color:#1F3864;margin:0 0 4px}h2{font-size:13px;color:#1F3864;margin:16px 0 4px;page-break-after:avoid}
    table{width:100%;border-collapse:collapse}td,th{border:1px solid #bbb;padding:3px 4px;vertical-align:top}th{background:#1F3864;color:#fff}
    .m{color:#666;font-size:9px}.c{text-align:center;font-weight:bold;width:34px}.i td:first-child{width:150px;background:#DEE7F2;font-weight:bold}tr{page-break-inside:avoid}</style></head><body>
    <h1>2014/33/AB Akreditasyon Denetim Raporu — Çeklist</h1>
    <table class="i">${INFO.map(([k, l]) => `<tr><td>${l}</td><td>${esc(A.info[k] || "")}</td></tr>`).join("")}<tr><td>Modüller</td><td>${A.modules.map(id => MOD[id].code + " " + esc(MOD[id].ad)).join("; ")}</td></tr>
    <tr><td>Sonuç</td><td>${t.done}/${t.n} madde değerlendirildi (%${t.pct}) · U ${t.U} · K ${t.K} · UY ${t.UY} · UD ${t.UD} · İ ${t["İ"]}</td></tr></table>
    <h2>Bulgular (${F.length})</h2><table><tr><th>Tür</th><th>Sayfa / no</th><th>Madde</th><th>Bulgu</th></tr>${F.map(f => `<tr><td class="c">${f.x.v}</td><td>${f.sh.mod ? f.sh.mod.code : "O"} ${esc(f.it.no)}</td><td>${esc(f.it.t)}<div class="m">${esc(f.it.d)}</div></td><td>${esc(f.x.bulgu || "")}</td></tr>`).join("")}</table>
    ${sheetsOf(A).map(s => `<h2>${s.mod ? s.mod.code + " — " + esc(s.mod.baslik) : "Ortak Şartlar"}</h2><table><tr><th>No</th><th>Kontrol maddesi / dayanak</th><th>Değ.</th><th>Kanıt</th><th>Bulgu / not</th></tr>${s.items.map(it => row(s, it)).join("")}</table>`).join("")}
    <script>setTimeout(()=>print(),300)<\/script></body></html>`);
  w.document.close();
}

/* ---------- Menü ---------- */
$("#btnMenu").onclick = e => {
  e.stopPropagation(); const m = $("#menu");
  if (!m.hidden) return (m.hidden = true);
  m.innerHTML = `<button data-a="info">✎ Denetim bilgileri ve modüller</button><button data-a="xl">⬇ Excel'e aktar</button><button data-a="pr">🖨 Yazdır / PDF</button>
    <button data-a="js">⬇ JSON yedeği (cihaz aktarımı)</button><button data-a="dup">⧉ Denetimi kopyala (boş çeklist)</button><button class="d" data-a="del">🗑 Denetimi sil</button>`;
  m.hidden = false;
  m.querySelectorAll("button").forEach(b => b.onclick = async () => {
    m.hidden = true; const a = b.dataset.a;
    if (a === "info") editInfo(A);
    if (a === "xl") exportXlsx(); if (a === "pr") printReport(); if (a === "js") exportJson();
    if (a === "dup") { const n = { ...A, id: uid(), created: new Date().toISOString(), answers: {}, tanik: {}, info: { ...A.info, kurulus: (A.info.kurulus || "") + " (yeni)" } }; A = n; await saveNow(); openAudit(n.id); toast("Boş kopya oluşturuldu"); }
    if (a === "del" && confirm("Bu denetim ve fotoğrafları kalıcı olarak silinsin mi?")) {
      for (const p of await DB.photosOf(A.id)) await DB.del("photos", p.id); await DB.del("audits", A.id); toast("Silindi"); home();
    }
  });
};
document.addEventListener("click", () => { $("#menu").hidden = true; });
$("#btnBack").onclick = async () => { await saveNow(); if (A && $("#view .tabs")) home(); else if (A) openAudit(A.id); else home(); };
window.addEventListener("beforeunload", () => { if (saveTimer) saveNow(); });

/* ---------- Başlat ---------- */
(async () => {
  try { await DB.open(); } catch { $("#view").innerHTML = `<div class="empty">Tarayıcı depolaması açılamadı (gizli sekme olabilir).</div>`; return; }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  home();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
