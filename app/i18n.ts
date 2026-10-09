export const locales = ["en", "pt", "es", "ru", "zh"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  ru: "Русский",
  zh: "中文",
};

export const htmlLang: Record<Locale, string> = {
  en: "en",
  pt: "pt-BR",
  es: "es",
  ru: "ru",
  zh: "zh-CN",
};

export const publicContactUrl = "https://github.com/olokojoh/12axes/issues";

export const contactLabels: Record<Locale, string> = {
  en: "Contact and feedback",
  pt: "Contato e feedback",
  es: "Contacto y comentarios",
  ru: "Связь и отзывы",
  zh: "联系与反馈",
};

export const copy = {
  en: {
    nav: ["How it works", "12 Axes", "Spectrum", "FAQ"],
    support: "Support",
    eyebrow: "Political discovery",
    titleA: "12 Axes",
    titleB: "Political Test",
    lead: "Take the free 12 axes political test with 36, 60 or 240 questions. 12Axes maps your views across 12 dimensions and compares them with ideology, country and historical personality profiles. No account required.",
    start: "Discover my profile",
    axesLink: "See the 12 axes",
    labels: ["Free", "No registration", "Fast", "Instant result"],
    discoverEyebrow: "What you will discover",
    discoverTitle: "A complete portrait of your political convictions",
    discoverLead: "Go beyond left and right with twelve percentages and comparisons to reference profiles. Country matches describe modeled profiles, not population averages.",
    discovery: [
      ["Your ideology", "Which political current matches you"],
      ["Your country", "Which country reference profile is closest"],
      ["Your political leader", "Which historical figure is your ideological match"],
      ["Your spectrum", "Where you fall between left and right"],
      ["Your profile", "A complete portrait of your convictions"],
      ["Compatibility", "How closely your answers match each reference profile"],
    ],
    howTitle: "How the 12 Axes political quiz works",
    howLead: "A simple, visual political ideology test: answer statements, get percentages across 12 axes, and see where you stand.",
    how: [
      ["Answer the questions", "Agree or disagree with statements about the economy, the state, civil liberties, values, religion, foreign policy, and technology."],
      ["Analysis across 12 axes", "Each statement contributes to one axis. Your answers together form a profile across 12 dimensions."],
      ["Discover your profile", "Receive your closest ideologies, country, political personality, and per-axis results."],
    ],
    axesTitle: "What does each axis mean?",
    spectrumTitle: "Discover your political spectrum",
    spectrumLead: "The result goes beyond left and right to identify centrist, radical, authoritarian, libertarian, and third-position profiles.",
    spectrum: ["Radical left", "Left", "Center", "Right", "Far-right", "Third position", "Libertarian", "Anarchist"],
    faqTitle: "FAQ — Frequently asked questions",
    faq: [
      ["What is 12Axes?", "12Axes, also written as 12 Axes and sometimes searched as “12 axis”, is an educational political test. It compares your answers across twelve dimensions instead of placing every view on a single left–right line."],
      ["Is the 12 axes test free?", "Yes. All three question sets and the basic results are free, including twelve percentages, ideology matches and a country and personality match. Optional paid reports add explanations and comparisons; you can see your basic result without paying."],
      ["Is the test reliable?", "It is an educational comparison tool. Twelve separate dimensions reduce single-topic bias, but the result is not a clinical or academic diagnosis."],
      ["How long does it take?", "The short version takes about 5 minutes, the full version about 9 minutes, and the 240-question extreme version about 30 minutes."],
      ["Can I retake it?", "Yes. Retake any version and compare how your result changes."],
      ["Is there a right answer?", "No. The test measures preferences rather than political knowledge."],
      ["How does the algorithm calculate?", "Each answer adds weight to one pole of an axis. Your 12-axis vector is compared with ideology, country, and personality profiles."],
      ["Is the test scientific?", "No. It is an educational political test inspired by multi-axis political spectrum models."],
      ["Can I share it?", "Yes. You can choose to save your result and create a link. Anyone with the link can view it."],
      ["Does it work on mobile?", "Yes. The test is designed for phones, tablets, and desktop browsers."],
    ],
    versions: "Choose the depth",
    versionsLead: "All versions use the same 12 axes and return the result immediately.",
    formats: [
      ["short", "Short", "36 questions", "A quick result for a first reading of your profile", "About 5 min"],
      ["extended", "Full", "60 questions", "More precision for closer ideological matches", "About 9 min"],
      ["extreme", "Extreme", "240 questions", "Every statement in the complete question bank", "About 30 min"],
    ],
    startVersion: "Start version",
    formatTitle: "Do you want speed or precision?",
    formatLead: "Choose a quick overview, a more precise result, or the complete 240-question test.",
    progress: (current: number, total: number) => `Question ${current} of ${total}`,
    back: "Back",
    next: "Next",
    seeResult: "See results",
    extendTitle: "Your 36-question result is ready. Answer 24 more for a deeper comparison?",
    extendYes: "Answer 24 more questions",
    extendNo: "View my result now",
    loading: "Calculating your political profile…",
    resultEyebrow: "Analysis complete",
    resultTitle: "Your ideological profile",
    resultLead: "Your answers have been mapped across 12 dimensions and compared with political ideologies, countries, and personalities.",
    topMatch: "Top ideology match",
    otherMatches: "Other close matches",
    country: "Most compatible country",
    personality: "Most compatible personality",
    retake: "Retake the test",
    share: "Copy share link",
    copied: "Link copied",
    supportTitle: "Support the project",
    supportLead: "12 Axes is independent and free. Read the privacy policy for the data used by sharing and paid reports.",
    footer: "Educational political test. Results are descriptive, not endorsements.",
  },
  pt: {
    nav: ["Como funciona", "12 Eixos", "Espectro", "FAQ"], support: "Apoie", eyebrow: "Descoberta política",
    titleA: "12 Axes", titleB: "Teste político",
    lead: "Faça o teste político 12Axes grátis com 36, 60 ou 240 perguntas. Veja seus percentuais em 12 eixos e compare com perfis de ideologias, países e personalidades históricas. Sem cadastro.",
    start: "Descobrir meu perfil", axesLink: "Ver os 12 eixos", labels: ["Grátis", "Sem cadastro", "Rápido", "Resultado imediato"],
    discoverEyebrow: "O que você vai descobrir", discoverTitle: "Um retrato completo das suas convicções políticas",
    discoverLead: "Mais do que esquerda ou direita: seu resultado mostra com quem, onde e com que intensidade suas ideias combinam.",
    discovery: [["Sua ideologia", "Qual corrente política combina com você"], ["Seu país", "Qual nação mais pensa como você"], ["Sua personalidade política", "Qual figura histórica é seu par ideológico"], ["Seu espectro", "Onde você fica entre esquerda e direita"], ["Seu perfil", "Um retrato completo das suas convicções"], ["Compatibilidade", "O quanto suas respostas se aproximam de cada perfil"]],
    howTitle: "Como funciona o quiz político 12 Axes", howLead: "Um teste de ideologia política simples e visual: responda a afirmações e receba percentuais em 12 eixos.",
    how: [["Responda às perguntas", "Concorde ou discorde de afirmações sobre economia, Estado, liberdades, valores, religião, política externa e tecnologia."], ["Análise em 12 eixos", "Cada resposta posiciona você em 12 dimensões ideológicas independentes."], ["Descubra seu perfil", "Receba ideologias, país, personalidade e resultados por eixo."]],
    axesTitle: "O que significa cada eixo?", spectrumTitle: "Descubra seu espectro político", spectrumLead: "O resultado vai além de esquerda e direita e identifica perfis de centro, radicais, autoritários, libertários e de terceira posição.",
    spectrum: ["Esquerda radical", "Esquerda", "Centro", "Direita", "Extrema-direita", "Terceira posição", "Libertário", "Anarquista"],
    faqTitle: "FAQ — Perguntas frequentes",
    faq: [
      ["O que é o 12Axes?", "12Axes, também escrito 12 Axes, é um teste político educativo que compara suas respostas em doze dimensões, além de uma única linha entre esquerda e direita."],
      ["O teste 12 Axes é grátis?", "Sim. As três versões e os resultados básicos são grátis: percentuais dos 12 eixos e correspondências com ideologias, país e personalidade. Relatórios pagos são opcionais e acrescentam explicações e comparações."],["O teste é confiável?", "É uma ferramenta educativa de comparação, não um diagnóstico clínico ou acadêmico."], ["Quanto tempo leva?", "A versão curta leva cerca de 5 minutos, a completa 9 minutos e a extrema 30 minutos."], ["Posso refazer?", "Sim. Refaça qualquer versão e compare seus resultados."], ["Existe resposta certa?", "Não. O teste mede preferências, não conhecimento político."], ["Como o algoritmo calcula?", "Cada resposta pesa um polo de um eixo. Seu vetor é comparado com perfis políticos."], ["O teste é científico?", "Não. É um teste educativo inspirado em modelos multidimensionais."], ["Posso compartilhar?", "Sim. Você pode salvar o resultado e criar um link. Quem tiver o link poderá vê-lo."], ["Funciona no celular?", "Sim. A interface funciona em celular, tablet e computador."]],
    versions: "Escolha a profundidade", versionsLead: "Todas as versões usam os mesmos 12 eixos e entregam o resultado na hora.",
    formats: [["short", "Curta", "36 perguntas", "Resultado rápido para uma primeira leitura", "Cerca de 5 min"], ["extended", "Completa", "60 perguntas", "Mais precisão nos perfis ideológicos", "Cerca de 9 min"], ["extreme", "Extrema", "240 perguntas", "Todo o banco de afirmações", "Cerca de 30 min"]],
    startVersion: "Começar versão", formatTitle: "Você quer rapidez ou precisão?", formatLead: "Escolha uma visão rápida, um resultado mais preciso ou o teste completo.",
    progress: (current: number, total: number) => `Pergunta ${current} de ${total}`, back: "Voltar", next: "Avançar", seeResult: "Ver resultado",
    extendTitle: "Seu resultado de 36 perguntas está pronto. Responder mais 24 para uma comparação mais profunda?", extendYes: "Responder mais 24 perguntas", extendNo: "Ver meu resultado agora",
    loading: "Calculando seu perfil político…", resultEyebrow: "Análise concluída", resultTitle: "Seu perfil ideológico",
    resultLead: "Suas respostas foram mapeadas em 12 dimensões e comparadas com ideologias, países e personalidades.",
    topMatch: "Ideologia mais compatível", otherMatches: "Outras correspondências", country: "País mais compatível", personality: "Personalidade mais compatível",
    retake: "Refazer o teste", share: "Copiar link", copied: "Link copiado", supportTitle: "Apoie o projeto",
    supportLead: "12 Axes é independente e gratuito. A política de privacidade explica os dados de compartilhamento e relatórios pagos.", footer: "Teste político educativo. Resultados são descritivos, não endossos.",
  },
  es: {
    nav: ["Cómo funciona", "12 Ejes", "Espectro", "FAQ"], support: "Apoyar", eyebrow: "Descubrimiento político", titleA: "12 Axes", titleB: "Test político",
    lead: "Haz el test político 12Axes gratis con 36, 60 o 240 preguntas. Explora tus porcentajes en 12 ejes y compáralos con perfiles de ideologías, países y figuras históricas. Sin registro.", start: "Descubrir mi perfil", axesLink: "Ver los 12 ejes", labels: ["Gratis", "Sin registro", "Rápido", "Resultado inmediato"],
    discoverEyebrow: "Lo que descubrirás", discoverTitle: "Un retrato completo de tus convicciones políticas", discoverLead: "Más que izquierda o derecha: descubre dónde y con qué intensidad encajan tus ideas.",
    discovery: [["Tu ideología", "La corriente política más cercana"], ["Tu país", "La nación más compatible"], ["Tu figura política", "La personalidad histórica más cercana"], ["Tu espectro", "Tu posición entre izquierda y derecha"], ["Tu perfil", "Un retrato de tus convicciones"], ["Compatibilidad", "La cercanía de cada perfil"]],
    howTitle: "Cómo funciona el test político 12 Axes", howLead: "Responde afirmaciones, recibe porcentajes en 12 ejes y descubre tu perfil.",
    how: [["Responde las preguntas", "Opina sobre economía, Estado, libertades, valores, religión, política exterior y tecnología."], ["Análisis en 12 ejes", "Cada respuesta te sitúa en una dimensión ideológica."], ["Descubre tu perfil", "Obtén ideologías, país, personalidad y resultados por eje."]],
    axesTitle: "¿Qué significa cada eje?", spectrumTitle: "Descubre tu espectro político", spectrumLead: "El resultado va más allá de izquierda y derecha e identifica perfiles centristas, radicales, autoritarios y libertarios.",
    spectrum: ["Izquierda radical", "Izquierda", "Centro", "Derecha", "Extrema derecha", "Tercera posición", "Libertario", "Anarquista"],
    faqTitle: "Preguntas frecuentes", faq: [
      ["¿Qué es 12Axes?", "12Axes, también escrito 12 Axes, es un test político educativo que compara tus respuestas en doce dimensiones, más allá de una sola línea de izquierda a derecha."],
      ["¿Es gratis el test 12 Axes?", "Sí. Las tres versiones y los resultados básicos son gratis: porcentajes de los 12 ejes y coincidencias de ideologías, país y personalidad. Los informes de pago son opcionales y añaden explicaciones y comparaciones."],["¿Es fiable?", "Es una herramienta educativa de comparación, no un diagnóstico científico."], ["¿Cuánto tarda?", "5 minutos la versión corta, 9 la completa y unos 30 la extrema."], ["¿Puedo repetirlo?", "Sí, todas las veces que quieras."], ["¿Hay respuestas correctas?", "No. Mide preferencias políticas."], ["¿Cómo calcula?", "Convierte respuestas en doce porcentajes y compara el vector con perfiles."], ["¿Es científico?", "No. Se inspira en modelos políticos multidimensionales."], ["¿Puedo compartir?", "Sí. Puedes guardar el resultado y crear un enlace. Quien tenga el enlace podrá verlo."], ["¿Funciona en móvil?", "Sí, en móvil, tableta y ordenador."]],
    versions: "Elige la profundidad", versionsLead: "Todas las versiones usan los mismos 12 ejes.", formats: [["short", "Corta", "36 preguntas", "Una primera lectura rápida", "Unos 5 min"], ["extended", "Completa", "60 preguntas", "Más precisión ideológica", "Unos 9 min"], ["extreme", "Extrema", "240 preguntas", "Todo el banco de preguntas", "Unos 30 min"]],
    startVersion: "Comenzar", formatTitle: "¿Rapidez o precisión?", formatLead: "Elige la profundidad del test.", progress: (current: number, total: number) => `Pregunta ${current} de ${total}`, back: "Atrás", next: "Siguiente", seeResult: "Ver resultado",
    extendTitle: "Tu resultado de 36 preguntas está listo. ¿Responder 24 más para una comparación más completa?", extendYes: "Responder 24 preguntas más", extendNo: "Ver mi resultado ahora", loading: "Calculando tu perfil…",
    resultEyebrow: "Análisis completo", resultTitle: "Tu perfil ideológico", resultLead: "Tus respuestas se compararon en 12 dimensiones con ideologías, países y personalidades.",
    topMatch: "Ideología principal", otherMatches: "Otras coincidencias", country: "País más compatible", personality: "Personalidad más compatible", retake: "Repetir el test", share: "Copiar enlace", copied: "Enlace copiado",
    supportTitle: "Apoya el proyecto", supportLead: "12 Axes es gratuito. Consulta la política de privacidad para conocer los datos de enlaces y reportes pagados.", footer: "Test político educativo. Los resultados son descriptivos.",
  },
  ru: {
    nav: ["Как это работает", "12 осей", "Спектр", "FAQ"], support: "Поддержать", eyebrow: "Политическое самоопределение", titleA: "12 Axes", titleB: "Политический тест",
    lead: "Пройдите бесплатный политический тест 12Axes: 36, 60 или 240 вопросов. Узнайте показатели по 12 осям и сходство с профилями идеологий, стран и исторических личностей. Без регистрации.", start: "Узнать свой профиль", axesLink: "Посмотреть 12 осей", labels: ["Бесплатно", "Без регистрации", "Быстро", "Мгновенный результат"],
    discoverEyebrow: "Что вы узнаете", discoverTitle: "Полный портрет ваших политических убеждений", discoverLead: "Не только левые или правые: узнайте, где и насколько точно совпадают ваши идеи.",
    discovery: [["Ваша идеология", "Ближайшее политическое течение"], ["Ваша страна", "Наиболее совместимая страна"], ["Политическая фигура", "Ближайшая историческая личность"], ["Ваш спектр", "Позиция между левыми и правыми"], ["Ваш профиль", "Портрет убеждений"], ["Совместимость", "Близость каждого профиля"]],
    howTitle: "Как работает политический тест 12 Axes", howLead: "Ответьте на утверждения и получите проценты по 12 осям.",
    how: [["Ответьте на вопросы", "Выскажите мнение об экономике, государстве, свободах, ценностях, религии и технологиях."], ["Анализ по 12 осям", "Каждый ответ определяет позицию на отдельной оси."], ["Получите профиль", "Узнайте идеологии, страну, личность и результаты по осям."]],
    axesTitle: "Что означает каждая ось?", spectrumTitle: "Определите свой политический спектр", spectrumLead: "Результат показывает центристские, радикальные, авторитарные, либертарианские и другие профили.",
    spectrum: ["Радикальные левые", "Левые", "Центр", "Правые", "Ультраправые", "Третья позиция", "Либертарианство", "Анархизм"],
    faqTitle: "Частые вопросы", faq: [
      ["Что такое 12Axes?", "12Axes, также 12 Axes, — образовательный политический тест. Он сравнивает ответы по двенадцати измерениям, а не сводит все взгляды к одной линии от левых к правым."],
      ["Тест 12 Axes бесплатный?", "Да. Все три версии и базовые результаты бесплатны: проценты по 12 осям, совпадения с идеологиями, страной и личностью. Платные отчёты необязательны и добавляют пояснения и сравнения."],["Надёжен ли тест?", "Это образовательный инструмент, а не научный диагноз."], ["Сколько времени?", "Около 5, 9 или 30 минут в зависимости от версии."], ["Можно пройти снова?", "Да, сколько угодно."], ["Есть правильные ответы?", "Нет. Тест измеряет предпочтения."], ["Как считается результат?", "Ответы преобразуются в 12 процентов и сравниваются с профилями."], ["Это научный тест?", "Нет, он основан на многомерных политических моделях."], ["Можно поделиться?", "Да. Можно сохранить результат и создать ссылку. Доступ есть у любого, кто получил ссылку."], ["Работает на телефоне?", "Да, на телефонах, планшетах и компьютерах."]],
    versions: "Выберите глубину", versionsLead: "Все версии используют те же 12 осей.", formats: [["short", "Короткая", "36 вопросов", "Быстрый обзор", "Около 5 мин"], ["extended", "Полная", "60 вопросов", "Более точный результат", "Около 9 мин"], ["extreme", "Экстремальная", "240 вопросов", "Вся база вопросов", "Около 30 мин"]],
    startVersion: "Начать", formatTitle: "Скорость или точность?", formatLead: "Выберите глубину теста.", progress: (current: number, total: number) => `Вопрос ${current} из ${total}`, back: "Назад", next: "Далее", seeResult: "Результат",
    extendTitle: "Результат по 36 вопросам готов. Ответить ещё на 24 для более полного сравнения?", extendYes: "Ответить ещё на 24 вопроса", extendNo: "Показать результат сейчас", loading: "Вычисляем профиль…",
    resultEyebrow: "Анализ завершён", resultTitle: "Ваш идеологический профиль", resultLead: "Ответы сопоставлены с идеологиями, странами и личностями по 12 измерениям.",
    topMatch: "Главная идеология", otherMatches: "Другие совпадения", country: "Самая близкая страна", personality: "Самая близкая личность", retake: "Пройти заново", share: "Копировать ссылку", copied: "Ссылка скопирована",
    supportTitle: "Поддержать проект", supportLead: "12 Axes бесплатен. Политика конфиденциальности описывает данные ссылок и платных отчётов.", footer: "Образовательный политический тест. Результаты носят описательный характер.",
  },
  zh: {
    nav: ["测试原理", "12 个轴", "政治光谱", "常见问题"], support: "支持项目", eyebrow: "探索政治立场", titleA: "12 Axes", titleB: "12 轴政治测试",
    lead: "免费完成 36、60 或 240 题 12Axes 政治测试，查看 12 个维度的百分比，以及与意识形态、国家参考画像和历史人物的相似度。无需注册。", start: "开始 12Axes 测试", axesLink: "查看 12 个轴", labels: ["免费", "无需注册", "快速", "即时结果"],
    discoverEyebrow: "你将获得", discoverTitle: "一幅完整的政治观念画像", discoverLead: "不只区分左与右，还会展示你的观点在十二个维度上的方向和强度。",
    discovery: [["你的意识形态", "最接近的政治流派"], ["你的国家", "观点最相近的国家"], ["你的政治人物", "最接近的历史人物"], ["你的光谱", "从左到右的位置"], ["你的画像", "完整的观念概览"], ["匹配度", "与各类政治画像的接近程度"]],
    howTitle: "12Axes 政治测试如何运作", howLead: "回答一系列陈述，获得 12 个轴的百分比，并查看你的政治画像。",
    how: [["回答问题", "表达你对经济、国家、自由、价值观、宗教、外交和科技的看法。"], ["分析 12 个轴", "每个回答都会影响一个独立维度。"], ["查看政治画像", "获得意识形态、国家、人物和每个轴的结果。"]],
    axesTitle: "每个轴代表什么？", spectrumTitle: "发现你的政治光谱", spectrumLead: "结果不局限于左右，还会识别中间派、激进派、威权、自由意志主义和第三位置等画像。",
    spectrum: ["激进左翼", "左翼", "中间派", "右翼", "极右翼", "第三位置", "自由意志主义", "无政府主义"],
    faqTitle: "常见问题", faq: [
      ["12Axes 是什么？", "12Axes 也写作 12 Axes，是一个教育用途的政治测试，通过十二个维度比较你的观点，而不是只用一条左翼到右翼的直线概括立场。"],
      ["12 Axes 测试免费吗？", "免费。36、60、240 题版本和基础结果都无需付款，包括 12 轴百分比、意识形态、国家参考画像和人物匹配。付费报告为可选项目，增加解读和比较内容。"],["测试可靠吗？", "这是教育和比较工具，不是科学或临床诊断。"], ["需要多久？", "短版约 5 分钟，完整版约 9 分钟，240 题极限版约 30 分钟。"], ["可以重测吗？", "可以，次数不限。"], ["有标准答案吗？", "没有。测试衡量的是偏好。"], ["算法怎样计算？", "回答会转化为十二个百分比，再与政治画像向量比较。"], ["这是科学测试吗？", "不是，但它参考了多轴政治光谱模型。"], ["可以分享吗？", "可以。你可以保存结果并创建分享链接。持有链接的人可以查看结果。"], ["支持手机吗？", "支持手机、平板和电脑。"]],
    versions: "选择测试深度", versionsLead: "三个版本都使用相同的 12 个轴并即时返回结果。", formats: [["short", "短版", "36 题", "快速了解基本画像", "约 5 分钟"], ["extended", "完整版", "60 题", "匹配结果更精确", "约 9 分钟"], ["extreme", "极限版", "240 题", "完整题库", "约 30 分钟"]],
    startVersion: "开始", formatTitle: "速度还是精度？", formatLead: "选择适合你的测试深度。", progress: (current: number, total: number) => `第 ${current} 题，共 ${total} 题`, back: "上一题", next: "下一题", seeResult: "查看结果",
    extendTitle: "36 题结果已经准备好。是否再答 24 题，获得更完整的比较？", extendYes: "再答 24 题", extendNo: "立即查看我的结果", loading: "正在计算政治画像…",
    resultEyebrow: "分析完成", resultTitle: "你的意识形态画像", resultLead: "你的回答已在 12 个维度上与意识形态、国家和人物画像完成比较。",
    topMatch: "最接近的意识形态", otherMatches: "其他相近结果", country: "最匹配的国家", personality: "最匹配的政治人物", retake: "重新测试", share: "复制分享链接", copied: "链接已复制",
    supportTitle: "支持项目", supportLead: "12 Axes 免费且独立。隐私页说明分享和付费报告所使用的数据。", footer: "教育用途政治测试。结果仅作描述，不代表认同。",
  },
} as const;

