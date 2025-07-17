import { Form, Input, Select } from "antd";
import { useGetAllIelts } from "@/config/queries/ielts/get-all.queries";

const WritingForm = () => {
  const { data: ieltsData, isLoading: isIeltsLoading } = useGetAllIelts();

  const ieltsOptions = ieltsData?.data?.map((ielts) => ({
    label: ielts.title,
    value: ielts.id,
  })) || [];

  return (
    <>
      <Form.Item
        name="title"
        label="Test nomi"
        rules={[{ required: true, message: "Test nomini kiriting" }]}
      >
        <Input placeholder="Test nomini kiriting" size="middle" />
      </Form.Item>

      <Form.Item
        name="ieltsId"
        label="IELTS Test"
        rules={[{ required: true, message: "IELTS testini tanlang" }]}
      >
        <Select
          placeholder="IELTS testini tanlang"
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
