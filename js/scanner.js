/**
 * Pemindai kode QR: dari berkas gambar dan dari kamera.
 *
 * Memakai jsQR yang di-vendor. Tidak ada gambar yang dikirim ke mana pun;
 * semuanya dibaca di perangkat.
 */

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Status pemindaian yang ditampilkan ke pengguna. */
function setStatus(message, kind) {
  const el = document.getElementById('scanStatus');
  if (!el) return;
  el.textContent = message || '';
  el.dataset.kind = kind || '';
}

/** Baca berkas gambar menjadi ImageData siap dipakai jsQR. */
async function fileToImageData(file) {
  if (!file) throw new Error('Tidak ada berkas dipilih.');
  if (!file.type.startsWith('image/')) {
    throw new Error('Berkas harus berupa gambar.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Ukuran gambar maksimal 10 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Cari kode QR pada ImageData.
 *
 * Pemindaian seluruh gambar dicoba lebih dulu. Bila gagal — misalnya karena
 * gambar beresolusi tinggi dengan banyak latar seperti peta — gambar dicoba
 * lagi per wilayah (sisi kanan dan empat kuadran), lalu diperkecil setengahnya.
 *
 * @returns {string|null} teks isi kode, atau null bila tidak ditemukan
 */
function decodeImageData(imageData) {
  if (typeof window.jsQR !== 'function') {
    throw new Error('Pustaka pemindai QR gagal dimuat.');
  }

  const options = { inversionAttempts: 'attemptBoth' };

  const full = window.jsQR(imageData.data, imageData.width, imageData.height, options);
  if (full && full.data) return full.data;

  const regions = candidateRegions(imageData.width, imageData.height);
  for (const region of regions) {
    const found = decodeRegion(imageData, region, options);
    if (found) return found;
  }

  // Cadangan terakhir: perkecil gambar agar jsQR lebih mudah menemukan pola.
  const scaled = downscaleRegion(imageData, 0.5);
  if (scaled) {
    const found = window.jsQR(scaled.data, scaled.width, scaled.height, options);
    if (found && found.data) return found.data;
  }

  return null;
}

/**
 * Wilayah cadangan bila seluruh gambar gagal: sisi kanan (tempat QR pada
 * kartu), lalu empat kuadran.
 */
function candidateRegions(width, height) {
  const regions = [];
  const push = (x, y, w, h) => {
    const rx = Math.max(0, Math.min(width - 1, Math.round(x)));
    const ry = Math.max(0, Math.min(height - 1, Math.round(y)));
    const rw = Math.min(width - rx, Math.round(w));
    const rh = Math.min(height - ry, Math.round(h));
    if (rw > 40 && rh > 40) regions.push({ x: rx, y: ry, width: rw, height: rh });
  };

  push(width * 0.62, 0, width * 0.38, height);
  push(0, 0, width * 0.55, height * 0.6);
  push(width * 0.45, 0, width * 0.55, height * 0.6);
  push(0, height * 0.4, width * 0.55, height * 0.6);
  push(width * 0.45, height * 0.4, width * 0.55, height * 0.6);

  return regions;
}

/** Perkecil ImageData sebesar faktor yang diberikan. */
function downscaleRegion(imageData, factor) {
  const width = Math.round(imageData.width * factor);
  const height = Math.round(imageData.height * factor);
  if (width < 60 || height < 60) return null;

  const source = document.createElement('canvas');
  source.width = imageData.width;
  source.height = imageData.height;
  source.getContext('2d').putImageData(imageData, 0, 0);

  const target = document.createElement('canvas');
  target.width = width;
  target.height = height;
  const ctx = target.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/** Potong satu wilayah dari ImageData dan cari QR di sana. */
function decodeRegion(imageData, region, options) {
  const canvas = document.createElement('canvas');
  canvas.width = region.width;
  canvas.height = region.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const patch = ctx.createImageData(region.width, region.height);
  for (let row = 0; row < region.height; row += 1) {
    const srcStart = ((region.y + row) * imageData.width + region.x) * 4;
    const destStart = row * region.width * 4;
    patch.data.set(
      imageData.data.subarray(srcStart, srcStart + region.width * 4),
      destStart
    );
  }
  ctx.putImageData(patch, 0, 0);

  const data = ctx.getImageData(0, 0, region.width, region.height);
  const found = window.jsQR(data.data, data.width, data.height, options);
  return found && found.data ? found.data : null;
}

/**
 * Pindai berkas gambar yang dipilih pengguna.
 * @param {File} file
 * @param {(text: string) => void} onDecode dipanggil bila kode terbaca
 */
export async function scanImageFile(file, onDecode) {
  setStatus('Membaca gambar…', 'busy');
  try {
    const imageData = await fileToImageData(file);
    const text = decodeImageData(imageData);
    if (!text) {
      setStatus('Tidak ada kode QR pada gambar ini.', 'error');
      return null;
    }
    setStatus('Kode QR terbaca.', 'success');
    if (typeof onDecode === 'function') onDecode(text);
    return text;
  } catch (error) {
    setStatus(error.message || 'Gambar gagal dibaca.', 'error');
    return null;
  }
}

/** Kamera aktif saat ini, dipakai agar bisa dihentikan. */
let activeStream = null;
let activeVideo = null;
let activeFrameId = null;
let cameraClosing = false;

function stopCamera() {
  if (activeFrameId !== null) {
    cancelAnimationFrame(activeFrameId);
    activeFrameId = null;
  }
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }
  if (activeVideo) {
    activeVideo.srcObject = null;
    activeVideo.remove();
    activeVideo = null;
  }
}

/**
 * Mulai pemindaian dari kamera.
 * Frame dibaca berkala; stream dihentikan begitu kode terpenuhi.
 *
 * @param {(text: string) => void} onDecode
 */
export async function startCameraScan(onDecode) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Perangkat ini tidak mendukung pemindaian kamera.', 'error');
    return false;
  }

  setStatus('Meminta akses kamera…', 'busy');

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
  } catch (error) {
    if (error && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
      setStatus('Akses kamera ditolak. Gunakan pilihan dari gambar.', 'error');
    } else if (error && error.name === 'NotFoundError') {
      setStatus('Kamera tidak ditemukan pada perangkat ini.', 'error');
    } else {
      setStatus('Kamera gagal dijalankan. Gunakan pilihan dari gambar.', 'error');
    }
    return false;
  }

  stopCamera();
  activeStream = stream;
  cameraClosing = false;

  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.muted = true;
  video.style.cssText = 'width:100%;max-width:340px;border-radius:8px;background:#000';
  activeVideo = video;

  const host = document.getElementById('scanStatus');
  if (host) {
    host.textContent = 'Arahkan kamera ke kode QR…';
    host.dataset.kind = 'busy';
    host.appendChild(video);
  }

  const stopButton = document.createElement('button');
  stopButton.type = 'button';
  stopButton.className = 'btn btn-ghost btn-small';
  stopButton.textContent = 'Hentikan Kamera';
  stopButton.addEventListener('click', () => {
    cameraClosing = true;
    stopCamera();
    setStatus('Pemindaian kamera dihentikan.', 'idle');
  });
  host?.appendChild(stopButton);

  await video.play().catch(() => {});

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const tick = () => {
    if (!activeVideo || cameraClosing) return;
    if (!video.videoWidth || !video.videoHeight) {
      activeFrameId = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const text = decodeImageData(imageData);
      if (text) {
        stopCamera();
        setStatus('Kode QR terbaca.', 'success');
        if (typeof onDecode === 'function') onDecode(text);
        return;
      }
    } catch (error) {
      stopCamera();
      setStatus(error.message || 'Pemindaian gagal.', 'error');
      return;
    }
    activeFrameId = requestAnimationFrame(tick);
  };
  activeFrameId = requestAnimationFrame(tick);

  // Hentikan kamera bila pengguna meninggalkan halaman.
  window.addEventListener('pagehide', stopCamera, { once: true });

  return true;
}

/** Hentikan kamera dari luar (misal saat halaman ditutup). */
export function stopCameraScan() {
  cameraClosing = true;
  stopCamera();
}
