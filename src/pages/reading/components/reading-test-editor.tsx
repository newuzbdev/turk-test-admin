import React, { useState, useEffect } from "react";
import { Button, Card, Input, Space, Typography, Divider, Steps, message } from "antd";
import { PlusOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useCreateReadingTestWithAddition } from "@/config/queries/reading/create.queries";
import ReadingSectionEditor from "./reading-section-editor";
import toast from "react-hot-toast";

const { Title, Text } = Typography;
const { Step } = Steps;

export interface ReadingQuestion {
  id: string;
  blankNumber: number; // S1, S2, S3, etc.
  correctAnswer: string; // The correct option (A, B, C, etc.)
  options: {
    letter: string;
    text: string;
  }[];
}

export interface ReadingSection {
  id: string;
  title: string;
  content: string;
  questions: ReadingQuestion[];
}

export interface ReadingPart {
  id: string;
  title: string;
  description?: string;
  sections: ReadingSection[];
}

interface ReadingTestEditorProps {
  ieltsId: string;
  backUrl: string;
}

export default function ReadingTestEditor({ ieltsId, backUrl }: ReadingTestEditorProps) {
  const [testTitle, setTestTitle] = useState("IELTS Reading Test - Batıl İnançlar & Durum Eşleştirme");
  const [testDescription, setTestDescription] = useState("Turkish reading comprehension test with blank filling and matching exercises");
  const [parts, setParts] = useState<ReadingPart[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { mutate: createTest, isPending } = useCreateReadingTestWithAddition();

  // Build Part 2 demo (matching exercise)
  const buildDemoPart2 = (): ReadingPart => ({
    id: "demo-part-2",
    title: "Part 2 - Durum Eşleştirme",
    description: "Matching situations with information texts",
    sections: [
      {
        id: "demo-section-2-cases",
        title: "Durumlar (A–J)",
        content:
          `A) Baytar olarak çalışmak istiyorsunuz.\n` +
          `B) Aracınızda bir arıza var, onarmak istiyorsunuz.\n` +
          `C) Kangalınız kuduz olduğunda, sorunu çözmek istiyorsunuz.\n` +
          `D) Bir yakınınız, yeni ve cazip bir apartmanda bir daire kiralamak istiyor.\n` +
          `E) Evinizi tamir etmek istiyorsunuz.\n` +
          `F) Evinizin duvarlarını boyatmak istiyorsunuz.\n` +
          `G) Gece yarısı kızınız dental implant ağrısıyla uyandı.\n` +
          `H) Komşunuz, özel bir yemek masası yaptırmak istiyor.\n` +
          `I) İstanbul’da sakin ve yeşil bir ortamda yeni bir daire satın almak istiyorsunuz.\n` +
          `J) Lazerle göz estetik yöntemleri hakkında bilgi almak istiyorsunuz.`,
        questions: [],
      },
      {
        id: "demo-section-2-ads",
        title: "Bilgi Metinleri (7-14)",
        content: `S7) İSTANBUL-SİLİVRİSARAY EVLERİ — Denize sıfır, yeşil ve huzurlu ortam, hemen teslim satılık daireler.\n\nS8) OTOMOBİL SERVİSİ — Tüm marka araçlar için tamir ve 7/24 yol yardımı.\n\nS9) VETERİNER KLİNİĞİ — Aşı, kuduz tedavisi ve cerrahi hizmetleri.\n\nS10) İNŞAAT VE TADİLAT — Ev tamiri, duvar boyama, elektrik ve su tesisatı.\n\nS11) HOSPİDENT — 7/24 diş tedavisi, lazer ve estetik uygulamalar.\n\nS12) MOBİLYA ATÖLYESİ — Özel tasarım yemek masası ve mobilyalar.\n\nS13) GÖZ KLİNİĞİ — Lazerle göz estetiği, LASIK, PRK, katarakt.\n\nS14) EMLAK OFİSİ — İstanbul'da satılık/kiralık daire, profesyonel danışmanlık.`,
        questions: [],
      },
      {
        id: "demo-section-2",
        title: "Matching Exercise",
        content: `Sorular 7-14. Durum (A-J) → Bilgi metni (7-14) eşleştirin. Her seçenek bir kez kullanılabilir. İki seçenek boş kalır.`,
        questions: [
          {
            id: "demo-q7",
            blankNumber: 7,
            correctAnswer: "C",
            options: [
              { letter: "A", text: "Baytar olarak çalışmak istiyorsunuz" },
              { letter: "B", text: "Aracınızda bir arıza var, onarmak istiyorsunuz" },
              { letter: "C", text: "Kangalınız kuduz olduğunda, sorunu çözmek istiyorsunuz" },
              { letter: "D", text: "Bir yakınınız, yeni ve cazip bir apartmanda bir daire kiralamak istiyor" },
              { letter: "E", text: "Evinizi tamir etmek istiyorsunuz" },
              { letter: "F", text: "Evinizin duvarlarını boyatmak istiyorsunuz" },
              { letter: "G", text: "Gece yarısı kızınız dental implant ağrısıyla uyandı" },
              { letter: "H", text: "Komşunuz, özel bir yemek masası yaptırmak istiyor" },
              { letter: "I", text: "İstanbul’da sakin ve yeşil ortamda yeni daire satın almak istiyorsunuz" },
              { letter: "J", text: "Lazerle göz estetik yöntemleri hakkında bilgi almak istiyorsunuz" },
            ],
          },
          {
            id: "demo-q8",
            blankNumber: 8,
            correctAnswer: "B",
            options: [
              { letter: "A", text: "Baytar olarak çalışmak istiyorsunuz" },
              { letter: "B", text: "Aracınızda bir arıza var, onarmak istiyorsunuz" },
              { letter: "C", text: "Kangalınız kuduz olduğunda, sorunu çözmek istiyorsunuz" },
              { letter: "D", text: "Bir yakınınız, yeni ve cazip bir apartmanda bir daire kiralamak istiyor" },
              { letter: "E", text: "Evinizi tamir etmek istiyorsunuz" },
              { letter: "F", text: "Evinizin duvarlarını boyatmak istiyorsunuz" },
              { letter: "G", text: "Gece yarısı kızınız dental implant ağrısıyla uyandı" },
              { letter: "H", text: "Komşunuz, özel bir yemek masası yaptırmak istiyor" },
              { letter: "I", text: "İstanbul’da sakin ve yeşil ortamda yeni daire satın almak istiyorsunuz" },
              { letter: "J", text: "Lazerle göz estetik yöntemleri hakkında bilgi almak istiyorsunuz" },
            ],
          },
          {
            id: "demo-q9",
            blankNumber: 9,
            correctAnswer: "A",
            options: [
              { letter: "A", text: "Baytar olarak çalışmak istiyorsunuz" },
              { letter: "B", text: "Aracınızda bir arıza var, onarmak istiyorsunuz" },
              { letter: "C", text: "Kangalınız kuduz olduğunda, sorunu çözmek istiyorsunuz" },
              { letter: "D", text: "Bir yakınınız, yeni ve cazip bir apartmanda bir daire kiralamak istiyor" },
              { letter: "E", text: "Evinizi tamir etmek istiyorsunuz" },
              { letter: "F", text: "Evinizin duvarlarını boyatmak istiyorsunuz" },
              { letter: "G", text: "Gece yarısı kızınız dental implant ağrısıyla uyandı" },
              { letter: "H", text: "Komşunuz, özel bir yemek masası yaptırmak istiyor" },
              { letter: "I", text: "İstanbul’da sakin ve yeşil ortamda yeni daire satın almak istiyorsunuz" },
              { letter: "J", text: "Lazerle göz estetik yöntemleri hakkında bilgi almak istiyorsunuz" },
            ],
          },
          {
            id: "demo-q10",
            blankNumber: 10,
            correctAnswer: "E",
            options: [
              { letter: "A", text: "Baytar olarak çalışmak istiyorsunuz" },
              { letter: "B", text: "Aracınızda bir arıza var, onarmak istiyorsunuz" },
              { letter: "C", text: "Kangalınız kuduz olduğunda, sorunu çözmek istiyorsunuz" },
              { letter: "D", text: "Bir yakınınız, yeni ve cazip bir apartmanda bir daire kiralamak istiyor" },
              { letter: "E", text: "Evinizi tamir etmek istiyorsunuz" },
              { letter: "F", text: "Evinizin duvarlarını boyatmak istiyorsunuz" },
              { letter: "G", text: "Gece yarısı kızınız dental implant ağrısıyla uyandı" },
              { letter: "H", text: "Komşunuz, özel bir yemek masası yaptırmak istiyor" },
              { letter: "I", text: "İstanbul’da sakin ve yeşil ortamda yeni daire satın almak istiyorsunuz" },
              { letter: "J", text: "Lazerle göz estetik yöntemleri hakkında bilgi almak istiyorsunuz" },
            ],
          },
          {
            id: "demo-q11",
            blankNumber: 11,
            correctAnswer: "F",
            options: [
              { letter: "A", text: "Baytar olarak çalışmak istiyorsunuz" },
              { letter: "B", text: "Aracınızda bir arıza var, onarmak istiyorsunuz" },
              { letter: "C", text: "Kangalınız kuduz olduğunda, sorunu çözmek istiyorsunuz" },
              { letter: "D", text: "Bir yakınınız, yeni ve cazip bir apartmanda bir daire kiralamak istiyor" },
              { letter: "E", text: "Evinizi tamir etmek istiyorsunuz" },
              { letter: "F", text: "Evinizin duvarlarını boyatmak istiyorsunuz" },
              { letter: "G", text: "Gece yarısı kızınız dental implant ağrısıyla uyandı" },
              { letter: "H", text: "Komşunuz, özel bir yemek masası yaptırmak istiyor" },
              { letter: "I", text: "İstanbul’da sakin ve yeşil ortamda yeni daire satın almak istiyorsunuz" },
              { letter: "J", text: "Lazerle göz estetik yöntemleri hakkında bilgi almak istiyorsunuz" },
            ],
          },
          {
            id: "demo-q12",
            blankNumber: 12,
            correctAnswer: "G",
            options: [
              { letter: "A", text: "Baytar olarak çalışmak istiyorsunuz" },
              { letter: "B", text: "Aracınızda bir arıza var, onarmak istiyorsunuz" },
              { letter: "C", text: "Kangalınız kuduz olduğunda, sorunu çözmek istiyorsunuz" },
              { letter: "D", text: "Bir yakınınız, yeni ve cazip bir apartmanda bir daire kiralamak istiyor" },
              { letter: "E", text: "Evinizi tamir etmek istiyorsunuz" },
              { letter: "F", text: "Evinizin duvarlarını boyatmak istiyorsunuz" },
              { letter: "G", text: "Gece yarısı kızınız dental implant ağrısıyla uyandı" },
              { letter: "H", text: "Komşunuz, özel bir yemek masası yaptırmak istiyor" },
              { letter: "I", text: "İstanbul’da sakin ve yeşil ortamda yeni daire satın almak istiyorsunuz" },
              { letter: "J", text: "Lazerle göz estetik yöntemleri hakkında bilgi almak istiyorsunuz" },
            ],
          },
          {
            id: "demo-q13",
            blankNumber: 13,
            correctAnswer: "H",
            options: [
              { letter: "A", text: "Baytar olarak çalışmak istiyorsunuz" },
              { letter: "B", text: "Aracınızda bir arıza var, onarmak istiyorsunuz" },
              { letter: "C", text: "Kangalınız kuduz olduğunda, sorunu çözmek istiyorsunuz" },
              { letter: "D", text: "Bir yakınınız, yeni ve cazip bir apartmanda bir daire kiralamak istiyor" },
              { letter: "E", text: "Evinizi tamir etmek istiyorsunuz" },
              { letter: "F", text: "Evinizin duvarlarını boyatmak istiyorsunuz" },
              { letter: "G", text: "Gece yarısı kızınız dental implant ağrısıyla uyandı" },
              { letter: "H", text: "Komşunuz, özel bir yemek masası yaptırmak istiyor" },
              { letter: "I", text: "İstanbul’da sakin ve yeşil ortamda yeni daire satın almak istiyorsunuz" },
              { letter: "J", text: "Lazerle göz estetik yöntemleri hakkında bilgi almak istiyorsunuz" },
            ],
          },
          {
            id: "demo-q14",
            blankNumber: 14,
            correctAnswer: "I",
            options: [
              { letter: "A", text: "Baytar olarak çalışmak istiyorsunuz" },
              { letter: "B", text: "Aracınızda bir arıza var, onarmak istiyorsunuz" },
              { letter: "C", text: "Kangalınız kuduz olduğunda, sorunu çözmek istiyorsunuz" },
              { letter: "D", text: "Bir yakınınız, yeni ve cazip bir apartmanda bir daire kiralamak istiyor" },
              { letter: "E", text: "Evinizi tamir etmek istiyorsunuz" },
              { letter: "F", text: "Evinizin duvarlarını boyatmak istiyorsunuz" },
              { letter: "G", text: "Gece yarısı kızınız dental implant ağrısıyla uyandı" },
              { letter: "H", text: "Komşunuz, özel bir yemek masası yaptırmak istiyor" },
              { letter: "I", text: "İstanbul’da sakin ve yeşil ortamda yeni daire satın almak istiyorsunuz" },
              { letter: "J", text: "Lazerle göz estetik yöntemleri hakkında bilgi almak istiyorsunuz" },
            ],
          },
        ],
      },
    ],
  });

  // Initialize with demo data
  React.useEffect(() => {
    if (parts.length === 0) {
      const demoPart: ReadingPart = {
        id: "demo-part-1",
        title: "Part 1 - Batıl İnançlar",
        description: "Turkish reading passage about superstitions",
        sections: [
          {
            id: "demo-section-1",
            title: "Reading Passage",
            content: `Batıl inançlar, bilimsel bir temele dayanmayan, ancak birçok insanın günlük 
yaşamında etkili olan inanışlardır. Tarih boyunca insanlar, doğa olaylarını ve 
açıklayamadıkları durumları __________ (S1) güçlerle ilişkilendirmişlerdir. Bu inançlar, 
nesilden nesle aktarılmış ve bazıları günümüzde bile varlığını sürdürmektedir. 

En yaygın batıl inançlardan biri, kara kedinin önünden geçmesinin __________ (S2) 
getireceğine inanılmasıdır. Bunun kökeni Orta Çağ'a dayanır; o dönemde kara kedilerin 
cadılarla ilişkilendirildiği düşünülürdü. 

Batıl inançlar sadece kötü şansla ilgili değildir; bazıları iyi şans getirdiğine inanılan 
ritüelleri de içerir. Örneğin, nazar boncuğu takmak, kişiyi kötü enerjilerden koruduğuna 
inanılan yaygın bir gelenektir. Nazar inancı, eski Türk kültürüne dayansa da, günümüzde 
Türkiye'nin ________ (S3) birçok farklı kültürde de yaygındır. 

Batıl inançların insanlar üzerindeki etkisi oldukça __________ (S4). Özellikle 
önemli kararlar alınırken ya da yeni bir işe başlanırken bu inançlar dikkate alınabilir. 
Örneğin, yeni bir eve taşınmadan önce eve tuz dökmenin kötü ruhları uzaklaştıracağına 
inanılır. Benzer şekilde, merdiven altından geçmenin kötü şans getirdiğine dair inanış da 
hâlâ birçok insan tarafından dikkate alınmaktadır. 

Günümüzde bilimin ilerlemesiyle batıl inançların _______ (S5) alanı azalmış olsa 
da, bu ________ (S6) inançlar kültürel mirasın bir parçası olarak yaşamaya devam 
etmektedir. İnsanların açıklayamadıkları olaylara karşı geliştirdikleri bu inanışlar, zamanla 
toplumların kimliklerinin bir parçası hâline gelmiştir.`,
            questions: [
              {
                id: "demo-q1",
                blankNumber: 1,
                correctAnswer: "B",
                options: [
                  { letter: "A", text: "derin" },
                  { letter: "B", text: "doğaüstü" },
                  { letter: "C", text: "kademsizlik" },
                  { letter: "D", text: "çeşit" },
                  { letter: "E", text: "yanı sıra" },
                  { letter: "F", text: "etki" },
                  { letter: "G", text: "köylerinde" },
                  { letter: "H", text: "yüzeysel" },
                ],
              },
              {
                id: "demo-q2",
                blankNumber: 2,
                correctAnswer: "F",
                options: [
                  { letter: "A", text: "derin" },
                  { letter: "B", text: "doğaüstü" },
                  { letter: "C", text: "kademsizlik" },
                  { letter: "D", text: "çeşit" },
                  { letter: "E", text: "yanı sıra" },
                  { letter: "F", text: "etki" },
                  { letter: "G", text: "köylerinde" },
                  { letter: "H", text: "yüzeysel" },
                ],
              },
              {
                id: "demo-q3",
                blankNumber: 3,
                correctAnswer: "E",
                options: [
                  { letter: "A", text: "derin" },
                  { letter: "B", text: "doğaüstü" },
                  { letter: "C", text: "kademsizlik" },
                  { letter: "D", text: "çeşit" },
                  { letter: "E", text: "yanı sıra" },
                  { letter: "F", text: "etki" },
                  { letter: "G", text: "köylerinde" },
                  { letter: "H", text: "yüzeysel" },
                ],
              },
              {
                id: "demo-q4",
                blankNumber: 4,
                correctAnswer: "A",
                options: [
                  { letter: "A", text: "derin" },
                  { letter: "B", text: "doğaüstü" },
                  { letter: "C", text: "kademsizlik" },
                  { letter: "D", text: "çeşit" },
                  { letter: "E", text: "yanı sıra" },
                  { letter: "F", text: "etki" },
                  { letter: "G", text: "köylerinde" },
                  { letter: "H", text: "yüzeysel" },
                ],
              },
              {
                id: "demo-q5",
                blankNumber: 5,
                correctAnswer: "H",
                options: [
                  { letter: "A", text: "derin" },
                  { letter: "B", text: "doğaüstü" },
                  { letter: "C", text: "kademsizlik" },
                  { letter: "D", text: "çeşit" },
                  { letter: "E", text: "yanı sıra" },
                  { letter: "F", text: "etki" },
                  { letter: "G", text: "köylerinde" },
                  { letter: "H", text: "yüzeysel" },
                ],
              },
              {
                id: "demo-q6",
                blankNumber: 6,
                correctAnswer: "C",
                options: [
                  { letter: "A", text: "derin" },
                  { letter: "B", text: "doğaüstü" },
                  { letter: "C", text: "kademsizlik" },
                  { letter: "D", text: "çeşit" },
                  { letter: "E", text: "yanı sıra" },
                  { letter: "F", text: "etki" },
                  { letter: "G", text: "köylerinde" },
                  { letter: "H", text: "yüzeysel" },
                ],
              },
            ],
          },
        ],
      };
      // preload both demos: Part 1 and Part 2
      setParts([demoPart, buildDemoPart2()]);
    }
  }, [parts.length]);

  const addPart = () => {
    const newPart: ReadingPart = {
      id: `part-${Date.now()}`,
      title: `Part ${parts.length + 1}`,
      description: "",
      sections: [],
    };
    setParts([...parts, newPart]);
  };

  const updatePart = (partId: string, updated: ReadingPart) => {
    setParts(parts.map(p => p.id === partId ? updated : p));
  };

  const removePart = (partId: string) => {
    setParts(parts.filter(p => p.id !== partId));
  };

  const addSection = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;

    const newSection: ReadingSection = {
      id: `section-${Date.now()}`,
      title: `Section ${part.sections.length + 1}`,
      content: "",
      questions: [],
    };

    updatePart(partId, {
      ...part,
      sections: [...part.sections, newSection],
    });
  };

  const updateSection = (partId: string, sectionId: string, updated: ReadingSection) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;

    const updatedSections = part.sections.map(s => s.id === sectionId ? updated : s);
    updatePart(partId, { ...part, sections: updatedSections });
  };

  const removeSection = (partId: string, sectionId: string) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;

    const updatedSections = part.sections.filter(s => s.id !== sectionId);
    updatePart(partId, { ...part, sections: updatedSections });
  };

  const handleSave = () => {
    if (!testTitle.trim()) {
      toast.error("Test sarlavhasi bo'sh bo'lmasligi kerak");
      return;
    }

    if (parts.length === 0) {
      toast.error("Kamida bitta part qo'shish kerak");
      return;
    }

    // Validate that all parts have sections
    const hasEmptyParts = parts.some(part => part.sections.length === 0);
    if (hasEmptyParts) {
      toast.error("Barcha partlarda kamida bitta section bo'lishi kerak");
      return;
    }

    // Build payload according to API structure
    const payload = {
      title: testTitle,
      description: testDescription,
      type: "READING",
      ieltsId: ieltsId,
      parts: parts.map((part, partIndex) => ({
        number: partIndex + 1,
        title: part.title,
        audioUrl: "", // Reading tests don't need audio
        sections: part.sections.map((section, sectionIndex) => ({
          title: section.title,
          content: section.content,
          imageUrl: "", // Can be added later if needed
          questions: section.questions.map((question, questionIndex) => ({
            number: questionIndex + 1,
            type: "MULTIPLE_CHOICE",
            text: `S${question.blankNumber} uchun to'g'ri javobni tanlang`,
            answers: question.options.map((option, optionIndex) => ({
              variantText: option.letter,
              answer: option.text,
              correct: option.letter === question.correctAnswer,
            })),
          })),
        })),
      })),
    };

    createTest(payload, {
      onSuccess: () => {
        toast.success("Reading test muvaffaqiyatli yaratildi");
        navigate(backUrl);
      },
      onError: (error: any) => {
        console.error("API Error:", error);
        const msg = error?.response?.data?.error || "Xatolik yuz berdi";
        toast.error(msg);
      },
    });
  };

  const steps = [
    {
      title: "Test ma'lumotlari",
      description: "Test sarlavhasi va tavsifi",
    },
    {
      title: "Partlar",
      description: "Reading test partlarini qo'shish",
    },
    {
      title: "Tekshirish",
      description: "Testni tekshirish va saqlash",
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
        Reading Test Editor
      </Title>
      
      {parts.length > 0 && parts[0].id.startsWith("demo-") && (
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 12,
            backgroundColor: "#e6f7ff",
            border: "1px solid #91d5ff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
                🎯 Demo Mode - Interactive Template
              </Text>
              <br />
              <Text type="secondary">
                This is a pre-filled demo with Turkish text. You can edit all questions and variants, or clear to start fresh.
              </Text>
            </div>
            <Button
              onClick={() => {
                setParts([]);
                setTestTitle("");
                setTestDescription("");
              }}
              danger
            >
              Clear Demo & Start Fresh
            </Button>
          </div>
        </Card>
      )}

      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        {steps.map((step, index) => (
          <Step key={index} title={step.title} description={step.description} />
        ))}
      </Steps>

      {currentStep === 0 && (
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          bodyStyle={{ padding: 32 }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Text strong style={{ fontSize: 16, marginBottom: 8, display: "block" }}>
                Test sarlavhasi *
              </Text>
              <Input
                placeholder="Masalan: IELTS Reading Test 1"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                size="large"
                style={{ fontSize: 16 }}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: 16, marginBottom: 8, display: "block" }}>
                Test tavsifi
              </Text>
              <Input.TextArea
                placeholder="Test haqida qisqacha ma'lumot..."
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                autoSize={{ minRows: 3, maxRows: 6 }}
                size="large"
                style={{ fontSize: 16 }}
              />
            </div>

            <Button
              type="primary"
              size="large"
              onClick={() => setCurrentStep(1)}
              disabled={!testTitle.trim()}
              style={{ width: "100%" }}
            >
              Keyingi qadam
            </Button>
          </Space>
        </Card>
      )}

      {currentStep === 1 && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {parts.map((part, partIndex) => (
            <Card
              key={part.id}
              style={{
                marginBottom: 24,
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <Input
                    placeholder="Part sarlavhasi"
                    value={part.title}
                    onChange={(e) => updatePart(part.id, { ...part, title: e.target.value })}
                    size="large"
                    style={{ flex: 1, fontSize: 18, fontWeight: "bold" }}
                  />
                  <Button
                    danger
                    onClick={() => removePart(part.id)}
                    icon={<DeleteOutlined />}
                  >
                    O'chirish
                  </Button>
                </div>
              }
            >
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div>
                  <Text strong style={{ fontSize: 16, marginBottom: 8, display: "block" }}>
                    Part tavsifi (ixtiyoriy)
                  </Text>
                  <Input.TextArea
                    placeholder="Part haqida qisqacha ma'lumot..."
                    value={part.description || ""}
                    onChange={(e) => updatePart(part.id, { ...part, description: e.target.value })}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    size="large"
                  />
                </div>

                <Divider />

                <div>
                  <Text strong style={{ fontSize: 16, marginBottom: 16, display: "block" }}>
                    Sections ({part.sections.length})
                  </Text>

                  {part.sections.map((section, sectionIndex) => (
                    <ReadingSectionEditor
                      key={section.id}
                      section={section}
                      sectionNumber={sectionIndex + 1}
                      onChange={(updated) => updateSection(part.id, section.id, updated)}
                      onRemove={() => removeSection(part.id, section.id)}
                    />
                  ))}

                  <Button
                    type="dashed"
                    onClick={() => addSection(part.id)}
                    icon={<PlusOutlined />}
                    block
                    size="large"
                    style={{ marginTop: 16 }}
                  >
                    + Section qo'shish
                  </Button>
                </div>
              </Space>
            </Card>
          ))}

          <Button
            type="dashed"
            onClick={addPart}
            icon={<PlusOutlined />}
            block
            size="large"
            style={{ marginBottom: 24 }}
          >
            + Part qo'shish
          </Button>

          <div style={{ display: "flex", gap: 16, justifyContent: "space-between" }}>
            <Button size="large" onClick={() => setCurrentStep(0)}>
              Orqaga
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={() => setCurrentStep(2)}
              disabled={parts.length === 0}
            >
              Keyingi qadam
            </Button>
          </div>
        </Space>
      )}

      {currentStep === 2 && (
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          bodyStyle={{ padding: 32 }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Title level={3}>Test ma'lumotlari</Title>
            
            <div>
              <Text strong>Sarlavha:</Text> {testTitle}
            </div>
            <div>
              <Text strong>Tavsif:</Text> {testDescription || "Tavsif kiritilmagan"}
            </div>
            <div>
              <Text strong>Partlar soni:</Text> {parts.length}
            </div>
            <div>
              <Text strong>Jami sections:</Text> {parts.reduce((total, part) => total + part.sections.length, 0)}
            </div>
            <div>
              <Text strong>Jami savollar:</Text> {parts.reduce((total, part) => 
                total + part.sections.reduce((sectionTotal, section) => 
                  sectionTotal + section.questions.length, 0), 0)}
            </div>

            <Divider />

            <div style={{ display: "flex", gap: 16, justifyContent: "space-between" }}>
              <Button size="large" onClick={() => setCurrentStep(1)}>
                Orqaga
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleSave}
                loading={isPending}
                icon={<SaveOutlined />}
              >
                Testni saqlash
              </Button>
            </div>
          </Space>
        </Card>
      )}
    </div>
  );
}
