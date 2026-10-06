import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { message, Modal, unstableSetRender } from "antd";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installAntdReact19Renderer } from "./antd-react19-renderer";

const defaultRenderer = unstableSetRender();
const getComputedStyle = window.getComputedStyle;

beforeEach(() => {
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) =>
    getComputedStyle(element),
  );
  installAntdReact19Renderer();
});

afterEach(async () => {
  await act(async () => {
    Modal.destroyAll();
    message.destroy();
  });
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector(".ant-message")).not.toBeInTheDocument();
  });
  unstableSetRender(defaultRenderer);
  vi.restoreAllMocks();
});

describe("Ant Design static controls with React 19", () => {
  it("opens the archive confirmation and cancels without archiving", async () => {
    const archive = vi.fn();
    act(() => {
      Modal.confirm({
        title: "Testi arşivle",
        content: "Geçmiş sonuçlar korunacak.",
        okText: "Arşivle",
        cancelText: "Vazgeç",
        onOk: archive,
      });
    });

    expect(await screen.findByRole("dialog")).toHaveTextContent("Testi arşivle");
    expect(archive).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(archive).not.toHaveBeenCalled();
  });

  it("archives only after confirmation and can open another confirmation", async () => {
    const archive = vi.fn().mockResolvedValue(undefined);
    for (const title of ["İlk sürümü arşivle", "İkinci sürümü arşivle"]) {
      act(() => {
        Modal.confirm({ title, okText: "Arşivle", onOk: archive });
      });
      expect(await screen.findByRole("dialog")).toHaveTextContent(title);
      await userEvent.click(screen.getByRole("button", { name: "Arşivle" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    }
    expect(archive).toHaveBeenCalledTimes(2);
  });

  it("updates an existing confirmation without creating another React root", async () => {
    let confirmation: ReturnType<typeof Modal.confirm>;
    act(() => {
      confirmation = Modal.confirm({ title: "İlk başlık" });
    });
    expect(await screen.findByRole("dialog")).toHaveTextContent("İlk başlık");
    act(() => confirmation.update({ title: "Güncel başlık" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent("Güncel başlık"));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("renders the archive success message", async () => {
    act(() => {
      message.success("Test arşivlendi.", 0);
    });
    expect(await screen.findByText("Test arşivlendi.")).toBeInTheDocument();
  });
});
