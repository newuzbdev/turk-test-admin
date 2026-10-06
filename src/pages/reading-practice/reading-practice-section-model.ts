import type {
  CreateReadingPractice,
  ReadingPracticeGlossaryEntry,
  ReadingPracticePassage,
  ReadingPracticeQuestion,
  ReadingPracticeQuestionGroup,
} from "@/utils/types/types";

const glossaryEntryKey = (entry: ReadingPracticeGlossaryEntry) =>
  `${String(entry.paragraphLabel || "")
    .trim()
    .toLocaleLowerCase("tr")}:${String(entry.term || "")
    .trim()
    .toLocaleLowerCase("tr")}:${entry.occurrenceIndex ?? 1}`;

export const mergeGeneratedGlossaryEntries = (
  existingEntries: ReadingPracticeGlossaryEntry[],
  generatedEntries: ReadingPracticeGlossaryEntry[],
) => {
  const merged = existingEntries.map((entry) => ({ ...entry }));
  const indexByKey = new Map(
    merged.map((entry, index) => [glossaryEntryKey(entry), index]),
  );

  generatedEntries.forEach((entry) => {
    if (!entry.term?.trim() || !entry.definition?.trim()) return;
    const key = glossaryEntryKey(entry);
    const existingIndex = indexByKey.get(key);
    if (existingIndex === undefined) {
      indexByKey.set(key, merged.length);
      merged.push({ ...entry, order: merged.length + 1 });
      return;
    }

    const existing = merged[existingIndex];
    if (existing.occurrenceIndex == null && entry.occurrenceIndex === 1) {
      merged[existingIndex] = { ...entry, order: existing.order };
    }
  });

  return merged.map((entry, index) => ({ ...entry, order: index + 1 }));
};

export type ReadingSectionNumber = 1 | 2 | 3 | 4 | 5;
export type ReadingPracticeGroupType =
  | "FILL_BLANK"
  | "MATCHING_HEADINGS"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE_NOT_GIVEN"
  | "PARAGRAPH_REFERENCE";

export const glossaryOptionParagraphLabel = (
  groupType: string,
  groupOrder: number,
  questionOrder: number,
  optionValue: string,
) =>
  groupType === "MATCHING_HEADINGS"
    ? `__option__:${groupOrder}:${optionValue}`
    : `__option__:${groupOrder}:${questionOrder}:${optionValue}`;

export const glossaryQuestionPromptLabel = (
  groupOrder: number,
  questionOrder: number,
) => `__question__:${groupOrder}:${questionOrder}`;

export const buildGlossarySupplementaryParagraphs = (
  groups: ReadingPracticeQuestionGroup[],
) => {
  const paragraphs = new Map<string, { label: string; text: string }>();

  groups
    .filter((group) => group.type !== "FILL_BLANK")
    .forEach((group) => {
      group.questions.forEach((question, questionIndex) => {
        if (group.type === "PARAGRAPH_REFERENCE") {
          const text = String(question.prompt || "").trim();
          if (!text) return;
          const label = glossaryQuestionPromptLabel(
            group.order,
            question.order,
          );
          paragraphs.set(label, { label, text });
          return;
        }

        if (group.type === "MATCHING_HEADINGS" && questionIndex > 0) return;
        (Array.isArray(question.options) ? question.options : []).forEach(
          (option, optionIndex) => {
            const optionRecord =
              option && typeof option === "object"
                ? (option as Record<string, unknown>)
                : null;
            const value = String(
              optionRecord?.value ?? String.fromCharCode(65 + optionIndex),
            ).trim();
            const text = String(
              optionRecord?.label ?? optionRecord?.text ?? option ?? "",
            ).trim();
            if (!value || !text) return;
            const label = glossaryOptionParagraphLabel(
              group.type,
              group.order,
              question.order,
              value,
            );
            paragraphs.set(label, { label, text });
          },
        );
      });
    });

  return Array.from(paragraphs.values());
};

type SectionGroupConfig = {
  type: ReadingPracticeGroupType;
  title: string;
  instructions: string;
  numbers: number[];
};

export type ReadingSectionConfig = {
  number: ReadingSectionNumber;
  title: string;
  summary: string;
  guidance: string;
  textTitle: string;
  paragraphLabels: string[];
  optionLetters?: string[];
  groups: SectionGroupConfig[];
};

