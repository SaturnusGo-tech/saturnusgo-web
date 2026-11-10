# Falcon Privacy Policy

**Version dated 10 November 2026**

This policy takes effect when published and covers the Falcon website, cloud workspaces and desktop application. Falcon is operated by **Mercury Rucks**, an individual. For privacy questions and requests, email [falcon@saturnusgo.com](mailto:falcon@saturnusgo.com). Postal correspondence can be sent to Balcarce 3154, Mar del Plata, Argentina.

## 1. Who is responsible for your data

The Falcon operator determines how personal data is processed for the website, account administration, plan requests, support, security and compliance. If you use Falcon in an organization's workspace, the organization generally determines which personal data is included in its workspace content and who can access it. Falcon processes that content to provide the service on the organization's instructions under the applicable agreement. The organization may have its own privacy and access policies.

## 2. What Falcon collects and why

| Data | How Falcon uses it |
| --- | --- |
| Account and sign-in information, such as name, email address, sign-in provider identifier, profile image when supplied, and session details | To create and authenticate your account, verify your email, sign you in to the desktop app, and protect account access. Google sign-in can provide your verified email address, basic profile and stable Google account identifier. Where corporate SAML sign-in is enabled, your organization's identity provider supplies the identifier and sign-in attributes configured for Falcon. |
| Workspace data, such as names and email addresses of invited members, roles, project details, documentation, test cases, runs, comments, attachments, evidence and change history | To send invitations, control access, display content to authorized users, maintain revision history and support QA workflows. Falcon receives this information from users, workspace administrators and services connected to the workspace. |
| Technical and security data, such as IP address, browser or device information, timestamps, and request and audit events | To deliver the service, diagnose failures, detect abuse, protect accounts and investigate security incidents. |
| Plan requests, such as applicant name, email, role, workspace, plan, language, optional note, and request status and dates | To review and respond to access requests and track their status. The current plan request and personal trial do not collect card details. |
| Support messages and related information, such as contact details, the contents of the request, attachments and the relevant workspace or page | To respond, diagnose problems and track resolutions. In-app support can include the names and contact details of the sender and workspace contacts where available. |
| Inputs to optional AI and connected features | To provide the action you request. Section 3 explains the data involved and the services that may receive it. |

Where the law requires a legal basis, Falcon processes personal data to provide the service or take steps at your request before entering into an agreement, to comply with legal obligations, to pursue legitimate interests such as security and support where permitted, or on the basis of consent where required. If you withhold information necessary for an account or a requested feature, Falcon may be unable to provide that account or feature.

## 3. Connected services and AI

Falcon exchanges information with the following services when an authorized user connects them, configures an automation, or uses a feature that calls them. The information shared depends on the connection, destination and permissions granted.

| Connected service | Information that may be exchanged |
| --- | --- |
| **JetBrains YouTrack, Atlassian Jira, Linear and Trello** | Defect titles and descriptions, identifiers, priorities, statuses, reproduction details, expected and actual results, and links to Falcon records, as needed to create or synchronize issues or cards. |
| **Slack and Telegram** | Slack can receive configured notifications about runs, defects or comments, including relevant text, results and links. Telegram can receive notifications you enable, including relevant titles, summaries and links. Falcon uses your linked chat identifier to deliver them. |
| **Atlassian Confluence** | Published run reports, which may include run names and identifiers, environments, builds, results, descriptions and links to Falcon. |
| **GitHub** | Falcon can receive configured repository and workflow events and request repository metadata and change information, such as commit identifiers and changed paths, to match runs to changes or perform impact analysis. |
| **Swagger / OpenAPI and API testing** | Falcon can contact the specification or API endpoint you configure. The destination may receive request details and any authentication, parameters or payload you provide for that request. |
| **OpenAI Codex and other authorized MCP clients** | A connected client can retrieve or change permitted workspace data, such as test cases, documentation, runs and defects, when it invokes the corresponding Falcon tools. The connection's permissions determine which operations and records are accessible. |

