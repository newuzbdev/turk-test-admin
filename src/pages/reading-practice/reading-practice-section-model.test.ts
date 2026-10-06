import { describe, expect, it } from "vitest";
import { readingPracticeSavePayload } from "@/config/queries/reading-practice/save-payload";
import type {
  CreateReadingPractice,
  ReadingPracticePassage,
  ReadingPracticeQuestion,
} from "@/utils/types/types";
import {
  buildGlossarySupplementaryParagraphs,
  createSectionPracticeDraft,
  glossaryQuestionPromptLabel,
  hydrateSectionPracticeDraft,
  mergeGeneratedGlossaryEntries,
  serializeSectionPracticeDraft,
  validateSectionPracticeDraft,
} from "./reading-practice-section-model";

const distractorFeedback = (pool: string[], answer: string) =>
  Object.fromEntries(
    pool
      .filter((option) => option !== answer)
      .map((option) => [
        option,
        `${option} bu boşluğun yapısına veya anlamına uymuyor.`,
      ]),
  );

const metadataOf = (question: ReadingPracticeQuestion) =>
  question.meta && typeof question.meta === "object"
    ? (question.meta as Record<string, unknown>)
    : {};

const asPassage = (
  draft: CreateReadingPractice,
  id = "section-practice",
): ReadingPracticePassage => ({ ...draft, id });

