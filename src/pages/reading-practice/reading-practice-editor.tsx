import ContentAccessControls, { ManagedLegacyAccess } from "@/components/access/ContentAccessControls";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  BookOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  RobotOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateReadingPractice,
  useGenerateReadingPracticeGlossary,
  useGetOneReadingPractice,
  useUpdateReadingPractice,
} from "@/config/queries/reading-practice";
import { useFileUpload } from "@/config/queries/file/upload.queries";
import type {
  CreateReadingPractice,
  ReadingPracticeGlossaryEntry,
  ReadingPracticeParagraph,
  ReadingPracticePassage,
  ReadingPracticeQuestion,
  ReadingPracticeQuestionGroup,
  UpdateReadingPractice,
} from "@/utils/types/types";
import { mergeGeneratedGlossaryEntries } from "./reading-practice-section-model";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type GroupType =
  | "MATCHING_HEADINGS"
  | "FILL_BLANK"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE_NOT_GIVEN"
  | "PARAGRAPH_REFERENCE"
  | "KELIME_CALISMASI";

type ActiveQuestionRef = {
  groupType: GroupType;
  questionIndex: number;
} | null;

type SelectionState = {
  text: string;
  paragraphLabel: string;
  top: number;
  left: number;
} | null;

const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1"];
const PARAGRAPH_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const GROUP_ORDER: GroupType[] = [
  "MATCHING_HEADINGS",
  "FILL_BLANK",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE_NOT_GIVEN",
  "PARAGRAPH_REFERENCE",
  "KELIME_CALISMASI",
];

const GROUP_META: Record<GroupType, { title: string; instructions: string }> = {
  MATCHING_HEADINGS: {
    title: "Başlıkları ilgili paragraflara bırak",
    instructions: "Her paragraf için en uygun başlığı seç.",
  },
  FILL_BLANK: {
    title: "Kelimeleri metindeki numaralı boşluklara yerleştir",
    instructions: "Metinde işaretlenen boşluklara doğru kelimeleri yerleştir.",
  },
  MULTIPLE_CHOICE: {
    title: "Çoktan seçmeli",
    instructions: "Her soru için en doğru seçeneği işaretle.",
  },
  TRUE_FALSE_NOT_GIVEN: {
    title: "Doğru / yanlış",
    instructions: "Her ifadeyi metinle karşılaştır ve karar ver.",
  },
  PARAGRAPH_REFERENCE: {
    title: "Hangi paragrafta geçiyor?",
    instructions: "İfadenin bulunduğu paragrafı seç.",
  },
  KELIME_CALISMASI: {
    title: "Kelime çalışması",
    instructions: "Önce eş anlamlılar, sonra zıt anlamlılar gelir.",
  },
};

type SectionAuthoringConfig = {
  title: string;
  description: string;
  paragraphTitle: string;
  paragraphPlaceholder: string;
  paragraphLabels: string[];
  blankPoolSize?: number;
  groups: { type: GroupType; title: string; instructions: string; count: number }[];
};

const SECTION_AUTHORING_CONFIG: Record<number, SectionAuthoringConfig> = {
  1: {
    title: "Okuma Bölüm 1",
    description: "Tek metindeki 6 numaralı boşluk ve A-H kelime havuzu hazırlanır.",
    paragraphTitle: "Boşluklu metin",
    paragraphPlaceholder: "Metni yaz. Boşluk olacak kelimeleri [[kelime]] biçiminde işaretleyebilirsin.",
    paragraphLabels: ["Metin"],
    blankPoolSize: 8,
    groups: [{
      type: "FILL_BLANK",
      title: "1-6 · Boşluk doldurma",
      instructions: "6 boşluğu ve iki fazla seçenek içeren A-H kelime havuzunu hazırla.",
      count: 6,
    }],
  },
  2: {
    title: "Okuma Bölüm 2",
    description: "7-14 numaralı 8 ilan, durum veya ihtiyaç cümleleriyle eşleştirilir.",
    paragraphTitle: "7-14 · İlanlar",
    paragraphPlaceholder: "Bu soruya ait ilan metnini yaz.",
    paragraphLabels: ["S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14"],
    groups: [{
      type: "MATCHING_HEADINGS",
      title: "Durum ve ihtiyaç seçenekleri",
      instructions: "Her ilanı uygun durum veya ihtiyaç cümlesiyle eşleştir.",
      count: 8,
    }],
  },
  3: {
    title: "Okuma Bölüm 3",
    description: "I-VI paragrafları, başlık seçenekleriyle sınavdaki harf seçimi düzeninde eşleştirilir.",
    paragraphTitle: "I-VI · Paragraflar",
    paragraphPlaceholder: "Paragraf metnini yaz.",
    paragraphLabels: ["I", "II", "III", "IV", "V", "VI"],
    groups: [{
      type: "MATCHING_HEADINGS",
      title: "Başlık seçenekleri",
      instructions: "Her paragrafı uygun başlık seçeneğiyle eşleştir.",
      count: 6,
    }],
  },
  4: {
    title: "Okuma Bölüm 4",
    description: "Tek metin için 21-24 çoktan seçmeli ve 25-29 Doğru / Yanlış / Verilmemiş soruları hazırlanır.",
    paragraphTitle: "Ana metin",
    paragraphPlaceholder: "Bölüm 4 ana metnini yaz.",
    paragraphLabels: ["Metin"],
    groups: [
      { type: "MULTIPLE_CHOICE", title: "21-24 · Çoktan seçmeli", instructions: "Her soru için dört seçenek ve doğru harfi gir.", count: 4 },
      { type: "TRUE_FALSE_NOT_GIVEN", title: "25-29 · Doğru / Yanlış / Verilmemiş", instructions: "Her ifade için doğru sonucu ve kanıt paragrafını seç.", count: 5 },
    ],
  },
  5: {
    title: "Okuma Bölüm 5",
    description: "A-E paragrafları için 30-32 çoktan seçmeli ve 33-35 paragraf seçimi soruları hazırlanır.",
    paragraphTitle: "A-E · Metin paragrafları",
    paragraphPlaceholder: "Paragraf metnini yaz.",
    paragraphLabels: ["A", "B", "C", "D", "E"],
    groups: [
      { type: "MULTIPLE_CHOICE", title: "30-32 · Çoktan seçmeli", instructions: "Her soru için dört seçenek ve doğru harfi gir.", count: 3 },
      { type: "PARAGRAPH_REFERENCE", title: "33-35 · Hangi paragrafta?", instructions: "Her ifade için doğru A-E paragrafını seç. İki paragraf kullanılmayacaktır.", count: 3 },
    ],
  },
};

function getVisibleGroupTypes(passage: Pick<CreateReadingPractice, "practiceType" | "sectionNumber">) {
  if (passage.practiceType !== "SECTION") return GROUP_ORDER;
  return (SECTION_AUTHORING_CONFIG[Number(passage.sectionNumber) || 1]?.groups || []).map((group) => group.type);
}

function getSectionGroupTitle(sectionNumber: number | undefined, type: GroupType) {
  return SECTION_AUTHORING_CONFIG[Number(sectionNumber) || 1]?.groups.find((group) => group.type === type)?.title;
}

function getSectionGroupConfig(sectionNumber: number | undefined, type: GroupType) {
  return SECTION_AUTHORING_CONFIG[Number(sectionNumber) || 1]?.groups.find((group) => group.type === type);
}

const DEFAULT_PASSAGE: CreateReadingPractice = {
  title: "",
  passageTitle: "",
  description: "",
  coverImageUrl: "",
  topic: "",
  level: "B2",
  coinCost: 0,
  estimatedMinutes: 20,
  practiceType: "COMPREHENSIVE",
  sectionNumber: undefined,
  isPublished: false,
  isFreeAccess: false,
  paragraphs: PARAGRAPH_LABELS.slice(0, 6).map((label) => ({ label, text: "" })),
  glossaryEntries: [],
  questionGroups: [],
};

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function toTextArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseBracketSyntax(input: string) {
  const matches = [...input.matchAll(/\[\[(.+?)\]\]/g)];
  const tokens = matches.map((match) => match[1].trim()).filter(Boolean);
  return {
    plainText: input.replace(/\[\[(.+?)\]\]/g, "$1"),
    tokens,
  };
}

