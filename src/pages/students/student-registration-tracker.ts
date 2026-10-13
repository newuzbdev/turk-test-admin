export type Registration = {
  id: string;
  name: string | null;
  createdAt?: string;
};
const position = (row: Registration) => `${row.createdAt}:${row.id}`;
export class RegistrationTracker {
  private watermark: string | null = null;
  observe(rows: Registration[]): Registration[] {
    const valid = rows
      .filter((r) => r.createdAt && Number.isFinite(Date.parse(r.createdAt)))
      .map((r) => ({ ...r, createdAt: new Date(r.createdAt!).toISOString() }));
    const newest = valid.reduce(
      (max, r) => (position(r) > max ? position(r) : max),
      "",
    );
    if (this.watermark === null) {
      this.watermark = newest;
      return [];
    }
    const added = valid.filter((r) => position(r) > this.watermark!);
    if (newest > this.watermark) this.watermark = newest;
    return added;
  }
}
