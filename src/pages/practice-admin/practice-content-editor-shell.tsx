import ContentAccessControls from "@/components/access/ContentAccessControls";
import type { AccessScope } from "@/config/queries/access";
import { Alert, Button, Card, Space, Spin, Tag, Typography, message } from "antd";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import axiosPrivate from "@/config/api";

export type PracticeEditorDetail = {
  id: string;
  title: string;
  sectionCode: string;
  isPublished: boolean;
  content: any;
};

type Props = {
  domainLabel: string;
  listPath: string;
  adminOne: (id: string) => string;
  contentEndpoint: (id: string) => string;
  sectionLabel: (code: string) => string;
  children: (input: {
    practice: PracticeEditorDetail;
    content: any;
    onChange: (content: any) => void;
  }) => React.ReactNode;
};

const unwrapOne = (response: any): PracticeEditorDetail =>
  response?.data?.data ?? response?.data ?? response;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export default function PracticeContentEditorShell({
  domainLabel,
  listPath,
  adminOne,
  contentEndpoint,
  sectionLabel,
  children,
}: Props) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [practice, setPractice] = useState<PracticeEditorDetail | null>(null);
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axiosPrivate
      .get(adminOne(id))
      .then((response) => {
        if (!mounted) return;
        const next = unwrapOne(response);
        setPractice(next);
        setContent(clone(next.content));
      })
      .catch((reason) => {
        if (!mounted) return;
        setError(
          String(reason?.response?.data?.message || "Pratik içeriği yüklenemedi."),
        );
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [adminOne, id]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const changeContent = (next: any) => {
    setContent(next);
    setDirty(true);
  };

  const save = async () => {
    if (!practice || !content || saving) return;
    setSaving(true);
    try {
      const response = await axiosPrivate.patch(contentEndpoint(practice.id), {
        content,
      });
      const saved = unwrapOne(response);
      setContent(clone(saved.content));
      setDirty(false);
      message.success(`${domainLabel} pratiği içeriği kaydedildi.`);
    } catch (reason: any) {
      message.error(
        String(reason?.response?.data?.message || "Pratik içeriği kaydedilemedi."),
      );
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (dirty && !window.confirm("Kaydedilmemiş değişiklikler silinsin mi?")) return;
    navigate(listPath);
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }
  if (!practice || !content) {
    return (
      <main className="p-6">
        <Alert type="error" showIcon message={error || "Pratik bulunamadı."} />
      </main>
    );
  }

  return (
    <main className="min-h-full bg-neutral-50 p-5 md:p-7">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              aria-label={`${domainLabel} pratiklerine dön`}
              icon={<ArrowLeft size={17} />}
              onClick={goBack}
            />
            <div>
              <Space size={8} wrap>
                <Typography.Title level={2} style={{ margin: 0 }}>
                  {practice.title}
                </Typography.Title>
                <Tag>{domainLabel}</Tag>
                <Tag>{sectionLabel(practice.sectionCode)}</Tag>
                {practice.isPublished ? (
                  <Tag color="green">Yayında</Tag>
                ) : (
                  <Tag>Taslak</Tag>
                )}
              </Space>
              <Typography.Paragraph type="secondary" style={{ margin: "6px 0 0" }}>
                Bu editör yalnız {domainLabel.toLocaleLowerCase("tr-TR")} pratiğini
                değiştirir.
              </Typography.Paragraph>
            </div>
          </div>
          <Button
            type="primary"
            icon={<Save size={16} />}
            loading={saving}
            disabled={!dirty}
            onClick={() => void save()}
          >
            Kaydet
          </Button>
        </header>

        <ContentAccessControls target={{scope:(`PRACTICE_${listPath.split("/")[1].split("-")[0].toUpperCase()}`) as AccessScope,targetId:practice.id}} row={practice}/>
        <Card>{children({ practice, content, onChange: changeContent })}</Card>
      </div>
    </main>
  );
}
