import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Pencil,
  Plus,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import {
  useCreateLearnExercise,
  useCreateLearnQuestion,
  useDeleteLearnQuestion,
  useLearnExerciseQuestions,
  useLearnLessonExercises,
  useReorderLearnExercises,
  useReorderLearnQuestions,
  useUpdateLearnExercise,
  useUpdateLearnExerciseStatus,
  useUpdateLearnQuestion,
} from "@/config/queries/learn";
import type {
  LearnExercise,
  LearnExerciseFormValues,
  LearnExerciseQuestion,
  LearnLesson,
  LearnPublishStatus,
  LearnQuestionFormValues,
} from "./course-types";
import {
  LEARN_STATUS_ACTION_LABELS,
  LEARN_STATUS_LABELS,
} from "./course-utils";
import {
  buildLearnQuestionPayload,
  getLearnQuestionTypeLabel,
  LEARN_EXERCISE_TYPE_OPTIONS,
  LEARN_QUESTION_TYPE_OPTIONS,
  questionToFormValues,
} from "./exercise-utils";
import {
  buildStructureReorder,
  getAllowedStructureStatuses,
} from "./structure-utils";
import { LearnQuestionSkillTagEditor } from "./learn-skill-tag-picker";

const { Title, Text, Paragraph } = Typography;

const STATUS_COLORS: Record<LearnPublishStatus, string> = {
  DRAFT: "default",
  PUBLISHED: "green",
  ARCHIVED: "orange",
};

interface ExerciseFormModalProps {
  courseId: string;
  lessonId: string;
  exercise?: LearnExercise;
  open: boolean;
  onClose: () => void;
}