const letters = (count: number) =>
  Array.from({ length: count }, (_, index) => String.fromCharCode(65 + index));

export const READING_SECTION_CONFIG: Record<
  ReadingSectionNumber,
  ReadingSectionConfig
> = {
  1: {
    number: 1,
    title: "Okuma Bölüm 1",
    summary: "Tek metin, 6 boşluk ve A-H kelime havuzu",
    guidance:
      "Bu bölümde metindeki altı boşluğu, verilen sekiz kelime veya söz grubundan uygun olanlarla doldurmanız gerekiyor. Her seçenek yalnız bir kez kullanılabilir; iki seçenek kullanılmayacaktır. Metni önce baştan sona okuyun. Sonra her boşluğun önündeki ve arkasındaki sözleri birlikte değerlendirin; cümlenin olumlu mu olumsuz mu olduğuna, eklere ve doğal kullanılan söz kalıplarına bakın.",
    textTitle: "Boşluklu metin",
    paragraphLabels: ["Metin"],
    optionLetters: letters(8),
    groups: [
      {
        type: "FILL_BLANK",
        title: "Sorular 1-6 · Boşluk doldurma",
        instructions:
          "Metinde [1]–[6] yerlerini kullanın ve doğru kelimeleri seçin.",
        numbers: [1, 2, 3, 4, 5, 6],
      },
    ],
  },
  2: {
    number: 2,
    title: "Okuma Bölüm 2",
    summary: "8 ilan ve A-J durum seçenekleri",
    guidance:
      "Bu bölümde sekiz ilanı, verilen on durum veya ihtiyaç seçeneğiyle eşleştirmeniz gerekiyor. Her seçenek yalnız bir kez kullanılabilir; iki seçenek kullanılmayacaktır. Önce her seçenekte kişinin ne aradığını belirleyin. Sonra ilanlardaki tarih, saat, yer, koşul ve hizmet gibi ayrıntıları karşılaştırarak bütün şartları karşılayan ilanı bulun.",
    textTitle: "Sorular 7-14 · İlanlar",
    paragraphLabels: ["S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14"],
    optionLetters: letters(10),
    groups: [
      {
        type: "MATCHING_HEADINGS",
        title: "A-J · Durum ve ihtiyaç seçenekleri",
        instructions:
          "Her ilan için doğru seçeneği işaretleyin. İki seçenek kullanılmayacaktır.",
        numbers: [7, 8, 9, 10, 11, 12, 13, 14],
      },
    ],
  },
  3: {
    number: 3,
    title: "Okuma Bölüm 3",
    summary: "6 paragraf ve A-H başlık seçenekleri",
    guidance:
      "Bu bölümde altı paragrafın her biri için verilen sekiz başlıktan en uygun olanı seçmeniz gerekiyor. Her başlık yalnız bir kez kullanılabilir; iki başlık kullanılmayacaktır. Paragraftaki tek bir kelimeye takılmadan ana fikre odaklanın. Özellikle ilk ve son cümleler size yol gösterebilir.",
    textTitle: "Sorular 15-20 · I-VI paragrafları",
    paragraphLabels: ["I", "II", "III", "IV", "V", "VI"],
    optionLetters: letters(8),
    groups: [
      {
        type: "MATCHING_HEADINGS",
        title: "A-H · Başlık seçenekleri",
        instructions:
          "Her paragraf için doğru başlığı işaretleyin. İki başlık kullanılmayacaktır.",
        numbers: [15, 16, 17, 18, 19, 20],
      },
    ],
  },
  4: {
    number: 4,
    title: "Okuma Bölüm 4",
    summary: "Tek metin, 4 çoktan seçmeli ve 5 doğru/yanlış/verilmemiş sorusu",
    guidance:
      "Bu bölümde aynı metne bağlı iki tür soruyu cevaplamanız gerekiyor: 21–24. sorularda doğru seçeneği, 25–29. sorularda ise Doğru, Yanlış veya Verilmemiş cevabını bulacaksınız. Metni önce genel anlamıyla okuyun, sonra her soru için ilgili bölüme dönüp cevabınızı metindeki bilgiyle karşılaştırın. İfade metinle aynı anlamdaysa Doğru, metne tersse Yanlış, metinde bu konuda yeterli bilgi yoksa Verilmemiş seçin. Cevap verirken yalnızca metindeki bilgiyi kullanın.",
    textTitle: "Ana metin",
    paragraphLabels: ["Metin"],
    groups: [
      {
        type: "MULTIPLE_CHOICE",
        title: "Sorular 21-24 · Çoktan seçmeli",
        instructions: "Her soru için dört seçenek yazın ve doğru cevabı seçin.",
        numbers: [21, 22, 23, 24],
      },
      {
        type: "TRUE_FALSE_NOT_GIVEN",
        title: "Sorular 25-29 · Doğru / Yanlış / Verilmemiş",
        instructions: "Her ifadeyi yazın ve doğru sonucu seçin.",
        numbers: [25, 26, 27, 28, 29],
      },
    ],
  },
  5: {
    number: 5,
    title: "Okuma Bölüm 5",
    summary: "A-E metinleri, 3 çoktan seçmeli ve 3 paragraf bulma sorusu",
    guidance:
      "Bu bölümde A–E olarak verilen beş paragrafı okuyacaksınız. 30–32. sorularda doğru seçeneği, 33–35. sorularda ise sorudaki bilginin bulunduğu paragrafı seçmeniz gerekiyor. Önce her paragrafın ana fikrini kısaca belirleyin; sonra sorudaki düşüncenin metinde aynı veya farklı sözlerle anlatıldığı yeri bulun. 33–35. sorularda beş paragraftan yalnızca üçü cevap olarak kullanılacak; kalan iki paragraf seçilmeyecektir.",
    textTitle: "A-E · Metin paragrafları",
    paragraphLabels: ["A", "B", "C", "D", "E"],
    groups: [
      {
        type: "MULTIPLE_CHOICE",
        title: "Sorular 30-32 · Çoktan seçmeli",
        instructions: "Her soru için dört seçenek yazın ve doğru cevabı seçin.",
        numbers: [30, 31, 32],
      },
      {
        type: "PARAGRAPH_REFERENCE",
        title: "Sorular 33-35 · Hangi paragrafta?",
        instructions:
          "Her ifade için doğru A-E paragrafını seçin. İki paragraf kullanılmayacaktır.",
        numbers: [33, 34, 35],
      },
    ],
  },
};

