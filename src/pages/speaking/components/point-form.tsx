import React from "react";
import {
  Button,
  Card,
  List,
  Input,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { SpeakingPoint, SpeakingQuestion } from "@/utils/types/types";

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
  onAddQuestion: (sectionIndex: number, pointIndex: number) => void;
  onUpdateQuestion: (
    sectionIndex: number,
    pointIndex: number,
    questionIndex: number,
    updates: Partial<SpeakingQuestion>
  ) => void;
  onDeleteQuestion: (
    sectionIndex: number,
    pointIndex: number,
    questionIndex: number
  ) => void;
}

export const PointForm: React.FC<PointFormProps> = ({
  point,
  sectionIndex,
  pointIndex,
  onUpdate,
  onDelete,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}) => {
  return (
    <Card
      size="small"
      className="mb-3"
      title={`${
        point.type === "ADVANTAGE" ? "Advantage" : "Disadvantage"
      } ${point.order}`}
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
          <span className="text-sm font-medium">Questions</span>
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => onAddQuestion(sectionIndex, pointIndex)}
            size="small"
          >
            Question qo'shish
          </Button>
        </div>
        <List
          size="small"
          dataSource={point.questions || []}
          renderItem={(question, questionIndex) => (
            <List.Item
              actions={[
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    onDeleteQuestion(sectionIndex, pointIndex, questionIndex)
                  }
                />,
              ]}
            >
              <Input
                value={question.question}
                onChange={(e) =>
                  onUpdateQuestion(sectionIndex, pointIndex, questionIndex, {
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