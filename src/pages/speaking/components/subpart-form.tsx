import React from "react";
import {
  Button,
  Card,
  Input,
  Row,
  Col,
  List,
  Checkbox,
  Alert,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { SpeakingSubPart, SpeakingQuestion } from "@/utils/types/types";
import { ImageUpload } from "./image-upload";

interface SubPartFormProps {
  subPart: SpeakingSubPart;
  sectionIndex: number;
  subPartIndex: number;
  onUpdate: (
    sectionIndex: number,
    subPartIndex: number,
    updates: Partial<SpeakingSubPart>
  ) => void;
  onDelete: (sectionIndex: number, subPartIndex: number) => void;
  onImageUpload: (
    sectionIndex: number,
    subPartIndex: number,
    file: File
  ) => Promise<void>;
  onRemoveImage: (
    sectionIndex: number,
    subPartIndex: number,
    imageIndex: number
  ) => void;
  onAddQuestion: (sectionIndex: number, subPartIndex: number) => void;
  onUpdateQuestion: (
    sectionIndex: number,
    subPartIndex: number,
    questionIndex: number,
    updates: Partial<SpeakingQuestion>
  ) => void;
  onDeleteQuestion: (
    sectionIndex: number,
    subPartIndex: number,
    questionIndex: number
  ) => void;
}

export const SubPartForm: React.FC<SubPartFormProps> = ({
  subPart,
  sectionIndex,
  subPartIndex,
  onUpdate,
  onDelete,
  onImageUpload,
  onRemoveImage,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}) => {
  const handleImageUpload = async (file: File) => {
    await onImageUpload(sectionIndex, subPartIndex, file);
  };

  const visualContext = {
    verified: subPart.visualContext?.verified === true,
    imageDescriptions: subPart.visualContext?.imageDescriptions || [],
    comparisonPoints: subPart.visualContext?.comparisonPoints || [],
    forbiddenAssumptions: subPart.visualContext?.forbiddenAssumptions || [],
  };
  const updateVisualContext = (
    updates: Partial<typeof visualContext>,
    preserveVerification = false,
  ) => {
    onUpdate(sectionIndex, subPartIndex, {
      visualContext: {
        ...visualContext,
        ...updates,
        verified: preserveVerification
          ? updates.verified ?? visualContext.verified
          : false,
      },
    });
  };
  const allImagesDescribed =
    (subPart.images?.length || 0) > 0 &&
    (subPart.images || []).every((_, imageIndex) =>
      Boolean(visualContext.imageDescriptions[imageIndex]?.trim()),
    );

  return (
    <Card
      size="small"
      className="mb-3"
      title={`Sub-Part: ${subPart.label}`}
      extra={
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(sectionIndex, subPartIndex);
          }}
        />
      }
    >
      <Row gutter={16}>
        <Col span={12}>
          <label className="block text-sm font-medium mb-1">Label</label>
          <Input
            value={subPart.label}
            onChange={(e) =>
              onUpdate(sectionIndex, subPartIndex, { label: e.target.value })
            }
            placeholder="Sub-part label"
          />
        </Col>
        <Col span={12}>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Input
            value={subPart.description}
            onChange={(e) =>
              onUpdate(sectionIndex, subPartIndex, {
                description: e.target.value,
              })
            }
            placeholder="Sub-part description"
          />
        </Col>
      </Row>

      <div className="mt-3">
        <ImageUpload
          images={subPart.images || []}
          onUpload={handleImageUpload}
          onRemove={(imageIndex) => onRemoveImage(sectionIndex, subPartIndex, imageIndex)}
          title="Sub-Part Images"
        />
      </div>

      {(subPart.images?.length || 0) > 0 && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3">
            <div className="text-sm font-semibold text-slate-900">
              Değerlendirme için görsel bağlamı
            </div>
            <div className="mt-1 text-xs text-slate-600">
              Yalnızca görselde açıkça görülen bilgileri yazın. Öğrenci geri bildirimi bu doğrulanmış açıklamayı kullanır.
            </div>
          </div>

          <div className="space-y-3">
            {(subPart.images || []).map((_, imageIndex) => (
              <div key={`visual-description-${imageIndex}`}>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Görsel {imageIndex + 1} açıklaması
                </label>
                <Input.TextArea
                  rows={2}
                  value={visualContext.imageDescriptions[imageIndex] || ""}
                  placeholder="Örn. Bir öğrenci kütüphanede tek başına kitap okuyor."
                  onChange={(event) => {
                    const imageDescriptions = [
                      ...visualContext.imageDescriptions,
                    ];
                    imageDescriptions[imageIndex] = event.target.value;
                    updateVisualContext({ imageDescriptions });
                  }}
                />
              </div>
            ))}

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Karşılaştırma noktaları
                </label>
                <Input.TextArea
                  rows={2}
                  value={visualContext.comparisonPoints.join("\n")}
                  placeholder="Her satıra bir nokta"
                  onChange={(event) =>
                    updateVisualContext({
                      comparisonPoints: event.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Col>
              <Col xs={24} md={12}>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Varsayılmaması gerekenler
                </label>
                <Input.TextArea
                  rows={2}
                  value={visualContext.forbiddenAssumptions.join("\n")}
                  placeholder="Örn. Kişilerin yaşı"
                  onChange={(event) =>
                    updateVisualContext({
                      forbiddenAssumptions: event.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Col>
            </Row>

            {!allImagesDescribed && (
              <Alert
                type="warning"
                showIcon
                message="Doğrulamak için her görseli açıklayın."
              />
            )}
            <Checkbox
              checked={visualContext.verified}
              disabled={!allImagesDescribed}
              onChange={(event) =>
                updateVisualContext(
                  { verified: event.target.checked },
                  true,
                )
              }
            >
              Görsel açıklamalarını kontrol ettim
            </Checkbox>
          </div>
        </div>
      )}

      <div className="mt-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Questions</span>
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => onAddQuestion(sectionIndex, subPartIndex)}
            size="small"
          >
            Question qo'shish
          </Button>
        </div>
        <List
          size="small"
          dataSource={subPart.questions || []}
          renderItem={(question, questionIndex) => (
            <List.Item
              actions={[
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteQuestion(sectionIndex, subPartIndex, questionIndex);
                  }}
                />,
              ]}
            >
              <Input
                value={question.question}
                onChange={(e) =>
                  onUpdateQuestion(sectionIndex, subPartIndex, questionIndex, {
                    question: e.target.value,
                  })
                }
                placeholder="Question text"
              />
            </List.Item>
          )}
        />
      </div>
    </Card>
  );
};
