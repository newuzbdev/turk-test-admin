import ContentAccessControls, { ManagedLegacyAccess } from "@/components/access/ContentAccessControls";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { App, Button, Modal, Popover, Spin, Upload } from "antd";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ImagePlus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
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
  ReadingPracticePassage,
  ReadingPracticeQuestion,
  ReadingPracticeQuestionGroup,
} from "@/utils/types/types";
import {
  READING_SECTION_CONFIG,
  buildGlossarySupplementaryParagraphs,
  createSectionPracticeDraft,
  glossaryOptionParagraphLabel,
  hydrateSectionPracticeDraft,
  mergeGeneratedGlossaryEntries,
  serializeSectionPracticeDraft,
  switchSectionPracticeDraft,
  validateSectionPracticeDraft,
  type ReadingPracticeGroupType,
  type ReadingSectionNumber,
} from "./reading-practice-section-model";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "MULTILEVEL"];
const OPTION_LETTERS = ["A", "B", "C", "D"];

const clone = <T,>(value: T): T => structuredClone(value);
const clean = (value: unknown) => String(value ?? "").trim();
const escapePattern = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const imagePositionPercent = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 50;
};

const fieldClass =
  "h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100";
const textareaClass =
  "w-full resize-y rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100";

const unwrapPassage = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  const item = value as { data?: unknown };
  return (
    item.data && typeof item.data === "object" ? item.data : item
  ) as ReadingPracticePassage;
};

const optionBank = (value: unknown, letters: string[]) => {
  const items = Array.isArray(value) ? value : [];
  return letters.map((letter, index) => {
    const item = items[index];
    if (item && typeof item === "object") {
      const object = item as Record<string, unknown>;
      return {
        value: letter,
        label: String(object.label ?? object.text ?? ""),
      };
    }
    return { value: letter, label: typeof item === "string" ? item : "" };
  });
};

const textOptions = (value: unknown, count = 4) => {
  const items = Array.isArray(value) ? value : [];
  return Array.from({ length: count }, (_, index) => {
    const item = items[index];
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const option = item as Record<string, unknown>;
      return String(option.label ?? option.text ?? "");
    }
    return String(item ?? "");
  });
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">
    {children}
  </span>
);

