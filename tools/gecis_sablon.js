/* (AB) 2023/1230 Geçiş Denetim Raporu Word şablonunu üretir → report/Gecis_Denetim_Raporu_sablon.docx
   Çalıştırma: node tools/gecis_sablon.js   (npm docx gerekir)
   Yer tutucular: {{ANAHTAR}} tekil alan; {{LISTE:alan}} içeren tablo satırı listedeki her öğe için çoğaltılır (gecis.js). */
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, AlignmentType,
  PageOrientation, Header, Footer, PageNumber, HeadingLevel, VerticalAlign } = require("docx");

const W = 15026; // A4 yatay, 1,5 cm kenar boşlukları
const NAVY = "1F3864", LIGHT = "DEE7F2", SUB = "EEF2F8";
const bd = { style: BorderStyle.SINGLE, size: 4, color: "8C9BB5" };
const borders = { top: bd, bottom: bd, left: bd, right: bd };
const t = (text, o = {}) => new TextRun({ text, size: o.size || 18, bold: o.bold, color: o.color, italics: o.it });
const p = (text, o = {}) => new Paragraph({ alignment: o.al, spacing: { before: o.before || 0, after: o.after ?? 60 }, keepNext: o.keepNext, children: [t(text, o)] });
const cell = (text, w, o = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA }, borders, columnSpan: o.span, verticalAlign: VerticalAlign.TOP,
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: "auto" } : undefined,
  margins: { top: 50, bottom: 50, left: 90, right: 90 },
  children: [new Paragraph({ alignment: o.al, children: [t(text, { bold: o.bold, color: o.color, size: o.size })] })],
});
const hdrRow = (cols, ws) => new TableRow({ tableHeader: true, cantSplit: true, children: cols.map((c, i) => cell(c, ws[i], { fill: NAVY, color: "FFFFFF", bold: true })) });
const row = (cols, ws, o = {}) => new TableRow({ cantSplit: true, children: cols.map((c, i) => cell(c, ws[i], { ...o, al: o.center && o.center.includes(i) ? AlignmentType.CENTER : undefined })) });
const table = (ws, rows) => new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: ws, rows });
const h1 = text => new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, spacing: { before: 240, after: 100 }, children: [new TextRun({ text, bold: true, size: 24, color: NAVY })] });
const kv = (pairs) => { const ws = [4200, W - 4200]; return table(ws, pairs.map(([k, v]) => new TableRow({ cantSplit: true, children: [cell(k, ws[0], { fill: LIGHT, bold: true }), cell(v, ws[1])] }))); };

