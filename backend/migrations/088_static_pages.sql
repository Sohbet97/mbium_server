-- Static pages (privacy policy, later terms/about): Markdown in tk/ru/en, edited in the admin panel,
-- served to the app as JSON (GET /buyer/pages/:slug) and as HTML for the WebView (GET /pages/:slug).
CREATE TABLE IF NOT EXISTS static_pages (
    id            SERIAL PRIMARY KEY,
    slug          VARCHAR(64)  NOT NULL UNIQUE,
    title         VARCHAR(255) NOT NULL,
    title_ru      VARCHAR(255),
    title_eng     VARCHAR(255),
    content       TEXT,
    content_ru    TEXT,
    content_eng   TEXT,
    is_published  BOOLEAN      NOT NULL DEFAULT FALSE,
    "updatedBy"   UUID REFERENCES users(id) ON DELETE SET NULL,
    "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- PAGE_GET (375) / PAGE_PUT (376) for superadmin; other roles get them from the Roles page.
UPDATE roles
SET permissions = array_append(permissions, 375),
    modules     = array_append(modules, 375)
WHERE slug = 'superadmin' AND NOT (375 = ANY(permissions));
UPDATE roles
SET permissions = array_append(permissions, 376),
    modules     = array_append(modules, 376)
WHERE slug = 'superadmin' AND NOT (376 = ANY(permissions));

-- Starting draft, NOT published: review it (contacts, company name) and publish from the admin panel.
INSERT INTO static_pages (slug, title, title_ru, title_eng, content, content_ru, content_eng, is_published)
VALUES ('privacy', 'Gizlinlik syýasaty', 'Политика конфиденциальности', 'Privacy Policy',
$tk$Bu syýasat Mbium programmasynyň we saýtynyň siziň maglumatlaryňyzy nähili ýygnaýandygyny, ulanýandygyny we goraýandygyny düşündirýär. Mbium-y ulanmak bilen siz şu syýasat bilen ylalaşýarsyňyz.

# Ýygnaýan maglumatlarymyz
- **Hasap maglumatlary:** telefon belgiňiz, adyňyz, familiýaňyz, e-poçtaňyz we profil suratyňyz.
- **Sargyt maglumatlary:** eltip bermek salgylaryňyz, sargytlaryňyz, tölegleriňiz we coin amallaryňyz.
- **Mazmun:** synlaryňyz, teswirleriňiz, halanlaryňyz, reels-e goýan gyzyklanmalaryňyz we söhbetdeşlikdäki hatlaryňyz.
- **Dükan eýeleri üçin:** pasport, patent, bank hasaby (IBAN) we kart maglumatlary — diňe dükany barlamak we töleg geçirmek üçin.
- **Enjam maglumatlary:** bildiriş (push) token, enjamyň görnüşi we programmany ulanyş statistikasy.

# Maglumatlary näme üçin ulanýarys
- Hasabyňyzy açmak we telefon belgiňizi tassyklamak üçin.
- Sargytlary ýerine ýetirmek, eltip bermek we tölegleri hasaplamak üçin.
- Satyjylar bilen söhbetdeşligi we goldaw hyzmatyny üpjün etmek üçin.
- Size degişli harytlary, mahabat tabşyryklaryny we bildirişleri görkezmek üçin.
- Galplygyň öňüni almak we kanun talaplaryny berjaý etmek üçin.

# Maglumatlary kim bilen paýlaşýarys
- **Satyjylar:** sargydyňyzy ýerine ýetirmek üçin adyňyz, telefon belgiňiz we salgyňyz.
- **Eltip beriji hyzmatlar:** sargydy eltip bermek üçin zerur maglumatlar.
- **Döwlet edaralary:** diňe kanunda göz öňünde tutulan ýagdaýlarda.

Biz siziň maglumatlaryňyzy satmaýarys.

# Saklamak we goramak
Maglumatlar hasabyňyz işjeň wagtynda we kanunda talap edilýän möhletde saklanýar. Olary goramak üçin şifrlemäni we elýeterliligi çäklendirmegi ulanýarys.

# Siziň hukuklaryňyz
Profil sahypasynda maglumatlaryňyzy görüp we üýtgedip bilersiňiz. Hasabyňyzy we maglumatlaryňyzy pozmak üçin goldaw hyzmatyna ýüz tutuň.

# Çagalar
Mbium 16 ýaşdan kiçi çagalar üçin niýetlenmedik.

# Üýtgeşmeler
Bu syýasaty täzeläp bileris. Täze görnüşi şu sahypada çap edilýär we ýokardaky sene üýtgeýär.

# Habarlaşmak
Soraglaryňyz bar bolsa, programmadaky goldaw söhbetdeşligi arkaly ýa-da [support@mbium.com](mailto:support@mbium.com) salgysy boýunça ýazyň.$tk$,
$ru$Эта политика объясняет, как приложение и сайт Mbium собирают, используют и защищают ваши данные. Используя Mbium, вы соглашаетесь с этой политикой.

# Какие данные мы собираем
- **Данные аккаунта:** номер телефона, имя, фамилия, e-mail и фото профиля.
- **Данные заказов:** адреса доставки, заказы, платежи и операции с коинами.
- **Контент:** отзывы, комментарии, избранное, реакции на reels и сообщения в чатах.
- **Для владельцев магазинов:** паспорт, патент, банковский счёт (IBAN) и данные карты — только для проверки магазина и выплат.
- **Данные устройства:** push-токен, модель устройства и статистика использования приложения.

# Зачем мы используем данные
- Чтобы создать аккаунт и подтвердить номер телефона.
- Чтобы выполнять заказы, доставлять их и проводить расчёты.
- Чтобы обеспечить чат с продавцами и службу поддержки.
- Чтобы показывать подходящие товары, рекламные задания и уведомления.
- Чтобы предотвращать мошенничество и выполнять требования закона.

# С кем мы делимся данными
- **Продавцы:** имя, телефон и адрес — для выполнения вашего заказа.
- **Службы доставки:** данные, необходимые для доставки.
- **Государственные органы:** только в случаях, предусмотренных законом.

Мы не продаём ваши данные.

# Хранение и защита
Данные хранятся, пока ваш аккаунт активен, и в течение сроков, требуемых законом. Мы защищаем их шифрованием и ограничением доступа.

# Ваши права
Вы можете просматривать и изменять свои данные в профиле. Чтобы удалить аккаунт и данные, обратитесь в службу поддержки.

# Дети
Mbium не предназначен для детей младше 16 лет.

# Изменения
Мы можем обновлять эту политику. Новая версия публикуется на этой странице, а дата выше меняется.

# Контакты
По вопросам пишите в чат поддержки в приложении или на [support@mbium.com](mailto:support@mbium.com).$ru$,
$en$This policy explains how the Mbium app and website collect, use and protect your data. By using Mbium you agree to this policy.

# Data we collect
- **Account data:** your phone number, first and last name, email and profile photo.
- **Order data:** delivery addresses, orders, payments and coin transactions.
- **Content:** reviews, comments, favorites, reactions to reels and chat messages.
- **For shop owners:** passport, patent, bank account (IBAN) and card details — only to verify the shop and pay out earnings.
- **Device data:** push notification token, device model and app usage statistics.

# How we use it
- To create your account and verify your phone number.
- To fulfil and deliver orders and settle payments.
- To provide chat with sellers and customer support.
- To show relevant products, ad tasks and notifications.
- To prevent fraud and meet legal requirements.

# Who we share it with
- **Sellers:** your name, phone number and address, to fulfil your order.
- **Delivery services:** the details needed to deliver the order.
- **Government authorities:** only where the law requires it.

We do not sell your data.

# Storage and security
We keep data while your account is active and for as long as the law requires. We protect it with encryption and restricted access.

# Your rights
You can view and change your data on your profile page. To delete your account and data, contact support.

# Children
Mbium is not intended for children under 16.

# Changes
We may update this policy. The new version is published on this page and the date above changes.

# Contact
For questions, write to the in-app support chat or to [support@mbium.com](mailto:support@mbium.com).$en$,
FALSE)
ON CONFLICT (slug) DO NOTHING;
