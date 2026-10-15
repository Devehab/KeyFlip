# دليل نشر KeyFlip على متجر Chrome خطوة بخطوة

> كل نص داخل مربع رمادي جاهز للنسخ واللصق كما هو. كل صورة مذكور مسارها داخل مجلد `store/assets/`.
> النصوص التي يقرؤها فريق المراجعة في Google (التبريرات والتعليمات) مكتوبة بالإنجليزية عن قصد، لأنها اللغة الأضمن عندهم.

---

## 0) قائمة سريعة قبل أن تبدأ

| الخطوة | جاهز؟ |
|---|---|
| حساب Google مخصص للنشر + التحقق بخطوتين مفعّل | ☐ |
| رسوم التسجيل 5$ مدفوعة | ☐ |
| تفعيل GitHub Pages (رابط سياسة الخصوصية) | ☐ |
| رفع الفيديو على YouTube (عربي + إنجليزي) | ☐ |
| ملف الحزمة `keyflip-1.0.0.zip` | ☐ |

---

## 1) الحساب (مرة واحدة)

1. استخدم حساب Google **مخصصاً للنشر** (Google تنصح بذلك، ولا يمكن إعادة استخدام بريد حساب مطوّر محذوف).
2. فعّل **التحقق بخطوتين** على الحساب — بدونه لا يُسمح بالنشر: https://myaccount.google.com/security
3. ادخل لوحة المطوّر وادفع رسوم التسجيل لمرة واحدة (5$): https://chrome.google.com/webstore/devconsole
4. في صفحة **Account**:
   - **Publisher name:** `KeyFlip` (أو اسمك/اسم شركتك).
   - **Contact email:** بريدك، ثم اضغط رابط التحقق الذي يصلك.
   - **Trader / Non-trader** (قانون الاتحاد الأوروبي):
     - إذا تنشر الإضافة **كشخص** ومجاناً وبدون أي ربح ← اختر **Non-trader**.
     - إذا تنشرها **باسم شركة** أو ستضيف أي شيء مدفوع ← اختر **Trader** وأكمل التحقق من الهوية (بياناتك ستظهر للمستخدمين في أوروبا).

---

## 2) تفعيل رابط سياسة الخصوصية (GitHub Pages)

1. افتح: https://github.com/Devehab/KeyFlip/settings/pages
2. **Source:** `Deploy from a branch` ← **Branch:** `claude/nifty-knuth-yczrpr` (أو `main` بعد الدمج) ← **Folder:** `/docs` ← **Save**.
3. بعد دقيقة تقريباً تأكد أن الروابط تفتح:
   - سياسة الخصوصية: **https://devehab.github.io/KeyFlip/privacy/**
   - الصفحة الرئيسية: **https://devehab.github.io/KeyFlip/**

> ⚠️ لا تحذف هذه الصفحة بعد النشر — رابط سياسة خصوصية لا يعمل يُعتبر مخالفة (Purple Lithium).

---

## 3) الفيديو الترويجي (YouTube)

المتجر يقبل **رابط YouTube فقط**.

1. ارفع الملفين على YouTube:
   - `store/assets/video/keyflip-promo-ar.mp4` (عربي)
   - `store/assets/video/keyflip-promo-en.mp4` (إنجليزي)
2. اجعل الظهور **Public** أو **Unlisted** (كلاهما يعمل في المتجر).
3. عنوان مقترح:
   - عربي: `KeyFlip — صحّح النص المكتوب بلغة الكيبورد الخطأ بضغطة واحدة`
   - إنجليزي: `KeyFlip — Fix text typed in the wrong keyboard layout in one shortcut`
4. انسخ الرابطين لاستخدامهما في الخطوة 6.

---

## 4) الحزمة (ZIP)

- أسهل طريقة: من GitHub ← **Actions** ← آخر تشغيل ناجح (✅) ← **Artifacts** ← نزّل `keyflip-extension` ← بداخله `keyflip-1.0.0.zip`.
- أو على جهازك: `npm ci && npm run package` ← الملف في `dist/keyflip-1.0.0.zip`.
- **اختبرها قبل الرفع:** فك الضغط، ثم `chrome://extensions` ← فعّل **Developer mode** ← **Load unpacked** ← اختر المجلد.

---

## 5) إنشاء العنصر ورفع الحزمة

لوحة المطوّر ← **New item** ← اسحب `keyflip-1.0.0.zip`.
الاسم والملخص يُقرآن تلقائياً من الحزمة (بثماني لغات) ولا تحتاج كتابتهما.

---

## 6) تبويب Store listing

### اللغات
في أعلى الصفحة قائمة اللغات. اللغة الأساسية **English**، ثم أضف الوصف والصور لكل لغة:

