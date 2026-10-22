# Locry — Proje Planı

Tamamen tarayıcıda, backend olmadan çalışan; şifreli **todo listesi** ve **Markdown not** uygulaması.

## Temel ilkeler

- **Backend yok.** Tüm veri tarayıcıda (IndexedDB) tutulur. Dışarıya çıkan tek trafik: kullanıcının açıkça başlattığı Google Drive yedeklemesi ve ilk açılışta embedding modelinin indirilmesi.
- **Her şey şifreli.** Diskte (IndexedDB) ve yedeklerde düz metin bulunmaz. Şifre çözme anahtarı yalnızca bellekte, kasa açıkken durur.
- **Parola yok, geçiş anahtarı (passkey) var.** Kurtarma için tek seferlik gösterilen bir kurtarma anahtarı.
- **Arayüz:** Angular 22 + Spartan UI + Tailwind v4, TR/EN çalışma anında değiştirilebilir.

## Teknoloji seçimleri

| Konu | Seçim | Neden |
|---|---|---|
| UI | Angular 22 (standalone, signals, zoneless), Spartan UI (vega), Tailwind v4 | Kurulu altyapı |
| İkonlar | `@ng-icons/lucide` | Spartan ile uyumlu |
| i18n | `@jsverse/transloco` | Çalışma anında dil değiştirme (Angular'ın yerleşik i18n'i derleme zamanlı) |
| Depolama | IndexedDB (`idb`) | Büyük veri, ikili veri, kota |
| Kriptografi | Web Crypto API (AES-256-GCM, HKDF-SHA-256) | Tarayıcı yerleşik, ek bağımlılık yok |
| Passkey | WebAuthn + **PRF uzantısı** | Passkey'den şifreleme anahtarı türetmenin standart yolu |
| Sıkıştırma | `CompressionStream('gzip')` | Tarayıcı yerleşik |
| Markdown | `marked` + `DOMPurify` | Hızlı, XSS'e karşı temizlenmiş çıktı |
| Anlamsal arama | `@huggingface/transformers` (Web Worker, WebGPU → WASM yedek), `multilingual-e5-small` | Tarayıcı içi, çok dilli (TR/EN), ~120 MB |
| Drive | Google Identity Services (token client) + Drive REST v3, `drive.appdata` kapsamı | Backend gerektirmez, sadece uygulamaya ait gizli klasör |
| Test | Vitest (Angular CLI) + `fake-indexeddb` | |

## Güvenlik mimarisi

### Anahtar hiyerarşisi

```
Kasa Anahtarı (VK)  — rastgele 256 bit, tüm veriyi şifreler, asla düz halde saklanmaz
 ├─ Anahtar yuvası: passkey #1  →  KEK = HKDF(PRF çıktısı, tuz)  →  AES-GCM(KEK, VK)
 ├─ Anahtar yuvası: passkey #2  →  ...
 └─ Anahtar yuvası: kurtarma    →  KEK = HKDF(kurtarma anahtarı 256 bit)  →  AES-GCM(KEK, VK)
```

- **Passkey ile açma:** `navigator.credentials.get()` + `prf.eval` → authenticator'dan 32 baytlık gizli değer → KEK → VK çözülür. Kullanıcı doğrulaması (biyometri/PIN) zorunlu.
- **Kurtarma anahtarı:** 256 bit rastgele, Crockford Base32 olarak gruplanmış gösterilir (ör. `7K3M-Q9XA-...`), yalnızca kurulumda bir kez gösterilir; doğrulama istenir.
- **Passkey'ler yedeklenebilir mi?** Passkey'in özel anahtarı authenticator'dan hiç çıkmaz; senkronizasyonu iCloud Keychain / Google Password Manager / 1Password yapar. Yedeğe **anahtar yuvaları** (passkey kimliği + o passkey ile sarılmış VK) dahil edilir, böylece senkronlanan passkey başka bir cihazda yedeği açabilir. Hiç passkey yoksa kurtarma anahtarı açar.
- **rpId** `localhost`'tur; uygulama aynı origin'de (`http://localhost:4200`) çalıştığı sürece passkey'ler geçerlidir.
- **PRF desteği yoksa** (eski tarayıcı/authenticator) kurulum net bir hata mesajıyla durur; şifresiz moda düşülmez.

