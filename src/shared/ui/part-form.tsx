import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Space,
  Typography,
  Badge,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { Part, Section } from "../../utils/types/types";
import SectionForm from "./section-form";
import type { TestSectionDto } from "@/config/queries/ielts/get-all.queries";

const { Title, Text } = Typography;

type Props = {
  part: Part;
  onChange: (part: Part) => void;
  onRemove: () => void;
};

export default function PartForm({ part, onChange, onRemove }: Props) {
  // Convert Section to TestSectionDto for SectionForm
  const convertSectionToDto = (section: Section): TestSectionDto => ({
    id: section.id,
    partId: section.partId,
    title: section.title,
    content: section.content || "",
    imageUrl: "", // Default empty string for imageUrl
    questions: (section.questions || []).map((q) => ({
      id: q.id,
      sectionId: q.sectionId,
      number: q.order,
      type: q.type,
      text: q.question,
      answers: (q.answers || []).map((a) => ({
        id: a.id,
        questionId: a.questionId,
        variantText: a.answer,
        answer: a.answer,
        correct: a.isCorrect,
      })),
    })),
  });

  // Convert TestSectionDto back to Section
  const convertDtoToSection = (
    dto: TestSectionDto,
    originalSection: Section
  ): Section => ({
    ...originalSection,
    title: dto.title,
    content: dto.content,
    questions: dto.questions.map((q) => ({
      id: q.id,
      question: q.text,
      type: q.type,
      sectionId: originalSection.id || "",
      order: q.number,
      answers: q.answers.map((a) => ({
        id: a.id,
        answer: a.answer,
        isCorrect: a.correct,
        questionId: q.id || "",
      })),
    })),
  });

  const updateSection = (index: number, updated: TestSectionDto) => {
    const newSections = [...(part.sections || [])];
    const originalSection = newSections[index];
    const convertedSection = convertDtoToSection(updated, originalSection);
    newSections[index] = convertedSection;
    onChange({ ...part, sections: newSections });
  };

  const addSection = () => {
    const newSection: Section = {
      title: "",
      content: "",
      partId: part.id || "",
      order: (part.sections?.length || 0) + 1,
      questions: [],
    };
    onChange({ ...part, sections: [...(part.sections || []), newSection] });
  };

  const removeSection = (index: number) => {
    const newSections = part.sections?.filter((_, i) => i !== index) || [];
    onChange({ ...part, sections: newSections });
  };

  return (
    <Card
      style={{
        marginBottom: 32,
        borderRadius: "16px",
        border: "2px solid #f0f9ff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          margin: "-24px -24px 24px -24px",
          padding: "20px 24px",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              🎧
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: "white" }}>
                Part {part.order}
              </Title>
              <Text
                style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}
              >
                {part.sections?.length || 0} ta bo'lim
              </Text>
            </div>
          </div>
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            onClick={onRemove}
            style={{
              color: "rgba(255,255,255,0.9)",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
            }}
          >
            O'chirish
          </Button>
        </div>
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: "28px" }}>
        <Col span={12}>
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontWeight: 600, fontSize: "14px" }}>
              📝 Part sarlavhasi
            </label>
          </div>
          <Input
            placeholder="Masalan: Kundalik suhbat"
            value={part.title}
            onChange={(e) => onChange({ ...part, title: e.target.value })}
            size="large"
          />
        </Col>
        <Col span={12}>
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontWeight: 600, fontSize: "14px" }}>
              🎧 Audio File (for Listening Tests)
            </label>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Upload
              accept=".mp3,.wav,.m4a,.ogg"
              showUploadList={false}
              beforeUpload={(file) => {
                // Handle file upload here - you can integrate with your file upload API
                console.log("Audio file selected:", file);
                // For now, just set the file name as audioUrl
                onChange({ ...part, audioUrl: file.name });
                return false; // Prevent automatic upload
              }}
            >
              <Button icon={<UploadOutlined />} size="large">
                Upload Audio
              </Button>
            </Upload>
            <Input
              placeholder="Or enter audio URL"
              value={part.audioUrl || ""}
              onChange={(e) => onChange({ ...part, audioUrl: e.target.value })}
              size="large"
              style={{ flex: 1 }}
            />
          </div>
        </Col>
      </Row>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #f0f0f0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <Text strong style={{ color: "#374151", fontSize: "16px" }}>
            📚 Bo'limlar
          </Text>
          <Badge
            count={part.sections?.length || 0}
            style={{
              background: "#10b981",
              color: "white",
              fontSize: "11px",
            }}
          />
        </div>

        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {part.sections?.map((section, i) => (
            <div
              key={i}
              style={{
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
              }}
            >
              <SectionForm
                section={convertSectionToDto(section)}
                onChange={(updated) => updateSection(i, updated)}
                onRemove={() => removeSection(i)}
              />
            </div>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addSection}
            style={{
              width: "100%",
              height: "52px",
              borderRadius: "12px",
              borderColor: "#10b981",
              color: "#10b981",
              fontSize: "14px",
              fontWeight: 600,
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
              border: "2px dashed #10b981",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(16, 185, 129, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)";
              e.currentTarget.style.transform = "translateY(0px)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            ✨ Yangi bo'lim qo'shish
          </Button>
        </Space>
      </div>
    </Card>
  );
}
