import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  resolve(process.cwd(), "src/pages/ai-costs/ai-costs.tsx"),
  "utf8"
);
const querySource = readFileSync(
  resolve(process.cwd(), "src/config/queries/ai-costs.ts"),
  "utf8"
);

describe("AI cost operations boundary", () => {
  it("shows provider calls, model usage and recent evaluations", () => {
    expect(pageSource).toContain("Sağlayıcı çağrıları");
    expect(pageSource).toContain("Model kırılımı");
    expect(pageSource).toContain("Son AI değerlendirmeleri");
    expect(pageSource).toContain("Ortalama süre");
    expect(pageSource).toContain("Tekrar deneme");
    expect(pageSource).toContain("Fiyatı bilinmeyen");
    expect(pageSource).toContain("Doğrulanmış");
    expect(pageSource).toContain("Tam maliyet alınamadı");
    expect(pageSource).toContain("Operasyonel kullanım özeti");
    expect(pageSource).toContain("Yazma ve konuşma değerlendirme maliyetleri");
    expect(pageSource).toContain("Soru okuma sesi bu maliyete dahil değildir");
  });

  it("models safe operational fields without exposing raw provider messages", () => {
    expect(querySource).toContain("providerCallCount");
    expect(querySource).toContain("averageLatencyMs");
    expect(querySource).toContain("unpricedRequestCount");
    expect(querySource).toContain("byModel");
    expect(querySource).toContain("recentRequests");
    expect(querySource).toContain("recentTests");
    expect(querySource).not.toContain("errorMessage");
  });
});
