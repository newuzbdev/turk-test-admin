import { Form, Input, InputNumber } from "antd";

const { TextArea } = Input;

const SectionsForm = () => {
  return (
    <>
      <Form.Item
        name="title"
        label="Bo'lim nomi"
        rules={[{ required: true, message: "Bo'lim nomini kiriting" }]}
      >
        <Input placeholder="Bo'lim nomini kiriting" size="middle" />
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
        name="partId"
        label="Qism ID"
        rules={[{ required: true, message: "Qism ID ni kiriting" }]}
      >
        <Input placeholder="Qism ID ni kiriting" size="middle" />
      </Form.Item>

      <Form.Item name="content" label="Mazmun">
        <TextArea
          placeholder="Bo'lim mazmunini kiriting"
          rows={4}
          size="middle"
        />
      </Form.Item>
    </>
  );
};

export default SectionsForm;
