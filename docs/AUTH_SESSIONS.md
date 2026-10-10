# HaDiJaM sessiya tizimi

Yangilangan: 2026-10-10.

## Tuzilma

Backend: `src/components/auth/sessions/`. Frontend: `libs/auth/` va `libs/apollo/client.ts`.
`AuthRecord` telefon modeli o‘zgartirilmagan. Har login `authSessions` kolleksiyasida alohida qurilma sessiyasi yaratadi.

Access JWT 240 soniya: `sub`, `sid`, `iat`, `exp`, `iss=hadijam-api`, `aud=hadijam-web`; HS256 qat’iy tekshiriladi. Member roli/statusi bazadan olinadi. Telefon, manzil, parol va hujjatlar JWT’da yo‘q. Sessiyasiz eski JWT rad etiladi.

Refresh qiymati session ID, generation va HMAC-SHA256 imzosidan iborat. Bazada faqat SHA256 hash saqlanadi. Har refresh atomik compare-and-set orqali generation oshiradi; autentik old generation qayta ishlatilsa sessiya bekor bo‘ladi. Generation rotation tarixini ifodalaydi; cheksiz eski hashlar ro‘yxati yig‘ilmaydi. Shu token bilan parallel refresh backendda replay hisoblanadi: frontend buni navbatlash bilan oldini oladi.

## API va cookie

- GraphQL `login` / `signup`: access token javobda, refresh cookie HTTP javobida.
- `POST /auth/refresh`: cookie → yangi access + yangi cookie + minimal member.
- `POST /auth/activity`: bearer va o‘sha sessiya cookie’si; server faollikni daqiqada ko‘pi bilan bir marta yangilaydi.
- `POST /auth/logout`: joriy cookie sessiyasini bekor qiladi.
- `POST /auth/logout-all`: bearer orqali memberning barcha sessiyalarini bekor qiladi.
- `GET /auth/session`: bearer orqali joriy minimal member va sessiya muddati.
- `GET /private-media/:target/:filename`: bearer; egasi/admin va tegishli suhbat yoki xizmat ishtirokchilari uchun ruxsat tekshiriladi.

Production cookie: `__Host-hadijam-refresh`, HttpOnly, Secure, SameSite=Lax, Path=/, Domain yo‘q. Development: `hadijam-refresh`, Secure=false. Cookie amal qilish sanasi sessiya expiry’siga mos.
Auth POST va login/signup uchun aniq Origin hamda `X-Hadijam-CSRF: 1` talab qilinadi. Bu custom-header/preflight + Origin himoyasi; tasodifiy CSRF secret emas.

## 14 kunlik faollik

Login va haqiqiy ishlatish 14 kunlik chegarani yangilaydi. Faol sahifani ochish, pointer/klaviatura/wheel amallari qayd qilinadi. Refresh va polling expiry’ni uzaytirmaydi. Mongo TTL faqat tozalash uchun: expiry/revocation har autentifikatsiyada tekshiriladi.
Frontend tokenni faqat xotirada saqlaydi, eski localStorage auth kalitlarini tozalaydi. BroadcastChannel tablar xotirasini yangilaydi; logout uchun storage’da faqat maxfiy bo‘lmagan signal ham bor. Web Locks, bo‘lmasa IndexedDB lease, cookie amallarini navbatlaydi. Tarmoq uzilishida token holati saqlanadi; 401’da ko‘pi bilan bitta refresh va qayta urinish bor.
Parol o‘zgarishi, admin bloklashi/o‘chirishi barcha sessiyalarni bekor qiladi. Seller tasdig‘idan so‘ng rol bazadan keladi, yangi login shart emas.

## Production sozlash

1. Backend va frontendni bir relizda chiqaring; mavjud userlar bir marta qayta login qiladi.
2. Kuchli, tasodifiy kamida 32 belgili `JWT_SECRET` o‘rnating. Uni log yoki Git’ga kiritmang. Secret almashishi barcha sessiyalarni yaroqsiz qiladi.
3. `NODE_ENV=production`, tegishli Mongo URI, frontend API/WebSocket environment qiymatlarini sozlang.
4. Frontend `https://hadijam.com` yoki `https://www.hadijam.com`; API `https://api.hadijam.com`. HTTPS va WebSocket reverse proxy kerak.
5. Node API productionda `127.0.0.1:9702` tinglaydi, trust proxy=1. Faqat ishonchli bitta reverse proxy tashqi trafikni qabul qilsin va forwarded headerlarni almashtirsin.
6. Hozir **bitta PM2 API worker** ishlating: rate limiter process xotirasida. Ko‘p worker/server oldidan umumiy limiter yoki proxy limiter qo‘shing. Har restart limiter sanog‘ini tiklaydi.
7. `uploads/atelier` va `uploads/service-bookings` fayllarini Nginx orqali public bermang. Private hujjat storage’ni ham public alias qilmaslik kerak.
8. Mongo sessiya TTL indexlari yaratilganini tekshiring. Backup hamda filesystem ruxsatlarini sozlang.
9. Production HTTPS’da cookie, login, refresh, logout, admin/seller oqimini brauzerda qayta tekshiring. Hozir deploy bajarilmagan.

## Tekshirish

`npm run build`, `node scripts/check-auth-client.cjs`, `node scripts/check-profile-upload.cjs`, `node scripts/check-order-regressions.cjs`.
Sessiya va seller testlari `mongodb-memory-server` talab qiladi. Paket tashqarida o‘rnatilgan bo‘lsa `MONGODB_MEMORY_SERVER_MODULE=/absolute/path/to/mongodb-memory-server` bering; keyin `node scripts/check-session-security.cjs` va `node scripts/check-seller-approval.cjs`.
Bu testlar vaqtinchalik replica set ishlatadi, haqiqiy bazani/SMS provayderni ishlatmaydi.

14 kunlik chegara eski 30 kunlik sessiyalarga ham server tekshiruvida qo‘llanadi; cookie muddati keyingi refreshda qisqartiriladi.
