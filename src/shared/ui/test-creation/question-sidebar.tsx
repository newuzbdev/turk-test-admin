import React from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Badge,
  Divider,
} from "antd";
import {
  PlusOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

interface QuestionGroup {
  id: string;
  title: string;
  type: "SINGLE_ANSWER" | "TRUE_FALSE_NOT_GIVEN" | "MATCHING" | "FILL_BLANK";
  questions: any[];
}

interface QuestionSidebarProps {
  groups: QuestionGroup[];
  onAddGroup: () => void;
  onSelectQuestion?: (groupId: string, questionIndex: number) => void;
  selectedQuestion?: { groupId: string; questionIndex: number };
}

export const QuestionSidebar: React.FC<QuestionSidebarProps> = ({
  groups,
  onAddGroup,
  onSelectQuestion,
  selectedQuestion,
}) => {
  const getGroupColor = (type: string) => {
    switch (type) {
      case "SINGLE_ANSWER":
        return "#1890ff";
      case "TRUE_FALSE_NOT_GIVEN":
        return "#52c41a";
      case "MATCHING":
        return "#faad14";
      case "FILL_BLANK":
        return "#722ed1";
      default:
        return "#1890ff";
    }
  };

  const getGroupTypeLabel = (type: string) => {
    switch (type) {
      case "SINGLE_ANSWER":
        return "SINGLE ANSWER";
      case "TRUE_FALSE_NOT_GIVEN":
        return "T/F/NG";
      case "MATCHING":
        return "MATCHING";
      case "FILL_BLANK":
        return "FILL BLANK";
      default:
        return type;
    }
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title level={4} style={{ margin: 0 }}>
            Question Group
          </Title>
          <Button type="text" size="small" icon={<CloseOutlined />} />
        </div>
      }
      style={{ height: "100%", minHeight: "600px" }}
      bodyStyle={{ padding: "16px" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {groups.map((group) => (
          <div key={group.id}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "8px"
            }}>
              <Text strong style={{ color: getGroupColor(group.type) }}>
                {getGroupTypeLabel(group.type)}
              </Text>
              <Button type="text" size="small" icon={<CloseOutlined />} />
            </div>
            
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              {group.questions.map((question, index) => {
                const isSelected = selectedQuestion?.groupId === group.id && 
                                 selectedQuestion?.questionIndex === index;
                
                return (
                  <Button
                    key={index}
                    type={isSelected ? "primary" : "default"}
                    size="small"
                    style={{ 
                      width: "100%", 
                      textAlign: "left",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                    onClick={() => onSelectQuestion?.(group.id, index)}
                  >
                    <span>Question {question.number}</span>
                    <Badge 
                      count={question.answers?.length || 0} 
                      size="small"
                      color={getGroupColor(group.type)}
                    />
                  </Button>
                );
              })}
            </Space>
            
            {group.questions.length === 0 && (
              <div style={{ 
                padding: "16px", 
                textAlign: "center", 
                color: "#999",
                border: "1px dashed #d9d9d9",
                borderRadius: "4px",
                fontSize: "12px"
              }}>
                No questions
              </div>
            )}
            
            <Divider style={{ margin: "12px 0" }} />
          </div>
        ))}
        
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={onAddGroup}
          style={{ width: "100%" }}
        >
          Add question group
        </Button>
      </Space>
    </Card>
  );
};

export default QuestionSidebar;
