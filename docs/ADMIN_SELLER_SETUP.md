# Admin va seller tasdiqlash tizimini ishga tushirish

## Talablar

- Backend va yonidagi `Hadijam    frontend` loyihasini qayta ishga tushiring.
- MongoDB **replica set** yoki Atlas kerak: seller arizasi, rol, notification, SMS job va audit bir tranzaksiyada saqlanadi. Standalone MongoDB bu tranzaksiyalarni bajarmaydi. Mavjud `members` yoki sellerlar qayta yozilmaydi.
- Node.js 20+; backendning odatdagi `MONGODB_URI`/`MONGO_URL` va `JWT_SECRET` sozlamalari.
- Frontend `NEXT_PUBLIC_API_BASE_URL` backendning asosiy URLiga, `NEXT_PUBLIC_API_URL` esa `/graphql` URLiga yo‘naltiriladi.
- Backend yangi kolleksiyalar indekslarini yaratishi kerak. Productionda avtomatik indekslar o‘chiq bo‘lsa, deploymentdan oldin yangi Mongoose sxemalaridagi indekslarni boshqariladigan migratsiya orqali yarating.

## Yangi admin yaratish

Backend terminalida:

```bash
npm run admin:create
```

Buyruq nickname, xalqaro telefon (`+998...`, `+82...`) va yashirin parolni so‘raydi. Parol kamida 12 belgi va ko‘pi bilan 72 UTF-8 bayt bo‘ladi. Parol hash qilinadi; bir xil nickname yoki telefon mavjud bo‘lsa akkaunt almashtirilmaydi. Bu buyruqni interaktiv lokal terminalda ishlating; credentiallarni chatga yoki gitga yozmang.

Admin oddiy Sign In orqali kiradi. MyPage’da `Admin Page` tugmasi paydo bo‘ladi. ADMIN roli public signup orqali berilmaydi. UI menyusi xavfsizlik chegarasi emas: backend guardlari har so‘rovda akkauntning bazadagi hozirgi rolini tekshiradi.

Admin akkauntlarni web paneldan bloklash/o‘chirish yoki rollarini almashtirish umuman yopilgan. Bu oxirgi adminni yo‘qotishga qarshi talabdan kuchliroq himoya. Yangi admin lokal buyruqdan yaratiladi; oddiy memberni SELLER qilish faqat ariza tasdiqlash orqali bajariladi.

## Seller oqimi

1. Sign Up’da Master Jeweler tanlanadi; biznes nomi, manzil, ID va biznes hujjati kiritiladi.
2. Akkaunt USER sifatida ochiladi; hujjatlar autentifikatsiya bilan yuklanadi, keyin ariza topshiriladi.
3. Upload/ariza vaqtida xato bo‘lsa akkaunt saqlanadi. MyPage’dagi Seller Verification formasidan jarayonni davom ettiring, qayta signup qilmang.
4. Ariza `PENDING` bo‘ladi. O‘z akkauntiga va barcha faol adminlarga sayt xabarnomasi saqlanadi.
5. Admin `/admin` → Seller Applications bo‘limidan hujjatlarni yuklab ko‘radi va Activate seller yoki sabab bilan Reject qiladi.
6. Tasdiq o‘sha member ID/nickname/telefon/parolni saqlab, SELLER huquqini ochadi. Rad etilganda hujjatlarni yangilab qayta yuborish mumkin; revision oshadi, eski qaror so‘rovi qabul qilinmaydi.
7. MyPage ariza va member holatini, Messages esa inboxni har 15 soniyada yangilaydi. Faol seller bo‘lish uchun qayta ro‘yxatdan o‘tish kerak emas.

Oldindan mavjud SELLER akkauntlari o‘z holicha ishlaydi. Barcha yangi signup USER bo‘ladi, shuning uchun qo‘lda yozilgan GraphQL so‘rovi bilan SELLER huquqi olib bo‘lmaydi.

## Yopiq hujjatlar

- `POST /seller-documents`: Bearer token va multipart `file`; javob `{ documentId }`.
- `GET /seller-documents/:id`: Bearer token; faqat egasi yoki faol admin. Attachment sifatida, `no-store` bilan qaytariladi.
- PDF/JPEG/PNG, har biri 10 MB; MIME va boshlang‘ich fayl signaturasi tekshiriladi.
- Fayllar `private-documents/` yoki `PRIVATE_DOCUMENT_DIR` ichida, tasodifiy nom bilan saqlanadi. Public `/uploads` ichidagi konfiguratsiya rad etiladi. Reverse proxy ham bu katalogni public qilib tarqatmasligi kerak.
- Deployda private katalog uchun doimiy yopiq disk/volume belgilang. Bir nechta backend instance uchun umumiy yopiq storage kerak; bir martalik server diski yetarli emas.
- Yangi kolleksiyalar: `sellerApplications`, `privateDocuments`, `smsJobs`, `adminAudits`. Ariza uchun memberId, SMS uchun key unique indekslari takroriy yozishni oldini oladi.
- ID hujjatlari public Member GraphQL turiga yoki JWTga qo‘shilmaydi. Admin auditida credentiallar yoki hujjat fayllari yozilmaydi.

