import type { Metadata } from "next";
import { axisExplanations, copy, htmlLang, localeNames, localePath, locales, type Locale } from "./i18n";

export const seoSlugs = ["vercel-app", "results", "ideologies", "12axes-vs-9axes", "12axes-vs-8values", "privacy", "license"] as const;
export type SeoSlug = (typeof seoSlugs)[number];

const pageCopy: Record<Locale, Record<SeoSlug, { title: string; description: string; h1: string; lead: string }>> = {
  en: {
    "vercel-app": { title: "12Axes Vercel App Is Down? Take the Working 12Axes Test", description: "Looking for the 12axes Vercel app? Take a working, free and anonymous 12axes test with 36, 60 or 240 questions in five languages.", h1: "The 12axes Vercel app is down — take the working test here", lead: "The original 12axes.vercel.app deployment currently returns a payment-required error. This independent rebuild keeps the complete political test available without an account." },
    results: { title: "12Axes All Results — 12 Political Axes Explained", description: "Explore all 12axes test result dimensions, pole combinations and political spectrum categories before or after taking the quiz.", h1: "12Axes all results: how to read your political profile", lead: "Every result contains twelve percentages, ideology matches, a country match and a political personality match. Here is what each part means." },
    ideologies: { title: "12Axes Ideologies — Political Ideology Test Matches", description: "Browse the political ideology families used by the 12axes test, from left and right to centrist, libertarian, authoritarian and third-position profiles.", h1: "12Axes ideologies and political profile families", lead: "The matching system compares your 12-axis vector with 153 political profiles. These are the major families and representative ideologies you may see." },
    "12axes-vs-9axes": { title: "12Axes vs 9Axes — Political Test Comparison", description: "Compare 12axes and 9axes by dimensions, quiz depth, result format and ideal use before choosing a political ideology test.", h1: "12Axes vs 9Axes: which political test should you take?", lead: "Both tests go beyond a simple left-right line. 12Axes separates additional questions about trade, political control and technology into distinct dimensions." },
    "12axes-vs-8values": { title: "12Axes vs 8values — Political Test Comparison", description: "Compare the 12axes test with 8values: number of axes, question depth, result matching and the type of political profile each quiz provides.", h1: "12Axes vs 8values: eight values or twelve axes?", lead: "8values is faster and broader. 12Axes is more granular and separates twelve political tensions before matching the result with ideology profiles." },
    privacy: { title: "Privacy — 12Axes Test", description: "Learn how the 12axes test handles answers, share links and personal data.", h1: "Privacy", lead: "The test runs without an account. Answers stay in the current browser session and are not stored by this site." },
    license: { title: "License and Credits — 12Axes Test", description: "Read the software license, lineage and attribution for this independent 12axes test implementation.", h1: "License and credits", lead: "12Axes descends from the open political-test family associated with 8values and 9axes. This implementation preserves the required attribution." },
  },
  pt: {
    "vercel-app": { title: "12Axes Vercel App caiu? Faça o teste 12Axes funcionando", description: "Procurando o 12axes Vercel app? Faça o teste 12axes gratuito e anônimo com 36, 60 ou 240 perguntas.", h1: "O 12axes Vercel app está fora do ar — faça o teste aqui", lead: "A implantação original em 12axes.vercel.app retorna erro de pagamento. Esta reconstrução independente mantém o teste disponível sem conta." },
    results: { title: "Todos os resultados 12Axes — Entenda os 12 eixos", description: "Entenda todos os resultados, percentuais, combinações e categorias do teste 12axes.", h1: "Todos os resultados do 12Axes: como ler seu perfil", lead: "Cada resultado inclui doze percentuais, ideologias, país e personalidade mais compatíveis." },
    ideologies: { title: "Ideologias 12Axes — Perfis do teste político", description: "Conheça as famílias ideológicas usadas pelo teste 12axes.", h1: "Ideologias e famílias políticas do 12Axes", lead: "O sistema compara seu vetor de 12 eixos com 153 perfis políticos. Veja as principais famílias." },
    "12axes-vs-9axes": { title: "12Axes vs 9Axes — Comparação de testes políticos", description: "Compare 12axes e 9axes por dimensões, profundidade e formato de resultado.", h1: "12Axes vs 9Axes: qual teste fazer?", lead: "Os dois vão além da esquerda e direita. O 12Axes separa comércio, controle político e tecnologia em dimensões próprias." },
    "12axes-vs-8values": { title: "12Axes vs 8values — Comparação de testes", description: "Compare quantidade de eixos, perguntas e resultados no 12axes e 8values.", h1: "12Axes vs 8values: oito valores ou doze eixos?", lead: "O 8values é mais rápido; o 12Axes é mais granular e compara doze tensões políticas." },
    privacy: { title: "Privacidade — Teste 12Axes", description: "Como o teste 12axes lida com respostas e dados.", h1: "Privacidade", lead: "O teste não exige conta. Suas respostas ficam apenas na sessão atual do navegador." },
    license: { title: "Licença e créditos — Teste 12Axes", description: "Licença, linhagem e atribuição desta implementação do 12axes.", h1: "Licença e créditos", lead: "O 12Axes descende da família aberta de testes ligada ao 8values e 9axes. Esta implementação preserva a atribuição." },
  },
  es: {
    "vercel-app": { title: "¿12Axes Vercel App no funciona? Haz el test 12Axes", description: "Alternativa funcional al 12axes Vercel app con 36, 60 o 240 preguntas en cinco idiomas.", h1: "12axes Vercel app está caído — haz aquí el test funcional", lead: "El despliegue original devuelve un error de pago. Esta reconstrucción independiente mantiene disponible el test completo." },
    results: { title: "Todos los resultados de 12Axes — Guía de los 12 ejes", description: "Aprende a interpretar todos los porcentajes y categorías del test 12axes.", h1: "Todos los resultados de 12Axes: cómo leer tu perfil", lead: "Cada resultado muestra doce porcentajes, ideologías, país y personalidad compatibles." },
    ideologies: { title: "Ideologías de 12Axes — Perfiles del test político", description: "Explora las familias ideológicas usadas en el test 12axes.", h1: "Ideologías y familias políticas de 12Axes", lead: "El sistema compara tu vector con 153 perfiles políticos agrupados en grandes familias." },
    "12axes-vs-9axes": { title: "12Axes vs 9Axes — Comparación", description: "Compara dimensiones, profundidad y resultados de 12axes y 9axes.", h1: "12Axes vs 9Axes: ¿qué test elegir?", lead: "Ambos superan la línea izquierda-derecha; 12Axes separa más dimensiones." },
    "12axes-vs-8values": { title: "12Axes vs 8values — Comparación", description: "Compara ejes, preguntas y resultados de 12axes y 8values.", h1: "12Axes vs 8values: ¿ocho valores o doce ejes?", lead: "8values es más breve; 12Axes ofrece un perfil más granular." },
    privacy: { title: "Privacidad — Test 12Axes", description: "Cómo se gestionan respuestas y datos.", h1: "Privacidad", lead: "No necesitas cuenta. Las respuestas permanecen en la sesión del navegador." },
    license: { title: "Licencia y créditos — 12Axes", description: "Licencia y atribución de esta implementación.", h1: "Licencia y créditos", lead: "12Axes forma parte de la familia abierta de tests vinculada con 8values y 9axes." },
  },
  ru: {
    "vercel-app": { title: "12Axes Vercel App не работает? Пройдите тест 12Axes", description: "Рабочая версия 12axes test: 36, 60 или 240 вопросов на пяти языках.", h1: "12axes Vercel app недоступен — рабочий тест здесь", lead: "Оригинальный сайт возвращает ошибку оплаты. Эта независимая версия сохраняет полный тест доступным." },
    results: { title: "Все результаты 12Axes — объяснение 12 осей", description: "Как читать проценты и категории результатов теста 12axes.", h1: "Все результаты 12Axes: как читать профиль", lead: "Результат содержит двенадцать процентов, совпадения с идеологиями, страной и личностью." },
    ideologies: { title: "Идеологии 12Axes — профили политического теста", description: "Основные идеологические семьи в тесте 12axes.", h1: "Идеологии и политические семьи 12Axes", lead: "Ваш вектор сравнивается со 153 политическими профилями." },
    "12axes-vs-9axes": { title: "12Axes и 9Axes — сравнение тестов", description: "Сравнение измерений и результатов 12axes и 9axes.", h1: "12Axes или 9Axes: какой тест выбрать?", lead: "Оба теста многомерны, но 12Axes разделяет больше политических тем." },
    "12axes-vs-8values": { title: "12Axes и 8values — сравнение", description: "Сравните оси, вопросы и результаты тестов.", h1: "12Axes или 8values: 12 осей или 8 ценностей?", lead: "8values короче, а 12Axes даёт более детальный профиль." },
    privacy: { title: "Конфиденциальность — 12Axes", description: "Как тест обрабатывает ответы и данные.", h1: "Конфиденциальность", lead: "Аккаунт не нужен. Ответы остаются в текущей сессии браузера." },
    license: { title: "Лицензия и авторство — 12Axes", description: "Лицензия и атрибуция реализации.", h1: "Лицензия и авторство", lead: "12Axes относится к открытой семье тестов 8values и 9axes." },
  },
  zh: {
    "vercel-app": { title: "12Axes Vercel App 无法访问？使用可用的 12Axes 测试", description: "12axes vercel app 的可用替代版，提供 36、60、240 题和五种语言。", h1: "12axes Vercel app 已停用——在这里使用完整测试", lead: "原 12axes.vercel.app 当前返回付费限制错误。这个独立版本无需账户即可完成全部测试。" },
    results: { title: "12Axes 全部结果 — 12 个政治轴详解", description: "了解 12axes 测试的所有百分比、极点组合和政治画像分类。", h1: "12Axes 全部结果：怎样阅读政治画像", lead: "每份结果包括十二个百分比、意识形态匹配、国家匹配和政治人物匹配。" },
    ideologies: { title: "12Axes 意识形态 — 政治测试画像目录", description: "浏览 12axes 测试使用的主要意识形态家族。", h1: "12Axes 意识形态与政治画像家族", lead: "系统会把你的 12 轴向量与 153 个政治画像比较。下面是主要家族和代表流派。" },
    "12axes-vs-9axes": { title: "12Axes 与 9Axes 对比 — 政治测试", description: "比较 12axes 和 9axes 的维度、题量和结果。", h1: "12Axes 与 9Axes：应该选哪个？", lead: "两者都超越简单左右划分，12Axes 将更多议题拆成独立维度。" },
    "12axes-vs-8values": { title: "12Axes 与 8values 对比", description: "比较两种政治测试的轴数、题量和结果。", h1: "12Axes 与 8values：十二轴还是八价值？", lead: "8values 更短，12Axes 的画像更细致。" },
    privacy: { title: "隐私政策 — 12Axes 测试", description: "了解测试怎样处理回答和分享链接。", h1: "隐私", lead: "测试不需要账户。回答只存在当前浏览器会话中。" },
    license: { title: "许可与致谢 — 12Axes 测试", description: "查看本项目的许可、来源和致谢。", h1: "许可与致谢", lead: "12Axes 源自与 8values、9axes 相关的开放政治测试家族，本实现保留必要署名。" },
  },
};

