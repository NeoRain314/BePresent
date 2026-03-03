import './styles.css';
import { startTrainingRoom } from './vr/room.js';

const roomOptions = [
  { id: 'classroom-a', label: 'Klassenzimmer A' },
  { id: 'auditorium', label: 'Auditorium' },
  { id: 'seminar', label: 'Seminarraum' }
];

const presentations = [
  { id: crypto.randomUUID(), title: 'GFS Biologie', date: '12-02-2025', points: 120, streak: '3 Tage' },
  { id: crypto.randomUUID(), title: 'Englisch Pras', date: '19-02-2025', points: 50, streak: '1 Tag' }
];

const listEl = document.querySelector('#presentation-list');
const modalEl = document.querySelector('#start-modal');
const presentationSelectEl = document.querySelector('#presentation-select');
const roomSelectEl = document.querySelector('#room-select');
const pageShellEl = document.querySelector('.page-shell');
const vrRootEl = document.querySelector('#vr-root');

function renderPresentationSelect() {
  presentationSelectEl.innerHTML = presentations
    .map((item) => `<option value="${item.id}">${item.title || 'Ohne Titel'}</option>`)
    .join('');
}

function renderRoomSelect() {
  roomSelectEl.innerHTML = roomOptions
    .map((room) => `<option value="${room.id}">${room.label}</option>`)
    .join('');
}

function renderCards() {
  listEl.innerHTML = presentations
    .map(
      (item) => `
      <article class="card" data-id="${item.id}">
        <div class="thumb">Vorschau</div>
        <div class="card-main">
          <input class="title-input" value="${item.title}" aria-label="Prasentationstitel" />
          <div class="date">${item.date}</div>
          <div class="card-buttons">
            <button class="chip">Karteikarten bearbeiten</button>
            <button class="chip">Prasentationsinfos bearbeiten</button>
          </div>
        </div>
        <div class="metrics">
          <div>Punkte: ${item.points}</div>
          <div>Streak: ${item.streak}</div>
        </div>
      </article>
    `
    )
    .join('');

  for (const input of listEl.querySelectorAll('.title-input')) {
    input.addEventListener('input', (event) => {
      const card = event.target.closest('.card');
      const id = card?.dataset.id;
      const entry = presentations.find((x) => x.id === id);

      if (entry) {
        entry.title = event.target.value;
        renderPresentationSelect();
      }
    });
  }
}

function openStartModal() {
  renderPresentationSelect();
  modalEl.hidden = false;
}

function closeStartModal() {
  modalEl.hidden = true;
}

async function launchSelectedPresentation() {
  const presentationId = presentationSelectEl.value;
  const roomId = roomSelectEl.value;
  const selectedPresentation = presentations.find((p) => p.id === presentationId);

  if (!selectedPresentation) {
    return;
  }

  closeStartModal();
  pageShellEl.hidden = true;
  vrRootEl.hidden = false;

  await startTrainingRoom({
    container: vrRootEl,
    presentationTitle: selectedPresentation.title,
    roomLabel: roomOptions.find((room) => room.id === roomId)?.label ?? roomId,
    onExit: () => {
      vrRootEl.hidden = true;
      vrRootEl.innerHTML = '';
      pageShellEl.hidden = false;
    }
  });
}

function addMockPresentation() {
  const today = new Date();
  const dateLabel = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

  presentations.unshift({
    id: crypto.randomUUID(),
    title: 'Titel',
    date: dateLabel,
    points: 0,
    streak: '0 Tage'
  });

  renderCards();
}

document.querySelector('#new-presentation-btn').addEventListener('click', addMockPresentation);
document.querySelector('#start-presentation-btn').addEventListener('click', openStartModal);
document.querySelector('#modal-cancel').addEventListener('click', closeStartModal);
document.querySelector('#modal-start').addEventListener('click', launchSelectedPresentation);
modalEl.addEventListener('click', (event) => {
  if (event.target === modalEl) {
    closeStartModal();
  }
});

renderCards();
renderPresentationSelect();
renderRoomSelect();
