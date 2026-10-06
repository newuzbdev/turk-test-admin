import { Alert, Input, InputNumber, Space } from "antd";

import { writingPracticeEndpoints } from "@/config/endpoint";
import PracticeContentEditorShell from "@/pages/practice-admin/practice-content-editor-shell";
import { clone, PracticeField } from "@/pages/practice-admin/editor-utils";
import WritingPracticeRichTextEditor, {
  type WritingPracticeRichTextDocument,
} from "./writing-practice-rich-text-editor";

const sectionLabels: Record<string, string> = {
  TASK_1_1: "Bölüm 1.1",
  TASK_1_2: "Bölüm 1.2",
  TASK_2: "Bölüm 2",
};

function WritingPracticeFields({
  sectionCode,
  content,
  onChange,
}: {
  sectionCode: string;
  content: any;
  onChange: (content: any) => void;
}) {
  const section = content?.sections?.[0];
  const task = section?.subParts?.[0];
  if (!section || !task) {
    return <Alert type="error" message="Yazma pratiği içeriği eksik." />;
  }

  const patchRoot = (patch: Record<string, unknown>) =>
    onChange({ ...content, ...patch });
  const patchTask = (patch: Record<string, unknown>) => {
    const next = clone(content);
    next.sections[0].subParts[0] = { ...next.sections[0].subParts[0], ...patch };
    onChange(next);
  };
  const partOne = sectionCode === "TASK_1_1" || sectionCode === "TASK_1_2";

  return (
    <div className="space-y-6">
      {partOne ? (
        <>
          <PracticeField label="E-posta öncesi bağlam">
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 5 }}
              value={content.instruction || ""}
              placeholder="Öğrencinin görevi anlaması için kısa bağlamı yazın."
              onChange={(event) => patchRoot({ instruction: event.target.value })}
            />
          </PracticeField>
          <WritingPracticeRichTextEditor
            label="Gelen e-posta"
            value={content.sourceEmail as WritingPracticeRichTextDocument}
            placeholder="Öğrencinin yanıtlayacağı e-postayı yazın."
            minHeight={220}
            onChange={(sourceEmail) => patchRoot({ sourceEmail })}
          />
        </>
      ) : null}

      <WritingPracticeRichTextEditor
        label={partOne ? "Adaydan istenenler" : "Yazma konusu ve görev"}
        value={task.promptJson as WritingPracticeRichTextDocument}
        placeholder="Öğrencinin yazacağı görevi açıkça belirtin."
        minHeight={partOne ? 220 : 330}
        allowBoxedBlock={!partOne}
        onChange={(promptJson) => patchTask({ promptJson })}
      />

      <Space size={16} wrap>
        <PracticeField label="En az kelime">
          <InputNumber
            min={1}
            max={1000}
            value={Number(task.wordMin || 0)}
            onChange={(value) => patchTask({ wordMin: Number(value || 1) })}
          />
        </PracticeField>
        <PracticeField label="En fazla kelime">
          <InputNumber
            min={1}
            max={1000}
            value={Number(task.wordMax || 0)}
            onChange={(value) => patchTask({ wordMax: Number(value || 1) })}
          />
        </PracticeField>
      </Space>
    </div>
  );
}

export default function WritingPracticeEditor() {
  return (
    <PracticeContentEditorShell
      domainLabel="Yazma"
      listPath="/writing-practice"
      adminOne={writingPracticeEndpoints.adminOne}
      contentEndpoint={writingPracticeEndpoints.content}
      sectionLabel={(code) => sectionLabels[code] || code}
    >
      {({ practice, content, onChange }) => (
        <WritingPracticeFields
          sectionCode={practice.sectionCode}
          content={content}
          onChange={onChange}
        />
      )}
    </PracticeContentEditorShell>
  );
}
