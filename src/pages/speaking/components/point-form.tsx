import React from "react";
import { Button, Card, List, Input } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { SpeakingPoint, SpeakingExample } from "@/utils/types/types";

interface PointFormProps {
  point: SpeakingPoint;
  sectionIndex: number;
  pointIndex: number;
  onUpdate: (
    sectionIndex: number,
    pointIndex: number,
    updates: Partial<SpeakingPoint>
  ) => void;
  onDelete: (sectionIndex: number, pointIndex: number) => void;
  onAddExample: (sectionIndex: number, pointIndex: number) => void;
  onUpdateExample: (
    sectionIndex: number,
    pointIndex: number,
    exampleIndex: number,
    updates: Partial<SpeakingExample>
  ) => void;
  onDeleteExample: (
    sectionIndex: number,
    pointIndex: number,
    exampleIndex: number
  ) => void;
}

export const PointForm: React.FC<PointFormProps> = ({
  point,
  sectionIndex,
  pointIndex,
  onDelete,
  onAddExample,
  onUpdateExample,
  onDeleteExample,
}) => {
  return (
    <Card
      size="small"
      className="mb-3"
      title={`${point.type === "ADVANTAGE" ? "Advantage" : "Disadvantage"} ${
        point.order
      }`}
      extra={
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onDelete(sectionIndex, pointIndex)}
        />
      }
    >
      <div className="mt-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Examples</span>
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => onAddExample(sectionIndex, pointIndex)}
            size="small"
          >
            Example qo'shish
          </Button>
        </div>
        <List
          size="small"
          dataSource={
            Array.isArray(point.example)
              ? point.example
              : point.example
              ? [point.example]
              : []
          }
          renderItem={(example, exampleIndex) => (
            <List.Item
              actions={[
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    onDeleteExample(sectionIndex, pointIndex, exampleIndex)
                  }
                />,
              ]}
            >
              <Input
                value={example.text}
                onChange={(e) =>
                  onUpdateExample(sectionIndex, pointIndex, exampleIndex, {
                    text: e.target.value,
                  })
                }
                placeholder="Example text"
              />
            </List.Item>
          )}
        />
      </div>
    </Card>
  );
};
