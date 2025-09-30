import React, { useState, useEffect } from "react";
import { Button, Card, Input, Space, Typography, Divider, Select, message, Alert } from "antd";
import { DeleteOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import type { ReadingSection, ReadingQuestion } from "./reading-test-editor";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ReadingSectionEditorProps {
  section: ReadingSection;
  sectionNumber: number;
  onChange: (section: ReadingSection) => void;
  onRemove: () => void;
}

export default function ReadingSectionEditor({
  section,
  sectionNumber,
  onChange,
  onRemove,
}: ReadingSectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState(section.content);

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
      message.warning("Maksimal 26 ta variant qo'shish mumkin");
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
      message.warning("Kamida 2 ta variant bo'lishi kerak");
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

  // Aggregate shared options across all questions (use first non-empty text per letter)
  const aggregatedOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    section.questions.forEach((q) => {
      q.options?.forEach((opt) => {
        if (!map.has(opt.letter) && (opt.text?.trim() || "") !== "") {
          map.set(opt.letter, opt.text);
        }
      });
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([letter, text]) => ({ letter, text }));
  }, [section.questions]);

  const handleContentSave = () => {
    updateField("content", tempContent);
    setIsEditing(false);
    message.success("Content saqlandi");
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
        border: "1px solid #d9d9d9",
      }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Input
            placeholder="Section sarlavhasi"
            value={section.title}
            onChange={(e) => updateField("title", e.target.value)}
            size="large"
            style={{ flex: 1, fontSize: 16, fontWeight: "bold" }}
          />
          {section.id.startsWith("demo-") && (
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
          <Button
            danger
            onClick={onRemove}
            icon={<DeleteOutlined />}
            size="small"
          >
            O'chirish
          </Button>
        </div>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Content Editor */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text strong style={{ fontSize: 16 }}>
              📄 Matn (S1, S2, S3... bo'sh joylar bilan)
            </Text>
            {!isEditing && (
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
                size="small"
              >
                Tahrirlash
              </Button>
            )}
          </div>

          {isEditing ? (
            <div>
              <TextArea
                value={tempContent}
                onChange={(e) => setTempContent(e.target.value)}
                rows={8}
                placeholder="Matnni kiriting. Bo'sh joylar uchun (S1), (S2), (S3) formatini ishlating..."
                style={{ marginBottom: 16 }}
              />
              <Space>
                <Button type="primary" onClick={handleContentSave}>
                  Saqlash
                </Button>
                <Button onClick={handleContentCancel}>
                  Bekor qilish
                </Button>
              </Space>
            </div>
          ) : (
            <div
              style={{
                padding: 16,
                backgroundColor: "#f5f5f5",
                borderRadius: 8,
                border: "1px solid #d9d9d9",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                fontSize: 16,
              }}
            >
              {section.content || "Matn kiritilmagan"}
            </div>
          )}

          {blanks.length > 0 && (
            <Alert
              message={`${blanks.length} ta bo'sh joy topildi: S${blanks.join(", S")}`}
              type="info"
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <Divider />

        {/* Shared options preview for Matching-style sections */}
        {aggregatedOptions.length > 0 && (
          <div>
            <Text strong style={{ fontSize: 16, marginBottom: 8, display: "block" }}>
              Variantlar (A–Z)
            </Text>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16 }}>
              {aggregatedOptions.map((opt, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fafafa", border: "1px solid #eee", borderRadius: 6, padding: "8px 10px" }}>
                  <Text strong style={{ minWidth: 22 }}>{opt.letter}.</Text>
                  <Text>{opt.text || "—"}</Text>
                </div>
              ))}
            </div>
            <Divider />
          </div>
        )}

        {/* Questions */}
        <div>
          <Text strong style={{ fontSize: 16, marginBottom: 16, display: "block" }}>
            ❓ Savollar ({section.questions.length})
          </Text>

          {section.questions.length === 0 ? (
            <Alert
              message="Hali savollar yaratilmagan"
              description="Matnda (S1), (S2) kabi bo'sh joylar qo'shing va ular uchun savollar avtomatik yaratiladi"
              type="warning"
            />
          ) : (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {section.questions.map((question, questionIndex) => (
                <Card
                  key={question.id}
                  size="small"
                  title={`S${question.blankNumber} uchun savol`}
                  extra={
                    <Button
                      danger
                      size="small"
                      onClick={() => removeQuestion(question.id)}
                    >
                      O'chirish
                    </Button>
                  }
                  style={{ backgroundColor: "#fafafa" }}
                >
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <div>
                      <Text strong style={{ marginBottom: 8, display: "block" }}>
                        To'g'ri javob:
                      </Text>
                      <Select
                        placeholder="To'g'ri javobni tanlang"
                        value={question.correctAnswer || undefined}
                        onChange={(value) => updateQuestion(question.id, { ...question, correctAnswer: value })}
                        style={{ width: 320 }}
                        options={question.options
                          .filter((option) => option.text.trim())
                          .map((option) => ({
                            label: `${option.letter}. ${option.text}`,
                            value: option.letter,
                          }))}
                      />
                    </div>

                    <div>
                      <Text strong style={{ marginBottom: 8, display: "block" }}>
                        Variantlar:
                      </Text>
                      <Space direction="vertical" size="small" style={{ width: "100%" }}>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Text strong style={{ minWidth: 24 }}>
                              {option.letter}.
                            </Text>
                            <Input
                              value={option.text}
                              onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                              placeholder={`${option.letter} variantini kiriting`}
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
                            Variant qo'shish
                          </Button>
                        )}
                      </Space>
                    </div>
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
