/* F701-062 Ürün Belgelendirme Kuruluşları için Tanık Denetim Raporu — uygulama içi form ve Word çıktısı */
"use strict";
const F62_AP = [["1", "Yeterli"], ["2", "Kısmen yeterli"], ["3", "Yeterli değil"], ["UD", "Uygulanabilir değil"]];
const F62_TUR = ["Ön Denetim / Pre-Assessment", "İlk Akreditasyon Denetimi / Initial Accreditation Assessment", "1. Gözetim Denetimi / 1st Surveillance Assessment",
  "2. Gözetim Denetimi / 2nd Surveillance Assessment", "Kapsam Genişletme Denetimi / Scope Extension Assessment", "Akreditasyon Yenileme Denetimi / Re-Accreditation Assessment",
  "Gözetim Denetimi / Surveillance Assessment", "Tanık Denetim / Witness Assessment", "Uzaktan Denetim / Remote Assessment", "Plan Dışı Denetim / Unannounced Visit", "Diğer / Other"];
function turNorm(v) {               // eski serbest metin değerlerini form listesine eşle
  if (!v || F62_TUR.includes(v)) return v || "";
  const t = v.toLocaleLowerCase("tr");
  const m = [["tanık", 7], ["ön denetim", 0], ["ilk", 1], ["yenile", 5], ["kapsam", 4], ["uzaktan", 8], ["plan dışı", 9], ["gözetim", 6]].find(([k]) => t.includes(k));
  return m ? F62_TUR[m[1]] : v;
}
function turText(g) { return g.tur === "Diğer / Other" && g.turDiger ? "Diğer / Other – " + g.turDiger : (g.tur || ""); }
const F62_MESLEK = ["Makine Mühendisi", "Elektrik Mühendisi", "Elektrik-Elektronik Mühendisi", "Mekatronik Mühendisi", "Endüstri Mühendisi",
  "Makine Teknikeri", "Elektrik Teknikeri", "Asansör Teknikeri", "Fizik Mühendisi"];
const F62_ROL = ["Baş Tetkikçi", "Tetkikçi", "Teknik Uzman", "Stajyer Tetkikçi", "Gözlemci", "Karar Verici"];

function f62() {
  A.f62 = A.f62 || {};
  const r = A.f62;
  r.g = r.g || {}; r.c = r.c || {}; if (!r.ekipV2) { r.ekip = (r.ekip || []).filter(e => e && (e.ad || e.soyad || e.gorev || e.meslek)); r.ekipV2 = 1; }
  if (!r.ekip.length) r.ekip.push({}); r.dok = r.dok || [{}]; r.ekp = r.ekp || [{}];
  const i = A.info;
  if (r.g.udk === undefined) r.g.udk = i.kurulus || "";
  if (r.g.tur === undefined) r.g.tur = i.tur || "";
  r.g.tur = turNorm(r.g.tur);
  if (r.g.bas === undefined) r.g.bas = i.tarih || "";
  if (r.g.bit === undefined) r.g.bit = i.tarih || "";
  if (r.g.denetci === undefined) r.g.denetci = i.basDenetci || "";
  if (r.g.uzman === undefined) r.g.uzman = i.uzman || "";
  if (r.g.dtarih === undefined) r.g.dtarih = i.tarih || "";
  if (r.g.utarih === undefined) r.g.utarih = i.uzman ? (i.tarih || "") : "";
  if (r.g.standart === undefined) r.g.standart = f62Standart();
  if (r.g.kapsam === undefined) r.g.kapsam = f62Kapsam();
  return r;
}
const DOK_ONERI = ["Belgelendirme Prosedürü", "Tetkik / Muayene Prosedürü", "Ek V Son Muayene Talimatı", "AB Tip İncelemesi Talimatı", "Kalite Sistemi Değerlendirme Talimatı",
  "Muayene / Tetkik Kontrol Listesi", "Deney Kayıt Formu", "Tetkik Planı Formu", "Tetkik / Muayene Raporu Formu", "Uygunsuzluk Formu", "Belgelendirme Sözleşmesi", "Belge / Sertifika Formu"];
