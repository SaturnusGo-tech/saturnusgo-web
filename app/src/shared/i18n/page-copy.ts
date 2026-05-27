import type { Locale } from "./types";

export const PUBLIC_PAGE_COPY = {
  ru: {
    features: {
      hero: {
        kicker: "SaturnusGo / возможности",
        title: "Продуктовые поверхности, которые работают как одна городская система.",
        text:
          "Поездки, доставка, места, платежи и партнёрские сценарии не являются отдельными обещаниями лендинга. Они спроектированы как один непрерывный пользовательский flow.",
        primary: "Исследовать flow",
        secondary: "Партнёрский слой",
      },
      surfacesHead: {
        kicker: "Основные модули",
        title: "Приложение строится вокруг движения, а не вокруг меню.",
        text:
          "Каждая возможность имеет конкретную роль в городской поездке. Пользователь не должен чувствовать границы модулей внутри продукта.",
      },
      surfaces: [
        { index: "01", title: "Ride core", text: "Такси, подача, маршрутный контекст, price preview и слой движения, с которого начинается каждый городской сценарий." },
        { index: "02", title: "Доставка", text: "Курьерские сценарии, привязанные к реальным местам, адресам и city intent, а не к отдельной утилите." },
        { index: "03", title: "Места", text: "Кураторское discovery, подборки, локальные рекомендации и контекст направления внутри того же product flow." },
        { index: "04", title: "Wallet", text: "Платежи, баланс, карты, бонусы, чеки и подписки как единый финансовый слой." },
      ],
      standardHead: {
        kicker: "Product standard",
        title: "Что должна сохранять каждая поверхность.",
        text:
          "Дизайн-система не только визуальная. Она определяет, как продукт ведёт себя при переходе от поиска к движению и оплате.",
      },
      guarantees: [
        { title: "Предсказуемый UX", text: "Интерфейс удерживает ориентацию пользователя: понятные состояния, читаемые переходы и отсутствие принудительной смены контекста." },
        { title: "Модульный продукт", text: "Каждая поверхность может развиваться отдельно, сохраняя ощущение единого SaturnusGo experience." },
        { title: "Операционное доверие", text: "Каждому сценарию нужны понятные цены, маршруты, партнёрский контекст и вход в поддержку до масштабирования." },
      ],
      scopeHead: {
        kicker: "Scope",
        title: "Текущая продуктовая карта.",
        text:
          "Это практическая поверхность SaturnusGo для первой волны запуска и партнёрских разговоров.",
      },
      details: [
        "Real-time ride and delivery flows",
        "Сохранённые места и городские подборки",
        "Видимость партнёров для отелей, кафе, событий и сервисов",
        "Платежные и бонусные механики, привязанные к активному сценарию",
        "Launch-ready product surfaces для city-by-city rollout",
      ],
      detailNote: "Сохранено как first-class product capability, а не декоративный marketing block.",
      marqueeLabel: "SaturnusGo feature flow",
      marquee: ["Ride", "Delivery", "Places", "Wallet", "Partners", "City flow"],
    },
    pricing: {
      hero: {
        kicker: "SaturnusGo / тарифы",
        title: "Подписочный слой для реального городского использования.",
        text:
          "Pricing должен ощущаться частью продукта, а не отдельной SaaS-таблицей. План должен поддерживать движение, доставку, места, бонусы и партнёрскую ценность.",
        primary: "Получить launch access",
        secondary: "Смотреть возможности",
      },
      plansHead: {
        kicker: "Plans",
        title: "Три уровня, одна продуктовая логика.",
        text:
          "Страница тарифов держит тот же editorial rhythm, что и главная: тёмный вход, светлая зона решения, тёмный product thesis.",
      },
      tiers: [
        { index: "01", title: "Стандартная", text: "Базовый доступ к городскому сценарию: поездки, сохранённые места, история и понятный финансовый слой.", value: "$8 / month" },
        { index: "02", title: "Расширенная", text: "Больше продуктовых преимуществ для частых поездок, delivery-сценариев и travel-планирования.", value: "$15 / month" },
        { index: "03", title: "Премиальная", text: "Приоритет, расширенные бонусы, улучшенный city-flow и premium-поведение внутри продукта.", value: "$29 / month" },
      ],
      logicHead: {
        kicker: "Pricing logic",
        title: "План должен объяснять продукт.",
        text:
          "SaturnusGo — не купонная страница. Ценность подписки должна быть связана с той же системой движения, которую пользователь видит на главном экране.",
      },
      principles: [
        { title: "Без шумного pricing", text: "Тариф должен объяснять пользу, а не создавать ощущение таблицы с искусственными ограничениями." },
        { title: "Scenario-based value", text: "Ценность подписки раскрывается в поездках, доставке, местах, бонусах и партнёрских сценариях." },
        { title: "Readable upgrade path", text: "Пользователь должен понимать, зачем переходить выше, без мелкого шрифта и скрытых условий." },
      ],
      next: {
        kicker: "Next step",
        title: "Launch pricing остаётся гибким до релиза.",
        text:
          "Финальные коммерческие условия нужно валидировать на реальном городском поведении, частоте поездок, partner supply и платежной механике.",
        cta: "Стать партнёром SaturnusGo",
      },
    },
    faq: {
      hero: {
        kicker: "SaturnusGo / FAQ",
        title: "Ответы без превращения страницы в чёрную стену.",
        text:
          "FAQ — это экран чтения. Он сохраняет cinematic entrance, но переносит ответы в спокойную светлую секцию.",
      },
      head: {
        kicker: "Questions",
        title: "Короткая версия.",
        text:
          "Чистые строки сканируются легче, чем тяжёлые карточки, особенно на support и documentation-like страницах.",
      },
      questions: [
        { index: "01", title: "Что такое SaturnusGo?", text: "Мобильный продукт, который соединяет поездки, доставку, места, wallet и партнёрские сервисы в один city flow." },
        { index: "02", title: "Это только такси?", text: "Нет. Ride layer — точка входа, но продукт строится вокруг движения, discovery, payments и partners." },
        { index: "03", title: "Где первый запуск?", text: "Первый коммерческий фокус — Южная Америка, с Аргентиной как самым естественным стартовым рынком." },
        { index: "04", title: "Партнёры могут подключиться до запуска?", text: "Да. Отели, рестораны, кафе, venues и локальные сервисы могут податься через partner flow." },
        { index: "05", title: "Почему сайт чередует тёмные и светлые секции?", text: "Главная задаёт rhythm: cinematic entry, светлые зоны чтения и тёмный product emphasis там, где нужна глубина." },
      ],
      support: {
        kicker: "Still unclear",
        title: "Поддержка должна продолжать product flow.",
        text:
          "Если ответ зависит от реальной поездки, оплаты, партнёра или места, правильный UX — contextual support, а не generic FAQ block.",
      },
    },
    support: {
      hero: {
        kicker: "SaturnusGo / поддержка",
        title: "Поддержка вокруг активного городского сценария.",
        text:
          "Help не должен ощущаться отдельным продуктом. Support layer должен понимать, едет ли пользователь, платит, сохраняет место или взаимодействует с партнёром.",
        primary: "Открыть FAQ",
        secondary: "Связаться с поддержкой",
      },
      pathsHead: {
        kicker: "Support paths",
        title: "Каждый запрос должен попасть в правильный lane.",
        text:
          "Чистый support experience — это routing, context и ownership. Страница следует той же светлой зоне чтения, что и Core Home.",
      },
      paths: [
        { index: "01", title: "Помощь с поездкой и доставкой", text: "Подача, маршрут, courier handoff, destination, pricing или active order state." },
        { index: "02", title: "Платежи и wallet", text: "Карты, баланс, top-up, subscriptions, receipts, bonuses и transaction clarity." },
        { index: "03", title: "Партнёры и места", text: "Listings, business profile, visibility, availability, contact routes и accuracy контента." },
      ],
      processHead: {
        kicker: "Resolution model",
        title: "Без ticket black box.",
        text:
          "Поддержка SaturnusGo должна отражать premium promise: быстрая ориентация, понятная ответственность и видимые следующие шаги.",
      },
      process: [
        { title: "Сначала контекст", text: "Support начинается с активного сценария, а не с generic ticket form. Пользователь не должен заново объяснять весь flow." },
        { title: "Чёткий ownership", text: "У каждого кейса должен быть один ответственный путь: SaturnusGo, partner, driver, courier или payment provider." },
        { title: "Читаемое решение", text: "Ответ должен объяснять, что случилось, что изменилось и что пользователь может сделать дальше." },
      ],
      contact: {
        kicker: "Contact",
        title: "Отправьте понятный кейс, получите понятный маршрут.",
        text:
          "Для launch conversations и early support свяжитесь с командой напрямую. In-product support позже наследует ту же логику.",
      },
    },
    changelog: {
      hero: {
        kicker: "SaturnusGo / Changelog",
        title: "Изменения продукта в том же visual rhythm.",
        text:
          "Changelog — это timeline, поэтому он должен быть светлым, читаемым и легко сканироваться после тёмного входа.",
      },
      head: {
        kicker: "Timeline",
        title: "Что изменилось.",
        text:
          "Сдержанный timeline читается лучше, чем grid of blocks, и держит контент в новой айдентике сайта.",
      },
      items: [
        { date: "2026", title: "Unified identity pass", text: "Публичные экраны переходят к Core Home rhythm: cinematic top, light reading body, dark product emphasis." },
        { date: "2025", title: "Investor model and projections", text: "Investor materials получили аналитическую поверхность с animated projections и methodology support." },
        { date: "2025", title: "Partner layer", text: "Partner onboarding, application flow и business scenarios отделены от consumer home story." },
      ],
      marqueeLabel: "SaturnusGo product evolution",
      marquee: ["Design", "Product", "Partners", "Mobility", "Payments", "Launch"],
    },
    press: {
      hero: {
        kicker: "SaturnusGo / пресса",
        title: "Более чистая media page для продуктовой истории.",
        text:
          "Пресс-страница должна быть читаемой и спокойной, а не ещё одной тёмной пустой поверхностью. Она следует тому же dark-to-light rhythm, что и home.",
      },
      head: {
        kicker: "Media facts",
        title: "Полезная информация без декоративных карточек.",
        text:
          "Press pages лучше работают как чистые fact rows: company, category, founder context и direct contact.",
      },
      facts: [
        { index: "01", title: "Company", text: "SaturnusGo — city mobility and travel product вокруг rides, delivery, places, wallet и partners." },
        { index: "02", title: "Category", text: "Urban mobility, travel intelligence, payments и local commerce в одном mobile experience." },
        { index: "03", title: "Contact", text: "press@saturnusgo.com" },
      ],
      request: {
        kicker: "Request",
        title: "Для интервью, screenshots и launch context.",
        text:
          "Свяжитесь с командой напрямую. Product visuals должны передаваться из latest build, а не из старых legacy screenshots.",
      },
    },
    founder: {
      hero: {
        kicker: "SaturnusGo / основатель",
        title: "От идеи такси к городскому operating layer.",
        text:
          "SaturnusGo начался с прямой mobility-проблемы и стал более широкой product thesis: один непрерывный flow для поездок, доставки, мест, платежей и локальных сервисов.",
        primary: "Экран инвестора",
        secondary: "Партнёрский экран",
      },
      storyHead: {
        kicker: "Story",
        title: "Продукт не остался внутри taxi category.",
        text:
          "Важна не founder mythology. Важен product judgment, который превратил простое ride app в более широкий city experience.",
      },
      storyRows: [
        { index: "01", title: "Началось с ride problem", text: "Первая идея была taxi product, но реальная боль шире: movement, places, payments и planning фрагментированы." },
        { index: "02", title: "Собрано как одна product system", text: "SaturnusGo вырос в mobile layer, где rides, delivery, places, wallet и partners ведут себя как один experience." },
        { index: "03", title: "Спроектировано для доверия", text: "Принцип продукта простой: predictable UX, clear states, honest pricing и без лишней сложности на поверхности." },
      ],
      principlesHead: {
        kicker: "Operating principles",
        title: "Как принимаются решения.",
        text:
          "Эти правила полезнее декоративной биографии, потому что объясняют, почему продукт выглядит и ведёт себя именно так.",
      },
      principles: [
        { title: "Trust before scale", text: "Mobility product работает только когда пользователь понимает, что происходит, сколько это стоит и кто отвечает за следующий шаг." },
        { title: "One motion", text: "Люди не думают модулями. Они думают направлениями, временем, деньгами и намерением." },
        { title: "Complexity inside", text: "Архитектура может быть глубокой, но интерфейс должен ощущаться простым, стабильным и спокойным." },
      ],
    },
    mobile: {
      hero: {
        kicker: "SaturnusGo / mobile preview",
        title: "Текущий web build настроен для desktop review.",
        text:
          "Вы можете продолжить на телефоне, но investor и product pages рассчитаны на широкие экраны, пока само приложение остаётся mobile-first.",
        primary: "Продолжить всё равно",
      },
      desktop: {
        kicker: "Desktop review",
        title: "Публичному сайту нужно место для графиков, продуктового rhythm и partner content.",
        text:
          "Этот gate намеренно простой: он объясняет ограничение и позволяет продолжить, не превращая страницу в сломанную mobile layout.",
      },
      dialog: {
        title: "Открыть desktop layout?",
        text: "Страницу можно посмотреть, но несколько секций могут быть сжаты на телефоне.",
        continue: "Продолжить",
        cancel: "Отмена",
      },
    },
  },
  en: {
    features: {
      hero: { kicker: "SaturnusGo / Features", title: "Product surfaces that behave as one city system.", text: "Rides, delivery, places, payments, and partner scenarios are not separate landing-page promises. They are designed to work as one continuous user flow.", primary: "Explore the flow", secondary: "Partner layer" },
      surfacesHead: { kicker: "Core modules", title: "The app is built around movement, not menus.", text: "Each feature has a concrete role in the city journey. The user should not feel module boundaries while moving through the product." },
      surfaces: [
        { index: "01", title: "Ride core", text: "Taxi, pickup, route context, pricing preview, and the movement layer that starts every city scenario." },
        { index: "02", title: "Delivery", text: "Courier scenarios tied to real places, addresses, and city intent instead of a separate disconnected utility." },
        { index: "03", title: "Places", text: "Curated discovery, collections, local recommendations, and destination context inside the same product flow." },
        { index: "04", title: "Wallet", text: "Payments, balance, cards, bonuses, receipts, and subscriptions built as one financial layer." },
      ],
      standardHead: { kicker: "Product standard", title: "What every surface must preserve.", text: "The design system is not only visual. It defines how the product behaves when users switch from search to movement to payment." },
      guarantees: [
        { title: "Predictable UX", text: "The interface keeps the user oriented: clear states, readable transitions, and no forced context switching." },
        { title: "Modular product", text: "Each surface can evolve independently while still behaving as one SaturnusGo experience." },
        { title: "Operational trust", text: "Every scenario needs clear pricing, routing, partner context, and support entry points before scale." },
      ],
      scopeHead: { kicker: "Scope", title: "The current product map.", text: "This is the practical surface area SaturnusGo needs for the first launch wave and partner conversations." },
      details: ["Real-time ride and delivery flows", "Saved places and city collections", "Partner visibility for hotels, cafés, events, and services", "Payment and bonus mechanics tied to the active scenario", "Launch-ready product surfaces for city-by-city rollout"],
      detailNote: "Kept as a first-class product capability instead of a decorative marketing block.",
      marqueeLabel: "SaturnusGo feature flow",
      marquee: ["Ride", "Delivery", "Places", "Wallet", "Partners", "City flow"],
    },
    pricing: {
      hero: { kicker: "SaturnusGo / Pricing", title: "A subscription layer for real city usage.", text: "Pricing should feel like part of the product, not a detached SaaS grid. The plan must support movement, delivery, places, bonuses, and partner value.", primary: "Join launch access", secondary: "See features" },
      plansHead: { kicker: "Plans", title: "Three levels, one product logic.", text: "The pricing page keeps the same editorial rhythm as the home screen: dark entry, light decision area, dark product thesis." },
      tiers: [
        { index: "01", title: "Standard", text: "Basic access to the city scenario: rides, saved places, history, and a readable financial layer.", value: "$8 / month" },
        { index: "02", title: "Extended", text: "More product advantages for frequent rides, delivery scenarios, and travel planning.", value: "$15 / month" },
        { index: "03", title: "Premium", text: "Priority, expanded bonuses, improved city flow, and premium behavior inside the product.", value: "$29 / month" },
      ],
      logicHead: { kicker: "Pricing logic", title: "The plan should explain the product.", text: "SaturnusGo is not a coupon page. Subscription value has to be tied to the same movement system users experience on the main screen." },
      principles: [
        { title: "No noisy pricing", text: "The plan should explain value instead of feeling like a table of artificial restrictions." },
        { title: "Scenario-based value", text: "Subscription value appears through rides, delivery, places, bonuses, and partner scenarios." },
        { title: "Readable upgrade path", text: "Users should understand why to move higher without tiny print or hidden conditions." },
      ],
      next: { kicker: "Next step", title: "Launch pricing stays flexible until release.", text: "Final commercial terms should be validated against real city behavior, ride frequency, partner supply, and payment mechanics.", cta: "Partner with SaturnusGo" },
    },
    faq: {
      hero: { kicker: "SaturnusGo / FAQ", title: "Answers without turning the page into a black wall.", text: "FAQ is a reading screen. It keeps the cinematic entrance but moves the actual answers into a calm light section." },
      head: { kicker: "Questions", title: "The short version.", text: "Clean rows are easier to scan than heavy cards, especially on support and documentation-like pages." },
      questions: [
        { index: "01", title: "What is SaturnusGo?", text: "A mobile product that connects rides, delivery, places, wallet, and partner services into one city flow." },
        { index: "02", title: "Is it only a taxi app?", text: "No. The ride layer is the entry point, but the product is built around movement, discovery, payments, and partners." },
        { index: "03", title: "Where will it launch first?", text: "The first commercial focus is South America, with Argentina as the most natural starting market." },
        { index: "04", title: "Can partners join before launch?", text: "Yes. Hotels, restaurants, cafés, venues, and local services can apply through the partner flow." },
        { index: "05", title: "Why does the site alternate dark and light sections?", text: "The home screen defines the rhythm: cinematic entry, light reading areas, and dark product emphasis where depth is needed." },
      ],
      support: { kicker: "Still unclear", title: "Support should continue the product flow.", text: "If the answer depends on a real ride, payment, partner, or place, the correct UX is contextual support, not a generic FAQ block." },
    },
    support: {
      hero: { kicker: "SaturnusGo / Support", title: "Support built around the active city scenario.", text: "Help should not feel like a separate product. The support layer must understand whether the user is riding, paying, saving a place, or interacting with a partner.", primary: "Open FAQ", secondary: "Contact support" },
      pathsHead: { kicker: "Support paths", title: "Every request should land in the right lane.", text: "A clean support experience is routing, context, and ownership. The page follows the same light reading area as Core Home." },
      paths: [
        { index: "01", title: "Ride and delivery help", text: "Issues around pickup, route, courier handoff, destination, pricing, or active order state." },
        { index: "02", title: "Payments and wallet", text: "Cards, balance, top-up, subscriptions, receipts, bonuses, and transaction clarity." },
        { index: "03", title: "Partners and places", text: "Listings, business profile, visibility, availability, contact routes, and content accuracy." },
      ],
      processHead: { kicker: "Resolution model", title: "No ticket black box.", text: "SaturnusGo support has to reflect the premium product promise: fast orientation, clear responsibility, and visible next steps." },
      process: [
        { title: "Context first", text: "Support starts from the active scenario, not from a generic ticket form. The user should never re-explain the whole flow." },
        { title: "Clear ownership", text: "Each case needs one responsible path: SaturnusGo, partner, driver, courier, or payment provider." },
        { title: "Readable resolution", text: "The answer should explain what happened, what changed, and what the user can do next." },
      ],
      contact: { kicker: "Contact", title: "Send a clear case, get a clear route.", text: "For launch conversations and early support, contact the team directly. In-product support should later inherit the same logic." },
    },
    changelog: {
      hero: { kicker: "SaturnusGo / Changelog", title: "Product changes with the same visual rhythm.", text: "Changelog is a timeline, so it should be light, readable, and easy to scan after the initial dark entry." },
      head: { kicker: "Timeline", title: "What changed.", text: "A restrained timeline reads better than a grid of blocks and keeps the content aligned with the new site identity." },
      items: [
        { date: "2026", title: "Unified identity pass", text: "Public screens move to the Core Home rhythm: cinematic top, light reading body, dark product emphasis." },
        { date: "2025", title: "Investor model and projections", text: "Investor materials received a dedicated analytical surface with animated projections and methodology support." },
        { date: "2025", title: "Partner layer", text: "Partner onboarding, application flow, and business scenarios were separated from the consumer home story." },
      ],
      marqueeLabel: "SaturnusGo product evolution",
      marquee: ["Design", "Product", "Partners", "Mobility", "Payments", "Launch"],
    },
    press: {
      hero: { kicker: "SaturnusGo / Press", title: "A cleaner media page for the product story.", text: "The press page should be readable and calm, not another dark empty surface. It now follows the same dark-to-light rhythm as the home screen." },
      head: { kicker: "Media facts", title: "Useful information without decorative cards.", text: "Press pages work better as clean fact rows: company, category, founder context, and direct contact." },
      facts: [
        { index: "01", title: "Company", text: "SaturnusGo is a city mobility and travel product built around rides, delivery, places, wallet, and partners." },
        { index: "02", title: "Category", text: "Urban mobility, travel intelligence, payments, and local commerce in one mobile experience." },
        { index: "03", title: "Contact", text: "press@saturnusgo.com" },
      ],
      request: { kicker: "Request", title: "For interviews, screenshots, and launch context.", text: "Contact the team directly. Product visuals should be shared from the latest build, not from old legacy page screenshots." },
    },
    founder: {
      hero: { kicker: "SaturnusGo / Founder", title: "From a taxi idea to a city operating layer.", text: "SaturnusGo started from a direct mobility problem and became a wider product thesis: one continuous flow for rides, delivery, places, payments, and local services.", primary: "Investor view", secondary: "Partner view" },
      storyHead: { kicker: "Story", title: "The product did not stay inside the taxi category.", text: "The important part is not founder mythology. The important part is the product judgment that turned a simple ride app into a broader city experience." },
      storyRows: [
        { index: "01", title: "Started from the ride problem", text: "The first idea was a taxi product, but the real pain was broader: movement, places, payments, and planning are fragmented." },
        { index: "02", title: "Built as one product system", text: "SaturnusGo evolved into a mobile layer where rides, delivery, places, wallet, and partners can behave as one experience." },
        { index: "03", title: "Designed for trust", text: "The product principle is simple: predictable UX, clear states, honest pricing, and no unnecessary complexity on the surface." },
      ],
      principlesHead: { kicker: "Operating principles", title: "How decisions are made.", text: "These rules are more useful than a decorative biography because they explain why the product looks and behaves the way it does." },
      principles: [
        { title: "Trust before scale", text: "A mobility product only works when users understand what is happening, what it costs, and who owns the next step." },
        { title: "One motion", text: "People do not think in modules. They think in destinations, timing, money, and intent." },
        { title: "Complexity inside", text: "Architecture can be deep, but the interface must feel simple, stable, and calm." },
      ],
    },
    mobile: {
      hero: { kicker: "SaturnusGo / Mobile preview", title: "The current web build is tuned for desktop review.", text: "You can still continue on mobile, but the investor and product pages are designed for wide screens while the app itself remains mobile-first.", primary: "Continue anyway" },
      desktop: { kicker: "Desktop review", title: "The public site needs space for charts, product rhythm, and partner content.", text: "This gate is intentionally simple: it explains the constraint and lets the user continue without turning the page into a broken mobile layout." },
      dialog: { title: "Open the desktop layout?", text: "The page can be viewed, but several sections may be compressed on a phone.", continue: "Continue", cancel: "Cancel" },
    },
  },
  es: {
    features: {
      hero: { kicker: "SaturnusGo / funciones", title: "Superficies de producto que funcionan como un solo sistema urbano.", text: "Viajes, entrega, lugares, pagos y escenarios de socios no son promesas separadas de landing. Están diseñados como un flujo continuo.", primary: "Explorar el flujo", secondary: "Capa de socios" },
      surfacesHead: { kicker: "Módulos principales", title: "La app se construye alrededor del movimiento, no de menús.", text: "Cada función tiene un rol concreto en el viaje urbano. El usuario no debería sentir límites de módulos dentro del producto." },
      surfaces: [
        { index: "01", title: "Ride core", text: "Taxi, recogida, contexto de ruta, preview de precio y capa de movimiento que inicia cada escenario urbano." },
        { index: "02", title: "Entrega", text: "Escenarios de courier ligados a lugares reales, direcciones e intención urbana, no a una utilidad separada." },
        { index: "03", title: "Lugares", text: "Discovery curado, colecciones, recomendaciones locales y contexto de destino dentro del mismo product flow." },
        { index: "04", title: "Wallet", text: "Pagos, saldo, tarjetas, bonos, recibos y suscripciones como una sola capa financiera." },
      ],
      standardHead: { kicker: "Product standard", title: "Lo que cada superficie debe conservar.", text: "El sistema de diseño no es solo visual. Define cómo se comporta el producto cuando el usuario pasa de búsqueda a movimiento y pago." },
      guarantees: [
        { title: "UX predecible", text: "La interfaz mantiene orientado al usuario: estados claros, transiciones legibles y sin cambios forzados de contexto." },
        { title: "Producto modular", text: "Cada superficie puede evolucionar de forma independiente y seguir sintiéndose como una sola experiencia SaturnusGo." },
        { title: "Confianza operativa", text: "Cada escenario necesita precios claros, routing, contexto de socio y entrada a soporte antes de escalar." },
      ],
      scopeHead: { kicker: "Scope", title: "El mapa actual del producto.", text: "Esta es el área práctica que SaturnusGo necesita para la primera ola de lanzamiento y conversaciones con socios." },
      details: ["Flujos de viaje y entrega en tiempo real", "Lugares guardados y colecciones urbanas", "Visibilidad de socios para hoteles, cafés, eventos y servicios", "Pagos y bonos ligados al escenario activo", "Superficies launch-ready para rollout ciudad por ciudad"],
      detailNote: "Se mantiene como capacidad de producto de primer nivel, no como bloque decorativo de marketing.",
      marqueeLabel: "SaturnusGo feature flow",
      marquee: ["Ride", "Delivery", "Places", "Wallet", "Partners", "City flow"],
    },
    pricing: {
      hero: { kicker: "SaturnusGo / precios", title: "Una capa de suscripción para uso urbano real.", text: "Pricing debe sentirse parte del producto, no una grilla SaaS separada. El plan debe apoyar movimiento, entrega, lugares, bonos y valor de socios.", primary: "Unirse al launch access", secondary: "Ver funciones" },
      plansHead: { kicker: "Plans", title: "Tres niveles, una lógica de producto.", text: "La página de precios mantiene el mismo ritmo editorial que la home: entrada oscura, zona clara de decisión y tesis de producto oscura." },
      tiers: [
        { index: "01", title: "Estándar", text: "Acceso básico al escenario urbano: viajes, lugares guardados, historial y una capa financiera legible.", value: "$8 / month" },
        { index: "02", title: "Extendida", text: "Más ventajas de producto para viajes frecuentes, escenarios de entrega y planificación travel.", value: "$15 / month" },
        { index: "03", title: "Premium", text: "Prioridad, bonos ampliados, city-flow mejorado y comportamiento premium dentro del producto.", value: "$29 / month" },
      ],
      logicHead: { kicker: "Pricing logic", title: "El plan debe explicar el producto.", text: "SaturnusGo no es una página de cupones. El valor de suscripción tiene que estar ligado al mismo sistema de movimiento que el usuario vive en la pantalla principal." },
      principles: [
        { title: "Sin pricing ruidoso", text: "El plan debe explicar valor, no sentirse como una tabla de restricciones artificiales." },
        { title: "Scenario-based value", text: "El valor aparece en viajes, entrega, lugares, bonos y escenarios de socios." },
        { title: "Upgrade path legible", text: "El usuario debe entender por qué subir de nivel sin letra chica ni condiciones ocultas." },
      ],
      next: { kicker: "Siguiente paso", title: "El launch pricing se mantiene flexible hasta el release.", text: "Los términos comerciales finales deben validarse contra comportamiento urbano real, frecuencia de viajes, partner supply y mecánica de pagos.", cta: "Ser socio de SaturnusGo" },
    },
    faq: {
      hero: { kicker: "SaturnusGo / FAQ", title: "Respuestas sin convertir la página en un muro negro.", text: "FAQ es una pantalla de lectura. Conserva la entrada cinematográfica y mueve las respuestas a una sección clara y tranquila." },
      head: { kicker: "Preguntas", title: "La versión corta.", text: "Las filas limpias se escanean mejor que tarjetas pesadas, especialmente en páginas de soporte o documentación." },
      questions: [
        { index: "01", title: "¿Qué es SaturnusGo?", text: "Un producto móvil que conecta viajes, entrega, lugares, wallet y servicios de socios en un solo city flow." },
        { index: "02", title: "¿Es solo una app de taxi?", text: "No. La capa de viajes es el punto de entrada, pero el producto se construye alrededor de movimiento, discovery, pagos y socios." },
        { index: "03", title: "¿Dónde será el primer lanzamiento?", text: "El primer foco comercial es Sudamérica, con Argentina como mercado inicial natural." },
        { index: "04", title: "¿Los socios pueden unirse antes del lanzamiento?", text: "Sí. Hoteles, restaurantes, cafés, venues y servicios locales pueden aplicar por el flujo de socios." },
        { index: "05", title: "¿Por qué el sitio alterna secciones oscuras y claras?", text: "La home define el ritmo: entrada cinematográfica, zonas claras de lectura y énfasis oscuro donde hace falta profundidad." },
      ],
      support: { kicker: "¿Sigue poco claro?", title: "El soporte debe continuar el product flow.", text: "Si la respuesta depende de un viaje real, pago, socio o lugar, el UX correcto es soporte contextual, no un bloque FAQ genérico." },
    },
    support: {
      hero: { kicker: "SaturnusGo / soporte", title: "Soporte construido alrededor del escenario urbano activo.", text: "Ayuda no debe sentirse como un producto separado. La capa de soporte debe entender si el usuario viaja, paga, guarda un lugar o interactúa con un socio.", primary: "Abrir FAQ", secondary: "Contactar soporte" },
      pathsHead: { kicker: "Support paths", title: "Cada solicitud debe llegar al carril correcto.", text: "Una experiencia de soporte limpia es routing, contexto y ownership. La página sigue la misma zona clara de lectura que Core Home." },
      paths: [
        { index: "01", title: "Ayuda con viaje y entrega", text: "Problemas de recogida, ruta, handoff de courier, destino, pricing o estado de orden activa." },
        { index: "02", title: "Pagos y wallet", text: "Tarjetas, saldo, top-up, suscripciones, recibos, bonos y claridad de transacción." },
        { index: "03", title: "Socios y lugares", text: "Listings, business profile, visibilidad, disponibilidad, rutas de contacto y precisión de contenido." },
      ],
      processHead: { kicker: "Resolution model", title: "Sin ticket black box.", text: "El soporte SaturnusGo debe reflejar la promesa premium: orientación rápida, responsabilidad clara y siguientes pasos visibles." },
      process: [
        { title: "Contexto primero", text: "El soporte empieza desde el escenario activo, no desde un formulario genérico. El usuario no debe explicar todo de nuevo." },
        { title: "Ownership claro", text: "Cada caso necesita una ruta responsable: SaturnusGo, socio, driver, courier o payment provider." },
        { title: "Resolución legible", text: "La respuesta debe explicar qué pasó, qué cambió y qué puede hacer el usuario después." },
      ],
      contact: { kicker: "Contacto", title: "Envía un caso claro, recibe una ruta clara.", text: "Para launch conversations y soporte temprano, contacta al equipo directamente. El soporte in-product heredará luego la misma lógica." },
    },
    changelog: {
      hero: { kicker: "SaturnusGo / Changelog", title: "Cambios de producto con el mismo ritmo visual.", text: "Changelog es una timeline, así que debe ser clara, legible y fácil de escanear después de la entrada oscura." },
      head: { kicker: "Timeline", title: "Qué cambió.", text: "Una timeline contenida se lee mejor que una grilla de bloques y mantiene el contenido alineado con la nueva identidad." },
      items: [
        { date: "2026", title: "Unified identity pass", text: "Las pantallas públicas pasan al ritmo Core Home: cinematic top, light reading body, dark product emphasis." },
        { date: "2025", title: "Investor model and projections", text: "Los materiales de inversores recibieron una superficie analítica con animated projections y methodology support." },
        { date: "2025", title: "Partner layer", text: "Partner onboarding, application flow y business scenarios se separaron de la historia consumer home." },
      ],
      marqueeLabel: "SaturnusGo product evolution",
      marquee: ["Design", "Product", "Partners", "Mobility", "Payments", "Launch"],
    },
    press: {
      hero: { kicker: "SaturnusGo / prensa", title: "Una media page más limpia para la historia del producto.", text: "La página de prensa debe ser legible y tranquila, no otra superficie oscura vacía. Sigue el mismo ritmo dark-to-light que la home." },
      head: { kicker: "Media facts", title: "Información útil sin tarjetas decorativas.", text: "Las press pages funcionan mejor como fact rows limpias: compañía, categoría, contexto del fundador y contacto directo." },
      facts: [
        { index: "01", title: "Company", text: "SaturnusGo es un producto de movilidad urbana y travel construido alrededor de rides, delivery, places, wallet y partners." },
        { index: "02", title: "Category", text: "Urban mobility, travel intelligence, payments y local commerce en una experiencia móvil." },
        { index: "03", title: "Contact", text: "press@saturnusgo.com" },
      ],
      request: { kicker: "Request", title: "Para entrevistas, screenshots y launch context.", text: "Contacta al equipo directamente. Los product visuals deben compartirse desde el latest build, no desde screenshots legacy." },
    },
    founder: {
      hero: { kicker: "SaturnusGo / fundador", title: "De una idea de taxi a una capa operativa de ciudad.", text: "SaturnusGo empezó con un problema directo de movilidad y se convirtió en una tesis de producto más amplia: un flujo continuo para viajes, entrega, lugares, pagos y servicios locales.", primary: "Vista inversor", secondary: "Vista socios" },
      storyHead: { kicker: "Historia", title: "El producto no se quedó dentro de la categoría taxi.", text: "Lo importante no es founder mythology. Lo importante es el product judgment que convirtió una simple ride app en una experiencia urbana más amplia." },
      storyRows: [
        { index: "01", title: "Empezó desde el ride problem", text: "La primera idea fue un taxi product, pero el dolor real era más amplio: movement, places, payments y planning están fragmentados." },
        { index: "02", title: "Construido como un sistema", text: "SaturnusGo evolucionó a una mobile layer donde rides, delivery, places, wallet y partners se comportan como una experiencia." },
        { index: "03", title: "Diseñado para confianza", text: "El principio es simple: predictable UX, clear states, honest pricing y sin complejidad innecesaria en la superficie." },
      ],
      principlesHead: { kicker: "Operating principles", title: "Cómo se toman decisiones.", text: "Estas reglas son más útiles que una biografía decorativa porque explican por qué el producto se ve y se comporta así." },
      principles: [
        { title: "Trust before scale", text: "Un producto de movilidad funciona solo cuando el usuario entiende qué pasa, cuánto cuesta y quién se hace cargo del siguiente paso." },
        { title: "One motion", text: "Las personas no piensan en módulos. Piensan en destinos, timing, dinero e intención." },
        { title: "Complexity inside", text: "La arquitectura puede ser profunda, pero la interfaz debe sentirse simple, estable y tranquila." },
      ],
    },
    mobile: {
      hero: { kicker: "SaturnusGo / mobile preview", title: "El web build actual está ajustado para desktop review.", text: "Puedes continuar en móvil, pero las páginas de inversores y producto están diseñadas para pantallas anchas mientras la app sigue siendo mobile-first.", primary: "Continuar igual" },
      desktop: { kicker: "Desktop review", title: "El sitio público necesita espacio para gráficos, ritmo de producto y partner content.", text: "Este gate es simple a propósito: explica la restricción y permite continuar sin convertir la página en un layout móvil roto." },
      dialog: { title: "¿Abrir el desktop layout?", text: "La página puede verse, pero varias secciones podrían comprimirse en un teléfono.", continue: "Continuar", cancel: "Cancelar" },
    },
  },
} satisfies Record<Locale, Record<string, unknown>>;
