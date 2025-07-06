import { Card, Input, Upload, Button, Space } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import type { TestPartDto } from "../../config/querys/test-query";

type Props = {
    part: TestPartDto;
    onChange: (part: TestPartDto) => void;
    onRemove: () => void;
};

export default function AudioUpload({ part, onChange, onRemove }: Props) {
    const handleAudioUpload = (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        fetch("/api/file/upload", {
            method: "POST",
            body: formData,
        })
            .then((res) => res.json())
            .then((data) => {
                if (data?.url) {
                    onChange({ ...part, audioUrl: data.url });
                }
            });
    };

    return (
        <Card
            title={`Part ${part.number}`}
            style={{ marginBottom: 16 }}
            extra={
                <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={onRemove}
                    danger
                >
                    O'chirish
                </Button>
            }
        >
            <Space direction="vertical" style={{ width: "100%" }}>
                <label>Part nomi</label>
                <Input
                    value={part.title}
                    onChange={(e) => onChange({ ...part, title: e.target.value })}
                />

                <label>Audio yuklash</label>
                <Upload
                    showUploadList={false}
                    beforeUpload={(file) => {
                        handleAudioUpload(file);
                        return false;
                    }}
                    accept="audio/*"
                >
                    <Button icon={<UploadOutlined />}>Audio faylni tanlang</Button>
                </Upload>

                {part.audioUrl && (
                    <audio controls src={part.audioUrl} style={{ marginTop: 10 }} />
                )}
            </Space>
        </Card>
    );
}