function dokListe(r) {
  return (r.dok || []).filter(d => d.kod || d.ad).map((d, i) => `${i + 1}) ${[d.kod, d.ad].filter(Boolean).join(" – ")}${d.rev ? " – Rev. " + d.rev : ""}${d.revt ? " (" + trDate(d.revt) + ")" : ""}`).join("\n");
}
function dokHtml(r) {
  return `<div class="card dok"><h3>Tetkikte Kullanılan Dokümanlar <small class="muted">/ Documents Used During Audit</small></h3>
    <div class="muted" style="margin-bottom:6px">Belgelendirme kuruluşunun prosedürleri, talimatları, formları, kontrol listeleri vb. Bu liste F701-062 Bölüm 2.1 "Tetkikte Kullanılan Dokümanlar" satırına aktarılır.</div>
    <div class="dokhead"><span>Doküman kodu</span><span>Doküman adı</span><span>Revizyon no</span><span>Revizyon tarihi</span><span></span></div>
    ${r.dok.map((d, n) => `<div class="dokrow">
      <label class="dc c-kod"><i>Doküman kodu</i><input class="t" data-d="${n}" data-x="kod" placeholder="Doküman kodu" value="${esc(d.kod || "")}"></label>
      <label class="dc c-ad"><i>Doküman adı</i><input class="t" data-d="${n}" data-x="ad" list="dokad" placeholder="Doküman adı" value="${esc(d.ad || "")}"></label>
      <label class="dc c-rev"><i>Revizyon no</i><input class="t" data-d="${n}" data-x="rev" placeholder="Rev. no" value="${esc(d.rev || "")}"></label>
      <label class="dc c-revt"><i>Revizyon tarihi</i><input class="t" type="date" data-d="${n}" data-x="revt" value="${esc(d.revt || "")}"></label>
      <button class="delbtn" data-dd="${n}" title="Satırı sil">✕</button></div>`).join("")}
    <datalist id="dokad">${DOK_ONERI.map(x => `<option value="${x}">`).join("")}</datalist>
    <div class="row" style="margin-top:6px"><button class="btn sec sm" id="dokAdd">＋ Doküman ekle</button><span class="muted">${r.dok.filter(d => d.kod || d.ad).length} doküman</span></div></div>`;
}
function bindDok(root, rerender) {
  const r = f62();
  root.querySelectorAll("[data-d]").forEach(e => e.oninput = e.onchange = () => { r.dok[+e.dataset.d][e.dataset.x] = e.value; markDirty(); });
  root.querySelectorAll("[data-dd]").forEach(b => b.onclick = () => { const n = +b.dataset.dd; const d = r.dok[n];
    if ((d.kod || d.ad) && !confirm("Bu doküman satırı silinsin mi?")) return; r.dok.splice(n, 1); if (!r.dok.length) r.dok.push({}); markDirty(); rerender(); });
  const add = root.querySelector("#dokAdd"); if (add) add.onclick = () => { r.dok.push({}); markDirty(); rerender();
    setTimeout(() => { const ins = root.querySelectorAll('.dokrow input[data-x="kod"]'); ins[ins.length - 1]?.focus(); }, 30); };
}
const EKP_ONERI = ["Deney ağırlıkları", "Takometre / hız ölçer", "Dinamometre / kuvvet ölçer", "Yalıtım direnci ölçer (megger)", "Topraklama / döngü empedans ölçer",
  "Multimetre", "Pens ampermetre", "Şerit metre / lazer mesafe ölçer", "Kronometre", "Manometre (hidrolik)", "Lüksmetre", "Ses seviyesi ölçer", "Kumpas", "Su terazisi / eğim ölçer"];
