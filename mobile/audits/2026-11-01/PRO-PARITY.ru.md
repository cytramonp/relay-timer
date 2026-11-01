# CorpTimer: текущий сайт и Pro в приложении

Проверено **1 ноября 2026, America/Los_Angeles**. Сравнение с реально опубликованным `https://corptimer.com/`, а не только с GitHub main. Проверяемый Android APK — **0.4.1 (7)**, runtime `8aa92cff7b218e20ddd9e7dc40c929dbb8c4b05f`, SHA256 `A130CF36CEFFCAA227FAF0EA9C25953D20D99279849FF16356CCDF3CDB533CD0`. Изменений billing/config/Pro screen после этого runtime в ветке нет; публичный release digest совпадает с локальным APK.

**Вывод: бизнес-правила и основные Pro-возможности перенесены, но сквозная платная версия ещё не подключена.** Уже купленный на сайте Pro не подхватывается текущим APK через Google-вход, поскольку этот вход выключен. Покупка через Google Play также выключена. Наличие экрана Your plan не доказывает завершённую интеграцию подписки.

## Что совпадает

| Возможность | Сайт сейчас | Приложение 0.4.1 |
|---|---|---|
| Trial | Заканчивается, когда выполнены **оба** условия: 10 дней и 10 запусков | То же; серверный policy совпадает с опубликованным `pro-policy.js` |
| Free | 2 новых запуска за UTC-день | То же; новый старт резервируется через тот же billing API |
| Pause/resume/смена этапа | Продолжают существующую сессию | То же; для specialty дополнительно исправлена граница Reset/нового выполнения |
| Pro: лимит запусков | Безлимит при действующем provider entitlement | Серверный `tier:pro`/`customize:true` поддержан; флаг магазина не отменяет полученный Pro |
| Редактирование и свои таймеры | Trial/Pro: длительности, этапы/раунды/agenda, свои сохранения | Реализованы UI и customization gates; сохранённые настройки не удаляются при смене тарифа |
| Company logo | Trial/Pro; PNG/JPEG/WebP; сохранение в настройках аккаунта | Trial/Pro; PNG/JPEG/WebP; локальное сохранение и device backup |
| Каталог | 9 основных и 27 специальных профилей | Те же 9 + 27; specialty catalog, theme defaults и popularity sorting совпадают с live-файлами |

`pro-policy.js`, `specialty-catalog.js`, `timer-themes.js`, `timer-popularity.js` проверены по нормализованному тексту: live-файлы совпадают с мобильной базой. Восемь отдельных проверок подтвердили границы trial, отказ третьему бесплатному старту, повтор session ID, смену UTC-дня, действующий Stripe Pro, объединение provider entitlements и истечение подписки. Это проверки кода, а не реальные покупки.

## Где соответствие неполное

| Область | Наблюдение | Что требуется |
|---|---|---|
| Годовой тариф | Сайт показывает **$4.99/year**. APK содержит годовой product/base plan, но товар и актуальная локализованная цена из Play не загружены | Создать/проверить товар `corptimer_pro_yearly`, base plan `annual`; показывать цену, возвращённую магазином, а не подставлять валютный пересчёт |
| Вход и уже купленный web Pro | Firebase project и billing API одинаковые. Но `googleWebClientId` пуст, кнопка Google disabled; APK использует отдельную анонимную идентичность | Настроить Google OAuth для пакета и фактического сертификата APK, включить вход, проверить тот же Firebase UID и Stripe entitlement с сайта |
| Покупка/restore Android | `purchasesEnabled:false`. Billing Client и серверный Play verifier подготовлены в исходниках, кнопки покупки/restore выключены | Подключить продукт/Developer API, применить серверное расширение без потери Stripe/D1, пройти реальные store lifecycle tests, затем включить флаг и собрать новый versionCode |
| Личная библиотека между устройствами | Сайт синхронизирует meetings и timerSettings через Firestore. Native хранит свои планы и настройки локально | Отдельно реализовать native sync/конфликты/изоляцию аккаунтов; общий Pro-доступ сам по себе не синхронизирует библиотеку |
| Логотип | Веб уменьшает изображение до 480×160 и синхронизирует настройку; APK хранит исходное изображение локально. Лимиты отличаются: web 2 MiB, native 2,000,000 bytes | Согласовать точный предел/подготовку изображения и подключить его к будущей синхронизации |
| iOS paid lifecycle | Billing module и purchase/sign-in gates работают только на Android. Экран Pro при этом использует Google Play copy и на iOS | Платформенный paywall, iOS account flow и StoreKit/App Store integration; реальные iOS покупки/restore не реализованы |

Основные места в коде: `src/config/billing-public.json`, `src/services/billing.ts`, `src/app/pro.tsx`, `src/state/app-store.tsx`, `src/components/plan-status.tsx`, `src/components/brand-logo.tsx`, `modules/corptimer-billing`, `billing-worker/play.js`.

## Что подтверждено снаружи

- Публичный сайт отдаёт `billing-config.json` с `enabled:true`; публичный `/health` billing Worker возвращает `{ok:true,paymentsConfigured:true}`. Это подтверждает включённый веб-клиент и наличие серверной Stripe-конфигурации, **не успешную реальную оплату, корректность конкретного Stripe price или доставку webhook**.
- Live health не сообщает `playConfigured`; активация Play по нему не доказана. Подготовленный в мобильной ветке Play verifier не считается развёрнутым.
- Read-only запрос регистраций Android apps через существующий Google Cloud вход получил **403**. Список приложений/сертификатов не подтверждён; из этого нельзя делать вывод, что регистраций нет. Права, API и OAuth-клиенты не менялись. Токены не сохранялись и не выводились.
- 61 mobile test и 9 billing-worker tests проходят; TypeScript и Expo lint проходят. Google-ответы в серверных тестах — mocks. Реальные web→native sign-in, покупка, восстановление, отмена и возврат этой проверкой не выполнялись.

## Порядок завершения

1. **Сначала единый вход.** Для признания уже купленного web Pro в sideloaded Android-бете магазинная покупка не нужна: необходимы Android OAuth/SHA-1 и Web OAuth client ID, затем тест входа тем же Google-аккаунтом. Существующий backend уже вычисляет Pro по Stripe provider того же UID. Это вывод из архитектуры; фактический cross-device вход ещё нужно подтвердить. Регистрацию SHA-1 и Web/server client ID описывает [Firebase](https://firebase.google.com/docs/auth/android/google-signin).
2. **Затем магазинная покупка и восстановление.** Сохранить общий сервер entitlement и действующий Stripe, добавить подтверждённые Play/App Store receipts. Для обычной Play-дистрибуции ориентироваться на [Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en), включая условия исключений/региональных программ, а не автоматически открывать существующий web checkout в APK. Проверка покупок должна оставаться [на backend](https://developer.android.com/google/play/billing/security).
3. **Отдельно синхронизация библиотеки/брендинга.** Это самостоятельная отсутствующая функция, а не переключение Pro-флага.

Приоритет — вход и распознавание существующего web Pro, затем полноценные store-покупки. Простое включение `purchasesEnabled` не завершит ни одну из этих цепочек. В этой задаче выполнена проверка; APK, live-сайт, подписки и настройки аккаунтов не изменялись.

Снимок проверок и хеши публичных файлов: [pro-parity-evidence.json](pro-parity-evidence.json).
