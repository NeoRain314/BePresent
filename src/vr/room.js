import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { t } from '../i18n/texts.js';

const FALLBACK_PLAYER_POSITION = new THREE.Vector3(0, 0, 4.5);
const FALLBACK_SCREEN_POSITION = new THREE.Vector3(0, 2.7, -5.45);
const FALLBACK_SCREEN_SIZE = new THREE.Vector2(3.8, 2.2);
const DESKTOP_EYE_HEIGHT = 1.6;

export async function startTrainingRoom({ container, presentationTitle, firstSlideUrl, roomLabel, roomModelUrl, onExit }) {
  container.innerHTML = `
    <div class="vr-toolbar">
      <span>${presentationTitle} - ${roomLabel}</span>
      <button id="exit-room" class="btn">${t('actions.back')}</button>
    </div>
  `;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8e8f2);

  const cameraRig = new THREE.Group();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, DESKTOP_EYE_HEIGHT, 0);
  cameraRig.add(camera);
  scene.add(cameraRig);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(5, 7, 3);
  scene.add(keyLight);

  const modelRoom = roomModelUrl ? await loadRoomModel(roomModelUrl) : null;
  let playerSpawn = null;
  let screenAnchor = null;

  if (modelRoom) {
    scene.add(modelRoom);
    modelRoom.updateMatrixWorld(true);
    playerSpawn = modelRoom.getObjectByName('PlayerSpawn') ?? null;
    screenAnchor = modelRoom.getObjectByName('ScreenAnchor') ?? null;
    hideMarkerObject(playerSpawn);
    hideMarkerObject(screenAnchor);
  } else {
    addDefaultRoom(scene);
  }

  applyPlayerSpawn(cameraRig, playerSpawn);
  const { podium, screenTexture } = await addPresentationProps(scene, {
    presentationTitle,
    firstSlideUrl,
    screenAnchor
  });

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
      // User or browser rejected VR session; keep desktop mode without forcing fullscreen.
    }
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

async function loadRoomModel(modelUrl) {
  const loader = new GLTFLoader();

  try {
    const gltf = await loader.loadAsync(modelUrl);
    const model = gltf.scene;
    const hasAuthoredAnchors = model.getObjectByName('PlayerSpawn') || model.getObjectByName('ScreenAnchor');
    if (!hasAuthoredAnchors) {
      fitRoomModel(model);
    }
    return model;
  } catch (error) {
    console.warn('Could not load room model:', error);
    return null;
  }
}

function fitRoomModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);

  if (maxDimension > 0) {
    model.scale.multiplyScalar(10 / maxDimension);
  }

  const fittedBox = new THREE.Box3().setFromObject(model);
  const center = fittedBox.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= fittedBox.min.y;
}

function hideMarkerObject(object) {
  if (!object) {
    return;
  }

  object.traverse((child) => {
    child.visible = false;
  });
}

function applyPlayerSpawn(cameraRig, playerSpawn) {
  if (!playerSpawn) {
    cameraRig.position.copy(FALLBACK_PLAYER_POSITION);
    cameraRig.rotation.set(0, 0, 0);
    return;
  }

  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  playerSpawn.getWorldPosition(position);
  playerSpawn.getWorldQuaternion(quaternion);

  cameraRig.position.copy(position);
  cameraRig.quaternion.copy(getYawOnlyQuaternion(quaternion));
}

function getYawOnlyQuaternion(quaternion) {
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ');
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(0, euler.y, 0, 'YXZ'));
}

function addDefaultRoom(scene) {
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
}

async function addPresentationProps(scene, { presentationTitle, firstSlideUrl, screenAnchor }) {
  const podium = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.1, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x8582b4, roughness: 0.35 })
  );
  podium.position.set(0, 0.55, -1.4);
  scene.add(podium);

  const screenTexture = await createScreenTexture(presentationTitle, firstSlideUrl);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: screenTexture, side: THREE.DoubleSide })
  );

  applyScreenAnchor(screen, screenAnchor);
  scene.add(screen);

  return { podium, screenTexture };
}

function applyScreenAnchor(screen, screenAnchor) {
  screen.scale.set(FALLBACK_SCREEN_SIZE.x, FALLBACK_SCREEN_SIZE.y, 1);
  screen.rotation.set(0, 0, 0);

  if (!screenAnchor) {
    screen.position.copy(FALLBACK_SCREEN_POSITION);
    return;
  }

  const position = new THREE.Vector3();
  screenAnchor.getWorldPosition(position);
  screen.position.copy(position);
}

async function createScreenTexture(title, firstSlideUrl) {
  if (firstSlideUrl) {
    const texture = await new THREE.TextureLoader().loadAsync(firstSlideUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

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
  ctx.fillText(title || t('cards.defaultNewTitle'), 60, 220);

  ctx.font = '38px Segoe UI';
  ctx.fillStyle = '#4f4f73';
  ctx.fillText(t('vr.trainingRoom'), 60, 320);

  return new THREE.CanvasTexture(canvas);
}
