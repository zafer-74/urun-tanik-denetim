/* F701-062 Ürün Belgelendirme Kuruluşları için Tanık Denetim Raporu — uygulama içi form ve Word çıktısı */
"use strict";
const F62_AP = [["1", "Yeterli"], ["2", "Kısmen yeterli"], ["3", "Yeterli değil"], ["UD", "Uygulanabilir değil"]];
const F62_ROL = ["Baş Tetkikçi", "Tetkikçi", "Teknik Uzman", "Stajyer Tetkikçi", "Gözlemci", "Karar Verici"];

function f62() {
  A.f62 = A.f62 || {};
  const r = A.f62;
  r.g = r.g || {}; r.c = r.c || {}; r.ekip = r.ekip || [{}, {}, {}, {}];
  const i = A.info;
  if (r.g.udk === undefined) r.g.udk = i.kurulus || "";
  if (r.g.tur === undefined) r.g.tur = i.tur || "";
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
function f62Standart() {
  const hs = new Set();
  A.modules.forEach(id => { const o = Object.fromEntries(MOD[id].ozet); const a = o["Akreditasyon (EA-2/17 M:2026)"] || o["Akreditasyon (EA-2/17 S1)"] || ""; hs.add(a.split("·")[0].trim()); });
  return "2014/33/AB Asansör Direktifi (Asansör Yönetmeliği) — " + A.modules.map(id => MOD[id].baslik.split("—")[0].trim().replace(/^EK/, "Ek")).join(", ") +
    "\n" + [...hs].join(", ") + "; EA-2/17 M:2026 (+S1); NB-L RfU (16.07.2026)";
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
  const o = stats(A, { id: "O", items: D.ortak });
  lines.push(`Ortak Şartlar (Md. 24, 26, 30, 32–34, 36): ${o.done}/${o.n} madde — U ${o.U}, K ${o.K}, UY ${o.UY}, UD ${o.UD}.`);
  return { text: lines.join("\n"), ap: ap.v };
}
function f62Uygunsuzluk() {
  return findings(A).filter(f => f.x.v === "UY").map((f, i) => `${i + 1}) ${f.sh.mod ? f.sh.mod.code : "O"} ${f.it.no} — ${f.x.bulgu || f.it.t}\n   Dayanak: ${f.it.d}${f.x.kanit ? "\n   Kanıt: " + f.x.kanit : ""}`).join("\n");
}
function f62Sonuc() {
  const t = totalStats(A);
  const gozlem = findings(A).filter(f => f.x.v === "K");
  return `${A.modules.map(id => MOD[id].code + " " + MOD[id].ad).join(", ")} kapsamında tanık denetimi gerçekleştirilmiştir. ` +
    `Çeklistte ${t.n} maddenin ${t.done}'i değerlendirilmiş; ${t.U} uygun, ${t.K} kısmen uygun (gözlem), ${t.UY} uygunsuzluk, ${t.UD} uygulanabilir değil olarak işaretlenmiştir.` +
    (gozlem.length ? "\nGözlemler:\n" + gozlem.map(f => `- ${f.sh.mod ? f.sh.mod.code : "O"} ${f.it.no}: ${f.x.bulgu || f.it.t}`).join("\n") : "");
}

function renderF62() {
  const r = f62(); const g = r.g; const p = $("#pane");
  const inp = (k, l, type = "text", full = false) => `<label class="f" ${full ? 'style="grid-column:1/-1"' : ""}><span>${l}</span>${type === "area"
    ? `<textarea class="t" data-g="${k}">${esc(g[k] || "")}</textarea>` : `<input class="t" type="${type}" data-g="${k}" value="${esc(g[k] || "")}">`}</label>`;
  let h = `<div class="card muted">TÜRKAK <b>F701-062 Rev.03</b> — Ürün Belgelendirme Kuruluşları için Tanık Denetim Raporu. Alanları doldurun, ardından resmî şablon üzerine işlenmiş Word dosyasını indirin. Bölüm 2.4 ve Bölüm 3 çeklist sonuçlarından otomatik önerilebilir.</div>
  <div class="row"><button class="btn" id="f62dl">⬇ F701-062 Word (.docx)</button></div>
  <h2>Bölüm 1 — Genel Bilgiler</h2><div class="card"><div class="grid2">
    <label class="f"><span>Dosya No: AB-</span><input class="t" data-g="dosya1" value="${esc(g.dosya1 || "")}" placeholder="ör. 0123"></label>
    <label class="f"><span>Dosya No son eki (- sonrası)</span><input class="t" data-g="dosya2" value="${esc(g.dosya2 || "")}" placeholder="ör. Ü"></label>
    ${inp("no", "Denetim No / Assessment No")}${inp("udk", "UDK Adı / Name of the CAB")}
    ${inp("bas", "Denetim tarihi — başlangıç", "date")}${inp("bit", "Denetim tarihi — bitiş", "date")}
    ${inp("tur", "Denetim Türü / Assessment Type")}
    <label class="f"><span>Kapsam Genişletme / Scope Extension</span><label style="display:flex;gap:8px;align-items:center;padding:8px 0"><input type="checkbox" data-g="kg" ${g.kg ? "checked" : ""} style="width:20px;height:20px"> Evet</label></label>
  </div>
  <div class="f"><span class="muted">BK Tetkik Ekibi Üyeleri ve Tetkikteki Rolü (en fazla 4)</span>
  ${r.ekip.map((e, n) => `<div class="grid2" style="grid-template-columns:1fr 1fr 1fr;gap:6px;margin:4px 0">
    <input class="t" data-e="${n}" data-x="ad" placeholder="Adı" value="${esc(e.ad || "")}"><input class="t" data-e="${n}" data-x="soyad" placeholder="Soyadı" value="${esc(e.soyad || "")}">
    <input class="t" data-e="${n}" data-x="gorev" list="rol" placeholder="Görevi" value="${esc(e.gorev || "")}"></div>`).join("")}
  <datalist id="rol">${F62_ROL.map(x => `<option value="${x}">`).join("")}</datalist></div>
  <div class="grid2">${inp("musteri", "Belgelendirme Kuruluşu Müşterisi (Monte eden / İmalatçı) ve Adresi", "area", true)}
  ${inp("diskaynak", "Dış kaynak kullanımı (laboratuvar, muayene kuruluşu vb.) — adı ve adresi", "area", true)}
  ${inp("standart", "Tanık olunacak tetkike esas standart, yönetmelik, belgelendirme programı", "area", true)}
  ${inp("kapsam", "Tanıklık yapılacak ürünlerin / hizmetlerin kapsamı", "area", true)}</div>
  <div class="row"><button class="btn sec sm" id="f62std">↺ Standart ve kapsamı modüllerden yeniden doldur</button></div></div>`;
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
          <label class="f"><span>Açıklamalar / Explanations</span><textarea class="t" data-c="${it.id}" rows="${sec.id === "2.4" ? 8 : 2}">${esc(c.e || "")}</textarea></label></div>`;
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
  p.querySelectorAll("[data-g]").forEach(e => e.oninput = e.onchange = () => { g[e.dataset.g] = e.type === "checkbox" ? e.checked : e.value; markDirty(); });
  p.querySelectorAll("[data-e]").forEach(e => e.oninput = () => { r.ekip[+e.dataset.e][e.dataset.x] = e.value; markDirty(); });
  p.querySelectorAll("textarea[data-c]").forEach(e => e.oninput = () => { (r.c[e.dataset.c] = r.c[e.dataset.c] || {}).e = e.value; markDirty(); });
  p.querySelectorAll(".code[data-ap]").forEach(b => b.onclick = () => {
    const c = (r.c[b.dataset.id] = r.c[b.dataset.id] || {}); c.a = c.a === b.dataset.ap ? "" : b.dataset.ap;
    const it = b.closest(".item"); it.dataset.v = { 1: "U", 2: "K", 3: "UY", UD: "UD" }[c.a] || "";
    it.querySelectorAll(".code").forEach(x => x.classList.toggle("on", x.dataset.ap === c.a)); markDirty();
  });
  $("#f62std").onclick = () => { g.standart = f62Standart(); g.kapsam = f62Kapsam(); markDirty(); renderF62(); };
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
    DOSYA1: g.dosya1 || "……", DOSYA2: g.dosya2 || "", DENETIM_NO: g.no, BASLANGIC: trDate(g.bas), BITIS: trDate(g.bit), UDK: g.udk, DENETIM_TURU: g.tur,
    MUSTERI: g.musteri, DISKAYNAK: g.diskaynak, STANDART: g.standart, KAPSAM: g.kapsam,
    SONUC: g.sonuc, UYGUNSUZLUK: g.uyg, ONERI: g.oneri, DENETCI: g.denetci, DTARIH: trDate(g.dtarih), UZMAN: g.uzman, UTARIH: trDate(g.utarih),
    K_KG: g.kg ? "1" : "0", C_KG: g.kg ? "☒" : "☐",
  };
  r.ekip.forEach((e, n) => { V[`T${n + 1}_AD`] = e.ad; V[`T${n + 1}_SOYAD`] = e.soyad; V[`T${n + 1}_GOREV`] = e.gorev; });
  window.F62.forEach(s => s.groups.forEach(gr => gr.items.forEach(it => {
    const c = r.c[it.id] || {};
    V["E_" + it.id] = c.a === "UD" ? ("UD" + (c.e ? " – " + c.e : "")) : (c.e || "");
    [1, 2, 3].forEach(n => { const on = c.a === String(n); V[`K_${it.id}_${n}`] = on ? "1" : "0"; V[`C_${it.id}_${n}`] = on ? "☒" : "☐"; });
  })));
  try {
    const buf = await (await fetch("report/F701-062_sablon.docx")).arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const files = Object.keys(zip.files).filter(f => /^word\/(document|header\d*|footer\d*)\.xml$/.test(f));
    for (const f of files) {
      let x = await zip.file(f).async("string");
      x = x.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, k) => xmlText(V[k] ?? ""));
      zip.file(f, x);
    }
    const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const n = (g.udk || A.info.kurulus || "denetim").replace(/[^\wçğıöşüÇĞİÖŞÜ-]+/g, "_").slice(0, 40);
    download(blob, `F701-062_Tanik_Denetim_Raporu_${n}_${g.bas || ""}.docx`);
    toast("F701-062 raporu indirildi");
  } catch (e) { console.error(e); toast("Rapor oluşturulamadı: " + e.message); }
}
