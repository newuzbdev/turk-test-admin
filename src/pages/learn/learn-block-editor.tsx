import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ArrowDown,
  ArrowUp,
  FileAudio,
  FileImage,
  FileQuestion,
  FileText,
  Heading,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react";
import {
  useCreateLearnBlock,
  useDeleteLearnBlock,
  useLearnLessonBlocks,
  useReorderLearnBlocks,
  useUpdateLearnBlock,
} from "@/config/queries/learn";
import type {
  LearnContentBlock,
  LearnContentBlockFormValues,
  LearnContentBlockType,
  LearnLesson,
} from "./course-types";
import {
  buildLearnBlockPayload,
  getLearnBlockTypeLabel,
  INTERACTIVE_BLOCK_TYPES,
  LEARN_BLOCK_TYPE_OPTIONS,
  MEDIA_BLOCK_TYPES,
  TEXT_BLOCK_TYPES,
} from "./block-utils";
import { buildStructureReorder } from "./structure-utils";
import RichBlockEditor from "./rich-block-editor";

const { Title, Text, Paragraph } = Typography;

const BLOCK_ICONS: Record<LearnContentBlockType, ReactNode> = {
  HEADING: <Heading size={17} />,
  TEXT: <FileText size={17} />,
  EXAMPLE: <FileText size={17} />,
  CALLOUT: <FileText size={17} />,
  IMAGE: <FileImage size={17} />,
  AUDIO: <FileAudio size={17} />,
  VIDEO: <Video size={17} />,
  GRAMMAR_PATTERN: <FileText size={17} />,
  COMMON_MISTAKE: <FileText size={17} />,
  EXAM_TIP: <FileText size={17} />,
  VOCABULARY_LIST: <FileText size={17} />,
  MINI_QUESTION: <FileQuestion size={17} />,
  FINAL_EXERCISE: <FileQuestion size={17} />,
};

const getBlockSummary = (block: LearnContentBlock) => {
  if (block.type === "HEADING") return block.title;
  if (TEXT_BLOCK_TYPES.has(block.type)) return block.text;
  if (MEDIA_BLOCK_TYPES.has(block.type)) return block.mediaUrl;
  if (block.type === "GRAMMAR_PATTERN") return block.data?.pattern;
  if (block.type === "COMMON_MISTAKE") {
    return block.data?.wrong && block.data?.correct
      ? `${block.data.wrong} → ${block.data.correct}`
      : undefined;
  }
  if (block.type === "EXAM_TIP") return block.data?.tip;
  if (block.type === "VOCABULARY_LIST") {
    return block.data?.items?.map((item) => item.word).filter(Boolean).join(", ");
  }
  return block.data?.exerciseId
    ? `Exercise: ${block.data.exerciseId}`
    : "Exercise henüz bağlanmadı";
};

