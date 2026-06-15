const roomModelFiles = import.meta.glob('../assets/rooms/**/*.{glb,gltf}', {
  eager: true,
  import: 'default',
  query: '?url'
});

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

export const roomOptions = Object.entries(roomModelFiles).map(([path, modelUrl]) => ({
  id: getRoomId(path),
  label: formatRoomLabel(path),
  modelUrl
}));
