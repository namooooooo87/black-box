import * as THREE from 'three';

export function createLabFloorTexture(
  baseHex: string,
  gridHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Clean architectural tile seams
  ctx.strokeStyle = gridHex;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, 253, 253);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.moveTo(0, 128);
  ctx.lineTo(256, 128);
  ctx.stroke();

  // Subtle corner bolts
  ctx.fillStyle = 'rgba(100, 116, 139, 0.28)';
  const pts = [10, 118, 138, 246];
  for (const x of pts) {
    for (const y of pts) {
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createServerRackTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 128, 256);

  for (let row = 0; row < 10; row++) {
    const y = 12 + row * 24;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, y, 108, 18);

    // Server LEDs
    for (let col = 0; col < 6; col++) {
      const lit = (row * 3 + col) % 3 !== 0;
      ctx.fillStyle = !lit
        ? '#334155'
        : col === 5
        ? '#10b981'
        : '#38bdf8';
      ctx.fillRect(16 + col * 14, y + 6, 8, 5);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createHazardStripeTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#f97316';
  for (let i = -128; i < 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 16, 0);
    ctx.lineTo(i - 48, 128);
    ctx.lineTo(i - 64, 128);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createScreenTexture(accentHex: string, solved: boolean, maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 128, 96);

  ctx.strokeStyle = solved ? '#10b981' : accentHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 120, 88);

  // Code/telemetry bars
  ctx.fillStyle = solved ? '#34d399' : accentHex;
  if (solved) {
    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#34d399';
    ctx.moveTo(38, 50);
    ctx.lineTo(56, 68);
    ctx.lineTo(90, 30);
    ctx.stroke();
  } else {
    ctx.fillRect(16, 20, 62, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(16, 36, 94, 6);
    ctx.fillRect(16, 48, 78, 6);
    ctx.fillRect(16, 60, 52, 6);
    ctx.fillStyle = accentHex;
    ctx.fillRect(16, 72, 32, 8);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
  grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.16)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createDoorSignTexture(label: string, maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 96);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 88);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 28px "Noto Sans KR", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 256, 48, 470);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}
