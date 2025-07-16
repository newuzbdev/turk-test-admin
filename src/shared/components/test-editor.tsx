import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Progress,
  Card,
  Input,
  Space,
  Row,
  Col,
  Badge,
} from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import PartForm from "@/shared/ui/part-form";
import type { Part } from "@/utils/types/types";

const { TextArea } = Input;

interface TestData {
  title: string;
  description: string;
  type: "LISTENING" | "READING";
  ieltsId: string;
  parts: Part[];
}

interface TestEditorProps {
  testType: "LISTENING" | "READING";
  backUrl: string;
  useGetOneTest: (id: string) => any;
  useCreateTestWithAddition: () => any;
}

export default function TestEditor({
  testType,
  backUrl,
  useGetOneTest,
  useCreateTestWithAddition,
}: TestEditorProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProgress, setShowProgress] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [testData, setTestData] = useState<TestData>({
    title: "",
    description: "",
    type: testType,
    ieltsId: "",
    parts: []
  });
  
  // Check if this is a new test creation
  const isNewTest = id?.startsWith("temp-") || location.state?.isNew;
  const initialTestData = location.state?.testData;
  
  const { mutateAsync: createTest, isPending: isCreating } = useCreateTestWithAddition();
  const { data: test, isLoading } = useGetOneTest(
    isNewTest ? "" : id || ""
  );

  // Initialize test data from location state
  useEffect(() => {
    if (isNewTest && initialTestData) {
      setTestData(prev => ({
        ...prev,
        title: initialTestData.title || "",
        ieltsId: initialTestData.ieltsId || "",
        description: `${initialTestData.title} - ${testType} Test`,
      }));
    }
  }, [isNewTest, initialTestData, testType]);

  // Show progress animation for new tests
  useEffect(() => {
    if (isNewTest) {
      setShowProgress(true);
      const interval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setShowProgress(false), 200);
            return 100;
          }
          return prev + 20;
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [isNewTest]);

  // Add new part
  const addPart = () => {
    const newPart: Part = {
      number: testData.parts.length + 1,
      title: `Part ${testData.parts.length + 1}`,
      audioUrl: testType === "LISTENING" ? "" : undefined,
      sections: []
    };
    setTestData(prev => ({
      ...prev,
      parts: [...prev.parts, newPart]
    }));
  };

  // Update part
  const updatePart = (index: number, updatedPart: Part) => {
    setTestData(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) => i === index ? updatedPart : part)
    }));
  };

  // Remove part
  const removePart = (index: number) => {
    setTestData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  // Transform data to match API structure
  const transformDataForAPI = (data: TestData) => {
    return {
      title: data.title,
      description: data.description,
      type: data.type,
      ieltsId: data.ieltsId,
      parts: data.parts.map((part) => ({
        number: part.number,
        title: part.title,
        audioUrl: part.audioUrl || "",
        sections: (part.sections || []).map((section, sectionIndex) => ({
          title: section.title || `Section ${sectionIndex + 1}`,
          content: section.content || "Read the following passage...",
          imageUrl: "",
          questions: (section.questions || []).map(
            (question, questionIndex) => ({
              number: questionIndex + 1,
              type: question.type || "MULTIPLE_CHOICE",
              text: question.question || `Question ${questionIndex + 1}`,
              answers: (question.answers || []).map((answer, answerIndex) => {
                const variantText = String.fromCharCode(65 + answerIndex);
                return {
                  variantText: variantText,
                  answer: answer.answer || `Option ${variantText}`,
                  correct: Boolean(answer.isCorrect),
                };
              }),
            })
          ),
        })),
      })),
    };
  };

  // Save test
  const handleSave = async () => {
    try {
      const transformedData = transformDataForAPI(testData);
      console.log("Sending data to API:", transformedData);
      await createTest(transformedData);
      navigate(backUrl);
    } catch (error) {
      console.error("Error saving test:", error);
    }
  };

  if (isLoading && !isNewTest) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isNewTest && !test?.data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Test not found</div>
      </div>
    );
  }

  // Show progress for new test creation
  if (showProgress) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="w-96 text-center">
          <h2 className="text-xl font-semibold mb-4">
            Creating {testType} Test...
          </h2>
          <Progress
            percent={progressPercent}
            status="active"
            strokeColor={{
              "0%": "#108ee9",
              "100%": "#87d068",
            }}
          />
          <p className="text-gray-600 mt-4">
            {testData.title || "Setting up your test"}
          </p>
        </div>
      </div>
    );
  }

  const displayTitle = isNewTest ? testData.title : test?.data?.title;
  const testIcon = testType === "LISTENING" ? "🎧" : "📖";

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="flex items-center justify-between h-16 px-6 border-b bg-white shadow-sm">
        <div className="flex items-center space-x-4">
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(backUrl)}
            className="flex items-center space-x-2"
          >
            Back to {testType} Tests
          </Button>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold">
              {displayTitle || `New ${testType} Test`}
            </h1>
            <span className="text-sm text-gray-500">
              ({testType} Test Editor)
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            type="primary" 
            onClick={handleSave}
            loading={isCreating}
          >
            Save Test
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Test Basic Info */}
          <Card title={`📝 Test Information`}>
            <Row gutter={[20, 20]}>
              <Col span={12}>
                <div style={{ marginBottom: "8px" }}>
                  <label style={{ fontWeight: 600, fontSize: "14px" }}>
                    Test Title
                  </label>
                </div>
                <Input
                  placeholder="Enter test title"
                  value={testData.title}
                  onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
                  size="large"
                />
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: "8px" }}>
                  <label style={{ fontWeight: 600, fontSize: "14px" }}>
                    Description
                  </label>
                </div>
                <TextArea
                  placeholder="Enter test description"
                  value={testData.description}
                  onChange={(e) => setTestData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </Col>
            </Row>
          </Card>

          {/* Parts Section */}
          <Card 
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{testIcon} Test Parts</span>
                  <Badge 
                    count={testData.parts.length} 
                    style={{ backgroundColor: '#10b981' }}
                  />
                </div>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={addPart}
                >
                  Add Part
                </Button>
              </div>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              {testData.parts.map((part, index) => (
                <div
                  key={index}
                  style={{
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                  }}
                >
                  <PartForm
                    part={part}
                    onChange={(updatedPart) => updatePart(index, updatedPart)}
                    onRemove={() => removePart(index)}
                    showAudioUpload={testType === "LISTENING"}
                  />
                </div>
              ))}
              
              {testData.parts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No parts added yet. Click "Add Part" to create your first part.</p>
                </div>
              )}
            </Space>
          </Card>
        </div>
      </div>
    </div>
  );
}
