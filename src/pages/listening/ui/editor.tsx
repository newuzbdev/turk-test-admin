"use client";

import type * as React from "react";
import { Card } from "antd";
import { Input, Button, Switch, Radio } from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { useQuestionStore } from "../store/question-store";

const { TextArea } = Input;

export function QuestionEditor() {
  const {
    questions,
    currentQuestionId,
    updateQuestion,
    addChoice,
    removeChoice,
    setCorrectAnswer,
    toggleCompactGuide,
    compactGuide,
  } = useQuestionStore();
  const currentQuestion = questions.find((q) => q.id === currentQuestionId);

  if (!currentQuestion) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a question to edit.
      </div>
    );
  }

  const handleQuestionTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    updateQuestion(currentQuestion.id, { questionText: e.target.value });
  };

  const handleChoiceTextChange = (choiceId: string, value: string) => {
    const updatedChoices = currentQuestion.choices.map((choice) =>
      choice.id === choiceId ? { ...choice, text: value } : choice
    );
    updateQuestion(currentQuestion.id, { choices: updatedChoices });
  };

  const handleExplanationChange = (value: string) => {
    updateQuestion(currentQuestion.id, { explanation: value });
  };

  const handleLocatedPassageChange = (value: string) => {
    updateQuestion(currentQuestion.id, { locatedPassage: value });
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <Card title="Question 1 - 3">
        <p className="text-sm text-muted-foreground">
          Do the following statements agree with the information given in{" "}
          {"<Reading Passage Number>"}? In following statements 27-32 below,
          choose
        </p>
        <ul className="list-none space-y-1 text-sm">
          <li>
            <span className="font-bold">YES</span> if the statement agrees with
            the information
          </li>
          <li>
            <span className="font-bold">NO</span> if the statement contradicts
            the information
          </li>
          <li>
            <span className="font-bold">NOT GIVEN</span> if it is impossible to
            say what the writer thinks about this
          </li>
        </ul>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch checked={compactGuide} onChange={toggleCompactGuide} />
            <span>Compact guide</span>
          </div>
          <span className="text-sm text-muted-foreground">
            Choose YES/NO/NOT GIVEN
          </span>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button icon={<span>{"<"}</span>} />
          <span className="text-sm font-medium">Question 1/3</span>
          <Button icon={<span>{">"}</span>} />
        </div>
        <Button icon={<PlusOutlined />}>Add question</Button>
      </div>

      <Card title="Question">
        <TextArea
          placeholder="Let's ask a question"
          value={currentQuestion.questionText}
          onChange={handleQuestionTextChange}
          rows={4}
        />
      </Card>

      <Card title="Choice">
        <Radio.Group
          value={currentQuestion.correctAnswerIds[0]}
          onChange={(e) => setCorrectAnswer(currentQuestion.id, e.target.value)}
        >
          {currentQuestion.choices.map((choice) => (
            <div key={choice.id} className="flex items-center space-x-2 mb-2">
              <Radio value={choice.id}>
                <Input
                  value={choice.text}
                  onChange={(e) =>
                    handleChoiceTextChange(choice.id, e.target.value)
                  }
                />
              </Radio>
              <Button
                icon={<CloseOutlined />}
                onClick={() => removeChoice(currentQuestion.id, choice.id)}
              />
            </div>
          ))}
        </Radio.Group>
        <Button
          icon={<PlusOutlined />}
          onClick={() => addChoice(currentQuestion.id, "")}
          block
        >
          Add choice
        </Button>
      </Card>

      <Card title="Correct Answer">
        <div className="flex space-x-2">
          {currentQuestion.choices.map((choice) => (
            <Button
              key={choice.id}
              type={
                currentQuestion.correctAnswerIds.includes(choice.id)
                  ? "primary"
                  : "default"
              }
              onClick={() => setCorrectAnswer(currentQuestion.id, choice.id)}
            >
              {choice.text}
            </Button>
          ))}
        </div>
      </Card>

      <Card title="Explanation">
        <TextArea
          placeholder="Add explanation..."
          value={currentQuestion.explanation}
          onChange={(e) => handleExplanationChange(e.target.value)}
          rows={4}
        />
        <div className="flex items-center space-x-2 mt-4">
          <Input
            placeholder="Select locate passage..."
            value={currentQuestion.locatedPassage}
            onChange={(e) => handleLocatedPassageChange(e.target.value)}
          />
          <Button icon={<PlusOutlined />}>Select passage</Button>
        </div>
      </Card>
    </div>
  );
}
