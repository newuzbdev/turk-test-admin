import type {
  LearnContentBlockFormValues,
  LearnContentBlockPayload,
  LearnContentBlockType,
} from "./course-types";

export const LEARN_BLOCK_TYPE_OPTIONS: Array<{
  value: LearnContentBlockType;
  label: string;
}> = [
  { value: "HEADING", label: "Başlık" },
  { value: "TEXT", label: "Metin" },
  { value: "EXAMPLE", label: "Örnek" },
  { value: "CALLOUT", label: "Bilgi kutusu" },
  { value: "IMAGE", label: "Görsel" },
  { value: "AUDIO", label: "Ses" },
  { value: "VIDEO", label: "Video" },
  { value: "GRAMMAR_PATTERN", label: "Gramer Kalıbı" },
  { value: "COMMON_MISTAKE", label: "Sık Hata" },
  { value: "EXAM_TIP", label: "Sınav İpucu" },
  { value: "VOCABULARY_LIST", label: "Kelime Listesi" },
  { value: "MINI_QUESTION", label: "Mini soru" },
  { value: "FINAL_EXERCISE", label: "Final alıştırması" },
];

export const TEXT_BLOCK_TYPES = new Set<LearnContentBlockType>([
  "TEXT",
  "EXAMPLE",
  "CALLOUT",
]);

export const MEDIA_BLOCK_TYPES = new Set<LearnContentBlockType>([
  "IMAGE",
  "AUDIO",
  "VIDEO",
]);

export const INTERACTIVE_BLOCK_TYPES = new Set<LearnContentBlockType>([
  "MINI_QUESTION",
  "FINAL_EXERCISE",
]);

export const VISUAL_BLOCK_TYPES = new Set<LearnContentBlockType>([
  "GRAMMAR_PATTERN",
  "COMMON_MISTAKE",
  "EXAM_TIP",
  "VOCABULARY_LIST",
]);

export const getLearnBlockTypeLabel = (type: LearnContentBlockType) =>
  LEARN_BLOCK_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
  type;

const clean = (value?: string | null) => value?.trim() || undefined;

const cleanObject = <T extends Record<string, string | undefined>>(
  value: T
) =>
  Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => Boolean(fieldValue))
  ) as Partial<T>;

export const buildLearnBlockPayload = (
  values: LearnContentBlockFormValues
): LearnContentBlockPayload => {
  const payload: LearnContentBlockPayload = { type: values.type };

  if (values.type === "HEADING") {
    payload.title = clean(values.title);
  }

  if (TEXT_BLOCK_TYPES.has(values.type)) {
    payload.text = clean(values.text);
  }

  if (MEDIA_BLOCK_TYPES.has(values.type)) {
    payload.mediaUrl = clean(values.mediaUrl);
  }

  if (INTERACTIVE_BLOCK_TYPES.has(values.type)) {
    const exerciseId = clean(values.exerciseId);
    payload.data = exerciseId ? { exerciseId } : {};
  }

  if (values.type === "GRAMMAR_PATTERN") {
    const rows = (values.grammarPattern?.rows ?? [])
      .map((row) =>
        cleanObject({
          label: clean(row.label),
          form: clean(row.form),
          example: clean(row.example),
          note: clean(row.note),
        })
      )
      .filter((row) => Object.keys(row).length > 0);
    const examples = (values.grammarPattern?.examples ?? [])
      .map((example) =>
        cleanObject({
          text: clean(example.text),
          explanation: clean(example.explanation),
        })
      )
      .filter((example) => Boolean(example.text));

    payload.data = {
      pattern: clean(values.grammarPattern?.pattern),
      explanation: clean(values.grammarPattern?.explanation),
      ...(rows.length ? { rows } : {}),
      ...(examples.length ? { examples } : {}),
    };
  }

  if (values.type === "COMMON_MISTAKE") {
    payload.data = {
      wrong: clean(values.commonMistake?.wrong),
      correct: clean(values.commonMistake?.correct),
      explanation: clean(values.commonMistake?.explanation),
    };
  }

  if (values.type === "EXAM_TIP") {
    payload.data = {
      tip: clean(values.examTip?.tip),
      skillTagKey: clean(values.examTip?.skillTagKey),
      level: values.examTip?.level,
    };
  }

  if (values.type === "VOCABULARY_LIST") {
    const items = (values.vocabularyList?.items ?? [])
      .map((item) =>
        cleanObject({
          word: clean(item.word),
          meaning: clean(item.meaning),
          example: clean(item.example),
          note: clean(item.note),
        })
      )
      .filter((item) => Boolean(item.word && item.meaning));

    payload.data = { items };
  }

  return payload;
};
