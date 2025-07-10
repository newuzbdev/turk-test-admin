import { Input, Button, Col, Row, Tag } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { TestAnswerDto } from "../../config/querys/test-query";

type Props = {
  answer: TestAnswerDto;
  onChange: (field: keyof TestAnswerDto, value: any) => void;
  onRemove: () => void;
};

export default function AnswerForm({ answer, onChange, onRemove }: Props) {

  const handleFieldChange = async (field: keyof TestAnswerDto, value: any) => {
    onChange(field, value);
  };

  const handleCorrectToggle = () => {
    handleFieldChange("correct", !answer.correct);
  };

  return (
    <Row gutter={8} style={{ marginBottom: 8, alignItems: "center" }}>
      <Col span={3}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: answer.correct ? "#10b981" : "#e5e7eb",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {answer.variantText || "?"}
        </div>
      </Col>
      <Col span={2}>
        <Input
          placeholder="A"
          value={answer.variantText}
          onChange={(e) => handleFieldChange("variantText", e.target.value)}
          style={{
            textAlign: "center",
            borderRadius: "6px",
            fontWeight: "bold",
          }}
          maxLength={1}
        />
      </Col>
      <Col span={14}>
        <Input
          placeholder="Javob matni"
          value={answer.answer}
          onChange={(e) => handleFieldChange("answer", e.target.value)}
          style={{ borderRadius: "6px" }}
        />
      </Col>
      <Col span={3}>
        <Tag
          color={answer.correct ? "green" : "default"}
          style={{
            cursor: "pointer",
            borderRadius: "4px",
            border: "none",
            padding: "4px 8px",
          }}
          onClick={handleCorrectToggle}
        >
          {answer.correct ? "✅ To'g'ri" : "Noto'g'ri"}
        </Tag>
      </Col>
      <Col span={2}>
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={onRemove}
          size="small"
        />
      </Col>
    </Row>
  );
}
