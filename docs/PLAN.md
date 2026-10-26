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

### Faz 8 — Cihazlar arası eşitleme (telefon + bilgisayar) ✅ tamamlandı
Kararlar: kendi alan adında HTTPS (Caddy profili), Drive üzerinden otomatik eşitleme, çakışmada kopya.
- ✅ **Silme kayıtları:** notlar, görevler ve listeler silinince şifreli bir silme kaydı kalır (90 gün); vektörler ve
  eşitleme durumu yalnızca cihazda tutulur, eşitlenmez ve yedeklere girmez.
- ✅ **Eşitleme dosyaları:** her cihaz yalnızca kendi dosyasına yazar (`appDataFolder`, yedek biçimi + silme
  kayıtları; `locrySync`, kasa ve cihaz kimliği uygulama özelliği olarak). Değişmeyen içerik yeniden yüklenmez;
  görülen dosyalar `modifiedTime` ile atlanır. Eşitleme kopyaları yedek listesinde görünmez, budamaya girmez.
- ✅ **Üç yönlü birleştirme:** kayıt başına son anlaşılan sürüm yerelde şifreli tutulur. Tek tarafta değişen alınır;
  iki tarafta değişende düzenleme silmeyi yener, notlarda eski sürüm "(çakışma)" kopyası olur, görevlerde son
  değişen kazanır. Görev sıralaması artık `updatedAt`'i günceller.
- ✅ **Kasa başlığı:** passkey yuvaları birleşir, kaldırılan yuvalar ve eski kurtarma anahtarı `removedSlotIds` ile
  geri gelmez. Başlık, kasa anahtarıyla açılan dosyanın AAD'si olduğundan değiştirilemez. Kasa adı ve rengi de
  (zaman damgasıyla) eşitlenir.
- ✅ **Zamanlama:** kilit açılınca, sekmeye dönünce, değişiklikten 30 sn sonra, 5 dakikada bir; yalnızca açıkken.
  Belirteç yoksa arka planda açılır pencere açılmaz; kenar çubuğu "Eşitlemek için Google'a bağlan" der.
- ✅ **Arayüz:** Ayarlar'da eşitleme kartı (aç/kapat, durum, son eşitleme, eşitleyen cihazlar), kenar çubuğunda
  durum göstergesi, arka planda çakışma olursa bildirim.
- ✅ **Yeni cihaz:** geri yükleme ekranında "Eşitlenen kasalar" → kasa eklenir, eşitlemesi açılır.
- ✅ **Mobil:** menüden sayfa seçilince yan menü kapanır; dar ekranda not, görev, ayarlar ve kilit ekranı kontrol
  edildi. Belgeler: README'de kurulum adımları ve çalışma şekli.
- ✅ Testler: birleştirme kuralları, başlık birleştirme, iki sahte cihazla uçtan uca eşitleme (düzenleme, silme,
  çakışma, passkey ve kasa adı), belirteç yokken bekleme, eşitleme kopyalarının yedeklerden ayrı tutulması.

### Faz 9 — Tanıtım sayfası, SEO ve yapay zekâ aramaları ✅ tamamlandı
Kararlar: `/` Türkçe, `/en` İngilizce landing; uygulama adresleri aynen (giriş `/app`); açık kaynak (GitHub);
gerçek ekran görüntüleri.
- ✅ Angular statik ön-üretim (`outputMode: static`) + hydration yalnızca `/` ve `/en` için; diğer rotalar
  `index.csr.html` ile istemcide. Kasa, IndexedDB, `localStorage` ve `location` kullanan kod sunucu tarafında çalışmaz.
  Artımlı hydration ve olay tekrarı kapalı (satır içi betik ister, CSP yasaklar).
- ✅ İçerik: başlık, kısaca Locry (alıntılanabilir tanım + olgular), özellikler, görevler, şifreleme şeması ve
  güvenlik modeli, çoklu kasa, eşitleme, akıllı arama, karşılaştırma, kendi sunucunda çalıştırma, SSS, CTA.
  Bu cihazda kasa varsa düğmeler "Kasanı aç" olur (hydration sonrası).
- ✅ SEO: meta, canonical, hreflang, OG/Twitter kartları, JSON-LD (SoftwareApplication, SoftwareSourceCode,
  WebSite, WebPage, FAQPage, HowTo), robots.txt, sitemap.xml, llms.txt, uygulama sayfalarında noindex.
  Adresler sunucuda `LOCRY_SITE_URL` / `LOCRY_DOMAIN` ile doldurulur.