Workspace administrators can manage or disconnect integrations in Falcon and revoke access in the connected service where supported. Copies already delivered may remain in the destination under its settings and retention rules.

- **Media search.** If you use GIF search, the browser sends your search query and language to KLIPY. Retrieving a GIF can also send its identifier to KLIPY.
- **Falcon AI Help.** Falcon stores Help conversations so you can reopen them. To answer a Help question, Falcon can send the question, relevant Help content and conversation context to OpenAI. If you choose to share an answer in a workspace, people with access to the shared link can view that answer in accordance with the link's permissions. You can revoke the link in Falcon.
- **Other AI features.** When you use writing, import or diagram generation tools, Falcon sends the input needed for the requested operation to OpenAI. This may include a prompt, selected text or an uploaded source. Transcription can send audio. The data sent depends on the feature and the material you provide or select. Share only material you are authorized to use with the feature.
- **Impact analysis.** Where AI impact analysis is enabled, Falcon can send selected change context and relevant test coverage information to OpenRouter, which routes the request to the configured model provider.

A connected service may apply its own privacy notice when it determines how to process data it receives.

## 4. Who receives data and where it is processed

- **Hosting and delivery.** Railway hosts the application and database. Cloudflare provides network delivery and private file storage. GitHub Pages serves public site files.
- **Sign-in.** Google, the organization's configured identity provider, or Auth0 where legacy sign-in is enabled may process the information required for the relevant method.
- **Email and support.** Proton Mail handles direct correspondence. Configured mail delivery services receive the addresses and message content needed to deliver verification, invitation and other service messages. JetBrains YouTrack can receive in-app support requests, including the contact details, context and attachments needed to handle them.
- **Optional features.** Connected workspace services, AI providers and media search providers receive the information described in section 3.

Other recipients may include authorized workspace members and administrators. Falcon may disclose data in response to a binding legal obligation or where law permits disclosure and it is necessary to protect legal rights, prevent abuse or respond to a security incident.

Some providers may process data outside your country. International transfers are subject to applicable data protection law. Contact Falcon for information about the recipients, countries of processing and safeguards relevant to your use.

## 5. Cookies and local storage

Falcon uses cookies and similar storage to sign you in, secure and resume sessions, and remember settings such as language and display preferences. The desktop app keeps information needed for its workspace sessions and sign-in handoff. You can clear stored data in your browser. Clearing session data can sign you out, and blocking essential storage can affect sign-in and other features.

## 6. Retention and security