| اللغة في القائمة | الوصف (انسخ قسم «Detailed description») | الصور الخمس | فيديو |
|---|---|---|---|
| English | `store/listings/en.md` | `store/assets/screenshots/en/` | رابط الفيديو الإنجليزي |
| Arabic — العربية | `store/listings/ar.md` | `store/assets/screenshots/ar/` | رابط الفيديو العربي |
| French — Français | `store/listings/fr.md` | `store/assets/screenshots/fr/` | الإنجليزي |
| German — Deutsch | `store/listings/de.md` | `store/assets/screenshots/de/` | الإنجليزي |
| Russian — Русский | `store/listings/ru.md` | `store/assets/screenshots/ru/` | الإنجليزي |
| Turkish — Türkçe | `store/listings/tr.md` | `store/assets/screenshots/tr/` | الإنجليزي |
| Persian — فارسی | `store/listings/fa.md` | `store/assets/screenshots/fa/` | الإنجليزي |
| Hebrew — עברית | `store/listings/he.md` | `store/assets/screenshots/he/` | الإنجليزي |

> المتجر يعرض للمستخدم الوصف والصور والفيديو بلغة متصفحه تلقائياً. أي لغة غير موجودة في القائمة (مثل الأردية) تظهر لها النسخة الإنجليزية، وهي تذكر أن الإضافة تدعم لغات كثيرة.

ارفع الصور **بالترتيب** 01 ← 05 (أول صورة هي الأهم لأنها تظهر أولاً).

### Category
- **Workflow & Planning** (الأنسب: أداة تسرّع الكتابة اليومية).
- بديل مقبول: **Tools**.

### Graphic assets (عامة لكل اللغات)
| الحقل | الملف |
|---|---|
| Store icon (128×128) | `store/assets/icon/store-icon-128.png` |
| Small promo tile (440×280) | `store/assets/promo/small-tile-440x280.png` |
| Marquee promo tile (1400×560) | `store/assets/promo/marquee-1400x560.png` |

> صور البطاقات الترويجية لا يمكن تخصيصها حسب اللغة في المتجر، لذلك صممناها بدون جمل (شعار + مثال + Ctrl+Q).

### Additional fields
| الحقل | القيمة |
|---|---|
| Official URL | اتركه فارغاً (يحتاج توثيق نطاق في Search Console — اختياري) |
| Homepage URL | `https://devehab.github.io/KeyFlip/` |
| Support URL | `https://github.com/Devehab/KeyFlip/issues` |
| Mature content | **No** |

---

## 7) تبويب Privacy (الأهم للقبول)

### Single purpose
```
KeyFlip fixes text that was typed with the wrong keyboard layout (for example, the user meant to type Arabic but the English layout was active, or the reverse). It converts every character to the character on the same physical key of the user's other layout, in place, inside the text field the user is editing. Every feature (keyboard shortcut, floating button, right-click item, settings and a local "time saved" counter) serves only this purpose.
```

### Permission justification — storage
```
Saves the user's preferences (interface language, theme, the two keyboard layouts, the shortcut, feature switches and the sites where the user paused KeyFlip) and simple local usage counters (number of fixes, characters converted, estimated minutes saved) in chrome.storage.local. No typed text and no browsing history is stored. Nothing is synced or transmitted.
```

### Permission justification — contextMenus
```
Adds a single "Fix keyboard layout" item to the right-click menu for selected text and text fields, so users can fix text without the keyboard shortcut.
```

### Permission justification — scripting
```
Used in two situations only: (1) right after the extension is installed or updated, to inject the same bundled content script into tabs that were already open, so the shortcut and right-click work without reloading every tab; (2) when the user chooses "Fix keyboard layout" in a tab whose content script is missing. Only files packaged with the extension are injected. No remote or dynamically generated code is ever executed.
```

### Host permission justification
```
People type in text fields on every kind of website, including editors embedded in iframes, so KeyFlip's content script must be available on all pages to respond to the user's own action: the keyboard shortcut, the floating button next to selected text, or the right-click item. When the user invokes it, KeyFlip reads only the selected text or the focused text field, converts it locally on the device and writes it back. It does not read other page content, does not record browsing activity and makes no network requests. The same host access lets the service worker re-inject the bundled script into tabs that were already open after an install or update.
```

### Are you using remote code?
اختر: **No, I am not using remote code**

### Data usage — ماذا تختار بالضبط
- ✅ **Website content** — فقط هذا الخيار (لأن الإضافة تقرأ النص الذي تظلّله لتحوّله، حتى لو كان ذلك على الجهاز فقط؛ سياسة Google تطلب الإفصاح عنه).
- ❌ لا تختر أي شيء آخر (Personally identifiable information، Health، Financial، Authentication، Personal communications، Location، Web history، User activity).

ثم فعّل **الإقرارات الثلاثة**:
- ✅ I do not sell or transfer user data to third parties, outside of the approved use cases
- ✅ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL
```
https://devehab.github.io/KeyFlip/privacy/
```

> لماذا «Website content» وليس «لا شيء»؟ لأن صفحة أسئلة Google الحالية تقول إن الإفصاح مطلوب **حتى لو كانت المعالجة محلية فقط**. هذا الاختيار متطابق 100% مع سياسة الخصوصية ومع ما تعرضه الإضافة للمستخدم في صفحة الترحيب — والتطابق هو ما يحميك من الحظر لاحقاً.

