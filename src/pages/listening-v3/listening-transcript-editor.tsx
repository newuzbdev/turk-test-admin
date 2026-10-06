import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Eraser, Italic } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";

import {
  formattedExplanationToHtml,
  tiptapDocumentToPlainText,
  tiptapExplanationToValue,
} from "../reading-v3/reading-evidence-explanation-format";

type ListeningTranscriptEditorProps = {
  value: string;
  placeholder?: string;
  onChange: (value: { formatted: string; plain: string }) => void;
};

export default function ListeningTranscriptEditor({
  value,
  placeholder,
  onChange,
}: ListeningTranscriptEditorProps) {
  const lastEmittedValue = useRef(value);
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        link: false,
        listItem: false,
        orderedList: false,
        strike: false,
      }),
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: formattedExplanationToHtml(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": "Duyulan metin",
        "aria-multiline": "true",
        class:
          "min-h-[440px] px-3.5 py-3 text-sm leading-6 text-neutral-900 outline-none",
        role: "textbox",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const json = currentEditor.getJSON();
      const formatted = tiptapExplanationToValue(json);
      lastEmittedValue.current = formatted;
      onChange({
        formatted,
        plain: tiptapDocumentToPlainText(json),
      });
    },
  });

  useEffect(() => {
    if (!editor || value === lastEmittedValue.current) return;
    const currentValue = tiptapExplanationToValue(editor.getJSON());
    if (value === currentValue) return;

    editor.commands.setContent(formattedExplanationToHtml(value), {
      emitUpdate: false,
    });
    lastEmittedValue.current = value;
  }, [editor, value]);

  const run = (command: () => boolean) => {
    if (!editor) return;
    command();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold text-neutral-700">
          Duyulan metin
        </label>
        <div
          className="flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-1"
          aria-label="Transcript biçimlendirme araçları"
        >
          <ToolbarButton
            label="Kalın yap"
            active={editor?.isActive("bold")}
            icon={<Bold size={15} strokeWidth={2} />}
            onClick={() =>
              run(() => editor!.chain().focus().toggleBold().run())
            }
          />
          <ToolbarButton
            label="İtalik yap"
            active={editor?.isActive("italic")}
            icon={<Italic size={15} strokeWidth={2} />}
            onClick={() =>
              run(() => editor!.chain().focus().toggleItalic().run())
            }
          />
          <span className="mx-0.5 h-4 w-px bg-neutral-200" />
          <ToolbarButton
            label="Biçimi temizle"
            icon={<Eraser size={15} strokeWidth={2} />}
            onClick={() =>
              run(() => editor!.chain().focus().unsetAllMarks().run())
            }
          />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-md border border-neutral-200 bg-white transition focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-100">
        {!value.trim() && placeholder ? (
          <p className="pointer-events-none absolute left-3.5 top-3 whitespace-pre-wrap text-sm leading-6 text-neutral-400">
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>

      <p className="text-[11px] leading-4 text-neutral-500">
        Metni seçip kalın veya italik yapabilirsiniz. Biçimlendirme sonuç
        incelemesinde aynı şekilde görünür.
      </p>
    </div>
  );
}

function ToolbarButton({
  label,
  icon,
  onClick,
  active,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={Boolean(active)}
      title={label}
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded text-neutral-700 transition hover:bg-white hover:text-neutral-950 ${
        active ? "bg-white text-neutral-950 shadow-sm" : ""
      }`}
    >
      {icon}
    </button>
  );
}
