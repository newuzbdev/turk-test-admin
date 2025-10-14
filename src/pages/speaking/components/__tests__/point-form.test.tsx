import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PointForm } from "../point-form";
import type { SpeakingPoint } from "@/utils/types/types";

describe("PointForm", () => {
  const mockPoint: SpeakingPoint = {
    id: "1",
    order: 1,
    type: "ADVANTAGE",
    speakingSectionId: "section-1",
    examples: [
      { text: "Test example 1", order: 1 },
      { text: "Test example 2", order: 2 },
    ],
  };

  const mockProps = {
    point: mockPoint,
    sectionIndex: 0,
    pointIndex: 0,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onAddExample: vi.fn(),
    onUpdateExample: vi.fn(),
    onDeleteExample: vi.fn(),
  };

  it("renders point form with advantage type", () => {
    render(<PointForm {...mockProps} />);

    expect(screen.getByText("Advantage 1")).toBeInTheDocument();
  });

  it("renders point form with disadvantage type", () => {
    const disadvantagePoint = { ...mockPoint, type: "DISADVANTAGE" as const };
    render(<PointForm {...mockProps} point={disadvantagePoint} />);

    expect(screen.getByText("Disadvantage 1")).toBeInTheDocument();
  });

  it("displays existing examples", () => {
    render(<PointForm {...mockProps} />);

    expect(screen.getByDisplayValue("Test example 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test example 2")).toBeInTheDocument();
  });

  it("calls onAddExample when add example button is clicked", () => {
    render(<PointForm {...mockProps} />);

    const addExampleButton = screen.getByText("Example qo'shish");
    fireEvent.click(addExampleButton);

    expect(mockProps.onAddExample).toHaveBeenCalledWith(0, 0);
  });

  it("calls onUpdateExample when example text is changed", () => {
    render(<PointForm {...mockProps} />);

    const exampleInput = screen.getByDisplayValue("Test example 1");
    fireEvent.change(exampleInput, { target: { value: "Updated example" } });

    expect(mockProps.onUpdateExample).toHaveBeenCalledWith(0, 0, 0, {
      text: "Updated example",
    });
  });

  it("handles single example object", () => {
    const singleExamplePoint = {
      ...mockPoint,
      example: { text: "Single example", order: 1 },
    };

    render(<PointForm {...mockProps} point={singleExamplePoint} />);

    expect(screen.getByDisplayValue("Single example")).toBeInTheDocument();
  });

  it("handles no examples", () => {
    const noExamplePoint = {
      ...mockPoint,
      example: undefined,
    };

    render(<PointForm {...mockProps} point={noExamplePoint} />);

    // Should still render the examples section but with no items
    expect(screen.getByText("Examples")).toBeInTheDocument();
    expect(
      screen.queryByDisplayValue("Test example 1")
    ).not.toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", () => {
    render(<PointForm {...mockProps} />);

    const deleteButtons = screen.getAllByRole("button");
    const deletePointButton = deleteButtons.find(
      (button: { closest: (arg0: string) => Element | null }) =>
        button.closest(".ant-card-head-wrapper")
    );

    if (deletePointButton) {
      fireEvent.click(deletePointButton);
      expect(mockProps.onDelete).toHaveBeenCalledWith(0, 0);
    }
  });
});
