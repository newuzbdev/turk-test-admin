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
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { MenuProps, TableColumnsType } from "antd";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Layers3,
  Pencil,
  Plus,
  Tags,
} from "lucide-react";
import {
  useCreateLearnLesson,
  useCreateLearnModule,
  useLearnCourseStructure,
  useReorderLearnLessons,
  useReorderLearnModules,
  useUpdateLearnLesson,
  useUpdateLearnLessonStatus,
  useUpdateLearnModule,
  useUpdateLearnModuleStatus,
} from "@/config/queries/learn";
import type {
  LearnCourseModule,
  LearnLesson,
  LearnLessonFormValues,
  LearnModuleFormValues,
  LearnPublishStatus,
} from "./course-types";
import {
  LEARN_STATUS_ACTION_LABELS,
  LEARN_STATUS_LABELS,
} from "./course-utils";
import {
  buildStructureReorder,
  getAllowedStructureStatuses,
} from "./structure-utils";
import LearnBlockEditor from "./learn-block-editor";
import LearnExerciseEditor from "./learn-exercise-editor";
import { LearnLessonSkillTagEditor } from "./learn-skill-tag-picker";

const { Title, Text, Paragraph } = Typography;

const STATUS_COLORS: Record<LearnPublishStatus, string> = {
  DRAFT: "default",
  PUBLISHED: "green",
  ARCHIVED: "orange",
};

interface ModuleFormModalProps {
  courseId: string;
  module?: LearnCourseModule;
  open: boolean;
  onClose: () => void;
}

