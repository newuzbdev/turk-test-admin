import { useGetWritingTests } from "../../config/querys/writing-query";
import { Button, Card, Layout, Typography, Table, Space, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
const { Title } = Typography;
const { Content } = Layout;
export default function writing() {
    const { data, isLoading } = useGetWritingTests(1, 10);
    console.log(data);

    return (
        <Layout>
            <Content>
                <Card
                    style={{
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        border: "none",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "24px",
                        }}
                    >
                        <Title level={3}>📖 Writing Testlar</Title>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            style={{
                                borderRadius: "8px",
                                borderColor: "#10b981",
                                height: "44px",
                                paddingLeft: "20px",
                                paddingRight: "20px",
                            }}
                        // onClick={() => {
                        //     setEditingTest(null);
                        //     setIsModalOpen(true);
                        // }}
                        >
                            Yangi Writing Yaratish
                        </Button>
                    </div>

                    {/* <Table
                        rowKey="id"
                        loading={isLoading}
                        dataSource={readingData}
                        columns={columns}
                        pagination={{
                            current: page,
                            pageSize: limit,
                            total: data?.total || 0,
                            onChange: setPage,
                            showSizeChanger: false,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} / ${total} ta test`,
                        }}
                    /> */}
                </Card>
                {/* 
                <Modal
                    open={deleteModalOpen}
                    title="Ishonchingiz komilmi?"
                    onCancel={() => setDeleteModalOpen(false)}
                    onOk={() => {
                        if (deleteTestId) {
                            deleteMutation.mutate(deleteTestId, {
                                onSuccess: () => {
                                    setDeleteModalOpen(false);
                                    setDeleteTestId(null);
                                },
                            });
                        }
                    }}
                    okText="Ha, o'chirish"
                    cancelText="Bekor qilish"
                >
                    <p>Bu amalni bekor qilib bo'lmaydi.</p>
                </Modal> */}

                {/* <Modal
                    title={null}
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    footer={null}
                    width={1400}
                    style={{ top: 20 }}
                    bodyStyle={{ padding: 0 }}
                >
                    <ReadingForm
                        initialData={
                            editingTest
                                ? {
                                    title: editingTest.title,
                                    type: editingTest.type,
                                    ieltsId: editingTest.ieltsId,
                                    parts: editingTest.parts.map(
                                        ({ number, title, sections }) => ({
                                            number,
                                            title,
                                            sections,
                                        })
                                    ),
                                }
                                : undefined
                        }
                        onSubmit={handleSubmit}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal> */}
            </Content>
        </Layout>
    )
}
