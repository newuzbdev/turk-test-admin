"use client";

import { Card } from "antd";
import { Button } from "antd";
import {
  PlusOutlined,
  BoxPlotOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useQuestionStore } from "./store/question-store";

export function QuestionGroupPanel() {
  const { questionGroups, currentQuestionId, setCurrentQuestionId } =
    useQuestionStore();

  return (
    <div className="w-80 shrink-0 border-l bg-background p-6 space-y-6 overflow-auto">
      <Card
        title={
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Question Group</span>
            <BoxPlotOutlined className="h-5 w-5 text-muted-foreground" />
          </div>
        }
        bordered={false}
        className="shadow-none"
      >
        <div className="space-y-4">
          {questionGroups.map((group: any) => (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                <span>{group.name}</span>
                <CloseOutlined className="h-4 w-4 cursor-pointer hover:text-foreground" />
              </div>
              <div className="space-y-1">
                {group.questions.map((question: any) => (
                  <Button
                    key={question.id}
                    type={currentQuestionId === question.id ? "text" : "link"}
                    className={`w-full justify-start text-sm font-normal ${
                      currentQuestionId === question.id
                        ? "bg-muted font-medium"
                        : ""
                    }`}
                    onClick={() => setCurrentQuestionId(question.id)}
                  >
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                    {question.title}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <Button
            type="dashed"
            className="w-full flex items-center space-x-2 bg-transparent"
          >
            <PlusOutlined className="h-4 w-4" />
            <span>Add question group</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
