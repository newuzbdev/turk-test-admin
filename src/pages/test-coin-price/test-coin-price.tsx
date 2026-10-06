import { useMemo, useState } from "react";
import { Table, Button, InputNumber, Modal, Form, Typography } from "antd";
import type { TableColumnsType } from "antd";
import {
  useGetAllTestCoinPrices,
  useUpdateTestCoinPrice,
} from "@/config/queries/test-coin-price";
import type { TestCoinPrice } from "@/utils/types/types";

const { Title } = Typography;

export default function TestCoinPricePage() {
  const { data, isLoading, refetch } = useGetAllTestCoinPrices();
  const { mutate: updatePrice, isPending } = useUpdateTestCoinPrice();

  const [editItem, setEditItem] = useState<TestCoinPrice | null>(null);
  const [form] = Form.useForm();

  const items: TestCoinPrice[] = useMemo(() => {
    const raw = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];
    return raw;
  }, [data]);

  const columns: TableColumnsType<TestCoinPrice> = [
    {
      title: "Test türü",
      dataIndex: "testType",
      key: "testType",
      render: (value: string) =>
        ({
          READING: "Okuma",
          LISTENING: "Dinleme",
          WRITING: "Yazma",
          SPEAKING: "Konuşma",
          OVERALL: "Tam deneme",
          IELTS: "Tam deneme",
        })[value] || value,
    },
    {
      title: "Coin ücreti",
      dataIndex: "coin",
      key: "coin",
      render: (v: number) => v?.toLocaleString(),
    },
    {
      title: "İşlem",
      key: "action",
      width: 160,
      render: (_: unknown, record: TestCoinPrice) => (
        <Button onClick={() => onEdit(record)}>Düzenle</Button>
      ),
    },
  ];

  const onEdit = (item: TestCoinPrice) => {
    setEditItem(item);
    form.setFieldsValue({ coin: item.coin });
  };

  const onSubmit = (values: { coin: number }) => {
    if (!editItem?.id) return;
    updatePrice(
      { id: editItem.id, coin: values.coin },
      {
        onSuccess: () => {
          setEditItem(null);
          form.resetFields();
          refetch();
        },
      },
    );
  };

  return (
    <div className="admin-page">
      <Title level={2} style={{ marginBottom: 24 }}>
        Test coin ücretleri
      </Title>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        pagination={false}
      />

      <Modal
        open={!!editItem}
        onCancel={() => {
          setEditItem(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={isPending}
        title="Coin ücretini düzenle"
        okText="Güncelle"
        cancelText="Vazgeç"
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item
            name="coin"
            label="Coin"
            rules={[{ required: true, message: "Coin sayısını girin" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) =>
                (Number(value!.replace(/\$\s?|(,*)/g, "")) || 0) as 0
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