## GraphQL amallari

- `submitSellerApplication(input: SellerApplicationInput!)`
- `getMySellerApplication`
- `getSellerApplicationsByAdmin(input: AdminPageInput!)`
- `reviewSellerApplication(input: SellerReviewInput!)`: applicationId, revision, APPROVED/REJECTED, rad etishda reason.
- Mavjud `getMyNotifications` va `markMyNotificationRead` qayta ishlatildi; oldingi mahsulot review xabarlari saqlanadi.
- `getAdminRecords(domain, input)` va `updateAdminRecord(input)` admin panelning services/orders/orderItems/bookings/salon/requests/deliveries/reviews/articles/comments boshqaruvini ta’minlaydi. Faqat ruxsat etilgan maydonlar va status o‘tishlari qabul qilinadi.
- `sms` va `audits` domenlari faqat o‘qiladi; disabled/failed SMS uchun alohida `requeueSmsByAdmin(jobId)` mavjud.
- `AdminRecord.data` JSON string bo‘lib, panel uni tegishli formaga o‘giradi. `changes` ham JSON string; backend maydonlar, qiymatlar va o‘tishlarni tekshiradi, MongoDB operatorlari qabul qilinmaydi.
- Order umumiy statusi order itemlar holatidan hisoblanadi. Review moderatsiyasida HIDDEN public ro‘yxatdan chiqariladi, yozuv o‘chirilmaydi.
- Eski `*ByAdmin` mutatsiyalarida audit STARTED/SUCCEEDED/FAILED holatlari bilan qayd etiladi. Yangi boshqaruv amallari va seller review auditi o‘zgarish bilan bir tranzaksiyada yoziladi.

## SMS sozlash

Hozir `SMS_ENABLED=false`; sayt xabarlari baribir ishlaydi. Tasdiq SMSi `DISABLED` navbat yozuvi sifatida saqlanadi; SMS yuborildi deb ko‘rsatilmaydi. Seller arizasi telefonning SMS formatiga bog‘liq emas. Koreyaning `010XXXXXXXX` raqami SMS navbatida `+8210XXXXXXXX` formatiga o‘giriladi; noma’lum format ariza yoki sayt tasdig‘ini to‘xtatmaydi.

Gateway tayyor bo‘lganda:

```dotenv
SMS_ENABLED=true
SMS_GATEWAY_URL=https://your-sms-gateway.example/send
SMS_GATEWAY_TOKEN=your-private-gateway-token
```

Bu URL provayderga moslashtirilgan **HTTP gateway** bo‘lishi kerak; istalgan provayderning xom URLini qo‘yish yetarli emas. Gateway quyidagi shartnomani bajaradi:

- POST JSON: `{ "to": "+998901234567", "message": "...", "idempotencyKey": "seller-approved:<applicationId>:<revision>" }`.
- `Authorization: Bearer <token>` va `Idempotency-Key` headerlari.
- Faqat provayder qabul qilgach 2xx; muvaffaqiyatsizlikda non-2xx. Gateway idempotencyKey bo‘yicha qayta urinishlarni takror SMSga aylantirmasligi shart.
- Productionda HTTPS; dev testda localhost HTTP mumkin. Maxfiy kalit frontendga berilmaydi.

Yangi tasdiqlar sozlangandan so‘ng avtomatik QUEUED bo‘ladi. Eski DISABLED yoki FAILED yozuvlari admin panel → Operations → SMS delivery → Queue SMS orqali qo‘lda navbatga olinadi.

Worker har 5 soniyada bitta yozuvni atomik claim qiladi, timeout 15 soniya, lease 60 soniya. Vaqtinchalik xatolarda eksponensial interval bilan maksimal 5 urinish bor; keyin FAILED. Lease tugagan vazifa qayta olinadi. `SENT` gatewayning qabul qilganini anglatadi, telefon apparatiga yetkazilganligi tasdig‘i emas; delivery receipt uchun provayder callbacki alohida integratsiya bo‘ladi.

