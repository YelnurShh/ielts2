# IELTS Writing Mastery

Мектеп оқушыларына арналған қазақ тіліндегі IELTS Writing Task 2 платформасы. React, TypeScript, Vite және Firebase Authentication / Firestore.

## Іске қосу

```sh
npm ci
npm run dev
npm run build
```

Vercel: Vite, build `npm run build`, output `dist`. Ішкі беттер үшін SPA rewrite `vercel.json` ішінде бар. Vercel-ге пайдаланушы өзі жариялайды.

## Production Firebase баптауы

1. `ieltsplatform-ee25e` жобасында Authentication → Email/Password және Google қосыңыз. Authorized domains тізіміне Vercel доменін енгізіңіз.
2. Жаңартылған `firestore.rules` және `firestore.indexes.json` файлдарын жариялаңыз:

```sh
firebase deploy --only firestore:rules,firestore:indexes --project ieltsplatform-ee25e
```

3. Индекстер дайын болғанша күтіңіз. Қажетті жұптар: `essays.ownerId + status`, `reviewHistory.ownerId + essayId`. Бұрынғы `essays.teacherId + status` индексі үйлесімділік үшін қалдырылған.
4. Оқу материалдары Firestore-да орнатылған: 34 сабақ, 18 жазу тақырыбы және 40 интерактивті жаттығу.
5. Оқушы аккаунтымен сабақ → жаттығу → жоспар → эссе → мұғалім пікірі → қайта жазу → сабақ аяқтау жолын тексеріңіз.

Жергілікті CLI аккаунтына production жобасында әкімшілік рұқсат берілмеген (бұрын 403 алынған). Кодтағы өзгерістер production ережелері немесе деректері жарияланды дегенді білдірмейді. Тек Vercel деплойы Firestore ережелерін жаңартпайды. Орнатуға дейін сабақтар мен тапсырмалар бос күйді көрсетеді; жасанды материал/нәтиже арқылы дерекқор қатесі жасырылмайды.

## Мұғалім аккаунттары

Арнайы тіркелу коды Firebase ережелерінде тексеріледі. Бастапқы мұғалім UID-і бұрынғыдай танылады. Басқа мұғалімдер Google немесе email/password арқылы тіркеліп, код енгізеді. Бұрынғы оқушы `/teacher-access` арқылы рөлін ауыстыра алады.

Барлық мұғалімдерге жіберілген және тексерілген жұмыстар ортақ. Жобалар тек иесіне қолжетімді. Оқушыға жауап берген мұғалімнің аты/UID-і жазылмайды. Баға мен пікір тарихы `reviewHistory` ішінде сақталады. Оқушы басқа оқушының жұмыстарын немесе нәтижелерін оқи алмайды.

## Оқу ағыны

- `/lessons`: базадағы 34 сабақ, бөлім сүзгісі, қосымша мұғалім сабақтары.
- `/lessons/:id`: теория, мысал, жазба, сабаққа байланысқан жаттығу, жазу тапсырмасы және аяқтау шарттары.
- `/tasks`: алты интерактивті формат. Жауап жобасы және аяқталған әр әрекет базаға сақталады; нәтиже нақты жауаптардан есептеледі.
- `/practice/:id`: сұрақ сөздерін белгілеу, идея жинау, алты бөлімдік жоспар, эссе, төрт критерий чек-парағы және үш даму мақсаты. Автоматты сақтау өзгерістен кейін 1.5 секундта орындалады, қолмен сақтау да бар. Сақтау қатесі ашық көрсетіледі.
- `/work/:id`: мұғалімнің төрт бағасы, пікірі, үш жеке тапсырмасы және назар қажет критерийлері. Жіберген соң мұғалім кабинетке қайтады.
- Қайта жазу бастапқы мәтін мен жоспарды алып, жаңа `parentId / rootId / version` арқылы сақталады. Бұрынғы нұсқа өзгермейді. Бір тізбектегі мәтіндер мен бағаларды салыстыруға болады.
- Сабақ теориясы оқылып, жазба сақталып, байланысқан жаттығу толық дұрыс орындалып, сабаққа байланыстырылған эссені мұғалім тексергенде аяқталады. Қайта жазу портфолиода бөлек нұсқа ретінде сақталады, бірақ сабақты аяқтау үшін міндетті емес. Бұл шарттар Firestore ережесінде де тексеріледі.
- `/dashboard`: нақты сабақ прогресі, ұсынылатын келесі сабақ, критерийлердің орташа нәтижелері, баға тарихы, портфолио, диагностика/финал салыстыруы, XP және орындалған әрекеттерден алынған белгілер.
- Мұғалім кабинетінде оқушылар тізімі, аяқталған сабақтары, бағалары, тексеру кезегі және мұғалім белгілеген әлсіз дағдылар көрінеді.
- Финалдық сынақтың басталу және аяқталу уақыты базаға сақталады. 40 минуттық мерзім қайта жүктеуден өзгермейді. Мерзім өткеннен кейін мәтін/жоспарды өзгертуге сервер рұқсат бермейді; чек-парақ пен мақсаттарды аяқтап жіберуге болады. Таймер автоматты жібермейді. Сақталмай қалған соңғы мәтін көшіруге бөлек көрсетіледі.