function buildEmptyQuestion(order: number, groupType: GroupType): ReadingPracticeQuestion {
  if (groupType === "MULTIPLE_CHOICE") {
    return {
      order,
      prompt: "",
      answerKey: "A",
      options: ["", "", "", ""],
      explanation: "",
      evidenceParagraphs: [],
      meta: {},
    };
  }

  if (groupType === "TRUE_FALSE_NOT_GIVEN") {
    return {
      order,
      prompt: "",
      answerKey: "Doğru",
      options: ["Doğru", "Yanlış", "Verilmemiş"],
      explanation: "",
      evidenceParagraphs: [],
      meta: {},
    };
  }

  if (groupType === "PARAGRAPH_REFERENCE") {
    return {
      order,
      prompt: "",
      answerKey: "A",
      options: PARAGRAPH_LABELS.slice(0, 6),
      explanation: "",
      evidenceParagraphs: [],
      meta: {},
    };
  }

  if (groupType === "FILL_BLANK") {
    return {
      order,
      prompt: `${order}. boşluk`,
      answerKey: "",
      options: [],
      explanation: "",
      evidenceParagraphs: [],
      meta: {},
    };
  }

  if (groupType === "MATCHING_HEADINGS") {
    return {
      order,
      prompt: "",
      answerKey: "A",
      options: [],
      explanation: "",
      evidenceParagraphs: [],
      meta: { keywords: [] },
    };
  }

  return {
    order,
    prompt: "",
    answerKey: "",
    options: [],
    explanation: "",
    evidenceParagraphs: [],
    meta: {},
  };
}

function normalizeQuestionMeta(question: ReadingPracticeQuestion) {
  return typeof question.meta === "object" && question.meta ? { ...(question.meta as Record<string, unknown>) } : {};
}

function buildFixedGroups(source?: ReadingPracticePassage | CreateReadingPractice) {
  const existingGroups = safeArray<ReadingPracticeQuestionGroup>(source?.questionGroups);
  const existingMap = new Map(existingGroups.map((group) => [group.type, group]));

  const groups = GROUP_ORDER.map((type, orderIndex) => {
    const fromApi = existingMap.get(type);
    const base: ReadingPracticeQuestionGroup = fromApi
      ? deepClone(fromApi)
      : {
          order: orderIndex + 1,
          title: GROUP_META[type].title,
          type,
          instructions: GROUP_META[type].instructions,
          questions: [],
        };

    base.order = orderIndex + 1;
    base.title = GROUP_META[type].title;
    base.instructions = GROUP_META[type].instructions;
    base.questions = safeArray<ReadingPracticeQuestion>(base.questions);
    return base;
  });

  const vocabGroup = groups.find((group) => group.type === "KELIME_CALISMASI");
  if (vocabGroup) {
    const current = safeArray<ReadingPracticeQuestion>(vocabGroup.questions);
    const normalized = current.map((question, index) => {
      const meta = normalizeQuestionMeta(question);
      const part = index < 10 ? "es-anlamli" : "zit-anlamli";
      meta.altBolum = meta.altBolum || part;
      meta.altBaslik = meta.altBaslik || (part === "es-anlamli" ? "Eş anlamlılar" : "Zıt anlamlılar");
      return { ...question, meta };
    });

    while (normalized.length < 20) {
      const index = normalized.length;
      const meta = index < 10
        ? { altBolum: "es-anlamli", altBaslik: "Eş anlamlılar" }
        : { altBolum: "zit-anlamli", altBaslik: "Zıt anlamlılar" };
      normalized.push({
        order: index + 1,
        prompt: "",
        answerKey: "",
        options: [],
        explanation: "",
        evidenceParagraphs: [],
        meta,
      });
    }

    vocabGroup.questions = normalized;
  }

  return groups;
}

function normalizePassage(source?: ReadingPracticePassage | CreateReadingPractice): CreateReadingPractice {
  const base = deepClone(DEFAULT_PASSAGE);
  const incomingParagraphs = safeArray<ReadingPracticeParagraph>(source?.paragraphs);
  const paragraphs =
    incomingParagraphs.length > 0
      ? incomingParagraphs.map((paragraph, index) => ({
          label: paragraph.label || PARAGRAPH_LABELS[index] || String.fromCharCode(65 + index),
          text: paragraph.text || "",
        }))
      : base.paragraphs;

  return {
    ...base,
    ...deepClone(source || {}),
    coinCost:
      typeof source?.coinCost === "number"
        ? source.coinCost
        : typeof source?.price === "number"
        ? source.price
        : 0,
    estimatedMinutes: source?.estimatedMinutes || base.estimatedMinutes,
    practiceType: source?.practiceType || base.practiceType,
    sectionNumber:
      source?.practiceType === "SECTION" ? source.sectionNumber : undefined,
    paragraphs,
    glossaryEntries: safeArray<ReadingPracticeGlossaryEntry>(source?.glossaryEntries).map((entry, index) => ({
      order: typeof entry.order === "number" ? entry.order : index + 1,
      term: entry.term || "",
      definition: entry.definition || "",
      simpleDefinition: entry.simpleDefinition || "",
      baseForm: entry.baseForm || "",
      baseMeaning: entry.baseMeaning || entry.definition || "",
      contextMeaning: entry.contextMeaning || "",
      contextSnippet: entry.contextSnippet || "",
      occurrenceIndex: entry.occurrenceIndex,
      translation: entry.translation || "",
      example: entry.example || "",
      paragraphLabel: entry.paragraphLabel || "",
    })),
    questionGroups: buildFixedGroups(source),
  };
}

function getGroupQuestionOrder(groups: ReadingPracticeQuestionGroup[]) {
  let running = 1;
  return groups.reduce<Record<string, number[]>>((acc, group) => {
    acc[group.type] = group.questions.map(() => running++);
    return acc;
  }, {});
}

function getBlankPoolItems(group: ReadingPracticeQuestionGroup) {
  const allOptions = group.questions.flatMap((question) => toTextArray(question.options));
  return Array.from(new Set(allOptions));
}

function setSharedBlankPoolItems(group: ReadingPracticeQuestionGroup, values: string[]) {
  const normalized = values.map((item) => item.trim()).filter(Boolean);
  group.questions = group.questions.map((question) => ({
    ...question,
    options: normalized,
  }));
}

function getGroupQuestionKindLabel(type: GroupType) {
  if (type === "MATCHING_HEADINGS") return "Başlık";
  if (type === "FILL_BLANK") return "Boşluk";
  if (type === "MULTIPLE_CHOICE") return "Çoktan seçmeli";
  if (type === "TRUE_FALSE_NOT_GIVEN") return "Doğru / yanlış";
  if (type === "PARAGRAPH_REFERENCE") return "Paragraf";
  return "Kelime";
}

function getAllowedMarkerLabel(type: GroupType) {
  if (type === "FILL_BLANK") return "Metinden kelime seçip boşluk yapabilirsin.";
  if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE_NOT_GIVEN" || type === "PARAGRAPH_REFERENCE") {
    return "Metinden cümle seçip rehber vurgusu yapabilirsin.";
  }
  if (type === "MATCHING_HEADINGS") return "Bu bölümde paragraf ve anahtar kelime yeterlidir.";
  return "Bu bölümde metin üstünden işaretleme kullanılmaz.";
}

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function sanitizeGlossaryEntries(entries: ReadingPracticeGlossaryEntry[]) {
  return entries
    .map((entry, index) => {
      const baseMeaning =
        cleanString(entry.baseMeaning) ||
        cleanString(entry.definition) ||
        cleanString(entry.contextMeaning);
      return {
        ...entry,
        order: index + 1,
        term: cleanString(entry.term),
        definition: baseMeaning,
        simpleDefinition: baseMeaning,
        baseForm: cleanString(entry.baseForm),
        baseMeaning,
        contextMeaning: "",
        contextSnippet: cleanString(entry.contextSnippet),
        occurrenceIndex: entry.occurrenceIndex,
        translation: cleanString(entry.translation),
        example: "",
        paragraphLabel: cleanString(entry.paragraphLabel),
      };
    })
    .filter((entry) => entry.term && entry.baseMeaning);
}