describe("reading practice section authoring model", () => {
  it("preserves promotional access when a section draft is saved and reopened", () => {
    const draft = createSectionPracticeDraft(1);
    expect(draft.isFreeAccess).toBe(false);
    draft.isFreeAccess = true;
    const saved = serializeSectionPracticeDraft(draft);
    expect(saved.isFreeAccess).toBe(true);
    expect(readingPracticeSavePayload(saved).isFreeAccess).toBe(true);
    expect(hydrateSectionPracticeDraft(asPassage(saved)).isFreeAccess).toBe(true);
  });

  it("includes Section 5 paragraph-reference prompts in glossary generation", () => {
    const draft = createSectionPracticeDraft(5);
    const referenceGroup = draft.questionGroups.find(
      (group) => group.type === "PARAGRAPH_REFERENCE",
    );
    expect(referenceGroup).toBeDefined();
    referenceGroup!.questions.forEach((question) => {
      question.prompt =
        question.order === referenceGroup!.questions[0].order
          ? "İş merkezlerindeki küçük işletmelerden söz edilmektedir."
          : `Soru ${question.order} için paragrafı bulun.`;
    });

    const paragraphs = buildGlossarySupplementaryParagraphs(
      draft.questionGroups,
    );
    const promptParagraphs = paragraphs.filter((paragraph) =>
      paragraph.label.startsWith("__question__:"),
    );

    expect(promptParagraphs).toHaveLength(3);
    expect(promptParagraphs[0]).toEqual({
      label: glossaryQuestionPromptLabel(
        referenceGroup!.order,
        referenceGroup!.questions[0].order,
      ),
      text: "İş merkezlerindeki küçük işletmelerden söz edilmektedir.",
    });
  });

  it("creates only the selected section fields", () => {
    const sectionTwo = createSectionPracticeDraft(2);
    expect(sectionTwo.practiceType).toBe("SECTION");
    expect(sectionTwo.paragraphs).toHaveLength(8);
    expect(sectionTwo.questionGroups).toHaveLength(1);
    expect(
      sectionTwo.questionGroups[0].questions.map((item) => item.order),
    ).toEqual([7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it("does not preselect answers for shared single-use option pools", () => {
    const sectionTwo = createSectionPracticeDraft(2);
    const sectionThree = createSectionPracticeDraft(3);
    const sectionFiveReferences = createSectionPracticeDraft(5).questionGroups.find(
      (group) => group.type === "PARAGRAPH_REFERENCE",
    );

    expect(
      sectionTwo.questionGroups[0].questions.map((question) => question.answerKey),
    ).toEqual(Array(8).fill(""));
    expect(
      sectionThree.questionGroups[0].questions.map(
        (question) => question.answerKey,
      ),
    ).toEqual(Array(6).fill(""));
    expect(
      sectionFiveReferences?.questions.map((question) => question.answerKey),
    ).toEqual(Array(3).fill(""));
    expect(
      sectionFiveReferences?.questions.map(
        (question) => question.evidenceParagraphs,
      ),
    ).toEqual([[], [], []]);
  });

  it("rejects repeated answers in every shared single-use option pool", () => {
    const cases = [
      {
        draft: createSectionPracticeDraft(1),
        groupIndex: 0,
        answer: "aynı",
        expected:
          '"aynı" cevabı yalnız bir kez kullanılabilir (S1, S2).',
      },
      {
        draft: createSectionPracticeDraft(2),
        groupIndex: 0,
        answer: "A",
        expected: '"A" cevabı yalnız bir kez kullanılabilir (S7, S8).',
      },
      {
        draft: createSectionPracticeDraft(3),
        groupIndex: 0,
        answer: "A",
        expected: '"A" cevabı yalnız bir kez kullanılabilir (S15, S16).',
      },
      {
        draft: createSectionPracticeDraft(5),
        groupIndex: 1,
        answer: "A",
        expected: '"A" cevabı yalnız bir kez kullanılabilir (S33, S34).',
      },
    ];

    cases.forEach(({ draft, groupIndex, answer, expected }) => {
      draft.questionGroups[groupIndex].questions[0].answerKey = answer;
      draft.questionGroups[groupIndex].questions[1].answerKey = answer;
      expect(validateSectionPracticeDraft(draft)).toContain(expected);
    });
  });

  it("requires Section 5 paragraph evidence to be valid and match the answer", () => {
    const draft = createSectionPracticeDraft(5);
    const question = draft.questionGroups[1].questions[0];
    question.answerKey = "B";

    question.evidenceParagraphs = [];
    expect(validateSectionPracticeDraft(draft)).toContain(
      "S33 ilgili paragrafı seçin.",
    );

    question.evidenceParagraphs = ["Z"];
    expect(validateSectionPracticeDraft(draft)).toContain(
      "S33 ilgili paragrafı A-E arasından seçin.",
    );

    question.evidenceParagraphs = ["A"];
    expect(validateSectionPracticeDraft(draft)).toContain(
      "S33 ilgili paragraf doğru cevapla aynı olmalıdır.",
    );

    question.evidenceParagraphs = ["B"];
    const errors = validateSectionPracticeDraft(draft);
    expect(errors).not.toContain("S33 ilgili paragrafı seçin.");
    expect(errors).not.toContain("S33 ilgili paragrafı A-E arasından seçin.");
    expect(errors).not.toContain(
      "S33 ilgili paragraf doğru cevapla aynı olmalıdır.",
    );
  });

  it("starts every section with its own reusable practice guidance", () => {
    const descriptions = ([1, 2, 3, 4, 5] as const).map(
      (sectionNumber) =>
        createSectionPracticeDraft(sectionNumber).description || "",
    );

    expect(new Set(descriptions).size).toBe(5);
    expect(descriptions[0]).toContain("altı boşluğu");
    expect(descriptions[1]).toContain("sekiz ilanı");
    expect(descriptions[2]).toContain("sekiz başlıktan");
    expect(descriptions[3]).toContain("Verilmemiş");
    expect(descriptions[4]).toContain("kalan iki paragraf seçilmeyecektir");
  });

  it("saves glossary entries with only the agreed base form and meaning", () => {
    const draft = createSectionPracticeDraft(1);
    draft.paragraphs[0].text = "Talep zamanla arttı.";
    draft.glossaryEntries = [
      {
        order: 1,
        term: "Talep",
        definition: "Eski açıklama.",
        simpleDefinition:
          "Eski açıklama. Metindeki kullanımı: Satın alma isteği.",
        baseForm: "talep",
        baseMeaning:
          "Bir kimseden bir şeyi isteme veya dileme durumudur. Ekonomi dilinde satın alma isteğini anlatır.",
        contextMeaning: "Bu cümlede satın alma isteğidir.",
        example: "Ürüne talep arttı.",
        paragraphLabel: "Metin",
        occurrenceIndex: 1,
      },
    ];

    const [entry] = serializeSectionPracticeDraft(draft).glossaryEntries;

    expect(entry).toMatchObject({
      baseForm: "talep",
      definition:
        "Bir kimseden bir şeyi isteme veya dileme durumudur. Ekonomi dilinde satın alma isteğini anlatır.",
      simpleDefinition:
        "Bir kimseden bir şeyi isteme veya dileme durumudur. Ekonomi dilinde satın alma isteğini anlatır.",
      baseMeaning:
        "Bir kimseden bir şeyi isteme veya dileme durumudur. Ekonomi dilinde satın alma isteğini anlatır.",
      contextMeaning: "",
      example: "",
    });
  });

  it("requires the saved section practice guidance", () => {
    const draft = createSectionPracticeDraft(1);
    draft.description = "   ";

    expect(validateSectionPracticeDraft(draft)).toContain(
      "Bölüm çalışma anlatımını yazın.",
    );
  });

  it("serializes section one placeholders without losing their location", () => {
    const draft = createSectionPracticeDraft(1);
    draft.title = "Bölüm 1";
    draft.paragraphs[0].text = "Bu [1] metinde [2] yer alır. [3] [4] [5] [6]";
    const group = draft.questionGroups[0];
    const pool = [
      "örnek",
      "iki",
      "üç",
      "dört",
      "beş",
      "altı",
      "fazla",
      "yedek",
    ];
    group.questions.forEach((question, index) => {
      question.options = pool;
      question.answerKey = pool[index];
      question.explanation =
        "Bu seçenek cümleyi anlam ve yapı bakımından doğru tamamlar.";
      question.meta = {
        transferTip:
          "Boşluğun iki yanını birlikte oku. Bu metindeki anlam akışı doğru kelimeyi gösteriyor.",
        transferTipUz: "Bo‘sh joyning ikki tomonini birga o‘qing.",
        explanationUz: "Bu variant gapning ma’nosini to‘g‘ri tugallaydi.",
        distractorExplanations: distractorFeedback(pool, pool[index]),
      };
    });

    const saved = serializeSectionPracticeDraft(draft);
    expect(saved.paragraphs[0].text).toContain(
      "Bu örnek metinde iki yer alır.",
    );
    const hydrated = hydrateSectionPracticeDraft(saved);
    expect(hydrated.paragraphs[0].text).toContain(
      "Bu [1] metinde [2] yer alır.",
    );
    expect(
      metadataOf(hydrated.questionGroups[0].questions[0]).transferTipUz,
    ).toBe("Bo‘sh joyning ikki tomonini birga o‘qing.");
    expect(
      metadataOf(hydrated.questionGroups[0].questions[0]).explanationUz,
    ).toBe("Bu variant gapning ma’nosini to‘g‘ri tugallaydi.");
    expect(validateSectionPracticeDraft(hydrated)).toEqual([]);
  });

  it("requires separate method and correct-answer explanation without limiting method length", () => {
    const draft = createSectionPracticeDraft(1);
    draft.title = "Bölüm 1";
    draft.paragraphs[0].text = "[1] [2] [3] [4] [5] [6]";
    const group = draft.questionGroups[0];
    const pool = ["bir", "iki", "üç", "dört", "beş", "altı", "fazla", "yedek"];
    group.questions.forEach((question, index) => {
      question.options = pool;
      question.answerKey = pool[index];
      question.explanation =
        "Bu seçenek cümleyi anlam ve yapı bakımından doğru tamamlar.";
      question.meta = {
        transferTip:
          "Boşluğun iki yanını birlikte oku. Bu metindeki anlam akışı doğru kelimeyi gösteriyor.",
        distractorExplanations: distractorFeedback(pool, pool[index]),
      };
    });

    expect(validateSectionPracticeDraft(draft)).toEqual([]);

    group.questions[0].meta = {
      transferTip: `${"Uzun ve ayrıntılı yöntem anlatımı. ".repeat(40)}`,
      distractorExplanations: distractorFeedback(pool, pool[0]),
    };
    expect(validateSectionPracticeDraft(draft)).toEqual([]);

    group.questions[0].explanation = "";
    expect(validateSectionPracticeDraft(draft)).toContain(
      "S1 doğru cevabının açıklamasını yazın.",
    );
  });

  it("requires question-specific learning content for section two", () => {
    const draft = createSectionPracticeDraft(2);
    draft.title = "Bölüm 2";
    draft.paragraphs.forEach((paragraph, index) => {
      paragraph.title = `İlan ${index + 1}`;
      paragraph.text = `İlan ${index + 1} için açıklayıcı kısa metin.`;
    });

    const group = draft.questionGroups[0];
    const bank = Array.from({ length: 10 }, (_, index) => ({
      value: String.fromCharCode(65 + index),
      label: `İhtiyaç ${index + 1}`,
    }));
    group.questions.forEach((question, index) => {
      const answer = String.fromCharCode(65 + index);
      question.answerKey = answer;
      question.options = bank;
      question.explanation = `İlan ${index + 1} ile ihtiyaç aynı koşulları taşıyor.`;
      question.meta = {
        ...((question.meta || {}) as Record<string, unknown>),
        transferTip: `S${question.order} için ilandaki özel ipuçlarını birlikte karşılaştır.`,
        distractorExplanations: Object.fromEntries(
          bank
            .filter((option) => option.value !== answer)
            .map((option) => [
              option.value,
              `${option.value} başka bir ihtiyacı anlatıyor.`,
            ]),
        ),
      };
    });

    expect(validateSectionPracticeDraft(draft)).toEqual([]);

    group.questions[0].meta = {
      ...((group.questions[0].meta || {}) as Record<string, unknown>),
      transferTip: "",
    };
    expect(validateSectionPracticeDraft(draft)).toContain(
      "S7 yöntemini yazın.",
    );
  });

  it("requires question-specific learning content for section three", () => {
    const draft = createSectionPracticeDraft(3);
    draft.title = "Bölüm 3";
    draft.paragraphs.forEach((paragraph, index) => {
      paragraph.text = `Paragraf ${index + 1} için ana fikir metni.`;
    });

    const group = draft.questionGroups[0];
    const bank = Array.from({ length: 8 }, (_, index) => ({
      value: String.fromCharCode(65 + index),
      label: `Başlık ${index + 1}`,
    }));
    group.questions.forEach((question, index) => {
      const answer = String.fromCharCode(65 + index);
      question.answerKey = answer;
      question.options = bank;
      question.explanation = `Başlık ${index + 1}, paragrafın bütününü kapsıyor.`;
      question.meta = {
        ...((question.meta || {}) as Record<string, unknown>),
        transferTip: `S${question.order} için tekrarlanan düşünceyi ve ana fikri bul.`,
        distractorExplanations: Object.fromEntries(
          bank
            .filter((option) => option.value !== answer)
            .map((option) => [
              option.value,
              `${option.value} paragrafın ana fikrini kapsamıyor.`,
            ]),
        ),
      };
    });

    expect(validateSectionPracticeDraft(draft)).toEqual([]);

    group.questions[0].meta = {
      ...((group.questions[0].meta || {}) as Record<string, unknown>),
      distractorExplanations: {},
    };
    expect(validateSectionPracticeDraft(draft)).toContain(
      "S15 için her yanlış seçeneğe özel geri bildirim yazın.",
    );
  });

  it("requires bilingual question-specific learning content for section four", () => {
    const draft = createSectionPracticeDraft(4);
    draft.title = "Bölüm 4";
    draft.paragraphs.forEach((paragraph) => {
      paragraph.text =
        "Dijital arşivler erişimi kolaylaştırır. Ancak güvenilir yorum için kaynağın ve bağlamın kaydedilmesi gerekir.";
    });

    draft.questionGroups.forEach((group) => {
      group.questions.forEach((question, index) => {
        const values =
          group.type === "MULTIPLE_CHOICE"
            ? ["A", "B", "C", "D"]
            : ["Doğru", "Yanlış", "Verilmemiş"];
        if (group.type === "MULTIPLE_CHOICE") {
          question.options = values.map(
            (value) => `${value} seçeneğinin metni`,
          );
        }
        const answer = values[index % values.length];
        question.prompt = `S${question.order} için metne dayalı soru`;
        question.answerKey = answer;
        question.explanation =
          "Bu cevap, metindeki açık bilgiyle aynı düşünceyi anlatıyor.";
        question.meta = {
          ...((question.meta || {}) as Record<string, unknown>),
          transferTip:
            "Sorudaki anahtar düşünceyi bul ve metindeki aynı anlamı taşıyan cümleyle karşılaştır.",
          transferTipUz:
            "Savoldagi asosiy fikrni toping va matndagi shu ma’noni bildirgan jumla bilan solishtiring.",
          explanationUz:
            "Bu javob matnda ochiq aytilgan fikr bilan bir xil ma’noni bildiradi.",
          distractorExplanations: distractorFeedback(values, answer),
          distractorExplanationsUz: Object.fromEntries(
            values
              .filter((value) => value !== answer)
              .map((value) => [
                value,
                `${value} matndagi fikrga mos kelmaydi.`,
              ]),
          ),
        };
      });
    });

    expect(validateSectionPracticeDraft(draft)).toEqual([]);

    const question = draft.questionGroups[0].questions[0];
    question.meta = {
      ...((question.meta || {}) as Record<string, unknown>),
      distractorExplanationsUz: {},
    };
    expect(validateSectionPracticeDraft(draft)).toContain(
      "S21 için her yanlış seçeneğe özel O‘zbekcha geri bildirim yazın.",
    );
  });

  it("accepts labeled multiple-choice options loaded from existing section data", () => {
    const draft = createSectionPracticeDraft(4);
    const question = draft.questionGroups[0].questions[0];
    question.options = [
      { value: "A", label: "Birinci seçenek" },
      { value: "B", label: "İkinci seçenek" },
      { value: "C", label: "Üçüncü seçenek" },
      { value: "D", label: "Dördüncü seçenek" },
    ];

    expect(validateSectionPracticeDraft(draft)).not.toContain(
      `S${question.order} seçeneklerinin tamamını doldurun.`,
    );
  });

  it("requires bilingual question-specific learning content for section five", () => {
    const draft = createSectionPracticeDraft(5);
    draft.title = "Bölüm 5";
    draft.paragraphs.forEach((paragraph, index) => {
      paragraph.text = `${paragraph.label} paragrafı için açıklayıcı metin ${index + 1}.`;
    });

    draft.questionGroups.forEach((group) => {
      group.questions.forEach((question, index) => {
        const values =
          group.type === "MULTIPLE_CHOICE"
            ? ["A", "B", "C", "D"]
            : ["A", "B", "C", "D", "E"];
        if (group.type === "MULTIPLE_CHOICE") {
          question.options = values.map(
            (value) => `${value} seçeneğinin metni`,
          );
        } else {
          question.options = values;
        }
        const answer = values[index % values.length];
        question.prompt = `S${question.order} için metne dayalı soru`;
        question.answerKey = answer;
        if (group.type === "PARAGRAPH_REFERENCE") {
          question.evidenceParagraphs = [answer];
        }
        question.explanation =
          "Bu cevap, sorudaki düşünceyle metindeki bilgiyi doğru eşleştiriyor.";
        question.meta = {
          ...((question.meta || {}) as Record<string, unknown>),
          transferTip:
            "Sorudaki ayırt edici düşünceyi bul ve metinde aynı anlamı veren sözlerle karşılaştır.",
          transferTipUz:
            "Savoldagi farqlovchi fikrni toping va matnda shu ma’noni bildirgan so‘zlar bilan solishtiring.",
          explanationUz:
            "Bu javob savoldagi fikrni matndagi ma’lumot bilan to‘g‘ri bog‘laydi.",
          distractorExplanations: distractorFeedback(values, answer),
          distractorExplanationsUz: Object.fromEntries(
            values
              .filter((value) => value !== answer)
              .map((value) => [
                value,
                `${value} savoldagi barcha ma’lumotga mos kelmaydi.`,
              ]),
          ),
        };
      });
    });

    expect(validateSectionPracticeDraft(draft)).toEqual([]);

    const paragraphQuestion = draft.questionGroups[1].questions[0];
    paragraphQuestion.meta = {
      ...((paragraphQuestion.meta || {}) as Record<string, unknown>),
      transferTipUz: "",
    };
    expect(validateSectionPracticeDraft(draft)).toContain(
      "S33 O‘zbekcha yöntemini yazın.",
    );
  });

  it("hydrates legacy section question order without losing the option bank", () => {
    const source = asPassage(
      createSectionPracticeDraft(3),
      "legacy-section",
    );
    const options = Array.from({ length: 8 }, (_, index) => ({
      value: String.fromCharCode(65 + index),
      label: `Başlık ${index + 1}`,
    }));
    source.questionGroups[0].questions = source.questionGroups[0].questions.map(
      (question, index) => ({
        ...question,
        order: index + 1,
        answerKey: String.fromCharCode(65 + index),
        options,
      }),
    );

    const hydrated = hydrateSectionPracticeDraft(source);
    expect(
      hydrated.questionGroups[0].questions.map((question) => question.order),
    ).toEqual([15, 16, 17, 18, 19, 20]);
    expect(
      hydrated.questionGroups[0].questions.map(
        (question) => question.answerKey,
      ),
    ).toEqual(["A", "B", "C", "D", "E", "F"]);
    const hydratedOptions = hydrated.questionGroups[0].questions[0].options;
    expect(Array.isArray(hydratedOptions)).toBe(true);
    expect(
      (hydratedOptions as Array<{ label?: string }>)[0].label,
    ).toBe("Başlık 1");
  });

  it("keeps one image for the whole text instead of one image per paragraph", () => {
    const draft = createSectionPracticeDraft(5);
    draft.paragraphs[0].imageUrl = "first-image.png";
    draft.paragraphs[0].imagePositionX = 24;
    draft.paragraphs[0].imagePositionY = 68;
    draft.paragraphs[1].imageUrl = "second-image.png";
    draft.paragraphs[1].imagePositionX = 90;
    draft.paragraphs[1].imagePositionY = 10;

    const saved = serializeSectionPracticeDraft(draft);
    expect(saved.paragraphs.map((paragraph) => paragraph.imageUrl)).toEqual([
      "first-image.png",
      "",
      "",
      "",
      "",
    ]);
    expect(saved.paragraphs[0].imagePositionX).toBe(24);
    expect(saved.paragraphs[0].imagePositionY).toBe(68);
    expect(saved.paragraphs[1].imagePositionX).toBeUndefined();
    expect(saved.paragraphs[1].imagePositionY).toBeUndefined();
    const payload = readingPracticeSavePayload(saved) as {
      paragraphs: Array<Record<string, unknown>>;
    };
    expect(payload.paragraphs[0]).toMatchObject({
      imageUrl: "first-image.png",
      imagePositionX: 24,
      imagePositionY: 68,
    });

    const legacy = asPassage(createSectionPracticeDraft(5), "legacy-image");
    legacy.paragraphs[2].imageUrl = "legacy-image.png";
    legacy.paragraphs[2].imagePositionX = 81;
    legacy.paragraphs[2].imagePositionY = 17;
    const hydrated = hydrateSectionPracticeDraft(legacy);
    expect(hydrated.paragraphs.map((paragraph) => paragraph.imageUrl)).toEqual([
      "legacy-image.png",
      "",
      "",
      "",
      "",
    ]);
    expect(hydrated.paragraphs[0].imagePositionX).toBe(81);
    expect(hydrated.paragraphs[0].imagePositionY).toBe(17);
    expect(hydrated.paragraphs[2].imagePositionX).toBeUndefined();
    expect(hydrated.paragraphs[2].imagePositionY).toBeUndefined();
  });

  it("keeps section five aligned with the A-E exam structure", () => {
    const draft = createSectionPracticeDraft(5);

    expect(draft.paragraphs.map((paragraph) => paragraph.label)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
    ]);
    expect(draft.questionGroups[1].questions[0].options).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
    ]);

    const legacy = asPassage(structuredClone(draft), "legacy-section-five");
    legacy.paragraphs = legacy.paragraphs.slice(0, 4);
    legacy.questionGroups[1].questions.forEach((question) => {
      question.options = ["A", "B", "C", "D"];
    });

    const hydrated = hydrateSectionPracticeDraft(legacy);
    expect(hydrated.paragraphs.map((paragraph) => paragraph.label)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
    ]);
    expect(hydrated.questionGroups[1].questions[0].options).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
    ]);
  });

  it("replaces a legacy first-use entry when occurrence-aware meanings are generated", () => {
    const existing = [
      {
        order: 1,
        term: "bir",
        definition: "Eski ve yanlış bağlam.",
        paragraphLabel: "Metin",
      },
    ];
    const generated = [
      {
        order: 1,
        term: "bir",
        definition: "İlk kullanıma ait anlam.",
        paragraphLabel: "Metin",
        occurrenceIndex: 1,
      },
      {
        order: 2,
        term: "bir",
        definition: "İkinci kullanıma ait anlam.",
        paragraphLabel: "Metin",
        occurrenceIndex: 2,
      },
    ];

    expect(mergeGeneratedGlossaryEntries(existing, generated)).toEqual([
      expect.objectContaining({
        order: 1,
        definition: "İlk kullanıma ait anlam.",
        occurrenceIndex: 1,
      }),
      expect.objectContaining({
        order: 2,
        definition: "İkinci kullanıma ait anlam.",
        occurrenceIndex: 2,
      }),
    ]);
  });
});
