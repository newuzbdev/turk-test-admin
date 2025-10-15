import { useMemo, useState } from "react";
import { Card, Table, Button, InputNumber, Modal, Form, Typography } from "antd";
import { useGetAllTestCoinPrices, useUpdateTestCoinPrice } from "@/config/queries/test-coin-price";
import type { TestCoinPrice } from "@/utils/types/types";

const { Title } = Typography;

export default function TestCoinPricePage() {
  const { data, isLoading, refetch } = useGetAllTestCoinPrices();
  const { mutate: updatePrice, isPending } = useUpdateTestCoinPrice();

  const [editItem, setEditItem] = useState<TestCoinPrice | null>(null);
  const [form] = Form.useForm();

  const items: TestCoinPrice[] = useMemo(() => {
    const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return raw;
  }, [data]);


  const columns = [
    { title: "Test Turi", dataIndex: "testType", key: "testType" },
    { title: "Coin", dataIndex: "coin", key: "coin", render: (v: number) => v?.toLocaleString() },
    { title: "Amal", key: "action", width: 160, render: (_: any, record: TestCoinPrice) => (
      <Button type="primary" onClick={() => onEdit(record)}>
        Coin yangilash
      </Button>
    )},
  ];

  const onEdit = (item: TestCoinPrice) => {
    setEditItem(item);
    form.setFieldsValue({ coin: item.coin });
  };

  const onSubmit = (values: { coin: number }) => {
    if (!editItem?.id) return;
    updatePrice({ id: editItem.id, coin: values.coin }, { onSuccess: () => {
      setEditItem(null);
      form.resetFields();
      refetch();
    }});
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>Test Coin Price</Title>
      <Card>
        <Table
          rowKey="id"
          columns={columns as any}
          dataSource={items}
          loading={isLoading}
          pagination={false}
        />
      </Card>

      <Modal
        open={!!editItem}
        onCancel={() => { setEditItem(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={isPending}
        title={editItem ? `${editItem.testType} coin yangilash` : "Coin yangilash"}
        okText="Yangilash"
        cancelText="Bekor qilish"
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="coin" label="Coin" rules={[{ required: true, message: "Coin kiriting" }]}>
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (Number(value!.replace(/\$\s?|(,*)/g, '')) || 0) as 0}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