### Kayıt şifreleme

- Her kayıt (not, görev, ayar, embedding) ayrı şifrelenir: `AES-GCM(VK, iv=rastgele 96 bit, aad = "locry:v1:<tür>:<id>")`.
  AAD sayesinde şifreli bir kaydın başka bir kayıtla yer değiştirmesi tespit edilir.
- IndexedDB'de düz tutulan tek şey: kayıt kimliği, türü ve kasa başlığı (anahtar yuvaları, sürüm). Başlık, çözülebildiğini doğrulamak için şifreli bir doğrulama değeri içerir.
- **Otomatik kilit:** hareketsizlikte (varsayılan 10 dk, ayarlanabilir) ve elle; kilitlenince VK bellekten atılır. Sayfa yenilenince kasa kilitli açılır.

### Yedek dosyası (`.locry`)

```
[magic "LOCRY" + sürüm] [başlık JSON: anahtar yuvaları, iv, oluşturulma tarihi] [AES-GCM( gzip( tüm kayıtların JSON'u ) )]
```

- Önce sıkıştırılır, sonra şifrelenir. Embedding'ler yedeğe girmez (geri yüklemede yeniden üretilir).
- Geri yükleme: passkey ya da kurtarma anahtarı ile; **birleştir** veya **değiştir** seçeneği.
- Aynı format hem yerel dosya dışa/içe aktarma hem Google Drive için kullanılır.

## Fazlar

### Faz 1 — Temel altyapı ve güvenli kasa ✅ tamamlandı
- Uygulama iskeleti: kenar çubuğu düzeni, yönlendirme, açık/koyu tema, TR/EN
- Kripto çekirdeği: AES-GCM, HKDF, anahtar yuvaları, Base32 kurtarma anahtarı
- Şifreli IndexedDB depolama katmanı
- Passkey (PRF) ile kasa oluşturma ve açma, kurtarma anahtarı ile açma
- Kurulum sihirbazı, kilit ekranı, kurtarma ekranı, otomatik kilit, route guard
- Birim testleri (kripto, anahtar yuvaları, depolama)

### Faz 2 — Notlar ve görevler ✅ tamamlandı
- ✅ Markdown notlar: düzenle/bölünmüş/önizleme modları, araç çubuğu ve kısayollar (⌘B/⌘I/⌘K),
  liste devamı, önizlemeden görev kutusu işaretleme, etiketler, sabitleme, arşiv, otomatik kayıt,
  boş notların otomatik silinmesi, Türkçe karakter duyarsız arama
- ✅ Önizleme güvenliği: DOMPurify ile temizleme, dış görseller yüklenmez, bağlantılar `noopener noreferrer`
- ✅ Görevler: Gelen kutusu / Bugün (gecikenler dahil) / Yaklaşan / Tamamlananlar görünümleri,
  renkli kullanıcı listeleri (silinince görevler Gelen kutusuna taşınır), sürükle-bırak sıralama,
  öncelik, bitiş tarihi, alt görevler, açıklama, nota bağlama, kenar çubuğunda bugünkü görev rozeti
- ✅ Notlar ve görevler ortak şifreli koleksiyon altyapısını (`injectEncryptedCollection`) kullanır
- ✅ Notlar listesinde metin arama (bellekte, çözülmüş veri üzerinde); notlar ve görevlerde ortak arama sayfası Faz 5 ile gelecek

### Faz 3 — Yedekleme ve passkey yönetimi ✅ tamamlandı
- ✅ `.locry` dışa/içe aktarma: gzip + AES-256-GCM, başlık AAD ile bağlı; birleştir (son yazan kazanır) / değiştir,
  tek IndexedDB işleminde atomik yazım
- ✅ Yeni cihazda kurulum ekranından yedekle başlama (eşitlenmiş passkey veya yedeğin kurtarma anahtarı ile)
- ✅ Ayarlar: passkey ekle (mevcut passkey veya kurtarma anahtarıyla yeniden doğrulama, aynı cihazda
  tekrar kayıt engellenir) / yeniden adlandır / kaldır (son passkey korunur), kurtarma anahtarını yenile
  (onaylanana kadar eskisi geçerli), son yedek tarihi