function sanitizeQuestion(groupType: GroupType, question: ReadingPracticeQuestion, order: number) {
  const prompt = cleanString(question.prompt);
  const answerKey = typeof question.answerKey === "string" ? cleanString(question.answerKey) : question.answerKey;
  const explanation = cleanString(question.explanation);
  const evidenceParagraphs = toTextArray(question.evidenceParagraphs);
  const options = toTextArray(question.options);
  const meta = normalizeQuestionMeta(question);

  if (groupType === "MATCHING_HEADINGS") {
    const normalizedAnswer = cleanString(answerKey);
    if (!prompt || !normalizedAnswer) return null;
    return {
      ...question,
      order,
      prompt,
      answerKey: normalizedAnswer,
      explanation: explanation || undefined,
      evidenceParagraphs: evidenceParagraphs.length ? evidenceParagraphs : [normalizedAnswer],
      options: [],
      meta: {
        ...meta,
        keywords: toTextArray(meta.keywords),
      },
    };
  }

  if (groupType === "FILL_BLANK") {
    const normalizedAnswer = cleanString(answerKey);
    const inlineTarget = cleanString(meta.inlineTarget);
    if (!normalizedAnswer) return null;
    if (!inlineTarget && evidenceParagraphs.length === 0) return null;
    return {
      ...question,
      order,
      prompt: prompt || `${order}. boşluk`,
      answerKey: normalizedAnswer,
      options,
      acceptedAnswers: undefined,
      explanation: explanation || undefined,
      evidenceParagraphs,
      meta: {
        ...meta,
        inlineTarget,
      },
    };
  }

  if (groupType === "MULTIPLE_CHOICE") {
    const normalizedAnswer = cleanString(answerKey);
    if (!prompt || options.length < 4 || options.slice(0, 4).some((item) => !item) || !normalizedAnswer) return null;
    return {
      ...question,
      order,
      prompt,
      answerKey: normalizedAnswer,
      options: options.slice(0, 4),
      explanation: explanation || undefined,
      evidenceParagraphs,
      meta,
    };
  }

  if (groupType === "TRUE_FALSE_NOT_GIVEN") {
    const normalizedAnswer = cleanString(answerKey);
    if (!prompt || !normalizedAnswer) return null;
    return {
      ...question,
      order,
      prompt,
      answerKey: normalizedAnswer,
      options: ["Doğru", "Yanlış", "Verilmemiş"],
      explanation: explanation || undefined,
      evidenceParagraphs,
      meta,
    };
  }

  if (groupType === "PARAGRAPH_REFERENCE") {
    const normalizedAnswer = cleanString(answerKey);
    if (!prompt || !normalizedAnswer) return null;
    return {
      ...question,
      order,
      prompt,
      answerKey: normalizedAnswer,
      options: [],
      explanation: explanation || undefined,
      evidenceParagraphs: evidenceParagraphs.length ? evidenceParagraphs : [normalizedAnswer],
      meta,
    };
  }

  const normalizedAnswer = cleanString(answerKey);
  if (!prompt || !normalizedAnswer) return null;
  return {
    ...question,
    order,
    prompt,
    answerKey: normalizedAnswer,
    options: [],
    explanation: explanation || undefined,
    evidenceParagraphs: [],
    meta,
  };
}

function buildPayload(passage: CreateReadingPractice): CreateReadingPractice {
  const next = deepClone(passage);

  next.paragraphs = next.paragraphs.map((paragraph) => ({
    label: paragraph.label,
    text: parseBracketSyntax(paragraph.text).plainText,
  }));

  next.glossaryEntries = sanitizeGlossaryEntries(safeArray<ReadingPracticeGlossaryEntry>(next.glossaryEntries));

  const blankGroup = next.questionGroups.find((group) => group.type === "FILL_BLANK");
  if (blankGroup) {
    const paragraphMap = new Map(
      passage.paragraphs.map((paragraph) => [paragraph.label, parseBracketSyntax(paragraph.text)])
    );

    blankGroup.questions = blankGroup.questions.map((question) => {
      const paragraphLabel = safeArray<string>(question.evidenceParagraphs)[0] || "";
      const paragraphInfo = paragraphMap.get(paragraphLabel);
      const meta = normalizeQuestionMeta(question);
      const currentTarget = String(meta.inlineTarget || "").trim();
      const answer = String(question.answerKey || "").trim();

      if (!currentTarget && paragraphInfo && answer) {
        const autoTarget = paragraphInfo.tokens.find(
          (token) => token.toLowerCase() === answer.toLowerCase()
        );
        if (autoTarget) {
          meta.inlineTarget = autoTarget;
        }
      }

      return {
        ...question,
        acceptedAnswers: undefined,
        meta,
        };
      });
  }

  const visibleGroupTypes = new Set(getVisibleGroupTypes(next));
  next.questionGroups = next.questionGroups
    .filter((group) => visibleGroupTypes.has(group.type as GroupType))
    .map((group, groupIndex) => {
      const sanitizedQuestions = safeArray<ReadingPracticeQuestion>(group.questions)
        .map((question, questionIndex) => sanitizeQuestion(group.type as GroupType, question, questionIndex + 1))
        .filter(Boolean) as ReadingPracticeQuestion[];

      if (group.type === "FILL_BLANK") {
        const sharedPool = Array.from(new Set(sanitizedQuestions.flatMap((question) => toTextArray(question.options))));
        sanitizedQuestions.forEach((question) => {
          question.options = sharedPool;
        });
      }

      return {
        ...group,
        order: groupIndex + 1,
        title: cleanString(group.title) || GROUP_META[group.type as GroupType].title,
        instructions: cleanString(group.instructions) || GROUP_META[group.type as GroupType].instructions,
        questions: sanitizedQuestions,
      };
    })
    .filter((group) => group.questions.length > 0);

  next.coinCost = Number(next.coinCost || 0);
  next.price = next.coinCost;

  return next;
}

