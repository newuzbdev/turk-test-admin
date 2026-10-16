import { useEffect, useRef, useState } from "react";
import { Alert, App, Button, Card, Input, InputNumber, Modal } from "antd";
import { useGenerateReadingPracticeGlossary } from "@/config/queries/reading-practice/generate-glossary.queries";
import {
  listeningGlossaryCoverage,
  listeningGlossaryRequest,
  mergeListeningGlossary,
} from "./listening-practice-glossary-model";
import { Plus, Trash2 } from "lucide-react";
import { PracticeField, clone } from "@/pages/practice-admin/editor-utils";
import type {
  PracticeContent,
  PracticeGlossaryEntry,
} from "./listening-practice-feedback-model";

export default function ListeningPracticeGlossaryEditor({
  content,
  onChange,
}: {
  content: PracticeContent;
  onChange: (content: PracticeContent) => void;
}) {
  const { message } = App.useApp();
  const generator = useGenerateReadingPracticeGlossary();
  const [confirmation, setConfirmation] = useState<{
    pi: number;
    si: number;
  } | null>(null);
  const latest = useRef({ content, onChange });
  useEffect(() => {
    latest.current = { content, onChange };
  }, [content, onChange]);
  const generate = () => {
    if (!confirmation) return;
    const { pi, si } = confirmation;
    const section = content.parts[pi].sections[si];
    const label = section.id || `${pi}-${si}`;
    const transcript = section.transcript || "";
    setConfirmation(null);
    generator.mutate(listeningGlossaryRequest(section, label), {
      onSuccess: (response) => {
        const current = latest.current.content;
        const currentSection = current.parts[pi]?.sections[si];
        if (
          !currentSection ||
          currentSection.id !== section.id ||
          currentSection.transcript !== transcript
        ) {
          void message.warning(
            "Transkript değiştiği için üretilen sözlük eklenmedi. Güncel metinle yeniden hazırlayın.",
          );
          return;
        }
        const next = clone(current);
        const updated = next.parts[pi].sections[si];
        updated.glossaryEntries = mergeListeningGlossary(
          currentSection,
          response.entries || [],
          label,
        );
        latest.current.onChange(next);
        const coverage = listeningGlossaryCoverage(updated);
        void message.success(
          coverage.missing.length
            ? `${coverage.missing.length} kelime eksik kaldı. Aynı düğmeyle tamamlayabilirsiniz.`
            : "Transkriptin bütün kelimeleri hazır. Açıklamaları inceleyip kaydedebilirsiniz.",
        );
      },
    });
  };
  const update = (
    partIndex: number,
    sectionIndex: number,
    entries: PracticeGlossaryEntry[],
  ) => {
    const next = clone(content);
    next.parts[partIndex].sections[sectionIndex].glossaryEntries = entries;
    onChange(next);
  };
  return (
    <div className="space-y-4">
      <Alert
        type="info"
        message="Sözlük yalnız cevaplar kontrol edildikten sonra açılır."
        description="Okumadaki gibi metnin her kelimesi hazırlanır. Temel biçim ve doğal, sade Türkçe anlam gösterilir. Aynı kelimenin farklı kullanımları ayrı ayrı düzenlenebilir."
      />
      {content.parts.map((part, pi) =>
        part.sections.map((section, si) => {
          const entries = section.glossaryEntries || [];
          const coverage = listeningGlossaryCoverage(section);
          const patch = (
            index: number,
            value: Partial<PracticeGlossaryEntry>,
          ) =>
            update(
              pi,
              si,
              entries.map((entry, i) =>
                i === index ? { ...entry, ...value } : entry,
              ),
            );
          return (
            <Card
              key={section.id || `${pi}-${si}`}
              title={section.title || `İçerik ${si + 1}`}
              extra={
                <Button
                  icon={<Plus size={14} />}
                  onClick={() =>
                    update(pi, si, [
                      ...entries,
                      { term: "", baseForm: "", baseMeaning: "" },
                    ])
                  }
                >
                  Kelime ekle
                </Button>
              }
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span role="status" className="text-sm text-[#5f5e5a]">
                  {coverage.covered} / {coverage.total} kelime kullanımı hazır
                  {coverage.missing.length
                    ? ` · ${coverage.missing.length} eksik`
                    : ""}
                </span>
                <Button
                  loading={generator.isPending}
                  disabled={!coverage.missing.length || generator.isPending}
                  onClick={() => setConfirmation({ pi, si })}
                >
                  Eksik kelimeleri hazırla
                </Button>
              </div>
              <div className="space-y-4">
                {entries.map((entry, index) => (
                  <div
                    key={index}
                    className="grid items-start gap-3 border-b pb-4 md:grid-cols-[1fr_1fr_2fr_110px_36px]"
                  >
                    <PracticeField label="Metindeki kelime">
                      <Input
                        aria-label="Metindeki kelime"
                        value={entry.term}
                        onChange={(event) =>
                          patch(index, { term: event.target.value })
                        }
                      />
                    </PracticeField>
                    <PracticeField label="Temel biçim">
                      <Input
                        aria-label="Temel biçim"
                        value={entry.baseForm || ""}
                        onChange={(event) =>
                          patch(index, { baseForm: event.target.value })
                        }
                      />
                    </PracticeField>
                    <PracticeField label="Anlamı">
                      <Input.TextArea
                        aria-label="Kelimenin anlamı"
                        autoSize
                        value={
                          entry.baseMeaning ||
                          entry.simpleDefinition ||
                          entry.definition ||
                          ""
                        }
                        onChange={(event) =>
                          patch(index, {
                            baseMeaning: event.target.value,
                            definition: event.target.value,
                            simpleDefinition: event.target.value,
                          })
                        }
                      />
                    </PracticeField>
                    <PracticeField label="Kullanım sırası">
                      <InputNumber
                        aria-label="Kullanım sırası"
                        min={1}
                        precision={0}
                        value={entry.occurrenceIndex ?? null}
                        onChange={(value) =>
                          patch(index, { occurrenceIndex: value })
                        }
                      />
                    </PracticeField>
                    <Button
                      className="mt-6"
                      aria-label={`${entry.term || "Kelime"} sil`}
                      icon={<Trash2 size={14} />}
                      onClick={() =>
                        update(
                          pi,
                          si,
                          entries.filter((_, i) => i !== index),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </Card>
          );
        }),
      )}
      <Modal
        open={confirmation !== null}
        title="Metnin bütün kelimelerini hazırla"
        okText="Hazırla"
        cancelText="Vazgeç"
        onCancel={() => setConfirmation(null)}
        onOk={generate}
      >
        <p>
          Okuma sözlüğündeki aynı yapay zekâ hizmeti kullanılır; kullanım ücreti
          oluşabilir. Yalnız eksik kelimeler hazırlanır. Mevcut açıklamalar
          korunur ve sonuçlar siz kaydedene kadar taslakta kalır.
        </p>
      </Modal>
    </div>
  );
}