const ideologyFamilies = [
  ["Left", "Social democracy · Democratic socialism · Progressivism · Syndicalism · Communism"],
  ["Center", "Centrism · Pragmatism · Social liberalism · Christian democracy · Constitutional monarchism"],
  ["Right", "Conservatism · Liberal conservatism · National liberalism · Neoliberalism · Monarchism"],
  ["Libertarian", "Classical liberalism · Minarchism · Anarcho-capitalism · Libertarian socialism · Mutualism"],
  ["Authoritarian", "Authoritarian conservatism · State socialism · Technocracy · Absolute monarchism · Stratocracy"],
  ["Third position", "Integralism · National syndicalism · Distributism · Corporatism · Revolutionary nationalism"],
];

const seoUi = {
  en: { nav: ["Results", "Ideologies"], footer: ["Privacy", "License"], working: ["36 / 60 / 240 questions", "12 axis percentages and ideology matches", "Country and political personality matches", "Shareable result links without an account"], comparison: ["Feature", "Dimensions", "Questions", "Single test", "Matches", "Ideology · country · personality", "Axis/value profile"] },
  pt: { nav: ["Resultados", "Ideologias"], footer: ["Privacidade", "Licença"], working: ["36 / 60 / 240 perguntas", "Percentuais em 12 eixos e ideologias compatíveis", "País e personalidade política compatíveis", "Links de resultado sem conta"], comparison: ["Recurso", "Dimensões", "Perguntas", "Teste único", "Correspondências", "Ideologia · país · personalidade", "Perfil por eixo/valor"] },
  es: { nav: ["Resultados", "Ideologías"], footer: ["Privacidad", "Licencia"], working: ["36 / 60 / 240 preguntas", "Porcentajes en 12 ejes e ideologías coincidentes", "País y personalidad política coincidentes", "Enlaces de resultados sin cuenta"], comparison: ["Función", "Dimensiones", "Preguntas", "Test único", "Coincidencias", "Ideología · país · personalidad", "Perfil por eje/valor"] },
  ru: { nav: ["Результаты", "Идеологии"], footer: ["Конфиденциальность", "Лицензия"], working: ["36 / 60 / 240 вопросов", "Проценты по 12 осям и совпадения с идеологиями", "Совпадения со страной и политической фигурой", "Ссылки на результат без аккаунта"], comparison: ["Функция", "Измерения", "Вопросы", "Один тест", "Совпадения", "Идеология · страна · личность", "Профиль осей/ценностей"] },
  zh: { nav: ["结果", "意识形态"], footer: ["隐私", "许可"], working: ["36 / 60 / 240 道题", "12 轴百分比与意识形态匹配", "国家与政治人物匹配", "无需账户即可分享结果链接"], comparison: ["功能", "维度", "题目", "单一测试", "匹配结果", "意识形态 · 国家 · 人物", "轴/价值画像"] },
} as const;

