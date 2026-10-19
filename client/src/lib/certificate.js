import { verifyUrl, fmtDate } from './utils';

// Draws a certificate PDF (A4 landscape) with a QR code linking to the public verification page.
export async function downloadCertificatePdf(cert) {
  const [{ jsPDF }, QRCode] = await Promise.all([import('jspdf'), import('qrcode').then((m) => m.default || m)]); // loaded on demand
  const c = cert.credential || {};
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;
  doc.setFillColor(247, 252, 249); doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(16, 185, 129); doc.rect(0, 0, W, 5, 'F');
  doc.setFillColor(132, 204, 22); doc.rect(0, H - 5, W, 5, 'F');
  doc.setDrawColor(167, 214, 190); doc.setLineWidth(0.6); doc.roundedRect(12, 14, W - 24, H - 28, 4, 4);

  doc.setTextColor(5, 150, 105); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('SKILLQUEST  |  BLOCKCHAIN ACHIEVEMENT PASSPORT', W / 2, 32, { align: 'center' });
  doc.setTextColor(6, 49, 36); doc.setFontSize(34); doc.text('Certificate of Achievement', W / 2, 55, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(13); doc.setTextColor(75, 105, 92);
  doc.text('This certifies that', W / 2, 72, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(30); doc.setTextColor(4, 120, 87);
  doc.text(c.student || 'Student', W / 2, 90, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(13); doc.setTextColor(75, 105, 92);
  doc.text('has earned', W / 2, 103, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(6, 49, 36);
  doc.text(cert.title, W / 2, 117, { align: 'center', maxWidth: W - 60 });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(75, 105, 92);
  if (cert.skills?.length) doc.text(`Skills demonstrated: ${cert.skills.join(', ')}`, W / 2, 130, { align: 'center', maxWidth: W - 70 });

  const qr = await QRCode.toDataURL(verifyUrl(cert.public_id), { margin: 1, width: 320, color: { dark: '#080a14', light: '#ffffff' } });
  doc.setFillColor(255, 255, 255); doc.setDrawColor(167, 214, 190); doc.roundedRect(W - 62, H - 66, 40, 40, 2, 2, 'FD');
  doc.addImage(qr, 'PNG', W - 60, H - 64, 36, 36);
  doc.setFontSize(8); doc.setTextColor(75, 105, 92); doc.text('Scan to verify', W - 42, H - 22, { align: 'center' });

  doc.setFontSize(10); doc.setTextColor(40, 70, 58);
  doc.text(`Issued: ${fmtDate(cert.issued_at)}`, 24, H - 50);
  doc.text(`Certificate ID: ${cert.public_id}`, 24, H - 43);
  doc.setFontSize(7.5); doc.setTextColor(110, 140, 125);
  doc.text(`Transaction: ${cert.tx_hash}`, 24, H - 36, { maxWidth: W - 100 });
  doc.text(`Credential hash: ${cert.credential_hash}`, 24, H - 31, { maxWidth: W - 100 });
  doc.text(`Verify at: ${verifyUrl(cert.public_id)}`, 24, H - 26, { maxWidth: W - 100 });
  doc.save(`skillquest-${cert.public_id}.pdf`);
}

// The exact credential that was hashed. Anyone can paste it on the verify page to prove it is unmodified.
export function downloadCredentialJson(cert) {
  const blob = new Blob([JSON.stringify(cert.credential, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `skillquest-${cert.public_id}.json`; a.click();
  URL.revokeObjectURL(a.href);
}