const emptyOptions = (count: number) => Array.from({ length: count }, () => "");

const createQuestion = (
  section: ReadingSectionConfig,
  group: SectionGroupConfig,
  number: number,
  index: number,
): ReadingPracticeQuestion => {
  const paragraphLabel =
    section.paragraphLabels[index] || section.paragraphLabels[0] || "";
  if (group.type === "FILL_BLANK") {
    return {
      order: number,
      prompt: `${number}. boşluk`,
      answerKey: "",
      options: emptyOptions(section.optionLetters?.length || 8),
      acceptedAnswers: [],
      explanation: "",
      evidenceParagraphs: [paragraphLabel],
      meta: { blankNumber: number, inlineTarget: "" },
    };
  }

  if (group.type === "MATCHING_HEADINGS") {
    return {
      order: number,
      prompt: paragraphLabel,
      answerKey: "",
      options: (section.optionLetters || []).map((value) => ({
        value,
        label: "",
      })),
      explanation: "",
      evidenceParagraphs: [paragraphLabel],
      meta: { sectionParagraphLabel: paragraphLabel },
    };
  }

  if (group.type === "TRUE_FALSE_NOT_GIVEN") {
    return {
      order: number,
      prompt: "",
      answerKey: "Doğru",
      options: ["Doğru", "Yanlış", "Verilmemiş"],
      explanation: "",
      evidenceParagraphs: [paragraphLabel],
      meta: {},
    };
  }

  if (group.type === "PARAGRAPH_REFERENCE") {
    return {
      order: number,
      prompt: "",
      answerKey: "",
      options: section.paragraphLabels,
      explanation: "",
      evidenceParagraphs: [],
      meta: {},
    };
  }

  return {
    order: number,
    prompt: "",
    answerKey: "A",
    options: emptyOptions(4),
    explanation: "",
    evidenceParagraphs: [paragraphLabel],
    meta: {},
  };
};

