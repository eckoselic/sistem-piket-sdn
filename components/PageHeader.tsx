const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function tanggalIndonesia(d: Date = new Date()) {
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 md:px-10 pt-8 pb-5 flex items-start justify-between gap-4 border-b border-ink/8">
      <div>
        <p className="text-xs text-slate-soft">{tanggalIndonesia()}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-soft max-w-lg">{description}</p>}
      </div>
      {action}
    </div>
  );
}
