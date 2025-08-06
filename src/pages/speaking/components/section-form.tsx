import React from "react";
import {
  Button,
  Card,
  Input,
  Row,
  Col,
  Select,
  InputNumber,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { SpeakingSection } from "@/utils/types/types";
import { ImageUpload } from "./image-upload";

const { TextArea: AntTextArea } = Input;

interface SectionFormProps {
  section: SpeakingSection;
  sectionIndex: number;
  onUpdate: (sectionIndex: number, updates: Partial<SpeakingSection>) => void;
  onDelete: (sectionIndex: number) => void;
  onImageUpload: (sectionIndex: number, file: File) => Promise<void>;
  onRemoveImage: (sectionIndex: number, imageIndex: number) => void;
}

export const SectionForm: React.FC<SectionFormProps> = ({
  section,
  sectionIndex,
  onUpdate,
  onDelete,
  onImageUpload,
  onRemoveImage,
}) => {
  const handleImageUpload = async (file: File) => {
    await onImageUpload(sectionIndex, file);
  };

  return (
    <Card
      size="small"
      className="mb-3"
      title={`Section: ${section.title}`}
      extra={
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onDelete(sectionIndex)}
        />
      }
    >
      <div className="space-y-4">
        <Row gutter={16}>
          <Col span={8}>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={section.title}
              onChange={(e) =>
                onUpdate(sectionIndex, { title: e.target.value })
              }
              placeholder="Section title"
            />
          </Col>
          <Col span={8}>
            <label className="block text-sm font-medium mb-1">Type</label>
            <Select
              value={section.type}
              onChange={(value) => onUpdate(sectionIndex, { type: value })}
              style={{ width: "100%" }}
            >
              <Select.Option value="PART1">Part 1</Select.Option>
              <Select.Option value="PART2">Part 2</Select.Option>
              <Select.Option value="PART3">Part 3</Select.Option>
            </Select>
          </Col>
          <Col span={8}>
            <label className="block text-sm font-medium mb-1">Order</label>
            <InputNumber
              value={section.order}
              onChange={(value) => onUpdate(sectionIndex, { order: value || 1 })}
              min={1}
              style={{ width: "100%" }}
            />
          </Col>
        </Row>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <AntTextArea
            value={section.description}
            onChange={(e) =>
              onUpdate(sectionIndex, { description: e.target.value })
            }
            placeholder="Section description"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <AntTextArea
            value={section.content}
            onChange={(e) =>
              onUpdate(sectionIndex, { content: e.target.value })
            }
            placeholder="Section content"
            rows={3}
          />
        </div>

        <ImageUpload
          images={section.images || []}
          onUpload={handleImageUpload}
          onRemove={(imageIndex) => onRemoveImage(sectionIndex, imageIndex)}
          title="Section Images"
        />
      </div>
    </Card>
  );
}; 