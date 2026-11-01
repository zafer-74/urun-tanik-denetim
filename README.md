# Ürün Tanık Denetim — 2014/33/AB · (AB) 2023/1230

2014/33/AB Asansör Direktifi (Asansör Yönetmeliği) ve (AB) 2023/1230 Makine Tüzüğü kapsamında onaylanmış kuruluşların **modül bazlı akreditasyon denetimi** için çevrimdışı çalışan çeklist uygulaması (PWA).

**Uygulama:** https://zafer-74.github.io/urun-tanik-denetim/

## Kapsam
| Grup | Modül | Madde |
|---|---|---|
| Güvenlik aksamları (Md. 15) | A1 Modül B (Ek IV-A) | 55 |
| | A2 Modül C2 (Ek IX) | 47 |
| | A3 Modül E (Ek VI) | 51 |
| | A4 Modül H (Ek VII) | 60 |
| Asansörler (Md. 16) | L1 Modül B (Ek IV-B) | 48 |
| | L2 Son Muayene (Ek V) | 52 |
| | L3 Modül G (Ek VIII) | 43 |
| | L4 Modül E (Ek X) | 54 |
| | L5 Modül D (Ek XII) | 53 |
| | L6 Modül H1 (Ek XI) | 64 |
| Tüm asansör denetimleri | Ortak Şartlar (2014/33/AB Md. 24, 26, 30, 32–34, 36) | 31 |
| Makine ve ilgili ürünler — (AB) 2023/1230 Md. 25 | M1 Modül B (Ek VII) | 56 |
| | M2 Modül G (Ek X) | 44 |
| | M3 Modül H (Ek IX) | 56 |
| Geçiş denetimi (2006/42/AT → 2023/1230) | GD TÜRKAK 2023/1230 Geçiş Denetim Kontrol Listesi (A Başvuru · B Doküman · C Ofis · D Kapsam eşleştirme · E Tanık · F Karar · G Standartlar; ortak şart eklenmez) | 142 |
| Tüm makine denetimleri | Makine Ortak Şartlar ((AB) 2023/1230 Md. 25(5), 30, 32, 36(2), 38–40, 42) | 32 |

Dayanak: 2014/33/AB Ek IV–XII · (AB) 2023/1230 Md. 25, 30–42, Ek IV, VII, IX, X · EA-2/17 M:2026 (rev05) + S1:2026 · NB-L RfU derlemesi 16.07.2026.

Bir denetimde iki mevzuattan modül seçilirse her mevzuatın ortak şartları ayrı sayfa olarak eklenir (O, OM).

## Özellikler
- Denetim başına modül seçimi (birden fazla modül tek denetimde)
- U / K / UY / UD / İ değerlendirme kodları, kanıt ve bulgu notları, kamera ile fotoğraf
- Filtre (boş / UY / K / notlu) ve arama
- Tanık planı (EA-2/17 Annex B Tablo 2 gruplaması)
- Otomatik özet ve bulgu listesi
- **TÜRKAK F701-062 Rev.03** (Ürün Belgelendirme Kuruluşları için Tanık Denetim Raporu) formunun uygulama içinde doldurulması ve resmî şablon üzerine işlenmiş **Word (.docx)** çıktısı; Bölüm 2.4 ve Bölüm 3 çeklist sonuçlarından otomatik önerilir
- **(AB) 2023/1230 Geçiş Denetim Raporu** (GD çeklisti için; F701-062 yerine): genel bilgiler, denetim özeti, uygunsuzluk/gözlem listeleri, kapsam eşleştirme (E/H seçimi ve otomatik TÜRKAK işlemi), standart boşluk analizi, tüm kontrol listesi sonuçları, kapsam önerisi, tanık takibi (18 ay) ve sonuç — Word (.docx) çıktısı; şablon `report/Gecis_Denetim_Raporu_sablon.docx` (`tools/gecis_sablon.js` ile üretilir)
- Excel (.xlsx) dışa aktarma, yazdır / PDF, JSON yedek ve içe aktarma (cihazlar arası aktarım, fotoğraflar dahil)
- Tamamen çevrimdışı; veriler yalnız cihazda (IndexedDB) saklanır

## Kurulum
- **Windows masaüstü:** Edge veya Chrome ile adresi açın → adres çubuğundaki *Uygulamayı yükle* simgesi. Başlat menüsünde ayrı uygulama olarak açılır.
- **iPhone / iPad:** Safari ile açın → Paylaş → *Ana Ekrana Ekle*.
- **Android:** Chrome ile açın → ⋮ → *Uygulamayı yükle* (veya *Ana ekrana ekle*).

## Geliştirme
Derleme adımı yoktur; statik dosyalar GitHub Pages'ten yayınlanır. Çeklist içeriği `data.js`, F701-062 form yapısı `f62.js`, Word şablonu `report/F701-062_sablon.docx` (yer tutuculu) dosyasındadır. İçerik değiştiğinde `sw.js` içindeki `CACHE` sürümü artırılmalıdır.
