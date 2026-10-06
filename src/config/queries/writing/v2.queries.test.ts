import { describe, expect, it } from "vitest";

import {
  getWritingV2ErrorCode,
  isWritingPublishedTestInUseError,
} from "./v2.queries";

const message =
  "Öğrenci cevabı bulunan yayımlanmış test değiştirilemez. Testi arşivleyip yeni bir test oluşturun.";

describe("getWritingV2ErrorCode", () => {
  it("recognizes a flattened immutable-published-test response without student submissions", () => {
    expect(getWritingV2ErrorCode({
      response: {
        status: 409,
        data: { error: "Yayımlanmış test değiştirilemez. Değişiklikler için yeni sürüm oluşturun." },
      },
    })).toBe("WRITING_PUBLISHED_TEST_IN_USE");
  });

  it("recognizes the legacy flattened conflict response", () => {
    expect(
      getWritingV2ErrorCode({
        response: {
          status: 409,
          data: {
            success: false,
            data: null,
            error: message,
          },
        },
      }),
    ).toBe("WRITING_PUBLISHED_TEST_IN_USE");
  });

  it("reads a structured error code from nested API responses", () => {
    expect(
      getWritingV2ErrorCode({
        response: {
          status: 409,
          data: {
            success: false,
            error: {
              code: "WRITING_PUBLISHED_TEST_IN_USE",
              message,
            },
          },
        },
      }),
    ).toBe("WRITING_PUBLISHED_TEST_IN_USE");
  });

  it("does not reinterpret an unrelated conflict", () => {
    expect(
      getWritingV2ErrorCode({
        response: {
          status: 409,
          data: {
            success: false,
            error: "Başka bir çakışma oluştu.",
          },
        },
      }),
    ).toBeNull();
  });

  it("recognizes a normalized domain error without Axios metadata", () => {
    expect(
      isWritingPublishedTestInUseError({
        code: "WRITING_PUBLISHED_TEST_IN_USE",
        message,
      }),
    ).toBe(true);
  });
});
