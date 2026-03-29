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
  testId?: string | null;
  testType?: "LISTENING" | "READING";
  backUrl: string;
  useCreateTestWithAddition: any;
  useUpdateTestWithAddition?: any;
  useGetTestWithAddition?: (id: string) => { data?: any; isLoading?: boolean };
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
  correctVariantIndex?: number; // Index of correct variant from sharedVariants (for MATCHING type)
}

export interface SectionDto {
  title: string;
  content?: string;
  imageUrl?: string;
  type: QuestionType | null;
  questions: QuestionDto[];
  sharedVariants?: AnswerDto[]; // Shared variants for MATCHING type sections
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
  testId,
  testType,
  backUrl,
  useCreateTestWithAddition,
  useUpdateTestWithAddition,
  useGetTestWithAddition,
}: Props) {
  const [testTitle, setTestTitle] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [parts, setParts] = useState<PartDto[]>([]);
  const [globalAudioUrl, setGlobalAudioUrl] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const { mutate: createMutate } = useCreateTestWithAddition();
  const { mutate: updateMutate } = useUpdateTestWithAddition?.() || { mutate: () => {} };
  const fileUploadMutation = useFileUpload();
  const isEditing = !!testId;

  const getTestQuery = useGetTestWithAddition?.(testId || "");

  // Fetch test data when editing
  useEffect(() => {
    if (isEditing && getTestQuery?.data && !isInitialized) {
      const testData = getTestQuery.data;
      console.log("[TestEditor] Fetched test data:", testData);
      
      if (testData) {
        setTestTitle(testData.title || "");
        setTestDescription(testData.description || "");
        setGlobalAudioUrl(testData.audioUrl || "");
        
        // Transform API response to PartDto format
        if (testData.parts && Array.isArray(testData.parts)) {
          const transformedParts: PartDto[] = testData.parts.map((part: any) => ({
            title: part.title || "",
            description: part.description || "",
            audioUrl: part.audioUrl || "",
            sections: (part.sections || []).map((section: any) => {
              // Transform answers to AnswerDto format
              const transformAnswers = (questions: any[]) => {
                return questions.map((q: any) => {
                  const answers: AnswerDto[] = (q.answers || []).map((a: any) => ({
                    text: a.answer || "",
                    isCorrect: a.correct || false,
                  }));
                  
                  // Find correct variant index for MATCHING type
                  let correctVariantIndex: number | undefined;
                  if (section.type === "MATCHING" && q.answers) {
                    const correctAnswer = q.answers.find((a: any) => a.correct);
                    if (correctAnswer) {
                      correctVariantIndex = q.answers.indexOf(correctAnswer);
                    }
                  }
                  
                  return {
                    text: q.text || "",
                    content: q.content || "",
                    imageUrl: q.imageUrl || "",
                    answers,
                    correctVariantIndex,
                  };
                });
              };

              // Handle shared variants for MATCHING type
              let sharedVariants: AnswerDto[] | undefined;
              if (section.type === "MATCHING" && section.sharedVariants) {
                sharedVariants = section.sharedVariants.map((v: any) => ({
                  text: v.answer || v.variantText || "",
                  isCorrect: false,
                }));
              }

              return {
                title: section.title || "",
                content: section.content || "",
                imageUrl: section.imageUrl || "",
                type: section.type || "MULTIPLE_CHOICE",
                questions: transformAnswers(section.questions || []),
                sharedVariants,
              };
            }),
          }));
          
          if (transformedParts.length > 0) {
            setParts(transformedParts);
          }
        }
        
        setIsInitialized(true);
      }
    }
  }, [isEditing, getTestQuery?.data, isInitialized]);

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
        sharedVariants: [
          { text: "Terapi merkezinin tanıtım reklamı verilmiştir.", isCorrect: false },
          { text: "Manav ürünlerinin fiyatlarında indirim fırsatı.", isCorrect: false },
          { text: "Kara yolu seferleri düzenlendiğine dair bilgiler var.", isCorrect: false },
          { text: "İvedilik söz konusudur.", isCorrect: false },
          { text: "Kara yolu ulaşım aracıyla ilgili uyarı niteliğindedir", isCorrect: false },
          { text: "Mesai zamanı belirtilmiştir.", isCorrect: false },
        ],
        questions: [
          {
            text: "S15. 1. konuşmacı …",
            answers: [],
            correctVariantIndex: 0, // Example: first variant is correct
          },
          {
            text: "S16. 2. konuşmacı …",
            answers: [],
            correctVariantIndex: 1, // Example: second variant is correct
          },
          {
            text: "S17. 3. konuşmacı …",
            answers: [],
            correctVariantIndex: 2, // Example: third variant is correct
          },
          {
            text: "S18. 4. konuşmacı …",
            answers: [],
            correctVariantIndex: 3, // Example: fourth variant is correct
          },
        ],
      },
    ],
  });

  const buildListeningDemoPart4 = (): PartDto => ({
    title: "Bölüm 4",
    description: "Demo – Harita üstünde yerleri işaretleme (A–H)",
    audioUrl: "",
    sections: [
      {
        title: "Harita – S19–S23",
        content:
          "Dinleme metnine göre haritadaki yerleri (A–H) işaretleyiniz. Üç seçenek kullanılmayacak.",
        imageUrl: "", // kullanıcı harita görselini buradan yükleyebilir
        type: "MATCHING",
        sharedVariants: [
          { text: "A", isCorrect: false },
          { text: "B", isCorrect: false },
          { text: "C", isCorrect: false },
          { text: "D", isCorrect: false },
          { text: "E", isCorrect: false },
          { text: "F", isCorrect: false },
          { text: "G", isCorrect: false },
          { text: "H", isCorrect: false },
        ],
        questions: [
          {
            text: "S19. Spor salonu …",
            answers: [],
            correctVariantIndex: 0, // Example: first variant (A) is correct
          },
          {
            text: "S20. Gıda mağazası …",
            answers: [],
            correctVariantIndex: 1, // Example: second variant (B) is correct
          },
          {
            text: "S21. Eskişehir Oteli …",
            answers: [],
            correctVariantIndex: 2, // Example: third variant (C) is correct
          },
          {
            text: "S22. Lokanta …",
            answers: [],
            correctVariantIndex: 3, // Example: fourth variant (D) is correct
          },
          {
            text: "S23. Hayvanat bahçesi …",
            answers: [],
            correctVariantIndex: 4, // Example: fifth variant (E) is correct
          },
        ],
      },
    ],
  });

  const buildListeningDemoPart5 = (): PartDto => ({
    title: "Bölüm 5",
    description: "",
    audioUrl: "",
    sections: [
      {
        title: "1. diyalog",
        content: "",
        imageUrl: "",
        type: "MULTIPLE_CHOICE",
        questions: [
          {
            text: "S24. Karşılıklı konuşmada, salgınla ilgili hangi çıkarım yapılabilir?",
            answers: [
              { text: "A) Her iki kişi de seyahat kısıtlamaları nedeniyle belirsizlik yaşıyor.", isCorrect: false },
              { text: "B) Sadece biri etkileniyor, diğeri seyahatine devam edecek.", isCorrect: false },
              { text: "C) İkisi de salgının yakında biteceğine inanıyor.", isCorrect: false },
            ],
          },
          {
            text: "S25. Konuşmadaki gelecek planları hakkında ne söylenebilir?",
            answers: [
              { text: "A) İkisi de hedeflerini net belirlemiş ve garanti altına almış.", isCorrect: false },
              { text: "B) Biri uzun vadeli plan belirtmemişken, diğeri ekonomik çıkar planı yapıyor.", isCorrect: false },
              { text: "C) Biri zengin olmaya azimli, diğeri zengin eş bulup evlenmeyi planlıyor.", isCorrect: false },
            ],
          },
        ],
      },
      {
        title: "2. diyalog",
        content: "",
        imageUrl: "",
        type: "MULTIPLE_CHOICE",
        questions: [
          {
            text: "S26. Dinçer’in Günay’a karşı tavrı, konuşmanın başından itibaren nasıl şekilleniyor?",
            answers: [
              { text: "A) yardım etmeye istekli ve açık", isCorrect: false },
              { text: "B) mesafeli ve cimri", isCorrect: false },
              { text: "C) samimi fakat maddi yardıma yanaşmayan", isCorrect: false },
            ],
          },
          {
            text: "S27. Dinçer’in tavrı, hangi toplumsal değeri ya da normu yansıtıyor?",
            answers: [
              { text: "A) yardımseverlik ve fedakârlık", isCorrect: false },
              { text: "B) bireysel sorumluluk ve bağımsızlık", isCorrect: false },
              { text: "C) karşılıklı çıkar ilişkisine dayalı dostluk", isCorrect: false },
            ],
          },
        ],
      },
      {
        title: "3. diyalog",
        content: "",
        imageUrl: "",
        type: "MULTIPLE_CHOICE",
        questions: [
          {
            text: "S28. Mete, tatilinde yaşadığı sorunları nasıl çözümlemeye çalışmış olabilir?",
            answers: [
              { text: "A) Tatili iptal ederek her şeyi yoluna koymak.", isCorrect: false },
              { text: "B) Sabredip sonraki tatilde daha iyi plan yapmak.", isCorrect: false },
              { text: "C) Başka bir otele geçerek tatile devam etmek.", isCorrect: false },
            ],
          },
          {
            text: "S29. Aşağıdakilerden hangisi hem Mete hem de Ezgi için söylenebilir?",
            answers: [
              { text: "A) Kötü tatil deneyimi yaşamak", isCorrect: false },
              { text: "B) İyi ders çıkarmak", isCorrect: false },
              { text: "C) Planları daha düzgün yapmak", isCorrect: false },
            ],
          },
        ],
      },
    ],
  });

  const buildListeningDemoPart6 = (): PartDto => ({
    title: "Bölüm 6",
    description: "",
    audioUrl: "",
    sections: [
      {
        title: "Metin – S30–S35",
        content: "",
        imageUrl: "",
        type: "MULTIPLE_CHOICE",
        questions: [
          {
            text: "S30. Dil gelişimi …",
            answers: [
              { text: "A) doğuştan gelen bir yetiye sahiptir.", isCorrect: false },
              { text: "B) bebeklikte kazanılan kurallar bütünüdür.", isCorrect: false },
              { text: "C) çocukluğun ilk sekiz yılında neredeyse tamamlanır.", isCorrect: false },
            ],
          },
          {
            text: "S31. Aşağıdaki yargılardan hangisi çıkarılamaz?",
            answers: [
              { text: "A) Çevresel koşullar da etkilidir.", isCorrect: false },
              { text: "B) Jest ve mimik açıklamaları etkilidir.", isCorrect: false },
              { text: "C) Dil zamanla kazanılan bir kurallar bütünüdür.", isCorrect: false },
            ],
          },
          {
            text: "S32. Aşağıdakilerden hangisi çocuğun dil gelişimini destekler?",
            answers: [
              { text: "A) Anlık durumlara açıklama yapmak", isCorrect: false },
              { text: "B) Kendi sözcüklerini uydurmasını desteklemek", isCorrect: false },
              { text: "C) Uzun ve kompleks cümleler kurmak", isCorrect: false },
            ],
          },
          {
            text: "S33. Çocukla iletişimde onun uydurduğu sözcükler …",
            answers: [
              { text: "A) tercih edilmelidir.", isCorrect: false },
              { text: "B) dil gelişiminin en önemli şartıdır.", isCorrect: false },
              { text: "C) tekrar edilmemelidir.", isCorrect: false },
            ],
          },
          {
            text: "S34. Çocuğun isteğini işaretle anlatma davranışı …",
            answers: [
              { text: "A) farkında değilmiş gibi davranılmalıdır.", isCorrect: false },
              { text: "B) ödüllendirilmelidir.", isCorrect: false },
              { text: "C) anormal bir durumdur.", isCorrect: false },
            ],
          },
          {
            text: "S35. Dinlediğiniz metinde hangisine değinilmemiştir?",
            answers: [
              { text: "A) Sözcük dağarcığını geliştiren oyunlara", isCorrect: false },
              { text: "B) Dilin toplumların oluşmasındaki katkılarına", isCorrect: false },
              { text: "C) Konuşmayı iletişim yolu yapmaya yönelik yapılacaklara", isCorrect: false },
            ],
          },
        ],
      },
    ],
  });

  // Auto-initialize demo for Listening when parts are empty and not editing
  useEffect(() => {
    if (testType === "LISTENING" && parts.length === 0 && !isEditing) {
      setParts([
        buildListeningDemoPart1(),
        buildListeningDemoPart2(),
        buildListeningDemoPart3(),
        buildListeningDemoPart4(),
        buildListeningDemoPart5(),
        buildListeningDemoPart6(),
      ]);
      setTestTitle("Listening Demo – Bölüm 1");
      setTestDescription("Bu, dinleme için S1–S8 demo içeriğidir.");
    }
  }, [testType, isEditing]);

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
              
              // For MATCHING type with shared variants, use shared variants
              let answers: any[] = [];
              if (s.type === "MATCHING" && s.sharedVariants && s.sharedVariants.length > 0) {
                // Use shared variants and mark the correct one based on correctVariantIndex
                answers = s.sharedVariants.map((variant, vIndex) => ({
                  variantText: String.fromCharCode(65 + vIndex),
                  answer: String(variant.text ?? ""),
                  correct: q.correctVariantIndex === vIndex,
                }));
              } else {
                // Use question's own answers (for other types or MATCHING without shared variants)
                answers = q.answers.map((a, aIndex) => ({
                  variantText: String.fromCharCode(65 + aIndex),
                  answer: String(a.text ?? ""),
                  correct: Boolean(a.isCorrect),
                }));
              }
              
              return {
                number: currentNumber,
                type: s.type ?? "TEXT_INPUT",
                text: q.text ?? "",
                content: q.text ?? "",
                imageUrl: q.imageUrl ?? "",
                answers,
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
    if (!isEditing && !ieltsId) {
      toast.error("IELTS ID topilmadi. Testni tegishli IELTS ga bog'lang.");
      return;
    }

    const payload = buildPayload();
    
    // Remove ieltsId from payload when updating (test ID in URL is sufficient)
    if (isEditing) {
      delete (payload as any).ieltsId;
    }
    
    const onSuccess = () => {
      toast.success(isEditing ? "Test muvaffaqiyatli yangilandi" : "Test muvaffaqiyatli yaratildi");
      if (!isEditing) {
        setTestTitle("");
        setTestDescription("");
        setParts([]);
      }
      navigate(backUrl);
    };

    if (isEditing && useUpdateTestWithAddition) {
      updateMutate({ id: testId, ...payload }, {
        onSuccess,
        onError: (err: any) => {
          console.error("API Error:", err);
          const msg = err?.response?.data?.error || "Xatolik yuz berdi";
          toast.error(msg);
        },
      });
    } else {
      createMutate(payload, {
        onSuccess,
        onError: (err: any) => {
          console.error("API Error:", err);
          const msg = err?.response?.data?.error || "Xatolik yuz berdi";
          toast.error(msg);
        },
      });
    }
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
                    console.log("Audio upload result:", result);
                    const audioUrl = (result as any)?.data?.url || (result as any)?.path;
                    if (audioUrl) {
                      setGlobalAudioUrl(audioUrl);
                      console.log("Set globalAudioUrl to:", audioUrl);
                      message.success("Audio yuklandi");
                    }
                  } catch (e) {
                    console.error("Audio upload error:", e);
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
                <div style={{ marginTop: 8 }}>
                  <audio 
                    controls 
                    src={globalAudioUrl} 
                    style={{ width: "100%" }}
                    onError={(e) => {
                      console.error("Audio load error:", e);
                      console.log("Failed to load audio URL:", globalAudioUrl);
                    }}
                  />
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    Audio URL: {globalAudioUrl}
                  </div>
                </div>
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