const bodyCopy = {
  en: {
    happened: "What happened to 12axes.vercel.app?", happenedText: "The original deployment currently responds with HTTP 402 and DEPLOYMENT_DISABLED. The test itself is a browser-based political quiz; this version keeps the same three depths and 12-axis result flow available.", works: "What works here",
    dimensions: "The twelve result dimensions", calculate: "How percentages are calculated", calculateText: "Every response adds weight toward one pole of one axis. The final percentage is the average position for that dimension. A 50/50 result is balanced; larger gaps indicate stronger alignment with one pole.", match: "What the match percentage means", matchText: "Your twelve percentages form a vector. The matching service measures its proximity to political ideologies, country profiles and historical personalities. A match is similarity, not endorsement or proof of membership.",
    families: "Major ideology families", label: "Why one label is not the whole result", labelText: "The top ideology is a compact summary. Two people with the same label can differ sharply on immigration, civil liberties, religion or technology, so the twelve axis bars are the primary result.",
    glance: "At a glance", choose: "Choose 12Axes when", chooseText: "You want separate measures for state structure, representation, liberty, immigration, diplomacy, intervention, public ownership, market control, trade, religion, morality and technology.",
    answers: "Answers", answersText: "Answers are held in memory in your browser while the test is open. The server receives the twelve final percentages only to return comparison matches.", sharing: "Share links", sharingText: "A shared URL contains twelve percentage values. It does not contain answers, a name, email address or account identifier.", analytics: "Analytics and cookies", analyticsText: "This implementation does not set advertising cookies or require analytics cookies.",
    lineage: "Open-source lineage", lineageText: "The question model and scoring approach are based on the 12axes/9axes/8values open political-test lineage. Copyright notices and permission notices from upstream distributions must remain with substantial copies.", permission: "MIT-style permission", independent: "Independent implementation", independentText: "This site is an independent rebuild and is not affiliated with Vercel or the disabled 12axes.vercel.app deployment.",
  },
  pt: {
    happened: "O que aconteceu com 12axes.vercel.app?", happenedText: "A implantação original responde com HTTP 402 e DEPLOYMENT_DISABLED. Esta versão mantém as três profundidades e o fluxo de resultado em 12 eixos.", works: "O que funciona aqui",
    dimensions: "As doze dimensões do resultado", calculate: "Como os percentuais são calculados", calculateText: "Cada resposta adiciona peso a um polo. O percentual final é a posição média daquela dimensão; 50/50 indica equilíbrio.", match: "O que significa a compatibilidade", matchText: "Seus doze percentuais formam um vetor comparado com ideologias, países e personalidades. Semelhança não significa endosso.",
    families: "Principais famílias ideológicas", label: "Por que um rótulo não é o resultado inteiro", labelText: "A ideologia principal é um resumo. Pessoas com o mesmo rótulo podem divergir em imigração, liberdade, religião e tecnologia.",
    glance: "Resumo", choose: "Escolha o 12Axes quando", chooseText: "Você quer medir separadamente estrutura do Estado, representação, liberdade, imigração, diplomacia, economia, comércio, religião, moralidade e tecnologia.",
    answers: "Respostas", answersText: "As respostas ficam na memória do navegador durante o teste. O servidor recebe apenas os doze percentuais finais para calcular correspondências.", sharing: "Links compartilhados", sharingText: "O link contém doze percentuais, sem respostas, nome, e-mail ou conta.", analytics: "Analytics e cookies", analyticsText: "Esta implementação não usa cookies de publicidade nem exige cookies de analytics.",
    lineage: "Origem open source", lineageText: "O modelo de perguntas e pontuação vem da linhagem aberta 12axes/9axes/8values. Avisos de direitos e permissão devem acompanhar cópias substanciais.", permission: "Permissão no estilo MIT", independent: "Implementação independente", independentText: "Este site é uma reconstrução independente, sem vínculo com a Vercel ou com 12axes.vercel.app.",
  },
  es: {
    happened: "¿Qué pasó con 12axes.vercel.app?", happenedText: "El despliegue original responde con HTTP 402 y DEPLOYMENT_DISABLED. Esta versión mantiene las tres profundidades y los resultados de 12 ejes.", works: "Qué funciona aquí",
    dimensions: "Las doce dimensiones del resultado", calculate: "Cómo se calculan los porcentajes", calculateText: "Cada respuesta añade peso a un polo. El porcentaje final es la posición media; 50/50 indica equilibrio.", match: "Qué significa la coincidencia", matchText: "Los doce porcentajes forman un vector que se compara con ideologías, países y personalidades. Similitud no significa apoyo.",
    families: "Principales familias ideológicas", label: "Por qué una etiqueta no es todo el resultado", labelText: "La ideología principal es un resumen. Personas con la misma etiqueta pueden discrepar en inmigración, libertad, religión o tecnología.",
    glance: "Resumen", choose: "Elige 12Axes cuando", chooseText: "Quieres medir por separado estructura estatal, representación, libertad, inmigración, diplomacia, economía, comercio, religión, moralidad y tecnología.",
    answers: "Respuestas", answersText: "Las respuestas permanecen en la memoria del navegador. El servidor recibe solo los doce porcentajes finales para calcular coincidencias.", sharing: "Enlaces compartidos", sharingText: "El enlace contiene doce porcentajes, sin respuestas, nombre, correo ni cuenta.", analytics: "Analítica y cookies", analyticsText: "Esta implementación no usa cookies publicitarias ni exige cookies de analítica.",
    lineage: "Linaje de código abierto", lineageText: "El modelo y la puntuación proceden del linaje abierto 12axes/9axes/8values. Los avisos de copyright y permiso deben conservarse.", permission: "Permiso tipo MIT", independent: "Implementación independiente", independentText: "Este sitio es una reconstrucción independiente sin relación con Vercel ni con 12axes.vercel.app.",
  },
  ru: {
    happened: "Что случилось с 12axes.vercel.app?", happenedText: "Оригинальный сайт отвечает HTTP 402 и DEPLOYMENT_DISABLED. Эта версия сохраняет три режима и результаты по 12 осям.", works: "Что работает здесь",
    dimensions: "Двенадцать измерений результата", calculate: "Как считаются проценты", calculateText: "Каждый ответ добавляет вес одному полюсу. Итог — средняя позиция; 50/50 означает баланс.", match: "Что означает процент совпадения", matchText: "Двенадцать процентов образуют вектор, сравниваемый с идеологиями, странами и личностями. Сходство не означает поддержку.",
    families: "Основные идеологические семьи", label: "Почему одного ярлыка недостаточно", labelText: "Главная идеология — краткое резюме. Люди с одним ярлыком могут расходиться по вопросам миграции, свободы, религии и технологий.",
    glance: "Кратко", choose: "Выбирайте 12Axes, если", chooseText: "Нужно отдельно измерить устройство государства, представительство, свободу, миграцию, дипломатию, экономику, торговлю, религию, мораль и технологии.",
    answers: "Ответы", answersText: "Ответы хранятся в памяти браузера во время теста. Сервер получает только двенадцать итоговых процентов.", sharing: "Ссылки результата", sharingText: "Ссылка содержит двенадцать процентов, но не ответы, имя, почту или аккаунт.", analytics: "Аналитика и cookie", analyticsText: "Сайт не устанавливает рекламные cookie и не требует аналитических cookie.",
    lineage: "Открытое происхождение", lineageText: "Модель вопросов и подсчёта основана на открытой линии 12axes/9axes/8values. Уведомления об авторстве и разрешении должны сохраняться.", permission: "Разрешение в стиле MIT", independent: "Независимая реализация", independentText: "Сайт является независимой реконструкцией и не связан с Vercel или 12axes.vercel.app.",
  },
  zh: {
    happened: "12axes.vercel.app 发生了什么？", happenedText: "原部署当前返回 HTTP 402 和 DEPLOYMENT_DISABLED。本版本保留三种题量和完整的 12 轴结果流程。", works: "这里提供的功能",
    dimensions: "结果的十二个维度", calculate: "百分比如何计算", calculateText: "每个回答都会为某个极点增加权重。最终百分比是该维度的平均位置；50/50 表示平衡。", match: "匹配度代表什么", matchText: "十二个百分比组成一个向量，用来与意识形态、国家和人物画像比较。相似并不代表认同。",
    families: "主要意识形态家族", label: "为什么一个标签不等于完整结果", labelText: "首要意识形态只是摘要。相同标签的人可能在移民、自由、宗教或科技问题上差异很大。",
    glance: "快速对比", choose: "适合选择 12Axes 的情况", chooseText: "你希望分别衡量国家结构、政治代表、自由、移民、外交、经济、贸易、宗教、道德和科技。",
    answers: "回答数据", answersText: "测试进行时，回答只保存在浏览器内存。服务器只接收十二个最终百分比以计算匹配结果。", sharing: "分享链接", sharingText: "分享链接只包含十二个百分比，不包含回答、姓名、邮箱或账户信息。", analytics: "分析与 Cookie", analyticsText: "本实现不设置广告 Cookie，也不要求分析 Cookie。",
    lineage: "开源来源", lineageText: "题目模型和计分方式来自 12axes/9axes/8values 开放测试谱系。大量复制时必须保留版权和许可声明。", permission: "MIT 风格许可", independent: "独立实现", independentText: "本站为独立重建，与 Vercel 或已停用的 12axes.vercel.app 没有关联。",
  },
} as const;

