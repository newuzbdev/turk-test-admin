import React from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Badge,
  Collapse,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { showNotification } from "../../utils/notification";
import EnhancedQuestionForm from "./enhanced-question-form";
import type {
  TestQuestionDto,
} from "../../../config/querys/test-query";

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface QuestionGroup {
  id: string;
  title: string;
  type: "SINGLE_ANSWER" | "TRUE_FALSE_NOT_GIVEN" | "MATCHING" | "FILL_BLANK";
  questions: TestQuestionDto[];
  collapsed?: boolean;
}

interface QuestionGroupProps {
  group: QuestionGroup;
  onChange: (group: QuestionGroup) => void;
  onRemove: () => void;
}

export const QuestionGroupComponent: React.FC<QuestionGroupProps> = ({
  group,
  onChange,
  onRemove,
}) => {
  const addQuestion = () => {
    const newQuestion: TestQuestionDto = {
      number: group.questions.length + 1,
      type: group.type === "TRUE_FALSE_NOT_GIVEN" ? "TRUE_FALSE" : "MULTIPLE_CHOICE",
      text: "",
      answers: [],
    };

    // Add default answers based on group type
    if (group.type === "TRUE_FALSE_NOT_GIVEN") {
      newQuestion.answers = [
        { variantText: "YES", answer: "Yes", correct: false },
        { variantText: "NO", answer: "No", correct: false },
        { variantText: "NOT GIVEN", answer: "Not Given", correct: false },
      ];
    } else if (group.type === "SINGLE_ANSWER") {
      newQuestion.answers = [
        { variantText: "A", answer: "", correct: false },
        { variantText: "B", answer: "", correct: false },
        { variantText: "C", answer: "", correct: false },
      ];
    }

    const updatedGroup = {
      ...group,
      questions: [...group.questions, newQuestion],
    };
    onChange(updatedGroup);
    
    showNotification.success({
      message: "Yangi savol qo'shildi",
      description: `${group.title} guruhiga ${newQuestion.number}-savol qo'shildi`,
    });
  };

  const removeQuestion = (index: number) => {
    const questionToRemove = group.questions[index];
    const newQuestions = group.questions.filter((_, i) => i !== index);
    // Renumber questions
    const renumberedQuestions = newQuestions.map((q, i) => ({
      ...q,
      number: i + 1,
    }));
    
    const updatedGroup = {
      ...group,
      questions: renumberedQuestions,
    };
    onChange(updatedGroup);
    
    showNotification.warning({
      message: "Savol o'chirildi",
      description: `${questionToRemove.number}-savol o'chirildi`,
    });
  };

  const updateQuestion = (index: number, question: TestQuestionDto) => {
    const newQuestions = [...group.questions];
    newQuestions[index] = question;
    
    const updatedGroup = {
      ...group,
      questions: newQuestions,
    };
    onChange(updatedGroup);
  };

  const toggleCollapse = () => {
    onChange({
      ...group,
      collapsed: !group.collapsed,
    });
  };

  const getGroupTypeLabel = (type: string) => {
    switch (type) {
      case "SINGLE_ANSWER":
        return "Single Answer";
      case "TRUE_FALSE_NOT_GIVEN":
        return "T/F/NG";
      case "MATCHING":
        return "Matching";
      case "FILL_BLANK":
        return "Fill in Blank";
      default:
        return type;
    }
  };

  const getGroupColor = (type: string) => {
    switch (type) {
      case "SINGLE_ANSWER":
        return "#1890ff";
      case "TRUE_FALSE_NOT_GIVEN":
        return "#52c41a";
      case "MATCHING":
        return "#faad14";
      case "FILL_BLANK":
        return "#722ed1";
      default:
        return "#1890ff";
    }
  };

  return (
    <Card
      style={{ marginBottom: "16px" }}
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Badge 
              count={group.questions.length} 
              color={getGroupColor(group.type)}
              style={{ backgroundColor: getGroupColor(group.type) }}
            />
            <Title level={4} style={{ margin: 0, color: getGroupColor(group.type) }}>
              {group.title}
            </Title>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              ({getGroupTypeLabel(group.type)})
            </Text>
          </div>
          <Space>
            <Button
              type="text"
              size="small"
              icon={group.collapsed ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={toggleCollapse}
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={addQuestion}
            >
              Add question
            </Button>
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={onRemove}
            />
          </Space>
        </div>
      }
    >
      {!group.collapsed && (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {group.questions.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "40px", 
              color: "#999",
              border: "1px dashed #d9d9d9",
              borderRadius: "4px"
            }}>
              <Text type="secondary">No questions yet. Click "Add question" to start.</Text>
            </div>
          ) : (
            group.questions.map((question, index) => (
              <EnhancedQuestionForm
                key={index}
                question={question}
                questionIndex={index}
                onChange={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                onRemove={() => removeQuestion(index)}
                groupTitle={group.title}
              />
            ))
          )}
        </Space>
      )}
    </Card>
  );
};

export default QuestionGroupComponent;
