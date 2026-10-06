import { Form, Input, Select } from "antd";
import { useGetAllIelts } from "@/config/queries/ielts/get-all.queries";

const ReadingForm = () => {
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
        rules={[{ required: true, message: "Test adını yazın" }]}
      >
        <Input placeholder="Örn. Millî sertifika okuma denemesi 1" size="middle" />
      </Form.Item>

      <Form.Item
        name="ieltsId"
        label="Mock test grubu"
        rules={[{ required: true, message: "Mock test grubunu seçin" }]}
      >
        <Select
          placeholder="Mock test grubunu seçin"
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

export default ReadingForm;