const createGroups = (
  section: ReadingSectionConfig,
): ReadingPracticeQuestionGroup[] =>
  section.groups.map((group, groupIndex) => ({
    order: groupIndex + 1,
    title: group.title,
    type: group.type,
    instructions: group.instructions,
    questions: group.numbers.map((number, index) =>
      createQuestion(section, group, number, index),
    ),
  }));

export const createSectionPracticeDraft = (
  sectionNumber: ReadingSectionNumber = 1,
): CreateReadingPractice => {
  const section = READING_SECTION_CONFIG[sectionNumber];
  return {
    title: "",
    passageTitle: "",
    description: section.guidance,
    coverImageUrl: "",
    topic: "",
    level: "B2",
    coinCost: 0,
    estimatedMinutes: 20,
    practiceType: "SECTION",
    sectionNumber,
    isPublished: false,
    isFreeAccess: false,
    paragraphs: section.paragraphLabels.map((label, index) => ({
      label,
      title: "",
      text: "",
      imageUrl: "",
      imagePositionX: index === 0 ? 50 : undefined,
      imagePositionY: index === 0 ? 50 : undefined,
    })),
    glossaryEntries: [],
    questionGroups: createGroups(section),
  };
};

const normalizeOptionBank = (value: unknown, optionLetters: string[]) => {
  const items = Array.isArray(value) ? value : [];
  return optionLetters.map((letter, index) => {
    const source = items[index];
    if (source && typeof source === "object") {
      const item = source as Record<string, unknown>;
      return { value: letter, label: String(item.label ?? item.text ?? "") };
    }
    return { value: letter, label: typeof source === "string" ? source : "" };
  });
};

const blankToken = (number: number) => `[${number}]`;
const escapePattern = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeImagePosition = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 50;
};

const restoreBlankTokens = (
  text: string,
  questions: ReadingPracticeQuestion[],
) => {
  let output = text;
  questions.forEach((question) => {
    const meta =
      question.meta && typeof question.meta === "object"
        ? (question.meta as Record<string, unknown>)
        : {};
    const target = String(meta.inlineTarget || question.answerKey || "").trim();
    if (!target || output.includes(blankToken(question.order))) return;
    output = output.replace(
      new RegExp(escapePattern(target), "i"),
      blankToken(question.order),
    );
  });
  return output;
};

export const hydrateSectionPracticeDraft = (
  source: ReadingPracticePassage,
): CreateReadingPractice => {
  const sectionNumber = (
    [1, 2, 3, 4, 5].includes(Number(source.sectionNumber))
      ? Number(source.sectionNumber)
      : 1
  ) as ReadingSectionNumber;
  const section = READING_SECTION_CONFIG[sectionNumber];
  const fresh = createSectionPracticeDraft(sectionNumber);
  const paragraphByLabel = new Map(
    (source.paragraphs || []).map((item) => [item.label, item]),
  );
  const textImage = source.paragraphs?.find((item) => item.imageUrl);
  const textImageUrl = textImage?.imageUrl || "";
  const textImagePositionX = normalizeImagePosition(
    textImage?.imagePositionX,
  );
  const textImagePositionY = normalizeImagePosition(
    textImage?.imagePositionY,
  );
  const groupByType = new Map(
    (source.questionGroups || []).map((item) => [item.type, item]),
  );

  const questionGroups = fresh.questionGroups.map((freshGroup) => {
    const existing = groupByType.get(freshGroup.type);
    if (!existing) return freshGroup;
    const questionByOrder = new Map(
      existing.questions.map((item) => [item.order, item]),
    );
    const optionBank = normalizeOptionBank(
      existing.questions[0]?.options,
      section.optionLetters || [],
    );
    return {
      ...freshGroup,
      questions: freshGroup.questions.map((question, index) => {
        const saved =
          questionByOrder.get(question.order) || existing.questions[index];
        if (!saved) return question;
        return {
          ...question,
          ...saved,
          order: question.order,
          prompt:
            freshGroup.type === "MATCHING_HEADINGS"
              ? question.prompt
              : (saved.prompt ?? question.prompt),
          evidenceParagraphs:
            freshGroup.type === "MATCHING_HEADINGS"
              ? question.evidenceParagraphs
              : (saved.evidenceParagraphs ?? question.evidenceParagraphs),
          options:
            freshGroup.type === "MATCHING_HEADINGS"
              ? optionBank
              : freshGroup.type === "PARAGRAPH_REFERENCE"
                ? [...section.paragraphLabels]
                : (saved.options ?? question.options),
        };
      }),
    };
  });

  const paragraphs = section.paragraphLabels.map((label, index) => {
    const saved = paragraphByLabel.get(label) || source.paragraphs?.[index];
    return {
      label,
      title: saved?.title || "",
      text: saved?.text || "",
      imageUrl: index === 0 ? textImageUrl : "",
      imagePositionX: index === 0 ? textImagePositionX : undefined,
      imagePositionY: index === 0 ? textImagePositionY : undefined,
    };
  });
  if (sectionNumber === 1) {
    const questions = questionGroups[0]?.questions || [];
    paragraphs[0].text = restoreBlankTokens(paragraphs[0].text, questions);
  }

  return {
    ...fresh,
    ...source,
    practiceType: "SECTION",
    sectionNumber,
    paragraphs,
    glossaryEntries: (source.glossaryEntries || []).map((entry, index) => ({
      ...entry,
      order: index + 1,
    })),
    questionGroups,
  };
};