export const axisExplanations: Record<Locale, string[]> = {
  en: ["Federal × Unitary", "Democracy × Autocracy", "Security × Liberty", "Assimilation × Multiculturalism", "Militarist × Pacifist", "Non-interventionist × Nationalist", "Public × Private", "Planning × Free market", "Protectionism × Globalism", "Irreligious × Religious", "Progressive × Traditionalist", "Technology × Biology"],
  pt: ["Federal × Unitário", "Democracia × Autocracia", "Segurança × Liberdade", "Assimilação × Multiculturalismo", "Militarista × Pacifista", "Não intervencionista × Nacionalista", "Público × Privado", "Planejamento × Livre mercado", "Protecionismo × Globalismo", "Irreligioso × Religioso", "Progressista × Tradicionalista", "Tecnologia × Biologia"],
  es: ["Federal × Unitario", "Democracia × Autocracia", "Seguridad × Libertad", "Asimilación × Multiculturalismo", "Militarista × Pacifista", "No intervencionista × Nacionalista", "Público × Privado", "Planificación × Libre mercado", "Proteccionismo × Globalismo", "Irreligioso × Religioso", "Progresista × Tradicionalista", "Tecnología × Biología"],
  ru: ["Федерализм × Унитаризм", "Демократия × Автократия", "Безопасность × Свобода", "Ассимиляция × Мультикультурализм", "Милитаризм × Пацифизм", "Невмешательство × Национализм", "Общественное × Частное", "Планирование × Свободный рынок", "Протекционизм × Глобализм", "Светскость × Религиозность", "Прогрессизм × Традиционализм", "Технология × Биология"],
  zh: ["联邦制 × 单一制", "民主 × 威权", "安全 × 自由", "同化 × 多元文化", "军事主义 × 和平主义", "不干预 × 民族主义", "公共 × 私营", "计划 × 自由市场", "保护主义 × 全球主义", "世俗 × 宗教", "进步 × 传统", "科技 × 自然"],
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localePath(locale: Locale, path = "") {
  const prefix = locale === "en" ? "" : `/${locale}`;
  if (!path) return prefix || "/";
  return `${prefix}${path}`.replace("//", "/");
}
