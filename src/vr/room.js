import * as THREE from 'three';

export async function startTrainingRoom({ container, presentationTitle, roomLabel, onExit }) {
  container.innerHTML = `
    <div class="vr-toolbar">
      <span>${presentationTitle} - ${roomLabel}</span>
      <button id="exit-room" class="btn">Zuruck</button>
    </div>
  `;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8e8f2);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.6, 4.5);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(5, 7, 3);
  scene.add(keyLight);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: 0xdedff0, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf7f7fb });

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 5.5), wallMaterial);
  backWall.position.set(0, 2.75, -5.5);
  scene.add(backWall);

  const sideWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(11, 5.5), wallMaterial);
  sideWallLeft.position.set(-7, 2.75, 0);
  sideWallLeft.rotation.y = Math.PI / 2;
  scene.add(sideWallLeft);

  const sideWallRight = sideWallLeft.clone();
  sideWallRight.position.x = 7;
  sideWallRight.rotation.y = -Math.PI / 2;
  scene.add(sideWallRight);

  const podium = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.1, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x8582b4, roughness: 0.35 })
  );
  podium.position.set(0, 0.55, -1.4);
  scene.add(podium);

  const screenTexture = createScreenTexture(presentationTitle);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 2.2),
    new THREE.MeshStandardMaterial({ map: screenTexture })
  );
  screen.position.set(0, 2.7, -5.45);
  scene.add(screen);

  const audience = new THREE.Group();
  for (let row = 0; row < 2; row += 1) {
    for (let col = -2; col <= 2; col += 1) {
      const chair = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.45, 0.45),
        new THREE.MeshStandardMaterial({ color: 0xb5b5cc, roughness: 0.7 })
      );
      chair.position.set(col * 1.1, 0.25, 1.8 + row * 1.15);
      audience.add(chair);
    }
  }
  scene.add(audience);

  const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('resize', resize);

  let time = 0;
  renderer.setAnimationLoop(() => {
    time += 0.01;
    podium.rotation.y = Math.sin(time) * 0.05;
    renderer.render(scene, camera);
  });

  if (navigator.xr && (await navigator.xr.isSessionSupported('immersive-vr'))) {
    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor']
      });
      renderer.xr.setSession(session);
    } catch {
      requestDesktopFullscreen(container);
    }
  } else {
    requestDesktopFullscreen(container);
  }

  container.querySelector('#exit-room').addEventListener('click', async () => {
    const session = renderer.xr.getSession();
    if (session) {
      await session.end();
    }

    renderer.setAnimationLoop(null);
    window.removeEventListener('resize', resize);
    renderer.dispose();
    screenTexture.dispose();
    onExit();
  });
}

function requestDesktopFullscreen(container) {
  if (document.fullscreenElement || !container.requestFullscreen) {
    return;
  }

  container.requestFullscreen().catch(() => {
    // Fullscreen may be blocked by browser policy.
  });
}

function createScreenTexture(title) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f7f7ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#5a5790';
  ctx.font = 'bold 64px Segoe UI';
  ctx.fillText('Be Present', 60, 100);

  ctx.fillStyle = '#2d2d48';
  ctx.font = 'bold 58px Segoe UI';
  ctx.fillText(title || 'Titel', 60, 220);

  ctx.font = '38px Segoe UI';
  ctx.fillStyle = '#4f4f73';
  ctx.fillText('WebXR Trainingsraum', 60, 320);

  return new THREE.CanvasTexture(canvas);
}
