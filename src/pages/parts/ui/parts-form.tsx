import { Form, Input, InputNumber } from "antd";

const PartsForm = () => {
  return (
    <>
      <Form.Item
        name="title"
        label="Qism nomi"
        rules={[{ required: true, message: "Qism nomini kiriting" }]}
      >
        <Input placeholder="Qism nomini kiriting" size="middle" />
      </Form.Item>

      <Form.Item
        name="order"
        label="Tartib raqami"
        rules={[{ required: true, message: "Tartib raqamini kiriting" }]}
      >
        <InputNumber
          placeholder="Tartib raqamini kiriting"
          size="middle"
          min={1}
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item
        name="testId"
        label="Test ID"
        rules={[{ required: true, message: "Test ID ni kiriting" }]}
      >
        <Input placeholder="Test ID ni kiriting" size="middle" />
      </Form.Item>
    </>
  );
};

export default PartsForm;
