import { Input } from "antd";

import type { SpeakingEditorQuestion } from "../types";

type FixedQuestionListProps = {
  questions: [
    SpeakingEditorQuestion,
    SpeakingEditorQuestion,
    SpeakingEditorQuestion,
  ];
  durationSeconds?: number;
  disabled: boolean;
  onChange: (index: 0 | 1 | 2, text: string) => void;
};

export function FixedQuestionList({
  questions,
  durationSeconds,
  disabled,
  onChange,
}: FixedQuestionListProps) {
  return (
    <div className="fixed-question-list">
      {questions.map((question, index) => (
        <div className="fixed-question-row" key={question.id}>
          <span className="fixed-question-number">{index + 1}</span>
          <Input.TextArea
            aria-label={`Soru ${index + 1}`}
            value={question.text}
            disabled={disabled}
            autoSize={{ minRows: 1, maxRows: 4 }}
            onChange={(event) =>
              onChange(index as 0 | 1 | 2, event.target.value)
            }
          />
          {durationSeconds !== undefined && (
            <span className="fixed-duration">{durationSeconds} sn</span>
          )}
        </div>
      ))}
    </div>
  );
}
