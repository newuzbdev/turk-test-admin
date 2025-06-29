"use client"

import { Button, Card, Col, Input, Row, Space, Typography, Badge } from "antd"
import { DeleteOutlined, PlusOutlined, AudioOutlined } from "@ant-design/icons"
import SectionForm from "./SectionForm"
import type { TestPartDto, TestSectionDto } from "../../config/querys/test-query"

const { Title, Text } = Typography

type Props = {
    part: TestPartDto
    onChange: (part: TestPartDto) => void
    onRemove: () => void
}

export default function PartForm({ part, onChange, onRemove }: Props) {
    const updateSection = (index: number, updated: TestSectionDto) => {
        const newSections = [...part.sections]
        newSections[index] = updated
        onChange({ ...part, sections: newSections })
    }

    const addSection = () => {
        const newSection: TestSectionDto = {
            title: "",
            content: "",
            imageUrl: "",
            questions: [],
        }
        onChange({ ...part, sections: [...part.sections, newSection] })
    }

    const removeSection = (index: number) => {
        const newSections = part.sections.filter((_, i) => i !== index)
        onChange({ ...part, sections: newSections })
    }

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
            {/* Header */}
            <div
                style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    margin: "-24px -24px 24px -24px",
                    padding: "20px 24px",
                    color: "white",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>{part.sections.length} ta bo'lim</Text>
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

            {/* Form Fields */}
            <Row gutter={[20, 20]} style={{ marginBottom: "28px" }}>
                <Col span={12}>
                    <div style={{ marginBottom: "8px" }}>
                        <label style={{ fontWeight: 600, fontSize: "14px" }}>📝 Part sarlavhasi</label>
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
                        <label style={{ fontWeight: 600, fontSize: "14px" }}>🎵 Audio URL</label>
                    </div>
                    <Input
                        placeholder="https://example.com/audio.mp3"
                        value={part.audioUrl}
                        onChange={(e) => onChange({ ...part, audioUrl: e.target.value })}
                        size="large"
                        prefix={<AudioOutlined style={{ color: "#10b981" }} />}
                    />
                </Col>
            </Row>

            {/* Sections */}
            <div
                style={{
                    background: "white",    
                    borderRadius: "12px",
                    padding: "20px",
                    border: "1px solid #f0f0f0",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
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
                            e.currentTarget.style.background = "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
                            e.currentTarget.style.transform = "translateY(-1px)"
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.2)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                            e.currentTarget.style.transform = "translateY(0px)"
                            e.currentTarget.style.boxShadow = "none"
                        }}
                    >
                        ✨ Yangi bo'lim qo'shish
                    </Button>
                </Space>
            </div>
        </Card>
    )
}
