import { Card, Input, Upload, Button, Space, message } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { TestPartDto } from "@/config/queries/ielts/get-all.queries";

type Props = {
  part: TestPartDto;
  onChange: (part: TestPartDto) => void;
  onRemove: () => void;
};

export default function AudioUpload({ part, onChange, onRemove }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleAudioUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await fetch("/api/file/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      if (data?.url) {
        onChange({ ...part, audioUrl: data.url });
        message.success("Audio muvaffaqiyatli yuklandi");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Audio upload error:", error);
      message.error("Audio yuklashda xatolik");
    } finally {
      setUploading(false);
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
            loading={uploading}
            disabled={uploading}
          >
            {uploading ? "Yuklanmoqda..." : "Audio faylni tanlang"}
          </Button>
        </Upload>

        {part.audioUrl && (
          <audio controls src={part.audioUrl} style={{ marginTop: 10 }} />
        )}
      </Space>
    </Card>
  );
}