function ekpListe(r) {
  return (r.ekp || []).filter(d => d.ad || d.kod).map((d, i) => `${i + 1}) ${[d.ad, d.kod ? "Kod: " + d.kod : ""].filter(Boolean).join(" – ")}` +
    `${d.kalt ? " – Kal. tarihi: " + trDate(d.kalt) : ""}${d.lab ? " – Lab. Akr. No: " + d.lab : ""}${d.sert ? " – Sertifika No: " + d.sert : ""}`).join("\n");
}
function ekpHtml(r) {
  return `<div class="card dok ekp"><h3>Kullanılan Ekipmanlar ve Kalibrasyon Durumu <small class="muted">/ Equipment Used and Its Calibration Status</small></h3>
    <div class="muted" style="margin-bottom:6px">F701-062 Bölüm 2.2 — Dış Kaynak Kullanımı ve Ölçme Ekipmanları. Tanık olunan tetkikte kullanılan cihaz ve ekipmanlar; liste rapordaki "Kullanılan Ekipmanlar ve Kalibrasyon Durumu" satırına aktarılır.</div>
    <div class="ekphead"><span>Cihaz / ekipman adı</span><span>Kodu</span><span>Kalibrasyon tarihi</span><span>Lab. Akreditasyon No</span><span>Sertifika No</span><span></span></div>
    ${r.ekp.map((d, n) => `<div class="ekprow">
      <label class="dc c1"><i>Cihaz / ekipman adı</i><input class="t" data-k2="${n}" data-x="ad" list="ekpad" placeholder="Cihaz / ekipman adı" value="${esc(d.ad || "")}"></label>
      <label class="dc c2"><i>Kodu</i><input class="t" data-k2="${n}" data-x="kod" placeholder="Kodu" value="${esc(d.kod || "")}"></label>
      <label class="dc c3"><i>Kalibrasyon tarihi</i><input class="t" type="date" data-k2="${n}" data-x="kalt" value="${esc(d.kalt || "")}"></label>
      <label class="dc c4"><i>Lab. Akreditasyon No</i><input class="t" data-k2="${n}" data-x="lab" placeholder="ör. AB-0000-K" value="${esc(d.lab || "")}"></label>
      <label class="dc c5"><i>Sertifika No</i><input class="t" data-k2="${n}" data-x="sert" placeholder="Sertifika No" value="${esc(d.sert || "")}"></label>
      <button class="delbtn" data-kd="${n}" title="Satırı sil">✕</button></div>`).join("")}
    <datalist id="ekpad">${EKP_ONERI.map(x => `<option value="${x}">`).join("")}</datalist>
    <div class="row" style="margin-top:6px"><button class="btn sec sm" id="ekpAdd">＋ Cihaz / ekipman ekle</button><span class="muted">${r.ekp.filter(d => d.ad || d.kod).length} cihaz</span></div></div>`;
}
function bindEkp(root, rerender) {
  const r = f62();
  root.querySelectorAll("[data-k2]").forEach(e => e.oninput = e.onchange = () => { r.ekp[+e.dataset.k2][e.dataset.x] = e.value; markDirty(); });
  root.querySelectorAll("[data-kd]").forEach(b => b.onclick = () => { const n = +b.dataset.kd, d = r.ekp[n];
    if ((d.ad || d.kod) && !confirm("Bu cihaz / ekipman satırı silinsin mi?")) return; r.ekp.splice(n, 1); if (!r.ekp.length) r.ekp.push({}); markDirty(); rerender(); });
  const add = root.querySelector("#ekpAdd"); if (add) add.onclick = () => { r.ekp.push({}); markDirty(); rerender();
    setTimeout(() => { const ins = root.querySelectorAll('.ekprow input[data-x="ad"]'); ins[ins.length - 1]?.focus(); }, 30); };
}
function f62Standart() {
  return yonsOf(A.modules).map(y => {
    const ms = A.modules.filter(id => yonOf(MOD[id]) === y), hs = new Set();
    ms.forEach(id => { const o = Object.fromEntries(MOD[id].ozet); const a = o["Akreditasyon (EA-2/17 M:2026)"] || o["Akreditasyon (EA-2/17 S1)"] || ""; hs.add(a.split("·")[0].trim()); });
    const ad = y.id === "asansor" ? "2014/33/AB Asansör Direktifi (Asansör Yönetmeliği)" : y.ad;
    return ad + " — " + ms.map(id => MOD[id].baslik.split("—")[0].trim().replace(/^EK/, "Ek")).join(", ") +
      "\n" + [...hs].join(", ") + "; EA-2/17 M:2026 (+S1)" + (y.id === "asansor" ? "; NB-L RfU (16.07.2026)" : "; NB-M koordinasyon grubu dokümanları");
  }).join("\n");
}
function f62Kapsam() {
  return A.modules.map(id => { const m = MOD[id]; const o = Object.fromEntries(m.ozet); return m.code + " " + m.ad + ": " + (o["Ürün"] || ""); }).join("\n");
}
function f62Ozet24() {
  const lines = [], ap = { v: "1" };
  A.modules.forEach(id => {
    const sh = { id, items: MOD[id].items, mod: MOD[id] }; const st = stats(A, sh);
    lines.push(`${MOD[id].code} ${MOD[id].ad}: ${st.done}/${st.n} madde değerlendirildi — U ${st.U}, K ${st.K}, UY ${st.UY}, UD ${st.UD}, İ ${st["İ"]}.`);
    MOD[id].items.forEach(it => { const x = A.answers[key(id, it.no)]; if (x && (x.v === "UY" || x.v === "K")) lines.push(`  • ${x.v} ${it.no}: ${x.bulgu || it.t} (${it.d})`); });
  });
  const t = totalStats(A);
  if (t.UY) ap.v = "3"; else if (t.K) ap.v = "2";
  yonsOf(A.modules).forEach(y => { const o = stats(A, ortakSheet(y));
    lines.push(`${y.ortakAd} (${y.ortakMd}): ${o.done}/${o.n} madde — U ${o.U}, K ${o.K}, UY ${o.UY}, UD ${o.UD}.`); });
  return { text: lines.join("\n"), ap: ap.v };
}
function f62Uygunsuzluk() {
  return findings(A).filter(f => f.x.v === "UY").map((f, i) => `${i + 1}) ${shCode(f.sh)} ${f.it.no} — ${f.x.bulgu || f.it.t}\n   Dayanak: ${f.it.d}${f.x.kanit ? "\n   Kanıt: " + f.x.kanit : ""}`).join("\n");
}
function f62Sonuc() {
  const t = totalStats(A);
  const gozlem = findings(A).filter(f => f.x.v === "K");
  return `${A.modules.map(id => MOD[id].code + " " + MOD[id].ad).join(", ")} kapsamında tanık denetimi gerçekleştirilmiştir. ` +
    `Çeklistte ${t.n} maddenin ${t.done}'i değerlendirilmiş; ${t.U} uygun, ${t.K} kısmen uygun (gözlem), ${t.UY} uygunsuzluk, ${t.UD} uygulanabilir değil olarak işaretlenmiştir.` +
    (gozlem.length ? "\nGözlemler:\n" + gozlem.map(f => `- ${shCode(f.sh)} ${f.it.no}: ${f.x.bulgu || f.it.t}`).join("\n") : "");
}

