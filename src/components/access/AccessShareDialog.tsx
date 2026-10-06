import { Alert, Button, Modal, Space, Table } from "antd";
import { useState } from "react";
import {
  accessWrite,
  useTargetAccess,
  type AccessTarget,
} from "@/config/queries/access";
import { accessEndpoints } from "@/config/endpoint";
import AccessGrantDialog from "./AccessGrantDialog";
import AccessRecordActions from "./AccessRecordActions";
import { copyExistingShare } from "./content-access-utils";
export default function AccessShareDialog({
  target,
  onClose,
  canCreate = true,
}: {
  target: AccessTarget;
  onClose: () => void;
  canCreate?: boolean;
}) {
  const [page, setPage] = useState(1);
  const query = useTargetAccess("share-links", target, true, page);
  const [create, setCreate] = useState(false);
  return (
    <>
      <Modal
        open
        width={900}
        title="Süreli ücretsiz bağlantılar"
        footer={null}
        onCancel={onClose}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Button disabled={!canCreate} onClick={() => setCreate(true)}>
            Yeni bağlantı
          </Button>
          <Space>
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Önceki bağlantılar
            </Button>
            <Button
              disabled={(query.data?.length ?? 0) < 25}
              onClick={() => setPage(page + 1)}
            >
              Sonraki bağlantılar
            </Button>
          </Space>
          {query.isError && (
            <Alert
              type="error"
              message="Bağlantılar yüklenemedi"
              action={
                <Button onClick={() => void query.refetch()}>
                  Yeniden dene
                </Button>
              }
            />
          )}
          <Table
            rowKey="id"
            loading={query.isLoading}
            dataSource={query.data}
            pagination={false}
            columns={[
              { title: "Durum", dataIndex: "state" },
              {
                title: "Bitiş (UTC+5)",
                render: (_, r) =>
                  new Date(r.endsAt).toLocaleString("tr-TR", {
                    timeZone: "Asia/Tashkent",
                  }),
              },
              { title: "Katılımcı", dataIndex: "redemptionCount" },
              {
                title: "Kullanım",
                render: (_, r) =>
                  Object.entries(r.usage ?? {})
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", "),
              },
              {
                title: "İşlem",
                render: (_, r) => (
                  <AccessRecordActions
                    kind="share"
                    record={r}
                    copy={() =>
                      copyExistingShare(
                        r.id,
                        (id) =>
                          accessWrite<{ url: string }>(
                            `${accessEndpoints.shares}/${id}/copy`,
                          ),
                        (url) => navigator.clipboard.writeText(url),
                      )
                    }
                  />
                ),
              },
            ]}
          />
        </Space>
      </Modal>
      {create && (
        <AccessGrantDialog
          target={target}
          kind="share"
          onClose={() => setCreate(false)}
        />
      )}
    </>
  );
}
