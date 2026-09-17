import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LABEL_KATEGORI } from "@/types/database";

async function muatGambarSebagaiDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function buatPdfRekap({
  bulanLabel,
  ringkasan,
  jurnal,
}: {
  bulanLabel: string;
  ringkasan: { nama: string; hadir: number; terlambat: number; tidakHadir: number; jadwalTotal: number }[];
  jurnal: { tanggal: string; judul: string; kategori: string; isi: string; profiles?: { nama: string } }[];
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const lebarHalaman = doc.internal.pageSize.getWidth();
  const marginX = 40;

  // --- KOP SURAT ---
  // Letakkan file logo asli di /public/logo-sekolah.png dan /public/logo-jayaraya.png
  const [logoSekolah, logoJayaRaya] = await Promise.all([
    muatGambarSebagaiDataUrl("/logo-sekolah.png"),
    muatGambarSebagaiDataUrl("/logo-jayaraya.png"),
  ]);

  if (logoSekolah) doc.addImage(logoSekolah, "PNG", marginX, 30, 48, 48);
  if (logoJayaRaya) doc.addImage(logoJayaRaya, "PNG", lebarHalaman - marginX - 48, 30, 48, 48);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA", lebarHalaman / 2, 40, { align: "center" });
  doc.text("SDN JATINEGARA KAUM 07 PAGI", lebarHalaman / 2, 56, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Jl. Jatinegara Kaum, Cakung, Jakarta Timur", lebarHalaman / 2, 70, { align: "center" });

  doc.setLineWidth(1.2);
  doc.line(marginX, 86, lebarHalaman - marginX, 86);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`REKAP GURU PIKET — ${bulanLabel.toUpperCase()}`, lebarHalaman / 2, 106, { align: "center" });

  // --- TABEL REKAP KEHADIRAN ---
  autoTable(doc, {
    startY: 124,
    margin: { left: marginX, right: marginX },
    head: [["Nama Guru", "Jadwal", "Hadir", "Terlambat", "Tidak Hadir"]],
    body: ringkasan.map((r) => [
      r.nama,
      String(r.jadwalTotal),
      String(r.hadir),
      String(r.terlambat),
      String(r.tidakHadir),
    ]),
    headStyles: { fillColor: [18, 36, 61], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    styles: { cellPadding: 6 },
  });

  // --- LAMPIRAN JURNAL KEJADIAN ---
  const ySetelahTabel = (doc as any).lastAutoTable.finalY + 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Lampiran: Jurnal Kejadian", marginX, ySetelahTabel);

  if (jurnal.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Tidak ada catatan jurnal pada bulan ini.", marginX, ySetelahTabel + 16);
  } else {
    autoTable(doc, {
      startY: ySetelahTabel + 10,
      margin: { left: marginX, right: marginX },
      head: [["Tanggal", "Kategori", "Judul", "Guru", "Uraian"]],
      body: jurnal.map((j) => [
        new Date(j.tanggal + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
        LABEL_KATEGORI[j.kategori as keyof typeof LABEL_KATEGORI] ?? j.kategori,
        j.judul,
        j.profiles?.nama ?? "—",
        j.isi,
      ]),
      headStyles: { fillColor: [18, 36, 61], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8, cellWidth: "wrap" },
      columnStyles: { 4: { cellWidth: 200 } },
      styles: { cellPadding: 5 },
    });
  }

  // --- BLOK TANDA TANGAN ---
  const halamanTerakhir = doc.internal.pages.length - 1;
  doc.setPage(halamanTerakhir);
  const yTtd = (doc as any).lastAutoTable.finalY + 50;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Mengetahui,", lebarHalaman - marginX - 160, yTtd);
  doc.text("Kepala Sekolah", lebarHalaman - marginX - 160, yTtd + 14);
  doc.text("( ______________________ )", lebarHalaman - marginX - 160, yTtd + 60);

  doc.save(`rekap-piket-${bulanLabel.toLowerCase().replace(" ", "-")}.pdf`);
}
