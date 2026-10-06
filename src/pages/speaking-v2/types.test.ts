import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  getSpeakingV2Completion,
  type SpeakingV2AdminView,
  type SpeakingTaskCode,
  toSpeakingV2UpdateInput,
} from "./types";

const question = (text: string, responseSeconds: number) => ({
  id: randomUUID(),
  text,
  preparationSeconds: 0,
  responseSeconds,
});

const completeSpeakingV2Fixture = {
  id: randomUUID(),
  title: "Konuşma Denemesi",
  ieltsId: randomUUID(),
  formatVersion: 2,
  status: "DRAFT",
  publishedAt: null,
  updatedAt: "2026-08-17T12:00:00.000Z",
  submissionCount: 0,
  activeAttemptCount: 0,
  tasks: {
    TASK_1_1: {
      questions: [
        question("Kendinizi tanıtın.", 30),
        question("Nerede yaşıyorsunuz?", 30),
        question("Boş zamanlarınızda ne yaparsınız?", 30),
      ],
    },
    TASK_1_2: {
      images: ["pmr.v1.image-a", "pmr.v1.image-b"],
      visualContext: {
        verified: true,
        descriptions: [
          { imageUrl: "pmr.v1.image-a", description: "Birinci görsel" },
          { imageUrl: "pmr.v1.image-b", description: "İkinci görsel" },
        ],
      },
      questions: [
        question("İki görseli karşılaştırın.", 30),
        question("Hangisini seçersiniz?", 30),
        question("Neden?", 30),
      ],
    },
    TASK_2: {
      images: ["pmr.v1.image-c"],
      visualContext: {
        verified: true,
        descriptions: [
          { imageUrl: "pmr.v1.image-c", description: "Konuşma görseli" },
        ],
      },
      questions: [
        question("Görseli anlatın.", 120),
        question("Bu durum neden önemlidir?", 120),
        question("Bir örnek verin.", 120),
      ],
    },
    TASK_3: {
      statement: "Teknoloji insanları yakınlaştırır.",
      advantages: ["İletişim", "Erişim", "Hız"],
      disadvantages: ["Bağımlılık", "Gizlilik", "Yalnızlık"],
    },
  },
  audioItems: [],
  readiness: { ready: true, issues: [] },
} as SpeakingV2AdminView;