function ReadingPracticeEditor() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [passage, setPassage] = useState<CreateReadingPractice>(() => normalizePassage());
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestionRef>(null);
  const [selection, setSelection] = useState<SelectionState>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [glossaryConfirmOpen, setGlossaryConfirmOpen] = useState(false);
  const [glossaryConfirmHasEntries, setGlossaryConfirmHasEntries] =
    useState(false);
  const pendingGlossaryGenerationRef = useRef<null | (() => void)>(null);

  const { data, isLoading } = useGetOneReadingPractice(id);
  const createMutation = useCreateReadingPractice();
  const updateMutation = useUpdateReadingPractice();
  const generateGlossaryMutation = useGenerateReadingPracticeGlossary();
  const uploadMutation = useFileUpload();

  const source = (data?.data || data) as ReadingPracticePassage | undefined;

  useEffect(() => {
    if (!source) return;
    if (source.practiceType === "SECTION" && id) {
      navigate(`/reading-practice/${id}/section-edit`, { replace: true });
      return;
    }
    setPassage(normalizePassage(source));
  }, [id, navigate, source]);

  const sectionAuthoringConfig =
    passage.practiceType === "SECTION"
      ? SECTION_AUTHORING_CONFIG[Number(passage.sectionNumber) || 1]
      : null;
  const visibleQuestionGroups = useMemo(() => {
    const visibleTypes = new Set(getVisibleGroupTypes(passage));
    return passage.questionGroups.filter((group) => visibleTypes.has(group.type as GroupType));
  }, [passage]);
  const questionOrders = useMemo(() => getGroupQuestionOrder(visibleQuestionGroups), [visibleQuestionGroups]);

  const currentQuestionNumber = useMemo(() => {
    if (!activeQuestion) return null;
    return questionOrders[activeQuestion.groupType]?.[activeQuestion.questionIndex] ?? null;
  }, [activeQuestion, questionOrders]);

  const activeQuestionDetail = useMemo(() => {
    if (!activeQuestion) return null;
    const group = visibleQuestionGroups.find((item) => item.type === activeQuestion.groupType);
    if (!group) return null;
    const question = group.questions[activeQuestion.questionIndex];
    if (!question) return null;
    return {
      group,
      question,
      number: questionOrders[activeQuestion.groupType]?.[activeQuestion.questionIndex] ?? null,
      meta: normalizeQuestionMeta(question),
    };
  }, [activeQuestion, questionOrders, visibleQuestionGroups]);

  const selectPreviewQuestion = (groupType: GroupType, order: number) => {
    const group = visibleQuestionGroups.find((item) => item.type === groupType);
    if (!group) return;
    const questionIndex = group.questions.findIndex((item) => item.order === order);
    if (questionIndex === -1) return;
    setActiveQuestion({ groupType, questionIndex });
  };

  const previewQuestions = useMemo(() => {
    return visibleQuestionGroups.flatMap((group) =>
      group.questions.map((question, index) => ({
        ...question,
        groupType: group.type as GroupType,
        groupTitle:
          passage.practiceType === "SECTION"
            ? getSectionGroupTitle(passage.sectionNumber, group.type as GroupType) || group.title
            : group.title,
        previewNumber: questionOrders[group.type]?.[index] ?? index + 1,
      }))
    );
  }, [passage.practiceType, passage.sectionNumber, questionOrders, visibleQuestionGroups]);

  const setPassageValue = (updater: (draft: CreateReadingPractice) => CreateReadingPractice) => {
    setPassage((current) => updater(deepClone(current)));
  };

  const updateGroupQuestions = (
    groupType: GroupType,
    updater: (questions: ReadingPracticeQuestion[]) => ReadingPracticeQuestion[]
  ) => {
    setPassageValue((draft) => {
      draft.questionGroups = draft.questionGroups.map((group) =>
        group.type === groupType ? { ...group, questions: updater(group.questions) } : group
      );
      return draft;
    });
  };

  const handleParagraphChange = (index: number, key: keyof ReadingPracticeParagraph, value: string) => {
    setPassageValue((draft) => {
      draft.paragraphs[index] = {
        ...draft.paragraphs[index],
        [key]: value,
      };
      return draft;
    });
  };

  const addParagraph = () => {
    setPassageValue((draft) => {
      const nextIndex = draft.paragraphs.length;
      draft.paragraphs.push({
        label: PARAGRAPH_LABELS[nextIndex] || `P${nextIndex + 1}`,
        text: "",
      });
      return draft;
    });
  };

  const removeParagraph = (index: number) => {
    setPassageValue((draft) => {
      draft.paragraphs.splice(index, 1);
      draft.paragraphs = draft.paragraphs.map((paragraph, itemIndex) => ({
        ...paragraph,
        label: PARAGRAPH_LABELS[itemIndex] || paragraph.label,
      }));
      return draft;
    });
  };

  const handleGlossaryChange = (index: number, key: keyof ReadingPracticeGlossaryEntry, value: string) => {
    setPassageValue((draft) => {
      draft.glossaryEntries[index] = {
        ...draft.glossaryEntries[index],
        [key]: value,
      };
      if (key === "baseMeaning") {
        draft.glossaryEntries[index].definition = value;
        draft.glossaryEntries[index].simpleDefinition = value;
        draft.glossaryEntries[index].contextMeaning = "";
        draft.glossaryEntries[index].example = "";
      }
      return draft;
    });
  };

  const addGlossaryEntry = () => {
    setPassageValue((draft) => {
      draft.glossaryEntries.push({
        order: draft.glossaryEntries.length + 1,
        term: "",
        definition: "",
        simpleDefinition: "",
        baseForm: "",
        baseMeaning: "",
        contextMeaning: "",
        example: "",
        paragraphLabel: "",
      });
      return draft;
    });
  };

  const removeGlossaryEntry = (index: number) => {
    setPassageValue((draft) => {
      draft.glossaryEntries.splice(index, 1);
      draft.glossaryEntries = draft.glossaryEntries.map((entry, itemIndex) => ({
        ...entry,
        order: itemIndex + 1,
      }));
      return draft;
    });
  };

  const addQuestion = (groupType: GroupType, vocabKind?: "es-anlamli" | "zit-anlamli") => {
    updateGroupQuestions(groupType, (questions) => {
      const next = [...questions];
      const newQuestion = buildEmptyQuestion(next.length + 1, groupType);
      if (groupType === "KELIME_CALISMASI") {
        newQuestion.meta = {
          ...normalizeQuestionMeta(newQuestion),
          altBolum: vocabKind || "es-anlamli",
          altBaslik: vocabKind === "zit-anlamli" ? "Zıt anlamlılar" : "Eş anlamlılar",
        };
      }
      next.push(newQuestion);
      return next.map((question, index) => ({ ...question, order: index + 1 }));
    });
  };

  const removeQuestion = (groupType: GroupType, index: number) => {
    updateGroupQuestions(groupType, (questions) =>
      questions
        .filter((_, itemIndex) => itemIndex !== index)
        .map((question, itemIndex) => ({ ...question, order: itemIndex + 1 }))
    );
  };

  const updateQuestion = (
    groupType: GroupType,
    index: number,
    updater: (question: ReadingPracticeQuestion) => ReadingPracticeQuestion
  ) => {
    updateGroupQuestions(groupType, (questions) =>
      questions.map((question, itemIndex) => (itemIndex === index ? updater(question) : question))
    );
  };

  const handleGenerateGlossary = () => {
    const paragraphs = passage.paragraphs
      .map((paragraph) => ({ ...paragraph, text: paragraph.text.trim() }))
      .filter((paragraph) => paragraph.text);

    if (!paragraphs.length) {
      message.warning("Önce metni yaz.");
      return;
    }

    const request = {
      title: passage.title,
      level: passage.level,
      paragraphs,
      existingEntries: passage.glossaryEntries
        .filter(
          (entry) =>
            cleanString(entry.term) &&
            Boolean(
              cleanString(entry.definition) ||
                cleanString(entry.baseMeaning) ||
                cleanString(entry.contextMeaning),
            ),
        )
        .map((entry) => ({
          term: entry.term,
          definition: entry.definition,
          order: entry.order,
          simpleDefinition: entry.simpleDefinition,
          baseForm: entry.baseForm,
          baseMeaning: entry.baseMeaning,
          contextMeaning: entry.contextMeaning,
          contextSnippet: entry.contextSnippet,
          occurrenceIndex: entry.occurrenceIndex,
          translation: entry.translation,
          example: entry.example,
          paragraphLabel: entry.paragraphLabel,
        })),
    };
    const runGeneration = () =>
      generateGlossaryMutation.mutate(request, {
        onSuccess: (response) => {
          const generated = safeArray<ReadingPracticeGlossaryEntry>(response?.entries);
          if (!generated.length) {
            message.warning("Metinden sözlük maddesi üretilemedi.");
            return;
          }

          setPassageValue((draft) => {
            draft.glossaryEntries = mergeGeneratedGlossaryEntries(
              draft.glossaryEntries,
              generated,
            );
            return draft;
          });
          const missingCount = Number(response?.missingCount || 0);
          message.success(
            missingCount > 0
              ? `${generated.length} kelime hazırlandı. Kalan ${missingCount} kelimeyi aynı düğmeyle tamamlayabilirsin.`
              : "Temel biçimler ve doğal Türkçe anlamlar hazırlandı. Kaydetmeden önce açıklamaları düzenleyebilirsin.",
          );
        },
      });

    pendingGlossaryGenerationRef.current = runGeneration;
    setGlossaryConfirmHasEntries(passage.glossaryEntries.length > 0);
    setGlossaryConfirmOpen(true);
  };

  const handleSave = () => {
    const payload = buildPayload(passage);
    const getSaveErrorMessage = (error: unknown) => {
      const apiError = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      return apiError.response?.data?.message ||
        apiError.response?.data?.error ||
        apiError.message ||
        "Kayıt sırasında bir hata oluştu.";
    };

    if (isEdit && id) {
      updateMutation.mutate({ id, ...payload } as UpdateReadingPractice, {
        onSuccess: () => navigate("/reading-practice"),
        onError: (error) => {
          message.error(getSaveErrorMessage(error));
        },
      });
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => navigate("/reading-practice"),
      onError: (error) => {
        message.error(getSaveErrorMessage(error));
      },
    });
  };

  const handleSelection = () => {
    const selectionApi = window.getSelection();
    const text = selectionApi?.toString().trim();
    if (!text || !selectionApi || selectionApi.rangeCount === 0 || !previewRef.current) {
      setSelection(null);
      return;
    }

    const range = selectionApi.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const previewRect = previewRef.current.getBoundingClientRect();
    const paragraphElement = range.startContainer.parentElement?.closest("[data-paragraph-label]") as HTMLElement | null;
    const paragraphLabel = paragraphElement?.dataset.paragraphLabel || "";
    if (!paragraphLabel) {
      setSelection(null);
      return;
    }

    setSelection({
      text,
      paragraphLabel,
      top: rect.top - previewRect.top - 44,
      left: rect.left - previewRect.left,
    });
  };

  const clearSelection = () => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const applyBlankTarget = () => {
    if (!selection || !activeQuestion || !currentQuestionNumber) {
      message.warning("Önce boşluk sorusunu seç ve metinden kelime işaretle.");
      return;
    }

    if (activeQuestion.groupType !== "FILL_BLANK") {
      message.warning("Boşluk hedefi sadece boşluk doldurma sorularında kullanılır.");
      return;
    }

    updateQuestion("FILL_BLANK", activeQuestion.questionIndex, (question) => {
      const meta = normalizeQuestionMeta(question);
      meta.inlineTarget = selection.text;
      meta.blankNumber = currentQuestionNumber;
      return {
        ...question,
        prompt: question.prompt || `${currentQuestionNumber}. boşluk`,
        answerKey: String(question.answerKey || selection.text),
        evidenceParagraphs: [selection.paragraphLabel],
        meta,
      };
    });
    clearSelection();
  };

  const clearActiveMarker = () => {
    if (!activeQuestion) return;
    updateQuestion(activeQuestion.groupType, activeQuestion.questionIndex, (question) => {
      const meta = normalizeQuestionMeta(question);
      delete meta.guideSnippet;
      delete meta.guideQuestionNumber;
      delete meta.inlineTarget;
      delete meta.blankNumber;
      return { ...question, meta };
    });
    clearSelection();
  };

  const allAnnotations = useMemo(() => {
    const map = new Map<string, { text: string; kind: "guide" | "blank"; number?: number }[]>();

    visibleQuestionGroups.forEach((group) => {
      group.questions.forEach((question, index) => {
        const orderNumber = questionOrders[group.type]?.[index];
        const evidenceParagraph = safeArray<string>(question.evidenceParagraphs)[0];
        const meta = normalizeQuestionMeta(question);
        const blankTarget = String(meta.inlineTarget || "").trim();

        if (blankTarget && evidenceParagraph && group.type === "FILL_BLANK") {
          const existing = map.get(evidenceParagraph) || [];
          existing.push({ text: blankTarget, kind: "blank", number: orderNumber });
          map.set(evidenceParagraph, existing);
        }
      });
    });

    return map;
  }, [questionOrders, visibleQuestionGroups]);

  const renderAnnotatedParagraph = (paragraph: ReadingPracticeParagraph) => {
    const parsed = parseBracketSyntax(paragraph.text || "");
    const plainText = parsed.plainText;
    const annotations = allAnnotations.get(paragraph.label) || [];

    if (annotations.length === 0) {
      return <span>{plainText || " "}</span>;
    }

    const usedRanges: { start: number; end: number }[] = [];
    const resolved = annotations
      .map((annotation) => {
        const start = plainText.indexOf(annotation.text);
        if (start === -1) return null;
        const end = start + annotation.text.length;
        const overlaps = usedRanges.some((range) => !(end <= range.start || start >= range.end));
        if (overlaps) return null;
        usedRanges.push({ start, end });
        return { ...annotation, start, end };
      })
      .filter(Boolean)
      .sort((a, b) => a!.start - b!.start) as Array<{
      text: string;
      kind: "guide" | "blank";
      number?: number;
      start: number;
      end: number;
    }>;

    if (resolved.length === 0) {
      return <span>{plainText || " "}</span>;
    }

    const output: React.ReactNode[] = [];
    let cursor = 0;
    resolved.forEach((item, index) => {
      if (item.start > cursor) {
        output.push(<span key={`text-${index}-${cursor}`}>{plainText.slice(cursor, item.start)}</span>);
      }

      if (item.kind === "guide") {
        output.push(
          <span
            key={`guide-${index}`}
            style={{
              background: "#d8f0c2",
              padding: "0 2px",
              borderRadius: 2,
            }}
          >
            {plainText.slice(item.start, item.end)}
            {typeof item.number === "number" ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  borderRadius: 4,
                  background: "#2f7d32",
                  color: "#fff",
                  fontSize: 11,
                  marginLeft: 4,
                  padding: "0 4px",
                  verticalAlign: "middle",
                }}
              >
                {item.number}
              </span>
            ) : null}
          </span>
        );
      } else {
        output.push(
          <span
            key={`blank-${index}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              borderBottom: "2px solid #8bb8ff",
              color: "#316cc4",
              paddingBottom: 1,
            }}
          >
            {plainText.slice(item.start, item.end)}
            {typeof item.number === "number" ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  borderRadius: 4,
                  background: "#1677ff",
                  color: "#fff",
                  fontSize: 11,
                  padding: "0 4px",
                }}
              >
                {item.number}
              </span>
            ) : null}
          </span>
        );
      }

      cursor = item.end;
    });

    if (cursor < plainText.length) {
      output.push(<span key={`tail-${cursor}`}>{plainText.slice(cursor)}</span>);
    }

    return output;
  };

  const renderQuestionEditor = (group: ReadingPracticeQuestionGroup) => {
    if (group.type === "MATCHING_HEADINGS") {
      const isSituationMatching = passage.practiceType === "SECTION" && passage.sectionNumber === 2;
      return (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {group.questions.map((question, index) => {
            const meta = normalizeQuestionMeta(question);
            const keywords = toTextArray(meta.keywords);
            const optionLetter = String.fromCharCode(65 + index);
            return (
              <Card
                key={`heading-${index}`}
                size="small"
                style={{ borderColor: activeQuestion?.groupType === group.type && activeQuestion.questionIndex === index ? "#1677ff" : undefined }}
                onClick={() => setActiveQuestion({ groupType: group.type as GroupType, questionIndex: index })}
              >
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Flex justify="space-between" align="center">
                    <Text strong>
                      {optionLetter}. {isSituationMatching ? "durum / ihtiyaç seçeneği" : "başlık seçeneği"}
                    </Text>
                    <Button type="link" danger size="small" onClick={() => removeQuestion(group.type as GroupType, index)}>
                      Sil
                    </Button>
                  </Flex>
                  <Input
                    placeholder={isSituationMatching ? "Durum veya ihtiyaç cümlesi" : "Başlık"}
                    value={question.prompt}
                    onChange={(event) =>
                      updateQuestion(group.type as GroupType, index, (item) => ({ ...item, prompt: event.target.value }))
                    }
                  />
                  <Flex gap={8}>
                    <Select
                      style={{ width: 140 }}
                      value={String(question.answerKey || "A")}
                      placeholder={isSituationMatching ? "İlan" : "Paragraf"}
                      options={passage.paragraphs.map((paragraph) => ({ value: paragraph.label, label: paragraph.label }))}
                      onChange={(value) =>
                        updateQuestion(group.type as GroupType, index, (item) => ({
                          ...item,
                          answerKey: value,
                          evidenceParagraphs: [value],
                        }))
                      }
                    />
                    <Input
                      placeholder={isSituationMatching ? "Eşleşme ipuçları (virgülle)" : "Anahtar kelimeler (virgülle)"}
                      value={keywords.join(", ")}
                      onChange={(event) =>
                        updateQuestion(group.type as GroupType, index, (item) => ({
                          ...item,
                          meta: {
                            ...normalizeQuestionMeta(item),
                            keywords: event.target.value
                              .split(",")
                              .map((value) => value.trim())
                              .filter(Boolean)
                              .slice(0, 3),
                          },
                        }))
                      }
                    />
                  </Flex>
                </Space>
              </Card>
            );
          })}
          <Button icon={<PlusOutlined />} onClick={() => addQuestion(group.type as GroupType)}>
            {isSituationMatching ? "Durum / ihtiyaç seçeneği ekle" : "Başlık seçeneği ekle"}
          </Button>
        </Space>
      );
    }

    if (group.type === "FILL_BLANK") {
      const blankPoolItems = getBlankPoolItems(group);
      const poolSize = Math.max(sectionAuthoringConfig?.blankPoolSize || 12, blankPoolItems.length);
      const paddedPoolItems = Array.from({ length: poolSize }, (_, index) => blankPoolItems[index] || "");

      return (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Alert type="info" showIcon message="Bu bölümde yeşil vurgu yok. Metinden seçip boşluk hedefi olarak kaydet." />
          <Card size="small" title="Ortak kelime havuzu">
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Text type="secondary">
                {sectionAuthoringConfig?.blankPoolSize
                  ? `${sectionAuthoringConfig.blankPoolSize} kelimelik A-H havuzunu gir. İki seçenek kullanılmayacak.`
                  : "Kelime havuzunu aşağıya tek tek gir. İstersen fazlasını da ekleyebilirsin."}
              </Text>
              <Row gutter={[8, 8]}>
                {paddedPoolItems.map((value, poolIndex) => (
                  <Col xs={24} sm={12} key={`pool-${poolIndex}`}>
                    <Input
                      placeholder={`${poolIndex + 1}. kelime`}
                      value={value}
                      onChange={(event) =>
                        updateGroupQuestions("FILL_BLANK", (questions) => {
                          const nextValues = [...paddedPoolItems];
                          nextValues[poolIndex] = event.target.value;
                          const nextGroup = { ...group, questions: questions.map((question) => ({ ...question })) };
                          setSharedBlankPoolItems(nextGroup, nextValues);
                          return nextGroup.questions;
                        })
                      }
                    />
                  </Col>
                ))}
              </Row>
            </Space>
          </Card>
          {group.questions.map((question, index) => {
            const meta = normalizeQuestionMeta(question);
            return (
              <Card
                key={`blank-${index}`}
                size="small"
                style={{ borderColor: activeQuestion?.groupType === group.type && activeQuestion.questionIndex === index ? "#1677ff" : undefined }}
                onClick={() => setActiveQuestion({ groupType: group.type as GroupType, questionIndex: index })}
              >
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Flex justify="space-between" align="center">
                    <Text strong>{questionOrders[group.type]?.[index]}. kayıt</Text>
                    <Space size={8}>
                      <Text type="secondary">{meta.inlineTarget ? "Önizleme hedefi var" : "Önizleme hedefi yok"}</Text>
                      <Button type="link" danger size="small" onClick={() => removeQuestion(group.type as GroupType, index)}>
                        Sil
                      </Button>
                    </Space>
                  </Flex>
                  <Flex gap={8}>
                    <Select
                      style={{ width: 140 }}
                      value={safeArray<string>(question.evidenceParagraphs)[0] || passage.paragraphs[0]?.label}
                      options={passage.paragraphs.map((paragraph) => ({ value: paragraph.label, label: paragraph.label }))}
                      onChange={(value) =>
                        updateQuestion(group.type as GroupType, index, (item) => ({
                          ...item,
                          evidenceParagraphs: [value],
                        }))
                      }
                    />
                    <Input
                      placeholder="Doğru cevap"
                      value={String(question.answerKey || "")}
                      onChange={(event) =>
                        updateQuestion(group.type as GroupType, index, (item) => ({ ...item, answerKey: event.target.value }))
                      }
                    />
                  </Flex>
                  <Input
                    placeholder="Metinden seçince buraya otomatik gelir"
                    value={String(meta.inlineTarget || "")}
                    onChange={(event) =>
                      updateQuestion(group.type as GroupType, index, (item) => ({
                        ...item,
                        meta: {
                          ...normalizeQuestionMeta(item),
                          inlineTarget: event.target.value,
                        },
                      }))
                    }
                  />
                </Space>
              </Card>
            );
          })}
          <Button icon={<PlusOutlined />} onClick={() => addQuestion(group.type as GroupType)}>
            Boşluk ekle
          </Button>
        </Space>
      );
    }

    if (group.type === "MULTIPLE_CHOICE") {
      return (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {group.questions.map((question, index) => {
            const options = [...toTextArray(question.options), "", "", "", ""].slice(0, 4);
            return (
              <Card
                key={`mcq-${index}`}
                size="small"
                style={{ borderColor: activeQuestion?.groupType === group.type && activeQuestion.questionIndex === index ? "#1677ff" : undefined }}
                onClick={() => setActiveQuestion({ groupType: group.type as GroupType, questionIndex: index })}
              >
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Flex justify="space-between" align="center">
                    <Text strong>{questionOrders[group.type]?.[index]}. soru</Text>
                    <Button type="link" danger size="small" onClick={() => removeQuestion(group.type as GroupType, index)}>
                      Sil
                    </Button>
                  </Flex>
                  <TextArea
                    rows={2}
                    placeholder="Soru"
                    value={question.prompt}
                    onChange={(event) =>
                      updateQuestion(group.type as GroupType, index, (item) => ({ ...item, prompt: event.target.value }))
                    }
                  />
                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    {options.map((option, optionIndex) => (
                      <Flex key={`option-${optionIndex}`} gap={8} align="center">
                        <Tag style={{ marginInlineEnd: 0 }}>{String.fromCharCode(65 + optionIndex)}</Tag>
                        <Input
                          value={option}
                          onChange={(event) =>
                            updateQuestion(group.type as GroupType, index, (item) => {
                              const nextOptions = [...options];
                              nextOptions[optionIndex] = event.target.value;
                              return { ...item, options: nextOptions };
                            })
                          }
                        />
                      </Flex>
                    ))}
                  </Space>
                  <Flex gap={8}>
                    <Select
                      style={{ width: 120 }}
                      value={String(question.answerKey || "A")}
                      options={["A", "B", "C", "D"].map((value) => ({ value, label: value }))}
                      onChange={(value) =>
                        updateQuestion(group.type as GroupType, index, (item) => ({ ...item, answerKey: value }))
                      }
                    />
                    <Select
                      style={{ width: 140 }}
                      value={safeArray<string>(question.evidenceParagraphs)[0] || undefined}
                      placeholder="Paragraf"
                      options={passage.paragraphs.map((paragraph) => ({ value: paragraph.label, label: paragraph.label }))}
                      onChange={(value) =>
                        updateQuestion(group.type as GroupType, index, (item) => ({
                          ...item,
                          evidenceParagraphs: value ? [value] : [],
                        }))
                      }
                    />
                  </Flex>
                </Space>
              </Card>
            );
          })}
          <Button icon={<PlusOutlined />} onClick={() => addQuestion(group.type as GroupType)}>
            Çoktan seçmeli soru ekle
          </Button>
        </Space>
      );
    }

    if (group.type === "TRUE_FALSE_NOT_GIVEN") {
      return (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {group.questions.map((question, index) => (
            <Card
              key={`tf-${index}`}
              size="small"
              style={{ borderColor: activeQuestion?.groupType === group.type && activeQuestion.questionIndex === index ? "#1677ff" : undefined }}
              onClick={() => setActiveQuestion({ groupType: group.type as GroupType, questionIndex: index })}
            >
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Flex justify="space-between" align="center">
                  <Text strong>{questionOrders[group.type]?.[index]}. soru</Text>
                  <Button type="link" danger size="small" onClick={() => removeQuestion(group.type as GroupType, index)}>
                    Sil
                  </Button>
                </Flex>
                <TextArea
                  rows={2}
                  placeholder="İfade"
                  value={question.prompt}
                  onChange={(event) =>
                    updateQuestion(group.type as GroupType, index, (item) => ({ ...item, prompt: event.target.value }))
                  }
                />
                <Flex gap={8}>
                  <Select
                    style={{ width: 190 }}
                    value={String(question.answerKey || "Doğru")}
                    options={["Doğru", "Yanlış", "Verilmemiş"].map((value) => ({ value, label: value }))}
                    onChange={(value) =>
                      updateQuestion(group.type as GroupType, index, (item) => ({ ...item, answerKey: value }))
                    }
                  />
                  <Select
                    style={{ width: 140 }}
                    value={safeArray<string>(question.evidenceParagraphs)[0] || undefined}
                    placeholder="Paragraf"
                    options={passage.paragraphs.map((paragraph) => ({ value: paragraph.label, label: paragraph.label }))}
                    onChange={(value) =>
                      updateQuestion(group.type as GroupType, index, (item) => ({
                        ...item,
                        evidenceParagraphs: value ? [value] : [],
                      }))
                    }
                  />
                </Flex>
              </Space>
            </Card>
          ))}
          <Button icon={<PlusOutlined />} onClick={() => addQuestion(group.type as GroupType)}>
            Doğru / Yanlış / Verilmemiş sorusu ekle
          </Button>
        </Space>
      );
    }

    if (group.type === "PARAGRAPH_REFERENCE") {
      return (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {group.questions.map((question, index) => (
            <Card
              key={`pr-${index}`}
              size="small"
              style={{ borderColor: activeQuestion?.groupType === group.type && activeQuestion.questionIndex === index ? "#1677ff" : undefined }}
              onClick={() => setActiveQuestion({ groupType: group.type as GroupType, questionIndex: index })}
            >
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Flex justify="space-between" align="center">
                  <Text strong>{questionOrders[group.type]?.[index]}. soru</Text>
                  <Button type="link" danger size="small" onClick={() => removeQuestion(group.type as GroupType, index)}>
                    Sil
                  </Button>
                </Flex>
                <TextArea
                  rows={2}
                  placeholder="İfade"
                  value={question.prompt}
                  onChange={(event) =>
                    updateQuestion(group.type as GroupType, index, (item) => ({ ...item, prompt: event.target.value }))
                  }
                />
                <Select
                  style={{ width: 140 }}
                  value={String(question.answerKey || "A")}
                  options={passage.paragraphs.map((paragraph) => ({ value: paragraph.label, label: paragraph.label }))}
                  onChange={(value) =>
                    updateQuestion(group.type as GroupType, index, (item) => ({
                      ...item,
                      answerKey: value,
                      evidenceParagraphs: [value],
                    }))
                  }
                />
              </Space>
            </Card>
          ))}
          <Button icon={<PlusOutlined />} onClick={() => addQuestion(group.type as GroupType)}>
            Paragraf sorusu ekle
          </Button>
        </Space>
      );
    }

    const synonymQuestions = group.questions.filter(
      (question) => normalizeQuestionMeta(question).altBolum !== "zit-anlamli"
    );
    const antonymQuestions = group.questions.filter(
      (question) => normalizeQuestionMeta(question).altBolum === "zit-anlamli"
    );

    const renderVocabSection = (
      title: string,
      subtype: "es-anlamli" | "zit-anlamli",
      questions: ReadingPracticeQuestion[]
    ) => (
      <Card size="small" title={title}>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {questions.map((question) => {
            const index = group.questions.findIndex((item) => item === question);
            return (
              <Card
                key={`vocab-${subtype}-${index}`}
                size="small"
                style={{ borderColor: activeQuestion?.groupType === group.type && activeQuestion.questionIndex === index ? "#1677ff" : undefined }}
                onClick={() => setActiveQuestion({ groupType: group.type as GroupType, questionIndex: index })}
              >
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Flex justify="space-between" align="center">
                    <Text strong>{questionOrders[group.type]?.[index]}. soru</Text>
                    <Button type="link" danger size="small" onClick={() => removeQuestion(group.type as GroupType, index)}>
                      Sil
                    </Button>
                  </Flex>
                  <Input
                    placeholder="Soru kelimesi"
                    value={question.prompt}
                    onChange={(event) =>
                      updateQuestion(group.type as GroupType, index, (item) => ({ ...item, prompt: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Doğru cevap"
                    value={String(question.answerKey || "")}
                    onChange={(event) =>
                      updateQuestion(group.type as GroupType, index, (item) => ({ ...item, answerKey: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Kısa açıklama"
                    value={String(question.explanation || "")}
                    onChange={(event) =>
                      updateQuestion(group.type as GroupType, index, (item) => ({ ...item, explanation: event.target.value }))
                    }
                  />
                </Space>
              </Card>
            );
          })}
          <Button icon={<PlusOutlined />} onClick={() => addQuestion(group.type as GroupType, subtype)}>
            {title} için soru ekle
          </Button>
        </Space>
      </Card>
    );

    return (
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {renderVocabSection("Eş anlamlılar", "es-anlamli", synonymQuestions)}
        {renderVocabSection("Zıt anlamlılar", "zit-anlamli", antonymQuestions)}
      </Space>
    );
  };

  const handleImageUpload = (file: File) => {
    uploadMutation.mutate(file, {
      onSuccess: (response) => {
        setPassageValue((draft) => {
          draft.coverImageUrl =
            response?.data?.url ||
            response?.data?.reference ||
            draft.coverImageUrl;
          return draft;
        });
        setImageModalOpen(false);
      },
    });
    return false;
  };

  if (isEdit && (isLoading || source?.practiceType === "SECTION")) {
    return <Card loading />;
  }

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Flex justify="space-between" align="center">
          <Space align="center">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/reading-practice")}>
              Geri
            </Button>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                {isEdit ? "Kapsamlı okuma çalışmasını düzenle" : "Yeni kapsamlı okuma çalışması"}
              </Title>
              <Text type="secondary">Metni ekle, sözlüğü hazırla ve soru gruplarını doldur.</Text>
            </div>
          </Space>
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => setShowPreview((current) => !current)}>
              {showPreview ? "Önizlemeyi kapat" : "Önizleme"}
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={handleSave}
            >
              Kaydet
            </Button>
          </Space>
        </Flex>

        <Card title="1. Temel bilgiler">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Input
                  placeholder="Pratik adı"
                  value={passage.title}
                  onChange={(event) => setPassageValue((draft) => ({ ...draft, title: event.target.value }))}
                />
                <Input
                  placeholder="Metin başlığı (öğrenci)"
                  value={passage.passageTitle}
                  onChange={(event) => setPassageValue((draft) => ({ ...draft, passageTitle: event.target.value }))}
                />
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Row gutter={12}>
                <Col span={8}>
                  <Select
                    style={{ width: "100%" }}
                    value={passage.level}
                    options={LEVEL_OPTIONS.map((value) => ({ value, label: value }))}
                    onChange={(value) => setPassageValue((draft) => ({ ...draft, level: value }))}
                  />
                </Col>
                <Col span={8}>
                  <Flex align="center" gap={8} style={{ height: 32 }}>
                    <Text>Yayında</Text>
                    <ContentAccessControls target={{scope:"PRACTICE_READING",targetId:id}} row={source??{isPublished:false}}/>
                    <Switch
                      checked={passage.isPublished}
                      onChange={(checked) => setPassageValue((draft) => ({ ...draft, isPublished: checked }))}
                    />
                  </Flex>
                </Col>
              </Row>
              <Row gutter={12} style={{ marginTop: 12 }}>
                <Col span={8}>
                  <Flex align="center" gap={8} style={{ height: 32 }}>
                    <Text>Aboneliksiz erişim</Text>
                    <ManagedLegacyAccess target={{scope:"PRACTICE_READING",targetId:id}}>
                    <Switch
                      checked={Boolean(passage.isFreeAccess)}
                      onChange={(checked) => setPassageValue((draft) => ({ ...draft, isFreeAccess: checked }))}
                    />
                    </ManagedLegacyAccess>
                  </Flex>
                </Col>
                <Col span={8}>
                  <Button icon={<UploadOutlined />} block onClick={() => setImageModalOpen(true)}>
                    Görsel yükle
                  </Button>
                </Col>
              </Row>
              <Input
                style={{ marginTop: 12 }}
                placeholder="Kapak görseli URL"
                value={passage.coverImageUrl}
                onChange={(event) => setPassageValue((draft) => ({ ...draft, coverImageUrl: event.target.value }))}
              />
            </Col>
          </Row>
          {sectionAuthoringConfig ? (
            <div style={{ marginTop: 16 }}>
              <Text strong>Öğrenciye gösterilecek bölüm açıklaması</Text>
              <TextArea
                rows={2}
                style={{ marginTop: 6 }}
                value={passage.description}
                placeholder={sectionAuthoringConfig.description}
                onChange={(event) =>
                  setPassageValue((draft) => ({ ...draft, description: event.target.value }))
                }
              />
            </div>
          ) : null}
        </Card>

        {showPreview ? (
        <Card
          title="4. Öğrenci önizlemesi"
          extra={currentQuestionNumber ? <Tag color="blue">Aktif soru: {currentQuestionNumber}</Tag> : null}
        >
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <div
                ref={previewRef}
                style={{
                  position: "relative",
                  border: "1px solid #f0f0f0",
                  borderRadius: 12,
                  padding: 20,
                  height: "70vh",
                  overflowY: "auto",
                  background: "#fff",
                }}
                onMouseUp={handleSelection}
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Alert
                    type={activeQuestionDetail ? "success" : "info"}
                    showIcon
                    message={
                      activeQuestionDetail
                        ? `${activeQuestionDetail.number}. soru için metin üstünde işaretleme yapabilirsin`
                        : "Önce sağdan soru seç"
                    }
                    description={
                      activeQuestionDetail
                        ? getAllowedMarkerLabel(activeQuestionDetail.group.type as GroupType)
                        : "Soruyu seçtikten sonra metinden cümle veya kelime işaretle."
                    }
                  />
                  <Title level={4} style={{ margin: 0 }}>
                    {passage.title || "Başlık"}
                  </Title>
                  {passage.passageTitle ? (
                    <Text type="secondary" style={{ fontSize: 16 }}>
                      {passage.passageTitle}
                    </Text>
                  ) : null}
                  {passage.paragraphs.map((paragraph) => (
                    <div
                      key={paragraph.label}
                      data-paragraph-label={paragraph.label}
                      style={{ lineHeight: 1.9, fontSize: 16 }}
                    >
                      <Text strong style={{ fontSize: 18, marginRight: 8 }}>
                        {paragraph.label}
                      </Text>
                      <span>{renderAnnotatedParagraph(paragraph)}</span>
                    </div>
                  ))}
                </Space>

                {selection ? (
                  <div
                    style={{
                      position: "absolute",
                      top: Math.max(selection.top, 8),
                      left: Math.max(selection.left, 8),
                      background: "#fff",
                      border: "1px solid #d9d9d9",
                      borderRadius: 12,
                      padding: 10,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      zIndex: 10,
                    }}
                  >
                    <Space direction="vertical" size={8}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {currentQuestionNumber ? `${currentQuestionNumber}. soru seçili` : "Önce soru seç"}
                      </Text>
                      <Space size={8}>
                        {activeQuestion?.groupType === "FILL_BLANK" ? (
                          <Button size="small" icon={<BookOutlined />} onClick={applyBlankTarget}>
                            Boşluk hedefi yap
                          </Button>
                        ) : null}
                        {activeQuestion ? (
                          <Button size="small" danger icon={<DeleteOutlined />} onClick={clearActiveMarker}>
                            İşareti temizle
                          </Button>
                        ) : null}
                      </Space>
                    </Space>
                  </div>
                ) : null}
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div
                style={{
                  border: "1px solid #f0f0f0",
                  borderRadius: 12,
                  padding: 20,
                  height: "70vh",
                  overflowY: "auto",
                  background: "#fff",
                }}
              >
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Alert
                    type={activeQuestionDetail ? "success" : "info"}
                    showIcon
                    message={
                      activeQuestionDetail
                        ? `${activeQuestionDetail.number}. ${getGroupQuestionKindLabel(activeQuestionDetail.group.type as GroupType)} sorusu seçili`
                        : "Önizleme bağlantısı için önce bir soru seç"
                    }
                    description={
                      activeQuestionDetail
                        ? getAllowedMarkerLabel(activeQuestionDetail.group.type as GroupType)
                        : "Sağdaki soru kartına tıkla, sonra soldaki metinden ifade seç."
                    }
                  />
                  {previewQuestions.length === 0 ? (
                    <Empty description="Sorular burada görünür" />
                  ) : (
                    previewQuestions.map((question) => (
                      <div
                        key={`${question.groupType}-${question.previewNumber}`}
                        onClick={() => selectPreviewQuestion(question.groupType as GroupType, question.order)}
                        style={{
                          padding: "12px 14px",
                          borderBottom: "1px solid #f5f5f5",
                          borderRadius: 12,
                          cursor: "pointer",
                          border:
                            activeQuestion?.groupType === question.groupType &&
                            currentQuestionNumber === question.previewNumber
                              ? "1px solid #1677ff"
                              : "1px solid transparent",
                          background:
                            activeQuestion?.groupType === question.groupType &&
                            currentQuestionNumber === question.previewNumber
                              ? "#f0f7ff"
                              : "transparent",
                        }}
                      >
                        <Text strong style={{ display: "block", marginBottom: 6 }}>
                          {question.previewNumber}. {question.prompt || `${question.groupTitle} sorusu`}
                        </Text>
                        {question.groupType === "MULTIPLE_CHOICE" ? (
                          <Space direction="vertical" size={4} style={{ width: "100%" }}>
                            {toTextArray(question.options).map((option, index) => (
                              <Text key={`${question.previewNumber}-opt-${index}`}>
                                {String.fromCharCode(65 + index)}. {option}
                              </Text>
                            ))}
                          </Space>
                        ) : question.groupType === "TRUE_FALSE_NOT_GIVEN" ? (
                          <Text type="secondary">Doğru / Yanlış / Verilmemiş</Text>
                        ) : question.groupType === "PARAGRAPH_REFERENCE" ? (
                          <Text type="secondary">Paragraf seçimi</Text>
                        ) : question.groupType === "FILL_BLANK" ? (
                          <Text type="secondary">Boşluk hedefi: {String(normalizeQuestionMeta(question).inlineTarget || "-")}</Text>
                        ) : question.groupType === "MATCHING_HEADINGS" ? (
                          <Text type="secondary">Paragraf: {String(question.answerKey || "-")}</Text>
                        ) : (
                          <Text type="secondary">Kelime: {String(question.answerKey || "-")}</Text>
                        )}
                      </div>
                    ))
                  )}
                </Space>
              </div>
            </Col>
          </Row>
        </Card>
        ) : null}

        <Row gutter={16}>
          <Col xs={24} xl={10}>
            <Card title="2. Metin ve sözlük">
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Card
                  size="small"
                  title={sectionAuthoringConfig?.paragraphTitle || "Paragraflar"}
                  extra={
                    sectionAuthoringConfig ? (
                      <Tag>{sectionAuthoringConfig.paragraphLabels.length} metin alanı</Tag>
                    ) : null
                  }
                >
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {passage.paragraphs.map((paragraph, index) => (
                      <Card key={paragraph.label} size="small">
                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                          <Flex gap={8}>
                            <Input
                              style={{ width: 88 }}
                              value={paragraph.label}
                              onChange={(event) => handleParagraphChange(index, "label", event.target.value)}
                            />
                            <Button danger onClick={() => removeParagraph(index)}>
                              Sil
                            </Button>
                          </Flex>
                          <TextArea
                            rows={6}
                            value={paragraph.text}
                            onChange={(event) => handleParagraphChange(index, "text", event.target.value)}
                            placeholder={
                              sectionAuthoringConfig?.paragraphPlaceholder ||
                              "Metin. Boşluk hedefini hızlı işaretlemek için [[kelime]] yazabilirsin."
                            }
                          />
                        </Space>
                      </Card>
                    ))}
                    <Button icon={<PlusOutlined />} onClick={addParagraph}>
                      Paragraf ekle
                    </Button>
                  </Space>
                </Card>

                <Card
                  size="small"
                  title="Sözlük"
                  extra={
                    <Button
                      type="primary"
                      size="small"
                      icon={<RobotOutlined />}
                      loading={generateGlossaryMutation.isPending}
                      onClick={handleGenerateGlossary}
                    >
                      {passage.glossaryEntries.length ? "Eksik kelimeleri AI ile tamamla" : "AI ile sözlük hazırla"}
                    </Button>
                  }
                >
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    <Alert
                      type="info"
                      showIcon
                      message="Onayla, kontrol et ve kaydet"
                      description="Yapay zekâ her kelime için temel biçimi ve doğal Türkçe anlamını hazırlar. Önce genel anlam, gerekiyorsa alan anlamı ve yararlı köken bilgisi verilir; metindeki kullanım ve örnek cümle ayrıca üretilmez. Düğmeye bastığında ücretli istek gönderilmeden önce onayın alınır."
                    />
                    {passage.glossaryEntries.map((entry, index) => (
                      <Card key={`glossary-${index}`} size="small">
                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                          <Flex justify="space-between" align="center">
                            <Text strong>{index + 1}. kayıt</Text>
                            <Button type="link" danger size="small" onClick={() => removeGlossaryEntry(index)}>
                              Sil
                            </Button>
                          </Flex>
                          <Input
                            placeholder="Metinde geçen kelime"
                            value={entry.term}
                            onChange={(event) => handleGlossaryChange(index, "term", event.target.value)}
                          />
                          <Input
                            placeholder="Temel biçim (isteğe bağlı)"
                            value={entry.baseForm || ""}
                            onChange={(event) => handleGlossaryChange(index, "baseForm", event.target.value)}
                          />
                          <TextArea
                            rows={2}
                            placeholder="Anlamı (isteğe bağlı)"
                            value={entry.baseMeaning || entry.definition || ""}
                            onChange={(event) => handleGlossaryChange(index, "baseMeaning", event.target.value)}
                          />
                          <Select
                            allowClear
                            style={{ width: "100%" }}
                            placeholder="Kelimenin geçtiği metin / paragraf"
                            value={entry.paragraphLabel || undefined}
                            options={passage.paragraphs.map((paragraph) => ({
                              value: paragraph.label,
                              label: paragraph.label,
                            }))}
                            onChange={(value) => handleGlossaryChange(index, "paragraphLabel", value || "")}
                          />
                        </Space>
                      </Card>
                    ))}
                    <Button icon={<PlusOutlined />} onClick={addGlossaryEntry}>
                      Sözlük maddesi ekle
                    </Button>
                  </Space>
                </Card>
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={14}>
            <Card title="3. Sorular">
              <div style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff", paddingBottom: 12 }}>
                <Alert
                  type={activeQuestionDetail ? "success" : "warning"}
                  showIcon
                  message={
                    activeQuestionDetail
                      ? `${activeQuestionDetail.number}. soru düzenleniyor`
                      : "Henüz aktif soru seçilmedi"
                  }
                  description={
                    activeQuestionDetail
                      ? `${activeQuestionDetail.group.title} içinde çalışıyorsun. ${getAllowedMarkerLabel(
                          activeQuestionDetail.group.type as GroupType
                        )}`
                      : "Sağdaki soru kartlarından birine tıkla. Sonra soldaki önizlemeden cümle veya kelime seç."
                  }
                />
              </div>
              <div style={{ maxHeight: "64vh", overflowY: "auto", paddingRight: 8 }}>
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  {visibleQuestionGroups.map((group) => (
                    <Card
                      key={group.type}
                      title={
                        passage.practiceType === "SECTION"
                          ? getSectionGroupTitle(passage.sectionNumber, group.type as GroupType) || group.title
                          : group.title
                      }
                      extra={
                        <Text type="secondary">
                          {passage.practiceType === "SECTION"
                            ? getSectionGroupConfig(passage.sectionNumber, group.type as GroupType)?.instructions || group.instructions
                            : group.instructions}
                        </Text>
                      }
                    >
                      {renderQuestionEditor(group)}
                    </Card>
                  ))}
                </Space>
              </div>
            </Card>
          </Col>
        </Row>
      </Space>

      <Modal open={imageModalOpen} title="Kapak görseli yükle" onCancel={() => setImageModalOpen(false)} footer={null}>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Paragraph type="secondary">Görsel seçildiğinde kapak alanına otomatik yerleştirilir.</Paragraph>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleImageUpload(file);
              }
            }}
          />
        </Space>
      </Modal>
      <Modal
        open={glossaryConfirmOpen}
        title="AI ile sözlük hazırlansın mı?"
        okText="Evet, sözlüğü hazırla"
        cancelText="Vazgeç"
        okButtonProps={{ autoFocus: false }}
        cancelButtonProps={{ autoFocus: true }}
        confirmLoading={generateGlossaryMutation.isPending}
        onCancel={() => {
          pendingGlossaryGenerationRef.current = null;
          setGlossaryConfirmOpen(false);
        }}
        onOk={() => {
          const runGeneration = pendingGlossaryGenerationRef.current;
          pendingGlossaryGenerationRef.current = null;
          setGlossaryConfirmOpen(false);
          runGeneration?.();
        }}
      >
        <Paragraph>
          {glossaryConfirmHasEntries
            ? "Bu işlem eksik kelimeler için ücretli yapay zekâ isteği gönderir. Sonuçlar yalnız editöre alınır; Kaydet'e basmadan kayıt değişmez."
            : "Bu işlem bütün kelimeler için ücretli yapay zekâ isteği gönderir. Sonuçlar yalnız editöre alınır; Kaydet'e basmadan kayıt değişmez."}
        </Paragraph>
      </Modal>
    </div>
  );
}

export default ReadingPracticeEditor;
