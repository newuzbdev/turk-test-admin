import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { Pencil, Plus, Tags } from "lucide-react";
import {
  useCreateLearnSkillTag,
  useLearnSkillTags,
  useUpdateLearnSkillTag,
  useUpdateLearnSkillTagStatus,
} from "@/config/queries/learn";
import type {
  LearnSkillTag,
  LearnSkillTagFormValues,
  LearnSkillTagQuery,
} from "./course-types";
import { getLearnLevelLabel } from "./course-utils";
import {
  SKILL_TAG_CATEGORY_COLORS,
  SKILL_TAG_CATEGORY_LABELS,
  SKILL_TAG_CATEGORY_OPTIONS,
  SKILL_TAG_LEVEL_OPTIONS,
} from "./skill-tag-utils";

const { Title, Paragraph, Text } = Typography;

type SkillTagFormModalProps = {
  open: boolean;
  skillTag?: LearnSkillTag;
  allTags: LearnSkillTag[];
  onClose: () => void;
};

function SkillTagFormModal({
  open,
  skillTag,
  allTags,
  onClose,
}: SkillTagFormModalProps) {
  const [form] = Form.useForm<LearnSkillTagFormValues>();
  const createSkillTag = useCreateLearnSkillTag();
  const updateSkillTag = useUpdateLearnSkillTag();
  const isPending = createSkillTag.isPending || updateSkillTag.isPending;
  const parentOptions = useMemo(
    () =>
      allTags
        .filter((tag) => tag.id !== skillTag?.id)
        .map((tag) => ({
          value: tag.id,
          label: `${tag.title} · ${SKILL_TAG_CATEGORY_LABELS[tag.category]}`,
        })),
    [allTags, skillTag?.id]
  );

  useEffect(() => {
    if (!open) return;

    if (skillTag) {
      form.setFieldsValue({
        key: skillTag.key,
        title: skillTag.title,
        description: skillTag.description ?? undefined,
        category: skillTag.category,
        level: skillTag.level ?? undefined,
        parentId: skillTag.parentId ?? undefined,
      });
      return;
    }

    form.resetFields();
    form.setFieldValue("category", "GRAMMAR");
  }, [form, open, skillTag]);

  const submit = (values: LearnSkillTagFormValues) => {
    const options = { onSuccess: onClose };

    if (skillTag) {
      updateSkillTag.mutate({ id: skillTag.id, values }, options);
      return;
    }

    createSkillTag.mutate(values, options);
  };

  return (
    <Modal
      title={skillTag ? "Beceri etiketini düzenle" : "Yeni beceri etiketi"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={skillTag ? "Kaydet" : "Oluştur"}
      cancelText="Vazgeç"
      confirmLoading={isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="title"
          label="Başlık"
          rules={[
            { required: true, message: "Başlık girin" },
            { whitespace: true, message: "Başlık boş olamaz" },
          ]}
        >
          <Input placeholder="Örn. İsim cümlesi" />
        </Form.Item>
        <Form.Item
          name="key"
          label="Anahtar"
          extra="Küçük harf, sayı, nokta ve tire kullanın. Örn. grammar.isim-cumlesi"
          rules={[
            { required: true, message: "Anahtar girin" },
            {
              pattern: /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/,
              message: "Örn. grammar.isim-cumlesi",
            },
          ]}
        >
          <Input placeholder="grammar.isim-cumlesi" />
        </Form.Item>
        <div className="learn-form-grid">
          <Form.Item
            name="category"
            label="Kategori"
            rules={[{ required: true, message: "Kategori seçin" }]}
          >
            <Select options={SKILL_TAG_CATEGORY_OPTIONS} />
          </Form.Item>
          <Form.Item name="level" label="Seviye">
            <Select
              allowClear
              placeholder="Genel"
              options={SKILL_TAG_LEVEL_OPTIONS}
            />
          </Form.Item>
        </div>
        <Form.Item name="parentId" label="Üst etiket">
          <Select
            allowClear
            showSearch
            placeholder="Üst etiket yok"
            optionFilterProp="label"
            options={parentOptions}
          />
        </Form.Item>
        <Form.Item name="description" label="Açıklama">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default function LearnSkillTagList() {
  const [query, setQuery] = useState<LearnSkillTagQuery>({});
  const [modal, setModal] = useState<{
    open: boolean;
    skillTag?: LearnSkillTag;
  }>({ open: false });
  const { data, isLoading } = useLearnSkillTags(query);
  const { data: allTags } = useLearnSkillTags({});
  const updateStatus = useUpdateLearnSkillTagStatus();
  const skillTags = data?.data ?? [];

  const columns: TableColumnsType<LearnSkillTag> = [
    {
      title: "Beceri etiketi",
      key: "skillTag",
      render: (_, tag) => (
        <div className="learn-course-name">
          <Text strong>{tag.title}</Text>
          <Text type="secondary">{tag.key}</Text>
        </div>
      ),
    },
    {
      title: "Kategori",
      dataIndex: "category",
      width: 160,
      render: (category: LearnSkillTag["category"]) => (
        <Tag color={SKILL_TAG_CATEGORY_COLORS[category]}>
          {SKILL_TAG_CATEGORY_LABELS[category]}
        </Tag>
      ),
    },
    {
      title: "Seviye",
      dataIndex: "level",
      width: 110,
      render: (level: LearnSkillTag["level"]) =>
        level ? getLearnLevelLabel(level) : "Genel",
    },
    {
      title: "Üst etiket",
      dataIndex: "parent",
      width: 170,
      render: (parent: LearnSkillTag["parent"]) => parent?.title ?? "—",
    },
    {
      title: "Bağlantılar",
      key: "links",
      width: 150,
      render: (_, tag) => (
        <Text type="secondary">
          {tag._count.lessonLinks} ders · {tag._count.questionLinks} soru
        </Text>
      ),
    },
    {
      title: "Aktif",
      dataIndex: "isActive",
      width: 100,
      render: (isActive: boolean, tag) => (
        <Switch
          checked={isActive}
          size="small"
          loading={updateStatus.isPending}
          onChange={(nextValue) =>
            updateStatus.mutate({ id: tag.id, isActive: nextValue })
          }
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 120,
      align: "right",
      render: (_, tag) => (
        <Button
          type="text"
          size="small"
          icon={<Pencil size={15} />}
          onClick={() => setModal({ open: true, skillTag: tag })}
        >
          Düzenle
        </Button>
      ),
    },
  ];

  return (
    <div className="learn-page">
      <div className="learn-page-heading">
        <div>
          <Title level={2}>Beceri etiketleri</Title>
          <Paragraph type="secondary">
            Ders ve soruları konu ve becerilerine göre düzenleyin.
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setModal({ open: true })}
        >
          Yeni beceri etiketi
        </Button>
      </div>

      <Card className="learn-list-card">
        <div className="learn-list-toolbar learn-skill-tag-toolbar">
          <Input.Search
            allowClear
            placeholder="Başlık, key veya açıklama ara"
            onSearch={(search) =>
              setQuery((current) => ({ ...current, search: search || undefined }))
            }
            onChange={(event) => {
              if (!event.target.value) {
                setQuery((current) => ({ ...current, search: undefined }));
              }
            }}
          />
          <Select
            allowClear
            placeholder="Kategori"
            options={SKILL_TAG_CATEGORY_OPTIONS}
            onChange={(category) =>
              setQuery((current) => ({ ...current, category }))
            }
          />
          <Select
            allowClear
            placeholder="Seviye"
            options={SKILL_TAG_LEVEL_OPTIONS}
            onChange={(level) => setQuery((current) => ({ ...current, level }))}
          />
          <Select
            allowClear
            placeholder="Durum"
            options={[
              { value: "active", label: "Aktif" },
              { value: "passive", label: "Pasif" },
            ]}
            onChange={(value) =>
              setQuery((current) => ({
                ...current,
                isActive:
                  value === "active" ? true : value === "passive" ? false : undefined,
              }))
            }
          />
        </div>

        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={skillTags}
          pagination={false}
          locale={{
            emptyText: (
              <div className="learn-skill-tag-empty">
                <Tags size={22} />
                <span>Henüz beceri etiketi yok</span>
              </div>
            ),
          }}
          scroll={{ x: 920 }}
        />
      </Card>

      <SkillTagFormModal
        open={modal.open}
        skillTag={modal.skillTag}
        allTags={allTags?.data ?? skillTags}
        onClose={() => setModal({ open: false })}
      />
    </div>
  );
}
