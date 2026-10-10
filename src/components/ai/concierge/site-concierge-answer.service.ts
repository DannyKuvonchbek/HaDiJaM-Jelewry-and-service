type PublicProduct = {
  _id: unknown;
  productTitle?: string;
  productType?: string;
  productPrice?: number;
};
type PublicService = {
  _id: unknown;
  serviceTitle?: string;
  servicePrice?: number;
  serviceDuration?: string;
  serviceDesc?: string;
};

const numberLocales: Record<string, string> = { en: 'en-US', uz: 'uz-UZ', ko: 'ko-KR', ru: 'ru-RU' };

function formatPrice(value: unknown, locale: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '';
  return new Intl.NumberFormat(numberLocales[locale] ?? 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function excerpt(value: unknown, max = 180): string {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}

/** Builds replies only from public active catalog records supplied by the concierge service. */
export class SiteConciergeAnswerService {
  public isPurchaseQuestion(message: string): boolean {
    const original = message.toLowerCase();
    const normalized = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const serviceBooking = /(service|xizmat|atelier|ustaxona|booking|appointment|bron|예약|услуг|запис)/i.test(original) || /(service|xizmat|atelier|ustaxona|booking|appointment|bron|예약|услуг|запис)/i.test(normalized);
    if (serviceBooking) return false;
    const purchasePattern = /(how (can|do) i (buy|purchase|order)|how to (buy|purchase|order)|buy this|purchase this|add to (my )?(bag|cart)|buy|purchase|qanday.{0,40}(sotib|xarid|tol|buyurtma)|sotib.{0,24}ol|xarid.{0,24}qil|buyurtma.{0,24}(ber|qil)|savatcha|savatga|어떻게 구매|구매 방법|구매하고|장바구니|как купить|как приобрести|оформить заказ|купить это)/i;
    return purchasePattern.test(message.toLowerCase()) || purchasePattern.test(normalized);
  }

  public isServiceGuidanceQuestion(message: string): boolean {
    const original = message.toLowerCase();
    const normalized = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const pattern = /(how (can|do) i (use|book|schedule)|how to use|use (your )?services|service(s)? (booking|booking process|page)|xizmatdan.{0,35}(qanday|foydalan|ishlat|bron)|xizmatlardan.{0,35}(qanday|foydalan|ishlat|bron)|(service|xizmat).{0,35}(qanday|foydalan|ishlat|bron)|qanday.{0,35}(xizmat|service)|서비스를 어떻게 이용|서비스 이용 방법|예약 방법|как воспользоваться услугами|как записаться на услугу)/i;
    return pattern.test(original) || pattern.test(normalized);
  }

  public serviceAction(locale: string) {
    const labels: Record<string, string> = {
      en: 'Go to Services',
      uz: 'Services sahifasiga o‘tish',
      ko: '서비스 페이지로 이동',
      ru: 'Перейти к услугам',
    };
    return { label: labels[locale] ?? labels.en, href: '/services' };
  }

  public answer(locale: string, message: string, products: PublicProduct[], services: PublicService[]): string {
    if (this.isServiceGuidanceQuestion(message)) return this.serviceInstructions(locale);
    if (this.isPurchaseQuestion(message)) return this.purchaseInstructions(locale);
    const sections: string[] = [];
    if (products.length) {
      const lines = products.slice(0, 5).map((product) => {
        const category = product.productType ? ' (' + product.productType + ')' : '';
        const price = formatPrice(product.productPrice, locale);
        return '• ' + (product.productTitle ?? 'HaDiJaM piece') + category + (price ? ' — ' + price : '');
      });
      sections.push(this.copy(locale, 'products', lines.join('\n')));
    }
    if (services.length) {
      const lines = services.slice(0, 4).map((service) => {
        const price = formatPrice(service.servicePrice, locale);
        const duration = service.serviceDuration ? ' · ' + service.serviceDuration : '';
        const description = excerpt(service.serviceDesc);
        return '• ' + (service.serviceTitle ?? 'Atelier service') + (price ? ' — ' + price : '') + duration + (description ? '\n  ' + description : '');
      });
      sections.push(this.copy(locale, 'services', lines.join('\n')));
    }
    if (!sections.length) return this.copy(locale, 'empty');
    return sections.join('\n\n');
  }

  private serviceInstructions(locale: string): string {
    const instructions: Record<string, string> = {
      en: 'To use a HaDiJaM atelier service, open the Services page, choose the service you need, and use its booking button to select an available date and time. Sign in first if the booking flow asks you to.',
      uz: 'HaDiJaM ustaxona xizmatidan foydalanish uchun Services sahifasini oching, kerakli xizmatni tanlang va uning bron tugmasi orqali bo‘sh sana hamda vaqtni belgilang. Bron jarayoni so‘rasa, avval akkauntingizga kiring.',
      ko: 'HaDiJaM 아틀리에 서비스를 이용하려면 Services 페이지에서 원하는 서비스를 선택하고 예약 버튼을 눌러 가능한 날짜와 시간을 고르세요. 예약 과정에서 요청하면 먼저 로그인해 주세요.',
      ru: 'Чтобы воспользоваться услугой HaDiJaM, откройте страницу Services, выберите нужную услугу и нажмите кнопку записи, чтобы выбрать свободные дату и время. Если система попросит, сначала войдите в аккаунт.',
    };
    return instructions[locale] ?? instructions.en;
  }

  private purchaseInstructions(locale: string): string {
    const instructions: Record<string, string> = {
      en: "To purchase a piece:\n1. Sign in to your HaDiJaM account.\n2. Open the product page and select “Add to your bag”.\n3. Open your bag and choose “Continue to checkout”.\n4. Enter delivery details, choose a payment method, accept the terms, and select “Place Order”.\n5. After the order is submitted successfully, find it under My Page → My Orders.\n\nBank card details are not verified or charged by the current checkout. The order remains pending while the concierge arranges payment.",
      uz: "Mahsulotni sotib olish tartibi:\n1. HaDiJaM akkauntingizga kiring.\n2. Mahsulot sahifasini ochib, “Add to your bag” tugmasini bosing.\n3. Savatchaga o‘tib, “Continue to checkout”ni tanlang.\n4. Yetkazish ma’lumotlarini kiriting, to‘lov usulini tanlang, shartlarga rozilik bildiring va “Place Order”ni bosing.\n5. Buyurtma muvaffaqiyatli yuborilgach, uni My Page → My Orders bo‘limida ko‘rasiz.\n\nHozirgi checkout karta ma’lumotlarini bank orqali tekshirmaydi va kartadan pul yechmaydi. Buyurtma kutilayotgan holatda saqlanadi, to‘lovni kelishish uchun concierge siz bilan bog‘lanadi.",
      ko: "제품 구매 방법:\n1. HaDiJaM 계정에 로그인하세요.\n2. 제품 페이지에서 “Add to your bag”을 선택하세요.\n3. 장바구니를 열고 “Continue to checkout”을 누르세요.\n4. 배송 정보를 입력하고 결제 방법을 선택한 뒤 약관에 동의하고 “Place Order”를 누르세요.\n5. 주문이 성공적으로 접수되면 My Page → My Orders에서 확인할 수 있습니다.\n\n현재 체크아웃은 카드 정보를 은행에서 인증하거나 결제하지 않습니다. 주문은 보류 상태로 저장되며 결제 방법은 컨시어지가 안내합니다.",
      ru: "Как оформить покупку:\n1. Войдите в аккаунт HaDiJaM.\n2. Откройте страницу изделия и нажмите “Add to your bag”.\n3. Перейдите в корзину и выберите “Continue to checkout”.\n4. Укажите данные доставки, выберите способ оплаты, примите условия и нажмите “Place Order”.\n5. После успешной отправки заказа он появится в My Page → My Orders.\n\nТекущая форма не проверяет банковскую карту и не списывает с неё деньги. Заказ сохраняется в ожидании, а консьерж свяжется с вами для согласования оплаты.",
    };
    return instructions[locale] ?? instructions.en;
  }

  private copy(locale: string, kind: 'products' | 'services' | 'empty', details = ''): string {
    const templates: Record<string, Record<'products' | 'services' | 'empty', string>> = {
      en: {
        products: 'These active pieces match the HaDiJaM catalog search:\n' + details,
        services: 'These active atelier services match your search. To request a booking, open Services and choose a service:\n' + details,
        empty: 'I could not find a matching active product or service in the HaDiJaM catalog. Try a product category or service name. I can only answer from current public catalog information.',
      },
      uz: {
        products: 'HaDiJaM katalogidan mos faol mahsulotlar topildi:\n' + details,
        services: 'Qidiruvingizga mos faol ustaxona xizmatlari. Bron so‘rash uchun Services bo‘limiga o‘tib, xizmatni tanlang:\n' + details,
        empty: 'HaDiJaM katalogida mos faol mahsulot yoki xizmat topilmadi. Mahsulot turini yoki xizmat nomini yozib ko‘ring. Men faqat saytdagi ochiq katalog ma’lumotlariga tayanaman.',
      },
      ko: {
        products: 'HaDiJaM 카탈로그에서 일치하는 판매 중인 제품을 찾았습니다:\n' + details,
        services: '검색과 일치하는 아틀리에 서비스입니다. 예약을 요청하려면 Services에서 서비스를 선택하세요:\n' + details,
        empty: 'HaDiJaM 카탈로그에서 일치하는 판매 중인 제품이나 서비스를 찾지 못했습니다. 제품 종류나 서비스 이름을 입력해 주세요. 현재 공개된 카탈로그 정보만 안내합니다.',
      },
      ru: {
        products: 'В каталоге HaDiJaM найдены подходящие активные изделия:\n' + details,
        services: 'Подходящие услуги ателье. Чтобы запросить запись, откройте Services и выберите услугу:\n' + details,
        empty: 'В каталоге HaDiJaM не найдено подходящих активных изделий или услуг. Попробуйте указать категорию или название услуги. Я отвечаю только по открытым данным каталога.',
      },
    };
    return (templates[locale] ?? templates.en)[kind];
  }
}
