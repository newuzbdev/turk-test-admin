import { Input } from "antd";

type Part3PointsEditorProps = {
  advantages: [string, string, string];
  disadvantages: [string, string, string];
  disabled: boolean;
  onChange: (
    side: "advantages" | "disadvantages",
    index: 0 | 1 | 2,
    value: string,
  ) => void;
};

export function Part3PointsEditor({
  advantages,
  disadvantages,
  disabled,
  onChange,
}: Part3PointsEditorProps) {
  return (
    <div className="part-three-points-grid">
      {(
        [
          ["advantages", "Lehine", advantages],
          ["disadvantages", "Aleyhine", disadvantages],
        ] as const
      ).map(([side, title, values]) => (
        <section key={side} aria-labelledby={`${side}-title`}>
          <h3 id={`${side}-title`}>{title}</h3>
          {values.map((value, index) => (
            <div className="part-three-point-row" key={`${side}-${index}`}>
              <span>{index + 1}</span>
              <Input
                aria-label={`${title} madde ${index + 1}`}
                value={value}
                disabled={disabled}
                onChange={(event) =>
                  onChange(side, index as 0 | 1 | 2, event.target.value)
                }
              />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
