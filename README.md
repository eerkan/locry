# Locry

Tamamen tarayıcıda, sunucusuz çalışan **şifreli not ve görev** uygulaması. Veriler cihazında, geçiş anahtarına
(passkey) bağlı bir anahtarla şifrelenmiş olarak durur; istersen Google Drive üzerinden şifreli olarak diğer
cihazlarınla eşitlenir.

- Markdown notlar (bölünmüş önizleme, etiketler, sabitleme, arşiv)
- Görevler (akıllı görünümler, listeler, alt görevler, öncelik, bitiş tarihi, sürükle-bırak)
- Passkey ile giriş, kurtarma anahtarı, otomatik kilit
- Birden fazla bağımsız kasa (ör. Kişisel ve İş), her biri kendi passkey'i ve kurtarma anahtarıyla
- Sıkıştırılmış ve şifreli `.locry` yedekleri; Google Drive'a yedekleme
- Telefon ve bilgisayar arasında Google Drive üzerinden uçtan uca şifreli eşitleme
- Tarayıcı içi yapay zekâ ile anlamsal arama (isteğe bağlı), ⌘K komut paleti
- Kurulabilir PWA, çevrimdışı çalışma, TR/EN arayüz, açık/koyu tema

## Çalıştırma

Node 24 gerekir.

```bash
nvm use
yarn install
```

**Geliştirme** (anında yenileme, service worker yok):

```bash
yarn start
```

**Günlük kullanım** (production derlemesi, çevrimdışı çalışır, kurulabilir):

```bash
yarn serve:prod
```

İkisi de `http://localhost:4200` adresini kullanır; aynı adres olduğu için veriler ve passkey'ler ortaktır.
Tarayıcı adres çubuğundaki "Yükle" simgesiyle Locry'yi masaüstü uygulaması olarak kurabilirsin.

> Adres önemli: passkey'ler `localhost` alan adına, veriler ise `http://localhost:4200` kaynağına bağlıdır.
> Başka bir portta açarsan boş bir kasa görürsün. Passkey'ler IP adresinde çalışmadığından `127.0.0.1` (ör. Docker
> Desktop'taki bağlantı) otomatik olarak `localhost`'a yönlendirilir.

### Docker

Node kurmadan, bir konteynerde çalıştırmak için:

```bash
docker compose up -d --build
```

Uygulama varsayılan olarak `http://localhost:4200` adresinde açılır. Durdurmak için `docker compose down`.

Port ve dinlenecek adres `.env` dosyasından okunur (yoksa varsayılanlar kullanılır):

```bash
cp .env.example .env
```

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `LOCRY_PORT` | `4200` | Host tarafındaki port → `http://localhost:<port>` |
| `LOCRY_BIND_ADDRESS` | `127.0.0.1` | Portun açılacağı arayüz; yalnızca bu makine |
| `LOCRY_GOOGLE_CLIENT_ID` | boş | Gömülü Google Client ID; kullanıcılar sadece "Google ile bağlan"a basar |
| `COMPOSE_PROFILES` | boş | `https` yazınca Caddy (otomatik HTTPS) da başlar |
| `LOCRY_DOMAIN` | boş | Caddy'nin yayınlayacağı alan adı, ör. `locry.ornek.com` |

- İmaj çok aşamalıdır: derleme Node 24 ile yapılır, son imajda yalnızca derlenmiş uygulama ve bağımlılıksız
  küçük bir sunucu bulunur. Konteyner root olmayan kullanıcıyla, salt okunur dosya sistemiyle ve yetkileri
  düşürülmüş olarak çalışır.
- Port varsayılan olarak yalnızca bu makinenin `127.0.0.1` adresine açılır; ağdaki başka cihazlar erişemez.
  `0.0.0.0` kullanma: passkey'ler ve service worker güvenli bağlam ister, diğer cihazlar bunu yalnızca HTTPS ile alır.
- **Konteynerde veri yoktur.** Notlar, görevler ve anahtarlar tarayıcıda şifreli durur; konteyneri silmek ya da
  yeniden oluşturmak veriyi etkilemez, bu yüzden volume gerekmez. Yedek için uygulamadaki yedekleme özelliklerini kullan.
- `LOCRY_PORT`'u değiştirirsen tarayıcı bunu ayrı bir site sayar: yeni adreste boş bir kasa görürsün (passkey'ler
  porttan bağımsız çalışır; eski verileri yedekle taşıyabilirsin). Google Drive kullanıyorsan yeni adresi OAuth
  istemcisinin "Authorized JavaScript origins" listesine ekle.
- Varsayılan portta `yarn start` ile konteyner aynı portu kullanır; ikisini aynı anda çalıştırma.