export const switchSectionPracticeDraft = (
  current: CreateReadingPractice,
  sectionNumber: ReadingSectionNumber,
) => {
  const next = createSectionPracticeDraft(sectionNumber);
  return {
    ...next,
    title: current.title,
    passageTitle: current.passageTitle,
    topic: current.topic,
    level: current.level,
    coverImageUrl: current.coverImageUrl,
    coinCost: current.coinCost,
    estimatedMinutes: current.estimatedMinutes,
    isPublished: current.isPublished,
    isFreeAccess: current.isFreeAccess,
  };
};

const textOptions = (value: unknown) =>
  (Array.isArray(value) ? value : []).map((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const option = item as Record<string, unknown>;
      return String(option.label ?? option.text ?? "").trim();
    }
    return String(item ?? "").trim();
  });

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const methodTextOf = (question: ReadingPracticeQuestion) =>
  String(
    recordOf(question.meta).transferTip ||
      recordOf(question.meta).strategy ||
      "",
  ).trim();

const addDuplicateAnswerErrors = (
  questions: ReadingPracticeQuestion[],
  errors: string[],
) => {
  const occurrences = new Map<
    string,
    { answer: string; questionOrders: number[] }
  >();

  questions.forEach((question) => {
    const answer = String(question.answerKey || "").trim();
    if (!answer) return;
    const key = answer.toLocaleLowerCase("tr");
    const occurrence = occurrences.get(key) || {
      answer,
      questionOrders: [],
    };
    occurrence.questionOrders.push(question.order);
    occurrences.set(key, occurrence);
  });

  occurrences.forEach(({ answer, questionOrders }) => {
    if (questionOrders.length < 2) return;
    errors.push(
      `"${answer}" cevabı yalnız bir kez kullanılabilir (${questionOrders
        .map((order) => `S${order}`)
        .join(", ")}).`,
    );
  });
};

