import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const backendRequire = createRequire(resolve('../backend/package.json'));
backendRequire('ts-node').register({ transpileOnly: true, skipProject: true, compilerOptions: { module: 'CommonJS', moduleResolution: 'Node', experimentalDecorators: true } });
const { ConflictException } = backendRequire('@nestjs/common');
const { AccessShareExceptionFilter } = backendRequire('./src/modules/access/access-share-exception.filter.ts');
function shareError(code?: string) {
  let status = 0, data: unknown;
  const response = { status(value: number) { status = value; return this; }, json(value: unknown) { data = value; } };
  const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    new AccessShareExceptionFilter().catch(code ? new ConflictException(code) : new Error("secret-canary encryptedKey=never-render"), { switchToHttp: () => ({ getResponse: () => response }) });
  } finally { quiet.mockRestore(); }
  return { response: { status, data } };
}
import { RequestIntent, relevantLimitFields } from "./access-form-state";
import { copyExistingShare, normalContentLink } from "./content-access-utils";
import AccessGrantDialog from "./AccessGrantDialog";
import AccessRecordActions from "./AccessRecordActions";
import ContentAccessControls, {
  ManagedLegacyAccess,
} from "./ContentAccessControls";
const mocks = vi.hoisted(() => ({
  write: vi.fn(),
  refresh: vi.fn(),
  config: { enabled: true },
  policies: [] as object[],
  targets: [] as object[],
}));
vi.mock("@/config/queries/access", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  accessWrite: mocks.write,
  useRefreshAccess: () => mocks.refresh,
  useAccessConfig: () => ({ data: mocks.config }),
  useTargetAccess: () => ({ data: mocks.policies, isSuccess: true }),
}));
vi.mock("@/config/queries/students", () => ({
  usePublishedAccessTargets: () => ({
    data: { items: mocks.targets, total: mocks.targets.length },
    isFetching: false,
  }),
}));
beforeEach(() => {
  localStorage.setItem("accessToken", `synthetic.${btoa(JSON.stringify({ id: "admin-a", role: "ADMIN" }))}.signature`);
  const original = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation(element => original(element));
  mocks.write.mockReset();
  mocks.refresh.mockReset();
  mocks.config.enabled = true;
  mocks.policies = [];
  mocks.targets = [];
});
afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
describe("access mutation lifecycle", () => {
  it("preserves request identity on unchanged retry and changes it for a changed payload", () => {
    const intent = new RequestIntent();
    const first = intent.forPayload({ endsAt: "a" });
    expect(intent.forPayload({ endsAt: "a" })).toBe(first);
    expect(intent.forPayload({ endsAt: "b" })).not.toBe(first);
  });
  it("single test grant hides unrelated quota fields and defaults AI cap to one", () => {
    render(
      <AccessGrantDialog
        userId="student"
        target={{ scope: "MOCK_WRITING", targetId: "writing" }}
        onClose={() => {}}
      />,
    );
    expect(
      screen.getByRole("spinbutton", { name: "Yazma Mock hakkı" }),
    ).toHaveValue("1");
    expect(
      screen.queryByRole("spinbutton", { name: "Konuşma Mock hakkı" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("spinbutton", { name: "AI pratik hakkı" }),
    ).not.toBeInTheDocument();
    expect(relevantLimitFields("MOCK_PACKAGE", ["MOCK_SPEAKING"])).toEqual([
      "speakingMockLimit",
    ]);
  });
  it("duplicate save submits once and unchanged transient retry retains requestId", async () => {
    let reject: (reason: Error) => void = () => {};
    mocks.write
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, r) => {
            reject = r;
          }),
      )
      .mockResolvedValueOnce({ id: "grant" });
    const close = vi.fn();
    render(<AccessGrantDialog userId="student" onClose={close} />);
    fireEvent.click(screen.getByRole("button", { name: /Kaydet/ }));
    fireEvent.click(screen.getByRole("button", { name: /Kaydet/ }));
    await waitFor(() => expect(mocks.write).toHaveBeenCalledTimes(1));
    const first = mocks.write.mock.calls[0][1];
    expect(first).toMatchObject({
      scope: "PLATFORM",
      writingMockLimit: 10,
      speakingMockLimit: 10,
      practiceAiLimit: 120,
    });
    expect(first.targetId).toBeUndefined();
    reject(new Error("Geçici hata"));
    await screen.findByText("Geçici hata");
    expect(close).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Kaydet/ }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(mocks.write.mock.calls[1][1].requestId).toBe(first.requestId);
  });
  it("revision conflict requires reload without overwrite", async () => {
    mocks.write.mockRejectedValue(shareError("ACCESS_REVISION_CONFLICT"));
    const close = vi.fn();
    const record = {
      id: "g",
      scope: "MOCK_WRITING" as const,
      targetId: "w",
      revision: 3,
      startsAt: "2027-01-01T00:00:00Z",
      endsAt: "2099-01-01T00:00:00Z",
      revokedAt: null,
      writingMockLimit: 2,
      speakingMockLimit: 0,
      practiceAiLimit: 0,
    };
    const view = render(<AccessGrantDialog record={record} onClose={close} />);
    fireEvent.click(screen.getByRole("button", { name: /Kaydet/ }));
    await screen.findByText("İstek işlenemedi.");
    expect(screen.getByRole("button", { name: /Kaydet/ })).toBeDisabled();
    expect(mocks.write.mock.calls[0][1].expectedRevision).toBe(3);
    fireEvent.click(screen.getByRole("button", { name: "Yeniden yükle" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(close).not.toHaveBeenCalled();
    view.rerender(<AccessGrantDialog record={{ ...record, revision: 4 }} onClose={close} />);
    await waitFor(() => expect(close).toHaveBeenCalled());
    expect(mocks.write).toHaveBeenCalledTimes(1);
  });
  it("campaign revoke conflicts keep reload inside its confirmation dialog", async () => {
    mocks.write.mockRejectedValue(shareError("ACCESS_REVISION_CONFLICT"));
    const record = {
      id: "campaign",
      scope: "PRACTICE_WRITING" as const,
      targetId: "w",
      revision: 4,
      startsAt: "2027-01-01T00:00:00Z",
      endsAt: "2099-01-01T00:00:00Z",
      revokedAt: null,
      writingMockLimit: 0,
      speakingMockLimit: 0,
      practiceAiLimit: 1,
    };
    render(<AccessRecordActions kind="share" record={record} />);
    fireEvent.click(screen.getByRole("button", { name: "İptal et" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "İptal et" }));
    await within(dialog).findByText("İstek işlenemedi.");
    expect(
      within(dialog).getByRole("button", { name: "Yeniden yükle" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "İptal et" }),
    ).toBeDisabled();
    expect(mocks.write.mock.calls[0][1].expectedRevision).toBe(4);
  });
  it("copy invokes only copy and leaves expiry unchanged", async () => {
    const calls: string[] = [];
    const row = { id: "campaign", endsAt: "2027-01-01T00:00:00Z" };
    await copyExistingShare(
      row.id,
      async (id) => {
        calls.push(id);
        return { url: "https://example.test/link" };
      },
      async () => {},
    );
    expect(calls).toEqual(["campaign"]);
    expect(row.endsAt).toBe("2027-01-01T00:00:00Z");
  });
  it("producer-shaped nested Speaking package keeps ordinary copy and campaign controls operational",async()=>{
    const clipboard=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,"clipboard",{value:{writeText:clipboard},configurable:true});
    const row={id:"speaking-second",status:"PUBLISHED",formatVersion:2,ielts:{id:"package",title:"Paket"}};
    render(<ContentAccessControls target={{scope:"MOCK_SPEAKING",targetId:row.id}} row={row}/>);
    const copy=screen.getByRole("button",{name:"Linki kopyala"});expect(copy).toBeEnabled();fireEvent.click(copy);
    await waitFor(()=>expect(clipboard).toHaveBeenCalledTimes(1));const url=new URL(clipboard.mock.calls[0][0]);expect(url.searchParams.get("package")).toBe("package");expect(url.searchParams.get("test")).toBe(row.id);expect(url.searchParams.has("share")).toBe(false);
    fireEvent.click(screen.getByRole("button",{name:"Süreli ücretsiz bağlantı"}));expect(await screen.findByRole("button",{name:"Yeni bağlantı"})).toBeEnabled();expect(mocks.write).not.toHaveBeenCalled();
  });
  it("package edit sends only currently relevant cap and omits historical retired cap",async()=>{
    mocks.targets=[{id:"package",scope:"MOCK_PACKAGE",title:"Paket",buckets:["MOCK_SPEAKING"]}];mocks.write.mockResolvedValue({id:"g"});
    const record={id:"g",scope:"MOCK_PACKAGE" as const,targetId:"package",revision:2,startsAt:"2027-01-01T00:00:00Z",endsAt:"2099-01-01T00:00:00Z",revokedAt:null,writingMockLimit:3,speakingMockLimit:4,practiceAiLimit:0};
    render(<AccessGrantDialog record={record} onClose={()=>{}}/>);expect(screen.queryByRole("spinbutton",{name:"Yazma Mock hakkı"})).not.toBeInTheDocument();fireEvent.click(screen.getByRole("button",{name:"Kaydet"}));
    await waitFor(()=>expect(mocks.write).toHaveBeenCalledTimes(1));expect(mocks.write.mock.calls[0][1].speakingMockLimit).toBe(4);expect(mocks.write.mock.calls[0][1]).not.toHaveProperty("writingMockLimit");
  });
  it("paid published normal links have no share token; unpublished links disabled", () => {
    expect(
      new URL(
        normalContentLink({ scope: "PRACTICE_WRITING", targetId: "w" }),
      ).searchParams.has("share"),
    ).toBe(false);
    render(
      <ContentAccessControls
        target={{ scope: "PRACTICE_WRITING", targetId: "w" }}
        row={{ isPublished: false }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Linki kopyala" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Süreli herkese açık erişim" }),
    ).toBeDisabled();
  });
  it("durable revoked policy suppresses legacy toggle; disabled rollout retains existing toggle", () => {
    mocks.policies = [{ revokedAt: "2026-01-01" }];
    const { rerender } = render(
      <ManagedLegacyAccess
        target={{ scope: "PRACTICE_READING", targetId: "r" }}
      >
        <button>Eski ücretsiz anahtar</button>
      </ManagedLegacyAccess>,
    );
    expect(screen.queryByText("Eski ücretsiz anahtar")).not.toBeInTheDocument();
    mocks.config.enabled = false;
    rerender(
      <ManagedLegacyAccess
        target={{ scope: "PRACTICE_READING", targetId: "r" }}
      >
        <button>Eski ücretsiz anahtar</button>
      </ManagedLegacyAccess>,
    );
    expect(
      screen.getByRole("button", { name: "Eski ücretsiz anahtar" }),
    ).toBeInTheDocument();
  });
});

