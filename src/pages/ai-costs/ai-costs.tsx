import {
  Alert,
  Card,
  Col,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  useAiCostSummary,
  type AiCostAggregate,
  type AiCostRecentRequest,
  type AiCostRecentTest,
} from "@/config/queries/ai-costs";

const { Title, Text } = Typography;

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatUsd(value: number | null | undefined) {
  return typeof value === "number" ? `$${value.toFixed(6)}` : "Bilinmiyor";
}

function aggregateRows(source: Record<string, AiCostAggregate> | undefined) {
  return Object.entries(source || {}).map(([name, row]) => ({ name, ...row }));
}

function formatCount(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("tr-TR");
}

function formatLatency(value: number | null | undefined) {
  if (typeof value !== "number") return "-";
  if (value < 1000) return `${value} ms`;
  return `${(value / 1000).toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} sn`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

const FEATURE_LABELS: Record<string, string> = {
  WRITING_FEEDBACK: "Yazma değerlendirmesi",
  SPEAKING_FEEDBACK: "Konuşma değerlendirmesi",
  SPEAKING_STT: "Konuşmayı yazıya çevirme",
  LEARN_AI_TEACHER: "Ders içi AI öğretmen",
  READING_WORD_EXPLAIN: "Okuma kelime açıklaması",
};

const SECTION_LABELS: Record<string, string> = {
  LISTENING: "Dinleme",
  READING: "Okuma",
  WRITING: "Yazma",
  SPEAKING: "Konuşma",
};

function formatBreakdownName(value: string) {
  return FEATURE_LABELS[value] || value.replace(":", " / ");
}

function renderStatus(status: AiCostRecentRequest["status"]) {
  const config = {
    SUCCESS: { color: "green", label: "Başarılı" },
    FAILED: { color: "red", label: "Hatalı" },
    DENIED: { color: "default", label: "Reddedildi" },
    FALLBACK: { color: "orange", label: "Yedek akış" },
  }[status];

  return <Tag color={config.color}>{config.label}</Tag>;
}

export default function AiCostsPage() {
  const now = new Date();
  const today = dateOnly(now);
  const monthStart = dateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));

  const todaySummary = useAiCostSummary(today, today, "today");
  const monthSummary = useAiCostSummary(monthStart, today, "month");
  const summary = monthSummary.data;
  const isLoading = todaySummary.isLoading || monthSummary.isLoading;

  const aggregateColumns = [
    {
      title: "Alan / model",
      dataIndex: "name",
      key: "name",
      render: formatBreakdownName,
    },
    {
      title: "Değerlendirme",
      dataIndex: "requestCount",
      key: "requestCount",
      render: formatCount,
    },
    {
      title: "Sağlayıcı çağrısı",
      dataIndex: "providerCallCount",
      key: "providerCallCount",
      render: formatCount,
    },
    {
      title: "Token",
      dataIndex: "totalTokens",
      key: "totalTokens",
      render: formatCount,
    },
    {
      title: "Ort. süre",
      dataIndex: "averageLatencyMs",
      key: "averageLatencyMs",
      render: formatLatency,
    },
    { title: "Başarılı", dataIndex: "successCount", key: "successCount" },
    { title: "Hatalı", dataIndex: "failedCount", key: "failedCount" },
    {
      title: "Tahmini maliyet",
      dataIndex: "estimatedCostUsd",
      key: "estimatedCostUsd",
      render: formatUsd,
    },
    {
      title: "Fiyat yok",
      dataIndex: "unpricedRequestCount",
      key: "unpricedRequestCount",
      render: formatCount,
    },
    { title: "Coin", dataIndex: "coinCostCharged", key: "coinCostCharged" },
  ];

  const topUserColumns = [
    { title: "User ID", dataIndex: "userId", key: "userId" },
    { title: "Değerlendirme", dataIndex: "requestCount", key: "requestCount" },
    {
      title: "Tahmini maliyet",
      dataIndex: "estimatedCostUsd",
      key: "estimatedCostUsd",
      render: formatUsd,
    },
    { title: "Coin", dataIndex: "coinCostCharged", key: "coinCostCharged" },
  ];

  const recentRequestColumns = [
    {
      title: "Zaman",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDateTime,
      width: 120,
    },
    {
      title: "İşlem",
      dataIndex: "feature",
      key: "feature",
      render: (value: string) => FEATURE_LABELS[value] || value,
      width: 190,
    },
    {
      title: "Model",
      key: "model",
      render: (_: unknown, row: AiCostRecentRequest) => (
        <Space direction="vertical" size={0}>
          <Text>{row.model}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.provider}
          </Text>
        </Space>
      ),
      width: 190,
    },
    {
      title: "Durum",
      dataIndex: "status",
      key: "status",
      render: renderStatus,
      width: 105,
    },
    {
      title: "Çağrı",
      dataIndex: "providerCallCount",
      key: "providerCallCount",
      render: formatCount,
      width: 75,
    },
    {
      title: "Token",
      dataIndex: "totalTokens",
      key: "totalTokens",
      render: formatCount,
      width: 95,
    },
    {
      title: "Süre",
      dataIndex: "latencyMs",
      key: "latencyMs",
      render: formatLatency,
      width: 90,
    },
    {
      title: "Tahmini maliyet",
      dataIndex: "estimatedCostUsd",
      key: "estimatedCostUsd",
      render: formatUsd,
      width: 125,
    },
    {
      title: "Deneme",
      dataIndex: "isRetry",
      key: "isRetry",
      render: (isRetry: boolean) =>
        isRetry ? <Tag color="gold">Tekrar deneme</Tag> : "İlk",
      width: 120,
    },
    {
      title: "Hata kodu",
      dataIndex: "errorCode",
      key: "errorCode",
      render: (value: string | null) => value || "-",
      width: 160,
    },
  ];

  const recentTestColumns = [
    {
      title: "Tamamlanma",
      dataIndex: "completedAt",
      key: "completedAt",
      render: formatDateTime,
      width: 130,
    },
    {
      title: "Kullanıcı",
      key: "userLabel",
      render: (_: unknown, row: AiCostRecentTest) => (
        <Space direction="vertical" size={0}>
          <Text>{row.userLabel}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.userId}
          </Text>
        </Space>
      ),
      width: 190,
    },
    {
      title: "Değerlendirilen bölüm",
      dataIndex: "sections",
      key: "sections",
      render: (sections: AiCostRecentTest["sections"]) => (
        <Space wrap size={[4, 4]}>
          {sections.map((section) => (
            <Tag key={section}>{SECTION_LABELS[section] || section}</Tag>
          ))}
        </Space>
      ),
      width: 250,
    },
    {
      title: "Sağlayıcı çağrısı",
      dataIndex: "providerCallCount",
      key: "providerCallCount",
      render: formatCount,
      width: 120,
    },
    {
      title: "OpenAI",
      dataIndex: "openAiCostUsd",
      key: "openAiCostUsd",
      render: formatUsd,
      width: 115,
    },
    {
      title: "Gemini",
      dataIndex: "geminiCostUsd",
      key: "geminiCostUsd",
      render: formatUsd,
      width: 115,
    },
    {
      title: "Deepgram",
      dataIndex: "deepgramCostUsd",
      key: "deepgramCostUsd",
      render: formatUsd,
      width: 115,
    },
    {
      title: "Test maliyeti",
      dataIndex: "totalCostUsd",
      key: "totalCostUsd",
      render: (_: unknown, row: AiCostRecentTest) =>
        row.costStatus === "VERIFIED" ? (
          <Text strong>{formatUsd(row.totalCostUsd)}</Text>
        ) : (
          <Text type="warning">Tam maliyet alınamadı</Text>
        ),
      width: 180,
    },
    {
      title: "Durum",
      dataIndex: "costStatus",
      key: "costStatus",
      render: (status: AiCostRecentTest["costStatus"]) =>
        status === "VERIFIED" ? (
          <Tag color="green">Doğrulanmış</Tag>
        ) : (
          <Tag color="orange">Eksik sağlayıcı kaydı</Tag>
        ),
      width: 170,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>
            AI kullanımı ve maliyetleri
          </Title>
          <Text type="secondary">
            Yazma ve konuşma değerlendirmelerinin test başına doğrulanmış
            maliyeti.
          </Text>
        </div>

        <Alert
          type="info"
          showIcon
          message="Yazma ve konuşma değerlendirme maliyetleri"
          description="OpenAI ve Gemini tutarları raporlanan token kullanımı ile yayınlanmış model tarifesinden tahmin edilir. Gemini düşünme ve onarım çağrıları da hesaba katılır. Konuşmayı yazıya çeviren Deepgram tutarı sağlayıcının istek bazlı USD kaydından alınır. Soru okuma sesi bu maliyete dahil değildir. Zorunlu bir kayıt eksikse test toplamı gösterilmez."
        />

        {(todaySummary.isError || monthSummary.isError) && (
          <Alert
            type="error"
            showIcon
            message="AI kullanım verileri yüklenemedi"
            description="Yerel servisleri kontrol edip sayfayı yeniden deneyin."
          />
        )}

        <Spin spinning={isLoading}>
          <Card title="Yazma ve konuşma değerlendirme maliyetleri">
            <Table
              rowKey="overallTestId"
              columns={recentTestColumns}
              dataSource={summary?.recentTests || []}
              pagination={{ pageSize: 20, hideOnSinglePage: true }}
              size="small"
              scroll={{ x: 1270 }}
            />
          </Card>

          <Title level={4} style={{ marginTop: 24, marginBottom: 12 }}>
            Operasyonel kullanım özeti
          </Title>

          <Row gutter={[16, 16]}>
            <Col xs={12} md={8} xl={6}>
              <Card>
                <Statistic
                  title="Bugünkü bilinen maliyet"
                  value={formatUsd(todaySummary.data?.totalEstimatedCostUsd)}
                />
              </Card>
            </Col>
            <Col xs={12} md={8} xl={6}>
              <Card>
                <Statistic
                  title="Bu ay bilinen maliyet"
                  value={formatUsd(summary?.totalEstimatedCostUsd)}
                />
              </Card>
            </Col>
            <Col xs={12} md={8} xl={6}>
              <Card>
                <Statistic
                  title="Değerlendirmeler"
                  value={formatCount(summary?.requestCount)}
                />
              </Card>
            </Col>
            <Col xs={12} md={8} xl={6}>
              <Card>
                <Statistic
                  title="Sağlayıcı çağrıları"
                  value={formatCount(summary?.providerCallCount)}
                />
              </Card>
            </Col>
            <Col xs={12} md={8} xl={6}>
              <Card>
                <Statistic
                  title="Toplam token"
                  value={formatCount(summary?.totalTokens)}
                />
              </Card>
            </Col>
            <Col xs={12} md={8} xl={6}>
              <Card>
                <Statistic
                  title="Ortalama süre"
                  value={formatLatency(summary?.averageLatencyMs)}
                />
              </Card>
            </Col>
            <Col xs={12} md={8} xl={6}>
              <Card>
                <Statistic
                  title="Başarısız değerlendirme"
                  value={summary?.failedCount ?? 0}
                />
              </Card>
            </Col>
            <Col xs={12} md={8} xl={6}>
              <Card>
                <Statistic
                  title="Tahsil edilen coin"
                  value={summary?.totalCoinCostCharged ?? 0}
                />
              </Card>
            </Col>
            <Col xs={12} md={8} xl={6}>
              <Card>
                <Statistic
                  title="Fiyatı bilinmeyen kayıt"
                  value={formatCount(summary?.unpricedRequestCount)}
                />
              </Card>
            </Col>
          </Row>

          <Space wrap style={{ marginTop: 16 }}>
            <Text type="secondary">
              OpenAI: {formatUsd(summary?.totalOpenAiEstimatedCostUsd)}
            </Text>
            <Text type="secondary">
              Gemini: {formatUsd(summary?.totalGeminiEstimatedCostUsd)} · Deepgram: {formatUsd(summary?.totalDeepgramEstimatedCostUsd)}
            </Text>
          </Space>

          <Card title="İşlem kırılımı" style={{ marginTop: 16 }}>
            <Table
              rowKey="name"
              columns={aggregateColumns}
              dataSource={aggregateRows(summary?.byFeature)}
              pagination={false}
              size="small"
              scroll={{ x: 980 }}
            />
          </Card>

          <Card title="Model kırılımı" style={{ marginTop: 16 }}>
            <Table
              rowKey="name"
              columns={aggregateColumns}
              dataSource={aggregateRows(summary?.byModel)}
              pagination={false}
              size="small"
              scroll={{ x: 980 }}
            />
          </Card>

          <Card title="Sağlayıcı kırılımı" style={{ marginTop: 16 }}>
            <Table
              rowKey="name"
              columns={aggregateColumns}
              dataSource={aggregateRows(summary?.byProvider)}
              pagination={false}
              size="small"
              scroll={{ x: 980 }}
            />
          </Card>

          <Card title="Son AI değerlendirmeleri" style={{ marginTop: 16 }}>
            <Table
              rowKey="id"
              columns={recentRequestColumns}
              dataSource={summary?.recentRequests || []}
              pagination={{ pageSize: 20, hideOnSinglePage: true }}
              size="small"
              scroll={{ x: 1270 }}
            />
          </Card>

          <Card
            title="En yüksek tahmini maliyetli kullanıcılar"
            style={{ marginTop: 16 }}
          >
            <Table
              rowKey="userId"
              columns={topUserColumns}
              dataSource={summary?.topUsersByEstimatedCost || []}
              pagination={false}
              size="small"
              scroll={{ x: 640 }}
            />
          </Card>
        </Spin>
      </Space>
    </div>
  );
}
