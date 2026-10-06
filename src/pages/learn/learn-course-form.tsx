import { useEffect } from "react";
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Select,
  Skeleton,
  Space,
  Typography,
} from "antd";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateLearnCourse,
  useLearnCourse,
  useUpdateLearnCourse,
} from "@/config/queries/learn";
import type { LearnCourseFormValues } from "./course-types";
import { LEARN_LEVEL_OPTIONS } from "./course-utils";
import LearnCourseStructure from "./learn-course-structure";

const { Title, Paragraph } = Typography;

export default function LearnCourseForm() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEditing = Boolean(courseId);
  const [form] = Form.useForm<LearnCourseFormValues>();
  const { data: course, isLoading } = useLearnCourse(courseId);
  const createCourse = useCreateLearnCourse();
  const updateCourse = useUpdateLearnCourse();
  const isPending = createCourse.isPending || updateCourse.isPending;

  useEffect(() => {
    if (!course) return;
    form.setFieldsValue({
      slug: course.slug,
      title: course.title,
      description: course.description ?? undefined,
      level: course.level,
      thumbnailUrl: course.thumbnailUrl ?? undefined,
      isFeatured: course.isFeatured,
    });
  }, [course, form]);

  const submit = (values: LearnCourseFormValues) => {
    const payload = {
      ...values,
      description: values.description?.trim() ?? "",
      thumbnailUrl: values.thumbnailUrl?.trim() ?? "",
    };

    if (courseId) {
      updateCourse.mutate(
        { id: courseId, values: payload },
        { onSuccess: () => navigate("/learn") }
      );
      return;
    }

    createCourse.mutate(payload, {
      onSuccess: (created) => navigate(`/learn/${created.id}/edit`),
    });
  };

  if (isEditing && isLoading) {
    return (
      <Card className="learn-form-card">
        <Skeleton active paragraph={{ rows: 7 }} />
      </Card>
    );
  }

  return (
    <div className="learn-page">
      <div className="learn-page-heading">
        <div>
          <Title level={2}>
            {isEditing ? "Kursu düzenle" : "Yeni kurs"}
          </Title>
          <Paragraph type="secondary">
            Kursun öğrenci tarafında görünen temel bilgilerini yönetin.
          </Paragraph>
        </div>
        <Button icon={<ArrowLeft size={16} />} onClick={() => navigate("/learn")}>
          Kurslara dön
        </Button>
      </div>

      <Card className="learn-form-card">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            level: "STARTER",
            isFeatured: false,
          }}
          onFinish={submit}
          requiredMark="optional"
        >
          <div className="learn-form-grid">
            <Form.Item
              name="title"
              label="Kurs adı"
              rules={[
                { required: true, message: "Kurs adını girin" },
                { whitespace: true, message: "Kurs adı boş olamaz" },
              ]}
            >
              <Input placeholder="Örn. A1 Türkçe" />
            </Form.Item>

            <Form.Item
              name="slug"
              label="URL anahtarı"
              extra="Küçük harf, sayı ve kısa çizgi kullanın."
              rules={[
                { required: true, message: "URL anahtarını girin" },
                {
                  pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                  message: "Örn. a1-turkce",
                },
              ]}
            >
              <Input placeholder="a1-turkce" />
            </Form.Item>

            <Form.Item
              name="level"
              label="Seviye"
              rules={[{ required: true, message: "Seviye seçin" }]}
            >
              <Select options={LEARN_LEVEL_OPTIONS} />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Açıklama">
            <Input.TextArea
              rows={4}
              placeholder="Kursun kapsamını kısa ve net biçimde açıklayın."
            />
          </Form.Item>

          <Form.Item name="thumbnailUrl" label="Kapak görseli URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="isFeatured" valuePropName="checked">
            <Checkbox>Öne çıkan kurs olarak göster</Checkbox>
          </Form.Item>

          <div className="learn-form-actions">
            <Space>
              <Button onClick={() => navigate("/learn")} disabled={isPending}>
                Vazgeç
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isPending}
                icon={<Save size={16} />}
              >
                {isEditing ? "Değişiklikleri kaydet" : "Kursu oluştur"}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>

      {courseId && <LearnCourseStructure courseId={courseId} />}
    </div>
  );
}
