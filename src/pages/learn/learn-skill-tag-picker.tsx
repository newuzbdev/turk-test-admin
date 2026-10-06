import { useEffect, useMemo, useState } from "react";
import { Button, Card, Empty, Select, Skeleton, Space, Tag, Typography } from "antd";
import { Save, Tags, X } from "lucide-react";
import {
  useLearnLessonSkillTags,
  useLearnQuestionSkillTags,
  useLearnSkillTags,
  useReplaceLearnLessonSkillTags,
  useReplaceLearnQuestionSkillTags,
} from "@/config/queries/learn";
import type {
  LearnExerciseQuestion,
  LearnLesson,
  LearnSkillTag,
  LearnSkillTagLink,
} from "./course-types";
import {
  buildSkillTagLinkPayload,
  formatSkillTagOptionLabel,
  mergeActiveTagsWithLinkedTags,
  SKILL_TAG_CATEGORY_COLORS,
  SKILL_TAG_CATEGORY_LABELS,
} from "./skill-tag-utils";

const { Title, Text, Paragraph } = Typography;

type SkillTagLinkEditorProps = {
  title: string;
  description: string;
  ownerId: string;
  links: LearnSkillTagLink[];
  linksLoading: boolean;
  tags: LearnSkillTag[];
  tagsLoading: boolean;
  isSaving: boolean;
  onSave: (skillTagIds: string[]) => void;
  onClose: () => void;
};

function SkillTagLinkEditor({
  title,
  description,
  ownerId,
  links,
  linksLoading,
  tags,
  tagsLoading,
  isSaving,
  onSave,
  onClose,
}: SkillTagLinkEditorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const options = useMemo(
    () => mergeActiveTagsWithLinkedTags(tags, links),
    [links, tags]
  );
  const activeTagIds = useMemo(
    () => new Set(tags.filter((tag) => tag.isActive).map((tag) => tag.id)),
    [tags]
  );

  useEffect(() => {
    setSelectedIds(
      links
        .filter((link) => link.skillTag.isActive)
        .map((link) => link.skillTagId)
    );
  }, [links, ownerId]);

  const linkedInactiveTags = links.filter((link) => !link.skillTag.isActive);

  return (
    <Card className="learn-skill-tag-panel">
      <div className="learn-skill-tag-panel-heading">
        <div>
          <Space size={8} wrap>
            <Title level={4}>{title}</Title>
            <Tag icon={<Tags size={13} />}>{links.length} etiket</Tag>
          </Space>
          <Paragraph type="secondary">{description}</Paragraph>
        </div>
        <Button icon={<X size={16} />} onClick={onClose}>
          Kapat
        </Button>
      </div>

      {linksLoading || tagsLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : !options.length ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Henüz SkillTag yok"
        />
      ) : (
        <div className="learn-skill-tag-editor-body">
          <Select
            mode="multiple"
            allowClear
            showSearch
            value={selectedIds}
            placeholder="Aktif SkillTag seçin"
            optionFilterProp="label"
            onChange={(nextIds) =>
              setSelectedIds(nextIds.filter((id) => activeTagIds.has(id)))
            }
            options={options.map((tag) => ({
              value: tag.id,
              label: formatSkillTagOptionLabel(tag),
              disabled: !tag.isActive,
            }))}
          />

          <div className="learn-skill-tag-preview">
            {selectedIds.length ? (
              options
                .filter((tag) => selectedIds.includes(tag.id))
                .map((tag) => (
                  <Tag
                    key={tag.id}
                    color={SKILL_TAG_CATEGORY_COLORS[tag.category]}
                  >
                    {tag.title}
                  </Tag>
                ))
            ) : (
              <Text type="secondary">Bu kayıt için aktif etiket seçilmedi.</Text>
            )}
          </div>

          {linkedInactiveTags.length > 0 && (
            <div className="learn-skill-tag-inactive">
              <Text type="secondary">Pasif bağlı etiketler:</Text>
              <Space size={6} wrap>
                {linkedInactiveTags.map((link) => (
                  <Tag key={link.id}>
                    {link.skillTag.title} ·{" "}
                    {SKILL_TAG_CATEGORY_LABELS[link.skillTag.category]}
                  </Tag>
                ))}
              </Space>
              <Text type="secondary">
                Kaydederseniz pasif etiketler bağlantıdan çıkarılır.
              </Text>
            </div>
          )}

          <div className="learn-skill-tag-actions">
            <Button
              type="primary"
              icon={<Save size={16} />}
              loading={isSaving}
              onClick={() => onSave(selectedIds)}
            >
              Etiketleri kaydet
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function LearnLessonSkillTagEditor({
  lesson,
  onClose,
}: {
  lesson: LearnLesson;
  onClose: () => void;
}) {
  const { data: tagsResponse, isLoading: tagsLoading } = useLearnSkillTags({
    isActive: true,
  });
  const { data: links = [], isLoading: linksLoading } =
    useLearnLessonSkillTags(lesson.id);
  const replaceLinks = useReplaceLearnLessonSkillTags();

  return (
    <SkillTagLinkEditor
      title="Ders SkillTag bağlantıları"
      description={`${lesson.title} dersi için konu ve beceri etiketlerini seçin.`}
      ownerId={lesson.id}
      links={links}
      linksLoading={linksLoading}
      tags={tagsResponse?.data ?? []}
      tagsLoading={tagsLoading}
      isSaving={replaceLinks.isPending}
      onSave={(skillTagIds) =>
        replaceLinks.mutate({
          lessonId: lesson.id,
          payload: buildSkillTagLinkPayload(skillTagIds),
        })
      }
      onClose={onClose}
    />
  );
}

export function LearnQuestionSkillTagEditor({
  question,
  onClose,
}: {
  question: LearnExerciseQuestion;
  onClose: () => void;
}) {
  const { data: tagsResponse, isLoading: tagsLoading } = useLearnSkillTags({
    isActive: true,
  });
  const { data: links = [], isLoading: linksLoading } =
    useLearnQuestionSkillTags(question.id);
  const replaceLinks = useReplaceLearnQuestionSkillTags();

  return (
    <SkillTagLinkEditor
      title="Soru SkillTag bağlantıları"
      description="Bu sorunun ölçtüğü konu ve becerileri seçin."
      ownerId={question.id}
      links={links}
      linksLoading={linksLoading}
      tags={tagsResponse?.data ?? []}
      tagsLoading={tagsLoading}
      isSaving={replaceLinks.isPending}
      onSave={(skillTagIds) =>
        replaceLinks.mutate({
          questionId: question.id,
          payload: buildSkillTagLinkPayload(skillTagIds),
        })
      }
      onClose={onClose}
    />
  );
}