export function pageMetadata(locale: Locale, slug: SeoSlug, base: URL): Metadata {
  const page = pageCopy[locale][slug];
  const path = localePath(locale, `/${slug}`);
  const languages = Object.fromEntries(locales.map((item) => [htmlLang[item], new URL(localePath(item, `/${slug}`), base).toString()]));
  return {
    metadataBase: base,
    title: page.title,
    description: page.description,
    alternates: { canonical: path, languages: { ...languages, "x-default": new URL(`/${slug}`, base).toString() } },
    openGraph: { title: page.title, description: page.description, url: path, type: "website", siteName: "12 Axes Test", images: [{ url: "/og.png", width: 1730, height: 909, alt: "12Axes Test — discover your political ideology across 12 axes" }] },
    twitter: { card: "summary_large_image", title: page.title, description: page.description, images: ["/og.png"] },
  };
}

export function SeoPage({ locale, slug }: { locale: Locale; slug: SeoSlug }) {
  const page = pageCopy[locale][slug];
  const ui = seoUi[locale];
  return (
    <main className="seo-shell">
      <header className="site-header">
        <a className="logo" href={localePath(locale)}><b>12</b><span>axes</span></a>
        <nav><a href={localePath(locale)}>{copy[locale].start}</a><a href={localePath(locale, "/results")}>{ui.nav[0]}</a><a href={localePath(locale, "/ideologies")}>{ui.nav[1]}</a></nav>
        <div className="language-links">{locales.map((item) => <a className={item === locale ? "active" : ""} href={localePath(item, `/${slug}`)} key={item}>{item.toUpperCase()}</a>)}</div>
      </header>
      <article className="seo-article">
        <span className="eyebrow">12 Axes Test</span>
        <h1>{page.h1}</h1>
        <p className="seo-lead">{page.lead}</p>
        {slug === "vercel-app" && <VercelBody locale={locale} />}
        {slug === "results" && <ResultsBody locale={locale} />}
        {slug === "ideologies" && <IdeologiesBody locale={locale} />}
        {(slug === "12axes-vs-9axes" || slug === "12axes-vs-8values") && <ComparisonBody locale={locale} competitor={slug === "12axes-vs-9axes" ? "9Axes" : "8values"} />}
        {slug === "privacy" && <PrivacyBody locale={locale} />}
        {slug === "license" && <LicenseBody locale={locale} />}
        {!["privacy", "license"].includes(slug) && <div className="seo-cta"><h2>{copy[locale].formatTitle}</h2><p>{copy[locale].formatLead}</p><a className="primary-button" href={localePath(locale)}>{copy[locale].start} →</a></div>}
      </article>
      <SeoFooter locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        inLanguage: htmlLang[locale],
        isPartOf: { "@type": "WebSite", name: "12 Axes Test" },
      }) }} />
    </main>
  );
}

