import { ArchiveTable } from "./archive-table";
import { Typography } from "antd";
export default function Archive() {
  return <main className="admin-page"><Typography.Title level={2}>Arşiv</Typography.Title><ArchiveTable /></main>;
}
