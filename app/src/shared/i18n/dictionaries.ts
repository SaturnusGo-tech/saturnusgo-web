import type { Locale } from "./types";

type LocalizedLink = {
  href: string;
  label: string;
};

type HeaderDictionary = {
  brandHomeLabel: string;
  menu: string;
  close: string;
  openMenuLabel: string;
  closeMenuLabel: string;
  overlayLabel: string;
  primaryNavigationLabel: string;
  allSectionsLabel: string;
  eyebrow: string;
  primaryNavigation: LocalizedLink[];
  navigationGroups: Array<{
    title: string;
    links: LocalizedLink[];
  }>;
  language: {
    label: string;
    current: string;
    options: Record<Locale, string>;
  };
  footer: {
    tagline: string;
    download: string;
  };
};

type SectionCopy = {
  kicker: string;
  title: string;
  subtitle: string;
};

type HomeServiceModule = {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  summary: string;
  description: string;
  action: string;
  href: string;
  image: string;
};

type HomeRideClass = {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  image: string;
};

type HomePresenceCard = {
  city: string;
  country: string;
  entity: string;
  detail: string;
  image: string;
};

type FooterGroup = {
  title: string;
  links: LocalizedLink[];
};

type HomeDictionary = {
  hero: {
    kicker: string;
    title: string;
    lead: string;
    primaryAction: string;
    investorsAction: string;
    deckAction: string;
    scrollLabel: string;
    scrollText: string;
  };
  value: SectionCopy;
  feel: SectionCopy;
  screens: SectionCopy;
  trust: SectionCopy;
  introLink: string;
  serviceModules: HomeServiceModule[];
  rideClasses: HomeRideClass[];
  howItFeels: {
    kicker: string;
    previousLabel: string;
    nextLabel: string;
    selectorLabel: string;
  };
  screenPhrases: string[];
  marqueeLabel: string;
  presenceCards: HomePresenceCard[];
  download: {
    kicker: string;
    title: string;
    text: string;
    qrAlt: string;
  };
  footer: {
    socialsLabel: string;
    founderRole: string;
    rights: string;
    groups: FooterGroup[];
  };
};

type TextRow = {
  label: string;
  text: string;
};

type InvestorsContentSection = {
  id: string;
  kicker: string;
  title: string;
  description: string;
  rows: TextRow[];
};

type InvestorsDictionary = {
  hero: {
    topLine: string;
    openDeck: string;
    kicker: string;
    title: string;
    lead: string;
    reviewDeck: string;
    requestWalkthrough: string;
    scrollLabel: string;
    scrollText: string;
  };
  thesis: {
    kicker: string;
    title: string;
    rows: TextRow[];
  };
  contentSections: InvestorsContentSection[];
  marqueeLabel: string;
  marqueePhrases: string[];
  marketIntro: {
    label: string;
    text: string;
  };
  finalCta: {
    kicker: string;
    title: string;
    text: string;
    openDeck: string;
    methodology: string;
    founder: string;
  };
  projections: {
    outlook: string;
    totalTitle: string;
    totalSubtitle: string;
    baseline: string;
    target: string;
    shortfall: string;
    excess: string;
    howCalculated: string;
    howCalculatedLabel: string;
    totalChartTitle: string;
    rightAxisStreams: string;
    baselineRationale: string;
    matchedRationale: string;
    monetization: string;
    nonRideTitle: string;
    nonRideSubtitle: string;
    nonRideChartTitle: string;
    rightAxisArr: string;
    subsetBaseline: string;
    labels: {
      subscriptions: string;
      bookings: string;
      events: string;
      b2b2c: string;
    };
  };
};

type CookieDictionary = {
  ariaLabel: string;
  choicesLabel: string;
  kicker: string;
  title: string;
  text: string;
  learnMore: string;
  decline: string;
  accept: string;
};

export type Dictionary = {
  header: HeaderDictionary;
  home: HomeDictionary;
  investors: InvestorsDictionary;
  cookie: CookieDictionary;
};

const sharedHomeAssets = {
  tripsImage: "/mock/module-trips.webp",
  deliveryImage: "/mock/module-delivery.jpg",
  placesImage: "/mock/module-places.jpg",
  transportImage: "/mock/module-transport.jpg",
  heroImage: "/mock/hero-main.webp",
} as const;