XP бірегей жазбалардан есептеледі: сабақ +10, толық дұрыс жаттығу +10, толық жоспар +15, жіберілген эссе немесе қайта жазу +30, финалдық жұмыс +50. Жаттығуды қайта орындау сол жаттығудың XP-ін қайталамайды. Баға болмаған жерде «Баға жоқ» көрсетіледі.

## Мұғалімнің жаңа материалдары

`/practice/new` — жаңа жазу сұрағы. `/lessons/new` — осы сұраққа байланыстырылған сабақ. `/tasks/new` — сабаққа арналған екі сұрақтық интерактивті жаттығу. Бұл байланыстар оқушыға жаңа сабақты да толық орындауға мүмкіндік береді. Мұғалім оқушы атынан эссе жібермейді.

## Талдау

`/ai-analysis` браузерде сөз/сөйлем/абзац санын, қайталану мен қарапайым жазу белгілерін есептейді. Сақтау батырмасы мәтінді жеке `analyses` коллекциясына жазады; сақталған мәтінді қайта ашып талдауға болады.. Мағыналық дәлел, толық грамматика және IELTS критерийлері бойынша бағаны мұғалім береді. Автоматты band немесе жасанды бағалар жоқ.

## Деректер

`lessons`, `prompts`, `activities` — оқу мазмұны. `lessonProgress`, `activityDrafts`, `activityAttempts`, `essays`, `reviewHistory`, `analyses` — нақты пайдаланушы әрекеттері. Барлық есептер осы жазбалардан құралады. `src/course.ts`, `src/data.ts`, `src/activitySeeds.ts` тек алғашқы импортқа арналған; оқушы беттері оларды дерекқордың орнына көрсетпейді.

## Тексеру

```sh
npm run build
firebase emulators:exec --only firestore --project demo-ielts-mastery --config firebase.test.json 'node scripts/test-rules.mjs && node scripts/test-learning.mjs'
```

Браузерлік сценарий `scripts/test-learning-ui.mjs` ішінде: мұғалім және оқушы тіркелуі, импорт, жауапты сақтау/қайта жүктеу, жоспар/эссе/чек-парақ, пікір, қайта жазу, мобильді экран. Ол осы жұмыс ортасындағы Playwright пен Google Chrome жолдарын пайдаланады.

```sh
firebase emulators:exec --only auth,firestore --project demo-ielts-mastery --config firebase.test.json 'node scripts/test-learning-ui.mjs'
```

Эмулятор үшін ғана `VITE_FIREBASE_EMULATORS=true` қолданылады. Production-да бұл айнымалыны орнатпаңыз. Тест деректері `demo-ielts-mastery` эмуляторында, production Firebase-ке жазылмайды.

Оқу материалдары құжаттағы курс құрылымы бойынша жаңадан дайындалған. Формат дереккөздері: https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing және https://ielts.org/take-a-test/preparation-resources/writing-test-resources. Мұғалімнің оқу бағасы ресми IELTS нәтижесі емес.

## Localization

The header offers KZ / RU / EN. The internal Kazakh locale is `kk` (HTML/Intl standard); the UI label is KZ. The selected language is stored in `writing-mastery-language` in localStorage. Changing language keeps mounted forms and their current input. Dates use the selected locale.

`src/locales/source.json` is the append-only source phrase catalog. `src/locales/translations.json` maps its stable numeric indices to `[Russian, English]` translations. It covers the bundled 34 lessons, activity instructions, interfaces and errors. Append new phrases instead of reordering the source catalog. `src/i18n.ts` implements translation and locale state. `scripts/localize-jsx.cjs` applies translations to presentation text at build time; stored IDs, form values, answer comparisons and Firestore writes keep their canonical values. Explicit option values preserve select behavior.

English IELTS questions and language examples remain in English. Personal names, essays, notes, plans, and teacher feedback remain in the author's language. Use `translate="no"` around additional personal text renderers. New teacher-authored material needs authored translations added to the catalog to be shown in all languages; it is not automatically sent to a translation service. No translation API, keys or external runtime requests are required.

Localization browser regression checks (local emulator only):

```sh
firebase emulators:exec --only auth,firestore --project demo-ielts-mastery --config firebase.test.json 'node scripts/test-learning.mjs && node scripts/test-localization.mjs'
```

These cover all 34 lessons in RU/EN, registration and teacher pages, language persistence, mobile overflow, preserving form values and names, and saving correct canonical quiz answers while using translated labels.