function VercelBody({ locale }: { locale: Locale }) {
  const text = bodyCopy[locale];
  return <><section><h2>{text.happened}</h2><p>{text.happenedText}</p></section><section><h2>{text.works}</h2><ul>{seoUi[locale].working.map((item) => <li key={item}>{item}</li>)}<li>{localeNames[locale]} · English · Português · Español · Русский · 中文</li></ul></section></>;
}

function ResultsBody({ locale }: { locale: Locale }) {
  const text = bodyCopy[locale];
  return <><section><h2>{text.dimensions}</h2><div className="seo-axis-list">{axisExplanations[locale].map((axis, index) => <div key={axis}><b>{String(index + 1).padStart(2, "0")}</b><span>{axis}</span></div>)}</div></section><section><h2>{text.calculate}</h2><p>{text.calculateText}</p></section><section><h2>{text.match}</h2><p>{text.matchText}</p></section></>;
}

function IdeologiesBody({ locale }: { locale: Locale }) {
  const text = bodyCopy[locale];
  return <><section><h2>{text.families}</h2><div className="ideology-list">{ideologyFamilies.map(([family, examples]) => <article key={family}><h3>{family}</h3><p>{examples}</p></article>)}</div></section><section><h2>{text.label}</h2><p>{text.labelText}</p></section><section><h2>{copy[locale].versions}</h2><p>{copy[locale].versionsLead}</p></section></>;
}