- ✅ Görseller: `scripts/screenshots.mjs` (Chrome + sanal passkey + örnek veri, TR/EN, açık/koyu, AVIF/WebP,
  1080/2160 srcset), `scripts/og-images.mjs`. Tema betiği ilk boyamadan önce çalışır (titreme yok).
- ✅ Sunucu: ön-üretilmiş sayfalar, brotli/gzip, yalnızca hash'li dosyalar kalıcı önbellekte; service worker
  landing'i ağdan alır.
- ✅ Yol üstünde düzeltilenler: şifreli koleksiyonlarda yükleme ile yazma arasındaki yarış (yeni test), anlamsal
  aramada "her şeye benzeyen" kısa belgeler için merkez düzeltmesi (TR doğru ilk sonuç 7/12 → 9/12, EN 7/11 → 10/11,
  ilgisiz eşleşmeler yarıya indi), arama alıntılarında Markdown tablo çizgileri.
- ✅ Lighthouse: masaüstü 100/100/100/100; mobil performans 92–94, erişilebilirlik / en iyi uygulamalar / SEO 100.

### Faz 10 — Seçilebilir gömme (embedding) modelleri ✅ tamamlandı
- ✅ Beş model, kasa başına seçim: EmbeddingGemma 300M (varsayılan, q4 `no_gather` — tarayıcının WASM çalışma
  zamanında düz q4'ün GatherBlockQuantized işlemi yok), Multilingual E5 Small / Base, Snowflake Arctic Embed M v2.0,
  BGE-M3. Model kataloğunda depo, yükleme biçimi, havuzlama, önekler, boyut ve kalibrasyon.
- ✅ Ölçüm (TR/EN, 23 sorgu): doğru not ilk sırada Gemma 20/23, E5 Small/Base 19/23, Arctic ve BGE-M3 16/23.
  Model başına hubness ağırlığı, z eşiği, az belge için mutlak taban ve benzer not tabanı.
- ✅ 15'ten az belgeli kasalarda z-skoru yerine modelin mutlak tabanı.
- ✅ Model değişimi: onay penceresi (boyut, belge sayısı), işçi yeni modelle yeniden başlar, tüm belgeler yeniden
  vektörlenir, kullanılmayan model dosyaları tarayıcı önbelleğinden silinir; önceden açık kasalar E5 Small'da kalır.
- ✅ Yol üstünde: üretim sunucusunun sıkıştırma önbelleği aynı uzunluktaki yeni HTML'i eski sürümle karıştırıyordu
  (artık dosyanın değişme zamanına bağlı).

### Faz 11 — Cihazlar arası yedeklerin birleştirilmesi ✅ tamamlandı
- ✅ Drive yedekleri cihaz kimliği ve adıyla etiketlenir; budama yalnızca bu cihazın yedeklerini siler (önceden
  sık yedek alan bir cihaz, diğer cihazın tek kopyası olan yedeği silebiliyordu).
- ✅ Yedeklemeden önce diğer cihazların bu cihazın henüz birleştirmediği en yeni yedekleri birleştirilir;
  yedekler silme kayıtlarını da taşır. Otomatik yedek, yerelde değişiklik yokken de yeni bir yabancı yedek varsa çalışır.
- ✅ Birleştirme motoru düzeltildi: "onlar değiştirdi mi" artık o cihazdan en son görülen hale, "ben değiştirdim mi"
  bu cihazın en son yayınladığı hale göre. Önceki tek ortak tabanla, eski bir kopya (eski yedek ya da yeni düzenlemeyi
  henüz görmemiş bir cihaz) daha yeni bir düzenlemeyi ezebiliyordu. Dosya yedeği indirmek ve yedekten geri yüklemek
  de yayın/ortak hal sayılır; ilk karşılaşmada gereksiz çakışma kopyası oluşmaz.
- ✅ Eşitleme ve yedekleme aynı birleştirici üzerinden, sırayla çalışır (`SnapshotMerger`).
- ✅ Testler: telefon yedeğinin birleştirilmesi ve korunması, silmenin taşınması, eski yedeğin yeni düzenlemeyi
  ezmemesi, değişiklik yokken yabancı yedek için otomatik yedek, birleştirme kuralları.

### Faz 12 — Landing yeniden tasarımı ✅ tamamlandı
- ✅ Editoryal tasarım: Fraunces başlıklar, Geist metin, Geist Mono teknik etiketler; numaralı bölümler, ince
  çizgiler, tek sıcak vurgu rengi; gradyan, parıltı ve kart ızgarası yok. Şifreleme bölümünde gerçek akış şeması.
- ✅ Aydınlık / karanlık / sistem teması (başlıkta ve alt bilgide); ekran görüntüleri seçilen temaya uyar.
- ✅ Varsayılan dil İngilizce (`/`), Türkçe `/tr`; tarayıcı dili Türkçe olan ziyaretçi yönlenir, sayfada seçilen dil
  hatırlanır ve uygulamanın diline de uygulanır. `/en` → `/` kalıcı yönlendirme; hreflang, sitemap, llms.txt güncel.
- ✅ Yazı tipleri `/fonts` altında, yalnızca Latin + Latin Extended, ilk ekrandakiler önceden yüklenir (CLS 0).
- Lighthouse: masaüstü performans 99; mobil 83–88 (önceki sistem yazı tipli tasarım 92–94); diğer kategoriler 100.

### Faz 13 — 11 dil ✅ tamamlandı
- ✅ Arayüz dilleri: İngilizce (varsayılan), Türkçe ve internette en çok kullanılan diğer dokuz dil — Çince
  (basitleştirilmiş), İspanyolca, Arapça, Portekizce (Brezilya), Endonezce, Fransızca, Japonca, Rusça, Almanca.
  Dil listesi tek yerde (`core/languages.ts`): adlar, BCP 47 etiketleri, Open Graph yerelleri, yön.
- ✅ İlk açılışta tarayıcının dili seçilir (destekleniyorsa), yoksa İngilizce. Ayarlar ve menüde dil adları kendi dillerinde.
- ✅ Arapça tam sağdan sola: `<html dir="rtl">`, kenar çubuğu ve görev ayrıntısı paneli taraf değiştirir, yön bildiren
  oklar aynalanır; Spartan bileşenlerindeki fiziksel kenar boşlukları mantıksal sınıflara çevrildi.
- ✅ Çeviri testleri: her dil İngilizceyle aynı anahtarları ve aynı `{{yer tutucuları}}` taşır, hiçbiri boş değildir.
- ✅ Tanıtım sayfası 11 dilde, her biri ayrı prerender edilmiş statik HTML (`/`, `/tr`, `/zh`, `/es`, `/ar`, `/pt`,
  `/id`, `/fr`, `/ja`, `/ru`, `/de`); metinler dil başına ayrı parça olarak yüklenir. Başlıkta dil menüsü, alt bilgide
  tüm diller; `/` adresine gelen ziyaretçi tarayıcısının diline yönlenir. hreflang (11 dil + x-default), sitemap,
  llms.txt, JSON-LD çeviri ilişkileri güncel.
- ✅ Yazı tipleri: Rusça için Geist Kiril; Çince, Japonca ve Arapça sistem yazı tiplerini kullanır (önceden yükleme yok,
  eğik vurgu ve harf aralığı kapalı, Japonca başlıklar söz öbeği sınırında kırılır).
- ✅ Ekran görüntüleri her dilde yeniden alındı (o dilin örnek notları, görevleri ve arama sorgusuyla; Arapçada
  sağdan sola uygulama). OG kartları Chrome'da HTML olarak çiziliyor, Arapça ve CJK başlıklar düzgün diziliyor.
- ✅ Yol üstünde: tanıtım sayfasından uygulamaya geçince sayfanın dili/yönü uygulamanın diline geri dönüyor; dar ekranda
  karşılaştırma tablosu sayfayı taşırmıyor (Arapçada fark edildi).
- ⚠️ Çeviriler yapay zekâ ile yapıldı; ana dili konuşanların gözden geçirmesi önerilir.

### Faz 14 — Notlarına sor ✅ tamamlandı
- ✅ Sorulara kendi notlarından ve görevlerinden cevap: hibrit arama (kelime + anlam) ilgili belgeleri bulur, en iyi
  sonucun %60'ının altındakiler elenir, kalanlar numaralı kaynaklar olarak küçük bir dil modeline verilir; cevap
  akış hâlinde yazılır, `[n]` atıfları not/görev bağlantısına dönüşür, kaynak olmayan numaralar atılır.
- ✅ Üç model, cihaz başına seçim, ilk kullanımda bir kez indirme: Qwen3 0.6B (varsayılan, düşünme modu kapalı),
  Apertus 0.5B (deneysel), Gemma 3 1B. Transformers.js + WebGPU, ayrı Web Worker; `shader-f16` yoksa `q4`.
  WebGPU yoksa özellik açıklamayla devre dışı.
- ✅ Gündem soruları dilden bağımsız tanınır: soru, 11 dildeki gündem cümlelerine bulunan notlardan daha yakınsa
  (aynı gömme modeliyle, belge ölçeğinde) bir hafta içinde vadesi gelen açık görevler kaynak olur. Akıllı arama
  kapalıyken yalnızca hiçbir şey bulunamadığında.
- ✅ Kaynak yoksa model çağrılmaz ("bulamadım"); tekrar döngüleri kesilir; Markdown cevaplar düz metne çevrilir.
- ✅ Gizlilik: sohbet yalnızca bellekte, kasa kilitlenince model durdurulur ve sohbet silinir. Model dosyalarının
  temizliği gömme ve dil modelleri arasında ortak (`model-cache.ts`), biri diğerinin dosyalarını silmez.
- ✅ 11 dilde arayüz metinleri; kenar çubuğunda **Sor**, `G` `A` kısayolu, komut paletinde giriş, Ayarlar'da kart.
- ✅ Testler: istem (kaynak numaraları, görev durumu, bütçe, geçmiş), atıflar, düşünme bloğu, döngü kesme, kaynak
  yokken model çağrılmaması, zayıf sonuçların elenmesi, gündem, kilitte sohbetin silinmesi.
- Denemeler: Qwen3 ve Gemma 1–5 sn'de doğru kaynaklarla cevapladı; Apertus 0.5B tekrar edip konu dışına çıktı
  (doğru sohbet şablonu ve örneklemeyle de), bu yüzden "deneysel" olarak işaretli.

### Faz 15 — Bağış ✅ tamamlandı
- ✅ GitHub Sponsors, Buy Me a Coffee, Ko-fi, Open Collective ve kripto adresleri; hepsi isteğe bağlı ve `.env`'den
  (`LOCRY_DONATE_*`), `/config.json` ile çalışma zamanında gelir: değiştirmek için yeniden derleme gerekmez.
- ✅ Yalnızca hesap adı alınır, bağlantı her zaman platformun kendi adresine kurulur (sunucuda ve tarayıcıda iki kez
  doğrulanır); URL ya da bozuk değerler uyarıyla atlanır. Ödeme betiği, iframe ya da üçüncü taraf istek yok.
- ✅ Tanıtım sayfasında alt bilgide "Locry'yi destekle" bölümü (hydration'dan sonra, statik HTML aynı kalır), Ayarlar'da
  kart, kripto adresleri için kopyala düğmesi; 11 dilde metinler.
- ✅ Bir ayarın geçersiz olması diğerlerini artık düşürmüyor (önceden hatalı Client ID tüm config'i boşaltıyordu).
- ✅ README, `.env.example`, `compose.yaml` ve GitHub "Sponsor" düğmesi için `.github/FUNDING.yml` şablonu.

### Faz 16 — GitHub Pages ✅ tamamlandı
- ✅ `.github/workflows/pages.yml`: `main` push'unda test, derleme (`--base-href` = Pages alt yolu), hazırlama ve
  yayın; `config.json` depo değişkenlerinden (Google Client ID, bağış hesapları).
- ✅ `scripts/pages.mjs`: site adresi yer tutucusunu doldurur, dil sayfaları için `<dil>.html`, uygulama adresleri
  için `404.html`, `/en` yönlendirmesi, `.nojekyll`; service worker manifestini alt yol ve dil sayfası
  hariç tutmalarıyla yeniden üretir (ngsw-config gezinme desenlerine alt yolu kendisi eklemiyor).
- ✅ Alt yol desteği: yazı tipleri (`url(fonts/…)`, `externalDependencies` ile derlemede çözülmeden kalır), tanıtım
  görselleri, yazı tipi ön yüklemeleri ve sayfa içi bağlantılar göreli; tarayıcıda site adresi canonical'ın
  kökeni + belge tabanı.
- ✅ Pages gibi davranan yerel bir sunucuyla denendi: dil sayfaları, `404.html` ile derin bağlantılar, kasa oluşturma,
  not açma ve yeniden yükleme, service worker; kök (`/`) derleme ve Docker değişmeden çalışıyor.

## Kurulum notları

- Node 24 gerekir (`.nvmrc`): `nvm use`
- Geliştirme: `yarn start` → http://localhost:4200
- Günlük kullanım (çevrimdışı, kurulabilir): `yarn serve:prod` → http://localhost:4200
- Passkey PRF desteği: Chrome/Edge 118+, Safari 18+; macOS'ta iCloud Keychain, Google Password Manager, 1Password veya donanım anahtarı.
