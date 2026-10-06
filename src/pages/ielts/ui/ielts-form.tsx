import { Form, Input, Select } from "antd";
import { mockPackageCategories } from "../mock-package-category";

const IeltsForm = () => (
  <>
    <Form.Item
      name="title"
      label="Paket adı"
      rules={[{ required: true, message: "Paket adını girin" }]}
    >
      <Input placeholder="Örneğin: Deneme Sınavı 1" size="middle" />
    </Form.Item>
    <Form.Item
      name="category"
      label="Öğrenci uygulamasındaki sekme"
      initialValue="CEFR_MOCK"
      rules={[{ required: true, message: "Sekme seçin" }]}
    >
      <Select options={mockPackageCategories} />
    </Form.Item>
  </>
);

export default IeltsForm;