### Faz 4 — Google Drive ✅ tamamlandı
- ✅ Kullanıcının kendi Google Cloud Client ID'si (kurulum adımlarıyla), GIS token modeli, `drive.appdata` kapsamı;
  Google betiği yalnızca Drive kullanılınca yüklenir, erişim belirteci yalnızca bellekte tutulur ve kilitlenince silinir
- ✅ Drive'a yedekle (5 MB üstü için resumable yükleme), listele, geri yükle (birleştir/değiştir), sil;
  bu kasanın son N yedeği tutulur, başka kasaların yedeklerine dokunulmaz
- ✅ Yeni cihazda kurulum ekranından Drive'dan başlama
- ✅ Otomatik yedek (günlük/haftalık, uygulama açıkken); belirteç yoksa tıklanabilir bildirimle sorulur

### Faz 5 — Anlamsal arama (local LLM) ✅ tamamlandı
- ✅ Web Worker içinde Transformers.js 4, `Xenova/multilingual-e5-small` (q8, ~120 MB, WASM). Ölçüm: TR/EN test
  sorgularında fp32 ile aynı kalite (8/9 ilk sırada), `paraphrase-multilingual-MiniLM-L12-v2`'den daha iyi.
  ONNX çalışma zamanı uygulamayla birlikte sunulur (CDN yok); internete yalnızca model indirilirken çıkılır.
- ✅ İsteğe bağlı (varsayılan kapalı); not ve görevler parçalara bölünüp vektörlenir, vektörler şifreli saklanır,
  yalnızca değişen belgeler yeniden hesaplanır, yedeklere girmez
- ✅ Karma arama: kelime + anlam; anlamsal eşik sorgunun kendi skor dağılımına göre (z-skoru) belirlenir
- ✅ Arama sayfası (Tümü/Notlar/Görevler, vurgulu alıntılar), ⌘K komut paleti, notta "benzer notlar",
  aramadan göreve doğrudan geçiş, Ayarlar'da akıllı arama kartı

### Faz 6 — Cilalama ✅ tamamlandı
- ✅ PWA: kurulabilir, çevrimdışı açılır (Angular service worker), yeni sürüm bildirimi, Locry ikonları
  (normal + maskelenebilir); `yarn serve:prod` ile yerel production sunucusu (yalnızca localhost)
- ✅ İçerik Güvenliği Politikası (CSP); kalıcı depolama isteği ve kullanım bilgisi
- ✅ Klavye kısayolları (`?` yardım), kilit sonrası kalınan sayfaya dönüş (`?next=`, açık yönlendirme korumalı),
  çevrilmiş sayfa başlıkları
- ✅ Lighthouse: erişilebilirlik / en iyi uygulamalar / SEO 100

### Faz 7 — Çoklu kasa ✅ tamamlandı
Kararlar: kasalar tamamen bağımsız (ayrı anahtar, passkey, kurtarma anahtarı, yedek ve ayarlar);
aynı anda yalnızca biri açık.
- ✅ Kasa kaydı ayrı bir IndexedDB'de (`locry-vaults`): kimlik, ad, renk, sıra. Kilit ekranında gösterilebilmesi
  için ad ve renk şifresiz; içerik ve anahtarlar her zamanki gibi şifreli.
- ✅ Her kasanın ayrı IndexedDB'si (`locry-vault-<vaultId>`); tek kasalı sürümün `locry` veritabanı ilk açılışta
  kasa olarak kayda alınır, veri taşınmaz.
- ✅ Kilit ekranında kasa seçici (son kullanılan hatırlanır), "Yeni kasa", "Yedekten kasa ekle"; kenar çubuğunda
  kasa değiştirici (açık kasayı kilitleyip seçilenin kilit ekranına gider); Ayarlar'da ad / renk / silme
  (passkey ya da kurtarma anahtarıyla yeniden doğrulama; dosya ve Drive yedeklerine dokunulmaz).
