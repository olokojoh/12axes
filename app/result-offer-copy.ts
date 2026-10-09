import type { Locale } from "./i18n";
import type { ReportPlan } from "./lib/report-access";

export const resultOfferCopy: Record<Locale, {
  purpose: Record<ReportPlan, string>;
  highlights: Record<ReportPlan, string[]>;
  compare: string;
  feature: string;
  sample: string;
  sampleNote: string;
  sampleAxis: string;
  sampleLeft: string;
  sampleRight: string;
  sampleComparison: string;
  sampleEvidence: string;
  share: string;
  extendTime: string;
}> = {
  en: {
    purpose: { basic: "Understand and save your result", plus: "Compare with profiles and friends", deep: "Trace your answers and explore changes" },
    highlights: {
      basic: ["12-axis readings and your top 10 ideologies", "Private report link with email recovery", "Print or save your report as PDF"],
      plus: ["Everything in Personal Report", "Compare 10 ideologies, 10 countries and 10 people by axis", "Compare with a friend and search all profiles"],
      deep: ["Everything in Report Plus", "Answer evidence and cross-axis interpretation", "Explore answer changes with a personal reading plan"],
    },
    compare: "Compare all included features", feature: "Feature", sample: "See a sample report",
    sampleNote: "Fictional examples to show the report’s features. These are not your results.",
    sampleAxis: "Distribution of power", sampleLeft: "Federalism", sampleRight: "Unitarism",
    sampleComparison: "Example: a result of 65% toward federalism compared with a reference profile at 55% gives a difference of 10 percentage points. Reference profiles are model values, not population averages.",
    sampleEvidence: "Separate example: three answer positions of 100, 50 and 50 average to 67 after rounding. Change one 50 to 0 and the average becomes 50. This demonstrates how the model responds; it is not a prediction and does not change a saved report.",
    share: "Share result", extendTime: "Answer 24 more · about 4 minutes",
  },
  pt: {
    purpose: { basic: "Entenda e salve seu resultado", plus: "Compare com perfis e amigos", deep: "Entenda suas respostas e explore mudanças" },
    highlights: {
      basic: ["Leitura dos 12 eixos e suas 10 ideologias mais próximas", "Link privado com recuperação por email", "Imprima ou salve o relatório em PDF"],
      plus: ["Tudo do Relatório pessoal", "Compare 10 ideologias, 10 países e 10 pessoas por eixo", "Compare com um amigo e busque qualquer perfil"],
      deep: ["Tudo do Relatório Plus", "Evidências das respostas e interpretação entre eixos", "Explore respostas alternativas e um plano pessoal de leitura"],
    },
    compare: "Comparar todos os recursos incluídos", feature: "Recurso", sample: "Ver exemplo de relatório",
    sampleNote: "Exemplos fictícios para mostrar os recursos do relatório. Estes não são seus resultados.",
    sampleAxis: "Distribuição do poder", sampleLeft: "Federalismo", sampleRight: "Unitarismo",
    sampleComparison: "Exemplo: um resultado de 65% em direção ao federalismo e um perfil de referência de 55% têm uma diferença de 10 pontos percentuais. Os perfis são valores do modelo, não médias populacionais.",
    sampleEvidence: "Outro exemplo: três posições de resposta de 100, 50 e 50 têm média arredondada de 67. Trocar um dos valores 50 por 0 reduz a média para 50. Isso demonstra a resposta do modelo; não é uma previsão nem altera o relatório salvo.",
    share: "Compartilhar resultado", extendTime: "Mais 24 perguntas · cerca de 4 minutos",
  },
  es: {
    purpose: { basic: "Entiende y guarda tu resultado", plus: "Compara con perfiles y amigos", deep: "Revisa tus respuestas y explora cambios" },
    highlights: {
      basic: ["Lectura de los 12 ejes y tus 10 ideologías más cercanas", "Enlace privado con recuperación por email", "Imprime o guarda el informe en PDF"],
      plus: ["Todo el Informe personal", "Compara 10 ideologías, 10 países y 10 personas por eje", "Compara con un amigo y busca cualquier perfil"],
      deep: ["Todo el Informe Plus", "Evidencias de respuestas e interpretación entre ejes", "Explora respuestas alternativas y un plan personal de lectura"],
    },
    compare: "Comparar todas las funciones incluidas", feature: "Función", sample: "Ver un informe de ejemplo",
    sampleNote: "Ejemplos ficticios para mostrar las funciones del informe. No son tus resultados.",
    sampleAxis: "Distribución del poder", sampleLeft: "Federalismo", sampleRight: "Unitarismo",
    sampleComparison: "Ejemplo: un resultado del 65% hacia el federalismo y un perfil de referencia del 55% tienen una diferencia de 10 puntos porcentuales. Los perfiles son valores del modelo, no medias poblacionales.",
    sampleEvidence: "Otro ejemplo: tres posiciones de respuesta de 100, 50 y 50 dan una media redondeada de 67. Cambiar uno de los valores 50 a 0 lleva la media a 50. Así responde el modelo; no es una predicción ni modifica el informe guardado.",
    share: "Compartir resultado", extendTime: "24 preguntas más · unos 4 minutos",
  },
  ru: {
    purpose: { basic: "Понять и сохранить результат", plus: "Сравнить с профилями и друзьями", deep: "Разобрать ответы и исследовать изменения" },
    highlights: {
      basic: ["Разбор 12 осей и 10 ближайших идеологий", "Личная ссылка с восстановлением по email", "Печать или сохранение отчёта в PDF"],
      plus: ["Всё из Личного отчёта", "Сравнение по осям с 10 идеологиями, 10 странами и 10 людьми", "Сравнение с другом и поиск любых профилей"],
      deep: ["Всё из отчёта Plus", "Обоснование ответами и совместный разбор осей", "Изменение ответов и личный план чтения"],
    },
    compare: "Сравнить все возможности", feature: "Возможность", sample: "Посмотреть пример отчёта",
    sampleNote: "Вымышленные примеры показывают возможности отчёта. Это не ваши результаты.",
    sampleAxis: "Распределение власти", sampleLeft: "Федерализм", sampleRight: "Унитаризм",
    sampleComparison: "Пример: результат 65% в сторону федерализма и эталонный профиль с 55% различаются на 10 процентных пунктов. Профили содержат значения модели, а не средние показатели населения.",
    sampleEvidence: "Другой пример: три позиции ответов — 100, 50 и 50 — дают округлённое среднее 67. Если заменить одно значение 50 на 0, среднее станет 50. Это демонстрация работы модели, а не прогноз; сохранённый отчёт не меняется.",
    share: "Поделиться результатом", extendTime: "Ещё 24 вопроса · около 4 минут",
  },
  zh: {
    purpose: { basic: "理解并保存自己的结果", plus: "对比参考画像与朋友", deep: "追溯答案依据，探索变化" },
    highlights: {
      basic: ["十二轴解读与前十意识形态匹配", "私人报告链接与邮件找回", "打印或保存报告为 PDF"],
      plus: ["包含个人报告全部权益", "与十种意识形态、十国及十位人物逐轴比较", "与朋友对比，并搜索任意参考画像"],
      deep: ["包含进阶报告 Plus 全部权益", "逐题答案依据与跨轴组合解读", "探索答案变化，获得个人阅读计划"],
    },
    compare: "展开全部权益比较", feature: "权益", sample: "查看报告样例",
    sampleNote: "以下为展示报告功能的虚构示例，并非你的测试结果。",
    sampleAxis: "权力分配", sampleLeft: "联邦制", sampleRight: "单一制",
    sampleComparison: "示例：某结果在联邦制一端为 65%，参考画像为 55%，相差 10 个百分点。参考画像是模型数值，不是人口实测平均值。",
    sampleEvidence: "另一示例：三个回答的位置为 100、50、50，平均值四舍五入为 67。将其中一个 50 改为 0 后，平均值变为 50。这是模型运算演示，不是预测，也不会修改已保存的报告。",
    share: "分享结果", extendTime: "再答 24 题 · 约 4 分钟",
  },
};
