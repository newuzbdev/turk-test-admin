import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { ExamListHeader } from "./exam-list-ui";
function View() {
  const location = useLocation();
  return (
    <>
      <ExamListHeader title="Testler" action={<button>Yeni test</button>} />
      <output aria-label="Adres">{location.search}</output>
    </>
  );
}
afterEach(cleanup);
it("defaults to published, resets pagination on category change and keeps the search", () => {
  render(
    <MemoryRouter initialEntries={["/test?page=4&limit=20&search=deneme"]}>
      <View />
    </MemoryRouter>,
  );
  expect(screen.getByRole("radio", { name: "Yayında" })).toBeChecked();
  fireEvent.click(screen.getByRole("radio", { name: "Taslaklar" }));
  const params = new URLSearchParams(
    screen.getByLabelText("Adres").textContent || "",
  );
  expect(params.get("view")).toBe("DRAFT");
  expect(params.get("page")).toBe("1");
  expect(params.get("limit")).toBe("20");
  expect(params.get("search")).toBe("deneme");
  fireEvent.click(screen.getByRole("radio", { name: "Arşiv" }));
  expect(screen.getByRole("radio", { name: "Arşiv" })).toBeChecked();
});
it("restores a linked view and treats an invalid view as published", () => {
  const view = render(
    <MemoryRouter initialEntries={["/reading?view=ARCHIVED"]}>
      <View />
    </MemoryRouter>,
  );
  expect(screen.getByRole("radio", { name: "Arşiv" })).toBeChecked();
  view.unmount();
  render(
    <MemoryRouter initialEntries={["/reading?view=invalid"]}>
      <View />
    </MemoryRouter>,
  );
  expect(screen.getByRole("radio", { name: "Yayında" })).toBeChecked();
});