function renderF62() {
  const r = f62(); const g = r.g; const p = $("#pane");
  const inp = (k, l, type = "text", full = false) => `<label class="f" ${full ? 'style="grid-column:1/-1"' : ""}><span>${l}</span>${type === "area"
    ? `<textarea class="t" data-g="${k}">${esc(g[k] || "")}</textarea>` : `<input class="t" type="${type}" data-g="${k}" value="${esc(g[k] || "")}">`}</label>`;
  let h = `<div class="card muted">TÜRKAK <b>F701-062 Rev.03</b> — Ürün Belgelendirme Kuruluşları için Tanık Denetim Raporu. Alanları doldurun, ardından resmî şablon üzerine işlenmiş Word dosyasını indirin. Bölüm 2.4 ve Bölüm 3 çeklist sonuçlarından otomatik önerilebilir.</div>
  <div class="row"><button class="btn" id="f62dl">⬇ F701-062 Word (.docx)</button></div>
  <h2>Bölüm 1 — Genel Bilgiler</h2>${f62B1Html(r)}`;
  window.F62.forEach(sec => {
    h += `<h2>Bölüm ${sec.id} — ${esc(sec.title)}</h2>`;
    if (sec.id === "2.4") h += `<div class="row"><button class="btn sec sm" id="f62s24">↺ Çeklist sonuçlarından öner</button><span class="muted">Onaylanmış kuruluş kapsamındaki değerlendirmeler (modül çeklistleri) bu bölüme aktarılır.</span></div>`;
    sec.groups.forEach(gr => {
      if (gr.title) h += `<div class="sec">${esc(gr.title)}</div>`;
      gr.items.forEach(it => {
        const c = r.c[it.id] || {};
        const [tr, en] = it.t.split(" / ");
        h += `<div class="item" data-v="${{ 1: "U", 2: "K", 3: "UY", UD: "UD" }[c.a] || ""}"><div class="h"><span class="tx"><b>${esc(tr)}</b>${en ? ` <span class="muted">/ ${esc(it.t.slice(tr.length + 3))}</span>` : ""}</span></div>
          <div class="codes" style="margin-left:0">${F62_AP.map(([v, l]) => `<button class="code ${c.a === v ? "on" : ""}" data-c="${{ 1: "U", 2: "K", 3: "UY", UD: "UD" }[v]}" data-ap="${v}" data-id="${it.id}" title="${l}">${v}</button>`).join("")}</div>
          ${it.id === "R7_9" ? `<div class="muted" style="white-space:pre-line;margin-top:6px"><b>Kapaktaki cihaz / ekipman listesi (rapora otomatik eklenir):</b>\n${esc(ekpListe(r) || "— henüz cihaz girilmedi —")}</div>` : ""}
          ${it.id === "R5_10" ? `<div class="muted" style="white-space:pre-line;margin-top:6px"><b>Kapaktaki doküman listesi (rapora otomatik eklenir):</b>\n${esc(dokListe(r) || "— henüz doküman girilmedi —")}</div>` : ""}
          <label class="f"><span>${it.id === "R5_10" || it.id === "R7_9" ? "Ek açıklama" : "Açıklamalar / Explanations"}</span><textarea class="t" data-c="${it.id}" rows="${sec.id === "2.4" ? 8 : 2}">${esc(c.e || "")}</textarea></label></div>`;
      });
    });
  });
  h += `<h2>Bölüm 3 — Genel Değerlendirme ve Sonuç</h2><div class="card">
    <div class="row"><button class="btn sec sm" id="f62son">↺ Sonuç ve uygunsuzlukları çeklistten öner</button></div>
    ${inp("sonuc", "Sonuçlar ve Yorumlar / Results and Recommendations", "area", true)}
    ${inp("uyg", "Varsa Uygunsuzluk(lar) / Non-Conformity(ies)", "area", true)}
    ${inp("oneri", "Bir Sonraki Denetime İlişkin Öneri ve Değerlendirmeler", "area", true)}
    <div class="grid2">${inp("denetci", "Denetçinin Adı Soyadı")}${inp("dtarih", "Tarih", "date")}${inp("uzman", "(Varsa) Teknik Uzmanın Adı Soyadı")}${inp("utarih", "Tarih", "date")}</div>
    <div class="muted">Not: Uygunsuzluk tespit edilmesi durumunda uygunsuzluğa konu objektif deliller rapora ek olarak sunulmalıdır (fotoğraflar JSON yedeğinde ve çeklist notlarında).</div></div>
    <div class="row" style="margin-top:12px"><button class="btn" id="f62dl2">⬇ F701-062 Word (.docx)</button></div>`;
  p.innerHTML = h;
  bindF62B1(p, renderF62);
  p.querySelectorAll("textarea[data-c]").forEach(e => e.oninput = () => { (r.c[e.dataset.c] = r.c[e.dataset.c] || {}).e = e.value; markDirty(); });
  p.querySelectorAll(".code[data-ap]").forEach(b => b.onclick = () => {
    const c = (r.c[b.dataset.id] = r.c[b.dataset.id] || {}); c.a = c.a === b.dataset.ap ? "" : b.dataset.ap;
    const it = b.closest(".item"); it.dataset.v = { 1: "U", 2: "K", 3: "UY", UD: "UD" }[c.a] || "";
    it.querySelectorAll(".code").forEach(x => x.classList.toggle("on", x.dataset.ap === c.a)); markDirty();
  });
  $("#f62s24").onclick = () => { const o = f62Ozet24(); const id = window.F62.find(s => s.id === "2.4").groups[0].items[0].id;
    if (r.c[id]?.e && !confirm("Mevcut açıklamanın üzerine yazılsın mı?")) return; r.c[id] = { e: o.text, a: o.ap }; markDirty(); renderF62(); toast("Bölüm 2.4 çeklistten dolduruldu"); };
  $("#f62son").onclick = () => { if ((g.sonuc || g.uyg) && !confirm("Mevcut metinlerin üzerine yazılsın mı?")) return; g.sonuc = f62Sonuc(); g.uyg = f62Uygunsuzluk(); markDirty(); renderF62(); };
  $("#f62dl").onclick = $("#f62dl2").onclick = exportF62;
}

