import { Typography } from "antd";
import ReadingPracticeTable from "./reading-practice-table";

const { Title, Paragraph } = Typography;

export default function ReadingPractice() {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 8 }}>
        Reading Practice
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        CEFR sınavından ayrı, öğrenme odaklı okuma pasajları ve sonuç açıklamaları
        bu bölümden yönetilir.
      </Paragraph>
      <ReadingPracticeTable />
    </div>
  );
}
