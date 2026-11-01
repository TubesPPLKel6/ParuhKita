import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

/**
 * Mengonversi gambar DOM ke Base64 (data: URL) agar canvas browser
 * tidak mengalami 'tainted canvas' akibat CORS.
 */
async function preProcessImages(element) {
  const images = Array.from(element.querySelectorAll('img'));
  const originalSources = images.map((img) => img.src);

  await Promise.all(
    images.map(async (img) => {
      if (!img.src || img.src.startsWith('data:')) return;
      try {
        const response = await fetch(img.src, { mode: 'cors' });
        if (!response.ok) throw new Error('Fetch failed');
        const blob = await response.blob();
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            img.src = reader.result;
            resolve();
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(blob);
        });
        if ('decode' in img) {
          await img.decode().catch(() => {});
        }
      } catch (err) {
        console.warn('Gagal memproses gambar ke Base64:', err);
        // Jika gagal di-fetch (misal offline / CORS terblokir), ganti sementara dengan 1x1 transparent agar kanvas tidak tainted
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      }
    })
  );

  return () => {
    // Kembalikan URL asli setelah rendering selesai
    images.forEach((img, i) => {
      img.src = originalSources[i];
    });
  };
}

/**
 * Mengonversi elemen DOM langsung menjadi berkas .pdf dan mengunduhnya via browser download manager
 * TANPA memunculkan dialog cetak/print ("Microsoft Print to PDF") bawaan browser.
 *
 * @param {HTMLElement} element - Elemen yang akan dicetak ke PDF
 * @param {string} filename - Nama berkas keluaran (contoh: 'CV_Budi_Santoso.pdf')
 */
export async function downloadElementAsPdf(element, filename = 'Dokumen.pdf') {
  if (!element) {
    throw new Error('Elemen dokumen tidak ditemukan');
  }

  const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // 1. Siapkan gambar agar aman dari CORS canvas tainting
  const restoreImages = await preProcessImages(element);

  try {
    // 2. Render menggunakan html2canvas-pro yang mendukung Tailwind CSS v4 (oklch colors)
    const canvas = await html2canvas(element, {
      scale: 2, // Resolusi 2x untuk teks dan visual yang tajam
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 6000,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Halaman 1
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Halaman berikutnya jika konten melebihi 1 lembar A4
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // 3. Unduh berkas langsung ke Download Manager browser (ikon download pojok kanan atas)
    // Sama sekali TIDAK memanggil window.print() sehingga dialog print tidak akan pernah muncul.
    pdf.save(finalFilename);
    return true;
  } finally {
    // Selalu kembalikan URL gambar asli
    restoreImages();
  }
}
