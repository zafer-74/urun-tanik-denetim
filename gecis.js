/* (AB) 2023/1230 Geçiş Denetim Raporu — GD (TÜRKAK 2023-1230 Geçiş Denetim Kontrol Listesi) için rapor formu ve Word çıktısı.
   F701-062 bu denetim türünde kullanılmaz. Şablon: report/Gecis_Denetim_Raporu_sablon.docx (tools/gecis_sablon.js ile üretilir). */
"use strict";
const GEC_ID = "M-GEC";
const GEC_TUR = ["Geçiş (doküman + ofis)", "Kapsam genişletme (ofis + tanık)", "Tanık (ilk faaliyet)"];
const GEC_ROL = ["Baş Denetçi", "Denetçi", "Teknik Uzman", "Aday Denetçi", "Gözlemci"];
const GEC_SONUC = ["Geçiş önerilir", "Uygunsuzlukların kapatılması koşuluyla geçiş önerilir", "Kapsam daraltılarak geçiş önerilir", "Geçiş önerilmez"];
const GEC_BOLUM = { A: "A. Başvuru dosyası", B: "B. Doküman incelemesi", C: "C. Ofis denetimi", D: "D. Kapsam eşleştirme", E: "E. Tanık denetim (ilk faaliyet)", F: "F. Karar ve kapanış", G: "G. Standartlar" };
const GEC_V = { U: "Uygun", K: "Gözlem", UY: "Uygun değil", UD: "Uygulanamaz", "İ": "Değerlendirilmedi" };
const GEC_STATU = "Geçiş tamamlanana kadar 2006/42/AT kapsamı geçerlidir; 20.01.2027'den sonra 2006/42/AT kapsamında yeni belge düzenlenemez; mevcut belgeler süreleri doluncaya kadar geçerlidir ve gözetimleri sürdürülür ((AB) 2023/1230 Md. 51–52 [Yön. Md. 51, Geçici Md. 1]).";

const hasGecis = a => a.modules.includes(GEC_ID);
const gecisOnly = a => a.modules.length > 0 && a.modules.every(id => id === GEC_ID);
const gecMod = () => MOD[GEC_ID];
const gecItems = letter => gecMod().items.filter(it => it.no.startsWith(letter + "."));
const gecAns = it => A.answers[key(GEC_ID, it.no)] || {};

function gec() {
  A.gec = A.gec || {};
  const r = A.gec, i = A.info;
  r.g = r.g || {}; r.ekip = r.ekip || []; r.d = r.d || {}; r.s = r.s || {};
  const def = (k, v) => { if (r.g[k] === undefined) r.g[k] = v; };
  def("kurulus", i.kurulus || ""); def("akrno", [i.akrNo, i.nando].filter(Boolean).join(" / ")); def("bas", i.tarih || ""); def("bit", i.tarih || "");
  def("yer", i.yer || ""); def("tur", GEC_TUR[0]); def("statu", GEC_STATU); def("basDenetci", i.basDenetci || ""); def("denetciler", i.uzman || ""); def("raporTarihi", i.tarih || "");
  if (!r.ekip.length) { if (i.basDenetci) r.ekip.push({ ad: i.basDenetci, rol: "Baş Denetçi" }); if (i.uzman) r.ekip.push({ ad: i.uzman, rol: "Teknik Uzman" }); if (!r.ekip.length) r.ekip.push({}); }
  return r;
}