function trDate(s) { if (!s) return ""; const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? `${m[3]}.${m[2]}.${m[1]}` : s; }
function xmlText(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/\r?\n/g, '</w:t><w:br/><w:t xml:space="preserve">');
}
async function exportF62() {
  if (!window.JSZip) return toast("Word kütüphanesi yükleniyor, birkaç saniye sonra tekrar deneyin");
  const r = f62(), g = r.g;
  const V = {
    DOSYA1: g.dosya1 || "……", DOSYA2: g.dosya2 || "", DENETIM_NO: g.no, BASLANGIC: trDate(g.bas), BITIS: trDate(g.bit), UDK: g.udk, DENETIM_TURU: turText(g),
    MUSTERI: g.musteri, DISKAYNAK: g.diskaynak, STANDART: g.standart, KAPSAM: g.kapsam,
    SONUC: g.sonuc, UYGUNSUZLUK: g.uyg, ONERI: g.oneri, DENETCI: g.denetci, DTARIH: trDate(g.dtarih), UZMAN: g.uzman, UTARIH: trDate(g.utarih),
    K_KG: g.kg ? "1" : "0", C_KG: g.kg ? "☒" : "☐",
  };
  const ekip = r.ekip.filter(e => e.ad || e.soyad || e.gorev || e.meslek);
  ekip.forEach((e, n) => { V[`T${n + 1}_AD`] = e.ad; V[`T${n + 1}_SOYAD`] = e.soyad; V[`T${n + 1}_GOREV`] = [e.gorev, e.meslek ? "(" + e.meslek + ")" : ""].filter(Boolean).join("\n"); });
  window.F62.forEach(s => s.groups.forEach(gr => gr.items.forEach(it => {
    const c = r.c[it.id] || {};
    let e = c.e || "";
    if (it.id === "R5_10") { const dl = dokListe(r); if (dl) e = dl + (e ? "\n" + e : ""); }
    if (it.id === "R7_9") { const kl = ekpListe(r); if (kl) e = kl + (e ? "\n" + e : ""); }
    V["E_" + it.id] = c.a === "UD" ? ("UD" + (e ? " – " + e : "")) : e;
    [1, 2, 3].forEach(n => { const on = c.a === String(n); V[`K_${it.id}_${n}`] = on ? "1" : "0"; V[`C_${it.id}_${n}`] = on ? "☒" : "☐"; });
  })));
  try {
    const buf = await (await fetch("report/F701-062_sablon.docx")).arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const files = Object.keys(zip.files).filter(f => /^word\/(document|header\d*|footer\d*)\.xml$/.test(f));
    for (const f of files) {
      let x = await zip.file(f).async("string");
      if (f === "word/document.xml" && ekip.length > 4) {       // 4'ten fazla üye: 4. satırı çoğalt
        const i = x.indexOf("{{T4_AD}}"), a = x.lastIndexOf("<w:tr>", i), b = x.indexOf("</w:tr>", i) + 7;
        const row = x.slice(a, b); let extra = "";
        for (let n = 5; n <= ekip.length; n++) extra += row.replace(/\{\{T4_/g, `{{T${n}_`);
        x = x.slice(0, b) + extra + x.slice(b);
      }
      x = x.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, k) => xmlText(V[k] ?? ""));
      zip.file(f, x);
    }
    const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const n = (g.udk || A.info.kurulus || "denetim").replace(/[^\wçğıöşüÇĞİÖŞÜ-]+/g, "_").slice(0, 40);
    download(blob, `F701-062_Tanik_Denetim_Raporu_${n}_${g.bas || ""}.docx`);
    toast("F701-062 raporu indirildi");
  } catch (e) { console.error(e); toast("Rapor oluşturulamadı: " + e.message); }
}