const children = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: "(AB) 2023/1230 GEÇİŞ DENETİM RAPORU", bold: true, size: 32, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [t("2006/42/AT kapsamında akredite onaylanmış kuruluşların (AB) 2023/1230 Makine Tüzüğü / Makine Emniyeti Yönetmeliği (2023/1230/AB) kapsamına geçişi", { it: true, size: 18 })] }),

  h1("1. Genel bilgiler"),
  kv([
    ["Kuruluş adı", "{{KURULUS}}"], ["Akreditasyon no / NB kimlik no", "{{AKRNO}}"], ["Dosya no", "{{DOSYA}}"],
    ["Mevcut kapsam (2006/42/AT)", "{{MEVCUT}}"], ["Talep edilen kapsam ((AB) 2023/1230)", "{{TALEP}}"],
    ["Başvuru tarihi (e-TÜRKAK)", "{{BASVURU}}"], ["Denetim türü", "{{TUR}}"], ["Denetim tarihleri", "{{TARIH}}"],
    ["Denetim yeri / yöntemi", "{{YER}}"], ["Kuruluş temsilcileri", "{{TEMSILCI}}"],
    ["Denetim dayanakları", "TÜRKAK 18.10.2026 Geçiş Duyurusu; (AB) 2023/1230 ve Makine Emniyeti Yönetmeliği (2023/1230/AB; RG 16.10.2026/33402); EA-2/17 M:2026 ve S1/S2; TS EN ISO/IEC 17065 / 17021-1; Onaylanmış Kuruluşlar ve Teknik Servisler Tebliği (SGM: 2024/12); NB-M RfU'ları"],
  ]),
  p("", { after: 80 }),
  table([600, 4400, 4000, 6026], [hdrRow(["#", "Denetim ekibi üyesi", "Görevi", "İnceleme alanı / not"], [600, 4400, 4000, 6026]),
    row(["{{EK:n}}", "{{EK:ad}}", "{{EK:rol}}", "{{EK:not}}"], [600, 4400, 4000, 6026], { center: [0] })]),

  h1("2. Denetim özeti"),
  p("Kontrol listesi durum kodları: U = Uygun · K = Gözlem · UY = Uygun değil (uygunsuzluk) · UD = Uygulanamaz · İ = Değerlendirilmedi.", { after: 80 }),
  table([6026, 1300, 1300, 1300, 1300, 1300, 1300, 1200], [
    hdrRow(["Bölüm", "Madde", "U", "K", "UY", "UD", "İ", "Boş"], [6026, 1300, 1300, 1300, 1300, 1300, 1300, 1200]),
    row(["{{OZ:bolum}}", "{{OZ:n}}", "{{OZ:U}}", "{{OZ:K}}", "{{OZ:UY}}", "{{OZ:UD}}", "{{OZ:I}}", "{{OZ:bos}}"], [6026, 1300, 1300, 1300, 1300, 1300, 1300, 1200], { center: [1, 2, 3, 4, 5, 6, 7] }),
  ]),
  p("{{OZET_METNI}}", { before: 100 }),

  h1("3. Uygunsuzluklar"),
  table([700, 900, 6200, 3600, 3626], [hdrRow(["#", "Madde", "Uygunsuzluk (bulgu)", "Dayanak / ilgili şart", "Objektif kanıt"], [700, 900, 6200, 3600, 3626]),
    row(["{{UY:n}}", "{{UY:no}}", "{{UY:bulgu}}", "{{UY:dayanak}}", "{{UY:kanit}}"], [700, 900, 6200, 3600, 3626], { center: [0, 1] })]),
  p("Not: Uygunsuzluklar akreditasyonda kullanılan standardın (TS EN ISO/IEC 17065 / 17021-1) en yakın maddesine atıfla yazılır; zorunlu şart veya mevzuat şartı metinde belirtilir (EA-2/17 M:2026 Ek A Not 3).", { it: true, size: 16, before: 60 }),

  h1("4. Gözlemler (iyileştirme fırsatları / geçiş süresi içinde tamamlanacak hususlar)"),
  table([700, 900, 9800, 3626], [hdrRow(["#", "Madde", "Gözlem", "Dayanak"], [700, 900, 9800, 3626]),
    row(["{{GZ:n}}", "{{GZ:no}}", "{{GZ:bulgu}}", "{{GZ:dayanak}}"], [700, 900, 9800, 3626], { center: [0, 1] })]),

  h1("5. Kapsam eşleştirme (2006/42/AT → (AB) 2023/1230)"),
  table([700, 3400, 3400, 1100, 1100, 3826, 1500], [
    hdrRow(["No", "2006/42/AT (Ek IV / prosedür)", "(AB) 2023/1230 (Ek I / modül)", "Mevcut", "Talep", "TÜRKAK işlemi", "Durum"], [700, 3400, 3400, 1100, 1100, 3826, 1500]),
    row(["{{DM:no}}", "{{DM:eski}}", "{{DM:yeni}}", "{{DM:mevcut}}", "{{DM:talep}}", "{{DM:islem}}", "{{DM:durum}}"], [700, 3400, 3400, 1100, 1100, 3826, 1500], { center: [0, 3, 4, 6] }),
  ]),
  p("{{DM_OZET}}", { before: 80 }),

  h1("6. Standartlar ve boşluk analizi"),
  table([700, 3300, 4300, 3300, 1100, 900, 1426], [
    hdrRow(["No", "Teknik alan / Ek I kategorisi", "Önerilen standart ve dokümanlar", "Kuruluşun kullandığı standart / yöntem", "Boşluk analizi", "Durum", "Not"], [700, 3300, 4300, 3300, 1100, 900, 1426]),
    row(["{{ST:no}}", "{{ST:alan}}", "{{ST:oneri}}", "{{ST:std}}", "{{ST:bos}}", "{{ST:durum}}", "{{ST:not}}"], [700, 3300, 4300, 3300, 1100, 900, 1426], { center: [0, 4, 5] }),
  ]),

  h1("7. Kontrol listesi değerlendirme sonuçları"),
  p("Bölüm A Başvuru · B Doküman incelemesi · C Ofis denetimi · E Tanık denetim · F Karar ve kapanış (D ve G bölümleri 5. ve 6. maddelerde verilmiştir).", { after: 80 }),
  table([800, 7000, 3000, 900, 3326], [
    hdrRow(["No", "Kontrol maddesi", "Dayanak", "Durum", "İncelenen kanıt / bulgu"], [800, 7000, 3000, 900, 3326]),
    new TableRow({ cantSplit: true, children: [cell("{{IT:sec}}", W, { span: 5, fill: SUB, bold: true, color: NAVY })] }),
    row(["{{IT:no}}", "{{IT:t}}", "{{IT:d}}", "{{IT:v}}", "{{IT:kb}}"], [800, 7000, 3000, 900, 3326], { center: [0, 3] }),
  ]),

  h1("8. Kapsam önerisi ve 2006/42/AT kapsamının statüsü"),
  kv([["Önerilen akreditasyon kapsamı (EA-2/17 Md. 5, S2 formatı)", "{{KAPSAM_ONERI}}"], ["2006/42/AT kapsamının statüsü", "{{STATU2006}}"]]),

  h1("9. Tanık denetim takibi (ilk 2023/1230 faaliyeti)"),
  kv([["Tanık edilecek faaliyet / modül", "{{TANIK_FAAL}}"], ["Planlanan tarih", "{{TANIK_PLAN}}"], ["En geç tamamlanma tarihi (18 ay, EA-2/17 Ek B)", "{{TANIK_SON}}"],
    ["Kuruluşa yapılan bildirimler", "Tanık tamamlanana kadar 2023/1230 kapsamında akreditasyon markalı belge düzenlenmeyeceği; kapsam değişikliğinin 5 iş günü içinde ONTEK üzerinden STB'ye bildirilmesi; NANDO bildirimi yayımlanana kadar 2023/1230 kapsamında onaylanmış kuruluş olarak faaliyet gösterilemeyeceği."]]),

  h1("10. Sonuç ve öneri"),
  kv([["Denetim ekibinin önerisi", "{{SONUC}}"], ["Açıklama", "{{SONUC_ACIKLAMA}}"], ["Uygunsuzlukların kapatılması için süre", "{{SURE}}"]]),
  p("", { after: 120 }),
  table([5000, 5000, 5026], [hdrRow(["Baş denetçi", "Denetçi / teknik uzman", "Tarih"], [5000, 5000, 5026]),
    new TableRow({ height: { value: 900, rule: "atLeast" }, children: [cell("{{BAS_DENETCI}}", 5000), cell("{{DENETCILER}}", 5000), cell("{{RAPOR_TARIHI}}", 5026)] })]),
];

const doc = new Document({
  creator: "urun-tanik-denetim", title: "(AB) 2023/1230 Geçiş Denetim Raporu",
  styles: { default: { document: { run: { font: "Arial", size: 18 } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 2 } }, children: [
      t("TÜRKAK · (AB) 2023/1230 Geçiş Denetim Raporu · ", { size: 16, color: NAVY, bold: true }), t("{{KURULUS}}", { size: 16 })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      t("Kontrol listesi: TÜRKAK 2023-1230 Geçiş Denetim Kontrol Listesi · urun-tanik-denetim v{{SURUM}} · Sayfa ", { size: 14 }),
      new TextRun({ children: [PageNumber.CURRENT], size: 14 }), t(" / ", { size: 14 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14 })] })] }) },
    children,
  }],
});
Packer.toBuffer(doc).then(b => { const out = path.join(__dirname, "..", "report", "Gecis_Denetim_Raporu_sablon.docx"); fs.writeFileSync(out, b); console.log("yazıldı:", out, b.length); });
