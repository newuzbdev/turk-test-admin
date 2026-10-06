import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExamForm } from "./exam-form";
const period = {
  id: "stable",
  examStart: "2026-10-10",
  examEnd: "2026-10-12",
  registrationStart: "2026-09-11",
  registrationEnd: "2026-09-25",
  paymentEnd: "2026-09-26",
  sourceUrl: "https://gov.uz/oz/uzbmb/news/view/210877",
  published: true,
  version: 3,
};
describe("official exam editor", () => {
  it("requires confirmation before withdrawing a published period", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ExamForm initial={period} onSave={onSave} onCancel={() => {}} />);
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Öğrencilere yayımla" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Yayından kaldır ve kaydet" }),
    );
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ published: false, version: 3 }),
      ),
    );
  });
  it("retains revision and stable identity while editing dates", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ExamForm initial={period} onSave={onSave} onCancel={() => {}} />);
    fireEvent.change(screen.getByLabelText("Sınav başlangıcı"), {
      target: { value: "2026-10-11" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({
      version: 3,
      examStart: "2026-10-11",
    });
  });
  it("retains a draft when the API rejects saving", async () => {
    render(
      <ExamForm
        initial={period}
        onSave={async () => {
          throw new Error("Bu dönem başka bir yerde değiştirildi.");
        }}
        onCancel={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bu dönem başka bir yerde değiştirildi.",
    );
    expect(screen.getByLabelText("Resmî kaynak bağlantısı")).toHaveValue(
      period.sourceUrl,
    );
  });
});
