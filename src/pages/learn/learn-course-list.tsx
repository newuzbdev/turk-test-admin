import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Dropdown,
  Empty,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type MenuProps,
} from "antd";
import {
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useLearnCourses,
  useReorderLearnCourses,
  useUpdateLearnCourseStatus,
} from "@/config/queries/learn";
import type {
  LearnCourse,
  LearnLevel,
  LearnPublishStatus,
} from "./course-types";
import {
  buildCourseReorder,
  getAllowedCourseStatuses,
  getLearnLevelLabel,
  LEARN_LEVEL_OPTIONS,
  LEARN_STATUS_ACTION_LABELS,
  LEARN_STATUS_LABELS,
} from "./course-utils";

const { Title, Paragraph, Text } = Typography;

const STATUS_COLORS: Record<LearnPublishStatus, string> = {
  DRAFT: "default",
  PUBLISHED: "green",
  ARCHIVED: "orange",
};

export default function LearnCourseList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<LearnLevel>();
  const [status, setStatus] = useState<LearnPublishStatus>();
  const { data, isLoading, refetch } = useLearnCourses({ level, status });
  const updateStatus = useUpdateLearnCourseStatus();
  const reorderCourses = useReorderLearnCourses();

  const courses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data?.data ?? [];
    return (data?.data ?? []).filter((course) =>
      [course.title, course.slug, getLearnLevelLabel(course.level)]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [data?.data, search]);

  const statusMenu = (course: LearnCourse): MenuProps["items"] =>
    getAllowedCourseStatuses(course.status).map((nextStatus) => ({
      key: nextStatus,
      label: LEARN_STATUS_ACTION_LABELS[nextStatus],
      onClick: () =>
        updateStatus.mutate({ id: course.id, status: nextStatus }),
    }));

  const moveCourse = (course: LearnCourse, direction: "up" | "down") => {
    const items = buildCourseReorder(data?.data ?? [], course.id, direction);
    if (items) reorderCourses.mutate(items);
  };

  const canMove = (
    course: LearnCourse,
    direction: "up" | "down"
  ): boolean => Boolean(buildCourseReorder(data?.data ?? [], course.id, direction));

  return (
    <div className="learn-page">
      <div className="learn-page-heading">
        <div>
          <Title level={2}>Learn kursları</Title>
          <Paragraph type="secondary">
            Sıfırdan Başla ve CEFR seviyelerindeki kursların yayın akışını
            yönetin.
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => navigate("/learn/new")}
        >
          Yeni kurs
        </Button>
      </div>

      <Card className="learn-list-card">
        <div className="learn-list-toolbar">
          <Space wrap>
            <Input.Search
              allowClear
              value={search}
              placeholder="Kurs ara..."
              onChange={(event) => setSearch(event.target.value)}
              style={{ width: 280 }}
            />
            <Select
              allowClear
              value={level}
              placeholder="Tüm seviyeler"
              options={LEARN_LEVEL_OPTIONS}
              onChange={setLevel}
              style={{ width: 170 }}
            />
            <Select
              allowClear
              value={status}
              placeholder="Tüm durumlar"
              options={Object.entries(LEARN_STATUS_LABELS).map(
                ([value, label]) => ({ value, label })
              )}
              onChange={setStatus}
              style={{ width: 150 }}
            />
          </Space>
          <Button
            icon={<RefreshCw size={16} />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Yenile
          </Button>
        </div>

        <Table<LearnCourse>
          rowKey="id"
          loading={
            isLoading || updateStatus.isPending || reorderCourses.isPending
          }
          dataSource={courses}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          locale={{ emptyText: <Empty description="Henüz kurs yok" /> }}
          scroll={{ x: 980 }}
          columns={[
            {
              title: "Kurs",
              key: "course",
              render: (_, course) => (
                <div className="learn-course-name">
                  <Text strong>{course.title}</Text>
                  <Text type="secondary">{course.slug}</Text>
                </div>
              ),
            },
            {
              title: "Seviye",
              dataIndex: "level",
              width: 150,
              render: (value: LearnLevel) => (
                <Tag>{getLearnLevelLabel(value)}</Tag>
              ),
            },
            {
              title: "Durum",
              dataIndex: "status",
              width: 130,
              render: (value: LearnPublishStatus) => (
                <Tag color={STATUS_COLORS[value]}>
                  {LEARN_STATUS_LABELS[value]}
                </Tag>
              ),
            },
            {
              title: "Modül",
              width: 90,
              align: "center",
              render: (_, course) => course._count.modules,
            },
            {
              title: "Öne çıkan",
              dataIndex: "isFeatured",
              width: 110,
              render: (value: boolean) => (value ? "Evet" : "Hayır"),
            },
            {
              title: "Sıra",
              width: 112,
              render: (_, course) => (
                <Space size={4}>
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowUp size={15} />}
                    aria-label={`${course.title} kursunu yukarı taşı`}
                    disabled={!canMove(course, "up")}
                    onClick={() => moveCourse(course, "up")}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowDown size={15} />}
                    aria-label={`${course.title} kursunu aşağı taşı`}
                    disabled={!canMove(course, "down")}
                    onClick={() => moveCourse(course, "down")}
                  />
                </Space>
              ),
            },
            {
              title: "İşlem",
              width: 160,
              fixed: "right",
              render: (_, course) => (
                <Space size={4}>
                  <Button
                    type="text"
                    icon={<Pencil size={16} />}
                    onClick={() => navigate(`/learn/${course.id}/edit`)}
                  >
                    Düzenle
                  </Button>
                  <Dropdown
                    trigger={["click"]}
                    menu={{ items: statusMenu(course) }}
                  >
                    <Button
                      type="text"
                      icon={<MoreHorizontal size={17} />}
                      aria-label={`${course.title} durum işlemleri`}
                    />
                  </Dropdown>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