function ModuleFormModal({
  courseId,
  module,
  open,
  onClose,
}: ModuleFormModalProps) {
  const [form] = Form.useForm<LearnModuleFormValues>();
  const createModule = useCreateLearnModule();
  const updateModule = useUpdateLearnModule();
  const isPending = createModule.isPending || updateModule.isPending;

  useEffect(() => {
    if (!open) return;
    if (module) {
      form.setFieldsValue({
        slug: module.slug,
        title: module.title,
        description: module.description ?? undefined,
      });
    } else {
      form.resetFields();
    }
  }, [form, module, open]);

  const submit = (values: LearnModuleFormValues) => {
    const payload = {
      ...values,
      description: values.description?.trim() ?? "",
    };
    const options = { onSuccess: onClose };

    if (module) {
      updateModule.mutate(
        { id: module.id, courseId, values: payload },
        options
      );
      return;
    }

    createModule.mutate({ courseId, values: payload }, options);
  };

  return (
    <Modal
      title={module ? "Modülü düzenle" : "Yeni modül"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={module ? "Kaydet" : "Oluştur"}
      cancelText="Vazgeç"
      confirmLoading={isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="title"
          label="Modül adı"
          rules={[
            { required: true, message: "Modül adını girin" },
            { whitespace: true, message: "Modül adı boş olamaz" },
          ]}
        >
          <Input placeholder="Örn. Temel iletişim" />
        </Form.Item>
        <Form.Item
          name="slug"
          label="URL anahtarı"
          rules={[
            { required: true, message: "URL anahtarını girin" },
            {
              pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message: "Örn. temel-iletisim",
            },
          ]}
        >
          <Input placeholder="temel-iletisim" />
        </Form.Item>
        <Form.Item name="description" label="Açıklama">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

interface LessonFormModalProps {
  courseId: string;
  moduleId: string;
  lesson?: LearnLesson;
  open: boolean;
  onClose: () => void;
}

function LessonFormModal({
  courseId,
  moduleId,
  lesson,
  open,
  onClose,
}: LessonFormModalProps) {
  const [form] = Form.useForm<LearnLessonFormValues>();
  const createLesson = useCreateLearnLesson();
  const updateLesson = useUpdateLearnLesson();
  const isPending = createLesson.isPending || updateLesson.isPending;

  useEffect(() => {
    if (!open) return;
    if (lesson) {
      form.setFieldsValue({
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary ?? undefined,
        estimatedMinutes: lesson.estimatedMinutes ?? undefined,
        isPreview: lesson.isPreview,
      });
    } else {
      form.resetFields();
      form.setFieldValue("isPreview", false);
    }
  }, [form, lesson, open]);

  const submit = (values: LearnLessonFormValues) => {
    const payload = {
      ...values,
      summary: values.summary?.trim() ?? "",
      isPreview: Boolean(values.isPreview),
    };
    const options = { onSuccess: onClose };

    if (lesson) {
      updateLesson.mutate(
        { id: lesson.id, courseId, values: payload },
        options
      );
      return;
    }

    createLesson.mutate({ moduleId, courseId, values: payload }, options);
  };

  return (
    <Modal
      title={lesson ? "Dersi düzenle" : "Yeni ders"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={lesson ? "Kaydet" : "Oluştur"}
      cancelText="Vazgeç"
      confirmLoading={isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="title"
          label="Ders adı"
          rules={[
            { required: true, message: "Ders adını girin" },
            { whitespace: true, message: "Ders adı boş olamaz" },
          ]}
        >
          <Input placeholder="Örn. Selamlaşma ve tanışma" />
        </Form.Item>
        <Form.Item
          name="slug"
          label="URL anahtarı"
          rules={[
            { required: true, message: "URL anahtarını girin" },
            {
              pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message: "Örn. selamlasma-ve-tanisma",
            },
          ]}
        >
          <Input placeholder="selamlasma-ve-tanisma" />
        </Form.Item>
        <Form.Item name="summary" label="Kısa açıklama">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="estimatedMinutes" label="Tahmini süre (dk)">
          <InputNumber min={0} precision={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="isPreview" valuePropName="checked">
          <Checkbox>Ücretsiz ön izleme dersi</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}

interface LearnCourseStructureProps {
  courseId: string;
}

export default function LearnCourseStructure({
  courseId,
}: LearnCourseStructureProps) {
  const { data: structure, isLoading } = useLearnCourseStructure(courseId);
  const reorderModules = useReorderLearnModules();
  const reorderLessons = useReorderLearnLessons();
  const updateModuleStatus = useUpdateLearnModuleStatus();
  const updateLessonStatus = useUpdateLearnLessonStatus();
  const [moduleModal, setModuleModal] = useState<{
    open: boolean;
    module?: LearnCourseModule;
  }>({ open: false });
  const [lessonModal, setLessonModal] = useState<{
    open: boolean;
    moduleId: string;
    lesson?: LearnLesson;
  } | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LearnLesson | null>(
    null
  );
  const [selectedExerciseLesson, setSelectedExerciseLesson] =
    useState<LearnLesson | null>(null);
  const [selectedTagLesson, setSelectedTagLesson] =
    useState<LearnLesson | null>(null);

  const statusMenu = (
    status: LearnPublishStatus,
    onSelect: (status: LearnPublishStatus) => void
  ): MenuProps => ({
    items: getAllowedStructureStatuses(status).map((nextStatus) => ({
      key: nextStatus,
      label: LEARN_STATUS_ACTION_LABELS[nextStatus],
    })),
    onClick: ({ key }) => onSelect(key as LearnPublishStatus),
  });

  const moveModule = (
    moduleId: string,
    direction: "up" | "down"
  ) => {
    if (!structure) return;
    const items = buildStructureReorder(
      structure.modules,
      moduleId,
      direction
    );
    if (items) reorderModules.mutate({ courseId, items });
  };

  const moveLesson = (
    module: LearnCourseModule,
    lessonId: string,
    direction: "up" | "down"
  ) => {
    const items = buildStructureReorder(module.lessons, lessonId, direction);
    if (items) {
      reorderLessons.mutate({ moduleId: module.id, courseId, items });
    }
  };

  const lessonColumns = (
    module: LearnCourseModule
  ): TableColumnsType<LearnLesson> => [
    {
      title: "Ders",
      key: "lesson",
      render: (_, lesson) => (
        <div className="learn-lesson-name">
          <Text strong>{lesson.title}</Text>
          <Text type="secondary">{lesson.slug}</Text>
        </div>
      ),
    },
    {
      title: "Süre",
      dataIndex: "estimatedMinutes",
      width: 90,
      render: (minutes: number | null) =>
        minutes === null ? "—" : `${minutes} dk`,
    },
    {
      title: "İçerik",
      width: 130,
      render: (_, lesson) => (
        <Text type="secondary">
          {lesson._count.contentBlocks} blok · {lesson._count.exercises} alıştırma
        </Text>
      ),
    },
    {
      title: "Durum",
      dataIndex: "status",
      width: 120,
      render: (status: LearnPublishStatus) => (
        <Tag color={STATUS_COLORS[status]}>{LEARN_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 330,
      align: "right",
      render: (_, lesson, index) => (
        <Space size={4} wrap>
          <Button
            type="text"
            size="small"
            aria-label="Dersi yukarı taşı"
            icon={<ArrowUp size={15} />}
            disabled={index === 0 || reorderLessons.isPending}
            onClick={() => moveLesson(module, lesson.id, "up")}
          />
          <Button
            type="text"
            size="small"
            aria-label="Dersi aşağı taşı"
            icon={<ArrowDown size={15} />}
            disabled={
              index === module.lessons.length - 1 || reorderLessons.isPending
            }
            onClick={() => moveLesson(module, lesson.id, "down")}
          />
          <Button
            type="text"
            size="small"
            icon={<Pencil size={15} />}
            onClick={() =>
              setLessonModal({ open: true, moduleId: module.id, lesson })
            }
          >
            Düzenle
          </Button>
          <Button
            type={selectedLesson?.id === lesson.id ? "default" : "text"}
            size="small"
            icon={<Layers3 size={15} />}
            onClick={() => {
              setSelectedLesson(lesson);
              setSelectedExerciseLesson(null);
              setSelectedTagLesson(null);
            }}
          >
            İçerik
          </Button>
          <Button
            type={
              selectedExerciseLesson?.id === lesson.id ? "default" : "text"
            }
            size="small"
            icon={<ClipboardCheck size={15} />}
            onClick={() => {
              setSelectedExerciseLesson(lesson);
              setSelectedLesson(null);
              setSelectedTagLesson(null);
            }}
          >
            Alıştırmalar
          </Button>
          <Button
            type={selectedTagLesson?.id === lesson.id ? "default" : "text"}
            size="small"
            icon={<Tags size={15} />}
            onClick={() => {
              setSelectedTagLesson(lesson);
              setSelectedLesson(null);
              setSelectedExerciseLesson(null);
            }}
          >
            Etiketler
          </Button>
          <Dropdown
            menu={statusMenu(lesson.status, (status) =>
              updateLessonStatus.mutate({
                id: lesson.id,
                courseId,
                status,
              })
            )}
            trigger={["click"]}
          >
            <Button type="text" size="small" icon={<ChevronDown size={14} />}>
              Durum
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card className="learn-structure-card">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <section className="learn-structure">
      <div className="learn-structure-heading">
        <div>
          <Title level={3}>Kurs içeriği</Title>
          <Paragraph type="secondary">
            Modülleri ve her modülün altındaki dersleri yönetin.
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setModuleModal({ open: true })}
        >
          Yeni modül
        </Button>
      </div>

      {!structure?.modules.length ? (
        <Card className="learn-structure-card">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Bu kursta henüz modül yok"
          >
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setModuleModal({ open: true })}
            >
              İlk modülü oluştur
            </Button>
          </Empty>
        </Card>
      ) : (
        <div className="learn-module-list">
          {structure.modules.map((module, moduleIndex) => (
            <Card key={module.id} className="learn-module-card">
              <div className="learn-module-header">
                <div className="learn-module-title">
                  <span className="learn-module-index">
                    <BookOpen size={18} />
                  </span>
                  <div>
                    <Space size={8} wrap>
                      <Title level={4}>{module.title}</Title>
                      <Tag color={STATUS_COLORS[module.status]}>
                        {LEARN_STATUS_LABELS[module.status]}
                      </Tag>
                    </Space>
                    <Text type="secondary">
                      {module.slug} · {module.lessons.length} ders
                    </Text>
                  </div>
                </div>

                <Space size={4} wrap>
                  <Button
                    type="text"
                    aria-label="Modülü yukarı taşı"
                    icon={<ArrowUp size={16} />}
                    disabled={moduleIndex === 0 || reorderModules.isPending}
                    onClick={() => moveModule(module.id, "up")}
                  />
                  <Button
                    type="text"
                    aria-label="Modülü aşağı taşı"
                    icon={<ArrowDown size={16} />}
                    disabled={
                      moduleIndex === structure.modules.length - 1 ||
                      reorderModules.isPending
                    }
                    onClick={() => moveModule(module.id, "down")}
                  />
                  <Button
                    type="text"
                    icon={<Pencil size={16} />}
                    onClick={() => setModuleModal({ open: true, module })}
                  >
                    Düzenle
                  </Button>
                  <Dropdown
                    menu={statusMenu(module.status, (status) =>
                      updateModuleStatus.mutate({
                        id: module.id,
                        courseId,
                        status,
                      })
                    )}
                    trigger={["click"]}
                  >
                    <Button type="text" icon={<ChevronDown size={15} />}>
                      Durum
                    </Button>
                  </Dropdown>
                  <Button
                    icon={<Plus size={16} />}
                    onClick={() =>
                      setLessonModal({ open: true, moduleId: module.id })
                    }
                  >
                    Ders ekle
                  </Button>
                </Space>
              </div>

              {module.description && (
                <Paragraph className="learn-module-description">
                  {module.description}
                </Paragraph>
              )}

              {module.lessons.length ? (
                <Table
                  className="learn-lesson-table"
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={lessonColumns(module)}
                  dataSource={module.lessons}
                  scroll={{ x: 840 }}
                />
              ) : (
                <div className="learn-module-empty">
                  <FileText size={20} />
                  <Text type="secondary">Bu modülde henüz ders yok.</Text>
                  <Button
                    type="link"
                    onClick={() =>
                      setLessonModal({ open: true, moduleId: module.id })
                    }
                  >
                    İlk dersi ekle
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ModuleFormModal
        courseId={courseId}
        module={moduleModal.module}
        open={moduleModal.open}
        onClose={() => setModuleModal({ open: false })}
      />

      {lessonModal && (
        <LessonFormModal
          courseId={courseId}
          moduleId={lessonModal.moduleId}
          lesson={lessonModal.lesson}
          open={lessonModal.open}
          onClose={() => setLessonModal(null)}
        />
      )}

      {selectedLesson && (
        <LearnBlockEditor
          courseId={courseId}
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
        />
      )}

      {selectedExerciseLesson && (
        <LearnExerciseEditor
          courseId={courseId}
          lesson={selectedExerciseLesson}
          onClose={() => setSelectedExerciseLesson(null)}
        />
      )}

      {selectedTagLesson && (
        <LearnLessonSkillTagEditor
          lesson={selectedTagLesson}
          onClose={() => setSelectedTagLesson(null)}
        />
      )}
    </section>
  );
}
