import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Spin,
  Typography,
} from "antd";
import { useAddCoinsToUser, useSearchUser } from "@/config/queries/user-coin";
import type { SearchUserResponse } from "@/utils/types/types";

const { Title, Text } = Typography;

type SearchFormValues = {
  identifier: string;
};

type AddCoinsFormValues = {
  amount: number;
};

function normalizeUser(payload: SearchUserResponse | undefined | null) {
  if (!payload) return null;

  if (payload.data && typeof payload.data === "object") {
    return payload.data;
  }

  if (payload.user && typeof payload.user === "object") {
    return payload.user;
  }

  return payload;
}

export default function UserCoinPage() {
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [coinForm] = Form.useForm<AddCoinsFormValues>();
  const [searchedIdentifier, setSearchedIdentifier] = useState("");

  const {
    mutate: searchUser,
    data: searchResult,
    isPending: isSearching,
  } = useSearchUser();

  const {
    mutate: addCoins,
    isPending: isAddingCoins,
  } = useAddCoinsToUser();

  const user = useMemo(() => normalizeUser(searchResult), [searchResult]);

  const handleSearch = ({ identifier }: SearchFormValues) => {
    const trimmedIdentifier = identifier.trim();
    setSearchedIdentifier(trimmedIdentifier);
    searchUser(trimmedIdentifier);
  };

  const handleAddCoins = ({ amount }: AddCoinsFormValues) => {
    if (!searchedIdentifier) return;

    addCoins(
      {
        identifier: searchedIdentifier,
        amount,
      },
      {
        onSuccess: () => {
          coinForm.resetFields();
          searchUser(searchedIdentifier);
        },
      }
    );
  };

  return (
    <div className="admin-page">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>
            Öğrenci coin bakiyesi
          </Title>
          <Text type="secondary">
            Eski coin sistemindeki öğrenci bakiyesini görüntüleyip coin ekleyebilirsiniz.
          </Text>
        </div>

        <Card>
          <Form<SearchFormValues>
            form={searchForm}
            layout="vertical"
            onFinish={handleSearch}
          >
            <Row gutter={16} align="bottom">
              <Col xs={24} md={16}>
                <Form.Item
                  name="identifier"
                  label="Kullanıcı adı, Telegram ID veya telefon"
                  rules={[
                    { required: true, message: "Kullanıcı adı, Telegram ID veya telefon girin" },
                  ]}
                >
                  <Input placeholder="john_doe | 123456789 | +998901234567" allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={isSearching} block>
                    Öğrenci bul
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Spin spinning={isSearching}>
          <Card title="Öğrenci">
            {user ? (
              <Descriptions column={1} bordered size="middle">
                <Descriptions.Item label="ID">{user.id || "-"}</Descriptions.Item>
                <Descriptions.Item label="Kullanıcı adı">{user.username || "-"}</Descriptions.Item>
                <Descriptions.Item label="Telegram ID">{user.telegramId || "-"}</Descriptions.Item>
                <Descriptions.Item label="Telefon">{user.phoneNumber || user.phone || "-"}</Descriptions.Item>
                <Descriptions.Item label="Coin">{String(user.coin ?? user.coins ?? 0)}</Descriptions.Item>
                <Descriptions.Item label="Bakiye">
                  {String(user.balance ?? user.walletBalance ?? "-")}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Text type="secondary">Henüz öğrenci seçilmedi.</Text>
            )}
          </Card>
        </Spin>

        <Card title="Coin ekle">
          <Form<AddCoinsFormValues>
            form={coinForm}
            layout="vertical"
            onFinish={handleAddCoins}
            disabled={!searchedIdentifier || isAddingCoins}
          >
            <Row gutter={16} align="bottom">
              <Col xs={24} md={16}>
                <Form.Item
                  name="amount"
                  label="Coin sayısı"
                  rules={[
                    { required: true, message: "Coin sayısını girin" },
                    { type: "number", min: 1, message: "En az 1 coin girin" },
                  ]}
                >
                  <InputNumber min={1} style={{ width: "100%" }} placeholder="5" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={isAddingCoins} block>
                    Coin ekle
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </Space>
    </div>
  );
}