function ComparisonBody({ competitor, locale }: { locale: Locale; competitor: string }) {
  return <ComparisonLocalized competitor={competitor} locale={locale} />;
}

function ComparisonLocalized({ competitor, locale = "en" }: { competitor: string; locale?: Locale }) {
  const text = bodyCopy[locale];
  const [feature, dimensions, questions, singleTest, matches, matchTypes, axisProfile] = seoUi[locale].comparison;
  return <><section><h2>{text.glance}</h2><div className="comparison-table"><div><b>{feature}</b><b>12Axes</b><b>{competitor}</b></div><div><span>{dimensions}</span><span>12</span><span>{competitor === "9Axes" ? "9" : "8"}</span></div><div><span>{questions}</span><span>36 / 60 / 240</span><span>{singleTest}</span></div><div><span>{matches}</span><span>{matchTypes}</span><span>{axisProfile}</span></div></div></section><section><h2>{text.choose}</h2><p>{text.chooseText}</p></section></>;
}

function PrivacyBody({ locale = "en" }: { locale?: Locale }) {
  const text = bodyCopy[locale];
  return <><section><h2>{text.answers}</h2><p>{text.answersText}</p></section><section><h2>{text.sharing}</h2><p>{text.sharingText}</p></section><section><h2>{text.analytics}</h2><p>{text.analyticsText}</p></section></>;
}

function LicenseBody({ locale = "en" }: { locale?: Locale }) {
  const text = bodyCopy[locale];
  return <><section><h2>{text.lineage}</h2><p>{text.lineageText}</p></section><section><h2>{text.permission}</h2><pre>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, subject to inclusion of the copyright and permission notice.</pre></section><section><h2>{text.independent}</h2><p>{text.independentText}</p></section></>;
}

function SeoFooter({ locale }: { locale: Locale }) {
  const [privacy, license] = seoUi[locale].footer;
  return <footer><a className="logo" href={localePath(locale)}><b>12</b><span>axes</span></a><p>{copy[locale].footer}</p><nav><a href={localePath(locale, "/privacy")}>{privacy}</a><a href={localePath(locale, "/license")}>{license}</a></nav></footer>;
}
