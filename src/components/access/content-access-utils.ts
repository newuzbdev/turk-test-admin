import type { AccessTarget } from "@/config/queries/access";
export type ContentAccessRow = {
  id?: string;
  ieltsId?: string;
  ielts?: { id?: string; title?: string | null } | null;
  isDeleted?: boolean;
  status?: string;
  isPublished?: boolean;
  formatVersion?: number;
};
export function isCompatiblePublished(
  target: AccessTarget,
  row: ContentAccessRow,
) {
  return (
    !!target.targetId &&
    !row.isDeleted &&
    (!target.scope.startsWith("MOCK_") || target.scope === "MOCK_PACKAGE" || !!(row.ieltsId ?? row.ielts?.id)) &&
    (target.scope.startsWith("PRACTICE_")
      ? row.isPublished === true
      : row.status === "PUBLISHED") &&
    (!(target.scope === "MOCK_WRITING" || target.scope === "MOCK_SPEAKING") ||
      row.formatVersion === 2)
  );
}
export function normalContentLink(
  target: AccessTarget,
  packageId?: string,
): string {
  const origin =
    import.meta.env.VITE_STUDENT_APP_URL || "https://turkishmock.uz";
  const url = new URL(
    target.scope.startsWith("MOCK_") ? "/app/test" : "/app/pratik",
    origin,
  );
  if (target.scope.startsWith("MOCK_")) {
    if (!packageId && target.scope !== "MOCK_PACKAGE")
      throw new Error("Deneme paketi gerekli.");
    url.searchParams.set(
      "package",
      target.scope === "MOCK_PACKAGE" ? target.targetId! : packageId!,
    );
    if (target.scope !== "MOCK_PACKAGE") {
      url.searchParams.set("skills", target.scope.slice(5).toLowerCase());
      url.searchParams.set("test", target.targetId!);
    }
  } else {
    url.searchParams.set("bolum", target.scope.slice(9).toLowerCase());
    url.searchParams.set("start", target.targetId!);
  }
  return url.toString();
}
export async function copyExistingShare(
  id: string,
  copy: (id: string) => Promise<{ url: string }>,
  write: (url: string) => Promise<void>,
) {
  const result = await copy(id);
  await write(result.url);
}