export const dictionaries: Record<Locale, Dictionary> = {
  ru: {
    header: {
      brandHomeLabel: "SaturnusGo, главная",
      menu: "Меню",
      close: "Закрыть",
      openMenuLabel: "Открыть меню",
      closeMenuLabel: "Закрыть меню",
      overlayLabel: "Навигация SaturnusGo",
      primaryNavigationLabel: "Главная навигация",
      allSectionsLabel: "Все разделы сайта",
      eyebrow: "Навигация",
      primaryNavigation: [
        { href: "/", label: "Главная" },
        { href: "/features", label: "Возможности" },
        { href: "/mobile", label: "Приложение" },
        { href: "/pricing", label: "Тарифы" },
        { href: "/investors", label: "Инвесторам" },
        { href: "/partners", label: "Партнёрам" },
      ],
      navigationGroups: [
        {
          title: "Продукт",
          links: [
            { href: "/#trips", label: "Поездки" },
            { href: "/#delivery", label: "Доставка" },
            { href: "/#places", label: "Места" },
            { href: "/topup-crypto", label: "Crypto top-up" },
          ],
        },
        {
          title: "Инвесторам",
          links: [
            { href: "/investors", label: "Обзор" },
            { href: "/investors/methodology", label: "Методология" },
            { href: "/press", label: "Пресса" },
            { href: "/founder", label: "Основатель" },
          ],
        },
        {
          title: "Партнёрам",
          links: [
            { href: "/partners/about", label: "О партнёрстве" },
            { href: "/partners/apply", label: "Подать заявку" },
            { href: "/partners/listing", label: "Листинг" },
            { href: "/partners/benefits/platform", label: "Платформа" },
            { href: "/partners/benefits/reach", label: "Охват" },
            { href: "/partners/benefits/trusted", label: "Доверие" },
            { href: "/partners/careers", label: "Вакансии" },
            { href: "/partners/compliance", label: "Compliance" },
            { href: "/partners/news", label: "Новости" },
            { href: "/partners/contacts", label: "Контакты" },
          ],
        },
        {
          title: "Помощь",
          links: [
            { href: "/support", label: "Поддержка" },
            { href: "/faq", label: "FAQ" },
            { href: "/changelog", label: "Changelog" },
            { href: "/partners/privacy", label: "Privacy" },
            { href: "/partners/terms", label: "Terms" },
            { href: "/partners/cookies", label: "Cookies" },
          ],
        },
      ],
      language: {
        label: "Язык",
        current: "Текущий язык",
        options: { ru: "Русский", en: "English", es: "Español" },
      },
      footer: {
        tagline: "Городская мобильность · Travel intelligence · City services",
        download: "Скачать приложение",
      },
    },
    home: {
      hero: {
        kicker: "SaturnusGo / городская мобильность",
        title: "Ехать, отправлять, открывать город",
        lead:
          "Taxi-first главный экран для поездок, доставки, мест и городского движения в одном спокойном premium-flow.",
        primaryAction: "Смотреть продукт",
        investorsAction: "Инвесторам",
        deckAction: "Deck",
        scrollLabel: "Перейти к описанию продукта",
        scrollText: "Листать вниз",
      },
      value: {
        kicker: "Городская платформа",
        title: "Такси — ядро. Городской flow — продукт.",
        subtitle:
          "SaturnusGo начинается с движения, а затем держит доставку, места и транспорт внутри одной спокойной route-first иерархии.",
      },
      feel: {
        kicker: "Система движения",
        title: "Скролл, раскрытие и выбор без потери контекста.",
        subtitle:
          "Главная страница использует мягкий reveal, активное раскрытие сервисов и продуктовую карусель вместо статичных маркетинговых блоков.",
      },
      screens: {
        kicker: "Городские сценарии",
        title: "Классы поездок, доставка и места ведут себя как одна система.",
        subtitle:
          "У каждого продуктового слоя есть свой образ и действие, но страница сохраняет один визуальный язык сверху донизу.",
      },
      trust: {
        kicker: "Присутствие",
        title: "Собрано для реальных городских сценариев, а не для generic app showcase.",
        subtitle:
          "Аэропорты, ежедневные маршруты, городские места и курьерские действия показаны как операционные зоны города.",
      },
      introLink: "Подробнее о flow",
      serviceModules: [
        {
          id: "trips",
          index: "01",
          eyebrow: "TRIPS APPROACH",
          title: "Заказ поездки",
          summary:
            "Быстрый заказ такси с маршрутом, ценовым намерением и следующим действием уже на первом экране.",
          description:
            "Модуль поездок — первый продуктовый слой: точка подачи, адрес, уверенность маршрута и выбор класса остаются понятными до подтверждения.",
          action: "Начать с поездок",
          href: "#download-app",
          image: sharedHomeAssets.tripsImage,
        },
        {
          id: "delivery",
          index: "02",
          eyebrow: "DELIVERY EXECUTION",
          title: "Курьерская доставка",
          summary:
            "Отправляйте небольшие посылки, покупки и личные вещи, не выходя из городского контекста.",
          description:
            "Доставка использует ту же городскую логику, что и поездки: понятные точки, статус и время без смены продуктовой модели.",
          action: "Открыть доставку",
          href: "#download-app",
          image: sharedHomeAssets.deliveryImage,
        },
        {
          id: "places",
          index: "03",
          eyebrow: "CITY DISCOVERY",
          title: "Городские места",
          summary:
            "Рестораны, прогулки, отели и локальные точки появляются как решения вокруг маршрута, а не как шум.",
          description:
            "Места превращают приложение в travel-layer: подборки, рекомендации и карточки направлений поддерживают поездку, а не конкурируют с ней.",
          action: "Открыть места",
          href: "#download-app",
          image: sharedHomeAssets.placesImage,
        },
        {
          id: "transport",
          index: "04",
          eyebrow: "TRANSPORT LAYER",
          title: "Городской транспорт",
          summary:
            "Сравнивайте варианты движения, сохраняя такси главным high-confidence действием.",
          description:
            "Транспорт даёт контекст маршрута: пересадки, общественные варианты и городские альтернативы могут жить рядом с заказом поездки.",
          action: "Посмотреть транспорт",
          href: "#download-app",
          image: sharedHomeAssets.transportImage,
        },
      ],
      rideClasses: [
        {
          id: "carpool",
          name: "Поездки",
          eyebrow: "Define ride",
          description: "Спокойный ежедневный taxi-сценарий для первого действия SaturnusGo.",
          image: sharedHomeAssets.tripsImage,
        },
        {
          id: "delivery",
          name: "Доставка",
          eyebrow: "Moment context",
          description: "Небольшие посылки и личные вещи внутри той же городской route-системы.",
          image: sharedHomeAssets.deliveryImage,
        },
        {
          id: "places",
          name: "Места",
          eyebrow: "Destination layer",
          description: "Подборки мест вокруг движения пользователя и сохранённых маршрутов.",
          image: sharedHomeAssets.placesImage,
        },
        {
          id: "transport",
          name: "Транспорт",
          eyebrow: "Movement context",
          description: "Контекст для пересадок, общественного транспорта и городских альтернатив.",
          image: sharedHomeAssets.transportImage,
        },
      ],
      howItFeels: {
        kicker: "Городские сценарии",
        previousLabel: "Предыдущий сценарий",
        nextLabel: "Следующий сценарий",
        selectorLabel: "Выбор городского сценария",
      },
      screenPhrases: ["Такси", "Доставка", "Места", "Транспорт", "Аэропорт", "Подборки", "Маршруты", "City flow"],
      marqueeLabel: "Продуктовые поверхности SaturnusGo",
      presenceCards: [
        {
          city: "Буэнос-Айрес",
          country: "Аргентина",
          entity: "Город запуска",
          detail: "Аэропорт, ежедневные маршруты и городские точки.",
          image: sharedHomeAssets.heroImage,
        },
        {
          city: "Аэропорт",
          country: "Transfer flow",
          entity: "Ride intent",
          detail: "Уверенная подача, тайминг и движение с багажом.",
          image: sharedHomeAssets.tripsImage,
        },
        {
          city: "Центр города",
          country: "Places layer",
          entity: "Discovery",
          detail: "Рестораны, прогулки и сохранённые направления вокруг маршрута.",
          image: sharedHomeAssets.placesImage,
        },
      ],
      download: {
        kicker: "Private access",
        title: "Скачайте приложение, когда launch-flow откроется.",
        text:
          "QR, мобильный preview и действие запуска остаются в конце той же истории продукта, не ломая narrative.",
        qrAlt: "QR-код приложения SaturnusGo",
      },
      footer: {
        socialsLabel: "Социальные сети SaturnusGo",
        founderRole: "Founder & CEO | CTO",
        rights: "Все права защищены.",
        groups: [
          { title: "Продукт", links: [{ label: "Главная", href: "/" }, { label: "Возможности", href: "/features" }, { label: "Приложение", href: "/mobile" }, { label: "Тарифы", href: "/pricing" }] },
          { title: "Компания", links: [{ label: "Основатель", href: "/founder" }, { label: "Инвесторам", href: "/investors" }, { label: "Пресса", href: "/press" }, { label: "Поддержка", href: "/support" }] },
          { title: "Партнёры", links: [{ label: "Партнёрам", href: "/partners" }, { label: "Листинг", href: "/partners/listing" }, { label: "Подать заявку", href: "/partners/apply" }, { label: "Контакты", href: "/partners/contacts" }] },
          { title: "Правовое", links: [{ label: "Privacy", href: "/partners/privacy" }, { label: "Terms", href: "/partners/terms" }, { label: "Cookies", href: "/partners/cookies" }, { label: "Compliance", href: "/partners/compliance" }] },
        ],
      },
    },
    investors: {
      hero: {
        topLine: "SaturnusGo / инвесторам",
        openDeck: "Открыть deck",
        kicker: "Urban mobility thesis",
        title: "Городское движение, в одном интерфейсе.",
        lead:
          "Поездки, доставка, места, маршруты и платежная логика соединены вокруг повторяющегося daily intent — как один продуктовый слой, а не набор отдельных утилит.",
        reviewDeck: "Посмотреть deck",
        requestWalkthrough: "Запросить walkthrough",
        scrollLabel: "Перейти к инвестиционному тезису",
        scrollText: "Листать вниз",
      },
      thesis: {
        kicker: "Investment case",
        title: "Инвестиционный тезис начинается с операционной логики.",
        rows: [
          {
            label: "Проблема",
            text: "Городское движение фрагментировано: люди переключаются между ride apps, картами, доставкой, сохранёнными местами, платежами и поддержкой.",
          },
          {
            label: "Продукт",
            text: "SaturnusGo собирает поездки, доставку, места, маршруты и платежные сценарии в один спокойный city interface.",
          },
          {
            label: "Wedge",
            text: "Начать с high-frequency mobility, затем расширяться через повторные маршруты, сохранённые направления, локальных партнёров и city discovery.",
          },
        ],
      },
      contentSections: [
        {
          id: "intro",
          kicker: "Investor context",
          title: "Taxi-first продукт, который может стать городским слоем.",
          description:
            "Страница объясняет компанию без сетки карточек: сначала thesis, затем model, mechanics и rollout logic.",
          rows: [
            {
              label: "Почему сейчас",
              text: "Люди уже ожидают, что mobility, payments, discovery и support будут связаны. Рынок всё ещё даёт им отдельные инструменты.",
            },
            {
              label: "Частота",
              text: "Поездки создают первую привычку. Доставка, места, аэропорт и сохранённые направления делают привычку устойчивее.",
            },
            {
              label: "Модель",
              text: "Секция projections показывает 3, 5 и 10 лет прямо на странице, чтобы assumptions оставались видимыми.",
            },
            {
              label: "Proof",
              text: "До масштаба закрытые когорты должны показать repeat use, operational reliability, support quality и paid conversion.",
            },
          ],
        },
        {
          id: "model",
          kicker: "Business mechanics",
          title: "Выручка и удержание растут из одного city intent.",
          description:
            "Продукт не пытается выигрывать внимание шумом. Он делает следующее решение о движении легче и повторяемее.",
          rows: [
            {
              label: "Revenue",
              text: "Комиссия с поездок, delivery fees, local discovery, subscriptions, partner integrations и selected B2B2C surfaces.",
            },
            {
              label: "Retention",
              text: "Сохранённые места, повторные маршруты, аэропорт и доставка соединяют один daily use case со следующим.",
            },
            {
              label: "Distribution",
              text: "Флоты, курьеры, venues, локальные сообщества и partner routes создают первые supply/demand loops.",
            },
          ],
        },
        {
          id: "gtm",
          kicker: "GTM",
          title: "Сначала доказать повторное поведение, затем масштабировать surface.",
          description:
            "Launch discipline важнее широкой доступности. Первый рынок должен показать density, reliability и продукт, в который возвращаются.",
          rows: [
            { label: "Now", text: "Дополировать product surface и запустить private city cohorts вокруг повторного движения." },
            { label: "Next", text: "Валидировать supply density, support discipline, route quality и delivery reliability." },
            { label: "Then", text: "Масштабировать только там, где уже видны repeat behavior и local operating quality." },
          ],
        },
      ],
      marqueeLabel: "Поверхности инвесторской модели",
      marqueePhrases: ["Product thesis", "3 year baseline", "5 year target", "10 year outlook", "Trips", "Delivery", "Places", "City corridors", "Partner loops", "Market model"],
      marketIntro: {
        label: "Market model",
        text:
          "Переключайте горизонт, сравнивайте assumptions и держите 3, 5 и 10 year growth view видимым до открытия deck.",
      },
      finalCta: {
        kicker: "Next step",
        title: "Если thesis интересен, откройте deck.",
        text: "Полная модель, assumptions, rollout logic и founder context.",
        openDeck: "Открыть deck",
        methodology: "Методология",
        founder: "Основатель",
      },
      projections: {
        outlook: "Outlook",
        totalTitle: "Total SOM • 3 / 5 / 10 лет",
        totalSubtitle: "Bars показывают % TAM (левая ось). Line показывает total ARR в $M (правая ось).",
        baseline: "Baseline (bit-to-bit)",
        target: "Target",
        shortfall: "shortfall",
        excess: "excess",
        howCalculated: "Как это считается",
        howCalculatedLabel: "Как это считается",
        totalChartTitle: "TAM / SAM / TOTAL SOM",
        rightAxisStreams: "Правая ось: $M (ARR by stream)",
        baselineRationale: "Baseline сохранён точно; transformations не применялись.",
        matchedRationale: "Target matched within rounding tolerance.",
        monetization: "Monetization",
        nonRideTitle: "Non-ride revenue streams (subset of total)",
        nonRideSubtitle: "Bars показывают % TAM (левая ось). Lines показывают ARR by stream в $M (правая ось).",
        nonRideChartTitle: "Subscriptions • Bookings • Events • B2B2C",
        rightAxisArr: "Правая ось: $M (ARR)",
        subsetBaseline: "Baseline (subset of total)",
        labels: {
          subscriptions: "Subscriptions",
          bookings: "Bookings (12%)",
          events: "Events (15%)",
          b2b2c: "B2B2C (fixed+uplift)",
        },
      },
    },
    cookie: {
      ariaLabel: "Согласие на cookies",
      choicesLabel: "Выбор cookies",
      kicker: "Cookies & data",
      title: "Мы уважаем вашу приватность",
      text:
        "Мы используем cookies, чтобы персонализировать, улучшать и измерять опыт. Выберите «Принять» для лучшей работы или «Отклонить», чтобы оставить только необходимые cookies.",
      learnMore: "Подробнее",
      decline: "Отклонить",
      accept: "Принять",
    },
  },
  en: {
    header: {
      brandHomeLabel: "SaturnusGo home",
      menu: "Menu",
      close: "Close",
      openMenuLabel: "Open menu",
      closeMenuLabel: "Close menu",
      overlayLabel: "SaturnusGo navigation",
      primaryNavigationLabel: "Primary navigation",
      allSectionsLabel: "All site sections",
      eyebrow: "Navigation",
      primaryNavigation: [
        { href: "/", label: "Home" },
        { href: "/features", label: "Features" },
        { href: "/mobile", label: "App" },
        { href: "/pricing", label: "Pricing" },
        { href: "/investors", label: "Investors" },
        { href: "/partners", label: "Partners" },
      ],
      navigationGroups: [
        {
          title: "Product",
          links: [
            { href: "/#trips", label: "Trips" },
            { href: "/#delivery", label: "Delivery" },
            { href: "/#places", label: "Places" },
            { href: "/topup-crypto", label: "Crypto top-up" },
          ],
        },
        {
          title: "Investors",
          links: [
            { href: "/investors", label: "Overview" },
            { href: "/investors/methodology", label: "Methodology" },
            { href: "/press", label: "Press" },
            { href: "/founder", label: "Founder" },
          ],
        },
        {
          title: "Partners",
          links: [
            { href: "/partners/about", label: "About partnership" },
            { href: "/partners/apply", label: "Apply" },
            { href: "/partners/listing", label: "Listing" },
            { href: "/partners/benefits/platform", label: "Platform" },
            { href: "/partners/benefits/reach", label: "Reach" },
            { href: "/partners/benefits/trusted", label: "Trust" },
            { href: "/partners/careers", label: "Careers" },
            { href: "/partners/compliance", label: "Compliance" },
            { href: "/partners/news", label: "News" },
            { href: "/partners/contacts", label: "Contacts" },
          ],
        },
        {
          title: "Help",
          links: [
            { href: "/support", label: "Support" },
            { href: "/faq", label: "FAQ" },
            { href: "/changelog", label: "Changelog" },
            { href: "/partners/privacy", label: "Privacy" },
            { href: "/partners/terms", label: "Terms" },
            { href: "/partners/cookies", label: "Cookies" },
          ],
        },
      ],
      language: {
        label: "Language",
        current: "Current language",
        options: { ru: "Русский", en: "English", es: "Español" },
      },
      footer: {
        tagline: "Urban mobility · Travel intelligence · City services",
        download: "Download app",
      },
    },
    home: {
      hero: {
        kicker: "SaturnusGo / urban mobility",
        title: "Ride, send, discover the city",
        lead:
          "A taxi-first home screen for rides, delivery, places, and city movement in one calm premium flow.",
        primaryAction: "Explore product",
        investorsAction: "Investors",
        deckAction: "Deck",
        scrollLabel: "Scroll to product intro",
        scrollText: "Scroll down",
      },
      value: {
        kicker: "Urban platform",
        title: "Taxi is the core. The city flow is the product.",
        subtitle:
          "SaturnusGo opens with movement, then keeps delivery, places and transport inside the same calm route-first hierarchy.",
      },
      feel: {
        kicker: "Motion system",
        title: "Scroll, expand and choose without losing context.",
        subtitle:
          "The home page uses slow reveal, active service expansion and a product carousel instead of static marketing blocks.",
      },
      screens: {
        kicker: "City flows",
        title: "Ride classes, delivery and places behave as one system.",
        subtitle:
          "Each product surface has its own image and action, but the page keeps the same visual grammar from top to bottom.",
      },
      trust: {
        kicker: "Presence",
        title: "Built for real city scenarios, not a generic app showcase.",
        subtitle:
          "Airport rides, daily routes, curated places and courier actions are presented as operational city zones.",
      },
      introLink: "More about the flow",
      serviceModules: [
        {
          id: "trips",
          index: "01",
          eyebrow: "TRIPS APPROACH",
          title: "Ride ordering",
          summary: "Fast taxi ordering with the route, price intent and next action visible from the first screen.",
          description:
            "The taxi module is the first product layer: pickup, destination, route confidence and class selection stay readable before the user commits.",
          action: "Start with rides",
          href: "#download-app",
          image: sharedHomeAssets.tripsImage,
        },
        {
          id: "delivery",
          index: "02",
          eyebrow: "DELIVERY EXECUTION",
          title: "Courier delivery",
          summary: "Send small parcels, purchases and personal items without leaving the mobility context.",
          description:
            "Delivery reuses the same city logic as rides: clear origin, destination, status and timing without forcing users through a different product mental model.",
          action: "Open delivery flow",
          href: "#download-app",
          image: sharedHomeAssets.deliveryImage,
        },
        {
          id: "places",
          index: "03",
          eyebrow: "CITY DISCOVERY",
          title: "Curated places",
          summary: "Restaurants, walks, hotels and local points appear as decisions around the journey, not as noise.",
          description:
            "Places turn the app into a travel layer: saved collections, curated recommendations and destination detail cards support the ride instead of competing with it.",
          action: "Explore places",
          href: "#download-app",
          image: sharedHomeAssets.placesImage,
        },
        {
          id: "transport",
          index: "04",
          eyebrow: "TRANSPORT LAYER",
          title: "City transport",
          summary: "Compare movement options while keeping taxi as the primary high-confidence action.",
          description:
            "Transport gives context to the route: transfers, public options and city movement can sit beside ride ordering without breaking the hierarchy.",
          action: "See transport options",
          href: "#download-app",
          image: sharedHomeAssets.transportImage,
        },
      ],
      rideClasses: [
        { id: "carpool", name: "Trips", eyebrow: "Define ride", description: "A calm everyday taxi option for the first SaturnusGo action.", image: sharedHomeAssets.tripsImage },
        { id: "delivery", name: "Delivery", eyebrow: "Moment context", description: "Small parcels and personal items inside the same city route system.", image: sharedHomeAssets.deliveryImage },
        { id: "places", name: "Places", eyebrow: "Destination layer", description: "Curated places around the user’s movement and saved collections.", image: sharedHomeAssets.placesImage },
        { id: "transport", name: "Transport", eyebrow: "Movement context", description: "Route context for transfers, public transport and city alternatives.", image: sharedHomeAssets.transportImage },
      ],
      howItFeels: {
        kicker: "Our city flows",
        previousLabel: "Previous city flow",
        nextLabel: "Next city flow",
        selectorLabel: "City flow selector",
      },
      screenPhrases: ["Taxi", "Delivery", "Places", "Transport", "Airport", "Collections", "Routes", "City flow"],
      marqueeLabel: "SaturnusGo product surfaces",
      presenceCards: [
        { city: "Buenos Aires", country: "Argentina", entity: "Launch city", detail: "Airport rides, daily routes and curated city points.", image: sharedHomeAssets.heroImage },
        { city: "Airport", country: "Transfer flow", entity: "Ride intent", detail: "Pickup confidence, timing and luggage-friendly movement.", image: sharedHomeAssets.tripsImage },
        { city: "City center", country: "Places layer", entity: "Discovery", detail: "Restaurants, walks and saved destinations around the route.", image: sharedHomeAssets.placesImage },
      ],
      download: {
        kicker: "Private access",
        title: "Download the app when the launch flow opens.",
        text:
          "QR, mobile preview and launch action stay at the end of the same narrative instead of breaking the product story.",
        qrAlt: "SaturnusGo app QR code",
      },
      footer: {
        socialsLabel: "SaturnusGo social links",
        founderRole: "Founder & CEO | CTO",
        rights: "All rights reserved.",
        groups: [
          { title: "Product", links: [{ label: "Home", href: "/" }, { label: "Features", href: "/features" }, { label: "Mobile", href: "/mobile" }, { label: "Pricing", href: "/pricing" }] },
          { title: "Company", links: [{ label: "Founder", href: "/founder" }, { label: "Investors", href: "/investors" }, { label: "Press", href: "/press" }, { label: "Support", href: "/support" }] },
          { title: "Partners", links: [{ label: "Partners", href: "/partners" }, { label: "Listing", href: "/partners/listing" }, { label: "Apply", href: "/partners/apply" }, { label: "Contacts", href: "/partners/contacts" }] },
          { title: "Legal", links: [{ label: "Privacy", href: "/partners/privacy" }, { label: "Terms", href: "/partners/terms" }, { label: "Cookies", href: "/partners/cookies" }, { label: "Compliance", href: "/partners/compliance" }] },
        ],
      },
    },
    investors: {
      hero: {
        topLine: "SaturnusGo / investors",
        openDeck: "Open deck",
        kicker: "Urban mobility thesis",
        title: "City movement, in one interface.",
        lead:
          "Trips, delivery, places, routes, and payment logic connected around repeated daily intent — built as one product surface, not a set of disconnected utilities.",
        reviewDeck: "Review deck",
        requestWalkthrough: "Request walkthrough",
        scrollLabel: "Scroll to investor thesis",
        scrollText: "Scroll down",
      },
      thesis: {
        kicker: "Investment case",
        title: "The investment case starts with the operating logic.",
        rows: [
          { label: "Problem", text: "Urban movement is fragmented: people switch between ride apps, maps, delivery tools, saved places, payments, and support." },
          { label: "Product", text: "SaturnusGo brings trips, delivery, places, routes, and payment flows into one calm city interface." },
          { label: "Wedge", text: "Start with high-frequency mobility, then expand through repeat routes, saved destinations, local partners, and city discovery." },
        ],
      },
      contentSections: [
        {
          id: "intro",
          kicker: "Investor context",
          title: "A taxi-first product that can become a city layer.",
          description:
            "The page explains the company without turning the screen into a grid of cards: thesis first, model next, then mechanics and rollout logic.",
          rows: [
            { label: "Why now", text: "People already expect mobility, payments, discovery, and support to feel connected. The market still gives them separate tools." },
            { label: "Frequency", text: "Rides create the first habit. Delivery, places, airport flows, and saved destinations make the habit more durable." },
            { label: "Model", text: "The projections section shows the 3, 5, and 10 year view directly on the page, so the assumptions stay visible." },
            { label: "Proof", text: "Before scale, closed cohorts must show repeat use, operational reliability, support quality, and paid conversion." },
          ],
        },
        {
          id: "model",
          kicker: "Business mechanics",
          title: "Revenue and retention come from the same city intent.",
          description:
            "The product does not try to win attention with noise. It makes the next movement decision easier and more repeatable.",
          rows: [
            { label: "Revenue", text: "Trip commission, delivery fees, local discovery, subscriptions, partner integrations, and selected B2B2C surfaces." },
            { label: "Retention", text: "Saved places, repeated routes, airport flows, and delivery context connect one daily use case to the next." },
            { label: "Distribution", text: "Fleets, couriers, venues, local communities, and partner routes create the first supply and demand loops." },
          ],
        },
        {
          id: "gtm",
          kicker: "GTM",
          title: "Prove repeat behavior before scaling the surface.",
          description:
            "Launch discipline matters more than broad availability. The first market needs density, reliability, and a product people return to.",
          rows: [
            { label: "Now", text: "Polish the product surface and run private city cohorts around repeat movement." },
            { label: "Next", text: "Validate supply density, support discipline, route quality, and delivery reliability." },
            { label: "Then", text: "Scale only where repeat behavior and local operating quality are already visible." },
          ],
        },
      ],
      marqueeLabel: "Investor model surfaces",
      marqueePhrases: ["Product thesis", "3 year baseline", "5 year target", "10 year outlook", "Trips", "Delivery", "Places", "City corridors", "Partner loops", "Market model"],
      marketIntro: {
        label: "Market model",
        text:
          "Switch the horizon, compare assumptions, and keep the 3, 5, and 10 year growth view visible before opening the deck.",
      },
      finalCta: {
        kicker: "Next step",
        title: "If the thesis is interesting, open the deck.",
        text: "Full model, assumptions, rollout logic, and founder context.",
        openDeck: "Open deck",
        methodology: "Methodology",
        founder: "Founder",
      },
      projections: {
        outlook: "Outlook",
        totalTitle: "Total SOM • 3 / 5 / 10 years",
        totalSubtitle: "Bars show % of TAM (left axis). Line shows total ARR in $M (right axis).",
        baseline: "Baseline (bit-to-bit)",
        target: "Target",
        shortfall: "shortfall",
        excess: "excess",
        howCalculated: "How this is calculated",
        howCalculatedLabel: "How this is calculated",
        totalChartTitle: "TAM / SAM / TOTAL SOM",
        rightAxisStreams: "Right: $M (ARR by stream)",
        baselineRationale: "Baseline preserved exactly; no transformations applied.",
        matchedRationale: "Target matched within rounding tolerance.",
        monetization: "Monetization",
        nonRideTitle: "Non-ride revenue streams (subset of total)",
        nonRideSubtitle: "Bars show % of TAM (left axis). Lines show ARR by stream in $M (right axis).",
        nonRideChartTitle: "Subscriptions • Bookings • Events • B2B2C",
        rightAxisArr: "Right: $M (ARR)",
        subsetBaseline: "Baseline (subset of total)",
        labels: {
          subscriptions: "Subscriptions",
          bookings: "Bookings (12%)",
          events: "Events (15%)",
          b2b2c: "B2B2C (fixed+uplift)",
        },
      },
    },
    cookie: {
      ariaLabel: "Cookie consent",
      choicesLabel: "Cookie choices",
      kicker: "Cookies & data",
      title: "We respect your privacy",
      text:
        "We use cookies to personalize, improve, and measure. Choose “Accept” for a better experience or “Decline” to keep only essential cookies.",
      learnMore: "Learn more",
      decline: "Decline",
      accept: "Accept",
    },
  },
  es: {
    header: {
      brandHomeLabel: "Inicio de SaturnusGo",
      menu: "Menú",
      close: "Cerrar",
      openMenuLabel: "Abrir menú",
      closeMenuLabel: "Cerrar menú",
      overlayLabel: "Navegación de SaturnusGo",
      primaryNavigationLabel: "Navegación principal",
      allSectionsLabel: "Todas las secciones del sitio",
      eyebrow: "Navegación",
      primaryNavigation: [
        { href: "/", label: "Inicio" },
        { href: "/features", label: "Funciones" },
        { href: "/mobile", label: "Aplicación" },
        { href: "/pricing", label: "Precios" },
        { href: "/investors", label: "Inversores" },
        { href: "/partners", label: "Socios" },
      ],
      navigationGroups: [
        {
          title: "Producto",
          links: [
            { href: "/#trips", label: "Viajes" },
            { href: "/#delivery", label: "Entrega" },
            { href: "/#places", label: "Lugares" },
            { href: "/topup-crypto", label: "Recarga crypto" },
          ],
        },
        {
          title: "Inversores",
          links: [
            { href: "/investors", label: "Resumen" },
            { href: "/investors/methodology", label: "Metodología" },
            { href: "/press", label: "Prensa" },
            { href: "/founder", label: "Fundador" },
          ],
        },
        {
          title: "Socios",
          links: [
            { href: "/partners/about", label: "Sobre la alianza" },
            { href: "/partners/apply", label: "Aplicar" },
            { href: "/partners/listing", label: "Listing" },
            { href: "/partners/benefits/platform", label: "Plataforma" },
            { href: "/partners/benefits/reach", label: "Alcance" },
            { href: "/partners/benefits/trusted", label: "Confianza" },
            { href: "/partners/careers", label: "Carreras" },
            { href: "/partners/compliance", label: "Compliance" },
            { href: "/partners/news", label: "Noticias" },
            { href: "/partners/contacts", label: "Contactos" },
          ],
        },
        {
          title: "Ayuda",
          links: [
            { href: "/support", label: "Soporte" },
            { href: "/faq", label: "FAQ" },
            { href: "/changelog", label: "Changelog" },
            { href: "/partners/privacy", label: "Privacy" },
            { href: "/partners/terms", label: "Terms" },
            { href: "/partners/cookies", label: "Cookies" },
          ],
        },
      ],
      language: {
        label: "Idioma",
        current: "Idioma actual",
        options: { ru: "Русский", en: "English", es: "Español" },
      },
      footer: {
        tagline: "Movilidad urbana · Inteligencia de viaje · Servicios de ciudad",
        download: "Descargar app",
      },
    },
    home: {
      hero: {
        kicker: "SaturnusGo / movilidad urbana",
        title: "Viajar, enviar y descubrir la ciudad",
        lead:
          "Una pantalla principal taxi-first para viajes, entregas, lugares y movimiento urbano en un solo flujo premium y tranquilo.",
        primaryAction: "Ver producto",
        investorsAction: "Inversores",
        deckAction: "Deck",
        scrollLabel: "Ir a la introducción del producto",
        scrollText: "Bajar",
      },
      value: {
        kicker: "Plataforma urbana",
        title: "El taxi es el núcleo. El flujo de ciudad es el producto.",
        subtitle:
          "SaturnusGo empieza con el movimiento y mantiene entrega, lugares y transporte dentro de una misma jerarquía tranquila y route-first.",
      },
      feel: {
        kicker: "Sistema de movimiento",
        title: "Desplázate, abre y elige sin perder contexto.",
        subtitle:
          "La home usa reveal suave, expansión activa de servicios y carrusel de producto en lugar de bloques estáticos de marketing.",
      },
      screens: {
        kicker: "Flujos urbanos",
        title: "Viajes, entrega y lugares se sienten como un solo sistema.",
        subtitle:
          "Cada superficie tiene su imagen y acción, pero la página conserva la misma gramática visual de arriba abajo.",
      },
      trust: {
        kicker: "Presencia",
        title: "Diseñado para escenarios reales de ciudad, no para un showcase genérico.",
        subtitle:
          "Aeropuertos, rutas diarias, lugares curados y acciones de courier se presentan como zonas operativas de la ciudad.",
      },
      introLink: "Más sobre el flujo",
      serviceModules: [
        {
          id: "trips",
          index: "01",
          eyebrow: "TRIPS APPROACH",
          title: "Pedido de viaje",
          summary: "Pide taxi rápido con ruta, intención de precio y siguiente acción visibles desde la primera pantalla.",
          description:
            "El módulo de viajes es la primera capa: recogida, destino, confianza de ruta y selección de clase permanecen legibles antes de confirmar.",
          action: "Empezar con viajes",
          href: "#download-app",
          image: sharedHomeAssets.tripsImage,
        },
        {
          id: "delivery",
          index: "02",
          eyebrow: "DELIVERY EXECUTION",
          title: "Entrega por courier",
          summary: "Envía paquetes pequeños, compras y objetos personales sin salir del contexto de movilidad.",
          description:
            "La entrega reutiliza la misma lógica urbana que los viajes: origen, destino, estado y tiempos claros sin cambiar el modelo mental.",
          action: "Abrir entrega",
          href: "#download-app",
          image: sharedHomeAssets.deliveryImage,
        },
        {
          id: "places",
          index: "03",
          eyebrow: "CITY DISCOVERY",
          title: "Lugares curados",
          summary: "Restaurantes, paseos, hoteles y puntos locales aparecen como decisiones alrededor del viaje, no como ruido.",
          description:
            "Lugares convierte la app en una capa travel: colecciones, recomendaciones y destinos guardados apoyan el viaje.",
          action: "Explorar lugares",
          href: "#download-app",
          image: sharedHomeAssets.placesImage,
        },
        {
          id: "transport",
          index: "04",
          eyebrow: "TRANSPORT LAYER",
          title: "Transporte urbano",
          summary: "Compara opciones de movimiento manteniendo el taxi como acción principal de alta confianza.",
          description:
            "Transporte da contexto a la ruta: transbordos, opciones públicas y alternativas urbanas pueden vivir junto al pedido de viaje.",
          action: "Ver transporte",
          href: "#download-app",
          image: sharedHomeAssets.transportImage,
        },
      ],
      rideClasses: [
        { id: "carpool", name: "Viajes", eyebrow: "Define ride", description: "Una opción diaria y tranquila para la primera acción en SaturnusGo.", image: sharedHomeAssets.tripsImage },
        { id: "delivery", name: "Entrega", eyebrow: "Moment context", description: "Paquetes pequeños y objetos personales dentro del mismo sistema urbano.", image: sharedHomeAssets.deliveryImage },
        { id: "places", name: "Lugares", eyebrow: "Destination layer", description: "Lugares curados alrededor del movimiento del usuario y sus colecciones.", image: sharedHomeAssets.placesImage },
        { id: "transport", name: "Transporte", eyebrow: "Movement context", description: "Contexto de ruta para transbordos, transporte público y alternativas urbanas.", image: sharedHomeAssets.transportImage },
      ],
      howItFeels: {
        kicker: "Flujos de ciudad",
        previousLabel: "Flujo anterior",
        nextLabel: "Siguiente flujo",
        selectorLabel: "Selector de flujo urbano",
      },
      screenPhrases: ["Taxi", "Entrega", "Lugares", "Transporte", "Aeropuerto", "Colecciones", "Rutas", "City flow"],
      marqueeLabel: "Superficies de producto SaturnusGo",
      presenceCards: [
        { city: "Buenos Aires", country: "Argentina", entity: "Ciudad de lanzamiento", detail: "Aeropuerto, rutas diarias y puntos curados de ciudad.", image: sharedHomeAssets.heroImage },
        { city: "Aeropuerto", country: "Transfer flow", entity: "Ride intent", detail: "Confianza de recogida, timing y movimiento con equipaje.", image: sharedHomeAssets.tripsImage },
        { city: "Centro urbano", country: "Places layer", entity: "Discovery", detail: "Restaurantes, paseos y destinos guardados alrededor de la ruta.", image: sharedHomeAssets.placesImage },
      ],
      download: {
        kicker: "Acceso privado",
        title: "Descarga la app cuando se abra el launch flow.",
        text:
          "QR, preview móvil y acción de lanzamiento quedan al final de la misma historia de producto sin romper la narrativa.",
        qrAlt: "Código QR de la app SaturnusGo",
      },
      footer: {
        socialsLabel: "Redes sociales de SaturnusGo",
        founderRole: "Founder & CEO | CTO",
        rights: "Todos los derechos reservados.",
        groups: [
          { title: "Producto", links: [{ label: "Inicio", href: "/" }, { label: "Funciones", href: "/features" }, { label: "Aplicación", href: "/mobile" }, { label: "Precios", href: "/pricing" }] },
          { title: "Compañía", links: [{ label: "Fundador", href: "/founder" }, { label: "Inversores", href: "/investors" }, { label: "Prensa", href: "/press" }, { label: "Soporte", href: "/support" }] },
          { title: "Socios", links: [{ label: "Socios", href: "/partners" }, { label: "Listing", href: "/partners/listing" }, { label: "Aplicar", href: "/partners/apply" }, { label: "Contactos", href: "/partners/contacts" }] },
          { title: "Legal", links: [{ label: "Privacy", href: "/partners/privacy" }, { label: "Terms", href: "/partners/terms" }, { label: "Cookies", href: "/partners/cookies" }, { label: "Compliance", href: "/partners/compliance" }] },
        ],
      },
    },
    investors: {
      hero: {
        topLine: "SaturnusGo / inversores",
        openDeck: "Abrir deck",
        kicker: "Tesis de movilidad urbana",
        title: "Movimiento urbano, en una sola interfaz.",
        lead:
          "Viajes, entrega, lugares, rutas y lógica de pago conectados alrededor de una intención diaria repetida: una superficie de producto, no utilidades separadas.",
        reviewDeck: "Ver deck",
        requestWalkthrough: "Solicitar walkthrough",
        scrollLabel: "Ir a la tesis para inversores",
        scrollText: "Bajar",
      },
      thesis: {
        kicker: "Investment case",
        title: "El caso de inversión empieza con la lógica operativa.",
        rows: [
          { label: "Problema", text: "El movimiento urbano está fragmentado: la gente cambia entre apps de viaje, mapas, entrega, lugares guardados, pagos y soporte." },
          { label: "Producto", text: "SaturnusGo reúne viajes, entrega, lugares, rutas y pagos en una interfaz urbana tranquila." },
          { label: "Wedge", text: "Empezar con movilidad de alta frecuencia y expandir por rutas repetidas, destinos guardados, socios locales y city discovery." },
        ],
      },
      contentSections: [
        {
          id: "intro",
          kicker: "Contexto para inversores",
          title: "Un producto taxi-first que puede convertirse en capa de ciudad.",
          description:
            "La página explica la compañía sin convertir la pantalla en una grilla de tarjetas: tesis primero, modelo después, mecánica y rollout.",
          rows: [
            { label: "Por qué ahora", text: "La gente ya espera que movilidad, pagos, discovery y soporte estén conectados. El mercado todavía les da herramientas separadas." },
            { label: "Frecuencia", text: "Los viajes crean el primer hábito. Entrega, lugares, aeropuerto y destinos guardados hacen el hábito más durable." },
            { label: "Modelo", text: "La sección de proyecciones muestra 3, 5 y 10 años en la página para mantener visibles las assumptions." },
            { label: "Proof", text: "Antes de escalar, las cohortes cerradas deben mostrar repeat use, operational reliability, support quality y paid conversion." },
          ],
        },
        {
          id: "model",
          kicker: "Mecánica de negocio",
          title: "Ingresos y retención nacen del mismo city intent.",
          description:
            "El producto no intenta ganar atención con ruido. Hace que la siguiente decisión de movimiento sea más fácil y repetible.",
          rows: [
            { label: "Revenue", text: "Comisión por viajes, delivery fees, local discovery, subscriptions, partner integrations y superficies B2B2C seleccionadas." },
            { label: "Retention", text: "Lugares guardados, rutas repetidas, aeropuerto y entrega conectan un daily use case con el siguiente." },
            { label: "Distribution", text: "Flotas, couriers, venues, comunidades locales y partner routes crean los primeros loops de oferta y demanda." },
          ],
        },
        {
          id: "gtm",
          kicker: "GTM",
          title: "Probar comportamiento repetido antes de escalar la superficie.",
          description:
            "La disciplina de lanzamiento importa más que la disponibilidad amplia. El primer mercado necesita density, reliability y un producto al que se vuelva.",
          rows: [
            { label: "Now", text: "Pulir la superficie de producto y correr private city cohorts alrededor del movimiento repetido." },
            { label: "Next", text: "Validar supply density, support discipline, route quality y delivery reliability." },
            { label: "Then", text: "Escalar solo donde repeat behavior y local operating quality ya sean visibles." },
          ],
        },
      ],
      marqueeLabel: "Superficies del modelo para inversores",
      marqueePhrases: ["Product thesis", "3 year baseline", "5 year target", "10 year outlook", "Trips", "Delivery", "Places", "City corridors", "Partner loops", "Market model"],
      marketIntro: {
        label: "Market model",
        text:
          "Cambia el horizonte, compara assumptions y mantén visible la vista de crecimiento a 3, 5 y 10 años antes de abrir el deck.",
      },
      finalCta: {
        kicker: "Siguiente paso",
        title: "Si la tesis interesa, abre el deck.",
        text: "Modelo completo, assumptions, rollout logic y founder context.",
        openDeck: "Abrir deck",
        methodology: "Metodología",
        founder: "Fundador",
      },
      projections: {
        outlook: "Outlook",
        totalTitle: "Total SOM • 3 / 5 / 10 años",
        totalSubtitle: "Las barras muestran % de TAM (eje izquierdo). La línea muestra ARR total en $M (eje derecho).",
        baseline: "Baseline (bit-to-bit)",
        target: "Target",
        shortfall: "shortfall",
        excess: "excess",
        howCalculated: "Cómo se calcula",
        howCalculatedLabel: "Cómo se calcula",
        totalChartTitle: "TAM / SAM / TOTAL SOM",
        rightAxisStreams: "Eje derecho: $M (ARR por stream)",
        baselineRationale: "Baseline preservado exactamente; no se aplicaron transformaciones.",
        matchedRationale: "Target matched within rounding tolerance.",
        monetization: "Monetización",
        nonRideTitle: "Streams de ingresos non-ride (subset del total)",
        nonRideSubtitle: "Las barras muestran % de TAM (eje izquierdo). Las líneas muestran ARR por stream en $M (eje derecho).",
        nonRideChartTitle: "Subscriptions • Bookings • Events • B2B2C",
        rightAxisArr: "Eje derecho: $M (ARR)",
        subsetBaseline: "Baseline (subset del total)",
        labels: {
          subscriptions: "Subscriptions",
          bookings: "Bookings (12%)",
          events: "Events (15%)",
          b2b2c: "B2B2C (fixed+uplift)",
        },
      },
    },
    cookie: {
      ariaLabel: "Consentimiento de cookies",
      choicesLabel: "Opciones de cookies",
      kicker: "Cookies y datos",
      title: "Respetamos tu privacidad",
      text:
        "Usamos cookies para personalizar, mejorar y medir la experiencia. Elige “Aceptar” para una mejor experiencia o “Rechazar” para mantener solo cookies esenciales.",
      learnMore: "Más información",
      decline: "Rechazar",
      accept: "Aceptar",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