/* ---------- D: eşleştirme işlemi (Excel formül mantığı) ---------- */
function gecIslem(it) {
  const r = gec(), x = r.d[it.no] || {}, ref = it.x || {};
  if (x.t === "H") return ref.eski.startsWith("—") ? "Kapsam dışı" : "Talep yok (mevcut 2006/42 satırı geçiş sonunda kapanır)";
  if (x.t !== "E") return "";
  if (it.no === "D.19") { const b = r.d["D.17"] || {}; return b.m === "E" ? "Modül B akreditasyonu var: doküman + ofis; ilk faaliyette tanık" : "Kapsam genişletme: ofis + tanık denetim"; }
  if (ref.eski.startsWith("—")) return "Kapsam genişletme: ofis + tanık denetim";
  return x.m === "E" ? "Eşleştirme (geçiş): doküman + ofis; ilk faaliyette tanık" : "Kapsam genişletme: ofis + tanık denetim";
}
function gecDmOzet() {
  const its = gecItems("D"), isl = its.map(gecIslem);
  const talep = its.filter(it => (gec().d[it.no] || {}).t === "E").length;
  return `Talep edilen satır: ${talep} · Kapsam genişletme sayılan: ${isl.filter(s => s.startsWith("Kapsam genişletme")).length} · Tanık denetim gerektiren (ilk faaliyet dahil): ${isl.filter(s => /tanık/i.test(s)).length}`;
}
function gecKapsamOneri() {
  const r = gec(), rows = gecItems("D").filter(it => (r.d[it.no] || {}).t === "E");
  const kat = rows.filter(it => /Kısım/.test(it.x.yeni)).map(it => "– Ek I " + it.x.yeni);
  const mod = rows.filter(it => /Modül/.test(it.x.yeni)).map(it => "– " + it.x.yeni);
  return ["Mevzuat: (AB) 2023/1230 Makine Tüzüğü / Makine Emniyeti Yönetmeliği (2023/1230/AB)",
    "Uygunluk değerlendirme prosedürleri:", ...(mod.length ? mod : ["– (eşleştirmede modül seçilmedi)"]),
    "Ürün kategorileri:", ...(kat.length ? kat : ["– (eşleştirmede kategori seçilmedi)"])].join("\n");
}
function gecSonucOneri() {
  const st = stats(A, { id: GEC_ID, items: gecMod().items });
  const sonuc = st.UY ? GEC_SONUC[1] : GEC_SONUC[0];
  const t = `Kontrol listesinin ${st.n} maddesinin ${st.done}'i değerlendirilmiştir: ${st.U} uygun, ${st.K} gözlem, ${st.UY} uygunsuzluk, ${st.UD} uygulanamaz, ${st["İ"]} değerlendirilmedi.` +
    (st.n - st.done ? ` ${st.n - st.done} madde boş bırakılmıştır.` : "") + "\n" + gecDmOzet() + ".";
  return { sonuc, t };
}
function addMonths(s, n) { if (!s) return ""; const d = new Date(s + "T00:00:00"); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); }

/* ---------- Form ---------- */
function gecGenelHtml(r) {
  const g = r.g;
  const inp = (k, l, type = "text", full = false) => `<label class="f" ${full ? 'style="grid-column:1/-1"' : ""}><span>${l}</span>${type === "area"
    ? `<textarea class="t" data-gg="${k}">${esc(g[k] || "")}</textarea>` : `<input class="t" type="${type}" data-gg="${k}" value="${esc(g[k] || "")}">`}</label>`;
  return `<div class="card"><div class="grid2">
    ${inp("kurulus", "Kuruluş adı")}${inp("akrno", "Akreditasyon no / NB kimlik no")}${inp("dosya", "Dosya no")}
    ${inp("basvuru", "Başvuru tarihi (e-TÜRKAK)", "date")}
    <label class="f"><span>Denetim türü</span><select class="t" data-gg="tur">${GEC_TUR.map(o => `<option ${g.tur === o ? "selected" : ""}>${o}</option>`).join("")}</select></label>
    ${inp("yer", "Denetim yeri / yöntemi")}${inp("bas", "Denetim tarihi — başlangıç", "date")}${inp("bit", "Denetim tarihi — bitiş", "date")}
    ${inp("mevcut", "Mevcut kapsam (2006/42/AT)", "area", true)}${inp("talep", "Talep edilen kapsam ((AB) 2023/1230)", "area", true)}
    ${inp("temsilci", "Kuruluş temsilcileri (ad, görev)", "area", true)}</div>
    <div class="ekip"><div class="ekhd"><b>Denetim ekibi</b></div>
    <div class="ekhead"><span>Adı soyadı</span><span>Görevi</span><span>İnceleme alanı / not</span><span></span><span></span></div>
    ${r.ekip.map((e, n) => `<div class="ekrow">
      <label class="dc"><i>Adı soyadı</i><input class="t" data-ge="${n}" data-x="ad" placeholder="Adı soyadı" value="${esc(e.ad || "")}"></label>
      <label class="dc"><i>Görevi</i><input class="t" data-ge="${n}" data-x="rol" list="gecrol" placeholder="Görevi" value="${esc(e.rol || "")}"></label>
      <label class="dc" style="grid-column:span 2"><i>İnceleme alanı / not</i><input class="t" data-ge="${n}" data-x="not" placeholder="ör. B ve C bölümleri" value="${esc(e.not || "")}"></label>
      <button class="delbtn" data-ged="${n}" title="Üyeyi sil">✕</button></div>`).join("")}
    <datalist id="gecrol">${GEC_ROL.map(x => `<option value="${x}">`).join("")}</datalist>
    <div class="row" style="margin-top:6px"><button class="btn sec sm" id="gecEkAdd">＋ Ekip üyesi ekle</button></div></div></div>`;
}
function bindGecGenel(root, rerender) {
  const r = gec(), g = r.g;
  const SYNC = { kurulus: "kurulus", bas: "tarih", yer: "yer", basDenetci: "basDenetci" };
  root.querySelectorAll("[data-gg]").forEach(e => e.oninput = e.onchange = () => {
    const k = e.dataset.gg; g[k] = e.value;
    if (SYNC[k]) { A.info[SYNC[k]] = e.value; if (k === "kurulus") setBar(e.value || "Denetim", (A.info.tarih || "") + " · " + A.modules.map(id => MOD[id].code).join(", "), true); }
    if (k === "karar") { const s = root.querySelector("#gecSon"); if (s) s.textContent = trDate(addMonths(e.value, 18)) || "—"; }
    markDirty();
  });
  root.querySelectorAll("[data-ge]").forEach(e => e.oninput = () => { r.ekip[+e.dataset.ge][e.dataset.x] = e.value; markDirty(); });
  root.querySelectorAll("[data-ged]").forEach(b => b.onclick = () => { const n = +b.dataset.ged, e = r.ekip[n];
    if ((e.ad || e.rol) && !confirm("Bu ekip üyesi silinsin mi?")) return; r.ekip.splice(n, 1); if (!r.ekip.length) r.ekip.push({}); markDirty(); rerender(); });
  const add = root.querySelector("#gecEkAdd"); if (add) add.onclick = () => { r.ekip.push({}); markDirty(); rerender(); };
}
const vChip = it => { const v = gecAns(it).v; return v ? `<span class="badge b-${v}">${v}</span>` : `<span class="muted">—</span>`; };

