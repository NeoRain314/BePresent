import { t } from '../i18n/texts.js';

const roomModelFiles = import.meta.glob('../assets/rooms/**/*.{glb,gltf}', {
  eager: true,
  import: 'default',
  query: '?url'
});

const defaultRooms = [
  { id: 'classroom-a', label: t('rooms.classroomA'), modelUrl: '' },
  { id: 'auditorium', label: t('rooms.auditorium'), modelUrl: '' },
  { id: 'seminar', label: t('rooms.seminarRoom'), modelUrl: '' }
];

function formatRoomLabel(path) {
  const fileName = path.split('/').pop() ?? '';
  const nameWithoutExtension = fileName.replace(/\.(glb|gltf)$/i, '');

  return nameWithoutExtension
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRoomId(path) {
  return `model:${path}`;
}

const modelRooms = Object.entries(roomModelFiles).map(([path, modelUrl]) => ({
  id: getRoomId(path),
  label: formatRoomLabel(path),
  modelUrl
}));

export const roomOptions = [...defaultRooms, ...modelRooms];