Haqiqiy SMS uchun provayder akkaunti, balans, xalqaro yuborish ruxsatlari va jo‘natuvchi sozlamalari zarur. Sayt deploy qilinishi bularni avtomatik yaratmaydi.

## Tekshiruvlar

```bash
npm run build
node scripts/check-order-regressions.cjs
node scripts/check-profile-upload.cjs
```

Seller integratsion testi faqat vaqtinchalik MongoDB replica set yaratadi, loyiha bazasiga ulanmaydi. `mongodb-memory-server@10`ni alohida vaqtinchalik katalogga o‘rnating:

```bash
npm install --prefix /tmp/hadijam-governance-tests --no-audit --no-fund mongodb-memory-server@10
MONGODB_MEMORY_SERVER_MODULE=/tmp/hadijam-governance-tests/node_modules/mongodb-memory-server node scripts/check-seller-approval.cjs
```

MongoDB test binari birinchi ishga tushishda yuklanadi. Testlar private upload/ownership/size/type, signup roli, parallel submit/approve, xabarnoma, rol ochilishi, admin himoyasi, reject/resubmit, SMS fake-gateway va workflow/auditni tekshiradi.

Frontend typecheck va production build ham bajarilishi kerak. Mavjud `.next/types` ichidagi eski `... 2.ts`/`... 3.ts` dublikatlari typecheckga xalaqit bersa, source kodi va node_modulesdan toza vaqtinchalik nusxa yaratib tekshiring; source dublikatlarini o‘zboshimchalik bilan o‘chirmang.

## 2026-10-09 tekshiruv natijalari

- Backend `npm run build`: o‘tdi.
- Order va profil upload regression testlari: o‘tdi; admin order statuslari ham workflow bilan cheklangan.
- Izolyatsiyalangan replica-set HTTP/GraphQL integratsion testi: o‘tdi. Frontendning yangi GraphQL hujjatlari haqiqiy backend sxemasiga mosligi, tranzaksiya xatosida rollback, parallel ariza/tasdiq, xabarnomalar, private upload va SMS fake-gateway holatlari tekshirildi.
- Frontend source typecheck: o‘tdi. Asl `.next/types` ichidagi oldingi dublikatlar sabab source alohida konfiguratsiya bilan tekshirildi.
- Frontendning toza `/tmp` nusxasida production build: o‘tdi, 22 sahifa yaratildi.
- Asosiy bazada foydalanuvchi so‘rovi bilan Danny ADMIN akkaunti yaratildi. Credentiallar gitga kiritilmaydi.
- Ishlayotgan admin sahifasi brauzerda tekshirildi. Haqiqiy SMS gateway credentialsiz o‘chiq turadi.

## Saqlanmagan seller arizasini davom ettirish

2026-10-09 tekshiruvda Nurik akkauntining ikkala hujjati saqlangani, ammo mahalliy telefon formati sabab ariza saqlanmagani aniqlandi. Telefon tekshiruvi ariza yuborishdan ajratildi. Eski arizada biznes nomi va manzili bazaga tushmagan; ularni qayta kiritish kerak.

MyPage seller ariza paneli autentifikatsiyalangan `GET /seller-documents` orqali faqat o‘z hujjatlarini ko‘rsatadi. Avval yuklangan ID va biznes hujjatini tanlab arizani qayta yuborish mumkin. Keyingi urinishlarda biznes maydonlari va muvaffaqiyatli yuklangan hujjat IDlari shu brauzer sessiyasida saqlanadi; ariza saqlangach draft o‘chiriladi. Kutish xabari faqat muvaffaqiyatli submitdan keyin chiqadi; xatoda haqiqiy sabab va MyPage orqali davom ettirish imkoniyati ko‘rsatiladi.

## Ustaxona Like va Follow

Uchta ustaxonaning social holati `DANNY` seller profilidan ajratildi. `atelierReactions` kolleksiyasida `(atelier, memberId)` unique indeks bilan `liked` va `followed` saqlanadi. `getAtelierSocial` ommaviy hisoblagichlar va kirgan memberning holatini qaytaradi; `setAtelierLike` hamda `setAtelierFollow` faol autentifikatsiyalangan akkauntni talab qiladi. Mutation toggle o‘rniga kerakli boolean holatni qabul qiladi, shuning uchun takroriy yuborish hisoblagichni oshirib yubormaydi. Eski member Like/Follow yozuvlari o‘zgartirilmaydi: ular qaysi ustaxonaga tegishli ekanini aniqlab bo‘lmaydi. Xizmatlar, mahsulotlar va chat egasini bog‘lash alohida mavjud mexanizm bo‘lib qoladi.