function renderGecis() {
  const r = gec(), g = r.g, p = $("#pane");
  const area = (k, l) => `<label class="f" style="grid-column:1/-1"><span>${l}</span><textarea class="t" data-gg="${k}" rows="4">${esc(g[k] || "")}</textarea></label>`;
  const sel = (no, k, v) => `<select class="t gsel" data-dn="${no}" data-dk="${k}"><option value=""></option>${["E", "H"].map(o => `<option ${v === o ? "selected" : ""}>${o}</option>`).join("")}</select>`;
  p.innerHTML = `<div class="card muted"><b>(AB) 2023/1230 Geçiş Denetim Raporu</b> — TÜRKAK 2023-1230 Geçiş Denetim Kontrol Listesi'ne göre hazırlanır; F701-062 bu denetimde kullanılmaz.
    Kontrol listesi sonuçları, uygunsuzluk ve gözlemler rapora otomatik aktarılır; aşağıdaki alanları tamamlayıp Word dosyasını indirin.</div>
    <div class="row"><button class="btn" id="gecDl">⬇ Geçiş Denetim Raporu (.docx)</button></div>
    <h2>1. Genel bilgiler ve denetim ekibi</h2>${gecGenelHtml(r)}
    <h2>5. Kapsam eşleştirme (D)</h2>
    <div class="card"><div class="muted" style="margin-bottom:6px">Kuruluşun eşleştirme tablosuna göre "Mevcut kapsamda var mı" ve "Talep ediliyor mu" seçin; TÜRKAK işlemi otomatik önerilir, denetim ekibi teyit eder. Durum sütunu kontrol listesinden gelir.</div>
    <div class="gtab"><div class="gh"><span>No</span><span>2006/42/AT → (AB) 2023/1230</span><span>Mevcut</span><span>Talep</span><span>TÜRKAK işlemi (öneri)</span><span>Durum</span></div>
    ${gecItems("D").map(it => { const x = r.d[it.no] || {};
      return `<div class="gr"><b>${it.no}</b><span>${esc(it.x.eski)} → <b>${esc(it.x.yeni)}</b></span>${sel(it.no, "m", x.m)}${sel(it.no, "t", x.t)}<span class="gis" data-is="${it.no}">${esc(gecIslem(it))}</span>${vChip(it)}</div>`; }).join("")}</div>
    <div class="muted" id="gecDmOz" style="margin-top:6px">${esc(gecDmOzet())}</div></div>
    <h2>6. Standartlar ve boşluk analizi (G)</h2>
    <div class="card">${gecItems("G").map(it => { const x = r.s[it.no] || {};
      return `<div class="gstd"><div><b>${it.no}</b> ${esc(it.x.alan)} ${vChip(it)}<div class="muted">Önerilen: ${esc(it.x.oneri)}</div></div>
        <div class="grid2"><label class="f"><span>Kuruluşun kullandığı standart / yöntem</span><input class="t" data-sn="${it.no}" data-sk="std" value="${esc(x.std || "")}"></label>
        <label class="f"><span>Boşluk analizi var mı?</span><select class="t" data-sn="${it.no}" data-sk="bos"><option value=""></option>${["E", "H"].map(o => `<option ${x.bos === o ? "selected" : ""}>${o}</option>`).join("")}</select></label></div></div>`; }).join("")}</div>
    <h2>8. Kapsam önerisi ve 2006/42/AT statüsü</h2>
    <div class="card"><div class="grid2">${area("kapsam", "Önerilen akreditasyon kapsamı (EA-2/17 Md. 5, S2 formatı)")}</div>
      <div class="row"><button class="btn sec sm" id="gecKap">↺ Eşleştirme tablosundan öner</button></div><div class="grid2">${area("statu", "2006/42/AT kapsamının statüsü")}</div></div>
    <h2>9. Tanık denetim takibi</h2>
    <div class="card"><div class="grid2">
      <label class="f" style="grid-column:1/-1"><span>Tanık edilecek faaliyet / modül</span><input class="t" data-gg="tanikFaal" value="${esc(g.tanikFaal || (A.tanik[GEC_ID] || {}).plan || "")}"></label>
      <label class="f"><span>Planlanan tarih</span><input class="t" type="date" data-gg="tanikPlan" value="${esc(g.tanikPlan || (A.tanik[GEC_ID] || {}).tarih || "")}"></label>
      <label class="f"><span>Akreditasyon (geçiş) karar tarihi</span><input class="t" type="date" data-gg="karar" value="${esc(g.karar || "")}"></label></div>
      <div class="muted">En geç tamamlanma tarihi (karar + 18 ay, EA-2/17 Ek B): <b id="gecSon">${trDate(addMonths(g.karar, 18)) || "—"}</b></div></div>
    <h2>10. Sonuç ve öneri</h2>
    <div class="card"><div class="row"><button class="btn sec sm" id="gecSonOn">↺ Kontrol listesinden öner</button></div><div class="grid2">
      <label class="f" style="grid-column:1/-1"><span>Denetim ekibinin önerisi</span><select class="t" data-gg="sonuc"><option value=""></option>${GEC_SONUC.map(o => `<option ${g.sonuc === o ? "selected" : ""}>${o}</option>`).join("")}</select></label>
      ${area("aciklama", "Açıklama")}
      <label class="f" style="grid-column:1/-1"><span>Uygunsuzlukların kapatılması için süre</span><input class="t" data-gg="sure" value="${esc(g.sure || "")}"></label>
      <label class="f"><span>Baş denetçi</span><input class="t" data-gg="basDenetci" value="${esc(g.basDenetci || "")}"></label>
      <label class="f"><span>Denetçi / teknik uzman</span><input class="t" data-gg="denetciler" value="${esc(g.denetciler || "")}"></label>
      <label class="f"><span>Rapor tarihi</span><input class="t" type="date" data-gg="raporTarihi" value="${esc(g.raporTarihi || "")}"></label></div></div>
    <div class="row" style="margin-top:12px"><button class="btn" id="gecDl2">⬇ Geçiş Denetim Raporu (.docx)</button></div>`;
  bindGecGenel(p, renderGecis);
  p.querySelectorAll("[data-dn]").forEach(e => e.onchange = () => {
    (r.d[e.dataset.dn] = r.d[e.dataset.dn] || {})[e.dataset.dk] = e.value; markDirty();
    gecItems("D").forEach(it => { const s = p.querySelector(`[data-is="${it.no}"]`); if (s) s.textContent = gecIslem(it); });
    $("#gecDmOz").textContent = gecDmOzet();
  });
  p.querySelectorAll("[data-sn]").forEach(e => e.oninput = e.onchange = () => { (r.s[e.dataset.sn] = r.s[e.dataset.sn] || {})[e.dataset.sk] = e.value; markDirty(); });
  $("#gecKap").onclick = () => { if (g.kapsam && !confirm("Mevcut metnin üzerine yazılsın mı?")) return; g.kapsam = gecKapsamOneri(); markDirty(); renderGecis(); };
  $("#gecSonOn").onclick = () => { if ((g.aciklama || g.sonuc) && !confirm("Mevcut sonuç ve açıklamanın üzerine yazılsın mı?")) return; const o = gecSonucOneri(); g.sonuc = o.sonuc; g.aciklama = o.t; markDirty(); renderGecis(); };
  $("#gecDl").onclick = $("#gecDl2").onclick = exportGecis;
}

