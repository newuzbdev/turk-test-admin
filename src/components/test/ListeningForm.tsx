import { Button, Card, Input, Row, Col, Typography, Steps, Layout, Space } from "antd"
import { useState } from "react"
import { ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined } from "@ant-design/icons"
import PartForm from "./PartForm"
import type { CreateTestDto, TestPartDto } from "../../config/querys/test-query"

const { Title } = Typography
const { Content, Sider } = Layout

type Props = {
    onSubmit: (data: CreateTestDto) => void
    onCancel: () => void
    initialData?: CreateTestDto
}

export default function ListeningForm({ onSubmit, onCancel, initialData }: Props) {
    const [currentStep, setCurrentStep] = useState(0)
    const [formData, setFormData] = useState<CreateTestDto>(
        initialData || {
            title: "",
            type: "LISTENING",
            ieltsId: "",
            parts: [
                {
                    number: 1,
                    title: "",
                    audioUrl: "",
                    sections: [],
                },
            ],
        },
    )

    const steps = [
        {
            title: "Basic info",
            status: currentStep > 0 ? "finish" : currentStep === 0 ? "process" : "wait",
        },
        {
            title: "Questions",
            status: currentStep > 1 ? "finish" : currentStep === 1 ? "process" : "wait",
        },
    ]

    const updatePart = (index: number, updated: TestPartDto) => {
        const newParts = [...formData.parts]
        newParts[index] = updated
        setFormData({ ...formData, parts: newParts })
    }

    const addPart = () => {
        const newPart: TestPartDto = {
            number: formData.parts.length + 1,
            title: "",
            audioUrl: "",
            sections: [],
        }
        setFormData({ ...formData, parts: [...formData.parts, newPart] })
    }

    const removePart = (index: number) => {
        const newParts = formData.parts.filter((_, i) => i !== index)
        setFormData({ ...formData, parts: newParts })
    }

    const handleSubmit = () => {
        onSubmit(formData)
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <Card style={{ border: "none", boxShadow: "none" }}>
                        <Title level={4} style={{ marginBottom: "24px" }}>
                            📋 Asosiy Ma'lumotlar
                        </Title>
                        <Row gutter={[24, 24]}>
                            <Col span={12}>
                                <div style={{ marginBottom: "8px" }}>
                                    <label >Test nomi</label>
                                </div>
                                <Input
                                    placeholder="Test nomini kiriting"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    size="large"
                                />
                            </Col>
                            <Col span={12}>
                                <div style={{ marginBottom: "8px" }}>
                                    <label >IELTS ID</label>
                                </div>
                                <Input
                                    placeholder="IELTS ID ni kiriting"
                                    value={formData.ieltsId}
                                    onChange={(e) => setFormData({ ...formData, ieltsId: e.target.value })}
                                    size="large"
                                />
                            </Col>
                        </Row>
                    </Card>
                )
            case 1:
                return (
                    <div>
                        <Title level={4} style={{ marginBottom: "24px" }}>
                            ❓ Savollar
                        </Title>
                        {formData.parts.map((part, i) => (
                            <PartForm
                                key={i}
                                part={part}
                                onChange={(updated) => updatePart(i, updated)}
                                onRemove={() => removePart(i)}
                            />
                        ))}
                        <Button
                            type="dashed"
                            onClick={addPart}
                            style={{
                                width: "100%",
                                marginTop: 16,
                                height: "48px",
                                borderRadius: "8px",
                                borderStyle: "dashed",
                                borderColor: "#10b981",
                            }}
                        >
                            ➕ Yangi Part Qo'shish
                        </Button>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <Layout style={{ background: "transparent", minHeight: "80vh" }}>
            <div
                style={{
                    padding: "16px 24px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => {
                            if (currentStep > 0) {
                                setCurrentStep(currentStep - 1)
                            } else {
                                onCancel()
                            }
                        }}
                    >
                        {currentStep > 0 ? "Oldingi qadam" : "Orqaga"}
                    </Button>
                    <Steps current={currentStep} size="small" style={{ flex: 1, maxWidth: "600px", margin: "0 40px" }}>
                        {steps.map((step, index) => (
                            <Steps.Step key={index} title={step.title} status={step.status as any} />
                        ))}
                    </Steps>
                    <Space>
                        {currentStep > 0 && (
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => setCurrentStep(currentStep - 1)}
                                style={{
                                    borderRadius: "6px",
                                }}
                            >
                                Orqaga
                            </Button>
                        )}
                        {currentStep < 1 ? (
                            <Button
                                type="primary"
                                icon={<ArrowRightOutlined />}
                                onClick={() => setCurrentStep(currentStep + 1)}
                                disabled={!formData.title || !formData.ieltsId}
                                style={{
                                    background: "#10b981",
                                    borderColor: "#10b981",
                                    borderRadius: "6px",
                                }}
                            >
                                Keyingi
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={handleSubmit}
                                style={{
                                    background: "#10b981",
                                    borderColor: "#10b981",
                                    borderRadius: "6px",
                                }}
                            >
                                Saqlash
                            </Button>
                        )}
                    </Space>
                </div>
            </div>

            <Layout>
                <Content style={{ padding: "24px", background: "transparent" }}>{renderStepContent()}</Content>
            </Layout>
        </Layout>
    )
}