---

## 8) تبويب Distribution

| الحقل | الاختيار |
|---|---|
| Payments | **Free** |
| Visibility | **Public** |
| Distribution / Regions | **All regions** |

---

## 9) تبويب Test instructions (يسرّع المراجعة ويقلل الرفض)
```
No account, login or network access is needed.
1. After installing, the welcome page opens. Pick a language and keep the default layouts (English US + Arabic 101).
2. In any text box on any website (or the practice box on the welcome page), type:  ;dt phg;
3. Select it (Ctrl+A) and press Ctrl+Q. On macOS the shortcut is Control+Q (not Command+Q). The text becomes: كيف حالك
4. Press Ctrl+Q again to flip it back.
5. Other ways to trigger the same action: select text and click the small "Flip" button that appears next to it, or right-click the selection and choose "Fix keyboard layout".
6. Toolbar popup: on/off switch, layout pair, time-saved counters and a "Quick flip" box for pages where extensions cannot run.
7. Settings page: layouts (with one-key layout detection), shortcut recorder, floating button and right-click switches, statistics.
The extension makes no network requests.
```

---

## 10) الإرسال

اضغط **Submit for review**.

- **نصيحة للمسابقة:** أرسل مبكراً لأن المراجعة الأولى قد تأخذ من أيام إلى أسابيع (إضافة جديدة + مطوّر جديد + صلاحية لكل المواقع). اختر **Defer publishing** (تأجيل النشر) إذا أردت أن تتحكم بلحظة الإطلاق — بعد الموافقة عندك 30 يوماً لتنشرها متى شئت.

---

## 11) بعد الموافقة

1. انسخ رابط الإضافة في المتجر.
2. ضعه في المكانين التاليين ثم ارفع تحديثاً (رقم إصدار أعلى في `manifest.json`، مثل `1.0.1`):
   - `src/ui/shared/common.js` ← `const STORE_URL = '...';` (ليظهر الرابط في رسالة المشاركة).
   - `scripts/build-docs.mjs` ← `const STORE_URL = '...';` ثم شغّل `npm run docs` وارفع مجلد `docs/` (تتحول كل أزرار الموقع من «النسخة المبكرة» إلى «أضِفها إلى Chrome»).
3. اطلب من الناس **تقييماً صادقاً**. ممنوع منعاً باتاً تقديم أي مقابل للتقييم أو ربط ميزة بالتقييم (مخالفة Yellow Nickel).

---

## 12) لماذا لن يُرفض/يُحذف KeyFlip — مراجعة للمخالفات الشائعة

| رمز المخالفة | السبب الشائع | وضع KeyFlip |
|---|---|---|
| Blue Argon | كود من الإنترنت / eval | كل الكود والخطوط داخل الحزمة. لا eval ولا طلبات شبكة (يتحقق منه `npm run validate` تلقائياً في كل تشغيل CI) |
| Red Titanium | كود مُشوّش | الكود مقروء وغير مضغوط، وجداول الكيبورد حروف واضحة |
| Purple Potassium | صلاحيات زائدة | 3 صلاحيات + الوصول للمواقع، وكل واحدة مستخدمة ومبررة |
| Purple Lithium | سياسة خصوصية ناقصة | سياسة كاملة عربي/إنجليزي، والرابط في خانة Privacy |
| Purple Nickel | عدم الإفصاح داخل الإضافة | صفحة الترحيب + النافذة + الإعدادات تعرض «نصك لا يغادر جهازك» |
| Yellow Argon | حشو كلمات / قوائم مواقع | الوصف طبيعي، بدون أسماء مواقع أو علامات تجارية |
| Yellow Zinc | بيانات ناقصة | أيقونة + 5 صور لكل لغة + بطاقتان + فيديو + وصف كامل |
| Yellow Magnesium | ميزة لا تعمل | 97 اختباراً تلقائياً على Chrome وEdge وBrave وOpera في كل تعديل |
| Red Nickel | وصف مضلّل | كل ما في الوصف مُختبر فعلياً، ونذكر بوضوح الأماكن التي لا تعمل فيها الإضافة |
| Yellow Lithium | فتح موقع إعلاني عند التثبيت | صفحة الترحيب داخل الإضافة نفسها |

---

## 13) (اختياري) النشر على Edge وOpera

- **Microsoft Edge Add-ons** (مجاني): https://partner.microsoft.com/dashboard/microsoftedge — نفس ملف ZIP ونفس النصوص والصور. شعار 300×300 جاهز: `store/assets/icon/edge-logo-300.png`.
- **Opera add-ons** (مجاني): https://addons.opera.com/developer — نفس ملف ZIP. ملاحظة: مستخدمو Opera وBrave يمكنهم التثبيت مباشرة من متجر Chrome أيضاً.
