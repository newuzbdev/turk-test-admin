import type {
  MockPublicationIssue,
  MockPublicationIssueCode,
  MockPublicationReadiness,
} from "@/utils/types/types";

export const publicationIssueLabels: Record<MockPublicationIssueCode, string> = {
  TEST_QUESTIONS_REQUIRED: "En az bir soru ekleyin",
  CORRECT_ANSWER_REQUIRED: "Doğru cevabı seçin",
  PASSAGE_REQUIRED: "Okuma metnini girin",
  TRANSCRIPT_REQUIRED: "Bölüm transcriptini girin",
  EVIDENCE_REQUIRED: "Kanıt alıntısını girin",
  EXPLANATION_REQUIRED: "Doğru cevap açıklamasını girin",
  SOURCE_RANGE_INVALID: "Kanıtı kaynak metinden yeniden seçin",
  AUDIO_REQUIRED: "Dinleme sesini yükleyin",
  AUDIO_DURATION_REQUIRED: "Ses süresini girin",
  AUDIO_RANGE_INVALID: "Ses kanıtı aralığını düzeltin",
  OFFICIAL_READING_PART_STRUCTURE: "Resmî beş bölüm yapısını tamamlayın",
  OFFICIAL_READING_QUESTION_COUNT: "Bölümdeki zorunlu soru sayısını tamamlayın",
  OFFICIAL_READING_QUESTION_NUMBER: "Soru sırasını düzeltin",
  OFFICIAL_READING_QUESTION_TYPE: "Soru türünü resmî yapıya uygun hale getirin",
  OFFICIAL_READING_OPTION_STRUCTURE: "Cevap seçeneklerini eksiksiz doldurun",
  OFFICIAL_READING_SOURCE_STRUCTURE:
    "Metni, başlığı ve soru içeriğini eksiksiz doldurun",
  OFFICIAL_LISTENING_PART_STRUCTURE:
    "Resmî altı bölümlük dinleme yapısını tamamlayın",
  OFFICIAL_LISTENING_QUESTION_COUNT:
    "Bölümdeki zorunlu soru sayısını tamamlayın",
  OFFICIAL_LISTENING_QUESTION_NUMBER: "Soru sırasını düzeltin",
  OFFICIAL_LISTENING_QUESTION_TYPE:
    "Soru türünü resmî dinleme yapısına uygun hale getirin",
  OFFICIAL_LISTENING_OPTION_STRUCTURE:
    "Cevap seçeneklerini ve doğru cevabı kontrol edin",
  OFFICIAL_LISTENING_SOURCE_STRUCTURE:
    "Yönergeyi, transcripti ve gerekli görseli tamamlayın",
};

export const getReadyQuestionCount = (
  readiness?: MockPublicationReadiness,
): number => {
  if (!readiness || readiness.questionCount <= 0) return 0;
  if (readiness.issues.some((issue) => issue.questionNumber == null)) return 0;

  const blocked = new Set(
    readiness.issues
      .map((issue) => issue.questionNumber)
      .filter((number): number is number => number != null),
  );
  return Math.max(0, readiness.questionCount - blocked.size);
};

export const describePublicationIssue = (
  issue: MockPublicationIssue,
): string => {
  const label = publicationIssueLabels[issue.code] || issue.code;
  return issue.questionNumber == null
    ? label
    : `Soru ${issue.questionNumber}: ${label}`;
};
