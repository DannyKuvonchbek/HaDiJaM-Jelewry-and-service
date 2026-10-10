# HaDiJaM mobil moslashuvi

2026-10-10. Frontend: yonma-yon joylashgan `Hadijam    frontend` loyihasi.

## O‘zgarishlar

- `scss/mobile/responsive.scss`: yakuniy responsive qoidalar. Rasmlar va ranglar saqlanadi; katta desktop uchun yangi qoidalar qo‘llanmaydi.
- `pages/_app.tsx`: responsive fayl barcha mavjud stillardan keyin yuklanadi.
- `libs/components/layout/SiteHeader.tsx`: mobil menyu holati uchun ARIA atributlari, Escape va sahifa almashganda yopilish.
- 1300 px va undan katta: mavjud desktop dizayni. 761–1299 px: planshet va kichik kompyuterlar uchun moslashuv. 760 px va past: mobil joylashuv. 560 va 360 px: qo‘shimcha ixchamlashtirish.
- Xizmat kartalari, mahsulotlar, bron formalari, MyPage, seller/admin panellari, savatcha, checkout va modal oynalar uchun moslashuv qo‘shildi. Sana qatori va admin jadvallari o‘z konteynerida aylantiriladi.
- Salondagi barcha beshta xona mobil oynada ko‘rsatiladi. Avatar yuklash boshqaruvi touch ekranida ko‘rinadi. Mobil inputlar 16 px.
- Yangi AI yordamchi va admin review oynalariga ham mobil qoidalar qo‘shildi.

## Tekshiruv

- Frontend production build vaqtinchalik nusxada muvaffaqiyatli yakunlandi; TypeScript tekshiruvi ham o‘tdi.
- Frontend va backend `git diff --check` muvaffaqiyatli.
- Bosh sahifa va xizmatlar: Chrome viewport 320, 390, 768 va 1024 px; hujjat kengligi ekran kengligiga teng, tashqi gorizontal overflow yo‘q.
- Katalog, login va about: 390 px da tashqi overflow yo‘q.
- Mobil menyu ochilishi/yopilishi va salon modalida beshta xona ko‘rinishi tekshirildi. Haqiqiy bron yoki order yuborilmadi.
- Mobil screenshot: `/tmp/hadijam-mobile-services.png`. Tekshiruvdan keyin brauzer viewport override olib tashlandi.

## Chegaralar

Backendni ishga tushirishga urinish yangi AI modulidagi 9 ta TypeScript xatosi sabab to‘xtadi. Ushbu mobil vazifada AI backend kodi o‘zgartirilmadi. Shu sabab ma’lumotlar bazasiga bog‘langan hamda autentifikatsiyalangan MyPage/admin/seller oqimlari ushbu yakuniy tekshiruvda jonli tasdiqlanmadi; ularning responsive stillari build orqali tekshirildi. Haqiqiy iOS/Android qurilmasida yakuniy ko‘rik hali bajarilmagan.
