import { it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BillingPackageEditor from "./billing-package-editor";
import { packagePreset } from "./billing-package-form";
it("a stale save keeps the owner draft and never becomes a success", async () => {
  const onSave = vi.fn().mockRejectedValue({ response: { status: 409 } }),
    onPublish = vi.fn();
  render(
    <BillingPackageEditor
      draft={{
        id: "package",
        revision: 1,
        terms: packagePreset("MEMBERSHIP"),
        salesEnabled: true,
        sortOrder: 0,
      }}
      content={{ mocks: [], lessons: [] }}
      onSave={onSave}
      onPublish={onPublish}
      onReload={vi.fn()}
    />,
  );
  fireEvent.change(screen.getByLabelText("Paket adı"), {
    target: { value: "Yeni paket" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Başka bir düzenleme",
  );
  expect(screen.getByLabelText("Paket adı")).toHaveValue("Yeni paket");
  expect(onPublish).not.toHaveBeenCalled();
});
