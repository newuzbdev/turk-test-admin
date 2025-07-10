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
  message,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  useCreateSection,
  useDeleteSection,
  type TestPartDto,
  type TestSectionDto,
} from "../../config/querys/test-query";
import SectionForm from "../../pages/reading/ui/section-form";
import { api } from "../../config";
import type { RcFile } from "antd/es/upload";

const { Title, Text } = Typography;

type Props = {
  part: TestPartDto;
  onChange: (part: TestPartDto) => void;
  onRemove: () => void;
};

export default function PartForm({ part, onChange, onRemove }: Props) {
  const createSection = useCreateSection();
  const deleteSection = useDeleteSection();

  const updateSection = (index: number, updated: TestSectionDto) => {
    const newSections = [...part.sections];
    newSections[index] = updated;
    onChange({ ...part, sections: newSections });
  };

  const addSection = async () => {
    if (!part.id) return message.warning("Part saqlanmagan!");

    const newSection: Omit<TestSectionDto, "id" | "questions"> = {
      title: "Yangi bo‘lim",
      content: "",
      imageUrl: "",
    };

    const res = await createSection.mutateAsync({
      ...newSection,
      partId: part.id,
    });

    if (res?.id) {
      const newSectionWithId: TestSectionDto = { ...res, questions: [] };
      onChange({ ...part, sections: [...part.sections, newSectionWithId] });
    }
  };

  const removeSection = async (index: number) => {
    const section = part.sections[index];
    if (section.id) await deleteSection.mutateAsync(section.id);

    const newSections = part.sections.filter((_, i) => i !== index);
    onChange({ ...part, sections: newSections });
  };

  const handleAudioUpload = async (file: RcFile) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("api/file/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const audioUrl = data?.path;
      if (audioUrl) {
        onChange({ ...part, audioUrl });
        message.success("Audio fayl yuklandi");
      } else {
        message.error("Yuklashda xatolik");
      }
    } catch (error) {
      console.error(error);
      message.error("Audio yuklashda xatolik");
    }
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
                Part {part.number}
              </Title>
              <Text
                style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}
              >
                {part.sections.length} ta bo'lim
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
          <label style={{ fontWeight: 600, fontSize: "14px" }}>
            📝 Part sarlavhasi
          </label>
          <Input
            placeholder="Masalan: Kundalik suhbat"
            value={part.title}
            onChange={(e) => onChange({ ...part, title: e.target.value })}
            size="large"
          />
        </Col>
        <Col span={12}>
          <label style={{ fontWeight: 600, fontSize: "14px" }}>
            🎵 Audio fayl
          </label>
          <Upload
            maxCount={1}
            accept="audio/*"
            customRequest={({ file }) => handleAudioUpload(file as RcFile)}
            showUploadList={false}
          >
            <Button
              size="large"
              icon={<UploadOutlined style={{ color: "#10b981" }} />}
              style={{ width: "100%" }}
            >
              Audio faylni yuklash
            </Button>
          </Upload>
          {part.audioUrl && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                background: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <Text strong style={{ display: "block", marginBottom: "8px" }}>
                🎧 Yuklangan audio fayl:
              </Text>
              <audio controls style={{ width: "100%" }}>
                <source src={part.audioUrl} type="audio/mpeg" />
                Brauzeringiz audio playerni qo‘llab-quvvatlamaydi.
              </audio>
            </div>
          )}
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
            count={part.sections.length}
            style={{
              background: "#10b981",
              color: "white",
              fontSize: "11px",
            }}
          />
        </div>

        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {part.sections.map((section, i) => (
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
                section={section}
                onChange={(updated: TestSectionDto) =>
                  updateSection(i, updated)
                }
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
