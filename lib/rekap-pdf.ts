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
  kepalaSekolah,
}: {
  bulanLabel: string;
  ringkasan: { nama: string; hadir: number; terlambat: number; tidakHadir: number; jadwalTotal: number }[];
  jurnal: { tanggal: string; judul: string; kategori: string; isi: string; profiles?: { nama: string } }[];
  kepalaSekolah?: { nama: string; nip: string | null } | null;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const lebarHalaman = doc.internal.pageSize.getWidth();
  const marginX = 40;

  // --- KOP SURAT ---
  // Logo diambil dari /public/logo-sekolah.png dan /public/logo-jayaraya.png
  const [logoJayaRaya, logoSekolah] = await Promise.all([
    muatGambarSebagaiDataUrl("/logo-jayaraya.png"),
    muatGambarSebagaiDataUrl("/logo-sekolah.png"),
  ]);

  if (logoJayaRaya) doc.addImage(logoJayaRaya, "PNG", marginX, 22, 56, 56);
  if (logoSekolah) doc.addImage(logoSekolah, "PNG", lebarHalaman - marginX - 48, 22, 48, 52);

  const tengah = lebarHalaman / 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA", tengah, 34, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("DINAS PENDIDIKAN", tengah, 49, { align: "center" });
  doc.setFontSize(15);
  doc.text("SDN JATINEGARA KAUM 07 PAGI", tengah, 66, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Jl. TB. Badarudin No. 6, Telp. 021- 47860713  E-mail : sdnjtk07pg@gmail.com", tengah, 79, { align: "center" });
  doc.text("Kelurahan Jatinegara Kaum, Kecamatan Pulogadung", tengah, 90, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("JAKARTA TIMUR", tengah, 103, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Kode Pos : 13250", lebarHalaman - marginX - 24, 88, { align: "center" });

  doc.setLineWidth(1.5);
  doc.line(marginX, 114, lebarHalaman - marginX, 114);
  doc.setLineWidth(0.5);
  doc.line(marginX, 117, lebarHalaman - marginX, 117);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`REKAP GURU PIKET — ${bulanLabel.toUpperCase()}`, tengah, 136, { align: "center" });

  // --- TABEL REKAP KEHADIRAN ---
  autoTable(doc, {
    startY: 152,
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
  const yTtd = (doc as any).lastAutoTable.finalY + 40;
  const xTtd = lebarHalaman - marginX - 170;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Mengetahui,", xTtd, yTtd);
  doc.text("Kepala Sekolah", xTtd, yTtd + 14);

  if (kepalaSekolah?.nama) {
    doc.setFont("helvetica", "bold");
    doc.text(kepalaSekolah.nama, xTtd, yTtd + 60);
    doc.setFont("helvetica", "normal");
    doc.text(`NIP. ${kepalaSekolah.nip ?? "—"}`, xTtd, yTtd + 74);
  } else {
    doc.text("( ______________________ )", xTtd, yTtd + 60);
  }

  doc.save(`rekap-piket-${bulanLabel.toLowerCase().replace(" ", "-")}.pdf`);
}
