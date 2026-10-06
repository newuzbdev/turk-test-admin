import ContentAccessControls, { ManagedLegacyAccess } from "@/components/access/ContentAccessControls";
import type { AccessScope } from "@/config/queries/access";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosPrivate from "@/config/api";

export type PracticeAdminRow = {
  id: string;
  title: string;
  description?: string | null;
  level: string;
  sectionCode: string;
  coverImageUrl?: string | null;
  estimatedMinutes: number;
  isPublished: boolean;
  isFreeAccess: boolean;
};

type FormValue = Omit<PracticeAdminRow, "id">;

export type PracticeAdminEndpoints = {
  all: string;
  adminAll: string;
  one: (id: string) => string;
};

type Props = {
  title: string;
  singularLabel: string;
  endpoints: PracticeAdminEndpoints;
  editorPath: (id: string) => string;
  sectionOptions: Array<{ value: string; label: string }>;
  defaultMinutes: number;
};

const unwrapRows = (value: any): PracticeAdminRow[] => {
  const rows = value?.data?.data ?? value?.data ?? value ?? [];
  return Array.isArray(rows) ? rows : [];
};

export default function PracticeAdminList({
  title,
  singularLabel,
  endpoints,
  editorPath,
  sectionOptions,
  defaultMinutes,
}: Props) {
  const navigate = useNavigate();
  const accessScope = (`PRACTICE_${editorPath("").split("/")[1].split("-")[0].toUpperCase()}`) as AccessScope;
  const [form] = Form.useForm<FormValue>();
  const [rows, setRows] = useState<PracticeAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PracticeAdminRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await axiosPrivate.get<PracticeAdminRow[]>(endpoints.adminAll);
      setRows(unwrapRows(response));
    } catch {
      message.error(`${title} yüklenemedi.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [endpoints.adminAll]);

  const sectionLabel = useMemo(
    () => Object.fromEntries(sectionOptions.map((option) => [option.value, option.label])),
    [sectionOptions],
  );

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({
      title: "",
      description: "",
      level: "MULTILEVEL",
      sectionCode: sectionOptions[0].value,
      coverImageUrl: "",
      estimatedMinutes: defaultMinutes,
      isPublished: false,
      isFreeAccess: false,
    });
    setModalOpen(true);
  };

  const openEdit = (row: PracticeAdminRow) => {
    setEditing(row);
    form.setFieldsValue(row);
    setModalOpen(true);
  };

  const save = async () => {
    const value = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await axiosPrivate.patch(endpoints.one(editing.id), value);
      } else {
        const response = await axiosPrivate.post(endpoints.all, value);
        const created = response.data?.data ?? response.data;
        if (!created?.id) throw new Error("Oluşturulan pratik kimliği alınamadı.");
        message.success("Pratik oluşturuldu. İçeriğini şimdi hazırlayabilirsiniz.");
        setModalOpen(false);
        navigate(editorPath(created.id));
        return;
      }
      message.success("Pratik güncellendi.");
      setModalOpen(false);
      await load();
    } catch (error: any) {
      const detail =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Pratik kaydedilemedi.";
      message.error(String(detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main>
      <Card
        title={title}
        extra={
          <Button type="primary" onClick={openCreate}>
            Yeni bölüm pratiği
          </Button>
        }
      >
        <Typography.Paragraph type="secondary">
          Bu alanın kendi içeriği ve editörü vardır. Buradaki düzenlemeler diğer
          pratikleri veya mock testleri etkilemez.
        </Typography.Paragraph>
        <Table<PracticeAdminRow>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={false}
          columns={[
            { title: "Pratik", dataIndex: "title" },
            {
              title: "Bölüm",
              dataIndex: "sectionCode",
              render: (value) => sectionLabel[value] ?? value,
            },
            { title: "Seviye", dataIndex: "level", width: 120 },
            {
              title: "Durum",
              dataIndex: "isPublished",
              width: 120,
              render: (value) =>
                value ? <Tag color="green">Yayında</Tag> : <Tag>Taslak</Tag>,
            },
            {
              title: "İşlem",
              width: 260,
              render: (_, row) => (
                <Space wrap>
                  <ContentAccessControls target={{scope:accessScope,targetId:row.id}} row={row} onChanged={()=>void load()}/>
                  <Button size="small" onClick={() => openEdit(row)}>
                    Düzenle
                  </Button>
                  <Button size="small" onClick={() => navigate(editorPath(row.id))}>
                    İçeriği düzenle
                  </Button>
                  <Popconfirm
                    title="Bu pratiği silmek istiyor musunuz?"
                    onConfirm={async () => {
                      await axiosPrivate.delete(endpoints.one(row.id));
                      await load();
                    }}
                  >
                    <Button size="small" danger>
                      Sil
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={`${singularLabel} bölüm pratiği`}
        okText="Kaydet"
        cancelText="Vazgeç"
        confirmLoading={saving}
        onOk={() => void save()}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Pratik adı"
            rules={[{ required: true, message: "Pratik adı gerekli." }]}
          >
            <Input maxLength={160} />
          </Form.Item>
          <Space align="start" style={{ width: "100%" }} size={12}>
            <Form.Item
              name="sectionCode"
              label="Pratik bölümü"
              rules={[{ required: true }]}
              style={{ minWidth: 180 }}
            >
              <Select disabled={Boolean(editing)} options={sectionOptions} />
            </Form.Item>
            <Form.Item name="level" label="Seviye" style={{ minWidth: 150 }}>
              <Select
                options={["MULTILEVEL", "B1", "B2", "C1"].map((value) => ({
                  value,
                  label: value === "MULTILEVEL" ? "Multilevel" : value,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="estimatedMinutes"
              label="Başlangıç süresi"
              tooltip="Sayaç otomatik başlamaz; öğrenci başlatır."
            >
              <InputNumber min={1} max={180} addonAfter="dk" />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="Kısa açıklama">
            <Input.TextArea rows={3} maxLength={800} />
          </Form.Item>
          <Form.Item name="coverImageUrl" label="Kart görseli adresi">
            <Input placeholder="İsteğe bağlı" />
          </Form.Item>
          <Space size={24}>
            <Form.Item name="isPublished" label="Yayında" valuePropName="checked">
              <Switch />
            </Form.Item>
            <ManagedLegacyAccess target={{scope:accessScope,targetId:editing?.id}}>
            <Form.Item
              name="isFreeAccess"
              label="Aboneliksiz erişim"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            </ManagedLegacyAccess>
          </Space>
        </Form>
      </Modal>
    </main>
  );
}
