# Ürün Tanık Denetim — 2014/33/AB

2014/33/AB Asansör Direktifi (Asansör Yönetmeliği) kapsamında onaylanmış kuruluşların **modül bazlı akreditasyon denetimi** için çevrimdışı çalışan çeklist uygulaması (PWA).

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
| Tüm denetimler | Ortak Şartlar (Md. 24, 26, 30, 32–34, 36) | 31 |

Dayanak: 2014/33/AB Ek IV–XII · EA-2/17 M:2026 (rev05) + S1:2026 · NB-L RfU derlemesi 16.07.2026.

## Özellikler
- Denetim başına modül seçimi (birden fazla modül tek denetimde)
- U / K / UY / UD / İ değerlendirme kodları, kanıt ve bulgu notları, kamera ile fotoğraf
- Filtre (boş / UY / K / notlu) ve arama
- Tanık planı (EA-2/17 Annex B Tablo 2 gruplaması)
- Otomatik özet ve bulgu listesi
- **TÜRKAK F701-062 Rev.03** (Ürün Belgelendirme Kuruluşları için Tanık Denetim Raporu) formunun uygulama içinde doldurulması ve resmî şablon üzerine işlenmiş **Word (.docx)** çıktısı; Bölüm 2.4 ve Bölüm 3 çeklist sonuçlarından otomatik önerilir
- Excel (.xlsx) dışa aktarma, yazdır / PDF, JSON yedek ve içe aktarma (cihazlar arası aktarım, fotoğraflar dahil)
- Tamamen çevrimdışı; veriler yalnız cihazda (IndexedDB) saklanır

## Kurulum
- **Windows masaüstü:** Edge veya Chrome ile adresi açın → adres çubuğundaki *Uygulamayı yükle* simgesi. Başlat menüsünde ayrı uygulama olarak açılır.
- **iPhone / iPad:** Safari ile açın → Paylaş → *Ana Ekrana Ekle*.
- **Android:** Chrome ile açın → ⋮ → *Uygulamayı yükle* (veya *Ana ekrana ekle*).

## Geliştirme
Derleme adımı yoktur; statik dosyalar GitHub Pages'ten yayınlanır. Çeklist içeriği `data.js`, F701-062 form yapısı `f62.js`, Word şablonu `report/F701-062_sablon.docx` (yer tutuculu) dosyasındadır. İçerik değiştiğinde `sw.js` içindeki `CACHE` sürümü artırılmalıdır.
