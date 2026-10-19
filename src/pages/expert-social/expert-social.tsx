import { useState } from 'react';
import { Alert, Button, Skeleton, Table } from 'antd';
import { RefreshCw } from 'lucide-react';
import { useExpertSocialSummary, type ExpertSocialPeriod, type ExpertSocialSummary } from '@/config/queries/expert-social';
import './expert-social.css';

const number = (value: number) => value.toLocaleString('tr-TR');
type Row = ExpertSocialSummary['items'][number];
const columns = [
  { title: 'Uzman', dataIndex: 'name', key: 'name' },
  { title: 'Telegram', dataIndex: 'telegram', key: 'telegram', align: 'right' as const, render: number },
  { title: 'Instagram', dataIndex: 'instagram', key: 'instagram', align: 'right' as const, render: (value: number | null) => value === null ? '—' : number(value) },
  { title: 'Toplam', dataIndex: 'total', key: 'total', align: 'right' as const, render: (value: number) => <strong>{number(value)}</strong> },
];

export default function ExpertSocial() {
  const [period, setPeriod] = useState<ExpertSocialPeriod>('all');
  const query = useExpertSocialSummary(period);
  const data = query.data;
  return (
    <main className="expert-social-page">
      <header className="expert-social-heading">
        <div>
          <h1>Uzman bağlantıları</h1>
          <p>Ana sayfadaki Telegram ve Instagram bağlantılarına yapılan tıklamalar.</p>
        </div>
        <div className="expert-social-controls">
          <label>
            <span>Tarih aralığı</span>
            <select aria-label="Tarih aralığı" value={period} onChange={event => setPeriod(event.target.value as ExpertSocialPeriod)}>
              <option value="all">Tüm zamanlar</option>
              <option value="today">Bugün</option>
              <option value="7d">Son 7 gün</option>
              <option value="30d">Son 30 gün</option>
            </select>
          </label>
          <Button icon={<RefreshCw size={15} />} loading={query.isFetching} onClick={() => void query.refetch()}>Yenile</Button>
        </div>
      </header>
      {query.isError ? (
        <Alert type="error" showIcon message="İstatistikler alınamadı." description="Bağlantıyı kontrol edip yeniden deneyin." />
      ) : query.isPending ? (
        <Skeleton active paragraph={{rows:4}} />
      ) : data ? (
        <section className="expert-social-card" aria-label="Uzman bağlantı tıklamaları">
          <div className="expert-social-total"><strong>{number(data.total)} tıklama</strong><span>Seçilen tarih aralığında</span></div>
          {data.total === 0 && <p className="expert-social-empty">Henüz kaydedilmiş tıklama yok.</p>}
          <Table<Row> columns={columns} dataSource={data.items} rowKey="expertId" pagination={false} scroll={{x:560}} />
        </section>
      ) : null}
      <p className="expert-social-note">Tıklamalar kanal katılımı veya benzersiz kişi sayısı değildir. Tarihler Özbekistan saatine göre gösterilir.</p>
    </main>
  );
}
