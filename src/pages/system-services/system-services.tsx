import { useState } from "react";
import { Alert, Button, Input, Skeleton } from "antd";
import {
  ArrowRight,
  AudioLines,
  BrainCircuit,
  CircleHelp,
  Database,
  KeyRound,
  Mail,
  RefreshCw,
  Search,
  Wallet,
  Server,
  Music,
  Archive,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useSystemServices,
  systemServicesErrorMessage,
  type ServiceCategory,
  type ServiceStatus,
} from "@/config/queries/system-services";
import "./system-services.css";

const categories = [
  { id: "ai", label: "Yapay zekâ", icon: BrainCircuit },
  { id: "access", label: "Giriş", icon: KeyRound },
  { id: "storage", label: "Veri ve dosyalar", icon: Database },
  { id: "payments", label: "Ödeme", icon: Wallet },
  { id: "notifications", label: "Bildirimler", icon: Mail },
  { id: "media", label: "Video ve sesler", icon: Music },
  { id: "platform", label: "Uygulama", icon: Server },
  { id: "legacy", label: "Eski bağlantılar", icon: Archive },
] as const;
const statuses: Record<ServiceStatus, string> = {
  configured: "Ayarlar mevcut",
  missing: "Ayar eksik",
  disabled: "Devre dışı",
  internal: "Sistem içi",
  available: "Gerektiğinde kullanılır",
};

export default function SystemServices() {
  const query = useSystemServices();
  const [category, setCategory] = useState<ServiceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const data = query.data;
  const items =
    data?.items.filter(
      (item) =>
        (category === "all" || item.category === category) &&
        `${item.name} ${item.provider} ${item.purpose} ${item.usedIn} ${item.model || ""}`
          .toLocaleLowerCase("tr")
          .includes(search.toLocaleLowerCase("tr").trim()),
    ) || [];

  return (
    <main className="services-page">
      <header className="services-heading">
        <div>
          <h1>Servisler ve yapay zekâ</h1>
          <p>
            Hangi iş için ne kullanıyoruz? Tüm bağlantılar ve görevleri bir
            arada.
          </p>
        </div>
        <div className="services-actions">
          <Link to="/ai-costs">
            AI maliyetlerini gör <ArrowRight size={15} />
          </Link>
          <Button
            icon={<RefreshCw size={15} />}
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Yenile
          </Button>
        </div>
      </header>

      <div className="services-explanation">
        <CircleHelp size={18} aria-hidden="true" />
        <p>
          <strong>Bu sayfa ayarları gösterir.</strong> “Ayarlar mevcut”, gerekli
          bilgilerin sunucuda tanımlı olduğunu belirtir; servisin çalıştığını
          veya bakiyesini doğrulamaz. Yenilemek ücretli işlem başlatmaz.
        </p>
      </div>

      {data && !query.isError && (
        <section
          className="services-infrastructure"
          aria-label="Veriler nerede tutuluyor?"
        >
          {["postgres", "files", "audio", "redis"]
            .map((id) => data.items.find((item) => item.id === id))
            .filter((item) => !!item)
            .map((item) => (
              <article key={item.id}>
                <Database size={18} aria-hidden="true" />
                <span>{item.name}</span>
                <h2>{item.provider}</h2>
                <p>{item.location?.label || "Konum bilgisi yok"}</p>
                {item.location?.address && <code>{item.location.address}</code>}
                <small>{item.purpose}</small>
                <span
                  className={`services-status services-status--${item.status}`}
                >
                  {statuses[item.status]}
                </span>
              </article>
            ))}
        </section>
      )}
      <details className="services-flow-details">
        <summary>Değerlendirme nasıl işliyor?</summary>
        <section
          className="services-flows"
          aria-label="Değerlendirme nasıl çalışır?"
        >
          <article>
            <AudioLines size={21} aria-hidden="true" />
            <h2>Konuşma</h2>
            <p>
              Ses kaydı <ArrowRight /> <b>Deepgram</b> <ArrowRight />{" "}
              <b>OpenAI</b> <ArrowRight /> Rapor
            </p>
            <span>
              Önce ses yazıya çevrilir, ardından cevap değerlendirilir.
            </span>
          </article>
          <article>
            <BrainCircuit size={21} aria-hidden="true" />
            <h2>Yazma</h2>
            <p>
              Yazılı cevap <ArrowRight /> <b>OpenAI</b> <ArrowRight /> Rapor
            </p>
            <span>
              Metin, soru ve sınav ölçütleri birlikte değerlendirilir.
            </span>
          </article>
          <article>
            <Database size={21} aria-hidden="true" />
            <h2>Okuma ve dinleme</h2>
            <p>
              Cevaplar <ArrowRight /> <b>Cevap anahtarı</b> <ArrowRight /> Puan
            </p>
            <span>
              Puanlama yapay zekâyla yapılmaz. Dinlemede metin–ses eşleştirmesi
              ayrı bir işlemdir.
            </span>
          </article>
        </section>
      </details>
      <section className="services-directory" aria-label="Servis listesi">
        <div className="services-toolbar">
          <div>
            <h2>Bağlantılar {data && <span>{data.items.length}</span>}</h2>
            {data && !query.isError && (
              <p>
                {data.environment === "production"
                  ? "Canlı ortam"
                  : data.environment === "development"
                    ? "Geliştirme ortamı"
                    : "Bağlı sunucu"}{" "}
                · Son okuma:{" "}
                {new Date(data.checkedAt).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
          <Input
            aria-label="Servis ara"
            placeholder="Servis veya görev ara"
            prefix={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>
        <div className="services-tabs" aria-label="Servis kategorileri">
          <button
            type="button"
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            Tümü
          </button>
          {categories.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        {query.isPending ? (
          <div className="services-loading">
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        ) : query.isError ? (
          <div className="services-loading">
            <Alert
              type="error"
              showIcon
              message="Servis bilgileri alınamadı"
              description={systemServicesErrorMessage(query.error)}
            />
          </div>
        ) : items.length === 0 ? (
          <p className="services-empty">Bu aramaya uygun servis bulunamadı.</p>
        ) : (
          <div className="services-list">
            {items.map((item) => {
              const Icon = categories.find(
                (group) => group.id === item.category,
              )!.icon;
              return (
                <article className="services-row" key={item.id}>
                  <div className="services-identity">
                    <span className="services-icon">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <span className="services-provider">{item.provider}</span>
                      <h3>{item.name}</h3>
                      {item.location && (
                        <div className="services-location">
                          <span>{item.location.label}</span>
                          {item.location.address && (
                            <code>{item.location.address}</code>
                          )}
                        </div>
                      )}
                      {item.model && (
                        <span className="services-model">{item.model}</span>
                      )}
                    </div>
                  </div>
                  <div className="services-description">
                    <p>{item.purpose}</p>
                    <span>{item.usedIn}</span>
                    <details>
                      <summary>Ayrıntı</summary>
                      <p>{item.detail}</p>
                    </details>
                  </div>
                  <span
                    className={`services-status services-status--${item.status}`}
                  >
                    <i aria-hidden="true" />
                    {statuses[item.status]}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <footer className="services-footnote">
        Liste, bağlı olduğun sunucunun ayarlarını gösterir. Adreslerde yalnız
        sunucu adı ve bağlantı noktası görünür; kullanıcı adı, parola ve erişim
        anahtarları gizlidir.
      </footer>
    </main>
  );
}