### Alan adında (HTTPS) yayınlama

Locry'yi bir alan adında da çalıştırabilirsin; localdeki kullanım bununla birlikte çalışmaya devam eder.
Passkey'ler, service worker ve tarayıcı şifrelemesi güvenli bağlam ister, yani alan adında **HTTPS şarttır**.
Compose dosyasındaki isteğe bağlı Caddy servisi sertifikayı otomatik alır ve yeniler. `.env`:

```bash
COMPOSE_PROFILES=https
LOCRY_DOMAIN=locry.ornek.com
```

```bash
docker compose up -d --build
```

Alan adının DNS kaydı bu sunucuyu göstermeli ve 80/443 portları dışarıdan erişilebilir olmalı.

**Her adres ayrı bir kasadır.** Passkey'ler oluşturuldukları adrese (`localhost`, `locry.ornek.com`), tarayıcı
verileri de adrese bağlıdır. Verileri taşımak için:

1. Bir adreste yedek al (dosya ya da Google Drive).
2. Diğer adreste **Yedekten geri yükle**. Yedeğin passkey'leri o adreste çalışmadığı için Locry doğrudan
   **kurtarma anahtarını** ister.
3. Geri yüklemeden hemen sonra o adres için yeni bir passkey oluştur (Locry bunu önerir).

Ayarlar'daki passkey listesi her passkey'in hangi adrese ait olduğunu gösterir. Google Drive kullanıyorsan alan
adını da OAuth istemcisinin *Authorized JavaScript origins* listesine ekle.

## Kasalar

Birden fazla kasa kullanabilirsin: kenar çubuğundaki kasa adına tıkla → **Yeni kasa**. Her kasanın kendi
passkey'i, kurtarma anahtarı, veritabanı, yedekleri ve ayarları vardır; aynı anda yalnızca biri açıktır.
Kasa değiştirmek açık kasayı kilitler. Kasa adları kilit ekranında görünebilmesi için şifrelenmez, bu yüzden
içerik hakkında bilgi vermeyen adlar seç. Yedekten geri yüklerken kasa bu cihazda varsa yedek ona birleştirilir,
yoksa ayrı bir kasa olarak eklenir. Kasa silme yalnızca bu cihazdaki veriyi siler; yedeklere dokunmaz.

## Güvenlik modeli

| Konu | Uygulama |
|---|---|
| Kasa anahtarı | Rastgele 256 bit, yalnızca bellekte ve dışa aktarılamaz `CryptoKey` olarak |
| Passkey ile açma | WebAuthn **PRF** uzantısı → HKDF-SHA-256 → kasa anahtarını açan anahtar |
| Kurtarma | 256 bit kurtarma anahtarı (Base32, sağlama toplamlı) ayrı bir anahtar yuvasında |
| Veri | Her kayıt ayrı AES-256-GCM; kayıt türü ve kimliği AAD ile bağlı |
| Yedek | `gzip` → AES-256-GCM; başlık AAD ile bağlı, anahtar yuvaları başlıkta |
| Önizleme | DOMPurify; dış görseller yüklenmez; ek olarak İçerik Güvenliği Politikası (CSP) |
| Depolama | Tarayıcıdan kalıcı depolama istenir; durum Ayarlar'da görünür |

Dışarıya yalnızca senin açtığın özellikler bağlanır: Google Drive yedeği ve eşitlemesi (`www.googleapis.com`) ve
anlamsal arama modelinin ilk indirmesi (`huggingface.co`). Notların cihazdan yalnızca şifreli olarak çıkar.

Passkey PRF desteği: Chrome/Edge 118+, Safari 18+; iCloud Anahtar Zinciri, Google Parola Yöneticisi,
1Password veya bir donanım güvenlik anahtarı.

## Google Drive yedeği

Kullanıcı için: **Ayarlar → Google Drive → Google ile bağlan**. Yedekler Drive'da yalnızca Locry'nin erişebildiği
gizli uygulama klasörüne (`appDataFolder`) şifreli olarak yazılır.

Bunun için kurulumu çalıştıran kişinin **bir kez** bir Google OAuth Client ID alıp `.env`'deki
`LOCRY_GOOGLE_CLIENT_ID` değişkenine yazması gerekir (gizli değildir, client secret gerekmez):

