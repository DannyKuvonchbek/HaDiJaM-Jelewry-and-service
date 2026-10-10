# HaDiJaM xavfsizlik auditi

Sana: 2026-10-10. Audit statik tekshiruv va alohida Mongo replica set / browser-like VM testlariga asoslangan. Build muvaffaqiyati barcha biznes funksiyalar ishlashini tasdiqlamaydi. Production yoki haqiqiy user ma’lumotlari bilan buyurtma/SMS yuborilmagan.

## Tuzatilgan topilmalar

### 1. Uzoq muddatli, ortiqcha ma’lumotli JWT va localStorage
Joy: auth/member login va frontend auth/Apollo. Avval login tokenini decode qilish va browser storage’ni ko‘rish orqali ortiqcha member ma’lumoti hamda 30 kunlik bearer token olinardi. Token o‘g‘irlanishi ta’siri yuqori edi. Endi minimal 4 daqiqalik JWT, HttpOnly refresh, per-device sessiya, atomik rotation va replay revocation bor. Minimal claims, expiry, issuer, legacy token rad etilishi, rotation va parallel replay testlari o‘tdi.

### 2. Logout va rol/statusning eskirib qolishi
Joy: auth guards, member update, WebSocket gateway. Logoutdan keyin eski bearer’ni qayta ishlatish yoki login paytidagi rol/status bilan ishlash mumkin edi. Endi barcha auth yo‘llari amaldagi member/sessiyani tekshiradi, logout server sessiyasini bekor qiladi, password/block/delete barcha sessiyalarni bekor qiladi. Optional guard ham shu tekshiruvdan foydalanadi. Logout-all, password/block va WebSocket revoked sender testlari o‘tdi.

### 3. Ochiq CORS va cookie amallaridagi CSRF
Joy: main.ts va auth-security.ts. Begona Origin’dan credential so‘rovlari himoyasiz qolardi. Origin allowlist, custom-header CSRF va process-local rate limit qo‘shildi. Begona Origin, yetishmagan CSRF header, production cookie va limiter testlari o‘tdi. Production HTTPS brauzer tekshiruvi reliz vaqtida qoladi.

### 4. Public member javobidagi telefon/manzil
Joy: member-privacy.resolver.ts. Anonymous `getMember` bilan boshqa memberning telefon/manzilini olish mumkin edi. Endi bu fieldlar faqat egasi/admin uchun qaytadi; boshqalarga telefon bo‘sh, manzil null. Anonymous/owner/admin testlari o‘tdi.

### 5. Upload formatini soxtalashtirish va private rasmlar
Joy: member.resolver.ts, private-media.controller.ts, main.ts, frontend PrivateMediaLink. HTML faylni image MIME bilan berish yoki original filename extension’dan foydalanish xavfi bor edi. Server filename va MIME extension belgilaydi, image signature/stream hajmini tekshiradi, yozishda xato bo‘lsa faylni tozalaydi. Private chat/booking rasmlari public static yo‘ldan chiqarildi; URL decoding tekshiruvi qo‘shildi. Private fayl egasi/admin kira olishi, begona user 404, anonymous 401 testlari o‘tdi. Eski filename’lar tegishli DB yozuvlari orqali moslashtiriladi; bu legacy bog‘lanishlar production migrationda alohida tekshirilishi kerak.

### 6. Autentifikatsiyasiz umumiy socket
Joy: app.module.ts. Eski umumiy broadcast socket ishlatilmayotgan bo‘lsa ham ro‘yxatdan o‘tgan edi. Module registratsiyasi olib tashlandi. Atelier socket Origin va har xabar/recipientda aktiv sessiyani tekshiradi. Revoked sender xabari rad etildi; receiver path statik ko‘rib chiqildi.

### 7. Ishga tushishda DTO ReferenceError
Joy: libs/dto/ai/concierge/ai-concierge.ts. Decorator metadata sinfi e’lon qilinmasdan avval unga murojaat qilgan; TypeScript build o‘tib, Nest startup yiqilishi mumkin edi. Sinf e’lon tartibi tuzatildi; integratsiya testlarida Nest ishga tushdi.

### 8. Login xatolari va admin UI
Joy: member.service.ts, frontend SiteHeader.tsx. Noto‘g‘ri nickname/parol uchun umumiy 401 javobi qo‘llanadi. Refreshdan keyin admin tugmasi false holatga o‘tib qolishi tuzatildi: verified session rolidan olinadi.

## Tekshirilgan oqimlar

- Backend build va frontend TypeScript/production build: o‘tdi.
- Session integration: minimal JWT, 4 daqiqa expiry, replay/parallel rotation, 13/14 kun, faollik throttle, logout-all, password/block, privacy, cookie/CORS/CSRF/limit: o‘tdi.
- Real frontend auth modulining VM testi: parallel so‘rov/tab, token storage’da yo‘qligi, bitta auth retry, tarmoq xatosida holat saqlanishi va logout tarqalishi: o‘tdi. VM haqiqiy brauzer o‘rnini to‘liq bosmaydi; IndexedDB fallback brauzerda alohida tekshirilishi kerak.
- Seller arizasi → admin tasdig‘i → o‘sha memberning SELLER roli, reject/resubmit, parallel/idempotent amallar, notification, private document format/size/ownership, oxirgi admin himoyasi, audit: o‘tdi.
- SMS disabled va fake gateway retry/success/failure: o‘tdi. Haqiqiy SMS tekshirilmagan.
- Avatar upload/error cleanup, order whitelist/payment/quantity/image response regressiyalari: o‘tdi.

## Qolgan cheklovlar va tekshiruvlar

- Atelier biznes chat inbox’i hali `Danny` nickname’li ACTIVE SELLERga bog‘langan. Danny ADMIN bo‘lsa inbox mavjud bo‘lmasligi mumkin. Owner tayinlash siyosati va frontend inbox ko‘rinishini alohida moslashtirish kerak; yangi owner sessiya tizimi tomonidan avtomatik tayinlanmaydi.
- Service request/delivery status update’larida read → write o‘rtasidagi parallel o‘tishlarni alohida CAS regressiya testi bilan tekshirish kerak.
- Like/follow, barcha booking variantlari, community va barcha admin amallari to‘liq haqiqiy brauzer E2E testidan o‘tkazilmagan. Yuqoridagi test coverage bu funksiyalar uchun to‘liq tasdiq emas.
- Production cookie / multi-tab / uyqudan qaytish / WebSocket receiver-expiry / IndexedDB fallback real brauzer testlari qoladi.
- Public sahifalar SSR kontentini saqlaydi; MyPage/admin/seller/checkout sessiya tiklanishini kutadi. Production SEO va real brauzer navigatsiyasi alohida tekshiriladi.
- Legacy private media bog‘lanishlari uchun upload provenance migration kerak; yangi fayllarda owner prefix ishlatiladi.
- Rate limiter umumiy cluster storage emas; productionda bitta API worker talab qilinadi.
- Refresh token mutlaq ma’lumot xavfsizligi kafolati emas. XSS, dependency, transport va hosting sozlamalari alohida himoya qatlamlari bo‘lib qoladi.

Production yo‘riqnoma: [AUTH_SESSIONS.md](AUTH_SESSIONS.md).
