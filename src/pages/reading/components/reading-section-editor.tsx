import  { useState, useEffect } from "react";
import { Button, Card, Input, Space, Typography, Divider, Select, message, Alert, Upload, Image } from "antd";
import { DeleteOutlined, PlusOutlined, EditOutlined, UploadOutlined } from "@ant-design/icons";
import type { ReadingSection, ReadingQuestion } from "./reading-test-editor";
import { useFileUpload } from "@/config/queries/file/upload.queries";
import MockEvidenceEditor from "@/shared/components/mock-evidence-editor";

const {  Text } = Typography;
const { TextArea } = Input;

interface ReadingSectionEditorProps {
  section: ReadingSection;
  sectionNumber: number;
  isPartTwo?: boolean;
  locale?: "legacy" | "tr";
  allowRemove?: boolean;
  showDemoBadge?: boolean;
  onChange: (section: ReadingSection) => void;
  onRemove: () => void;
}

export default function ReadingSectionEditor({
  section,
  isPartTwo = false,
  locale = "legacy",
  allowRemove = true,
  showDemoBadge = true,
  onChange,
  onRemove,
}: ReadingSectionEditorProps) {
  const isTurkish = locale === "tr";
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState(section.content);
  const fileUploadMutation = useFileUpload();
  const FILE_BASE = `${(import.meta.env.VITE_API_URL || "https://api.turkishmock.uz").replace(/\/+$/, "")}/`;
  const [uploadingQuestionIndex, setUploadingQuestionIndex] = useState<number | null>(null);
  const [_isSectionUploading, setIsSectionUploading] = useState(false);

  // Extract blanks from content (S1, S2, S3, etc.)
  const extractBlanks = (content: string) => {
    const blankRegex = /\(S(\d+)\)/g;
    const blanks: number[] = [];
    let match;
    while ((match = blankRegex.exec(content)) !== null) {
      blanks.push(parseInt(match[1]));
    }
    return blanks.sort((a, b) => a - b);
  };

  const blanks = extractBlanks(section.content);

  // Auto-generate questions for blanks that don't have questions yet (only when blanks exist)
  useEffect(() => {
    if (blanks.length === 0) return; // Do not touch questions if there are no (S1) style blanks
    const newQuestions: ReadingQuestion[] = [];
    
    blanks.forEach(blankNumber => {
      const existingQuestion = section.questions.find(q => q.blankNumber === blankNumber);
      if (!existingQuestion) {
        newQuestions.push({
          id: `question-${blankNumber}-${Date.now()}`,
          blankNumber,
          correctAnswer: "",
          options: [
            { letter: "A", text: "" },
            { letter: "B", text: "" },
            { letter: "C", text: "" },
            { letter: "D", text: "" },
            { letter: "E", text: "" },
            { letter: "F", text: "" },
            { letter: "G", text: "" },
            { letter: "H", text: "" },
          ],
        });
      }
    });

    // Remove questions for blanks that no longer exist
    const validQuestions = section.questions.filter(q => blanks.includes(q.blankNumber));

    if (newQuestions.length > 0 || validQuestions.length !== section.questions.length) {
      onChange({
        ...section,
        questions: [...validQuestions, ...newQuestions],
      });
    }
  }, [blanks.join(",")]);

  const updateField = (field: keyof ReadingSection, value: any) => {
    onChange({ ...section, [field]: value });
  };

  const updateQuestion = (questionId: string, updated: ReadingQuestion) => {
    const updatedQuestions = section.questions.map(q => 
      q.id === questionId ? updated : q
    );
    onChange({ ...section, questions: updatedQuestions });
  };

  const removeQuestion = (questionId: string) => {
    const updatedQuestions = section.questions.filter(q => q.id !== questionId);
    onChange({ ...section, questions: updatedQuestions });
  };

  const addOption = (questionId: string) => {
    const question = section.questions.find(q => q.id === questionId);
    if (!question) return;

    const lastLetter = question.options[question.options.length - 1]?.letter || "A";
    const nextLetter = String.fromCharCode(lastLetter.charCodeAt(0) + 1);
    
    if (nextLetter > "Z") {
      message.warning(isTurkish ? "En fazla 26 seçenek eklenebilir" : "Maksimal 26 ta variant qo'shish mumkin");
      return;
    }

    const updatedQuestion = {
      ...question,
      options: [...question.options, { letter: nextLetter, text: "" }],
    };
    updateQuestion(questionId, updatedQuestion);
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = section.questions.find(q => q.id === questionId);
    if (!question) return;

    if (question.options.length <= 2) {
      message.warning(isTurkish ? "En az 2 seçenek olmalıdır" : "Kamida 2 ta variant bo'lishi kerak");
      return;
    }

    const updatedQuestion = {
      ...question,
      options: question.options.filter((_, index) => index !== optionIndex),
    };
    updateQuestion(questionId, updatedQuestion);
  };

  const updateOption = (questionId: string, optionIndex: number, text: string) => {
    const question = section.questions.find(q => q.id === questionId);
    if (!question) return;

    const updatedOptions = question.options.map((option, index) => 
      index === optionIndex ? { ...option, text } : option
    );
    
    const updatedQuestion = {
      ...question,
      options: updatedOptions,
    };
    updateQuestion(questionId, updatedQuestion);
  };

  const handleQuestionImageUpload = async (questionIndex: number, question: ReadingQuestion, file: File) => {
    try {
      setUploadingQuestionIndex(questionIndex);
      const result = await fileUploadMutation.mutateAsync(file);
      const uploadedUrl =
        (result as any)?.data?.url || (result as any)?.data?.reference;
      console.log('[Reading] Uploaded question image result:', result, 'resolvedUrl:', uploadedUrl);
      if (uploadedUrl) {
        // Replace by index to avoid any id-mismatch issues
        const nextQuestions = [...section.questions];
        nextQuestions[questionIndex] = { ...question, imageUrl: uploadedUrl, text: "" };
        onChange({ ...section, questions: nextQuestions });
        message.success(isTurkish ? "Soru görseli yüklendi" : "Savol rasmi yuklandi");
      }
    } catch (e) {
      message.error(isTurkish ? "Görsel yüklenemedi" : "Rasm yuklashda xatolik");
    } finally {
      setUploadingQuestionIndex(null);
    }
    return;
  };

  const handleSectionImageUpload = async (file: File) => {
    try {
      setIsSectionUploading(true);
      const result = await fileUploadMutation.mutateAsync(file);
      const uploadedUrl =
        (result as any)?.data?.url || (result as any)?.data?.reference;
      console.log('[Reading] Uploaded section image result:', result, 'resolvedUrl:', uploadedUrl);
      if (uploadedUrl) {
        updateField("imageUrl", uploadedUrl);
        message.success(isTurkish ? "İçerik görseli yüklendi" : "Section rasmi yuklandi");
      }
    } catch (e) {
      message.error(isTurkish ? "Görsel yüklenemedi" : "Rasm yuklashda xatolik");
    } finally {
      setIsSectionUploading(false);
    }
    return false;
  };


  const handleContentSave = () => {
    updateField("content", tempContent);
    setIsEditing(false);
    message.success(isTurkish ? "Metin kaydedildi" : "Content saqlandi");
  };

  const handleContentCancel = () => {
    setTempContent(section.content);
    setIsEditing(false);
  };

  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 8,
        border: "none",
        background: "transparent",
      }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Input
            placeholder={isTurkish ? "İçerik başlığı" : "Section sarlavhasi"}
            value={section.title}
            onChange={(e) => updateField("title", e.target.value)}
            size="large"
            style={{ flex: 1, fontSize: 16, fontWeight: "bold" }}
          />
          {showDemoBadge && section.id.startsWith("demo-") && (
            <span style={{ 
              backgroundColor: "#1890ff", 
              color: "white", 
              padding: "4px 8px", 
              borderRadius: "4px", 
              fontSize: "12px",
              fontWeight: "bold"
            }}>
              DEMO
            </span>
          )}
          {allowRemove && (
            <Button
              danger
              onClick={onRemove}
              icon={<DeleteOutlined />}
              size="small"
            >
              {isTurkish ? "Sil" : "O'chirish"}
            </Button>
          )}
        </div>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Content Editor */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text strong style={{ fontSize: 16 }}>
              {isTurkish
                ? "Metin ve boşluklar"
                : "📄 Matn (S1, S2, S3... bo'sh joylar bilan)"}
            </Text>
            {!isEditing && (
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
                size="small"
              >
                {isTurkish ? "Düzenle" : "Tahrirlash"}
              </Button>
            )}
          </div>

          {isEditing ? (
            <div>
              <TextArea
                value={tempContent}
                onChange={(e) => setTempContent(e.target.value)}
                rows={8}
                placeholder={
                  isTurkish
                    ? "Metni girin. Boşluklar için (S1), (S2), (S3) biçimini kullanın."
                    : "Matnni kiriting. Bo'sh joylar uchun (S1), (S2), (S3) formatini ishlating..."
                }
                style={{ marginBottom: 16 }}
              />
              <Space>
                <Button type="primary" onClick={handleContentSave}>
                  {isTurkish ? "Kaydet" : "Saqlash"}
                </Button>
                <Button onClick={handleContentCancel}>
                  {isTurkish ? "Vazgeç" : "Bekor qilish"}
                </Button>
              </Space>
            </div>
          ) : (
            <div
              style={{
                padding: 0,
                backgroundColor: "transparent",
                borderRadius: 0,
                border: "none",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                fontSize: 16,
              }}
            >
              {section.content ||
                (isTurkish ? "Henüz metin girilmedi" : "Matn kiritilmagan")}
            </div>
          )}

          {blanks.length > 0 && (
            <Alert
              message={
                isTurkish
                  ? `${blanks.length} boşluk bulundu: S${blanks.join(", S")}`
                  : `${blanks.length} ta bo'sh joy topildi: S${blanks.join(", S")}`
              }
              type="info"
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <Divider />

        {/* Section image (optional) */}
        <div>
          <Text strong style={{ marginBottom: 8, display: "block" }}>
            {isTurkish ? "İçerik görseli (isteğe bağlı)" : "Section rasmi (ixtiyoriy)"}
          </Text>
          <Upload
            showUploadList={false}
            accept="image/*"
            beforeUpload={(file) => { void handleSectionImageUpload(file); return false; }}
          >
            <Button icon={<UploadOutlined />} loading={fileUploadMutation.isPending}>
              {fileUploadMutation.isPending
                ? isTurkish
                  ? "Yükleniyor..."
                  : "Yuklanmoqda..."
                : isTurkish
                  ? "Görsel yükle"
                  : "Rasm yuklash"}
            </Button>
          </Upload>
          {section.imageUrl && (
            <div style={{ marginTop: 8 }}>
              <Image
                src={section.imageUrl?.startsWith("http") ? section.imageUrl : (FILE_BASE + section.imageUrl)}
                alt="Section"
                style={{ width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 6 }}
              />
            </div>
          )}
        </div>

        <Divider />

        {/* Shared Variants (optional) */}
        <div>
          <Text strong style={{ fontSize: 16, marginBottom: 8, display: "block" }}>
            {isTurkish ? "Ortak seçenekler (isteğe bağlı)" : "🔗 Umumiy variantlar (ixtiyoriy)"}
          </Text>
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            {isTurkish
              ? "Bu içerikteki sorular aynı seçenekleri kullanıyorsa seçenekleri bir kez girin. Ardından her soru için doğru cevabı seçin."
              : "Agar bu bo'limdagi barcha savollar bir xil variantlardan foydalansa, ularni shu yerda bir marta kiriting. Keyin har bir savol uchun to'g'ri variantni tanlaysiz."}
          </Text>
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            {(section.sharedVariants || []).map((variant, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text strong style={{ minWidth: 24 }}>{variant.letter || String.fromCharCode(65 + idx)}.</Text>
                <Input
                  value={variant.text}
                  onChange={(e) => {
                    const next = [...(section.sharedVariants || [])];
                    next[idx] = { letter: variant.letter || String.fromCharCode(65 + idx), text: e.target.value };
                    updateField("sharedVariants", next);
                  }}
                  placeholder={isTurkish ? "Seçenek metni" : "Variant matni"}
                  style={{ flex: 1 }}
                />
                <Button
                  danger
                  size="small"
                  onClick={() => {
                    const next = (section.sharedVariants || []).filter((_, i) => i !== idx);
                    updateField("sharedVariants", next);
                    // If removed letter was selected as correct, clear it in questions
                    const removedLetter = variant.letter || String.fromCharCode(65 + idx);
                    const updatedQuestions = section.questions.map((q) =>
                      q.correctAnswer === removedLetter ? { ...q, correctAnswer: "" } : q
                    );
                    onChange({ ...section, sharedVariants: next, questions: updatedQuestions });
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              type="dashed"
              size="small"
              onClick={() => {
                const next = [...(section.sharedVariants || [])];
                const nextLetter = String.fromCharCode(65 + next.length);
                next.push({ letter: nextLetter, text: "" });
                updateField("sharedVariants", next);
              }}
              icon={<PlusOutlined />}
              style={{ marginTop: 8 }}
            >
              {isTurkish ? "Seçenek ekle" : "Variant qo'shish"}
            </Button>
          </Space>
        </div>

        <Divider />

        {/* Questions */}
        <div>
          <Text strong style={{ fontSize: 16, marginBottom: 16, display: "block" }}>
            {isTurkish
              ? `Sorular (${section.questions.length})`
              : `❓ Savollar (${section.questions.length})`}
          </Text>

          {section.questions.length === 0 ? (
            <Alert
              message={isTurkish ? "Henüz soru oluşturulmadı" : "Hali savollar yaratilmagan"}
              description={
                isTurkish
                  ? "Metne (S1), (S2) gibi boşluklar eklediğinizde sorular otomatik oluşturulur."
                  : "Matnda (S1), (S2) kabi bo'sh joylar qo'shing va ular uchun savollar avtomatik yaratiladi"
              }
              type="warning"
            />
          ) : (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {section.questions.map((question, ) => (
                <Card
                  key={question.id}
                  size="small"
                  title={
                    isTurkish
                      ? `S${question.blankNumber} sorusu`
                      : `S${question.blankNumber} uchun savol`
                  }
                  extra={
                    <Button
                      danger
                      size="small"
                      onClick={() => removeQuestion(question.id)}
                    >
                      {isTurkish ? "Sil" : "O'chirish"}
                    </Button>
                  }
                  style={{ backgroundColor: "transparent", border: "1px dashed var(--ant-border-color, #d9d9d9)" }}
                >
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    {/* Question input or image upload (Part 2) */}
                    {isPartTwo ? (
                      <div>
                        <Text strong style={{ marginBottom: 8, display: "block" }}>
                          {isTurkish ? "Soru görseli (Bölüm 2)" : "Savol rasmi (Part 2)"}
                        </Text>
                        <Upload
                          showUploadList={false}
                          accept="image/*"
                          beforeUpload={(file) => { void handleQuestionImageUpload(section.questions.findIndex(q => q.id === question.id), question, file); return false; }}
                        >
                          <Button icon={<UploadOutlined />} loading={uploadingQuestionIndex === section.questions.findIndex(q => q.id === question.id)}>
                            {fileUploadMutation.isPending
                              ? isTurkish
                                ? "Yükleniyor..."
                                : "Yuklanmoqda..."
                              : isTurkish
                                ? "Görsel yükle"
                                : "Rasm yuklash"}
                          </Button>
                        </Upload>
                        {question.imageUrl && (
                          <div style={{ marginTop: 8 }}>
                            <Image
                              src={question.imageUrl?.startsWith("http") ? question.imageUrl : (FILE_BASE + question.imageUrl)}
                              alt="Question"
                              style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 6 }}
                            />
                            <Text type="secondary" style={{ display: "block", marginTop: 4, wordBreak: "break-all" }}>
                              {question.imageUrl}
                            </Text>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Text strong style={{ marginBottom: 8, display: "block" }}>
                          {isTurkish ? "Soru metni" : "Savol matni"}
                        </Text>
                        <Input.TextArea
                          rows={3}
                          placeholder={
                            isTurkish
                              ? "Soru metnini girin (isteğe bağlı)"
                              : "Savol matnini kiriting (ixtiyoriy)"
                          }
                          value={question.text || ""}
                          onChange={(e) => updateQuestion(question.id, { ...question, text: e.target.value })}
                        />
                      </div>
                    )}

                    <div>
                      <Text strong style={{ marginBottom: 8, display: "block" }}>
                        {isTurkish ? "Doğru cevap" : "To'g'ri javob:"}
                      </Text>
                      <Select
                        placeholder={isTurkish ? "Doğru cevabı seçin" : "To'g'ri javobni tanlang"}
                        value={question.correctAnswer || undefined}
                        onChange={(value) => updateQuestion(question.id, { ...question, correctAnswer: value })}
                        style={{ width: 320 }}
                        options={
                          (section.sharedVariants && section.sharedVariants.length > 0
                            ? section.sharedVariants
                            : question.options
                          )
                          .filter((option) => (option.text || "").toString().trim())
                          .map((option) => ({
                            label: `${option.letter}. ${option.text}`,
                            value: option.letter,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Text strong style={{ marginBottom: 8, display: "block" }}>
                        {isTurkish ? "Seçenekler" : "Variantlar:"}
                      </Text>
                      {section.sharedVariants && section.sharedVariants.length > 0 ? (
                        <Text type="secondary">
                          {isTurkish
                            ? "Seçenekler bu içerikteki tüm sorular için ortaktır. Yukarıdaki listeden düzenleyin."
                            : "Variantlar bu bo'lim uchun umumiy. Yuqoridagi ro'yxatdan tahrir qiling."}
                        </Text>
                      ) : (
                        <Space direction="vertical" size="small" style={{ width: "100%" }}>
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Text strong style={{ minWidth: 24 }}>
                                {option.letter}.
                              </Text>
                              <Input
                                value={option.text}
                                onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                placeholder={
                                  isTurkish
                                    ? `${option.letter} seçeneğini girin`
                                    : `${option.letter} variantini kiriting`
                                }
                                style={{ flex: 1 }}
                              />
                              {question.options.length > 2 && (
                                <Button
                                  danger
                                  size="small"
                                  onClick={() => removeOption(question.id, optionIndex)}
                                >
                                  ×
                                </Button>
                              )}
                            </div>
                          ))}
                          {question.options.length < 8 && (
                            <Button
                              type="dashed"
                              size="small"
                              onClick={() => addOption(question.id)}
                              icon={<PlusOutlined />}
                              style={{ marginTop: 8 }}
                            >
                              {isTurkish ? "Seçenek ekle" : "Variant qo'shish"}
                            </Button>
                          )}
                        </Space>
                      )}
                    </div>

                    <MockEvidenceEditor
                      testType="READING"
                      sourceText={section.content || ""}
                      evidence={question.evidence}
                      options={(
                        section.sharedVariants && section.sharedVariants.length > 0
                          ? section.sharedVariants
                          : question.options
                      ).map((option) => ({
                        key: option.letter,
                        text: option.text,
                        isCorrect: option.letter === question.correctAnswer,
                      }))}
                      onChange={(evidence) =>
                        updateQuestion(question.id, { ...question, evidence })
                      }
                    />
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </div>
      </Space>
    </Card>
  );
}