/* Kapak (yalnız geçiş denetimi) */
function renderGecisKapak() {
  const r = gec(), p = $("#pane"), m = gecMod();
  p.innerHTML = `<div class="cover"><div class="cv-top"><span class="cv-code">${m.code}</span><div><div class="muted">(AB) 2023/1230 Makine Tüzüğü › Geçiş Denetimi</div><b>${esc(m.baslik)}</b></div></div>
      <div class="kunye">${m.ozet.slice(0, 3).map(([l, x]) => `<div><b>${esc(l)}</b><span>${esc(x)}</span></div>`).join("")}
      <div><b>Çeklist</b><span>${m.items.length} madde · rapor: (AB) 2023/1230 Geçiş Denetim Raporu (F701-062 kullanılmaz)</span></div></div></div>
    <h2>Genel bilgiler ve denetim ekibi</h2>${gecGenelHtml(r)}
    <div class="row" style="margin-top:12px"><button class="btn" id="kpGo">Çeklisti başlat ›</button><button class="btn sec" id="kpRap">Geçiş Raporu ›</button><button class="btn sec" id="kpInfo">✎ Modülleri değiştir</button></div>`;
  bindGecGenel(p, renderGecisKapak);
  $("#kpGo").onclick = () => { tab = GEC_ID; renderAudit(); window.scrollTo(0, 0); };
  $("#kpRap").onclick = () => { tab = "gr"; renderAudit(); window.scrollTo(0, 0); };
  $("#kpInfo").onclick = () => editInfo(A);
}