export const validateSectionPracticeDraft = (draft: CreateReadingPractice) => {
  const errors: string[] = [];
  const section =
    READING_SECTION_CONFIG[draft.sectionNumber as ReadingSectionNumber];
  if (!draft.title.trim()) errors.push("Test başlığını yazın.");
  if (!section) errors.push("Okuma bölümünü seçin.");
  if (!String(draft.description || "").trim()) {
    errors.push("Bölüm çalışma anlatımını yazın.");
  }
  draft.paragraphs.forEach((paragraph) => {
    if (!paragraph.text.trim())
      errors.push(`${paragraph.label} metnini yazın.`);
  });

  draft.questionGroups.forEach((group) => {
    if (group.type === "FILL_BLANK") {
      const pool = textOptions(group.questions[0]?.options);
      if (pool.some((item) => !item))
        errors.push("A-H kelime havuzunun tamamını doldurun.");
      group.questions.forEach((question) => {
        if (!String(question.answerKey || "").trim())
          errors.push(`S${question.order} doğru cevabını seçin.`);
        const methodText = methodTextOf(question);
        if (!methodText) {
          errors.push(`S${question.order} yöntemini yazın.`);
        }
        if (!String(question.explanation || "").trim()) {
          errors.push(`S${question.order} doğru cevabının açıklamasını yazın.`);
        }
        const distractorExplanations = recordOf(
          recordOf(question.meta).distractorExplanations,
        );
        const missingDistractorExplanations = pool.filter(
          (option) =>
            option !== String(question.answerKey || "").trim() &&
            !String(distractorExplanations[option] || "").trim(),
        );
        if (missingDistractorExplanations.length) {
          errors.push(
            `S${question.order} için her yanlış seçeneğe özel geri bildirim yazın.`,
          );
        }
        if (!draft.paragraphs[0]?.text.includes(blankToken(question.order))) {
          errors.push(`Metinde ${blankToken(question.order)} yerini ekleyin.`);
        }
      });
      if (draft.sectionNumber === 1) {
        addDuplicateAnswerErrors(group.questions, errors);
      }
      return;
    }

    if (group.type === "MATCHING_HEADINGS") {
      const bank = normalizeOptionBank(
        group.questions[0]?.options,
        section?.optionLetters || [],
      );
      if (bank.some((item) => !item.label.trim()))
        errors.push("Bütün seçenek metinlerini doldurun.");
      group.questions.forEach((question) => {
        if (!String(question.answerKey || "").trim())
          errors.push(`S${question.order} doğru eşleşmesini seçin.`);
        if (draft.sectionNumber === 2 || draft.sectionNumber === 3) {
          if (!methodTextOf(question)) {
            errors.push(`S${question.order} yöntemini yazın.`);
          }
          if (!String(question.explanation || "").trim()) {
            errors.push(
              `S${question.order} doğru cevabının açıklamasını yazın.`,
            );
          }
          const distractorExplanations = recordOf(
            recordOf(question.meta).distractorExplanations,
          );
          const missingDistractorExplanations = bank.filter(
            (option) =>
              option.value !== String(question.answerKey || "").trim() &&
              !String(distractorExplanations[option.value] || "").trim(),
          );
          if (missingDistractorExplanations.length) {
            errors.push(
              `S${question.order} için her yanlış seçeneğe özel geri bildirim yazın.`,
            );
          }
        }
      });
      if (draft.sectionNumber === 2 || draft.sectionNumber === 3) {
        addDuplicateAnswerErrors(group.questions, errors);
      }
      return;
    }

    group.questions.forEach((question) => {
      if (!question.prompt.trim())
        errors.push(`S${question.order} soru metnini yazın.`);
      if (!String(question.answerKey || "").trim())
        errors.push(`S${question.order} doğru cevabını seçin.`);
      if (
        group.type === "MULTIPLE_CHOICE" &&
        textOptions(question.options).some((item) => !item)
      ) {
        errors.push(`S${question.order} seçeneklerinin tamamını doldurun.`);
      }
      if (
        draft.sectionNumber === 5 &&
        group.type === "PARAGRAPH_REFERENCE"
      ) {
        const evidenceParagraphs = textOptions(
          question.evidenceParagraphs,
        ).filter(Boolean);
        const evidenceParagraph = evidenceParagraphs[0] || "";
        const answer = String(question.answerKey || "").trim();
        if (!evidenceParagraph) {
          errors.push(`S${question.order} ilgili paragrafı seçin.`);
        } else if (
          evidenceParagraphs.length !== 1 ||
          !section?.paragraphLabels.includes(evidenceParagraph)
        ) {
          errors.push(
            `S${question.order} ilgili paragrafı A-E arasından seçin.`,
          );
        } else if (answer && evidenceParagraph !== answer) {
          errors.push(
            `S${question.order} ilgili paragraf doğru cevapla aynı olmalıdır.`,
          );
        }
      }
      const requiresBilingualLearning =
        (draft.sectionNumber === 4 &&
          (group.type === "MULTIPLE_CHOICE" ||
            group.type === "TRUE_FALSE_NOT_GIVEN")) ||
        (draft.sectionNumber === 5 &&
          (group.type === "MULTIPLE_CHOICE" ||
            group.type === "PARAGRAPH_REFERENCE"));
      if (requiresBilingualLearning) {
        const meta = recordOf(question.meta);
        if (!methodTextOf(question)) {
          errors.push(`S${question.order} yöntemini yazın.`);
        }
        if (!String(question.explanation || "").trim()) {
          errors.push(`S${question.order} doğru cevabının açıklamasını yazın.`);
        }
        if (!String(meta.transferTipUz || "").trim()) {
          errors.push(`S${question.order} O‘zbekcha yöntemini yazın.`);
        }
        if (!String(meta.explanationUz || "").trim()) {
          errors.push(
            `S${question.order} O‘zbekcha doğru cevap açıklamasını yazın.`,
          );
        }
        const optionValues =
          group.type === "MULTIPLE_CHOICE"
            ? letters(textOptions(question.options).length)
            : textOptions(question.options);
        const wrongValues = optionValues.filter(
          (value) => value !== String(question.answerKey || "").trim(),
        );
        const distractorExplanations = recordOf(
          meta.distractorExplanations,
        );
        const distractorExplanationsUz = recordOf(
          meta.distractorExplanationsUz,
        );
        if (
          wrongValues.some(
            (value) =>
              !String(distractorExplanations[value] || "").trim(),
          )
        ) {
          errors.push(
            `S${question.order} için her yanlış seçeneğe özel geri bildirim yazın.`,
          );
        }
        if (
          wrongValues.some(
            (value) =>
              !String(distractorExplanationsUz[value] || "").trim(),
          )
        ) {
          errors.push(
            `S${question.order} için her yanlış seçeneğe özel O‘zbekcha geri bildirim yazın.`,
          );
        }
      }
    });
    if (
      draft.sectionNumber === 5 &&
      group.type === "PARAGRAPH_REFERENCE"
    ) {
      addDuplicateAnswerErrors(group.questions, errors);
    }
  });
  return Array.from(new Set(errors));
};