const LEARN_LEVEL_OPTIONS = [
  { value: "STARTER", label: "Sıfırdan Başla" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
  { value: "C1", label: "C1" },
];

const hasItems = (value: unknown): value is unknown[] =>
  Array.isArray(value) && value.length > 0;

interface BlockFormModalProps {
  courseId: string;
  lessonId: string;
  block?: LearnContentBlock;
  open: boolean;
  onClose: () => void;
}

function BlockFormModal({
  courseId,
  lessonId,
  block,
  open,
  onClose,
}: BlockFormModalProps) {
  const [form] = Form.useForm<LearnContentBlockFormValues>();
  const type = Form.useWatch("type", form);
  const createBlock = useCreateLearnBlock();
  const updateBlock = useUpdateLearnBlock();
  const isPending = createBlock.isPending || updateBlock.isPending;

  useEffect(() => {
    if (!open) return;

    if (block) {
      form.resetFields();
      form.setFieldsValue({
        type: block.type,
        title: block.title ?? undefined,
        text: block.text ?? undefined,
        mediaUrl: block.mediaUrl ?? undefined,
        exerciseId: block.data?.exerciseId,
        grammarPattern: {
          pattern: block.data?.pattern,
          explanation: block.data?.explanation,
          rows: hasItems(block.data?.rows) ? block.data?.rows : [],
          examples: hasItems(block.data?.examples) ? block.data?.examples : [],
        },
        commonMistake: {
          wrong: block.data?.wrong,
          correct: block.data?.correct,
          explanation: block.data?.explanation,
        },
        examTip: {
          tip: block.data?.tip,
          skillTagKey: block.data?.skillTagKey,
          level: block.data?.level,
        },
        vocabularyList: {
          items: hasItems(block.data?.items)
            ? block.data?.items
            : [{ word: undefined, meaning: undefined }],
        },
      });
      return;
    }

    form.resetFields();
    form.setFieldValue("type", "TEXT");
  }, [block, form, open]);

  const submit = (values: LearnContentBlockFormValues) => {
    const payload = buildLearnBlockPayload(values);
    const options = { onSuccess: onClose };

    if (block) {
      updateBlock.mutate(
        {
          id: block.id,
          lessonId,
          courseId,
          values: payload,
        },
        options
      );
      return;
    }

    createBlock.mutate(
      { lessonId, courseId, values: payload },
      options
    );
  };

  return (
    <Modal
      title={block ? "İçerik bloğunu düzenle" : "Yeni içerik bloğu"}
      open={open}
      width={720}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={block ? "Kaydet" : "Oluştur"}
      cancelText="Vazgeç"
      confirmLoading={isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="type"
          label="Blok tipi"
          rules={[{ required: true, message: "Blok tipi seçin" }]}
          extra={
            block
              ? "Mevcut bloğun tipini değiştirmek yerine yeni blok oluşturun."
              : undefined
          }
        >
          <Select
            options={LEARN_BLOCK_TYPE_OPTIONS}
            disabled={Boolean(block)}
          />
        </Form.Item>

        {type === "HEADING" && (
          <Form.Item
            name="title"
            label="Başlık"
            rules={[
              { required: true, message: "Başlık metnini girin" },
              { whitespace: true, message: "Başlık boş olamaz" },
            ]}
          >
            <Input placeholder="Örn. İsim cümleleri" />
          </Form.Item>
        )}

        {type && TEXT_BLOCK_TYPES.has(type) && (
          <Form.Item
            name="text"
            label="Metin"
            rules={[
              { required: true, message: "Blok metnini girin" },
              { whitespace: true, message: "Metin boş olamaz" },
            ]}
          >
            <RichBlockEditor />
          </Form.Item>
        )}

        {type && MEDIA_BLOCK_TYPES.has(type) && (
          <Form.Item
            name="mediaUrl"
            label="Medya URL"
            rules={[
              { required: true, message: "Medya URL adresini girin" },
              { type: "url", message: "Geçerli bir URL girin" },
            ]}
          >
            <Input placeholder="https://..." />
          </Form.Item>
        )}

        {type && INTERACTIVE_BLOCK_TYPES.has(type) && (
          <Form.Item
            name="exerciseId"
            label="Exercise ID"
            extra="Opsiyoneldir. Exercise editörü tamamlandığında buradan bağlanabilir."
            rules={[
              {
                pattern:
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                message: "Geçerli bir UUID girin",
              },
            ]}
          >
            <Input allowClear placeholder="Opsiyonel exercise UUID" />
          </Form.Item>
        )}

        {type === "GRAMMAR_PATTERN" && <GrammarPatternFields />}
        {type === "COMMON_MISTAKE" && <CommonMistakeFields />}
        {type === "EXAM_TIP" && <ExamTipFields />}
        {type === "VOCABULARY_LIST" && <VocabularyListFields />}
      </Form>
    </Modal>
  );
}

function GrammarPatternFields() {
  return (
    <>
      <Form.Item
        name={["grammarPattern", "pattern"]}
        label="Kalıp"
        rules={[
          { required: true, message: "Gramer kalıbını girin" },
          { whitespace: true, message: "Kalıp boş olamaz" },
        ]}
      >
        <Input placeholder="Örn. Ben + isim + -im" />
      </Form.Item>

      <Form.Item
        name={["grammarPattern", "explanation"]}
        label="Kısa açıklama"
      >
        <Input.TextArea rows={3} placeholder="Bu kalıp ne zaman kullanılır?" />
      </Form.Item>

      <Form.List name={["grammarPattern", "rows"]}>
        {(fields, { add, remove }) => (
          <div className="learn-nested-list">
            <div className="learn-nested-list-heading">
              <Text strong>Tablo satırları</Text>
              <Button size="small" onClick={() => add({})}>
                Satır ekle
              </Button>
            </div>
            {fields.map((field) => (
              <Card size="small" key={field.key} className="learn-nested-card">
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Space align="start" wrap style={{ width: "100%" }}>
                    <Form.Item
                      {...field}
                      name={[field.name, "label"]}
                      label="Etiket"
                    >
                      <Input placeholder="Ben" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, "form"]}
                      label="Biçim"
                    >
                      <Input placeholder="-im" />
                    </Form.Item>
                    <Button
                      danger
                      type="text"
                      icon={<Trash2 size={15} />}
                      onClick={() => remove(field.name)}
                    />
                  </Space>
                  <Form.Item
                    {...field}
                    name={[field.name, "example"]}
                    label="Örnek"
                  >
                    <Input placeholder="Ben öğrenciyim." />
                  </Form.Item>
                  <Form.Item {...field} name={[field.name, "note"]} label="Not">
                    <Input placeholder="Opsiyonel kısa not" />
                  </Form.Item>
                </Space>
              </Card>
            ))}
          </div>
        )}
      </Form.List>

      <Form.List name={["grammarPattern", "examples"]}>
        {(fields, { add, remove }) => (
          <div className="learn-nested-list">
            <div className="learn-nested-list-heading">
              <Text strong>Örnekler</Text>
              <Button size="small" onClick={() => add({})}>
                Örnek ekle
              </Button>
            </div>
            {fields.map((field) => (
              <Card size="small" key={field.key} className="learn-nested-card">
                <Form.Item
                  {...field}
                  name={[field.name, "text"]}
                  label="Örnek metin"
                >
                  <Input placeholder="Ben öğretmenim." />
                </Form.Item>
                <Form.Item
                  {...field}
                  name={[field.name, "explanation"]}
                  label="Açıklama"
                >
                  <Input placeholder="Opsiyonel açıklama" />
                </Form.Item>
                <Button
                  danger
                  type="text"
                  icon={<Trash2 size={15} />}
                  onClick={() => remove(field.name)}
                >
                  Örneği sil
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Form.List>
    </>
  );
}

function CommonMistakeFields() {
  return (
    <>
      <Form.Item
        name={["commonMistake", "wrong"]}
        label="Yanlış örnek"
        rules={[
          { required: true, message: "Yanlış örneği girin" },
          { whitespace: true, message: "Yanlış örnek boş olamaz" },
        ]}
      >
        <Input placeholder="Ben öğrenci" />
      </Form.Item>
      <Form.Item
        name={["commonMistake", "correct"]}
        label="Doğru örnek"
        rules={[
          { required: true, message: "Doğru örneği girin" },
          { whitespace: true, message: "Doğru örnek boş olamaz" },
        ]}
      >
        <Input placeholder="Ben öğrenciyim." />
      </Form.Item>
      <Form.Item
        name={["commonMistake", "explanation"]}
        label="Kısa açıklama"
      >
        <Input.TextArea rows={3} placeholder="Bu hata neden oluyor?" />
      </Form.Item>
    </>
  );
}

function ExamTipFields() {
  return (
    <>
      <Form.Item
        name={["examTip", "tip"]}
        label="Sınav ipucu"
        rules={[
          { required: true, message: "Sınav ipucunu girin" },
          { whitespace: true, message: "Sınav ipucu boş olamaz" },
        ]}
      >
        <Input.TextArea rows={3} placeholder="Sınavda bu yapıyı kısa ve net kullan." />
      </Form.Item>
      <Form.Item name={["examTip", "skillTagKey"]} label="SkillTag key">
        <Input allowClear placeholder="Opsiyonel: writing.resmi-eposta" />
      </Form.Item>
      <Form.Item name={["examTip", "level"]} label="Seviye">
        <Select
          allowClear
          placeholder="Opsiyonel seviye"
          options={LEARN_LEVEL_OPTIONS}
        />
      </Form.Item>
    </>
  );
}

function VocabularyListFields() {
  return (
    <Form.List
      name={["vocabularyList", "items"]}
      rules={[
        {
          validator: async (_, items) => {
            if (!items || items.length < 1) {
              throw new Error("En az bir kelime ekleyin");
            }
          },
        },
      ]}
      initialValue={[{}]}
    >
      {(fields, { add, remove }, { errors }) => (
        <div className="learn-nested-list">
          <div className="learn-nested-list-heading">
            <Text strong>Kelime listesi</Text>
            <Button size="small" onClick={() => add({})}>
              Kelime ekle
            </Button>
          </div>
          {fields.map((field) => (
            <Card size="small" key={field.key} className="learn-nested-card">
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Space align="start" wrap style={{ width: "100%" }}>
                  <Form.Item
                    {...field}
                    name={[field.name, "word"]}
                    label="Kelime"
                    rules={[
                      { required: true, message: "Kelime girin" },
                      { whitespace: true, message: "Kelime boş olamaz" },
                    ]}
                  >
                    <Input placeholder="öğrenci" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, "meaning"]}
                    label="Anlam"
                    rules={[
                      { required: true, message: "Anlam girin" },
                      { whitespace: true, message: "Anlam boş olamaz" },
                    ]}
                  >
                    <Input placeholder="student" />
                  </Form.Item>
                  <Button
                    danger
                    type="text"
                    icon={<Trash2 size={15} />}
                    disabled={fields.length === 1}
                    onClick={() => remove(field.name)}
                  />
                </Space>
                <Form.Item
                  {...field}
                  name={[field.name, "example"]}
                  label="Örnek"
                >
                  <Input placeholder="Ben öğrenciyim." />
                </Form.Item>
                <Form.Item {...field} name={[field.name, "note"]} label="Not">
                  <Input placeholder="Opsiyonel kısa not" />
                </Form.Item>
              </Space>
            </Card>
          ))}
          <Form.ErrorList errors={errors} />
        </div>
      )}
    </Form.List>
  );
}

interface LearnBlockEditorProps {
  courseId: string;
  lesson: LearnLesson;
  onClose: () => void;
}

export default function LearnBlockEditor({
  courseId,
  lesson,
  onClose,
}: LearnBlockEditorProps) {
  const { data: blocks = [], isLoading } = useLearnLessonBlocks(lesson.id);
  const deleteBlock = useDeleteLearnBlock();
  const reorderBlocks = useReorderLearnBlocks();
  const [blockModal, setBlockModal] = useState<{
    open: boolean;
    block?: LearnContentBlock;
  }>({ open: false });

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    const items = buildStructureReorder(blocks, blockId, direction);
    if (items) {
      reorderBlocks.mutate({ lessonId: lesson.id, courseId, items });
    }
  };

  return (
    <Card className="learn-block-editor">
      <div className="learn-block-editor-heading">
        <div>
          <Space size={8} wrap>
            <Title level={3}>Ders içeriği</Title>
            <Tag>{lesson.title}</Tag>
          </Space>
          <Paragraph type="secondary">
            İçerik blokları öğrencinin derste göreceği sırayla listelenir.
          </Paragraph>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setBlockModal({ open: true })}
          >
            Blok ekle
          </Button>
          <Button icon={<X size={16} />} onClick={onClose}>
            Kapat
          </Button>
        </Space>
      </div>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : blocks.length ? (
        <div className="learn-block-list">
          {blocks.map((block, index) => (
            <div className="learn-block-row" key={block.id}>
              <span className="learn-block-icon">
                {BLOCK_ICONS[block.type]}
              </span>
              <div className="learn-block-copy">
                <Space size={8} wrap>
                  <Text strong>{getLearnBlockTypeLabel(block.type)}</Text>
                  <Text type="secondary">#{index + 1}</Text>
                </Space>
                <Text type="secondary" ellipsis={{ tooltip: true }}>
                  {getBlockSummary(block) || "İçerik girilmedi"}
                </Text>
              </div>
              <Space size={4} wrap className="learn-block-actions">
                <Button
                  type="text"
                  aria-label="Bloğu yukarı taşı"
                  icon={<ArrowUp size={15} />}
                  disabled={index === 0 || reorderBlocks.isPending}
                  onClick={() => moveBlock(block.id, "up")}
                />
                <Button
                  type="text"
                  aria-label="Bloğu aşağı taşı"
                  icon={<ArrowDown size={15} />}
                  disabled={
                    index === blocks.length - 1 || reorderBlocks.isPending
                  }
                  onClick={() => moveBlock(block.id, "down")}
                />
                <Button
                  type="text"
                  icon={<Pencil size={15} />}
                  onClick={() => setBlockModal({ open: true, block })}
                >
                  Düzenle
                </Button>
                <Popconfirm
                  title="İçerik bloğu silinsin mi?"
                  description="Bu işlem geri alınamaz."
                  okText="Sil"
                  cancelText="Vazgeç"
                  okButtonProps={{ danger: true }}
                  onConfirm={() =>
                    deleteBlock.mutate({
                      id: block.id,
                      lessonId: lesson.id,
                      courseId,
                    })
                  }
                >
                  <Button
                    type="text"
                    danger
                    icon={<Trash2 size={15} />}
                    loading={deleteBlock.isPending}
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
          description="Bu derste henüz içerik bloğu yok"
        >
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setBlockModal({ open: true })}
          >
            İlk bloğu oluştur
          </Button>
        </Empty>
      )}

      <BlockFormModal
        courseId={courseId}
        lessonId={lesson.id}
        block={blockModal.block}
        open={blockModal.open}
        onClose={() => setBlockModal({ open: false })}
      />
    </Card>
  );
}