function ReadingPracticeSectionEditor() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [draft, setDraft] = useState<CreateReadingPractice>(() =>
    createSectionPracticeDraft(1),
  );
  const [activeGlossaryKey, setActiveGlossaryKey] = useState("");
  const [glossaryConfirmOpen, setGlossaryConfirmOpen] = useState(false);
  const [glossaryConfirmHasEntries, setGlossaryConfirmHasEntries] =
    useState(false);
  const pendingGlossaryGenerationRef = useRef<null | (() => void)>(null);

  const query = useGetOneReadingPractice(id);
  const hasFreshEditRecord =
    !isEdit ||
    (query.isFetchedAfterMount && !query.isFetching && !query.isError);
  const createMutation = useCreateReadingPractice();
  const updateMutation = useUpdateReadingPractice();
  const glossaryMutation = useGenerateReadingPracticeGlossary();
  const uploadMutation = useFileUpload();

  useEffect(() => {
    if (!hasFreshEditRecord) return;
    const passage = unwrapPassage(query.data);
    if (!passage) return;
    if (passage.practiceType !== "SECTION") {
      message.error(
        "Bu kayıt kapsamlı metin çalışmasıdır. Eski editörde açılıyor.",
      );
      navigate(`/reading-practice/${passage.id}/edit`, { replace: true });
      return;
    }
    setDraft(hydrateSectionPracticeDraft(passage));
  }, [hasFreshEditRecord, message, navigate, query.data]);

  const sectionNumber = (draft.sectionNumber || 1) as ReadingSectionNumber;
  const section = READING_SECTION_CONFIG[sectionNumber];
  const serializedPreview = useMemo(
    () => serializeSectionPracticeDraft(draft),
    [draft],
  );
  const textImageParagraph = draft.paragraphs.find((paragraph) =>
    clean(paragraph.imageUrl),
  );
  const textImageUrl = textImageParagraph?.imageUrl || "";
  const textImagePositionX = imagePositionPercent(
    textImageParagraph?.imagePositionX,
  );
  const textImagePositionY = imagePositionPercent(
    textImageParagraph?.imagePositionY,
  );

  const updateDraft = (updater: (next: CreateReadingPractice) => void) => {
    setDraft((current) => {
      const next = clone(current);
      updater(next);
      return next;
    });
  };

  const updateTextImagePosition = (x: number, y: number) => {
    updateDraft((next) => {
      const paragraph =
        next.paragraphs.find((item) => clean(item.imageUrl)) ||
        next.paragraphs[0];
      if (!paragraph) return;
      paragraph.imagePositionX = imagePositionPercent(x);
      paragraph.imagePositionY = imagePositionPercent(y);
    });
  };

  const updateTextImagePositionFromPointer = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    updateTextImagePosition(x, y);
  };

  const updateGroup = (
    type: ReadingPracticeGroupType,
    updater: (group: ReadingPracticeQuestionGroup) => void,
  ) => {
    updateDraft((next) => {
      const group = next.questionGroups.find((item) => item.type === type);
      if (group) updater(group);
    });
  };

  const updateQuestion = (
    type: ReadingPracticeGroupType,
    index: number,
    updater: (question: ReadingPracticeQuestion) => void,
  ) => {
    updateGroup(type, (group) => {
      if (group.questions[index]) updater(group.questions[index]);
    });
  };

  const chooseSection = (value: ReadingSectionNumber) => {
    if (value === sectionNumber) return;
    const hasContent = draft.paragraphs.some((item) => item.text.trim());
    const apply = () => {
      setActiveGlossaryKey("");
      setDraft((current) => switchSectionPracticeDraft(current, value));
    };
    if (!hasContent) {
      apply();
      return;
    }
    Modal.confirm({
      title: "Okuma bölümü değiştirilsin mi?",
      content:
        "Bu bölüme yazdığınız metin ve sorular temizlenecek. Başlık ve kapak bilgileri korunacak.",
      okText: "Bölümü değiştir",
      cancelText: "Vazgeç",
      onOk: apply,
    });
  };

  const uploadImage = async (file: File, onDone: (url: string) => void) => {
    const response = await uploadMutation.mutateAsync(file);
    const url = clean(response?.data?.url || response?.data?.reference);
    if (!url) {
      message.error("Görsel adresi alınamadı.");
      return false;
    }
    onDone(url);
    return false;
  };

  const generateGlossary = () => {
    const paragraphs = serializedPreview.paragraphs.filter((item) =>
      item.text.trim(),
    );
    if (!paragraphs.length) {
      message.warning("Önce metni yazın.");
      return;
    }
    const additionalTerms = Array.from(
      new Map(
        serializedPreview.questionGroups
          .filter((group) => group.type === "FILL_BLANK")
          .flatMap((group) =>
            group.questions.flatMap((question) =>
              (Array.isArray(question.options) ? question.options : []).map(
                (option) => {
                  const term =
                    typeof option === "string"
                      ? option.trim()
                      : option && typeof option === "object"
                        ? clean(
                            (option as Record<string, unknown>).value ??
                              (option as Record<string, unknown>).label,
                          )
                        : "";
                  const paragraphLabel = Array.isArray(
                    question.evidenceParagraphs,
                  )
                    ? clean(question.evidenceParagraphs[0])
                    : paragraphs[0]?.label || "";
                  return { term, paragraphLabel };
                },
              ),
            ),
          )
          .filter((item) => item.term)
          .map((item) => [
            `${item.paragraphLabel}:${item.term.toLocaleLowerCase("tr")}`,
            item,
          ]),
      ).values(),
    );
    const optionParagraphs = buildGlossarySupplementaryParagraphs(
      serializedPreview.questionGroups,
    );
    const request = {
      title: draft.title,
      level: draft.level,
      paragraphs: [...paragraphs, ...optionParagraphs],
      additionalTerms,
      existingEntries: draft.glossaryEntries
        .filter(
          (entry) =>
            clean(entry.term) &&
            Boolean(
              clean(entry.definition) ||
              clean(entry.baseMeaning) ||
              clean(entry.contextMeaning),
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
      glossaryMutation.mutate(request, {
        onSuccess: (response) => {
          const generated = Array.isArray(response?.entries)
            ? response.entries
            : [];
          updateDraft((next) => {
            next.glossaryEntries = mergeGeneratedGlossaryEntries(
              next.glossaryEntries,
              generated,
            );
          });
          const missingCount = Number(response?.missingCount || 0);
          message.success(
            missingCount > 0
              ? `${generated.length} kelime hazırlandı. Kalan ${missingCount} kelimeyi aynı düğmeyle tamamlayabilirsiniz.`
              : "Temel biçimler ve doğal Türkçe anlamlar hazırlandı. Altı çizili kelimelere tıklayarak düzenleyebilirsiniz.",
          );
        },
      });

    pendingGlossaryGenerationRef.current = runGeneration;
    setGlossaryConfirmHasEntries(draft.glossaryEntries.length > 0);
    setGlossaryConfirmOpen(true);
  };

  const updateGlossary = (
    index: number,
    key: keyof ReadingPracticeGlossaryEntry,
    value: string,
  ) => {
    updateDraft((next) => {
      next.glossaryEntries[index] = {
        ...next.glossaryEntries[index],
        [key]: value,
      };
      if (key === "baseMeaning") {
        next.glossaryEntries[index].definition = value;
        next.glossaryEntries[index].simpleDefinition = value;
        next.glossaryEntries[index].contextMeaning = "";
        next.glossaryEntries[index].example = "";
      }
    });
  };

  const removeGlossary = (index: number) => {
    updateDraft((next) => {
      next.glossaryEntries.splice(index, 1);
      next.glossaryEntries.forEach((entry, itemIndex) => {
        entry.order = itemIndex + 1;
      });
    });
    setActiveGlossaryKey("");
  };

  const glossaryEditor = (
    entry: ReadingPracticeGlossaryEntry,
    index: number,
  ) => (
    <div className="w-[360px] space-y-3 p-1">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          Sözlük kelimesi
        </p>
        <p className="mt-1 text-base font-semibold text-neutral-900">
          {entry.term}
          {entry.occurrenceIndex ? ` · ${entry.occurrenceIndex}. kullanım` : ""}
        </p>
      </div>
      <label className="block">
        <Label>Temel biçim (isteğe bağlı)</Label>
        <input
          className={fieldClass}
          value={entry.baseForm || ""}
          onChange={(event) =>
            updateGlossary(index, "baseForm", event.target.value)
          }
        />
      </label>
      <label className="block">
        <Label>Anlamı (isteğe bağlı)</Label>
        <textarea
          rows={2}
          className={textareaClass}
          value={entry.baseMeaning || entry.definition || ""}
          onChange={(event) =>
            updateGlossary(index, "baseMeaning", event.target.value)
          }
        />
      </label>
      <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
        <span className="text-xs text-neutral-500">
          Değişiklikler testle birlikte kaydedilir.
        </span>
        <button
          type="button"
          onClick={() => removeGlossary(index)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" /> Sil
        </button>
      </div>
    </div>
  );

  const renderGlossaryText = (paragraphLabel: string, text: string) => {
    const entries = draft.glossaryEntries
      .map((entry, index) => ({ entry, index }))
      .filter(
        ({ entry }) =>
          !entry.paragraphLabel || entry.paragraphLabel === paragraphLabel,
      )
      .sort((left, right) => right.entry.term.length - left.entry.term.length);
    if (!entries.length || !text.trim()) return text;
    const pattern = Array.from(new Set(entries.map(({ entry }) => entry.term)))
      .map(escapePattern)
      .filter(Boolean)
      .join("|");
    if (!pattern) return text;
    const wordCharacter = "A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû";
    const parts = text.split(
      new RegExp(
        `(?<![${wordCharacter}])(${pattern})(?![${wordCharacter}])`,
        "giu",
      ),
    );
    const occurrenceCounts = new Map<string, number>();

    return parts.map((part, partIndex) => {
      const normalizedPart = part.toLocaleLowerCase("tr");
      const candidates = entries.filter(
        ({ entry }) => entry.term.toLocaleLowerCase("tr") === normalizedPart,
      );
      const occurrenceIndex = (occurrenceCounts.get(normalizedPart) || 0) + 1;
      if (candidates.length)
        occurrenceCounts.set(normalizedPart, occurrenceIndex);
      const match =
        candidates.find(
          ({ entry }) => entry.occurrenceIndex === occurrenceIndex,
        ) ||
        candidates.find(({ entry }) => entry.occurrenceIndex == null) ||
        candidates[0];
      if (!match)
        return <span key={`${paragraphLabel}-${partIndex}`}>{part}</span>;
      const popoverKey = `${paragraphLabel}-${match.index}-${partIndex}`;
      const meaning = match.entry.simpleDefinition || match.entry.definition;
      return (
        <Popover
          key={popoverKey}
          trigger="click"
          placement="top"
          open={activeGlossaryKey === popoverKey}
          onOpenChange={(open) => setActiveGlossaryKey(open ? popoverKey : "")}
          content={glossaryEditor(match.entry, match.index)}
        >
          <button
            type="button"
            title={meaning}
            className="rounded-sm bg-emerald-50 px-0.5 font-medium text-emerald-800 underline decoration-emerald-500 decoration-dotted underline-offset-4 hover:bg-emerald-100"
          >
            {part}
          </button>
        </Popover>
      );
    });
  };

  const setSharedTextOptions = (
    type: ReadingPracticeGroupType,
    values: string[],
  ) => {
    updateGroup(type, (group) => {
      group.questions.forEach((question) => {
        question.options = values;
      });
    });
  };

  const setSharedMatchingOptions = (
    type: ReadingPracticeGroupType,
    values: Array<{ value: string; label: string }>,
  ) => {
    updateGroup(type, (group) => {
      group.questions.forEach((question) => {
        question.options = values;
      });
    });
  };

  const renderQuestionEditor = (group: ReadingPracticeQuestionGroup) => {
    if (group.type === "FILL_BLANK") {
      const words = textOptions(
        group.questions[0]?.options,
        section.optionLetters?.length || 8,
      );
      return (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              A-H kelime havuzu
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Altı doğru kelime ve kullanılmayacak iki kelime yazın.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {words.map((word, index) => (
                <label key={index} className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs font-bold text-neutral-700">
                    {section.optionLetters?.[index]}
                  </span>
                  <input
                    aria-label={`${section.optionLetters?.[index]} kelimesi`}
                    className={fieldClass}
                    value={word}
                    onChange={(event) => {
                      const next = [...words];
                      next[index] = event.target.value;
                      setSharedTextOptions("FILL_BLANK", next);
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {group.questions.map((question, index) => (
              <div
                key={question.order}
                className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3"
              >
                <label className="block">
                  <Label>S{question.order} doğru kelime</Label>
                  <select
                    className={fieldClass}
                    value={String(question.answerKey || "")}
                    onChange={(event) =>
                      updateQuestion("FILL_BLANK", index, (item) => {
                        item.answerKey = event.target.value;
                      })
                    }
                  >
                    <option value="">Seçin</option>
                    {words.filter(Boolean).map((word, wordIndex) => (
                      <option key={`${word}-${wordIndex}`} value={word}>
                        {word}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <Label>İlk yanlışta gösterilecek yöntem</Label>
                  <p className="mb-2 text-xs leading-5 text-neutral-500">
                    Öğrenciye önce nereye bakacağını, sonra ne yapacağını sade
                    öğretmen diliyle anlatın. Bu sorudaki ipucunu kullanın ve
                    aynı yolun başka sorularda nasıl uygulanacağını gösterin.
                    Doğru cevabı açıklamayın. Gerekli dil bilgisini günlük
                    dille anlatın; kelime veya cümle sınırı yoktur.
                  </p>
                  <textarea
                    rows={5}
                    className={textareaClass}
                    value={String(
                      recordOf(question.meta).transferTip ||
                        recordOf(question.meta).strategy ||
                        question.explanation ||
                        "",
                    )}
                    placeholder="Örnek: Boşluğun olduğu cümleyi baştan sona oku. Önce ne yapıldığını, sonra bunun sonucunu bul. Seçenekleri sırayla dene ve anlamı tamamlamayanları ele. Başka sorularda da aynı yolu kullan."
                    onChange={(event) =>
                      updateQuestion("FILL_BLANK", index, (item) => {
                        item.meta = {
                          ...recordOf(item.meta),
                          strategy: "",
                          transferTip: event.target.value,
                        };
                      })
                    }
                  />
                </label>
                <label className="block">
                  <Label>Doğru cevabın açıklaması</Label>
                  <p className="mb-2 text-xs leading-5 text-neutral-500">
                    Öğrenci “Cevabı göster”e bastığında görünür. Doğru seçeneğin
                    bu cümlede neden uygun olduğunu sade ve öğretici biçimde
                    açıklayın.
                  </p>
                  <textarea
                    rows={4}
                    className={textareaClass}
                    value={String(question.explanation || "")}
                    placeholder="Örnek: Bu seçenek doğrudur; çünkü cümlede anlatılan olumlu sonucu hem anlam hem de kullanılan söz kalıbı bakımından doğal biçimde tamamlar."
                    onChange={(event) =>
                      updateQuestion("FILL_BLANK", index, (item) => {
                        item.explanation = event.target.value;
                      })
                    }
                  />
                </label>
                <details className="rounded-md border border-neutral-200 bg-white px-3 py-2">
                  <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                    Seçilen yanlış cevaba özel yardımlar
                  </summary>
                  <div className="mt-3 space-y-3">
                    {words
                      .filter(
                        (word) =>
                          word && word !== String(question.answerKey || ""),
                      )
                      .map((word) => {
                        const explanations = recordOf(
                          recordOf(question.meta).distractorExplanations,
                        );
                        return (
                          <label
                            key={`${question.order}-${word}`}
                            className="block"
                          >
                            <Label>{word}</Label>
                            <textarea
                              rows={3}
                              className={textareaClass}
                              value={String(explanations[word] || "")}
                              placeholder={`“${word}” seçiminin neden ilk bakışta mantıklı gelebileceğini ve bu boşlukta tam olarak nerede bozulduğunu açıklayın. Doğru cevabı söylemeden öğrenciyi metindeki ölçüte geri gönderin.`}
                              onChange={(event) =>
                                updateQuestion("FILL_BLANK", index, (item) => {
                                  const meta = recordOf(item.meta);
                                  item.meta = {
                                    ...meta,
                                    distractorExplanations: {
                                      ...recordOf(meta.distractorExplanations),
                                      [word]: event.target.value,
                                    },
                                  };
                                })
                              }
                            />
                          </label>
                        );
                      })}
                  </div>
                </details>
                <details className="rounded-md border border-neutral-200 bg-white px-3 py-2">
                  <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                    O‘zbekcha öğretici anlatımlar
                  </summary>
                  <div className="mt-3 space-y-3">
                    <p className="text-xs leading-5 text-neutral-500">
                      Türkçe metinden alınan sözleri Türkçe bırakın. Türkçe
                      cümleyi sözcük sözcük çevirmeyin; aynı öğretim amacını
                      Özbekçede doğal, akıcı ve öğretmen gibi anlatın. Bu
                      alanlar boş kalırsa öğrenci Türkçe açıklamayı görür.
                    </p>
                    <label className="block">
                      <Label>O‘zbekcha yöntem</Label>
                      <textarea
                        rows={5}
                        className={textareaClass}
                        value={String(
                          recordOf(question.meta).transferTipUz || "",
                        )}
                        placeholder="Metindeki Türkçe ifadeyi aynen koruyun; öğrencinin hangi bölümlere bakacağını ve neyi karşılaştıracağını Özbekçe anlatın."
                        onChange={(event) =>
                          updateQuestion("FILL_BLANK", index, (item) => {
                            item.meta = {
                              ...recordOf(item.meta),
                              transferTipUz: event.target.value,
                            };
                          })
                        }
                      />
                    </label>
                    <label className="block">
                      <Label>O‘zbekcha “Nega to‘g‘ri?” açıklaması</Label>
                      <textarea
                        rows={4}
                        className={textareaClass}
                        value={String(
                          recordOf(question.meta).explanationUz || "",
                        )}
                        placeholder="Doğru cevabın bu cümlede neden uygun olduğunu sade Özbekçeyle açıklayın; Türkçe alıntıyı çevirmeyin."
                        onChange={(event) =>
                          updateQuestion("FILL_BLANK", index, (item) => {
                            item.meta = {
                              ...recordOf(item.meta),
                              explanationUz: event.target.value,
                            };
                          })
                        }
                      />
                    </label>
                    <details className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
                      <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                        O‘zbekcha seçilen yanlış cevaba özel yardımlar
                      </summary>
                      <div className="mt-3 space-y-3">
                        {words
                          .filter(
                            (word) =>
                              word && word !== String(question.answerKey || ""),
                          )
                          .map((word) => {
                            const explanations = recordOf(
                              recordOf(question.meta).distractorExplanationsUz,
                            );
                            return (
                              <label
                                key={`${question.order}-${word}-uz`}
                                className="block"
                              >
                                <Label>{word}</Label>
                                <textarea
                                  rows={3}
                                  className={textareaClass}
                                  value={String(explanations[word] || "")}
                                  placeholder={`“${word}” Türkçe kalsın; neden uymadığını sade Özbekçeyle anlatın.`}
                                  onChange={(event) =>
                                    updateQuestion(
                                      "FILL_BLANK",
                                      index,
                                      (item) => {
                                        const meta = recordOf(item.meta);
                                        item.meta = {
                                          ...meta,
                                          distractorExplanationsUz: {
                                            ...recordOf(
                                              meta.distractorExplanationsUz,
                                            ),
                                            [word]: event.target.value,
                                          },
                                        };
                                      },
                                    )
                                  }
                                />
                              </label>
                            );
                          })}
                      </div>
                    </details>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (group.type === "MATCHING_HEADINGS") {
      const bank = optionBank(
        group.questions[0]?.options,
        section.optionLetters || [],
      );
      return (
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Seçenekler</p>
            <p className="mt-1 text-xs text-neutral-500">
              Sınavdaki A-{section.optionLetters?.at(-1)} seçeneklerini yazın.
            </p>
            <div className="mt-3 grid gap-2 lg:grid-cols-2">
              {bank.map((option, optionIndex) => (
                <div
                  key={option.value}
                  className="grid grid-cols-[40px_minmax(0,1fr)] items-start gap-2"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs font-bold text-neutral-700">
                    {option.value}
                  </span>
                  <span className="min-w-0 space-y-2">
                    <textarea
                      aria-label={`${option.value} seçeneği`}
                      rows={2}
                      className={textareaClass}
                      value={option.label}
                      onChange={(event) => {
                        const next = bank.map((item, index) =>
                          index === optionIndex
                            ? { ...item, label: event.target.value }
                            : item,
                        );
                        setSharedMatchingOptions("MATCHING_HEADINGS", next);
                      }}
                    />
                    {draft.glossaryEntries.some(
                      (entry) =>
                        entry.paragraphLabel ===
                        glossaryOptionParagraphLabel(
                          group.type,
                          group.order,
                          group.questions[0]?.order || 0,
                          option.value,
                        ),
                    ) ? (
                      <span className="block rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs leading-5 text-neutral-700">
                        {renderGlossaryText(
                          glossaryOptionParagraphLabel(
                            group.type,
                            group.order,
                            group.questions[0]?.order || 0,
                            option.value,
                          ),
                          option.label,
                        )}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Doğru eşleşmeler
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {group.questions.map((question, index) => (
                <label
                  key={question.order}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                >
                  <Label>
                    {question.prompt} · S{question.order}
                  </Label>
                  <select
                    className={fieldClass}
                    value={String(question.answerKey || "")}
                    onChange={(event) =>
                      updateQuestion("MATCHING_HEADINGS", index, (item) => {
                        item.answerKey = event.target.value;
                      })
                    }
                  >
                    <option value="">Seçin</option>
                    {bank.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
          {sectionNumber === 2 || sectionNumber === 3 ? (
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Öğretici geri bildirim
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                {sectionNumber === 2
                  ? "Her ilan için farklı bir yöntem yazın. Öğrenciye ilandaki belirleyici sözleri, hangi koşulları birlikte arayacağını ve yanlış seçenekleri nasıl eleyeceğini gösterin; ilk yanlışta doğru harfi söylemeyin."
                  : "Her paragraf için farklı bir yöntem yazın. Öğrenciye ana fikri hangi cümlelerden çıkaracağını, ayrıntı anlatan başlıkları nasıl eleyeceğini ve paragrafın tamamını kapsayan başlığı nasıl bulacağını gösterin; ilk yanlışta doğru harfi veya başlığı söylemeyin."}
              </p>
              <div className="mt-3 space-y-3">
                {group.questions.map((question, index) => {
                  const meta = recordOf(question.meta);
                  const paragraphLabel = String(
                    meta.sectionParagraphLabel || question.prompt || "",
                  );
                  const paragraph = draft.paragraphs.find(
                    (item) => item.label === paragraphLabel,
                  );
                  const answerKey = String(question.answerKey || "");
                  const distractorExplanations = recordOf(
                    meta.distractorExplanations,
                  );
                  const distractorExplanationsUz = recordOf(
                    meta.distractorExplanationsUz,
                  );

                  return (
                    <details
                      key={`learning-${question.order}`}
                      className="rounded-lg border border-neutral-200 bg-white px-4 py-3"
                    >
                      <summary className="cursor-pointer text-sm font-semibold text-neutral-900">
                        S{question.order} · {paragraph?.title || paragraphLabel}
                      </summary>
                      <div className="mt-4 space-y-4">
                        <label className="block">
                          <Label>İlk yanlışta gösterilecek yöntem</Label>
                          <p className="mb-2 text-xs leading-5 text-neutral-500">
                            {sectionNumber === 2
                              ? "İlandan kısa alıntılar kullanarak öğrencinin nereye bakacağını ve eşleşmeyi nasıl kuracağını öğretin. Doğru seçeneği veya harfi açıklamayın. Kelime ya da cümle sınırı yoktur."
                              : "Paragraftan kısa alıntılar kullanarak ortak konuyu, yazarın asıl vurgusunu ve ayrıntıların hangi ana fikirde birleştiğini buldurun. Doğru başlığı veya harfi açıklamayın. Kelime ya da cümle sınırı yoktur."}
                          </p>
                          <textarea
                            rows={5}
                            className={textareaClass}
                            value={String(
                              meta.transferTip || meta.strategy || "",
                            )}
                            placeholder={
                              sectionNumber === 2
                                ? "Örnek: İlandaki zaman, hizmet ve kullanıcı ihtiyacını birlikte bul. Seçenekte bu üç koşulun da karşılanıp karşılanmadığını kontrol et."
                                : "Örnek: Paragrafta tekrarlanan düşünceyi bul. Tek bir ayrıntıyı değil, başlangıçtan sona bütün paragrafı kapsayan başlığı ara."
                            }
                            onChange={(event) =>
                              updateQuestion(
                                "MATCHING_HEADINGS",
                                index,
                                (item) => {
                                  item.meta = {
                                    ...recordOf(item.meta),
                                    strategy: "",
                                    transferTip: event.target.value,
                                  };
                                },
                              )
                            }
                          />
                        </label>
                        <label className="block">
                          <Label>Doğru cevabın açıklaması</Label>
                          <p className="mb-2 text-xs leading-5 text-neutral-500">
                            {sectionNumber === 2
                              ? "Öğrenci “Cevabı göster”e bastığında, seçenekteki ihtiyacın ilandaki hangi somut bilgilerle örtüştüğünü açıklayın."
                              : "Öğrenci “Cevabı göster”e bastığında, başlığın paragraftaki hangi düşünceleri birlikte kapsadığını ve neden ana fikir olduğunu açıklayın."}
                          </p>
                          <textarea
                            rows={4}
                            className={textareaClass}
                            value={question.explanation || ""}
                            onChange={(event) =>
                              updateQuestion(
                                "MATCHING_HEADINGS",
                                index,
                                (item) => {
                                  item.explanation = event.target.value;
                                },
                              )
                            }
                          />
                        </label>
                        <details className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
                          <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                            Seçilen yanlış cevaba özel yardımlar
                          </summary>
                          <div className="mt-3 space-y-3">
                            {bank
                              .filter((option) => option.value !== answerKey)
                              .map((option) => (
                                <label
                                  key={`${question.order}-${option.value}`}
                                  className="block"
                                >
                                  <Label>
                                    {option.value} · {option.label}
                                  </Label>
                                  <textarea
                                    rows={3}
                                    className={textareaClass}
                                    value={String(
                                      distractorExplanations[option.value] ||
                                        "",
                                    )}
                                    placeholder={
                                      sectionNumber === 2
                                        ? "Bu seçeneğin anlattığı ihtiyaçla ilandaki hizmetin nerede ayrıldığını, doğru cevabı söylemeden açıklayın."
                                        : "Seçilen başlığın paragrafla neden uyuşmadığını veya yalnızca hangi ayrıntıya benzediğini, doğru başlığı söylemeden açıklayın."
                                    }
                                    onChange={(event) =>
                                      updateQuestion(
                                        "MATCHING_HEADINGS",
                                        index,
                                        (item) => {
                                          const nextMeta = recordOf(item.meta);
                                          item.meta = {
                                            ...nextMeta,
                                            distractorExplanations: {
                                              ...recordOf(
                                                nextMeta.distractorExplanations,
                                              ),
                                              [option.value]:
                                                event.target.value,
                                            },
                                          };
                                        },
                                      )
                                    }
                                  />
                                </label>
                              ))}
                          </div>
                        </details>
                        <details className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
                          <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                            O‘zbekcha öğretici anlatımlar
                          </summary>
                          <div className="mt-3 space-y-3">
                            <p className="text-xs leading-5 text-neutral-500">
                              {sectionNumber === 2
                                ? "İlandan alınan Türkçe sözleri Türkçe bırakın. Türkçeyi sözcük sözcük çevirmeden, aynı çözme yolunu Özbekçede doğal öğretmen diliyle anlatın."
                                : "Paragraftan alınan Türkçe sözleri Türkçe bırakın. Türkçeyi sözcük sözcük çevirmeden, ana fikri bulma yolunu Özbekçede doğal öğretmen diliyle anlatın."}
                            </p>
                            <label className="block">
                              <Label>O‘zbekcha yöntem</Label>
                              <textarea
                                rows={5}
                                className={textareaClass}
                                value={String(meta.transferTipUz || "")}
                                onChange={(event) =>
                                  updateQuestion(
                                    "MATCHING_HEADINGS",
                                    index,
                                    (item) => {
                                      item.meta = {
                                        ...recordOf(item.meta),
                                        transferTipUz: event.target.value,
                                      };
                                    },
                                  )
                                }
                              />
                            </label>
                            <label className="block">
                              <Label>
                                O‘zbekcha “Nega to‘g‘ri?” açıklaması
                              </Label>
                              <textarea
                                rows={4}
                                className={textareaClass}
                                value={String(meta.explanationUz || "")}
                                onChange={(event) =>
                                  updateQuestion(
                                    "MATCHING_HEADINGS",
                                    index,
                                    (item) => {
                                      item.meta = {
                                        ...recordOf(item.meta),
                                        explanationUz: event.target.value,
                                      };
                                    },
                                  )
                                }
                              />
                            </label>
                            <details className="rounded-md border border-neutral-200 bg-white px-3 py-2">
                              <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                                O‘zbekcha “Nega mos kelmadi?” açıklamaları
                              </summary>
                              <div className="mt-3 space-y-3">
                                {bank
                                  .filter(
                                    (option) => option.value !== answerKey,
                                  )
                                  .map((option) => (
                                    <label
                                      key={`${question.order}-${option.value}-uz`}
                                      className="block"
                                    >
                                      <Label>
                                        {option.value} · {option.label}
                                      </Label>
                                      <textarea
                                        rows={3}
                                        className={textareaClass}
                                        value={String(
                                          distractorExplanationsUz[
                                            option.value
                                          ] || "",
                                        )}
                                        onChange={(event) =>
                                          updateQuestion(
                                            "MATCHING_HEADINGS",
                                            index,
                                            (item) => {
                                              const nextMeta = recordOf(
                                                item.meta,
                                              );
                                              item.meta = {
                                                ...nextMeta,
                                                distractorExplanationsUz: {
                                                  ...recordOf(
                                                    nextMeta.distractorExplanationsUz,
                                                  ),
                                                  [option.value]:
                                                    event.target.value,
                                                },
                                              };
                                            },
                                          )
                                        }
                                      />
                                    </label>
                                  ))}
                              </div>
                            </details>
                          </div>
                        </details>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {group.questions.map((question, index) => {
          const options = textOptions(question.options, 4);
          const meta = recordOf(question.meta);
          const answerKey = String(question.answerKey || "");
          const learningOptions =
            group.type === "MULTIPLE_CHOICE"
              ? options.map((label, optionIndex) => ({
                  value: OPTION_LETTERS[optionIndex],
                  label,
                }))
              : group.type === "TRUE_FALSE_NOT_GIVEN"
                ? textOptions(question.options, 3).map((label) => ({
                    value: label,
                    label,
                  }))
                : group.type === "PARAGRAPH_REFERENCE"
                  ? textOptions(
                      question.options,
                      section.paragraphLabels.length,
                    ).map((label) => ({
                      value: label,
                      label,
                    }))
                : [];
          const distractorExplanations = recordOf(
            meta.distractorExplanations,
          );
          const distractorExplanationsUz = recordOf(
            meta.distractorExplanationsUz,
          );
          const sectionQuestionLearning =
            (sectionNumber === 4 &&
              (group.type === "MULTIPLE_CHOICE" ||
                group.type === "TRUE_FALSE_NOT_GIVEN")) ||
            (sectionNumber === 5 &&
              (group.type === "MULTIPLE_CHOICE" ||
                group.type === "PARAGRAPH_REFERENCE"));
          return (
            <div
              key={question.order}
              className="rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-neutral-900">
                  S{question.order}
                </p>
                <span className="text-xs text-neutral-500">
                  {group.type === "MULTIPLE_CHOICE"
                    ? "Çoktan seçmeli"
                    : group.type === "TRUE_FALSE_NOT_GIVEN"
                      ? "Doğru / Yanlış / Verilmemiş"
                      : "Paragraf seçimi"}
                </span>
              </div>
              <label className="block">
                <Label>
                  {group.type === "TRUE_FALSE_NOT_GIVEN" ? "İfade" : "Soru"}
                </Label>
                <textarea
                  rows={2}
                  className={textareaClass}
                  value={question.prompt}
                  onChange={(event) =>
                    updateQuestion(
                      group.type as ReadingPracticeGroupType,
                      index,
                      (item) => {
                        item.prompt = event.target.value;
                      },
                    )
                  }
                />
              </label>

              {group.type === "MULTIPLE_CHOICE" ? (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {options.map((option, optionIndex) => {
                    const letter = OPTION_LETTERS[optionIndex];
                    return (
                      <label
                        key={letter}
                        className={`flex items-center gap-2 rounded-md border p-2 ${
                          question.answerKey === letter
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-neutral-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.order}`}
                          checked={question.answerKey === letter}
                          onChange={() =>
                            updateQuestion("MULTIPLE_CHOICE", index, (item) => {
                              item.answerKey = letter;
                            })
                          }
                          className="accent-emerald-700"
                        />
                        <span className="w-5 text-xs font-bold">{letter}</span>
                        <input
                          aria-label={`S${question.order} ${letter} seçeneği`}
                          className={fieldClass}
                          value={option}
                          onChange={(event) => {
                            const next = [...options];
                            next[optionIndex] = event.target.value;
                            updateQuestion("MULTIPLE_CHOICE", index, (item) => {
                              item.options = next;
                            });
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label>
                    <Label>Doğru cevap</Label>
                    <select
                      className={fieldClass}
                      value={String(question.answerKey || "")}
                      onChange={(event) =>
                        updateQuestion(
                          group.type as ReadingPracticeGroupType,
                          index,
                          (item) => {
                            const answer = event.target.value;
                            item.answerKey = answer;
                            if (group.type === "PARAGRAPH_REFERENCE") {
                              item.evidenceParagraphs = answer ? [answer] : [];
                            }
                          },
                        )
                      }
                    >
                      {group.type === "PARAGRAPH_REFERENCE" ? (
                        <option value="">Seçin</option>
                      ) : null}
                      {(group.type === "TRUE_FALSE_NOT_GIVEN"
                        ? ["Doğru", "Yanlış", "Verilmemiş"]
                        : section.paragraphLabels
                      ).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <Label>İlgili metin / paragraf</Label>
                    <select
                      className={fieldClass}
                      value={String(
                        (
                          question.evidenceParagraphs as string[] | undefined
                        )?.[0] || "",
                      )}
                      onChange={(event) =>
                        updateQuestion(
                          group.type as ReadingPracticeGroupType,
                          index,
                          (item) => {
                            item.evidenceParagraphs = event.target.value
                              ? [event.target.value]
                              : [];
                          },
                        )
                      }
                    >
                      <option value="">Seçin</option>
                      {section.paragraphLabels.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {sectionQuestionLearning ? (
                <details className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-neutral-900">
                    Öğretici geri bildirim
                  </summary>
                  <div className="mt-4 space-y-4">
                    <p className="text-xs leading-5 text-neutral-500">
                      {sectionNumber === 5 &&
                      group.type === "PARAGRAPH_REFERENCE"
                        ? "Öğrenciye sorudaki ayırt edici düşünceyi bulmayı, A–E paragraflarını anahtar sözler ve aynı anlamı veren farklı ifadeler üzerinden taramayı öğretin. Aynı konudan söz eden fakat sorudaki ayrıntıyı taşımayan paragrafları nasıl eleyeceğini gösterin. İlk yanlışta doğru paragrafı söylemeyin."
                        : group.type === "MULTIPLE_CHOICE"
                          ? sectionNumber === 5
                            ? "Öğrenciye sorunun bütün metni mi yoksa belirli bir paragrafı mı sorduğunu ayırt ettirin. Metindeki karşıtlık, neden-sonuç ve kesinlik bildiren sözleri kullanarak seçenekleri nasıl eleyeceğini gösterin. İlk yanlışta doğru harfi veya cevabı açıklamayın."
                            : "Öğrenciye metinde nereye bakacağını, sorudaki düşüncenin metinde nasıl başka sözlerle anlatıldığını ve uygun olmayan seçenekleri nasıl eleyeceğini gösterin. İlk yanlışta doğru harfi veya cevabı açıklamayın."
                          : "Öğrenciye ifadeyi metindeki ilgili cümleyle karşılaştırmayı; aynı anlam, açık çelişki ve metinde hiç bulunmayan bilgi arasındaki farkı öğretin. Kesinlik bildiren sözlere dikkat çekin. İlk yanlışta Doğru, Yanlış veya Verilmemiş cevabını söylemeyin."}
                    </p>
                    <label className="block">
                      <Label>İlk yanlışta gösterilecek yöntem</Label>
                      <p className="mb-2 text-xs leading-5 text-neutral-500">
                        Metinden kısa Türkçe alıntılar kullanabilirsiniz. Öğretmen
                        gibi sade ve akıcı anlatın; gerekli olduğu kadar yazın.
                      </p>
                      <textarea
                        rows={5}
                        className={textareaClass}
                        value={String(meta.transferTip || meta.strategy || "")}
                        onChange={(event) =>
                          updateQuestion(
                            group.type as ReadingPracticeGroupType,
                            index,
                            (item) => {
                              item.meta = {
                                ...recordOf(item.meta),
                                strategy: "",
                                transferTip: event.target.value,
                              };
                            },
                          )
                        }
                      />
                    </label>
                    <label className="block">
                      <Label>“Neden doğru?” açıklaması</Label>
                      <p className="mb-2 text-xs leading-5 text-neutral-500">
                        Öğrenci “Cevabı göster”e bastığında doğru cevabın
                        metindeki hangi bilgiye dayandığını açıklayın.
                      </p>
                      <textarea
                        rows={4}
                        className={textareaClass}
                        value={question.explanation || ""}
                        onChange={(event) =>
                          updateQuestion(
                            group.type as ReadingPracticeGroupType,
                            index,
                            (item) => {
                              item.explanation = event.target.value;
                            },
                          )
                        }
                      />
                    </label>
                    <details className="rounded-md border border-neutral-200 bg-white px-3 py-2">
                      <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                        Seçilen yanlış cevaba özel açıklamalar
                      </summary>
                      <div className="mt-3 space-y-3">
                        {learningOptions
                          .filter((option) => option.value !== answerKey)
                          .map((option) => (
                            <label
                              key={`${question.order}-${option.value}`}
                              className="block"
                            >
                              <Label>
                                {option.value}
                                {option.label !== option.value
                                  ? ` · ${option.label}`
                                  : ""}
                              </Label>
                              <textarea
                                rows={3}
                                className={textareaClass}
                                value={String(
                                  distractorExplanations[option.value] || "",
                                )}
                                placeholder="Bu seçimin metinle nerede ayrıldığını doğru cevabı söylemeden açıklayın."
                                onChange={(event) =>
                                  updateQuestion(
                                    group.type as ReadingPracticeGroupType,
                                    index,
                                    (item) => {
                                      const nextMeta = recordOf(item.meta);
                                      item.meta = {
                                        ...nextMeta,
                                        distractorExplanations: {
                                          ...recordOf(
                                            nextMeta.distractorExplanations,
                                          ),
                                          [option.value]: event.target.value,
                                        },
                                      };
                                    },
                                  )
                                }
                              />
                            </label>
                          ))}
                      </div>
                    </details>
                    <details className="rounded-md border border-neutral-200 bg-white px-3 py-2">
                      <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                        O‘zbekcha öğretici anlatımlar
                      </summary>
                      <div className="mt-3 space-y-3">
                        <p className="text-xs leading-5 text-neutral-500">
                          Metinden alınan Türkçe sözleri Türkçe bırakın. Türkçe
                          metni sözcük sözcük çevirmeyin; aynı çözme yolunu
                          Özbekçede doğal öğretmen diliyle anlatın.
                        </p>
                        <label className="block">
                          <Label>O‘zbekcha yöntem</Label>
                          <textarea
                            rows={5}
                            className={textareaClass}
                            value={String(meta.transferTipUz || "")}
                            onChange={(event) =>
                              updateQuestion(
                                group.type as ReadingPracticeGroupType,
                                index,
                                (item) => {
                                  item.meta = {
                                    ...recordOf(item.meta),
                                    transferTipUz: event.target.value,
                                  };
                                },
                              )
                            }
                          />
                        </label>
                        <label className="block">
                          <Label>O‘zbekcha “Nega to‘g‘ri?” açıklaması</Label>
                          <textarea
                            rows={4}
                            className={textareaClass}
                            value={String(meta.explanationUz || "")}
                            onChange={(event) =>
                              updateQuestion(
                                group.type as ReadingPracticeGroupType,
                                index,
                                (item) => {
                                  item.meta = {
                                    ...recordOf(item.meta),
                                    explanationUz: event.target.value,
                                  };
                                },
                              )
                            }
                          />
                        </label>
                        <details className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
                          <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                            O‘zbekcha seçilen yanlış cevaba özel açıklamalar
                          </summary>
                          <div className="mt-3 space-y-3">
                            {learningOptions
                              .filter((option) => option.value !== answerKey)
                              .map((option) => (
                                <label
                                  key={`${question.order}-${option.value}-uz`}
                                  className="block"
                                >
                                  <Label>
                                    {option.value}
                                    {option.label !== option.value
                                      ? ` · ${option.label}`
                                      : ""}
                                  </Label>
                                  <textarea
                                    rows={3}
                                    className={textareaClass}
                                    value={String(
                                      distractorExplanationsUz[option.value] ||
                                        "",
                                    )}
                                    onChange={(event) =>
                                      updateQuestion(
                                        group.type as ReadingPracticeGroupType,
                                        index,
                                        (item) => {
                                          const nextMeta = recordOf(item.meta);
                                          item.meta = {
                                            ...nextMeta,
                                            distractorExplanationsUz: {
                                              ...recordOf(
                                                nextMeta.distractorExplanationsUz,
                                              ),
                                              [option.value]:
                                                event.target.value,
                                            },
                                          };
                                        },
                                      )
                                    }
                                  />
                                </label>
                              ))}
                          </div>
                        </details>
                      </div>
                    </details>
                  </div>
                </details>
              ) : (
                <label className="mt-3 block">
                  <Label>Cevap açıklaması (isteğe bağlı)</Label>
                  <textarea
                    rows={2}
                    className={textareaClass}
                    value={question.explanation || ""}
                    onChange={(event) =>
                      updateQuestion(
                        group.type as ReadingPracticeGroupType,
                        index,
                        (item) => {
                          item.explanation = event.target.value;
                        },
                      )
                    }
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const save = () => {
    const errors = validateSectionPracticeDraft(draft);
    if (errors.length) {
      Modal.error({
        title: "Eksik alanlar var",
        content: (
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
            {errors.slice(0, 8).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ),
      });
      return;
    }
    const payload = serializeSectionPracticeDraft(draft);
    const onSuccess = () => navigate("/reading-practice");
    if (isEdit && id) {
      updateMutation.mutate({ id, ...payload }, { onSuccess });
    } else {
      createMutation.mutate(payload, { onSuccess });
    }
  };

  if (isEdit && !hasFreshEditRecord && !query.isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (isEdit && query.isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-neutral-600">
          Bölüm pratiğinin güncel kaydı alınamadı.
        </p>
        <Button onClick={() => void query.refetch()}>Yeniden dene</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] pb-16">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/reading-practice")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              aria-label="Geri"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-neutral-950">
                {isEdit ? "Bölüm pratiğini düzenle" : "Yeni bölüm pratiği"}
              </h1>
              <p className="truncate text-xs text-neutral-500">
                {section.title} · {section.summary}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#c9362b] px-4 text-sm font-semibold text-white hover:bg-[#ad2f26] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {createMutation.isPending || updateMutation.isPending
              ? "Kaydediliyor"
              : "Kaydet"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-5 px-5 py-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-neutral-700" />
            <h2 className="text-base font-semibold text-neutral-950">
              1. Bölüm ve temel bilgiler
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {([1, 2, 3, 4, 5] as ReadingSectionNumber[]).map((number) => {
              const item = READING_SECTION_CONFIG[number];
              const active = number === sectionNumber;
              return (
                <button
                  key={number}
                  type="button"
                  onClick={() => chooseSection(number)}
                  className={`rounded-lg border px-3 py-3 text-left transition ${
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  <span className="block text-sm font-semibold">
                    Bölüm {number}
                  </span>
                  <span
                    className={`mt-1 block text-[11px] leading-4 ${active ? "text-neutral-300" : "text-neutral-500"}`}
                  >
                    {item.summary}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <Label>Pratik adı</Label>
                <input
                  className={fieldClass}
                  placeholder="Örn. İpek Yolu · Başlık Eşleştirme"
                  value={draft.title}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.title = event.target.value;
                    })
                  }
                />
              </label>
              <label className="md:col-span-2">
                <Label>
                  {sectionNumber === 2 ? "Kart başlığı (öğrenci)" : "Metin başlığı (öğrenci)"}
                </Label>
                <input
                  className={fieldClass}
                  placeholder={
                    sectionNumber === 2
                      ? "Yalnızca pratik kartında görünür"
                      : "Öğrencinin göreceği metin başlığı"
                  }
                  value={draft.passageTitle || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.passageTitle = event.target.value;
                    })
                  }
                />
              </label>
              <label>
                <Label>Seviye</Label>
                <select
                  className={fieldClass}
                  value={draft.level || "B2"}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.level = event.target.value;
                    })
                  }
                >
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level === "MULTILEVEL" ? "Multilevel" : level}
                    </option>
                  ))}
                </select>
              </label>
              <label className="md:col-span-2">
                <Label>Bölüm çalışma anlatımı</Label>
                <textarea
                  rows={4}
                  className={textareaClass}
                  value={draft.description || ""}
                  placeholder="Öğrenciye bu bölümde ne yapacağını ve doğru cevabı bulurken nelere bakacağını kısa, öğretmen diliyle anlatın."
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.description = event.target.value;
                    })
                  }
                />
                <p className="mt-1.5 text-xs leading-5 text-neutral-500">
                  Bu metin pratiğin üstünde gösterilir ve yalnızca bu bölüm
                  kaydında saklanır.
                </p>
              </label>
              <ContentAccessControls target={{scope:"PRACTICE_READING",targetId:id}} row={unwrapPassage(query.data)??{isPublished:false}}/>
<label className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={draft.isPublished}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.isPublished = event.target.checked;
                    })
                  }
                  className="h-4 w-4 accent-[#c9362b]"
                />
                <span>
                  <span className="block text-sm font-semibold text-neutral-900">
                    Yayında
                  </span>
                  <span className="block text-xs text-neutral-500">
                    Kaydedilince öğrenci listesinde görünsün.
                  </span>
                </span>
              </label>
              <ManagedLegacyAccess target={{scope:"PRACTICE_READING",targetId:id}}>
<label className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(draft.isFreeAccess)}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.isFreeAccess = event.target.checked;
                    })
                  }
                  className="h-4 w-4 accent-[#c9362b]"
                />
                <span>
                  <span className="block text-sm font-semibold text-neutral-900">
                    Aboneliksiz erişim
                  </span>
                  <span className="block text-xs text-neutral-500">
                    Yayındayken giriş yapan aboneliksiz öğrenciler de çalışabilir. İstediğiniz zaman kapatabilirsiniz.
                  </span>
                </span>
              </label>
</ManagedLegacyAccess>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Kart görseli
                  </p>
                  <p className="text-xs text-neutral-500">
                    Pratik listesinde görünür.
                  </p>
                </div>
                <span className="rounded bg-white px-2 py-1 text-xs font-bold text-neutral-700 shadow-sm">
                  {draft.level === "MULTILEVEL" ? "Multi" : draft.level}
                </span>
              </div>
              {draft.coverImageUrl ? (
                <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-white">
                  <img
                    src={draft.coverImageUrl}
                    alt="Kart görseli"
                    className="h-40 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((next) => {
                        next.coverImageUrl = "";
                      })
                    }
                    className="absolute right-2 top-2 rounded bg-white/95 p-1.5 text-red-600 shadow"
                    aria-label="Kart görselini kaldır"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white text-sm text-neutral-400">
                  Görsel eklenmedi
                </div>
              )}
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) =>
                  uploadImage(file, (url) =>
                    updateDraft((next) => {
                      next.coverImageUrl = url;
                    }),
                  )
                }
              >
                <Button
                  className="mt-3 w-full"
                  icon={<ImagePlus className="h-4 w-4" />}
                  loading={uploadMutation.isPending}
                >
                  {draft.coverImageUrl
                    ? "Görseli değiştir"
                    : "Kart görseli ekle"}
                </Button>
              </Upload>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                2. {section.textTitle}
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                {sectionNumber === 2 ? "İlanları" : "Metni"} yazın. İsterseniz bütün metin için tek bir görsel ekleyin.
                {sectionNumber === 1
                  ? " Boşlukların yerini [1], [2] ... [6] olarak yazın. Yeni paragraf için metinde bir boş satır bırakın."
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={generateGlossary}
              disabled={glossaryMutation.isPending}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4 text-emerald-700" />
              {glossaryMutation.isPending
                ? "Sözlük hazırlanıyor"
                : draft.glossaryEntries.length
                  ? "Eksik kelimeleri AI ile tamamla"
                  : "AI ile sözlük hazırla"}
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            <Check className="h-4 w-4 shrink-0" />
            <span>
              Yapay zekâ her kelime için temel biçimi ve doğal Türkçe anlamını
              hazırlar. Önce genel anlam, gerekiyorsa alan anlamı ve yararlı
              köken bilgisi verilir. Metindeki kullanım ve örnek cümle ayrıca
              üretilmez. Düğmeye bastığınızda ücretli istek gönderilmeden önce
              onayınız alınır. Altı çizili kelimeye tıklayıp açıklamasını
              değiştirebilirsiniz.
              {draft.glossaryEntries.length
                ? ` Şu anda ${draft.glossaryEntries.length} kelime hazır.`
                : ""}
            </span>
          </div>

          <div className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-neutral-900">
                Metin görseli
              </p>
              <p className="text-xs text-neutral-500">
                Başlığın altında, bütün metin için bir kez kapak olarak
                gösterilir. Önerilen ölçü: 1600 × 400 px (4:1). Farklı
                boyuttaki görseller bozulmadan kırpılır; görünmesini istediğiniz
                alanı aşağıdaki önizlemede belirleyebilirsiniz.
              </p>
            </div>
            {textImageUrl ? (
              <div>
                <div
                  className="relative aspect-[4/1] w-full cursor-crosshair touch-none select-none overflow-hidden rounded-md border border-neutral-300 bg-neutral-50"
                  role="presentation"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    updateTextImagePositionFromPointer(event);
                  }}
                  onPointerMove={(event) => {
                    if (
                      event.currentTarget.hasPointerCapture(event.pointerId)
                    ) {
                      updateTextImagePositionFromPointer(event);
                    }
                  }}
                  onPointerUp={(event) => {
                    if (
                      event.currentTarget.hasPointerCapture(event.pointerId)
                    ) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                  }}
                >
                  <img
                    src={textImageUrl}
                    alt="Metin görseli"
                    draggable={false}
                    className="pointer-events-none h-full w-full object-cover"
                    style={{
                      objectPosition: `${textImagePositionX}% ${textImagePositionY}%`,
                    }}
                  />
                  <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-white/95 px-2 py-1 text-[11px] font-semibold text-neutral-600 shadow-sm">
                    İşareti görünmesini istediğiniz alana taşıyın
                  </span>
                  <span
                    className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-neutral-900/65 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                    style={{
                      left: `${textImagePositionX}%`,
                      top: `${textImagePositionY}%`,
                    }}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() =>
                      updateDraft((next) => {
                        next.paragraphs.forEach((paragraph, index) => {
                          paragraph.imageUrl = "";
                          paragraph.imagePositionX =
                            index === 0 ? 50 : undefined;
                          paragraph.imagePositionY =
                            index === 0 ? 50 : undefined;
                        });
                      })
                    }
                    className="absolute right-2 top-2 rounded bg-white/95 p-1.5 text-red-600 shadow"
                    aria-label="Metin görselini kaldır"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <label>
                    <span className="mb-1 flex items-center justify-between text-xs font-semibold text-neutral-600">
                      <span>Yatay konum</span>
                      <span className="font-normal text-neutral-400">
                        {Math.round(textImagePositionX)}%
                      </span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={textImagePositionX}
                      onChange={(event) =>
                        updateTextImagePosition(
                          Number(event.target.value),
                          textImagePositionY,
                        )
                      }
                      className="block h-8 w-full accent-neutral-900"
                      aria-label="Metin görselinin yatay konumu"
                    />
                  </label>
                  <label>
                    <span className="mb-1 flex items-center justify-between text-xs font-semibold text-neutral-600">
                      <span>Dikey konum</span>
                      <span className="font-normal text-neutral-400">
                        {Math.round(textImagePositionY)}%
                      </span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={textImagePositionY}
                      onChange={(event) =>
                        updateTextImagePosition(
                          textImagePositionX,
                          Number(event.target.value),
                        )
                      }
                      className="block h-8 w-full accent-neutral-900"
                      aria-label="Metin görselinin dikey konumu"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => updateTextImagePosition(50, 50)}
                    className="h-8 rounded-md border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
                  >
                    Ortala
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex aspect-[4/1] w-full flex-col items-center justify-center rounded-md border border-dashed border-neutral-300 bg-white text-sm text-neutral-400">
                <span>Metin görseli eklenmedi</span>
                <span className="mt-1 text-xs">1600 × 400 px · 4:1</span>
              </div>
            )}
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={(file) =>
                uploadImage(file, (url) =>
                  updateDraft((next) => {
                    next.paragraphs.forEach((paragraph, index) => {
                      paragraph.imageUrl = index === 0 ? url : "";
                      paragraph.imagePositionX = index === 0 ? 50 : undefined;
                      paragraph.imagePositionY = index === 0 ? 50 : undefined;
                    });
                  }),
                )
              }
            >
              <Button
                className="mt-3"
                icon={<ImagePlus className="h-4 w-4" />}
                loading={uploadMutation.isPending}
              >
                {textImageUrl
                  ? "Metin görselini değiştir"
                  : "Metin görseli ekle"}
              </Button>
            </Upload>
          </div>

          <div className="space-y-5">
            {draft.paragraphs.map((paragraph, index) => {
              const previewText =
                serializedPreview.paragraphs[index]?.text || paragraph.text;
              return (
                <div
                  key={paragraph.label}
                  className="grid gap-4 rounded-xl border border-neutral-200 p-4 lg:grid-cols-2"
                >
                  <div>
                    <p className="mb-2 text-sm font-semibold text-neutral-900">
                      {paragraph.label}
                    </p>
                    {sectionNumber === 2 ? (
                      <label className="mb-3 block">
                        <Label>{paragraph.label} ilan başlığı</Label>
                        <input
                          className={fieldClass}
                          value={paragraph.title || ""}
                          placeholder="Örn. Dönüşüm Atölyesi"
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.paragraphs[index].title = event.target.value;
                            })
                          }
                        />
                      </label>
                    ) : null}
                    <textarea
                      rows={sectionNumber === 2 || sectionNumber === 3 ? 7 : 14}
                      className={textareaClass}
                      value={paragraph.text}
                      placeholder={
                        sectionNumber === 1
                          ? "Metni yazın: ... [1] ... [2] ..."
                          : sectionNumber === 2
                            ? "İlan metnini buraya yazın"
                            : "Metni buraya yazın"
                      }
                      onChange={(event) =>
                        updateDraft((next) => {
                          next.paragraphs[index].text = event.target.value;
                        })
                      }
                    />
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-[#fbfbfa] p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                        Metin ve sözlük önizlemesi
                      </p>
                      <span className="text-[11px] text-neutral-400">
                        Kelimeye tıklayın
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-[15px] leading-8 text-neutral-800">
                      {paragraph.title ? (
                        <p className="mb-2 text-sm font-semibold text-neutral-950">
                          {paragraph.title}
                        </p>
                      ) : null}
                      {previewText.trim() ? (
                        renderGlossaryText(paragraph.label, previewText)
                      ) : (
                        <span className="text-neutral-400">
                          Metin yazıldığında burada görünecek.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-950">
              3. Sorular ve cevap anahtarı
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Yalnızca {section.title} için gereken alanlar gösteriliyor.
            </p>
          </div>
          <div className="space-y-6">
            {draft.questionGroups.map((group) => (
              <div
                key={group.type}
                className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
              >
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-neutral-950">
                    {group.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {group.instructions}
                  </p>
                </div>
                {renderQuestionEditor(group)}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Modal
        open={glossaryConfirmOpen}
        title="AI ile sözlük hazırlansın mı?"
        okText="Evet, sözlüğü hazırla"
        cancelText="Vazgeç"
        okButtonProps={{ autoFocus: false }}
        cancelButtonProps={{ autoFocus: true }}
        confirmLoading={glossaryMutation.isPending}
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
        <p>
          {glossaryConfirmHasEntries
            ? "Bu işlem eksik kelimeler için ücretli yapay zekâ isteği gönderir. Sonuçlar yalnız editöre alınır; Kaydet'e basmadan kayıt değişmez."
            : "Bu işlem bütün kelimeler için ücretli yapay zekâ isteği gönderir. Sonuçlar yalnız editöre alınır; Kaydet'e basmadan kayıt değişmez."}
        </p>
      </Modal>
    </div>
  );
}

export default ReadingPracticeSectionEditor;
