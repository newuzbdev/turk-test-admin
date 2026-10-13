import { Tag, Tooltip, Typography } from "antd";
import type { StudentIdentity } from "@/config/queries/students";
import {
  registrationLocation,
  registrationMethodLabel,
  registrationSourceLabel,
} from "./student-origin-labels";
export default function StudentOriginSummary({
  student,
}: {
  student?: StudentIdentity;
}) {
  return (
    <dl className="student-origin-summary">
      <div>
        <dt>
          <Tooltip title="Katılım sırasındaki ağ bilgisine göre yaklaşık ülke ve şehir. VPN sonucu etkileyebilir.">
            <span>Katılım yeri ⓘ</span>
          </Tooltip>
        </dt>
        <dd>{registrationLocation(student?.registrationOrigin)}</dd>
      </div>
      <div>
        <dt>Kayıt yöntemi</dt>
        <dd>
          <Tag>{registrationMethodLabel(student?.signupMethod)}</Tag>
        </dd>
      </div>
      <div>
        <dt>Bağlantı kaynağı</dt>
        <dd>
          {registrationSourceLabel(student?.registrationOrigin)}
          {student?.registrationOrigin?.campaign && (
            <Typography.Text
              type="secondary"
              className="student-origin-campaign"
            >
              {student.registrationOrigin.campaign}
            </Typography.Text>
          )}
        </dd>
      </div>
    </dl>
  );
}
