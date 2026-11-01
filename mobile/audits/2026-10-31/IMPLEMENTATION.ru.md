# CorpTimer 0.4.1: исправления после CTO-аудита

Дата: 31 октября 2026, America/Los_Angeles. Предыдущий [аудит](../2026-10-30/REPORT.ru.md) остаётся историческим документом. Исправления находятся в ветке `codex/mobile-reliability-fixes`, [PR #5](https://github.com/cytramonp/relay-timer/pull/5), поверх подготовки 0.4 / PR #4. Версия Android/iOS — **0.4.1 (7)**.

## Что изменено

| Находка | Реализация | Проверка и границы |
|---|---|---|
| F1: новая сессия доски | Пауза/продолжение сохраняют grant. Reset последнего использованного clock завершает выполнение; новый Start резервирует новый ID. Другие работающие/приостановленные clocks сохраняют общую сессию. Grant связан с текущим UID; pending-ID сохраняется для retry | Тесты исполняют реальные обработчики route с auth/storage doubles: resume, reset, account switch и offline retry. Это правило выполнения доски, не обещание защиты от модифицированного клиента |
| F2: частичные backup/reset | Versioned device backup охватывает программы, настройки, историю/заметки, specialty clocks/setups, избранное и feedback draft. Активная primary-сессия архивируется; specialty при восстановлении приостанавливаются без переносимого grant. Пароли, Firebase auth, receipts и live capabilities не переносятся | Валидация до записи, rollback при неудачной замене, generation-scoped AsyncStorage: старый экран не восстанавливает удалённые данные. Реальный service исполняется с SDK/SQLite doubles: export/delete/restore, сохранение auth и rollback после частичной ошибки записи. Старую live-комнату отзываем и по сохранённой записи до rehydration UI |
| F3: отложенный старт | Индивидуальные Reset/Pause/Start отменяют `scheduledAt` | Регрессия для kitchen scheduler; веб- и native board-engine остаются одинаковыми |
| F4: фоновые сигналы | Отдельная проверка/запрос exact access; сообщение об approximate fallback. Specialty stages и Speech thresholds подключены к локальным OS-алармам. Все известные scopes используют общий горизонт 48 событий | Длинные программы требуют открытого приложения для пополнения горизонта; повторные/голосовые cues остаются foreground. Физическая доставка, Focus/Doze/OEM и reboot требуют аппаратной проверки; бесконечное фоновое выполнение не обещается |
| F5: лишние UI/IO обновления | Нет 200-мс broadcast общего Context. Время обновляет видимый экран, при pause/focus loss presentation ticker останавливается. `settle()` сохраняет ссылки на неизменившиеся stages/laps. Текстовые правки буферизуются, start/pause/finish сохраняются сразу; lifecycle делает flush | Проверены неизменность движка, flush/discard/superseding writes. Снижение ненужной работы установлено кодом, выигрыш FPS/энергии на телефоне не измерен |
| F6: перевод часов | Малый native clock: Android `elapsedRealtime`, iOS `mach_continuous_time`, плюс сохранённый logical epoch/checkpoint. Calendar New Year остаётся на wall-clock. Live `publishedAt` и календарные даты отчётов остаются wall-clock; raw uptime/boot ID не публикуются | Есть тесты скачка часов в обе стороны, sleep/same-boot restart и смены boot. Для неизвестного boot/fallback применяется неотрицательный wall-gap. OS notification date-triggers требуют отдельной проверки при ручном изменении часов; это не гарантия против всех системных вмешательств |
| F7: устаревшие уведомления | Coalescing до последнего snapshot, проверки generation после await, очистка частично запланированного старого результата. Global-disable сохраняет приоритет даже при последующих paused-board updates | Тесты реального adapter с OS doubles: disable + restored unknown scopes, общий 48-event budget и pause одного scope без удаления другого |
| F8: ложный remote ACK | Последовательный command executor ждёт boolean-результата Start. Неуспешная команда не подтверждается как принятая; stale room не получает ACK | Deferred-start false/true flow, очередь Pause, повтор ID и смена комнаты. Реальный cross-device live E2E отдельно от этих локальных doubles |
| F9: собственный backup не импортируется | Один UTF-8 byte-limit 32 MB для writer/reader/file picker; форматы и количество объектов остаются ограничены. Device writer проверяет собственный формат перед выдачей | Round-trip 200 × 200 agenda items: файл >4 MB теперь импортируется. Неподдерживаемые/слишком большие файлы отклоняются до мутаций |
| F10: обрезанные lap splits | Сохраняются `lapOffset` и предыдущий elapsed (`lapBase`), корректны абсолютные номера и split после 500 записей. Reset и rewind сбрасывают несовместимую базу | 501/502 laps, JSON/CSV и rewind. Уже потерянные метаданные старых обрезанных историй восстановить невозможно |

Дополнительно: единый timeout охватывает identity/token/fetch, поздний результат не начинает запрос после timeout. Overlay использует monotonic delta, обновляет fill без глобального React ticker, прекращает ticker при pause и закрывается на done. Ключевая математика встреч и оформление сохранены. Ни один непустой feedback не отправлялся этой задачей.

## Архитектурная граница

Стек Expo/React Native сохранён. Чистые `session`, `timebase`, `latest-effect`, `remote-commands`, `buffered-writer`, `store-codec`, `report-codec`, `device-backup` и `data-repository` отделяют правила от React/native IO. Native code добавлен только для источника elapsed time; экранные часы, тариф и библиотека не переписаны на Kotlin/Swift. SQLite и AsyncStorage остаются на месте, поэтому нет массовой миграции существующей библиотеки.

`specialty/[slug].tsx` всё ещё крупный экран. Дальнейшее выделение редактора/ClockCard и нормализация больших SQLite-записей — разумные отдельные изменения после аппаратного профиля; они не выдаются здесь за завершённый рефакторинг. Виртуализация длинных списков и уменьшение bundle не внедрялись вслепую.

## Проверки

- Локально: **61 mobile + 59 web + 9 billing-worker = 129 тестов**, TypeScript, Expo lint и веб-проверка JS/JSON проходят. Сервисные интеграционные проверки используют SDK/SQLite doubles, без вызова внешних провайдеров.
- Expo compatible patches обновлены; `expo install --check` — up to date, **expo-doctor 20/20**. `audit fix --force` не применялся. Остаточные npm advisories требуют отдельного upstream/tooling triage; отсутствие patch mismatch не означает отсутствие advisories.
- Первый кандидат `c78d241` прошёл [Linux Mobile checks: tests + web/iOS/Android exports](https://github.com/cytramonp/relay-timer/actions/runs/41181123742).
- Финальный runtime-кандидат: `8aa92cf`; более поздний `7ceeb64` добавляет только service-тесты. Android и iOS native workflows запущены отдельно. Итоговые статусы и артефакты записываются после фактического завершения; постановка в очередь не считается успехом.
- Новый Android QA на disposable emulator проверяет specialty elapsed/setup/favorite и unsent feedback до/после Reset. При возможности root отдельно меняет wall-clock на час, убивает JS-процесс и проверяет восстановление секундомера в том же boot; OS-время восстанавливается в `finally`. Skip не считается доказательством.

## Что ещё требует внешних условий

Владелец выбрал APK для ручной проверки без подключения телефона по USB. FPS/frame pacing, старт, память/батарея, реальные lock-screen/Doze сигналы и аппаратный permission consent не измерены. Скриншоты и emulator correctness не являются такими замерами. Нужны также реальные document picker/share-sheet round-trips на целевых устройствах. Подготовлен [сценарий ручной проверки](MANUAL-QA.ru.md).

Google sign-in и Play purchases по-прежнему выключены; backend Play extension не развёрнут этой задачей. Google Play developer account, publisher/privacy/support facts и реальные store lifecycle/closed testing остаются условием production. Оплата, enrollment и store submission не выполнялись. Веб-сайт не развёртывался; изменённый общий board-engine сохранён только в GitHub-ветке.

APK/AAB и результаты native-проверок описываются отдельно в `mobile/VALIDATION.md`; store-текст остаётся подготовкой к internal testing, не заявлением о production approval.