export const serializeSectionPracticeDraft = (
  source: CreateReadingPractice,
): CreateReadingPractice => {
  const draft = structuredClone(source);
  draft.practiceType = "SECTION";
  const textImage = draft.paragraphs.find((paragraph) => paragraph.imageUrl);
  const textImageUrl = textImage?.imageUrl || "";
  const textImagePositionX = normalizeImagePosition(
    textImage?.imagePositionX,
  );
  const textImagePositionY = normalizeImagePosition(
    textImage?.imagePositionY,
  );
  draft.paragraphs = draft.paragraphs.map((paragraph, index) => ({
    ...paragraph,
    imageUrl: index === 0 ? textImageUrl : "",
    imagePositionX: index === 0 ? textImagePositionX : undefined,
    imagePositionY: index === 0 ? textImagePositionY : undefined,
  }));
  draft.glossaryEntries = draft.glossaryEntries
    .map((entry) => ({
      entry,
      baseMeaning:
        entry.baseMeaning?.trim() ||
        entry.definition?.trim() ||
        entry.contextMeaning?.trim() ||
        "",
    }))
    .filter(({ entry, baseMeaning }) => entry.term.trim() && baseMeaning)
    .map(({ entry, baseMeaning }, index) => ({
      ...entry,
      definition: baseMeaning,
      simpleDefinition: baseMeaning,
      baseMeaning,
      contextMeaning: "",
      example: "",
      order: index + 1,
    }));

  if (draft.sectionNumber === 1) {
    const group = draft.questionGroups.find(
      (item) => item.type === "FILL_BLANK",
    );
    let text = draft.paragraphs[0]?.text || "";
    (group?.questions || []).forEach((question) => {
      const answer = String(question.answerKey || "").trim();
      text = text.replace(blankToken(question.order), answer);
      question.acceptedAnswers = [answer];
      question.evidenceParagraphs = ["Metin"];
      question.meta = {
        ...(question.meta && typeof question.meta === "object"
          ? question.meta
          : {}),
        blankNumber: question.order,
        inlineTarget: answer,
      };
    });
    if (draft.paragraphs[0]) draft.paragraphs[0].text = text;
  }

  return draft;
};