/* ---------- Bölüm 1 — Genel Bilgiler (Kapak ve rapor sekmesi ortak) ---------- */
function f62B1Html(r) {
  const g = r.g;
  const inp = (k, l, type = "text", full = false) => `<label class="f" ${full ? 'style="grid-column:1/-1"' : ""}><span>${l}</span>${type === "area"
    ? `<textarea class="t" data-g="${k}">${esc(g[k] || "")}</textarea>` : `<input class="t" type="${type}" data-g="${k}" value="${esc(g[k] || "")}">`}</label>`;
  return `<div class="card b1"><div class="grid2">
    <label class="f"><span>Dosya No: AB-</span><input class="t" data-g="dosya1" value="${esc(g.dosya1 || "")}" placeholder="ör. 0123"></label>
    <label class="f"><span>Dosya No son eki (- sonrası)</span><input class="t" data-g="dosya2" value="${esc(g.dosya2 || "")}" placeholder="ör. Ü"></label>
    ${inp("no", "Denetim No / Assessment No")}${inp("udk", "UDK Adı / Name of the CAB")}
    ${inp("bas", "Denetim tarihi — başlangıç", "date")}${inp("bit", "Denetim tarihi — bitiş", "date")}
    <label class="f"><span>Denetim Türü / Assessment Type</span><select class="t" data-g="tur"><option value="">— seçiniz —</option>
      ${(F62_TUR.includes(g.tur) || !g.tur ? F62_TUR : [g.tur, ...F62_TUR]).map(o => `<option ${g.tur === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>
      ${g.tur === "Diğer / Other" ? `<input class="t" data-g="turDiger" placeholder="Denetim türünü yazın" value="${esc(g.turDiger || "")}" style="margin-top:6px">` : ""}</label>
    <label class="f"><span>Kapsam Genişletme / Scope Extension</span><label style="display:flex;gap:8px;align-items:center;padding:8px 0"><input type="checkbox" data-g="kg" ${g.kg ? "checked" : ""} style="width:20px;height:20px"> Evet</label></label>
  </div>
  <div class="ekip"><div class="ekhd"><b>BK Tetkik Ekibi Üyeleri ve Tetkikteki Rolü</b> <span class="muted">/ CB Audit Team Members and Role in The Audit</span></div>
  <div class="ekhead"><span>Adı</span><span>Soyadı</span><span>Görevi</span><span>Mesleği</span><span></span></div>
  ${r.ekip.map((e, n) => `<div class="ekrow">
    <label class="dc"><i>Adı</i><input class="t" data-e="${n}" data-x="ad" placeholder="Adı" value="${esc(e.ad || "")}"></label>
    <label class="dc"><i>Soyadı</i><input class="t" data-e="${n}" data-x="soyad" placeholder="Soyadı" value="${esc(e.soyad || "")}"></label>
    <label class="dc"><i>Görevi</i><input class="t" data-e="${n}" data-x="gorev" list="rol" placeholder="Görevi" value="${esc(e.gorev || "")}"></label>
    <label class="dc"><i>Mesleği</i><input class="t" data-e="${n}" data-x="meslek" list="meslek" placeholder="Mesleği" value="${esc(e.meslek || "")}"></label>
    <button class="delbtn" data-ed="${n}" title="Üyeyi sil">✕</button></div>`).join("")}
  <div class="row" style="margin-top:6px"><button class="btn sec sm" id="ekAdd">＋ Ekip üyesi ekle</button><span class="muted">${r.ekip.filter(e => e.ad || e.soyad).length} üye</span></div>
  <datalist id="meslek">${F62_MESLEK.map(x => `<option value="${x}">`).join("")}</datalist>
  <datalist id="rol">${F62_ROL.map(x => `<option value="${x}">`).join("")}</datalist></div>
  <div class="grid2">${inp("musteri", "Belgelendirme Kuruluşu Müşterisi (Monte eden / İmalatçı) ve Adresi", "area", true)}
  ${inp("diskaynak", "Dış kaynak kullanımı (laboratuvar, muayene kuruluşu vb.) — adı ve adresi", "area", true)}
  ${inp("standart", "Tanık olunacak tetkike esas standart, yönetmelik, belgelendirme programı", "area", true)}
  ${inp("kapsam", "Tanıklık yapılacak ürünlerin / hizmetlerin kapsamı", "area", true)}</div>
  <div class="row"><button class="btn sec sm" id="f62std">↺ Standart ve kapsamı modüllerden yeniden doldur</button></div></div>`;
}
function bindF62B1(root, rerender) {
  const r = f62(), g = r.g;
  const SYNC = { udk: "kurulus", tur: "tur", bas: "tarih", denetci: "basDenetci", uzman: "uzman" };
  root.querySelectorAll("[data-g]").forEach(e => e.oninput = e.onchange = () => {
    const k = e.dataset.g; g[k] = e.type === "checkbox" ? e.checked : e.value;
    if (k === "tur") { A.info.tur = g.tur; markDirty(); return rerender(); }
    if (SYNC[k]) { A.info[SYNC[k]] = g[k]; if (k === "udk") setBar(g.udk || "Denetim", (A.info.tarih || "") + " · " + A.modules.map(id => MOD[id].code).join(", "), true); }
    markDirty();
  });
  root.querySelectorAll("[data-e]").forEach(e => e.oninput = () => { r.ekip[+e.dataset.e][e.dataset.x] = e.value; markDirty(); });
  root.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => { const n = +b.dataset.ed, e = r.ekip[n];
    if ((e.ad || e.soyad) && !confirm(`${[e.ad, e.soyad].filter(Boolean).join(" ")} ekipten çıkarılsın mı?`)) return;
    r.ekip.splice(n, 1); if (!r.ekip.length) r.ekip.push({}); markDirty(); rerender(); });
  const ea = root.querySelector("#ekAdd"); if (ea) ea.onclick = () => { r.ekip.push({}); markDirty(); rerender();
    setTimeout(() => { const ins = root.querySelectorAll('.ekrow input[data-x="ad"]'); ins[ins.length - 1]?.focus(); }, 30); };
  const b = root.querySelector("#f62std"); if (b) b.onclick = () => { g.standart = f62Standart(); g.kapsam = f62Kapsam(); markDirty(); rerender(); };
}

/* ---------- Kapak sayfası ---------- */
function renderKapak() {
  const r = f62(), p = $("#pane");
  const covers = A.modules.map(id => { const m = MOD[id], o = Object.fromEntries(m.ozet);
    const grp = (GRP[m.grup] || {}).ad || "", y = yonOf(m);
    return `<div class="cover"><div class="cv-top"><span class="cv-code">${m.code}</span><div><div class="muted">${esc(y.ad)} › ${esc(grp)}</div><b>${esc(m.baslik)}</b></div></div>
      <div class="kunye">${["Direktif dayanağı", "Başvuran / OK çıktısı"].map(l => o[l] ? `<div><b>${l}</b><span>${esc(o[l])}</span></div>` : "").join("")}
      <div><b>Akreditasyon</b><span>${esc(o["Akreditasyon (EA-2/17 M:2026)"] || o["Akreditasyon (EA-2/17 S1)"] || "")}</span></div>
      <div><b>Çeklist</b><span>${m.items.length} modül maddesi + ${ortakOf(y).length} ortak şart</span></div></div></div>`; }).join("");
  p.innerHTML = `<div class="formhead"><div class="fh-l">TÜRK AKREDİTASYON KURUMU</div><div class="fh-r">F<br><small>701-062</small></div></div>
    <div class="fh-title"><b>Ürün Belgelendirme Kuruluşları için Tanık Denetim Raporu</b><i>Witness Assessment Report Used For Product Certification</i></div>
    ${covers}
    <h2>Bölüm 1 — Genel Bilgiler <small class="muted">/ Section 1 — General Information</small></h2>
    ${f62B1Html(r)}
    ${dokHtml(r)}
    ${ekpHtml(r)}
    <div class="row" style="margin-top:12px"><button class="btn" id="kpGo">Çeklisti başlat ›</button><button class="btn sec" id="kpInfo">✎ Modülleri değiştir</button></div>`;
  bindF62B1(p, renderKapak); bindDok(p, renderKapak); bindEkp(p, renderKapak);
  $("#kpGo").onclick = () => { tab = A.modules[0] || sheetsOf(A)[0].id; renderAudit(); window.scrollTo(0, 0); };
  $("#kpInfo").onclick = () => editInfo(A);
}