/* ---------- Word çıktısı ---------- */
function gecData() {
  const r = gec(), g = r.g, m = gecMod();
  const V = {
    KURULUS: g.kurulus, AKRNO: g.akrno, DOSYA: g.dosya, MEVCUT: g.mevcut, TALEP: g.talep, BASVURU: trDate(g.basvuru), TUR: g.tur,
    TARIH: [trDate(g.bas), trDate(g.bit)].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(" – "), YER: g.yer, TEMSILCI: g.temsilci,
    DM_OZET: gecDmOzet(), KAPSAM_ONERI: g.kapsam, STATU2006: g.statu, TANIK_FAAL: g.tanikFaal || (A.tanik[GEC_ID] || {}).plan || "",
    TANIK_PLAN: trDate(g.tanikPlan || (A.tanik[GEC_ID] || {}).tarih), TANIK_SON: trDate(addMonths(g.karar, 18)),
    SONUC: g.sonuc, SONUC_ACIKLAMA: g.aciklama, SURE: g.sure, BAS_DENETCI: g.basDenetci, DENETCILER: g.denetciler, RAPOR_TARIHI: trDate(g.raporTarihi), SURUM: D.surum,
  };
  const L = {};
  L.EK = r.ekip.filter(e => e.ad || e.rol).map((e, i) => ({ n: i + 1, ad: e.ad, rol: e.rol, not: e.not }));
  const tot = { bolum: "TOPLAM", n: 0, U: 0, K: 0, UY: 0, UD: 0, I: 0, bos: 0 };
  L.OZ = Object.entries(GEC_BOLUM).map(([k, ad]) => { const s = stats(A, { id: GEC_ID, items: gecItems(k) });
    const o = { bolum: ad, n: s.n, U: s.U, K: s.K, UY: s.UY, UD: s.UD, I: s["İ"], bos: s.n - s.done };
    Object.keys(tot).slice(1).forEach(x => tot[x] += o[x]); return o; });
  L.OZ.push(tot);
  V.OZET_METNI = gecSonucOneri().t;
  const F = findings(A);
  const fl = f => ({ no: (f.sh.id === GEC_ID ? "" : shCode(f.sh) + " ") + f.it.no, bulgu: f.x.bulgu || f.it.t, dayanak: f.it.d, kanit: f.x.kanit || "" });
  L.UY = F.filter(f => f.x.v === "UY").map((f, i) => ({ n: i + 1, ...fl(f) }));
  L.GZ = F.filter(f => f.x.v === "K").map((f, i) => ({ n: i + 1, ...fl(f) }));
  L.DM = gecItems("D").map(it => { const x = r.d[it.no] || {}; return { no: it.no, eski: it.x.eski, yeni: it.x.yeni, mevcut: x.m || "", talep: x.t || "", islem: gecIslem(it) || it.x.ref, durum: GEC_V[gecAns(it).v] || "" }; });
  L.ST = gecItems("G").map(it => { const x = r.s[it.no] || {}, a = gecAns(it); return { no: it.no, alan: it.x.alan, oneri: it.x.oneri, std: x.std || "", bos: x.bos || "", durum: GEC_V[a.v] || "", not: [a.bulgu, a.kanit].filter(Boolean).join(" / ") }; });
  L.IT = []; let last = null;
  m.items.filter(it => !/^[DG]\./.test(it.no)).forEach(it => {
    if (it.sec !== last) { L.IT.push({ sec: D.sec[it.sec] || it.sec }); last = it.sec; }
    const a = gecAns(it);
    L.IT.push({ no: it.no, t: it.t, d: it.d, v: a.v || "—", kb: [a.kanit, a.bulgu ? "Bulgu: " + a.bulgu : ""].filter(Boolean).join("\n") });
  });
  return { V, L };
}
function gecFill(x, V, L) {
  for (const [N, arr] of Object.entries(L)) {
    const tag = "{{" + N + ":", rows = []; let pos = 0;
    while ((pos = x.indexOf(tag, pos)) >= 0) {
      const a = x.lastIndexOf("<w:tr>", pos), b = x.indexOf("</w:tr>", pos) + 7;
      if (!rows.length || rows[rows.length - 1].a !== a) rows.push({ a, b, xml: x.slice(a, b), keys: [...x.slice(a, b).matchAll(new RegExp("\\{\\{" + N + ":([a-zA-Z]+)\\}\\}", "g"))].map(m => m[1]) });
      pos = b;
    }
    if (!rows.length) continue;
    const pick = e => rows.find(t => t.keys.every(k => k in e)) || rows[rows.length - 1];
    const fill = (t, e) => t.xml.replace(new RegExp("\\{\\{" + N + ":([a-zA-Z]+)\\}\\}", "g"), (m, k) => xmlText(e[k] ?? ""));
    const main = rows[rows.length - 1];
    const out = arr.length ? arr.map(e => fill(pick(e), e)).join("") : fill(main, Object.fromEntries(main.keys.map((k, i) => [k, i === 1 ? "— (yok)" : i === 0 ? "—" : ""])));
    x = x.slice(0, rows[0].a) + out + x.slice(rows[rows.length - 1].b);
  }
  return x.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, k) => xmlText(V[k] ?? ""));
}
async function exportGecis() {
  if (!window.JSZip) return toast("Word kütüphanesi yükleniyor, birkaç saniye sonra tekrar deneyin");
  try {
    const { V, L } = gecData();
    const zip = await JSZip.loadAsync(await (await fetch("report/Gecis_Denetim_Raporu_sablon.docx")).arrayBuffer());
    for (const f of Object.keys(zip.files).filter(f => /^word\/(document|header\d*|footer\d*)\.xml$/.test(f))) zip.file(f, gecFill(await zip.file(f).async("string"), V, L));
    const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const n = (V.KURULUS || "denetim").replace(/[^\wçğıöşüÇĞİÖŞÜ-]+/g, "_").slice(0, 40);
    download(blob, `2023-1230_Gecis_Denetim_Raporu_${n}_${gec().g.bas || ""}.docx`);
    toast("Geçiş denetim raporu indirildi");
  } catch (e) { console.error(e); toast("Rapor oluşturulamadı: " + e.message); }
}
