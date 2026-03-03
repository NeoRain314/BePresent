import './styles.css';
import { startTrainingRoom } from './vr/room.js';
import { t } from './i18n/texts.js';

const roomOptions = [
  { id: 'classroom-a', label: t('rooms.classroomA') },
  { id: 'auditorium', label: t('rooms.auditorium') },
  { id: 'seminar', label: t('rooms.seminarRoom') }
];

const presentations = [
  { id: crypto.randomUUID(), title: 'Biology GFS', date: '12-02-2025', points: 120, streakDays: 3 },
  { id: crypto.randomUUID(), title: 'English Presentation', date: '19-02-2025', points: 50, streakDays: 1 }
];

const listEl = document.querySelector('#presentation-list');
const modalEl = document.querySelector('#start-modal');
const presentationSelectEl = document.querySelector('#presentation-select');
const roomSelectEl = document.querySelector('#room-select');
const pageShellEl = document.querySelector('.page-shell');
const vrRootEl = document.querySelector('#vr-root');

function applyStaticTranslations() {
  document.title = t('appTitle');
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
}

function formatStreak(days) {
  const unit = days === 1 ? t('cards.day') : t('cards.days');
  return `${days} ${unit}`;
}

function renderPresentationSelect() {
  presentationSelectEl.innerHTML = presentations
    .map((item) => `<option value="${item.id}">${item.title || t('cards.untitled')}</option>`)
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
        <div class="thumb">${t('cards.preview')}</div>
        <div class="card-main">
          <input class="title-input" value="${item.title}" aria-label="${t('cards.titleInputAria')}" />
          <div class="date">${item.date}</div>
          <div class="card-buttons">
            <button class="chip">${t('cards.editFlashcards')}</button>
            <button class="chip">${t('cards.editPresentationInfo')}</button>
          </div>
        </div>
        <div class="metrics">
          <div>${t('cards.points')}: ${item.points}</div>
          <div>${t('cards.streak')}: ${formatStreak(item.streakDays)}</div>
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
    title: t('cards.defaultNewTitle'),
    date: dateLabel,
    points: 0,
    streakDays: 0
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

applyStaticTranslations();
renderCards();
renderPresentationSelect();
renderRoomSelect();