Falcon retains account data for as long as needed to administer your account and retains workspace content for as long as necessary to provide the service, subject to the workspace agreement, applicable instructions and legal obligations. When the personal trial ends, viewing and export remain available under the [Personal Trial Terms](https://tms.saturnusgo.com/trial-terms/?lang=en). Trial expiry does not automatically delete your data.

Unsubmitted in-app support drafts expire after 24 hours and are removed during routine cleanup. Submitted support records, plan requests and security logs are retained for the time needed to handle the request, maintain security and comply with legal obligations. Where necessary, records may be retained for a dispute or another legal purpose. Backup copies may remain until they are rotated in accordance with applicable retention and deletion requirements.

Falcon uses authenticated sessions, permission checks and restricted access to workspace content and private files. Contact support if you suspect unauthorized access to an account, connection or attachment.

## 7. Your rights and choices

Depending on applicable law, you may be entitled to access, correct, export or delete your personal data, limit or object to processing, or withdraw consent. Withdrawal does not affect the lawfulness of earlier processing. To exercise your rights, email [falcon@saturnusgo.com](mailto:falcon@saturnusgo.com). Falcon may need to verify your identity before acting.

For data your organization controls in a workspace, contact its administrator. Falcon assists as required by law and the applicable workspace agreement. You may also have the right to complain to the competent data protection authority. If Argentine data protection law applies, you can contact Argentina's [Agency for Access to Public Information (AAIP)](https://www.argentina.gob.ar/aaip/datospersonales/derechos).

## 8. Changes to this policy

Falcon publishes revisions with their effective date and provides additional notice or requests consent when required. Send questions about this policy to [falcon@saturnusgo.com](mailto:falcon@saturnusgo.com).

---

# Политика конфиденциальности Falcon

**Редакция от 10 ноября 2026 года**

Политика вступает в силу с момента публикации и распространяется на сайт Falcon, облачные рабочие пространства и настольное приложение. Оператор Falcon — **Меркурий Рукс (Mercury Rucks)**, физическое лицо. Вопросы и запросы о персональных данных направляйте на [falcon@saturnusgo.com](mailto:falcon@saturnusgo.com). Почтовый адрес для корреспонденции — Balcarce 3154, Мар-дель-Плата, Аргентина.

## 1. Кто отвечает за обработку данных

Оператор Falcon определяет порядок обработки персональных данных для работы сайта, управления аккаунтами, рассмотрения заявок на тарифы, поддержки, безопасности и исполнения требований закона. Если вы пользуетесь рабочим пространством организации, организация, как правило, сама определяет, какие персональные данные входят в его содержимое и кто может получить к ним доступ. Falcon обрабатывает это содержимое для предоставления сервиса по поручению организации в рамках применимого договора. У организации могут действовать собственные правила конфиденциальности и доступа.

## 2. Какие данные обрабатывает Falcon и зачем

| Данные | Для чего они нужны Falcon |
| --- | --- |
| Данные аккаунта и входа, в том числе имя, email, идентификатор у провайдера входа, фотография профиля, если она передана, и сведения о сеансе | Для создания аккаунта, проверки email, входа, в том числе в настольное приложение, и защиты доступа. При входе через Google Falcon может получить подтверждённый email, основные сведения профиля и постоянный идентификатор аккаунта Google. При корпоративном входе через SAML провайдер организации передаёт идентификатор и атрибуты входа, настроенные для Falcon. |
| Данные рабочего пространства, в том числе имена и email приглашённых участников, роли, сведения о проектах, документация, тест-кейсы, прогоны, комментарии, вложения, материалы проверок и история изменений | Для отправки приглашений, разграничения доступа, отображения данных уполномоченным пользователям, ведения истории изменений и работы с QA-процессами. Falcon получает эти данные от пользователей, администраторов и подключённых сервисов. |
| Технические данные и журналы безопасности, в том числе IP-адрес, сведения о браузере или устройстве, время и записи о запросах и действиях | Для работы сервиса, диагностики сбоев, выявления злоупотреблений, защиты аккаунтов и расследования инцидентов. |
| Заявки на тариф, в том числе имя, email, роль заявителя, рабочее пространство, тариф, язык, необязательное примечание, статус и даты обработки заявки | Для рассмотрения заявки, ответа на неё и отслеживания её статуса. Действующие формы заявки на тариф и личного пробного доступа не собирают реквизиты банковских карт. |
| Обращения в поддержку, включая контактные данные, содержание запроса, вложения и сведения о рабочем пространстве или странице | Для ответа, диагностики проблемы и контроля её решения. Обращение из приложения может включать имена и контакты отправителя и контактных лиц рабочего пространства, если эти сведения доступны. |
| Данные, передаваемые дополнительным функциям ИИ и подключённым сервисам | Для выполнения запрошенного действия. В разделе 3 описано, какие данные используются и кому они могут передаваться. |

Когда закон требует правового основания, Falcon обрабатывает данные для предоставления сервиса или выполнения действий по вашему запросу до заключения договора, для исполнения требований закона, в законных интересах, например для безопасности и поддержки, когда это разрешено, либо на основании согласия, когда оно требуется. Если вы не предоставите данные, необходимые для аккаунта или выбранной функции, Falcon может не суметь предоставить соответствующий доступ.

## 3. Подключённые сервисы и функции ИИ

Falcon обменивается данными с указанными ниже сервисами, когда уполномоченный пользователь подключает их, настраивает автоматизацию или запускает функцию, которая к ним обращается. Состав данных зависит от подключения, адресата и выданных разрешений.

| Подключённый сервис | Какие данные могут передаваться |
| --- | --- |
| **JetBrains YouTrack, Atlassian Jira, Linear и Trello** | Названия и описания дефектов, идентификаторы, приоритеты, статусы, шаги воспроизведения, ожидаемые и фактические результаты, ссылки на записи Falcon. Эти данные используются для создания и синхронизации задач или карточек. |
| **Slack и Telegram** | Slack может получать настроенные уведомления о прогонах, дефектах или комментариях, включая соответствующий текст, результаты и ссылки. Telegram может получать уведомления, которые вы включили, включая заголовки, краткие сведения и ссылки. Для доставки используется идентификатор привязанного чата. |
| **Atlassian Confluence** | Отчёты о прогонах, которые могут содержать названия и идентификаторы прогонов, окружения, сборки, результаты, описания и ссылки на Falcon. |
| **GitHub** | Falcon может получать настроенные события репозитория и рабочих процессов, а также запрашивать сведения о репозитории и изменениях, например идентификаторы коммитов и пути изменённых файлов, для связи изменений с прогонами и анализа влияния. |
| **Swagger / OpenAPI и тестирование API** | Falcon может обратиться по указанному вами адресу спецификации или API. Этот сервис может получить сведения о запросе, включая заданные вами данные аутентификации, параметры и содержимое запроса. |
| **OpenAI Codex и другие авторизованные MCP-клиенты** | При вызове инструментов Falcon подключённый клиент может получать или изменять разрешённые данные рабочего пространства, в том числе тест-кейсы, документацию, прогоны и дефекты. Доступные действия и записи определяются полномочиями подключения. |

Администраторы рабочих пространств могут управлять интеграциями и отключать их в Falcon, а также отзывать доступ на стороне подключённого сервиса, если он это поддерживает. Копии ранее переданных данных могут храниться у получателя в соответствии с его настройками и правилами хранения.

- **Поиск GIF.** При поиске GIF браузер передаёт поисковый запрос и язык в KLIPY. При получении GIF браузер также может передать в KLIPY идентификатор файла.
- **Справка Falcon с ИИ.** Falcon хранит переписку со справкой, чтобы её можно было открыть повторно. Для ответа Falcon может передать OpenAI вопрос, относящиеся к нему материалы справки и контекст переписки. Если вы делитесь отдельным ответом в рабочем пространстве, его могут просмотреть пользователи с доступом по ссылке в пределах её разрешений. Ссылку можно отозвать в Falcon.
- **Другие функции ИИ.** При использовании инструментов написания, импорта или генерации диаграмм Falcon передаёт OpenAI данные, необходимые для выбранной операции. Это может быть запрос, выделенный текст или загруженный материал. При расшифровке может передаваться аудио. Состав данных зависит от функции и материала, который вы предоставили или выбрали. Передавайте только материалы, которыми вправе пользоваться в этой функции.
- **Анализ влияния.** Если включён анализ влияния с ИИ, Falcon может передавать выбранные сведения об изменениях и связанном тестовом покрытии в OpenRouter, который направляет запрос поставщику настроенной модели.

Если подключённый сервис сам определяет порядок обработки полученных данных, к этой обработке может применяться его собственная политика конфиденциальности.

## 4. Кому передаются данные и где они обрабатываются

- **Размещение и доставка.** Railway размещает приложение и базу данных. Cloudflare обеспечивает сетевую доставку и закрытое хранение файлов. GitHub Pages обслуживает публичные файлы сайта.
- **Вход.** Google, настроенный провайдер идентификации организации или Auth0, если включён прежний способ входа, могут обрабатывать сведения, необходимые для соответствующего способа входа.
- **Почта и поддержка.** Для прямой переписки используется Proton Mail. Настроенные почтовые сервисы получают адреса и содержание сообщений, необходимые для отправки писем о подтверждении адреса, приглашениях и других служебных событиях. Обращения из приложения могут передаваться в JetBrains YouTrack вместе с контактами, контекстом и вложениями, необходимыми для их обработки.
- **Дополнительные функции.** Подключённые сервисы рабочего пространства, поставщики ИИ и сервисы поиска медиа получают данные, описанные в разделе 3.

Данные также могут получать уполномоченные участники и администраторы рабочего пространства. Falcon может раскрывать данные в силу обязательного требования закона или в разрешённых законом случаях, когда это необходимо для защиты законных прав, предотвращения злоупотреблений или реагирования на инцидент безопасности.

Некоторые поставщики могут обрабатывать данные за пределами вашей страны. К международной передаче применяются действующие требования о защите персональных данных. Вы можете запросить у Falcon информацию о получателях, странах обработки и мерах защиты, относящихся к вашему использованию сервиса.

## 5. Cookies и локальное хранилище

Falcon использует cookies и аналогичные средства хранения для входа, защиты и восстановления сеансов, а также для запоминания настроек, в том числе языка и параметров отображения. Настольное приложение хранит сведения, необходимые для сеанса рабочего пространства и завершения входа. Вы можете очистить данные в настройках браузера. Очистка данных сеанса может привести к выходу из аккаунта, а блокировка необходимого хранилища может повлиять на вход и другие функции.

## 6. Сроки хранения и безопасность

Falcon хранит данные аккаунта, пока они нужны для управления аккаунтом, и содержимое рабочего пространства, пока оно необходимо для предоставления сервиса, с учётом применимого договора, поручений и требований закона. По окончании личного пробного периода сохраняются просмотр и экспорт в соответствии с [Условиями личного пробного доступа](https://tms.saturnusgo.com/trial-terms/?lang=ru). Истечение пробного периода не приводит к автоматическому удалению данных.

Неотправленные обращения в поддержку в приложении истекают через 24 часа и удаляются при плановой очистке. Отправленные обращения, заявки на тариф и журналы безопасности хранятся, пока это необходимо для обработки запроса, обеспечения безопасности и исполнения требований закона. При необходимости отдельные записи могут храниться для разрешения спора или иных юридических целей. Резервные копии могут сохраняться до их плановой замены с учётом применимых требований к хранению и удалению.

Falcon использует аутентифицированные сеансы, проверку полномочий и ограниченный доступ к рабочему содержимому и закрытым файлам. Если вы подозреваете несанкционированный доступ к аккаунту, подключению или вложению, сообщите в поддержку.

## 7. Ваши права

В зависимости от применимого закона вы можете запросить доступ к своим персональным данным, их исправление, экспорт или удаление, ограничить обработку или возразить против неё, а также отозвать согласие. Отзыв согласия не влияет на законность предшествующей обработки. Для реализации своих прав напишите на [falcon@saturnusgo.com](mailto:falcon@saturnusgo.com). Falcon может проверить вашу личность перед обработкой запроса.

Если данными рабочего пространства управляет ваша организация, обратитесь к её администратору. Falcon оказывает содействие в соответствии с законом и договором. Вы также можете иметь право подать жалобу в компетентный орган. Если применяется законодательство Аргентины о защите персональных данных, можно обратиться в [Агентство по доступу к публичной информации Аргентины (AAIP)](https://www.argentina.gob.ar/aaip/datospersonales/derechos).

## 8. Изменения политики

Falcon публикует новые редакции с датой вступления в силу, а в предусмотренных законом случаях дополнительно уведомляет пользователей или запрашивает согласие. Вопросы по политике направляйте на [falcon@saturnusgo.com](mailto:falcon@saturnusgo.com).
