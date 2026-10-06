import { Checkbox, Collapse, Input } from "antd";

import type { SpeakingVisualContextInput } from "../types";

type VisualContextFieldsProps = {
  images: readonly string[];
  context: SpeakingVisualContextInput;
  disabled: boolean;
  onChange: (context: SpeakingVisualContextInput) => void;
};

export function VisualContextFields({
  images,
  context,
  disabled,
  onChange,
}: VisualContextFieldsProps) {
  return (
    <Collapse
      ghost
      items={[
        {
          key: "evaluation-context",
          label: "Değerlendirme bağlamı",
          children: (
            <div className="visual-context-fields">
              <Checkbox
                checked={context.verified}
                disabled={disabled}
                onChange={(event) =>
                  onChange({ ...context, verified: event.target.checked })
                }
              >
                Görsel açıklamalarını doğruladım
              </Checkbox>
              {images.map((imageUrl, index) => (
                <Input.TextArea
                  key={imageUrl || index}
                  disabled={disabled}
                  value={context.descriptions[index]?.description ?? ""}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  onChange={(event) =>
                    onChange({
                      verified: false,
                      descriptions: images.map(
                        (currentImageUrl, descriptionIndex) => ({
                          imageUrl: currentImageUrl,
                          description:
                            descriptionIndex === index
                              ? event.target.value
                              : context.descriptions[descriptionIndex]
                                    ?.description ?? "",
                        }),
                      ),
                    })
                  }
                  aria-label={`Görsel ${index + 1} değerlendirme açıklaması`}
                />
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
