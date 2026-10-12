import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import StudentDeviceSummary from "./student-device-summary";
afterEach(cleanup);
describe("student device display", () => {
  it("shows an iPhone and browser without claiming an exact model", () => {
    render(
      <StudentDeviceSummary
        device={{
          kind: "PHONE",
          os: "IOS",
          browser: "SAFARI",
          observedAt: "2026-10-13T01:00:00Z",
        }}
      />,
    );
    expect(screen.getByText("iPhone")).toBeVisible();
    expect(screen.getByText("Safari")).toBeVisible();
    expect(screen.queryByText(/iPhone 1[0-9]/)).not.toBeInTheDocument();
  });
  it("shows the last device with a local timestamp even while offline", () => {
    render(
      <StudentDeviceSummary
        device={{
          kind: "COMPUTER",
          os: "WINDOWS",
          browser: "CHROME",
          observedAt: "2026-10-13T01:00:00Z",
        }}
        showTime
      />,
    );
    expect(screen.getByText("Windows bilgisayar")).toBeVisible();
    expect(screen.getByText("Chrome")).toBeVisible();
    expect(screen.getByText(/13\.10\.2026.*06:00/)).toBeVisible();
  });
  it("handles older responses and unknown values without displaying untrusted headers", () => {
    const view = render(<StudentDeviceSummary />);
    expect(screen.getByText("Bilinmiyor")).toBeVisible();
    view.rerender(
      <StudentDeviceSummary
        device={{
          kind: "UNKNOWN",
          os: "UNKNOWN",
          browser: "UNKNOWN",
          observedAt: "2026-10-13T01:00:00Z",
        }}
      />,
    );
    expect(screen.getByText("Bilinmiyor")).toBeVisible();
  });
});
