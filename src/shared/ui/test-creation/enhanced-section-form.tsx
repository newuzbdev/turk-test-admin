import React, { useState } from "react";
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Space,
  Badge,
  Typography,
  Upload,
  Modal,
  Select,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { showNotification } from "../../utils/notification";
import QuestionGroupComponent from "./question-group";
import QuestionSidebar from "./question-sidebar";
import type {
  TestSectionDto,
  TestQuestionDto,
} from "../../../config/querys/test-query";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface QuestionGroup {
  id: string;
  title: string;
  type: "SINGLE_ANSWER" | "TRUE_FALSE_NOT_GIVEN" | "MATCHING" | "FILL_BLANK";
  questions: TestQuestionDto[];
  collapsed?: boolean;
}

interface EnhancedSectionFormProps {
  section: TestSectionDto;
  onChange: (section: TestSectionDto) => void;
  onRemove: () => void;
  testType: "LISTENING" | "READING";
}

export const EnhancedSectionForm: React.FC<EnhancedSectionFormProps> = ({
  section,
  onChange,
  onRemove,
  testType,
}) => {
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupType, setNewGroupType] = useState<QuestionGroup["type"]>("SINGLE_ANSWER");
  const [selectedQuestion, setSelectedQuestion] = useState<{ groupId: string; questionIndex: number } | undefined>();

  const updateSection = (field: keyof TestSectionDto, value: any) => {
    onChange({ ...section, [field]: value });
  };

  const addQuestionGroup = () => {
    const groupTitles = {
      SINGLE_ANSWER: "Single Answer Questions",
      TRUE_FALSE_NOT_GIVEN: "True/False/Not Given",
      MATCHING: "Matching Questions",
      FILL_BLANK: "Fill in the Blank",
    };

    const newGroup: QuestionGroup = {
      id: `group-${Date.now()}`,
      title: groupTitles[newGroupType],
      type: newGroupType,
      questions: [],
      collapsed: false,
    };

    setQuestionGroups([...questionGroups, newGroup]);
    setShowGroupModal(false);
    
    showNotification.success({
      message: "Yangi savol guruhi qo'shildi",
      description: `${newGroup.title} guruhi yaratildi`,
    });
  };

  const updateQuestionGroup = (index: number, group: QuestionGroup) => {
    const newGroups = [...questionGroups];
    newGroups[index] = group;
    setQuestionGroups(newGroups);

    // Update section questions from all groups
    const allQuestions = newGroups.flatMap(g => g.questions);
    updateSection("questions", allQuestions);
  };

  const removeQuestionGroup = (index: number) => {
    const groupToRemove = questionGroups[index];
    const newGroups = questionGroups.filter((_, i) => i !== index);
    setQuestionGroups(newGroups);

    // Update section questions
    const allQuestions = newGroups.flatMap(g => g.questions);
    updateSection("questions", allQuestions);
    
    showNotification.warning({
      message: "Savol guruhi o'chirildi",
      description: `${groupToRemove.title} guruhi o'chirildi`,
    });
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Badge count="S" color="#52c41a" />
            <Title level={4} style={{ margin: 0 }}>
              Section
            </Title>
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
      style={{ marginBottom: "16px" }}
    >
      <Row gutter={24}>
        {/* Main Content Area */}
        <Col span={18}>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Section Basic Info */}
            <Card size="small" title="Section Information">
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                <div>
                  <Text strong>Section Title</Text>
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection("title", e.target.value)}
                    placeholder="Enter section title..."
                    style={{ marginTop: "4px" }}
                  />
                </div>

                <div>
                  <Text strong>Section Content</Text>
                  <TextArea
                    value={section.content}
                    onChange={(e) => updateSection("content", e.target.value)}
                    placeholder="Enter section content/passage..."
                    rows={6}
                    style={{ marginTop: "4px" }}
                  />
                </div>

                <div>
                  <Text strong>Section Image</Text>
                  <div style={{ marginTop: "4px" }}>
                    <Upload>
                      <Button icon={<UploadOutlined />}>Upload Image</Button>
                    </Upload>
                  </div>
                </div>
              </Space>
            </Card>

            {/* Question Groups */}
            <div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "16px" 
              }}>
                <Title level={4} style={{ margin: 0 }}>
                  Question Groups
                </Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowGroupModal(true)}
                >
                  Add Question Group
                </Button>
              </div>

              {questionGroups.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "40px" }}>
                  <Text type="secondary">
                    No question groups yet. Click "Add Question Group" to start creating questions.
                  </Text>
                </Card>
              ) : (
                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                  {questionGroups.map((group, index) => (
                    <QuestionGroupComponent
                      key={group.id}
                      group={group}
                      onChange={(updatedGroup) => updateQuestionGroup(index, updatedGroup)}
                      onRemove={() => removeQuestionGroup(index)}
                    />
                  ))}
                </Space>
              )}
            </div>
          </Space>
        </Col>

        {/* Question Sidebar */}
        <Col span={6}>
          <QuestionSidebar
            groups={questionGroups}
            onAddGroup={() => setShowGroupModal(true)}
            onSelectQuestion={setSelectedQuestion}
            selectedQuestion={selectedQuestion}
          />
        </Col>
      </Row>

      {/* Add Group Modal */}
      <Modal
        title="Add Question Group"
        open={showGroupModal}
        onOk={addQuestionGroup}
        onCancel={() => setShowGroupModal(false)}
        okText="Add Group"
        cancelText="Cancel"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text strong>Group Type</Text>
            <Select
              value={newGroupType}
              onChange={setNewGroupType}
              style={{ width: "100%", marginTop: "8px" }}
            >
              <Option value="SINGLE_ANSWER">Single Answer (Multiple Choice)</Option>
              <Option value="TRUE_FALSE_NOT_GIVEN">True/False/Not Given</Option>
              <Option value="MATCHING">Matching</Option>
              <Option value="FILL_BLANK">Fill in the Blank</Option>
            </Select>
          </div>
        </Space>
      </Modal>
    </Card>
  );
};

export default EnhancedSectionForm;
