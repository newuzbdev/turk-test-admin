import React from "react";
import {
  Button,
  Card,
  Input,
  Row,
  Col,
  List,
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