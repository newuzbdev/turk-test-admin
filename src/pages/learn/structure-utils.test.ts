import { describe, expect, it } from "vitest";
import {
  buildStructureReorder,
  getAllowedStructureStatuses,
} from "./structure-utils";

describe("Learn module and lesson frontend helpers", () => {
  it("prevents an archived item from publishing directly", () => {
    expect(getAllowedStructureStatuses("ARCHIVED")).toEqual(["DRAFT"]);
  });

  it("builds the complete sibling payload when moving an item", () => {
    expect(
      buildStructureReorder(
        [{ id: "module-1" }, { id: "module-2" }, { id: "module-3" }],
        "module-2",
        "down"
      )
    ).toEqual([
      { id: "module-1", sortOrder: 0 },
      { id: "module-3", sortOrder: 1 },
      { id: "module-2", sortOrder: 2 },
    ]);
  });

  it("does not create an incomplete payload at list boundaries", () => {
    expect(
      buildStructureReorder(
        [{ id: "lesson-1" }, { id: "lesson-2" }],
        "lesson-1",
        "up"
      )
    ).toBeNull();
  });
});
