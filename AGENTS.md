# TurkishMock yönetim paneli

React 19 + TypeScript + Vite + Ant Design; bu klasör bağımsız Git deposudur.

- Ortak çalışma kuralları: [backend/AGENTS.md](../backend/AGENTS.md).
- Büyük görev/yeni oturum: [proje hafızası](../backend/docs/project/README.md).
- Mimari: [ARCHITECTURE](../backend/docs/project/ARCHITECTURE.md).
- Durum/kararlar: [CURRENT_STATE](../backend/docs/project/CURRENT_STATE.md), [DECISIONS](../backend/docs/project/DECISIONS.md).
- Kod kalıpları: [CONVENTIONS](../backend/docs/project/CONVENTIONS.md).
- Ürün: [PRODUCT](../backend/docs/project/PRODUCT.md).

Context daraldığında veya yeni görev açıldığında önemli bilgileri konuşmadan
tahmin etmeyin; bu haritayı ve yalnız ilgili belgeleri tekrar okuyun.
Tek başına clone/worktree'de kardeş depolar yoksa ilgili checkout'u bulun;
bulamazsanız çapraz-repo davranışı tahmin etmeyin, eksik kaynağı bildirin.

Yerel başlatma: `npm run dev -- --host 127.0.0.1 --port 5174 --strictPort`.
Build: `npm run build`; typecheck: `npx tsc -b`; lint: `npm run lint`.
Test: `npm run test -- --run` (Vitest/jsdom); `npm run test` watch modudur.
Vite 7'nin Node koşulunu doğrulayın; güncel Docker build'i Node 22 kullanır.
Router: `src/routes/router-config.tsx`; API: `src/config/api.ts`, `src/config/endpoint.ts`.
`VITE_API_URL` origin'dir; `VITE_STUDENT_APP_URL` workbook iframe hedefini belirler.
Workbook: `src/pages/learn/workbook`; öğrenci renderer'ı `../frontend/src/pages/lessons/workbook`.
İki taraftaki mesaj şeması, origin/source/session kontrolü ve revision koruması birlikte korunur.
ADMIN yetkisi backend tarafından denetlenir; görünür menü tek başına yetki kontrolü değildir.
Yerel `.env` korunarak Git index'inden çıkarıldı; dolu ortam dosyalarını stage/commit etmeyin veya değerlerini göstermeyin.
Mevcut dirty değişikliklere dokunmayın. Açık istek olmadan commit/push/deploy yapmayın.
Ürün veya mimari değişirse ortak belgeleri güncelleyin; bütün docs'u her görevde okumayın.
