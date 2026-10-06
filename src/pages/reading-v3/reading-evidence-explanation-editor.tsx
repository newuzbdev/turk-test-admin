import {
  EditorContent,
  Mark,
  mergeAttributes,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Eraser, Italic } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";

import {
  formattedExplanationToHtml,
  tiptapExplanationToValue,
} from "./reading-evidence-explanation-format";

type ReadingEvidenceExplanationEditorProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
};

const GreenText = Mark.create({
  name: "evidenceGreen",
  parseHTML() {
    return [{ tag: 'span[data-evidence-color="green"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-evidence-color": "green",
        class: "font-medium text-emerald-700",
      }),
      0,
    ];
  },
});

const BlueText = Mark.create({
  name: "evidenceBlue",
  parseHTML() {
    return [{ tag: 'span[data-evidence-color="blue"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-evidence-color": "blue",
        class: "font-semibold text-blue-700",
      }),
      0,
    ];
  },
});

export default function ReadingEvidenceExplanationEditor({
  value,
  onChange,
  rows = 4,
}: ReadingEvidenceExplanationEditorProps) {
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
      GreenText,
      BlueText,
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: formattedExplanationToHtml(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": "Neden doğru?",
        "aria-multiline": "true",
        class:
          "min-h-[112px] px-3 py-2.5 text-sm leading-6 text-neutral-900 outline-none",
        role: "textbox",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = tiptapExplanationToValue(currentEditor.getJSON());
      lastEmittedValue.current = nextValue;
      onChange(nextValue);
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

  const toggleColor = (
    activeMark: "evidenceGreen" | "evidenceBlue",
    otherMark: "evidenceGreen" | "evidenceBlue",
  ) => {
    if (!editor) return;
    const isActive = editor.isActive(activeMark);
    const chain = editor.chain().focus().unsetMark(otherMark);
    if (isActive) {
      chain.unsetMark(activeMark).run();
      return;
    }
    chain.setMark(activeMark).run();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-neutral-600">
          Neden doğru?
        </span>
        <div
          className="flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-1"
          aria-label="Açıklama biçimlendirme araçları"
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
          <ToolbarButton
            label="Yeşil yap"
            active={editor?.isActive("evidenceGreen")}
            icon={<span className="h-3 w-3 rounded-full bg-emerald-600" />}
            onClick={() => toggleColor("evidenceGreen", "evidenceBlue")}
          />
          <ToolbarButton
            label="Mavi yap"
            active={editor?.isActive("evidenceBlue")}
            icon={<span className="h-3 w-3 rounded-full bg-blue-700" />}
            onClick={() => toggleColor("evidenceBlue", "evidenceGreen")}
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

      <div
        className="overflow-hidden rounded-md border border-neutral-200 bg-white transition focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-100"
        style={{ minHeight: `${Math.max(rows, 3) * 24 + 24}px` }}
      >
        <EditorContent editor={editor} />
      </div>

      <p className="text-[11px] leading-4 text-neutral-500">
        Metni seçin; kalın, italik veya renk düğmesine basın. Biçimlendirme
        doğrudan burada görünür.
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
