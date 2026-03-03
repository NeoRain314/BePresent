import './styles.css';
import { startTrainingRoom } from './vr/room.js';
import { t } from './i18n/texts.js';

const roomOptions = [
  { id: 'classroom-a', label: t('rooms.classroomA') },
  { id: 'auditorium', label: t('rooms.auditorium') },
  { id: 'seminar', label: t('rooms.seminarRoom') }
];

const presentations = [
  {
    id: crypto.randomUUID(),
    title: 'Biology GFS',
    date: '12-02-2025',
    points: 120,
    streakDays: 3,
    extraInfo: 'Focus on clear transitions between ecosystems and genetics.'
  },
  {
    id: crypto.randomUUID(),
    title: 'English Presentation',
    date: '19-02-2025',
    points: 50,
    streakDays: 1,
    extraInfo: ''
  }
];

const listEl = document.querySelector('#presentation-list');
const modalEl = document.querySelector('#start-modal');
const infoModalEl = document.querySelector('#info-modal');
const presentationSelectEl = document.querySelector('#presentation-select');
const roomSelectEl = document.querySelector('#room-select');
const infoDateEl = document.querySelector('#info-date');
const infoExtraEl = document.querySelector('#info-extra');
const pageShellEl = document.querySelector('.page-shell');
const vrRootEl = document.querySelector('#vr-root');
let infoEditPresentationId = null;

function applyStaticTranslations() {
  document.title = t('appTitle');
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  }
}

function formatStreak(days) {
  const unit = days === 1 ? t('cards.day') : t('cards.days');
  return `${days} ${unit}`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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
          <input class="title-input" value="${escapeHtml(item.title ?? '')}" aria-label="${t('cards.titleInputAria')}" />
          <div class="date">${escapeHtml(item.date ?? '')}</div>
          <div class="extra-info">${escapeHtml(item.extraInfo || t('cards.extraInfoFallback'))}</div>
          <div class="card-buttons">
            <button class="chip">${t('cards.editFlashcards')}</button>
            <button class="chip" data-action="edit-info">${t('cards.editPresentationInfo')}</button>
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

function toDateInputValue(dateLabel) {
  if (!dateLabel) {
    return '';
  }

  const parts = dateLabel.split('-');
  if (parts.length === 3 && parts[0].length === 2) {
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }

  return dateLabel;
}

function fromDateInputValue(value) {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

function openStartModal() {
  renderPresentationSelect();
  modalEl.hidden = false;
}

function closeStartModal() {
  modalEl.hidden = true;
}

function openInfoModal(presentationId) {
  const entry = presentations.find((presentation) => presentation.id === presentationId);
  if (!entry) {
    return;
  }

  infoEditPresentationId = presentationId;
  infoDateEl.value = toDateInputValue(entry.date);
  infoExtraEl.value = entry.extraInfo ?? '';
  infoModalEl.hidden = false;
}

function closeInfoModal() {
  infoModalEl.hidden = true;
  infoEditPresentationId = null;
}

function saveInfoModal() {
  const entry = presentations.find((presentation) => presentation.id === infoEditPresentationId);
  if (!entry) {
    closeInfoModal();
    return;
  }

  const normalizedDate = fromDateInputValue(infoDateEl.value);
  if (normalizedDate) {
    entry.date = normalizedDate;
  }
  entry.extraInfo = infoExtraEl.value.trim();
  closeInfoModal();
  renderCards();
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
    streakDays: 0,
    extraInfo: ''
  });

  renderCards();
}

document.querySelector('#new-presentation-btn').addEventListener('click', addMockPresentation);
document.querySelector('#start-presentation-btn').addEventListener('click', openStartModal);
document.querySelector('#modal-cancel').addEventListener('click', closeStartModal);
document.querySelector('#modal-start').addEventListener('click', launchSelectedPresentation);
document.querySelector('#info-cancel').addEventListener('click', closeInfoModal);
document.querySelector('#info-save').addEventListener('click', saveInfoModal);

listEl.addEventListener('click', (event) => {
  const editInfoButton = event.target.closest('[data-action="edit-info"]');
  if (!editInfoButton) {
    return;
  }

  const card = editInfoButton.closest('.card');
  if (!card?.dataset.id) {
    return;
  }

  openInfoModal(card.dataset.id);
});

modalEl.addEventListener('click', (event) => {
  if (event.target === modalEl) {
    closeStartModal();
  }
});
infoModalEl.addEventListener('click', (event) => {
  if (event.target === infoModalEl) {
    closeInfoModal();
  }
});

applyStaticTranslations();
renderCards();
renderPresentationSelect();
renderRoomSelect();