function ExerciseFormModal({
  courseId,
  lessonId,
  exercise,
  open,
  onClose,
}: ExerciseFormModalProps) {
  const [form] = Form.useForm<LearnExerciseFormValues>();
  const createExercise = useCreateLearnExercise();
  const updateExercise = useUpdateLearnExercise();
  const isPending = createExercise.isPending || updateExercise.isPending;

  useEffect(() => {
    if (!open) return;

    if (exercise) {
      form.setFieldsValue({
        title: exercise.title,
        instructions: exercise.instructions ?? undefined,
        type: exercise.type,
        isRequired: exercise.isRequired,
        passingScore: exercise.passingScore ?? undefined,
        maxAttempts: exercise.maxAttempts ?? undefined,
      });
      return;
    }

    form.resetFields();
    form.setFieldsValue({ type: "PRACTICE", isRequired: false });
  }, [exercise, form, open]);

  const submit = (values: LearnExerciseFormValues) => {
    const payload = {
      ...values,
      title: values.title.trim(),
      instructions: values.instructions?.trim() || undefined,
      isRequired: Boolean(values.isRequired),
    };
    const options = { onSuccess: onClose };

    if (exercise) {
      updateExercise.mutate(
        { id: exercise.id, lessonId, courseId, values: payload },
        options
      );
      return;
    }

    createExercise.mutate({ lessonId, courseId, values: payload }, options);
  };

  return (
    <Modal
      title={exercise ? "Alıştırmayı düzenle" : "Yeni alıştırma"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={exercise ? "Kaydet" : "Oluştur"}
      cancelText="Vazgeç"
      confirmLoading={isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="title"
          label="Alıştırma adı"
          rules={[
            { required: true, message: "Alıştırma adını girin" },
            { whitespace: true, message: "Alıştırma adı boş olamaz" },
          ]}
        >
          <Input placeholder="Örn. İsim cümleleri kontrolü" />
        </Form.Item>
        <Form.Item
          name="type"
          label="Alıştırma tipi"
          rules={[{ required: true, message: "Alıştırma tipi seçin" }]}
        >
          <Select options={[...LEARN_EXERCISE_TYPE_OPTIONS]} />
        </Form.Item>
        <Form.Item name="instructions" label="Yönerge">
          <Input.TextArea rows={4} />
        </Form.Item>
        <div className="learn-form-grid">
          <Form.Item name="passingScore" label="Geçme puanı">
            <InputNumber min={0} precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="maxAttempts" label="Maksimum deneme">
            <InputNumber min={1} precision={0} style={{ width: "100%" }} />
          </Form.Item>
        </div>
        <Form.Item name="isRequired" valuePropName="checked">
          <Checkbox>Zorunlu alıştırma</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}

interface QuestionFormModalProps {
  exerciseId: string;
  question?: LearnExerciseQuestion;
  open: boolean;
  onClose: () => void;
}

function QuestionFormModal({
  exerciseId,
  question,
  open,
  onClose,
}: QuestionFormModalProps) {
  const [form] = Form.useForm<LearnQuestionFormValues>();
  const type = Form.useWatch("type", form);
  const createQuestion = useCreateLearnQuestion();
  const updateQuestion = useUpdateLearnQuestion();
  const isPending = createQuestion.isPending || updateQuestion.isPending;

  useEffect(() => {
    if (!open) return;

    if (question) {
      form.setFieldsValue(questionToFormValues(question));
      return;
    }

    form.resetFields();
    form.setFieldsValue({
      type: "MULTIPLE_CHOICE",
      points: 1,
      correctOption: 1,
    });
  }, [form, open, question]);

  const submit = (values: LearnQuestionFormValues) => {
    const payload = buildLearnQuestionPayload(values);
    const options = { onSuccess: onClose };

    if (question) {
      updateQuestion.mutate(
        { id: question.id, exerciseId, values: payload },
        options
      );
      return;
    }

    createQuestion.mutate({ exerciseId, values: payload }, options);
  };

  return (
    <Modal
      title={question ? "Soruyu düzenle" : "Yeni soru"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={question ? "Kaydet" : "Oluştur"}
      cancelText="Vazgeç"
      confirmLoading={isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="type"
          label="Soru tipi"
          rules={[{ required: true, message: "Soru tipi seçin" }]}
          extra={
            question
              ? "Mevcut sorunun tipini değiştirmek yerine yeni soru oluşturun."
              : undefined
          }
        >
          <Select
            options={LEARN_QUESTION_TYPE_OPTIONS}
            disabled={Boolean(question)}
          />
        </Form.Item>
        <Form.Item
          name="prompt"
          label="Soru"
          rules={[
            { required: true, message: "Soru metnini girin" },
            { whitespace: true, message: "Soru metni boş olamaz" },
          ]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>

        {(type === "MULTIPLE_CHOICE" || type === "MULTI_SELECT") && (
          <Form.Item
            name="optionsText"
            label="Seçenekler"
            extra="Her satıra bir seçenek yazın."
            rules={[
              { required: true, message: "En az iki seçenek girin" },
              {
                validator: (_, value?: string) =>
                  (value ?? "").split("\n").filter((item) => item.trim())
                    .length >= 2
                    ? Promise.resolve()
                    : Promise.reject(new Error("En az iki seçenek girin")),
              },
            ]}
          >
            <Input.TextArea rows={5} placeholder={"Birinci seçenek\nİkinci seçenek"} />
          </Form.Item>
        )}

        {type === "MULTIPLE_CHOICE" && (
          <Form.Item
            name="correctOption"
            label="Doğru seçenek numarası"
            rules={[{ required: true, message: "Doğru seçeneği belirtin" }]}
          >
            <InputNumber min={1} precision={0} style={{ width: "100%" }} />
          </Form.Item>
        )}

        {type === "MULTI_SELECT" && (
          <Form.Item
            name="correctOptionsText"
            label="Doğru seçenek numaraları"
            extra="Virgülle ayırın. Örn. 1, 3"
            rules={[{ required: true, message: "Doğru seçenekleri belirtin" }]}
          >
            <Input placeholder="1, 3" />
          </Form.Item>
        )}

        {type === "TRUE_FALSE" && (
          <Form.Item
            name="trueFalseValue"
            label="Doğru cevap"
            rules={[{ required: true, message: "Doğru cevabı seçin" }]}
          >
            <Select
              options={[
                { value: "true", label: "Doğru" },
                { value: "false", label: "Yanlış" },
              ]}
            />
          </Form.Item>
        )}

        {(type === "TEXT_INPUT" || type === "FILL_BLANK") && (
          <Form.Item
            name="acceptedAnswersText"
            label="Kabul edilen cevaplar"
            extra="Her satıra bir doğru cevap yazın."
            rules={[{ required: true, message: "En az bir cevap girin" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        )}

        <Form.Item name="explanation" label="Açıklama">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="points" label="Puan">
          <InputNumber min={0.01} step={0.5} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

interface LearnExerciseEditorProps {
  courseId: string;
  lesson: LearnLesson;
  onClose: () => void;
}

export default function LearnExerciseEditor({
  courseId,
  lesson,
  onClose,
}: LearnExerciseEditorProps) {
  const { data: exercises = [], isLoading } = useLearnLessonExercises(
    lesson.id
  );
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null
  );
  const selectedExercise =
    exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;
  const { data: questions = [], isLoading: questionsLoading } =
    useLearnExerciseQuestions(selectedExerciseId ?? undefined);
  const reorderExercises = useReorderLearnExercises();
  const reorderQuestions = useReorderLearnQuestions();
  const updateExerciseStatus = useUpdateLearnExerciseStatus();
  const deleteQuestion = useDeleteLearnQuestion();
  const [exerciseModal, setExerciseModal] = useState<{
    open: boolean;
    exercise?: LearnExercise;
  }>({ open: false });
  const [questionModal, setQuestionModal] = useState<{
    open: boolean;
    question?: LearnExerciseQuestion;
  }>({ open: false });
  const [selectedTagQuestion, setSelectedTagQuestion] =
    useState<LearnExerciseQuestion | null>(null);

  useEffect(() => {
    setSelectedExerciseId(null);
  }, [lesson.id]);

  useEffect(() => {
    if (
      selectedExerciseId &&
      !isLoading &&
      !exercises.some((exercise) => exercise.id === selectedExerciseId)
    ) {
      setSelectedExerciseId(null);
      setSelectedTagQuestion(null);
    }
  }, [exercises, isLoading, selectedExerciseId]);

  const statusMenu = (exercise: LearnExercise): MenuProps => ({
    items: getAllowedStructureStatuses(exercise.status).map((status) => ({
      key: status,
      label: LEARN_STATUS_ACTION_LABELS[status],
    })),
    onClick: ({ key }) =>
      updateExerciseStatus.mutate({
        id: exercise.id,
        lessonId: lesson.id,
        courseId,
        status: key as LearnPublishStatus,
      }),
  });

  const moveExercise = (id: string, direction: "up" | "down") => {
    const items = buildStructureReorder(exercises, id, direction);
    if (items) reorderExercises.mutate({ lessonId: lesson.id, courseId, items });
  };

  const moveQuestion = (id: string, direction: "up" | "down") => {
    if (!selectedExerciseId) return;
    const items = buildStructureReorder(questions, id, direction);
    if (items) reorderQuestions.mutate({ exerciseId: selectedExerciseId, items });
  };

  return (
    <Card className="learn-exercise-editor">
      <div className="learn-exercise-editor-heading">
        <div>
          <Space size={8} wrap>
            <Title level={3}>Alıştırmalar ve sorular</Title>
            <Tag>{lesson.title}</Tag>
          </Space>
          <Paragraph type="secondary">
            Alıştırmaları düzenleyin; bir alıştırma seçerek sorularını yönetin.
          </Paragraph>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setExerciseModal({ open: true })}
          >
            Alıştırma ekle
          </Button>
          <Button icon={<X size={16} />} onClick={onClose}>
            Kapat
          </Button>
        </Space>
      </div>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : exercises.length ? (
        <div className="learn-exercise-list">
          {exercises.map((exercise, index) => (
            <div
              className={`learn-exercise-row${
                selectedExerciseId === exercise.id ? " is-selected" : ""
              }`}
              key={exercise.id}
            >
              <span className="learn-exercise-icon">
                <ClipboardCheck size={18} />
              </span>
              <div className="learn-exercise-copy">
                <Space size={8} wrap>
                  <Text strong>{exercise.title}</Text>
                  <Tag color={STATUS_COLORS[exercise.status]}>
                    {LEARN_STATUS_LABELS[exercise.status]}
                  </Tag>
                </Space>
                <Text type="secondary">
                  {
                    LEARN_EXERCISE_TYPE_OPTIONS.find(
                      (option) => option.value === exercise.type
                    )?.label
                  }{" "}
                  · {exercise._count.questions} soru
                </Text>
              </div>
              <Space className="learn-exercise-actions" size={4} wrap>
                <Button
                  type="text"
                  size="small"
                  aria-label="Alıştırmayı yukarı taşı"
                  icon={<ArrowUp size={15} />}
                  disabled={index === 0 || reorderExercises.isPending}
                  onClick={() => moveExercise(exercise.id, "up")}
                />
                <Button
                  type="text"
                  size="small"
                  aria-label="Alıştırmayı aşağı taşı"
                  icon={<ArrowDown size={15} />}
                  disabled={
                    index === exercises.length - 1 ||
                    reorderExercises.isPending
                  }
                  onClick={() => moveExercise(exercise.id, "down")}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<Pencil size={15} />}
                  onClick={() => setExerciseModal({ open: true, exercise })}
                >
                  Düzenle
                </Button>
                <Button
                  type={
                    selectedExerciseId === exercise.id ? "default" : "text"
                  }
                  size="small"
                  icon={<CircleHelp size={15} />}
                  onClick={() => {
                    setSelectedExerciseId(exercise.id);
                    setSelectedTagQuestion(null);
                  }}
                >
                  Sorular
                </Button>
                <Dropdown menu={statusMenu(exercise)} trigger={["click"]}>
                  <Button
                    type="text"
                    size="small"
                    icon={<ChevronDown size={14} />}
                  >
                    Durum
                  </Button>
                </Dropdown>
              </Space>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Bu derste henüz alıştırma yok"
        >
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setExerciseModal({ open: true })}
          >
            İlk alıştırmayı oluştur
          </Button>
        </Empty>
      )}

      {selectedExercise && (
        <section className="learn-question-editor">
          <div className="learn-question-heading">
            <div>
              <Title level={4}>{selectedExercise.title}</Title>
              <Text type="secondary">
                {questions.length} soru · cevap anahtarı yalnızca admin
                ekranında görünür
              </Text>
            </div>
            <Button
              icon={<Plus size={16} />}
              onClick={() => setQuestionModal({ open: true })}
            >
              Soru ekle
            </Button>
          </div>

          {questionsLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : questions.length ? (
            <div className="learn-question-list">
              {questions.map((question, index) => (
                <div className="learn-question-row" key={question.id}>
                  <span className="learn-question-index">{index + 1}</span>
                  <div className="learn-question-copy">
                    <Text strong>{question.prompt}</Text>
                    <Text type="secondary">
                      {getLearnQuestionTypeLabel(question.type)} ·{" "}
                      {question.points} puan
                    </Text>
                  </div>
                  <Space className="learn-question-actions" size={4} wrap>
                    <Button
                      type="text"
                      size="small"
                      aria-label="Soruyu yukarı taşı"
                      icon={<ArrowUp size={15} />}
                      disabled={index === 0 || reorderQuestions.isPending}
                      onClick={() => moveQuestion(question.id, "up")}
                    />
                    <Button
                      type="text"
                      size="small"
                      aria-label="Soruyu aşağı taşı"
                      icon={<ArrowDown size={15} />}
                      disabled={
                        index === questions.length - 1 ||
                        reorderQuestions.isPending
                      }
                      onClick={() => moveQuestion(question.id, "down")}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<Pencil size={15} />}
                      onClick={() =>
                        setQuestionModal({ open: true, question })
                      }
                    >
                      Düzenle
                    </Button>
                    <Button
                      type={
                        selectedTagQuestion?.id === question.id
                          ? "default"
                          : "text"
                      }
                      size="small"
                      icon={<Tags size={15} />}
                      onClick={() => setSelectedTagQuestion(question)}
                    >
                      Etiketler
                    </Button>
                    <Popconfirm
                      title="Soruyu sil?"
                      description="Cevap kaydı bulunan sorular silinemez."
                      okText="Sil"
                      cancelText="Vazgeç"
                      onConfirm={() =>
                        deleteQuestion.mutate({
                          id: question.id,
                          exerciseId: selectedExercise.id,
                        })
                      }
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<Trash2 size={15} />}
                      >
                        Sil
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Bu alıştırmada henüz soru yok"
            >
              <Button
                icon={<Plus size={16} />}
                onClick={() => setQuestionModal({ open: true })}
              >
                İlk soruyu oluştur
              </Button>
            </Empty>
          )}
        </section>
      )}

      {selectedTagQuestion && (
        <LearnQuestionSkillTagEditor
          question={selectedTagQuestion}
          onClose={() => setSelectedTagQuestion(null)}
        />
      )}

      <ExerciseFormModal
        courseId={courseId}
        lessonId={lesson.id}
        exercise={exerciseModal.exercise}
        open={exerciseModal.open}
        onClose={() => setExerciseModal({ open: false })}
      />

      {selectedExercise && (
        <QuestionFormModal
          exerciseId={selectedExercise.id}
          question={questionModal.question}
          open={questionModal.open}
          onClose={() => setQuestionModal({ open: false })}
        />
      )}
    </Card>
  );
}
