import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeState = vi.hoisted(() => ({
  params: { ieltsId: "test-123" } as Record<string, string>,
  state: null as null | { isNew?: boolean },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useParams: () => routeState.params,
    useLocation: () => ({ state: routeState.state }),
  };
});

vi.mock("./components/reading-test-editor", () => ({
  default: (props: {
    ieltsId?: string;
    testId?: string | null;
    layout?: "legacy" | "v2";
  }) => (
    <div
      data-testid="reading-editor-props"
      data-ielts-id={props.ieltsId || ""}
      data-test-id={props.testId || ""}
      data-layout={props.layout || ""}
    />
  ),
}));

vi.mock("@/config/queries/reading/update.queries", () => ({
  useUpdateReadingTestWithAddition: vi.fn(),
}));

vi.mock("@/config/queries/reading/get-one.queries", () => ({
  useGetReadingTestWithAddition: vi.fn(),
}));

import ReadingEditor from "./reading-editor";

describe("ReadingEditor route identity", () => {
  beforeEach(() => {
    routeState.params = { ieltsId: "test-123" };
    routeState.state = null;
  });

  it("loads an existing record using the route id as testId", () => {
    render(<ReadingEditor />);

    const editor = screen.getByTestId("reading-editor-props");
    expect(editor).toHaveAttribute("data-test-id", "test-123");
    expect(editor).toHaveAttribute("data-ielts-id", "");
    expect(editor).toHaveAttribute("data-layout", "legacy");
  });

  it("uses the route id as ieltsId when creating a new record", () => {
    routeState.state = { isNew: true };
    render(<ReadingEditor />);

    const editor = screen.getByTestId("reading-editor-props");
    expect(editor).toHaveAttribute("data-test-id", "");
    expect(editor).toHaveAttribute("data-ielts-id", "test-123");
  });

  it("opens the same record with the v2 editor layout when requested", () => {
    render(<ReadingEditor layout="v2" />);

    const editor = screen.getByTestId("reading-editor-props");
    expect(editor).toHaveAttribute("data-test-id", "test-123");
    expect(editor).toHaveAttribute("data-layout", "v2");
  });
});