- ✅ Passkey'ler parola yöneticisinde "Locry · <kasa adı>" olarak görünür. Planlanan "kasayı passkey'den bulma"
  yapılmadı: her kasanın PRF tuzu farklı ve passkey seçilmeden doğru tuzu vermek `evalByCredential` ister
  (Safari desteği belirsiz); aynı `user.id` bazı parola yöneticilerinde eski passkey'in üzerine yazabilir.
- ✅ Kasa başına tercihler (son yedek, Drive otomatik yedek / saklama, akıllı arama); dil, tema, otomatik kilit
  ve Client ID uygulama genelinde. Vektör dizini kasanın kendi veritabanında.
- ✅ Kasa adı ve rengi yedeğin şifreli içeriğinde taşınır. Kilit ekranından geri yükleme: aynı kimlikli kasa
  varsa onu açıp birleştirir, yoksa yeni kasa olarak ekler.
- ✅ Testler: kasa ayrımı ve geçiş, yeniden yüklemede son kasa, yeniden adlandırma, eski veritabanının kayda
  alınması, silme, yedekten ayrı kasa ekleme ve aynı kasaya birleştirme.

### Faz 8 — Cihazlar arası eşitleme (telefon + bilgisayar) ⏳ planlandı
Kararlar: kendi alan adında HTTPS (Caddy profili), Drive üzerinden otomatik eşitleme, çakışmada kopya.
- **Silme kayıtları (tombstone):** silinen kayıt yerine şifreli bir silme işareti kalır, böylece silmeler
  diğer cihazlara geçer; 90 günden eski işaretler temizlenir. Yedeklerdeki birleştirme de bunu kullanır.
- **Eşitleme dosyaları:** Drive `appDataFolder` içinde her cihaz yalnızca kendi dosyasına yazar
  (`sync-<vaultId>-<deviceId>.locry`, mevcut yedek biçimi: gzip + AES-256-GCM). Diğer cihazların
  dosyaları okunup birleştirilir; aynı dosyaya iki cihaz yazmadığı için yazma çakışması olmaz.
  Google yalnızca dosya adı, boyut ve zamanı görür.
- **Kasa başlığı eşitlenir:** anahtar yuvaları birleşir (silinen yuvalar da işaretlenir), telefonda eklenen
  passkey bilgisayarda da görünür. iCloud Anahtar Zinciri / Google Parola Yöneticisi ile eşitlenen passkey
  her cihazda aynı PRF anahtarını verir; farklı ekosistemde cihaz başına passkey eklenir.
- **Çakışma:** her kaydın son eşitlenen sürümü yerelde tutulur. Kayıt iki tarafta da değiştiyse yeni olan
  kalır; notlarda diğeri "(çakışma)" kopyası olarak saklanır, görevlerde son değişen kazanır.
- **Zamanlama:** kilit açılınca, sekmeye dönünce, değişiklikten ~30 sn sonra ve 5 dakikada bir; yalnızca
  uygulama açıkken. Google belirteci (~1 saat) sessizce yenilenmeye çalışılır, olmazsa kenar çubuğundaki
  durum göstergesi "Eşitlemek için bağlan" der. Vektörler eşitlenmez, her cihaz kendisi dizinler.
- **Yeni cihaz:** kurulum ekranında "Drive'daki kasaya bağlan" → Google → kasa seç → passkey ya da kurtarma
  anahtarı → bu adres için passkey önerisi.
- **Mobil:** küçük ekranda kenar çubuğu, not düzenleyici ve görev ayrıntısı; güvenli alanlar; iOS/Android'de
  ana ekrana ekleme. Belgeler: alan adı + Caddy, OAuth istemcisine alan adının eklenmesi.
- Testler: tombstone birleştirme, çakışma kopyası, başlık birleştirme, iki sahte cihazla uçtan uca eşitleme.

## Kurulum notları

- Node 24 gerekir (`.nvmrc`): `nvm use`
- Geliştirme: `yarn start` → http://localhost:4200
- Günlük kullanım (çevrimdışı, kurulabilir): `yarn serve:prod` → http://localhost:4200
- Passkey PRF desteği: Chrome/Edge 118+, Safari 18+; macOS'ta iCloud Keychain, Google Password Manager, 1Password veya donanım anahtarı.
