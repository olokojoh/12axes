import type { Locale } from "./i18n";

const en = {
  share: "Share result", intro: "Share your free result, without exposing your private paid report.",
  consent: "I agree to publish my 12-axis scores and political match on a public link. Anyone with the link can view them; social platforms may store a preview.",
  published: "Your link is public and remains accessible after you close this panel. To request its removal:", removeLink: "Contact us to remove the public result",
  prepare: "Create share link and images", preparing: "Preparing your share cards…", retry: "Retry preparing images", ready: "Your link and images are ready.",
  error: "Could not create a share link. Please try again.", imageError: "Your link works, but its image preview is not ready. You can copy the link or retry preparing images.",
  image: "Share image", copy: "Copy text + link", copied: "Text and link copied.", copyFailed: "Please manually copy the link below.",
  nativeLink: "System link sharing", nativeDone: "System sharing finished. The receiving app controls whether it is posted.", canceled: "Sharing canceled.", shareFailed: "Sharing failed. Use the copy, open image or download options below.",
  noNative: "System sharing is unavailable here. Use a platform button or copy the link.", noFile: "This browser cannot share image files. Preview, save or download the image below.",
  platforms: "Open a platform's sharing screen", platformsNote: "Platform buttons share a link, not an image file. For Instagram or TikTok, share the image through your device or save it and upload it yourself.",
  link: "Public result link", preview: "Image preview", portrait: "Portrait · 1080 × 1920", landscape: "Landscape · 1200 × 630", open: "Open image", download: "Download PNG", downloaded: "PNG download requested.", saveHint: "On a phone, long-press the image to save or share it.",
  title: "My 12Axes political profile", match: "Top ideology match", matchScore: "profile match", axes: "My 12-axis result", invite: "Explore your own views", scan: "Scan to view this result", disclaimer: "Educational comparison · Not a scientific assessment", text: "My closest ideology on 12Axes: {name} ({score}% profile match). What is yours?", previewAlt: "12Axes result: {name}, with twelve axis scores and a QR code to the public result.",
};
type ShareCopy = typeof en;
export const shareCopy: Record<Locale, ShareCopy> = {
  en,
  pt: {
    share: "Compartilhar resultado", intro: "Compartilhe seu resultado gratuito sem expor seu relatório pago privado.",
    consent: "Concordo em publicar minhas pontuações nos 12 eixos e minha correspondência política em um link público. Qualquer pessoa com o link poderá vê-las; as plataformas sociais podem armazenar uma prévia.",
    published: "Seu link é público e continua acessível após fechar este painel. Para solicitar sua remoção:", removeLink: "Entre em contato para remover o resultado público",
    prepare: "Criar link e imagens", preparing: "Preparando suas imagens…", retry: "Tentar preparar imagens novamente", ready: "Seu link e suas imagens estão prontos.",
    error: "Não foi possível criar o link. Tente novamente.", imageError: "Seu link funciona, mas a prévia da imagem ainda não está pronta. Você pode copiar o link ou tentar preparar as imagens novamente.",
    image: "Compartilhar imagem", copy: "Copiar texto + link", copied: "Texto e link copiados.", copyFailed: "Copie manualmente o link abaixo.",
    nativeLink: "Compartilhar link pelo sistema", nativeDone: "O compartilhamento pelo sistema terminou. O aplicativo de destino controla a publicação.", canceled: "Compartilhamento cancelado.", shareFailed: "Falha ao compartilhar. Use as opções de copiar, abrir imagem ou baixar abaixo.",
    noNative: "O compartilhamento pelo sistema não está disponível. Use um botão de plataforma ou copie o link.", noFile: "Este navegador não compartilha arquivos de imagem. Veja, salve ou baixe a imagem abaixo.",
    platforms: "Abrir a tela de compartilhamento da plataforma", platformsNote: "Os botões de plataforma compartilham um link, não um arquivo de imagem. Para Instagram ou TikTok, compartilhe a imagem pelo dispositivo ou salve e envie manualmente.",
    link: "Link público do resultado", preview: "Prévia da imagem", portrait: "Vertical · 1080 × 1920", landscape: "Horizontal · 1200 × 630", open: "Abrir imagem", download: "Baixar PNG", downloaded: "Download do PNG solicitado.", saveHint: "No celular, mantenha a imagem pressionada para salvar ou compartilhar.",
    title: "Meu perfil político no 12Axes", match: "Ideologia mais próxima", matchScore: "correspondência de perfil", axes: "Meu resultado nos 12 eixos", invite: "Explore suas próprias ideias", scan: "Escaneie para ver este resultado", disclaimer: "Comparação educativa · Não é avaliação científica", text: "Minha ideologia mais próxima no 12Axes: {name} ({score}% de correspondência). E a sua?", previewAlt: "Resultado 12Axes: {name}, com pontuações nos doze eixos e QR code para o resultado público.",
  },
  es: {
    share: "Compartir resultado", intro: "Comparte tu resultado gratuito sin exponer tu informe privado de pago.",
    consent: "Acepto publicar mis puntuaciones en los 12 ejes y mi coincidencia política mediante un enlace público. Cualquiera con el enlace podrá verlas; las plataformas sociales pueden guardar una vista previa.",
    published: "Tu enlace es público y seguirá accesible después de cerrar este panel. Para solicitar su eliminación:", removeLink: "Contáctanos para eliminar el resultado público",
    prepare: "Crear enlace e imágenes", preparing: "Preparando tus imágenes…", retry: "Volver a preparar imágenes", ready: "Tu enlace y tus imágenes están listos.",
    error: "No se pudo crear el enlace. Inténtalo de nuevo.", imageError: "Tu enlace funciona, pero la vista previa de imagen aún no está lista. Puedes copiar el enlace o volver a preparar las imágenes.",
    image: "Compartir imagen", copy: "Copiar texto + enlace", copied: "Texto y enlace copiados.", copyFailed: "Copia manualmente el enlace de abajo.",
    nativeLink: "Compartir enlace con el sistema", nativeDone: "El proceso de compartir del sistema ha terminado. La aplicación de destino controla la publicación.", canceled: "Se canceló el uso compartido.", shareFailed: "No se pudo compartir. Usa las opciones de copiar, abrir imagen o descargar.",
    noNative: "El sistema no permite compartir aquí. Usa un botón de plataforma o copia el enlace.", noFile: "Este navegador no permite compartir archivos de imagen. Previsualiza, guarda o descarga la imagen de abajo.",
    platforms: "Abrir la pantalla para compartir de una plataforma", platformsNote: "Los botones de plataforma comparten un enlace, no un archivo de imagen. Para Instagram o TikTok, comparte la imagen desde tu dispositivo o guárdala y súbela manualmente.",
    link: "Enlace público al resultado", preview: "Vista previa de imagen", portrait: "Vertical · 1080 × 1920", landscape: "Horizontal · 1200 × 630", open: "Abrir imagen", download: "Descargar PNG", downloaded: "Se ha solicitado la descarga del PNG.", saveHint: "En el móvil, mantén pulsada la imagen para guardarla o compartirla.",
    title: "Mi perfil político en 12Axes", match: "Ideología más cercana", matchScore: "coincidencia de perfil", axes: "Mi resultado en los 12 ejes", invite: "Explora tus propias ideas", scan: "Escanea para ver este resultado", disclaimer: "Comparación educativa · No es una evaluación científica", text: "Mi ideología más cercana en 12Axes: {name} ({score}% de coincidencia). ¿Y la tuya?", previewAlt: "Resultado 12Axes: {name}, con puntuaciones en doce ejes y un QR al resultado público.",
  },
  ru: {
    share: "Поделиться результатом", intro: "Поделитесь бесплатным результатом, сохранив платный отчёт приватным.",
    consent: "Я согласен опубликовать оценки по 12 осям и политическое совпадение по общедоступной ссылке. Их увидит любой обладатель ссылки; соцсети могут сохранить превью.",
    published: "Ссылка общедоступна и останется доступной после закрытия панели. Чтобы запросить удаление:", removeLink: "Свяжитесь с нами для удаления публичного результата",
    prepare: "Создать ссылку и изображения", preparing: "Подготовка изображений…", retry: "Повторить подготовку изображений", ready: "Ссылка и изображения готовы.",
    error: "Не удалось создать ссылку. Попробуйте ещё раз.", imageError: "Ссылка работает, но превью изображения ещё не готово. Можно скопировать ссылку или повторить подготовку изображений.",
    image: "Поделиться изображением", copy: "Скопировать текст и ссылку", copied: "Текст и ссылка скопированы.", copyFailed: "Скопируйте ссылку ниже вручную.",
    nativeLink: "Поделиться ссылкой через систему", nativeDone: "Системный процесс завершён. Публикацией управляет приложение-получатель.", canceled: "Отправка отменена.", shareFailed: "Не удалось поделиться. Скопируйте ссылку, откройте или скачайте изображение ниже.",
    noNative: "Системная отправка недоступна. Выберите соцсеть или скопируйте ссылку.", noFile: "Браузер не поддерживает отправку изображений. Просмотрите, сохраните или скачайте изображение ниже.",
    platforms: "Открыть окно публикации в соцсети", platformsNote: "Кнопки соцсетей передают ссылку, а не файл изображения. Для Instagram или TikTok отправьте изображение через систему или сохраните и загрузите его вручную.",
    link: "Общедоступная ссылка на результат", preview: "Предпросмотр изображения", portrait: "Вертикально · 1080 × 1920", landscape: "Горизонтально · 1200 × 630", open: "Открыть изображение", download: "Скачать PNG", downloaded: "Загрузка PNG запрошена.", saveHint: "На телефоне удерживайте изображение, чтобы сохранить его или поделиться.",
    title: "Мой политический профиль 12Axes", match: "Ближайшая идеология", matchScore: "совпадение профиля", axes: "Мой результат по 12 осям", invite: "Исследуйте собственные взгляды", scan: "Сканируйте, чтобы открыть результат", disclaimer: "Учебное сравнение · Не научная оценка", text: "Моя ближайшая идеология в 12Axes: {name} (совпадение {score}%). А ваша?", previewAlt: "Результат 12Axes: {name}, оценки по двенадцати осям и QR-код общедоступного результата.",
  },
  zh: {
    share: "分享结果", intro: "分享免费测试结果，不会公开你的私人付费报告。",
    consent: "我同意将 12 轴分数和政治倾向匹配发布为公开链接。任何获得链接的人都可以查看，社交平台也可能保存预览。",
    published: "链接已公开，关闭面板后仍可访问。如需删除公开结果：", removeLink: "联系我们申请删除公开结果",
    prepare: "生成分享链接和图片", preparing: "正在准备分享图片…", retry: "重新准备图片", ready: "分享链接和图片已准备好。",
    error: "暂时无法生成分享链接，请重试。", imageError: "链接可以访问，但图片预览尚未准备好。你可以先复制链接，或重新准备图片。",
    image: "分享图片", copy: "复制文案和链接", copied: "已复制文案和链接。", copyFailed: "请手动复制下方链接。",
    nativeLink: "系统分享链接", nativeDone: "系统分享流程已结束，是否发布由接收应用决定。", canceled: "已取消分享。", shareFailed: "分享失败，请使用下方的复制链接、打开图片或下载选项。",
    noNative: "此浏览器不支持系统分享，请选择社交平台或复制链接。", noFile: "此浏览器不支持分享图片文件，你可以预览、保存或下载下方图片。",
    platforms: "打开社交平台分享界面", platformsNote: "平台按钮分享的是链接，不会自动附带图片文件。分享到 Instagram、TikTok、微信、小红书等平台时，可通过系统分享图片，或保存图片后自行上传。",
    link: "公开结果链接", preview: "图片预览", portrait: "竖版 · 1080 × 1920", landscape: "横版 · 1200 × 630", open: "打开图片", download: "下载 PNG 图片", downloaded: "已请求下载 PNG 图片。", saveHint: "手机上可长按图片保存或分享。",
    title: "我的 12Axes 政治倾向画像", match: "最接近的意识形态", matchScore: "画像匹配度", axes: "我的 12 轴结果", invite: "也来探索你的观点", scan: "扫码查看这份结果", disclaimer: "用于教育比较，不是科学测评", text: "我在 12Axes 最接近的意识形态是：{name}（画像匹配度 {score}%）。你的结果是什么？", previewAlt: "12Axes 结果：{name}，包含十二轴分数和公开结果链接的二维码。",
  },
};

export function resultShareText(locale: Locale, name: string, score: number) {
  return shareCopy[locale].text.replace("{name}", name).replace("{score}", String(score));
}

export function platformShareUrls(url: string, text: string) {
  const encodedUrl = encodeURIComponent(url), encodedText = encodeURIComponent(text);
  return {
    X: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    WhatsApp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    Telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    Reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
  };
}
