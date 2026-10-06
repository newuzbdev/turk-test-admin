import ContentAccessControls from "@/components/access/ContentAccessControls";
import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  useDeleteReadingPractice,
  useGetAllReadingPractice,
} from "@/config/queries/reading-practice";
import type { ReadingPracticeListItem } from "@/utils/types/types";
import {
  buildReadingPracticeListQuery,
  getReadingPracticeLevelLabel,
  READING_PRACTICE_LEVEL_OPTIONS,
  READING_PRACTICE_SECTION_OPTIONS,
  type ReadingPracticeLevelFilter,
  type ReadingPracticeSectionFilter,
} from "./reading-practice-filters";

const { Search } = Input;

export default function ReadingPracticeTable() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [levelFilter, setLevelFilter] =
    useState<ReadingPracticeLevelFilter>("ALL");
  const [sectionFilter, setSectionFilter] =
    useState<ReadingPracticeSectionFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const query = useMemo(
    () =>
      buildReadingPracticeListQuery({
        searchText,
        level: levelFilter,
        section: sectionFilter,
        page: currentPage,
        limit: 10,
      }),
    [currentPage, levelFilter, searchText, sectionFilter],
  );
  const { data, isLoading, isFetching, refetch } =
    useGetAllReadingPractice(query);
  const { mutate: deletePassage, isPending: isDeleting } =
    useDeleteReadingPractice();


  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="Pasaj ara..."
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setCurrentPage(1);
            }}
            style={{ width: 320 }}
            allowClear
          />
          <Select<ReadingPracticeLevelFilter>
            aria-label="Seviye filtresi"
            value={levelFilter}
            options={[...READING_PRACTICE_LEVEL_OPTIONS]}
            onChange={(value) => {
              setLevelFilter(value);
              setCurrentPage(1);
            }}
            style={{ width: 160 }}
          />
          <Select<ReadingPracticeSectionFilter>
            aria-label="Bölüm filtresi"
            value={sectionFilter}
            options={[...READING_PRACTICE_SECTION_OPTIONS]}
            onChange={(value) => {
              setSectionFilter(value);
              setCurrentPage(1);
            }}
            style={{ width: 160 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/reading-practice/section/new")}
          >
            Bölüm pratiği ekle
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => navigate("/reading-practice/new")}
          >
            Kapsamlı metin ekle
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Yenile
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={isLoading || isFetching || isDeleting}
        dataSource={data?.data ?? []}
        pagination={{
          current: currentPage,
          pageSize: 10,
          total: data?.total ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `${total} pratik`,
        }}
        onChange={(pagination) => setCurrentPage(pagination.current || 1)}
        scroll={{ x: 1000 }}
        columns={[
          {
            title: "Başlık",
            dataIndex: "title",
            key: "title",
            render: (_, record: ReadingPracticeListItem) => (
              <div>
                <div style={{ fontWeight: 600 }}>{record.title}</div>
                {record.passageTitle && (
                  <div style={{ color: "#666", marginTop: 4 }}>
                    {record.passageTitle}
                  </div>
                )}
              </div>
            ),
          },
          {
            title: "Seviye",
            dataIndex: "level",
            key: "level",
            width: 110,
            render: (value: string) => getReadingPracticeLevelLabel(value),
          },
          {
            title: "Tür",
            key: "practiceType",
            width: 180,
            render: (_, record: ReadingPracticeListItem) =>
              record.practiceType === "SECTION" ? (
                <Tag color="blue">Bölüm {record.sectionNumber}</Tag>
              ) : (
                <Tag>Kapsamlı</Tag>
              ),
          },
          {
            title: "Durum",
            dataIndex: "isPublished",
            key: "isPublished",
            width: 210,
            render: (value: boolean, record: ReadingPracticeListItem) => (
              <Space size={4} wrap>
                {value ? <Tag color="green">Yayında</Tag> : <Tag>Taslak</Tag>}
                {record.isFreeAccess ? <Tag color="blue">Aboneliksiz</Tag> : null}
              </Space>
            ),
          },
          {
            title: "Sorular",
            dataIndex: "questionCount",
            key: "questionCount",
            width: 110,
          },
          {
            title: "Sözlük",
            dataIndex: "glossaryCount",
            key: "glossaryCount",
            width: 110,
          },
          {
            title: "Çözüm",
            dataIndex: "attemptCount",
            key: "attemptCount",
            width: 110,
          },
          {
            title: "İşlem",
            key: "actions",
            width: 330,
            render: (_, record: ReadingPracticeListItem) => (
              <Space>
                <Button
                  onClick={() => navigate(
                    record.practiceType === "SECTION"
                      ? `/reading-practice/${record.id}/section-edit`
                      : `/reading-practice/${record.id}/edit`,
                  )}
                >
                  Düzenle
                </Button>
                <ContentAccessControls target={{scope:"PRACTICE_READING",targetId:record.id}} row={record}/>
                <Popconfirm
                  title="Bu passage silinsin mi?"
                  okText="Sil"
                  cancelText="Vazgeç"
                  onConfirm={() => deletePassage(record.id)}
                >
                  <Button danger>Sil</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