1. [console.cloud.google.com](https://console.cloud.google.com) adresinde bir proje oluştur, **Google Drive API**'yi etkinleştir.
2. **OAuth consent screen**: External; uygulama adı, destek e-postası ve gizlilik politikası bağlantısı.
3. **Credentials → Create credentials → OAuth client ID** → *Web application*;
   **Authorized JavaScript origins**: `http://localhost:4200` (kullanılan diğer portlar da).
4. Uygulamayı yayınla (*In production*). Locry yalnızca `drive.appdata` iznini ister; Google bunu hassas olmayan
   (non-sensitive) izin olarak sınıflandırır, güvenlik incelemesi gerekmez. *Testing* durumunda yalnızca eklenen
   test kullanıcıları bağlanabilir.

Değer çalışma anında `/config.json` olarak okunur: Docker'da `.env`'i değiştirip `docker compose up -d` yeterlidir,
`yarn start` ve `yarn serve:prod` de `.env`'i okur. `LOCRY_GOOGLE_CLIENT_ID` boşsa her kullanıcı Ayarlar'da kendi
Client ID'sini girebilir; bu seçenek gömülü bir ID varken de **Gelişmiş** olarak durur.

## Cihazlar arası eşitleme (telefon + bilgisayar)

Bir kasayı birden fazla cihazda kullanmak için Google Drive aracı olarak kullanılır; sunucu yoktur.

**Kurulum**

1. Locry'yi bir alan adında HTTPS ile yayınla ([Alan adında yayınlama](#alan-adında-https-yayınlama)). Telefon
   bilgisayardaki `localhost`'a ulaşamaz; passkey'ler de adrese bağlıdır, bu yüzden iki cihazda da aynı adresi
   (`https://locry.ornek.com`) kullanmak en kolayıdır.
2. Google Cloud'daki OAuth istemcisinin *Authorized JavaScript origins* listesine `https://locry.ornek.com` ekle.
   Uygulama *Testing* durumundaysa Google hesabını *Test users* listesine ekle ya da uygulamayı yayınla.
3. Bilgisayarda: **Ayarlar → Cihazlar arası eşitleme → Eşitlemeyi aç**.
4. Telefonda: adresi aç (iPhone'da Safari → Paylaş → *Ana Ekrana Ekle*; Android'de Chrome → *Uygulamayı yükle*),
   **Yedekten geri yükle → Google Drive'dan geri yükle**, *Eşitlenen kasalar* altından kasayı seç ve aç:
   - passkey'lerin iCloud Anahtar Zinciri / Google Parola Yöneticisi ile eşitleniyorsa aynı passkey çalışır;
   - çalışmıyorsa (başka adres ya da başka ekosistem) kurtarma anahtarıyla aç; Locry bu cihaz için passkey önerir.
   Kasa eklenir ve eşitlemesi kendiliğinden açılır.

**Nasıl çalışır**

- Her cihaz Drive'daki gizli uygulama klasörüne kasanın kendi şifreli kopyasını yazar ve diğer cihazlarınkini
  okuyup birleştirir. Her dosyaya yalnızca bir cihaz yazdığından cihazlar birbirinin yazdığını ezemez. Google
  yalnızca dosya adını, boyutunu, zamanını ve cihaz türünü (ör. "iPhone · Safari") görür.
- Silmeler silme kaydı olarak taşınır (90 gün tutulur). Bir cihazda silinen, diğerinde düzenlenen kayıtta
  düzenleme kazanır.
- Aynı not iki cihazda değiştirildiyse yeni sürüm kalır, eskisi "(çakışma)" adlı ayrı bir not olarak saklanır.
  Görev ve listelerde son değişiklik kazanır.
- Kasada eklenen/kaldırılan passkey'ler, yenilenen kurtarma anahtarı, kasa adı ve rengi de eşitlenir.
  Akıllı arama vektörleri eşitlenmez; her cihaz kendisi hesaplar.
- Eşitleme yalnızca Locry açıkken çalışır: kilidi açınca, sekmeye dönünce, değişiklikten ~30 sn sonra ve 5 dakikada
  bir. Google erişim izni yaklaşık 1 saat geçerlidir ve kilitlenince silinir; süresi dolunca kenar çubuğunda
  **Eşitlemek için Google'a bağlan** görünür, tek tıkla devam eder.

## Anlamsal arama

**Ara** sayfasından açılır. `Xenova/multilingual-e5-small` modeli (~120 MB) bir kez indirilir, tarayıcıda
önbelleğe alınır ve bir Web Worker içinde çalışır. Vektörler şifreli saklanır ve yedeklere eklenmez.

## Klavye kısayolları

`?` tuşu tüm listeyi gösterir. Öne çıkanlar: `⌘K` hızlı arama, `/` arama sayfası, `N` yeni not,
`T` yeni görev, `G N` / `G T` / `G S` gezinme, `⌘⇧L` kilitle, `⌘\` kenar çubuğu.

## Geliştirme

```bash
yarn test     # birim testleri (Vitest)
yarn build    # production derlemesi → dist/locry
```

Mimari ve fazlar: [docs/PLAN.md](docs/PLAN.md).
