import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { message, Modal, Table } from "antd";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryMocks = vi.hoisted(() => ({
  listResult: {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as Record<string, unknown>,
  create: vi.fn(),
  revise: vi.fn(),
  archive: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/config/queries/speaking/get-all.queries", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/config/queries/speaking/get-all.queries")
    >();
  return {
    ...actual,
    useGetAllSpeakingTests: () => queryMocks.listResult,
  };
});

vi.mock("@/config/queries/speaking/v2.queries", () => ({
  useCreateSpeakingV2: () => ({
    mutateAsync: queryMocks.create,
    isPending: false,
  }),
  useReviseSpeakingV2: () => ({ mutateAsync: queryMocks.revise }),
  useArchiveSpeakingV2: () => ({ mutateAsync: queryMocks.archive }),
  useDeleteSpeakingV2: () => ({ mutateAsync: queryMocks.remove }),
}));

vi.mock("@/config/queries/ielts/get-all.queries", () => ({
  useGetAllIelts: () => ({
    data: {
      ieltsData: [{ id: "package", title: "Paket 1" }],
    },
    isLoading: false,
  }),
}));

import { normalizeSpeakingListResponse } from "@/config/queries/speaking/get-all.queries";
import type { SpeakingListRow } from "@/pages/speaking-v2/types";

import { SpeakingTable } from "./speaking-table";
import { SpeakingColumns } from "./ui/speaking-columns";
import { SpeakingModal } from "./ui/speaking-modal";
import { useSpeakingModalStore } from "./utils/speaking-modal-store";

const confirmations: Array<Parameters<typeof Modal.confirm>[0]> = [];
vi.spyOn(Modal, "confirm").mockImplementation((config) => {
  confirmations.push(config);
  return { destroy: vi.fn(), update: vi.fn() };
});
vi.spyOn(message, "success").mockImplementation(
  () => undefined as unknown as ReturnType<typeof message.success>,
);
vi.spyOn(message, "error").mockImplementation(
  () => undefined as unknown as ReturnType<typeof message.error>,
);

const getComputedStyle = window.getComputedStyle;
vi.spyOn(window, "getComputedStyle").mockImplementation((element) =>
  getComputedStyle(element),
);
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const v1: SpeakingListRow = {
  id: "v1",
  title: "Eski sınav",
  formatVersion: 1,
  status: "ARCHIVED",
  publishedAt: null,
  updatedAt: "2026-08-17T12:00:00.000Z",
  submissionCount: 2,
  ielts: { id: "package", title: "Paket 1" },
  completion: null,
};

const draft: SpeakingListRow = {
  ...v1,
  id: "draft",
  title: "Taslak",
  formatVersion: 2,
  status: "DRAFT",
  submissionCount: 0,
  completion: {
    completedTasks: 2,
    totalTasks: 4,
    readyAudio: 3,
    totalAudio: 6,
  },
};

const published: SpeakingListRow = {
  ...draft,
  id: "published",
  title: "Yayındaki",
  status: "PUBLISHED",
  publishedAt: "2026-08-17T12:00:00.000Z",
  submissionCount: 1,
};

const archived: SpeakingListRow = {
  ...published,
  id: "archived",
  title: "Arşivdeki",
  status: "ARCHIVED",
};

const callbacks = {
  revisionPending: false,
  onOpen: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onRevise: vi.fn(),
  onArchive: vi.fn(),
};

const LocationProbe = () => {
  const location = useLocation();
  return <output aria-label="Geçerli yol">{location.pathname}</output>;
};

const renderRows = (rows: SpeakingListRow[]) =>
  render(
    <MemoryRouter initialEntries={["/speaking"]}>
      <Table
        pagination={false}
        rowKey="id"
        dataSource={rows}
        columns={SpeakingColumns(callbacks)}
      />
      <LocationProbe />
    </MemoryRouter>,
  );

const renderSpeakingTable = (rows: SpeakingListRow[]) => {
  queryMocks.listResult = {
    data: {
      data: rows,
      meta: { total: rows.length, page: 1, limit: 10, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { enabled: false, retry: false } },
        })
      }
    >
      <MemoryRouter initialEntries={["/speaking"]}>
        <SpeakingTable />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("speaking test list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmations.length = 0;
    useSpeakingModalStore.setState({ open: false });
  });

  it("normalizes raw and wrapped pagination payloads", () => {
    expect(
      normalizeSpeakingListResponse({
        data: [draft],
        total: 1,
        page: 2,
        limit: 10,
      }),
    ).toEqual({
      data: [draft],
      meta: { total: 1, page: 2, limit: 10, totalPages: 1 },
    });
    expect(
      normalizeSpeakingListResponse({
        data: [draft],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      }).meta.limit,
    ).toBe(20);
  });

  it("labels V1 rows as archived and does not offer editing", async () => {
    renderRows([v1]);

    expect(screen.getByText("Arşivde")).toBeInTheDocument();
    expect(screen.queryByText("V2")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Eski sınav işlemleri" }),
    );
    expect(screen.getByText("Salt okunur görüntüle")).toBeInTheDocument();
    expect(screen.queryByText("Taslağı düzenle")).not.toBeInTheDocument();
  });

  it("offers draft and published lifecycle actions", async () => {
    const view = renderRows([draft]);
    await userEvent.click(
      screen.getByRole("button", { name: "Taslak işlemleri" }),
    );
    expect(screen.getByText("Taslağı düzenle")).toBeInTheDocument();
    expect(screen.getByText("Taslağı sil")).toBeInTheDocument();
    view.unmount();

    renderRows([published]);
    await userEvent.click(
      screen.getByRole("button", { name: "Yayındaki işlemleri" }),
    );
    expect(screen.getByText("Yeni sürüm oluştur")).toBeInTheDocument();
    expect(screen.getByText("Arşivle")).toBeInTheDocument();
  });

  it("uses a keyboard-operable title link as the row entry point", async () => {
    const user = userEvent.setup();
    renderRows([draft]);

    const titleLink = screen.getByRole("link", { name: /Taslak/ });
    titleLink.focus();
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("status", { name: "Geçerli yol" }),
    ).toHaveTextContent("/speaking/draft/edit");
  });

  it("offers only view and revision actions for archived V2 rows", async () => {
    const user = userEvent.setup();
    renderRows([archived]);

    await user.click(
      screen.getByRole("button", { name: "Arşivdeki işlemleri" }),
    );
    expect(screen.getByText("Görüntüle")).toBeInTheDocument();
    expect(screen.getByText("Yeni sürüm oluştur")).toBeInTheDocument();
    expect(screen.queryByText("Taslağı sil")).not.toBeInTheDocument();
    expect(screen.queryByText("Arşivle")).not.toBeInTheDocument();

    await user.click(screen.getByText("Görüntüle"));
    expect(callbacks.onOpen).toHaveBeenCalledWith("archived");
    expect(callbacks.onRevise).not.toHaveBeenCalled();
  });

  it("cancels draft deletion and accepts published archival", async () => {
    const user = userEvent.setup();
    const view = renderSpeakingTable([draft]);

    await user.click(screen.getByRole("button", { name: "Taslak işlemleri" }));
    await user.click(screen.getByText("Taslağı sil"));
    expect(confirmations).toHaveLength(1);
    expect(
      screen.getByRole("status", { name: "Geçerli yol" }),
    ).toHaveTextContent("/speaking");
    await confirmations[0].onCancel?.();
    expect(queryMocks.remove).not.toHaveBeenCalled();
    view.unmount();

    queryMocks.archive.mockResolvedValue({ ...published, status: "ARCHIVED" });
    renderSpeakingTable([published]);
    await user.click(
      screen.getByRole("button", { name: "Yayındaki işlemleri" }),
    );
    await user.click(screen.getByText("Arşivle"));
    expect(confirmations).toHaveLength(2);
    await confirmations[1].onOk?.(vi.fn());

    await waitFor(() =>
      expect(queryMocks.archive).toHaveBeenCalledWith("published"),
    );
  });

  it("navigates to the durable revision returned by the table action", async () => {
    const user = userEvent.setup();
    queryMocks.revise.mockResolvedValue({ ...draft, id: "revision" });
    renderSpeakingTable([published]);

    await user.click(
      screen.getByRole("button", { name: "Yayındaki işlemleri" }),
    );
    await user.click(screen.getByText("Yeni sürüm oluştur"));

    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "Geçerli yol" }),
      ).toHaveTextContent("/speaking/revision/edit"),
    );
  });

  it("serializes duplicate revision activations while the request is unresolved", async () => {
    const user = userEvent.setup();
    let resolveRevision: ((row: SpeakingListRow) => void) | undefined;
    queryMocks.revise.mockImplementation(
      () =>
        new Promise<SpeakingListRow>((resolve) => {
          resolveRevision = resolve;
        }),
    );
    renderSpeakingTable([published]);

    await user.click(
      screen.getByRole("button", { name: "Yayındaki işlemleri" }),
    );
    await user.click(screen.getByText("Yeni sürüm oluştur"));

    await waitFor(() => expect(queryMocks.revise).toHaveBeenCalledTimes(1));
    await user.click(
      screen.getByRole("button", { name: "Yayındaki işlemleri" }),
    );
    const secondActivation = screen
      .getByText("Yeni sürüm oluştur")
      .closest("[role='menuitem']");
    expect(secondActivation).not.toBeNull();
    await user.click(secondActivation as HTMLElement);
    expect(queryMocks.revise).toHaveBeenCalledTimes(1);
    expect(secondActivation).toHaveAttribute("aria-disabled", "true");

    await act(async () => {
      resolveRevision?.({ ...draft, id: "single-revision" });
    });
    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "Geçerli yol" }),
      ).toHaveTextContent("/speaking/single-revision/edit"),
    );
  });

  it("creates and navigates once when the modal receives duplicate submits", async () => {
    const user = userEvent.setup();
    let resolveCreate: ((row: SpeakingListRow) => void) | undefined;
    queryMocks.create.mockImplementation(
      () =>
        new Promise<SpeakingListRow>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    useSpeakingModalStore.setState({ open: true });
    render(
      <MemoryRouter initialEntries={["/speaking"]}>
        <SpeakingModal hideAddButton />
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox"), "Yeni");
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Paket 1"));
    const form = screen.getByRole("textbox").closest("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form as HTMLFormElement);
    await waitFor(() => expect(queryMocks.create).toHaveBeenCalled());
    fireEvent.submit(form as HTMLFormElement);
    await act(async () => undefined);
    expect(queryMocks.create).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveCreate?.({ ...draft, id: "created" });
    });
    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "Geçerli yol" }),
      ).toHaveTextContent("/speaking/created/edit"),
    );
  });
});
