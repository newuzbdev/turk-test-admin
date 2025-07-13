import React from "react";
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Space,
  Select,
  Radio,
  Typography,
  Divider,
  Badge,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { showNotification } from "../../utils/notification";
import type {
  TestQuestionDto,
  TestAnswerDto,
} from "../../../config/querys/test-query";

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface EnhancedQuestionFormProps {
  question: TestQuestionDto;
  questionIndex: number;
  onChange: (question: TestQuestionDto) => void;
  onRemove: () => void;
  groupTitle?: string;
}

export const EnhancedQuestionForm: React.FC<EnhancedQuestionFormProps> = ({
  question,
  questionIndex,
  onChange,
  onRemove,
  groupTitle,
}) => {
  const updateQuestion = (field: keyof TestQuestionDto, value: any) => {
    onChange({ ...question, [field]: value });
  };

  const addAnswer = () => {
    const newAnswer: TestAnswerDto = {
      variantText: String.fromCharCode(65 + question.answers.length), // A, B, C, D...
      answer: "",
      correct: false,
    };
    onChange({ ...question, answers: [...question.answers, newAnswer] });
    
    showNotification.success({
      message: "Yangi javob varianti qo'shildi",
      description: `${newAnswer.variantText} varianti qo'shildi`,
    });
  };

  const removeAnswer = (index: number) => {
    const answerToRemove = question.answers[index];
    const newAnswers = question.answers.filter((_, i) => i !== index);
    // Re-assign variant letters
    const reVariantedAnswers = newAnswers.map((answer, i) => ({
      ...answer,
      variantText: String.fromCharCode(65 + i),
    }));
    onChange({ ...question, answers: reVariantedAnswers });
    
    showNotification.warning({
      message: "Javob varianti o'chirildi",
      description: `${answerToRemove.variantText} varianti o'chirildi`,
    });
  };

  const updateAnswer = (index: number, field: keyof TestAnswerDto, value: any) => {
    const newAnswers = [...question.answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    onChange({ ...question, answers: newAnswers });
  };

  const setCorrectAnswer = (answerIndex: number) => {
    const newAnswers = question.answers.map((answer, index) => ({
      ...answer,
      correct: index === answerIndex,
    }));
    onChange({ ...question, answers: newAnswers });
  };

  return (
    <Card
      size="small"
      style={{ marginBottom: "16px" }}
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Badge count={question.number} color="#1890ff" />
            <Title level={5} style={{ margin: 0 }}>
              Question {question.number}
            </Title>
            {groupTitle && (
              <Text type="secondary" style={{ fontSize: "12px" }}>
                ({groupTitle})
              </Text>
            )}
          </div>
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={onRemove}
          />
        </div>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Question Type */}
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Question Type</Text>
            <Select
              value={question.type}
              onChange={(value) => updateQuestion("type", value)}
              style={{ width: "100%", marginTop: "4px" }}
            >
              <Option value="MULTIPLE_CHOICE">Multiple Choice</Option>
              <Option value="TRUE_FALSE">True/False</Option>
              <Option value="FILL_IN_BLANK">Fill in the Blank</Option>
              <Option value="MATCHING">Matching</Option>
            </Select>
          </Col>
        </Row>

        {/* Question Text */}
        <div>
          <Text strong>Question</Text>
          <TextArea
            value={question.text}
            onChange={(e) => updateQuestion("text", e.target.value)}
            placeholder="Let's ask a question..."
            rows={3}
            style={{ marginTop: "4px" }}
          />
        </div>

        {/* Answer Choices */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <Text strong>Choice</Text>
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={addAnswer}
            >
              Add Choice
            </Button>
          </div>

          <Space direction="vertical" style={{ width: "100%" }} size="small">
            {question.answers.map((answer, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Badge count={answer.variantText} color="#52c41a" />
                <Input
                  value={answer.answer}
                  onChange={(e) => updateAnswer(index, "answer", e.target.value)}
                  placeholder={`Option ${answer.variantText}`}
                  style={{ flex: 1 }}
                />
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeAnswer(index)}
                />
              </div>
            ))}
          </Space>
        </div>

        {/* Correct Answer Selection */}
        {question.answers.length > 0 && (
          <div>
            <Text strong>Correct Answer</Text>
            <div style={{ marginTop: "8px" }}>
              <Radio.Group
                value={question.answers.findIndex(a => a.correct)}
                onChange={(e) => setCorrectAnswer(e.target.value)}
              >
                <Space direction="horizontal" wrap>
                  {question.answers.map((answer, index) => (
                    <Radio key={index} value={index}>
                      {answer.variantText}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
          </div>
        )}

        <Divider style={{ margin: "12px 0" }} />

        {/* Explanation Section */}
        <div>
          <Text strong>Explanation</Text>
          <TextArea
            placeholder="Provide explanation for this question..."
            rows={2}
            style={{ marginTop: "4px" }}
          />
        </div>

        {/* Located Passage Section */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text strong>Located Passage</Text>
            <Button type="dashed" size="small">
              Select passage
            </Button>
          </div>
          <div style={{ 
            marginTop: "8px", 
            padding: "8px", 
            border: "1px dashed #d9d9d9", 
            borderRadius: "4px",
            color: "#999"
          }}>
            Select locate passage...
          </div>
        </div>
      </Space>
    </Card>
  );
};

export default EnhancedQuestionForm;