describe("speaking v2 editor contract", () => {
  it("keeps 1.2 at three 30-second questions", () => {
    expect(completeSpeakingV2Fixture.tasks.TASK_1_2.questions).toHaveLength(3);
    expect(
      completeSpeakingV2Fixture.tasks.TASK_1_2.questions.map(
        (item) => item.responseSeconds,
      ),
    ).toEqual([30, 30, 30]);
  });

  it("does not send server-owned question fields in the update payload", () => {
    const payload = toSpeakingV2UpdateInput(completeSpeakingV2Fixture);

    expect(JSON.stringify(payload)).not.toMatch(
      /questionId|order|responseSeconds|preparationSeconds|taskCode/,
    );
    expect(payload.tasks.TASK_1_1.questions).toEqual([
      "Kendinizi tanıtın.",
      "Nerede yaşıyorsunuz?",
      "Boş zamanlarınızda ne yaparsınız?",
    ]);
  });

  it("reports completion per fixed task", () => {
    expect(getSpeakingV2Completion(completeSpeakingV2Fixture)).toEqual({
      TASK_1_1: true,
      TASK_1_2: true,
      TASK_2: true,
      TASK_3: true,
    });
  });

  it("requires verified descriptions for every visual prompt image", () => {
    const incomplete = {
      ...completeSpeakingV2Fixture,
      tasks: {
        ...completeSpeakingV2Fixture.tasks,
        TASK_1_2: {
          ...completeSpeakingV2Fixture.tasks.TASK_1_2,
          visualContext: {
            verified: false,
            descriptions: [
              {
                imageUrl: "pmr.v1.image-a",
                description: "Birinci görsel",
              },
            ],
          },
        },
      },
    } as SpeakingV2AdminView;

    expect(getSpeakingV2Completion(incomplete).TASK_1_2).toBe(false);
  });

  const structuralMismatchCases: Array<{
    name: string;
    update: (view: SpeakingV2AdminView) => SpeakingV2AdminView;
    taskCode: SpeakingTaskCode;
  }> = [
    {
      name: "duplicate images",
      update: (view: SpeakingV2AdminView) => ({
        ...view,
        tasks: {
          ...view.tasks,
          TASK_1_2: {
            ...view.tasks.TASK_1_2,
            images: ["pmr.v1.image-a", "pmr.v1.image-a"],
          },
        },
      }),
      taskCode: "TASK_1_2",
    },
    {
      name: "too few 1.2 images",
      update: (view: SpeakingV2AdminView) => ({
        ...view,
        tasks: {
          ...view.tasks,
          TASK_1_2: {
            ...view.tasks.TASK_1_2,
            images: ["pmr.v1.image-a"] as never,
            visualContext: {
              verified: true,
              descriptions: [
                { imageUrl: "pmr.v1.image-a", description: "Birinci görsel" },
              ],
            },
          },
        },
      }),
      taskCode: "TASK_1_2",
    },
    {
      name: "too many 1.2 images",
      update: (view: SpeakingV2AdminView) => ({
        ...view,
        tasks: {
          ...view.tasks,
          TASK_1_2: {
            ...view.tasks.TASK_1_2,
            images: [
              "pmr.v1.image-a",
              "pmr.v1.image-b",
              "pmr.v1.image-extra",
            ] as never,
            visualContext: {
              verified: true,
              descriptions: [
                { imageUrl: "pmr.v1.image-a", description: "Birinci görsel" },
                { imageUrl: "pmr.v1.image-b", description: "İkinci görsel" },
                { imageUrl: "pmr.v1.image-extra", description: "Fazla görsel" },
              ],
            },
          },
        },
      }),
      taskCode: "TASK_1_2",
    },
    {
      name: "normalized duplicate questions",
      update: (view: SpeakingV2AdminView) => ({
        ...view,
        tasks: {
          ...view.tasks,
          TASK_1_1: {
            questions: [
              question("Aynı soru", 30),
              question("  Aynı   soru  ", 30),
              question("Farklı soru", 30),
            ],
          },
        },
      }),
      taskCode: "TASK_1_1",
    },
    {
      name: "incorrect fixed question count",
      update: (view: SpeakingV2AdminView) => ({
        ...view,
        tasks: {
          ...view.tasks,
          TASK_2: {
            ...view.tasks.TASK_2,
            questions: [question("Görseli anlatın.", 120)] as never,
          },
        },
      }),
      taskCode: "TASK_2",
    },
    {
      name: "too few task 2 images",
      update: (view: SpeakingV2AdminView) => ({
        ...view,
        tasks: {
          ...view.tasks,
          TASK_2: {
            ...view.tasks.TASK_2,
            images: [] as never,
            visualContext: { verified: true, descriptions: [] },
          },
        },
      }),
      taskCode: "TASK_2",
    },
    {
      name: "too many task 2 images",
      update: (view: SpeakingV2AdminView) => ({
        ...view,
        tasks: {
          ...view.tasks,
          TASK_2: {
            ...view.tasks.TASK_2,
            images: ["pmr.v1.image-c", "pmr.v1.image-extra"] as never,
            visualContext: {
              verified: true,
              descriptions: [
                { imageUrl: "pmr.v1.image-c", description: "Konuşma görseli" },
                { imageUrl: "pmr.v1.image-extra", description: "Fazla görsel" },
              ],
            },
          },
        },
      }),
      taskCode: "TASK_2",
    },
    {
      name: "extra visual descriptions",
      update: (view: SpeakingV2AdminView) => ({
        ...view,
        tasks: {
          ...view.tasks,
          TASK_2: {
            ...view.tasks.TASK_2,
            visualContext: {
              verified: true,
              descriptions: [
                {
                  imageUrl: "pmr.v1.image-c",
                  description: "Konuşma görseli",
                },
                { imageUrl: "pmr.v1.extra", description: "Fazla görsel" },
              ],
            },
          },
        },
      }),
      taskCode: "TASK_2",
    },
    {
      name: "duplicate visual descriptions",
      update: (view: SpeakingV2AdminView) => ({
        ...view,
        tasks: {
          ...view.tasks,
          TASK_1_2: {
            ...view.tasks.TASK_1_2,
            visualContext: {
              verified: true,
              descriptions: [
                {
                  imageUrl: "pmr.v1.image-a",
                  description: "Birinci görsel",
                },
                {
                  imageUrl: "pmr.v1.image-a",
                  description: "Tekrarlanan görsel",
                },
              ],
            },
          },
        },
      }),
      taskCode: "TASK_1_2",
    },
  ];

  it.each(structuralMismatchCases)("rejects $name when no server structural issue is available", ({ update, taskCode }) => {
    const view = update({
      ...completeSpeakingV2Fixture,
      readiness: { ready: false, issues: [] },
    });

    expect(getSpeakingV2Completion(view)[taskCode]).toBe(false);
  });

  it("uses non-audio server readiness issues as the authoritative task state", () => {
    const view = {
      ...completeSpeakingV2Fixture,
      readiness: {
        ready: false,
        issues: [
          {
            taskCode: "TASK_1_2",
            field: "questions",
            message: "Aynı soru bir görevde tekrar edemez.",
          },
          {
            taskCode: "TASK_3",
            field: "audio.TASK_3_PROMPT",
            message: "Ses hazırlanmalı.",
          },
        ],
      },
    } as SpeakingV2AdminView;

    expect(getSpeakingV2Completion(view)).toEqual({
      TASK_1_1: true,
      TASK_1_2: false,
      TASK_2: true,
      TASK_3: true,
    });
  });
});