for (const code of ["ACCESS_REVISION_CONFLICT", "ACCESS_REQUEST_ID_CONFLICT"]) {
  it(`real safe envelope ${code}: share edit blocks stale retry and reload uses refreshed revision`, async () => {
    const record = { id: "share", scope: "PRACTICE_WRITING" as const, targetId: "w", revision: 3, startsAt: "2027-01-01T00:00:00Z", endsAt: "2099-01-01T00:00:00Z", revokedAt: null, writingMockLimit: 0, speakingMockLimit: 0, practiceAiLimit: 1 };
    const close = vi.fn();
    mocks.write.mockRejectedValueOnce(shareError(code)).mockResolvedValue({ id: "share" });
    const view = render(<AccessGrantDialog kind="share" record={record} onClose={close} />);
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
    await screen.findByText("İstek işlenemedi.");
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(mocks.write).toHaveBeenCalledTimes(1);
    const old = mocks.write.mock.calls[0][1];
    fireEvent.click(screen.getByRole("button", { name: "Yeniden yükle" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    if (code === 'ACCESS_REVISION_CONFLICT') {
      expect(close).not.toHaveBeenCalled();
      view.rerender(<AccessGrantDialog kind="share" record={{ ...record, revision: 4 }} onClose={close} />);
    }
    await waitFor(() => expect(close).toHaveBeenCalled());
    view.unmount();
    render(<AccessGrantDialog kind="share" record={{ ...record, revision: 4 }} onClose={close} />);
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(mocks.write).toHaveBeenCalledTimes(2));
    expect(mocks.write.mock.calls[1][1].expectedRevision).toBe(4);
    expect(mocks.write.mock.calls[1][1].requestId).not.toBe(old.requestId);
    expect(document.body.textContent).not.toMatch(/secret-canary|encryptedKey/);
  });
  for (const action of ["İptal et", "URL yenile"]) it(`real safe envelope ${code}: ${action} reload blocks unchanged revision`, async () => {
    const record = { id: "share", scope: "PRACTICE_WRITING" as const, targetId: "w", revision: 3, startsAt: "2027-01-01T00:00:00Z", endsAt: "2099-01-01T00:00:00Z", revokedAt: null, writingMockLimit: 0, speakingMockLimit: 0, practiceAiLimit: 1 };
    mocks.write.mockRejectedValueOnce(shareError(code)).mockResolvedValue({ id: "share" });
    const view = render(<AccessRecordActions kind="share" record={record} />);
    fireEvent.click(screen.getByRole("button", { name: action }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: action }));
    await screen.findByText("İstek işlenemedi.");
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: action })).toBeDisabled();
    const old = mocks.write.mock.calls[0][1];
    fireEvent.click(screen.getByRole("button", { name: "Yeniden yükle" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    // An invalidate can resolve with stale cached data after an outage: do not unlock it.
    expect(mocks.write).toHaveBeenCalledTimes(1);
    view.rerender(<AccessRecordActions kind="share" record={{ ...record, revision: 4 }} />);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: action }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: action }));
    await waitFor(() => expect(mocks.write).toHaveBeenCalledTimes(2));
    expect(mocks.write.mock.calls[1][1].expectedRevision).toBe(4);
    expect(mocks.write.mock.calls[1][1].requestId).not.toBe(old.requestId);
  });
}
it("real generic safe outage keeps unchanged retry identity and renders no exception payload", async () => {
  mocks.write.mockRejectedValueOnce(shareError()).mockResolvedValue({ id: "share" });
  render(<AccessGrantDialog kind="share" target={{ scope: "PRACTICE_WRITING", targetId: "w" }} onClose={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
  await screen.findByText("İstek şu anda işlenemedi.");
  expect(screen.queryByText("Yeniden yükle")).not.toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/secret-canary|encryptedKey/);
  const requestId = mocks.write.mock.calls[0][1].requestId;
  fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
  await waitFor(() => expect(mocks.write).toHaveBeenCalledTimes(2));
  expect(mocks.write.mock.calls[1][1].requestId).toBe(requestId);
});
for (const scope of ["MOCK_READING", "MOCK_LISTENING"] as const) it(`${scope} standalone controls truthfully refuse new access`, () => {
  const { rerender } = render(<ContentAccessControls target={{ scope, targetId: "lr" }} row={{ status: "PUBLISHED" }} />);
  expect(screen.getByRole("button", { name: "Süreli herkese açık erişim" })).toBeDisabled();
  expect(screen.getByText(/Yayındaki bir deneme paketine bağlı/)).toBeInTheDocument();
  rerender(<ContentAccessControls target={{ scope, targetId: "lr" }} row={{ status: "PUBLISHED", ieltsId: "package" }} />);
  expect(screen.getByRole("button", { name: "Süreli herkese açık erişim" })).toBeEnabled();
});

it("request identity recovery can use the same freshly reloaded revision with a new intent", async () => {
  const record = { id: "share", scope: "PRACTICE_WRITING" as const, targetId: "w", revision: 3, startsAt: "2027-01-01T00:00:00Z", endsAt: "2099-01-01T00:00:00Z", revokedAt: null, writingMockLimit: 0, speakingMockLimit: 0, practiceAiLimit: 1 };
  mocks.write.mockRejectedValueOnce(shareError('ACCESS_REQUEST_ID_CONFLICT')).mockResolvedValue({ id: 'share' });
  render(<AccessRecordActions kind="share" record={record} />);
  fireEvent.click(screen.getByRole('button', { name: 'İptal et' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'İptal et' }));
  await screen.findByText('İstek işlenemedi.');
  const first = mocks.write.mock.calls[0][1];
  mocks.refresh.mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Yeniden yükle' }));
  await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
  expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'İptal et' })).toBeDisabled();
  mocks.refresh.mockResolvedValue(undefined);
  fireEvent.click(screen.getByRole('button', { name: 'Yeniden yükle' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'İptal et' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'İptal et' }));
  await waitFor(() => expect(mocks.write).toHaveBeenCalledTimes(2));
  expect(mocks.write.mock.calls[1][1].expectedRevision).toBe(first.expectedRevision);
  expect(mocks.write.mock.calls[1][1].requestId).not.toBe(first.requestId);
});
it('only exact recognized safe codes can enter conflict recovery', async () => {
  const { accessErrorCode } = await import('@/config/queries/access');
  expect(accessErrorCode(shareError('ACCESS_REVISION_CONFLICT'))).toBe('ACCESS_REVISION_CONFLICT');
  expect(accessErrorCode({ response: { data: { code: 'ACCESS_REVISION_CONFLICT secret-canary' } } })).toBeUndefined();
  expect(accessErrorCode({ response: { data: { code: 'UNRECOGNIZED', error: 'ACCESS_REVISION_CONFLICT' } } })).toBeUndefined();
  expect(accessErrorCode(shareError())).toBeUndefined();
});
it('record-action generic safe outage keeps retry enabled and preserves request identity', async () => {
  const record = { id: 'share', scope: 'PRACTICE_WRITING' as const, targetId: 'w', revision: 3, startsAt: '2027-01-01T00:00:00Z', endsAt: '2099-01-01T00:00:00Z', revokedAt: null, writingMockLimit: 0, speakingMockLimit: 0, practiceAiLimit: 1 };
  mocks.write.mockRejectedValueOnce(shareError()).mockResolvedValue({ id: 'share' });
  render(<AccessRecordActions kind="share" record={record} />);
  fireEvent.click(screen.getByRole('button', { name: 'URL yenile' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'URL yenile' }));
  await screen.findByText('İstek şu anda işlenemedi.');
  expect(screen.queryByText('Yeniden yükle')).not.toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/secret-canary|encryptedKey/);
  const retry = within(screen.getByRole('dialog')).getByRole('button', { name: 'URL yenile' });
  expect(retry).toBeEnabled();
  const requestId = mocks.write.mock.calls[0][1].requestId;
  fireEvent.click(retry);
  await waitFor(() => expect(mocks.write).toHaveBeenCalledTimes(2));
  expect(mocks.write.mock.calls[1][1].requestId).toBe(requestId);
});
