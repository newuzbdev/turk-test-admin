import { useState } from "react";
import type { ExamInput, OfficialExam } from "./official-exams-api";
const dates = [
  ["examStart", "Sınav başlangıcı"],
  ["examEnd", "Sınav bitişi"],
  ["registrationStart", "Başvuru başlangıcı"],
  ["registrationEnd", "Son başvuru"],
  ["paymentEnd", "Son ödeme"],
] as const;
export function ExamForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: OfficialExam;
  onSave: (data: ExamInput) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [data, setData] = useState<ExamInput>(() =>
    initial
      ? {
          examStart: initial.examStart,
          examEnd: initial.examEnd,
          registrationStart: initial.registrationStart,
          registrationEnd: initial.registrationEnd,
          paymentEnd: initial.paymentEnd,
          sourceUrl: initial.sourceUrl,
          published: initial.published,
          version: initial.version,
        }
      : {
          examStart: "",
          examEnd: "",
          registrationStart: "",
          registrationEnd: "",
          paymentEnd: "",
          sourceUrl: "",
          published: false,
        },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      await onSave(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="official-exam-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (initial?.published && !data.published && !confirm) {
          setConfirm(true);
          return;
        }
        void submit();
      }}
    >
      <p className="official-exam-note">
        Millî CEFR · Türkçe. Tarihleri resmî duyurudan kontrol ederek girin.
      </p>
      <fieldset disabled={busy}>
        <div className="official-exam-fields">
          {dates.map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                required
                type="date"
                value={data[key]}
                onChange={(e) => {
                  setError("");
                  setData({ ...data, [key]: e.target.value });
                }}
              />
            </label>
          ))}
        </div>
        <label>
          Resmî kaynak bağlantısı
          <input
            required
            type="url"
            placeholder="https://gov.uz/…"
            value={data.sourceUrl}
            onChange={(e) => setData({ ...data, sourceUrl: e.target.value })}
          />
        </label>
        <label className="official-exam-publish">
          <input
            type="checkbox"
            checked={data.published}
            onChange={(e) => {
              setConfirm(false);
              setData({ ...data, published: e.target.checked });
            }}
          />
          Öğrencilere yayımla
        </label>
        {confirm && (
          <p role="status">
            Bu dönem yeni seçimlerden kaldırılacak. Mevcut öğrenci hedefleri
            korunacak. Onaylamak için tekrar kaydedin.
          </p>
        )}
        {error && (
          <p role="alert" className="official-exam-error">
            {error}
          </p>
        )}
      </fieldset>
      <div className="official-exam-actions">
        <button type="button" disabled={busy} onClick={onCancel}>
          Vazgeç
        </button>
        <button type="submit" disabled={busy}>
          {busy
            ? "Kaydediliyor…"
            : confirm
              ? "Yayından kaldır ve kaydet"
              : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
