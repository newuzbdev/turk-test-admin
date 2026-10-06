import { Form, Input, Select } from "antd";
import { useGetAllIelts } from "@/config/queries/ielts/get-all.queries";

const WritingForm = () => {
  const { data: ieltsData, isLoading: isIeltsLoading } = useGetAllIelts();

  const ieltsOptions = ieltsData?.ieltsData?.map((ielts) => ({
    label: ielts.title,
    value: ielts.id,
  })) || [];

  return (
    <>
      <Form.Item
        name="title"
        label="Test adı"
        rules={[{ required: true, message: "Test adını girin" }]}
      >
        <Input placeholder="Örneğin: Yazma Deneme 1" size="middle" />
      </Form.Item>

      <Form.Item
        name="ieltsId"
        label="Sınav paketi"
        rules={[{ required: true, message: "Sınav paketini seçin" }]}
      >
        <Select
          placeholder="Sınav paketini seçin"
          size="middle"
          loading={isIeltsLoading}
          options={ieltsOptions}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>
    </>
  );
};

export default WritingForm;
