import { Button, Card, Divider, Input, Space, Upload, Typography, message } from "antd";

import PartForm from "../ui/part-form";
import { PlusOutlined } from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { UploadOutlined } from "@ant-design/icons";
import { useFileUpload } from "@/config/queries/file/upload.queries";

interface Props {
  ieltsId?: string | null;
  testType?: "LISTENING" | "READING";
  backUrl: string;
  useCreateTestWithAddition: any;
}
// types for test editor
export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TEXT_INPUT"
  | "TRUE_FALSE"
  | "MATCHING"
  | "FILL_BLANK";

export interface AnswerDto {
  text: string; // user-entered answer text
  isCorrect: boolean;
}

export interface QuestionDto {
  text: string;
  content?: string;
  imageUrl?: string;
  answers: AnswerDto[];
}

export interface SectionDto {
  title: string;
  content?: string;
  imageUrl?: string;
  type: QuestionType | null;
  questions: QuestionDto[];
}

export interface PartDto {
  title: string;
  description?: string;
  audioUrl?: string;
  sections: SectionDto[];
}

export interface TestDto {
  title: string;
  description?: string;
  type?: "LISTENING" | "READING";
  ieltsId?: string;
  parts: PartDto[];
}

export default function TestEditor({
  ieltsId,
  testType,
  backUrl,
  useCreateTestWithAddition,
}: Props) {
  const [testTitle, setTestTitle] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [parts, setParts] = useState<PartDto[]>([]);
  const [globalAudioUrl, setGlobalAudioUrl] = useState<string>("");
  const navigate = useNavigate();
  const { mutate } = useCreateTestWithAddition();
  const fileUploadMutation = useFileUpload();

  // Demo builder: Listening Bölüm 1 with S1–S8 (A/B/C options)
  const buildListeningDemoPart1 = (): PartDto => ({
    title: "Bölüm 1",
    description: "Demo – S1–S8 çoktan seçmeli",
    audioUrl: "",
    sections: [
      {
        title: "S1–S8",
        content: "Demo seçenekler: A/B/C",
        imageUrl: "",
        type: "MULTIPLE_CHOICE",
        questions: [
          {
            text: "S1",
            answers: [
              { text: "Trafikte takılıp kaldım, her şey arapsaçına döndü.", isCorrect: false },
              { text: "İşler yolundaydı, sorunsuz geldim.", isCorrect: false },
              { text: "Yolda hiçbir sorun yaşamadım.", isCorrect: false },
            ],
          },
          {
            text: "S2",
            answers: [
              { text: "Hemen çözüm bulduk.", isCorrect: false },
              { text: "İşler sarpa sardı, elim kolum bağlı kaldı.", isCorrect: false },
              { text: "Başkalarına danıştım.", isCorrect: false },
            ],
          },
          {
            text: "S3",
            answers: [
              { text: "Öyledir, o çok konuşkan ve geveze.", isCorrect: false },
              { text: "Sanmıyorum, cömert insana benziyor.", isCorrect: false },
              { text: "Evet, uzun zamandır ağzını bıçak açmıyor.", isCorrect: false },
            ],
          },
          {
            text: "S4",
            answers: [
              { text: "Çünkü zaman kısıtlaması vardı.", isCorrect: false },
              { text: "Sunumu tamamlayamadım.", isCorrect: false },
              { text: "Sunum çok başarılı geçti.", isCorrect: false },
            ],
          },
          {
            text: "S5",
            answers: [
              { text: "Bu görevi tamamlamak benim için çok zordu.", isCorrect: false },
              { text: "Görev bana verilmeden önce birkaç kişi denemişti.", isCorrect: false },
              { text: "Daha önce benzer bir görevde başarılı olmuştum.", isCorrect: false },
            ],
          },
          {
            text: "S6",
            answers: [
              { text: "Yeterince vakit bulamadım.", isCorrect: false },
              { text: "Proje zaten erken bitti.", isCorrect: false },
              { text: "Ekip arkadaşım projeye katkıda bulundu.", isCorrect: false },
            ],
          },
          {
            text: "S7",
            answers: [
              { text: "Kitap çok ilginçti.", isCorrect: false },
              { text: "Okumak için yeterince zamanım olmadı.", isCorrect: false },
              { text: "Ondan sonra başka bir kitabı okumaya başladım.", isCorrect: false },
            ],
          },
          {
            text: "S8",
            answers: [
              { text: "Çünkü bana yeni bir fırsat sundu.", isCorrect: false },
              { text: "Henüz bir karar vermedim.", isCorrect: false },
              { text: "O proje çok fazla zaman alır.", isCorrect: false },
            ],
          },
        ],
      },
    ],
  });

  const buildListeningDemoPart2 = (): PartDto => ({
    title: "Bölüm 2",
    description: "Demo – S9–S14 Doğru/Yanlış",
    audioUrl: "",
    sections: [
      {
        title: "S9–S14",
        content: "Doğru/Yanlış soruları",
        imageUrl: "",
        type: "TRUE_FALSE",
        questions: [
          {
            text:
              "S9. Vücut tipine uygun bir spor seçmek, kişinin yaşam boyu spor yapma alışkanlığı kazanmasını kolaylaştırabilir.",
            answers: [
              { text: "Doğru", isCorrect: false },
              { text: "Yanlış", isCorrect: false },
            ],
          },
          {
            text:
              "S10. Bazı insanlar hiç spor yapmadan atletik ve sağlıklı bir görünüme sahip olabilirler.",
            answers: [
              { text: "Doğru", isCorrect: false },
              { text: "Yanlış", isCorrect: false },
            ],
          },
          {
            text:
              "S11. Yuvarlak vücut hatlara sahip kişiler, kolayca kilo verebilir ve spor yapmaya hemen adapte olabilirler.",
            answers: [
              { text: "Doğru", isCorrect: false },
              { text: "Yanlış", isCorrect: false },
            ],
          },
          {
            text:
              "S12. İnce yapılı kişilerin enerjileri genellikle uzun süre dayanır ve kilo verirken sadece yağ kaybederler.",
            answers: [
              { text: "Doğru", isCorrect: false },
              { text: "Yanlış", isCorrect: false },
            ],
          },
          {
            text:
              "S13. Başka bir tip insanlar metabolizmaları yavaş olduğu halde, spor yapmadan formda kalabilirler.",
            answers: [
              { text: "Doğru", isCorrect: false },
              { text: "Yanlış", isCorrect: false },
            ],
          },
          {
            text:
              "S14. Dinleme metninde geçen ‘çocuk oyuncağı’ ifadesi ‘Çocukların oynayıp eğlenmesi için yapılmış oyuncak’ anlamında kullanılmamış.",
            answers: [
              { text: "Doğru", isCorrect: false },
              { text: "Yanlış", isCorrect: false },
            ],
          },
        ],
      },
    ],
  });

  const buildListeningDemoPart3 = (): PartDto => ({
    title: "Bölüm 3",
    description: "Demo – S15–S18 Eşleştirme (konuşmacı → ifade)",
    audioUrl: "",
    sections: [
      {
        title: "S15–S18",
        content: "Konuşmacıları uygun ifadelerle eşleştirin.",
        imageUrl: "",
        type: "MATCHING",
        questions: [
          {
            text: "S15. 1. konuşmacı …",
            answers: [
              { text: "A) Terapi merkezinin tanıtım reklamı verilmiştir.", isCorrect: false },
              { text: "B) Manav ürünlerinin fiyatlarında indirim fırsatı.", isCorrect: false },
              { text: "C) Kara yolu seferleri düzenlendiğine dair bilgiler var.", isCorrect: false },
              { text: "D) İvedilik söz konusudur.", isCorrect: false },
              { text: "E) Kara yolu ulaşım aracıyla ilgili uyarı niteliğindedir", isCorrect: false },
              { text: "F) Mesai zamanı belirtilmiştir.", isCorrect: false },
            ],
          },
          {
            text: "S16. 2. konuşmacı …",
            answers: [
              { text: "A) Terapi merkezinin tanıtım reklamı verilmiştir.", isCorrect: false },
              { text: "B) Manav ürünlerinin fiyatlarında indirim fırsatı.", isCorrect: false },
              { text: "C) Kara yolu seferleri düzenlendiğine dair bilgiler var.", isCorrect: false },
              { text: "D) İvedilik söz konusudur.", isCorrect: false },
              { text: "E) Kara yolu ulaşım aracıyla ilgili uyarı niteliğindedir", isCorrect: false },
              { text: "F) Mesai zamanı belirtilmiştir.", isCorrect: false },
            ],
          },
          {
            text: "S17. 3. konuşmacı …",
            answers: [
              { text: "A) Terapi merkezinin tanıtım reklamı verilmiştir.", isCorrect: false },
              { text: "B) Manav ürünlerinin fiyatlarında indirim fırsatı.", isCorrect: false },
              { text: "C) Kara yolu seferleri düzenlendiğine dair bilgiler var.", isCorrect: false },
              { text: "D) İvedilik söz konusudur.", isCorrect: false },
              { text: "E) Kara yolu ulaşım aracıyla ilgili uyarı niteliğindedir", isCorrect: false },
              { text: "F) Mesai zamanı belirtilmiştir.", isCorrect: false },
            ],
          },
          {
            text: "S18. 4. konuşmacı …",
            answers: [
              { text: "A) Terapi merkezinin tanıtım reklamı verilmiştir.", isCorrect: false },
              { text: "B) Manav ürünlerinin fiyatlarında indirim fırsatı.", isCorrect: false },
              { text: "C) Kara yolu seferleri düzenlendiğine dair bilgiler var.", isCorrect: false },
              { text: "D) İvedilik söz konusudur.", isCorrect: false },
              { text: "E) Kara yolu ulaşım aracıyla ilgili uyarı niteliğindedir", isCorrect: false },
              { text: "F) Mesai zamanı belirtilmiştir.", isCorrect: false },
            ],
          },
        ],
      },
    ],
  });

  // Auto-initialize demo for Listening when parts are empty
  useEffect(() => {
    if (testType === "LISTENING" && parts.length === 0) {
      setParts([buildListeningDemoPart1(), buildListeningDemoPart2(), buildListeningDemoPart3()]);
      setTestTitle("Listening Demo – Bölüm 1");
      setTestDescription("Bu, dinleme için S1–S8 demo içeriğidir.");
    }
  }, [testType]);

  const addPart = () => {
    setParts([
      ...parts,
      {
        title: "",
        description: "",
        audioUrl: "",
        sections: [],
      },
    ]);
  };

  const updatePart = (index: number, updated: PartDto) => {
    const newParts = [...parts];
    newParts[index] = updated;
    setParts(newParts);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  // Build payload according to API doc with global question numbering (1..35)
  const buildPayload = (): any => {
    let globalQuestionNumber = 1;

    const builtParts = parts.map((p, pIndex) => {
      return {
        number: pIndex + 1,
        title: p.title,
        description: p.description ?? "",
        audioUrl: globalAudioUrl || p.audioUrl || "",
        sections: p.sections.map((s) => {
          const questions = s.questions
            .map((q) => {
              if (globalQuestionNumber > 35) return null;
              const currentNumber = globalQuestionNumber++;
              return {
                number: currentNumber,
                type: s.type ?? "TEXT_INPUT",
                text: q.text ?? "",
                content: q.text ?? "",
                imageUrl: q.imageUrl ?? "",
                answers: q.answers.map((a, aIndex) => ({
                  variantText: String.fromCharCode(65 + aIndex),
                  answer: String(a.text ?? ""),
                  correct: Boolean(a.isCorrect),
                })),
              };
            })
            .filter(Boolean) as any[];

          return {
            title: s.title,
            content: s.content ?? s.title ?? "",
            imageUrl: s.imageUrl ?? "",
            questions,
          };
        }),
      };
    });

    // Warn if author created more than 35 questions; extras are omitted from payload
    const totalAuthoredQuestions = parts.reduce((acc, p) => acc + p.sections.reduce((sa, s) => sa + s.questions.length, 0), 0);
    if (totalAuthoredQuestions > 35) {
      toast(() => (
        <div>
          {`Only first 35 questions are sent (of ${totalAuthoredQuestions}).`}
        </div>
      ));
    }

    return {
      title: testTitle,
      description: testDescription,
      type: testType,
      audioUrl: globalAudioUrl || undefined,
      ieltsId: ieltsId ?? undefined,
      parts: builtParts,
    } as any;
  };

  const handleSave = () => {
    if (!testTitle.trim()) {
      toast.error("Test sarlavhasi bo'sh bo'lmasligi kerak");
      return;
    }
    if (!ieltsId) {
      toast.error("IELTS ID topilmadi. Testni tegishli IELTS ga bog'lang.");
      return;
    }

    const payload = buildPayload();
    mutate(payload, {
      onSuccess: () => {
        toast.success("Test muvaffaqiyatli yaratildi");
        // clear
        setTestTitle("");
        setTestDescription("");
        setParts([]);
        navigate(backUrl);
      },
      onError: (err: any) => {
        console.error("API Error:", err);
        const msg = err?.response?.data?.error || "Xatolik yuz berdi";
        toast.error(msg);
      },
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: 24 }}>
        {testType === "LISTENING"
          ? "Listening Test Editor"
          : "Reading Test Editor"}
      </Title>
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {testType === "LISTENING" && (
            <>
              <Typography.Text strong>🎧 Global audio (barcha partlar uchun)</Typography.Text>
              <Upload
                showUploadList={false}
                accept="audio/*"
                beforeUpload={async (file) => {
                  try {
                    const result = await fileUploadMutation.mutateAsync(file);
                    if (result?.path) {
                      setGlobalAudioUrl(result.path);
                      message.success("Audio yuklandi");
                    }
                  } catch (e) {
                    message.error("Audio yuklashda xatolik");
                  }
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} loading={fileUploadMutation.isPending}>
                  {fileUploadMutation.isPending ? "Yuklanmoqda..." : "Audio faylni tanlang"}
                </Button>
              </Upload>
              {globalAudioUrl && (
                <audio controls src={globalAudioUrl} style={{ marginTop: 8 }} />
              )}
              <Divider style={{ margin: "8px 0" }} />
            </>
          )}
          <Input
            placeholder="Test title"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            size="large"
          />
          <Input.TextArea
            placeholder="Test description"
            value={testDescription}
            onChange={(e) => setTestDescription(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 6 }}
            size="large"
          />
          <Divider style={{ margin: "16px 0" }} />

          {parts.map((p, idx) => (
            <PartForm
              key={idx}
              part={p}
              onChange={(updated) => updatePart(idx, updated)}
              onRemove={() => removePart(idx)}
              hideAudioUpload={testType === "LISTENING"}
            />
          ))}

          <Button type="dashed" icon={<PlusOutlined />} onClick={addPart} block>
            Add New Part
          </Button>
        </Space>
      </Card>
      <Button type="primary" size="large" onClick={handleSave} block>
        Save Test
      </Button>
    </div>
  );
}
