import { getRequestConfig } from "next-intl/server";

import { locale } from "./locale";

import messages from "./messages/ru.json";

// Один язык, без URL-сегмента/куки/определения браузера (решение
// пользователя, см. ADR 0014) — locale всегда "ru". Структура (locale
// вынесен в отдельный модуль, messages подключаются по имени файла)
// оставляет возможность позже читать locale из cookie/URL и подставлять
// messages/<locale>.json, не переписывая остальной код.
export default getRequestConfig(async () => ({
  locale,
  messages,
}));
