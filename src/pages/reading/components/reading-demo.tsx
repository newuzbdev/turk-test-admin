import React from "react";
import { Card, Typography, Space, Button } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function ReadingDemo() {
  const sampleText = `Batıl inançlar, bilimsel bir temele dayanmayan, ancak birçok insanın günlük 
yaşamında etkili olan inanışlardır. Tarih boyunca insanlar, doğa olaylarını ve 
açıklayamadıkları durumları __________ (S1) güçlerle ilişkilendirmişlerdir. Bu inançlar, 
nesilden nesle aktarılmış ve bazıları günümüzde bile varlığını sürdürmektedir. 

En yaygın batıl inançlardan biri, kara kedinin önünden geçmesinin __________ (S2) 
getireceğine inanılmasıdır. Bunun kökeni Orta Çağ'a dayanır; o dönemde kara kedilerin 
cadılarla ilişkilendirildiği düşünülürdü. 

Batıl inançlar sadece kötü şansla ilgili değildir; bazıları iyi şans getirdiğine inanılan 
ritüelleri de içerir. Örneğin, nazar boncuğu takmak, kişiyi kötü enerjilerden koruduğuna 
inanılan yaygın bir gelenektir. Nazar inancı, eski Türk kültürüne dayansa da, günümüzde 
Türkiye'nin ________ (S3) birçok farklı kültürde de yaygındır. 

Batıl inançların insanlar üzerindeki etkisi oldukça __________ (S4). Özellikle 
önemli kararlar alınırken ya da yeni bir işe başlanırken bu inançlar dikkate alınabilir. 
Örneğin, yeni bir eve taşınmadan önce eve tuz dökmenin kötü ruhları uzaklaştıracağına 
inanılır. Benzer şekilde, merdiven altından geçmenin kötü şans getirdiğine dair inanış da 
hâlâ birçok insan tarafından dikkate alınmaktadır. 

Günümüzde bilimin ilerlemesiyle batıl inançların _______ (S5) alanı azalmış olsa 
da, bu ________ (S6) inançlar kültürel mirasın bir parçası olarak yaşamaya devam 
etmektedir. İnsanların açıklayamadıkları olaylara karşı geliştirdikleri bu inanışlar, zamanla 
toplumların kimliklerinin bir parçası hâline gelmiştir.`;

  const sampleOptions = [
    { letter: "A", text: "derin" },
    { letter: "B", text: "doğaüstü" },
    { letter: "C", text: "kademsizlik" },
    { letter: "D", text: "çeşit" },
    { letter: "E", text: "yanı sıra" },
    { letter: "F", text: "etki" },
    { letter: "G", text: "köylerinde" },
    { letter: "H", text: "yüzeysel" },
  ];

  return (
    <Card
      style={{
        maxWidth: 800,
        margin: "0 auto",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
      title={
        <div style={{ textAlign: "center" }}>
          <Title level={3} style={{ margin: 0 }}>
            Reading Test Demo
          </Title>
          <Text type="secondary">
            Bu demo'da qanday qilib Turkish matn bilan blank filling test yaratishni ko'rsatamiz
          </Text>
        </div>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={4}>📄 Matn (S1, S2, S3... bo'sh joylar bilan)</Title>
          <div
            style={{
              padding: 20,
              backgroundColor: "#f5f5f5",
              borderRadius: 8,
              border: "1px solid #d9d9d9",
              whiteSpace: "pre-wrap",
              lineHeight: 1.8,
              fontSize: 16,
            }}
          >
            {sampleText}
          </div>
        </div>

        <div>
          <Title level={4}>❓ Savollar va Variantlar</Title>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {[1, 2, 3, 4, 5, 6].map((blankNumber) => (
              <Card
                key={blankNumber}
                size="small"
                title={`S${blankNumber} uchun savol`}
                style={{ backgroundColor: "#fafafa" }}
              >
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <Text strong>To'g'ri javobni tanlang:</Text>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {sampleOptions.map((option) => (
                      <Button
                        key={option.letter}
                        style={{
                          textAlign: "left",
                          height: "auto",
                          padding: "8px 12px",
                          whiteSpace: "normal",
                        }}
                      >
                        {option.letter}. {option.text}
                      </Button>
                    ))}
                  </div>
                </Space>
              </Card>
            ))}
          </Space>
        </div>

        <div style={{ textAlign: "center", padding: 20, backgroundColor: "#e6f7ff", borderRadius: 8 }}>
          <Title level={4} style={{ color: "#1890ff", margin: 0 }}>
            🎯 Qanday ishlaydi?
          </Title>
          <Paragraph style={{ margin: "16px 0 0 0", fontSize: 16 }}>
            1. Matnni kiriting va bo'sh joylar uchun <Text code>(S1)</Text>, <Text code>(S2)</Text> formatini ishlating<br/>
            2. Avtomatik ravishda har bir bo'sh joy uchun savol yaratiladi<br/>
            3. Har bir savol uchun A dan H gacha variantlar qo'shing<br/>
            4. To'g'ri javobni tanlang va testni saqlang
          </Paragraph>
        </div>
      </Space>
    </Card>
  );
}
