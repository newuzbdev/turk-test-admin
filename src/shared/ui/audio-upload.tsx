import { Card, Input, Upload, Button, Space, message } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import type { TestPartDto } from "@/config/queries/ielts/get-all.queries";
import { useFileUpload } from "@/config/queries/file/upload.queries";

type Props = {
  part: TestPartDto;
  onChange: (part: TestPartDto) => void;
  onRemove: () => void;
};

export default function AudioUpload({ part, onChange, onRemove }: Props) {
  const fileUploadMutation = useFileUpload();

  const handleAudioUpload = async (file: File) => {
    try {
      const result = await fileUploadMutation.mutateAsync(file);
      if (result?.data?.url) {
        onChange({ ...part, audioUrl: result.data.url });
      }
    } catch (error) {
      console.error("Audio upload error:", error);
      message.error("Audio yuklashda xatolik");
    }
  };

  return (
    <Card
      title={`🎧 Part ${part.number}`}
      style={{ marginBottom: 16 }}
      extra={
        <Button type="text" icon={<DeleteOutlined />} onClick={onRemove} danger>
          O'chirish
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <label>Part sarlavhasi</label>
        <Input
          value={part.title}
          onChange={(e) => onChange({ ...part, title: e.target.value })}
          placeholder="Masalan: Transport haqida"
        />

        <label>Audio yuklash</label>
        <Upload
          showUploadList={false}
          accept="audio/*"
          beforeUpload={(file) => {
            handleAudioUpload(file);
            return false;
          }}
        >
          <Button
            icon={<UploadOutlined />}
            loading={fileUploadMutation.isPending}
            disabled={fileUploadMutation.isPending}
          >
            {fileUploadMutation.isPending ? "Yuklanmoqda..." : "Audio faylni tanlang"}
          </Button>
        </Upload>

        {part.audioUrl && (
          <audio controls src={part.audioUrl} style={{ marginTop: 10 }} />
        )}
      </Space>
    </Card>
  );
}
