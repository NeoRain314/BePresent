import './styles.css';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { startTrainingRoom } from './vr/room.js';
import { roomOptions } from './vr/rooms.js';
import { t } from './i18n/texts.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const TEST_PRESENTATION_PDF_PATH = `${import.meta.env.BASE_URL}presentations/test-presentation.pdf`;

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const presentations = [
  {
    id: createId(),
    title: 'BePresent - kleine Präsentation',
    date: '16-12-2025',
    targetTime: '',
    points: 150,
    streakDays: 3,
    extraInfo: '',
    presentationFile: null,
    presentationFileName: 'test-presentation.pdf',
    presentationFilePath: TEST_PRESENTATION_PDF_PATH,
    presentationPagesFullyLoaded: false,
    presentationPages: []
  },
  {
    id: createId(),
    title: 'Test Präsentation',
    date: '30-06-2026',
    targetTime: '',
    points: 0,
    streakDays: 0,
    extraInfo: '',
    presentationFile: null,
    presentationFileName: '',
    presentationFilePath: '',
    presentationPagesFullyLoaded: false,
    presentationPages: []
  }
];

const listEl = document.querySelector('#presentation-list');
const modalEl = document.querySelector('#start-modal');
const infoModalEl = document.querySelector('#info-modal');
const presentationSelectEl = document.querySelector('#presentation-select');
const roomSelectEl = document.querySelector('#room-select');
const infoDateEl = document.querySelector('#info-date');
const infoTargetTimeEl = document.querySelector('#info-target-time');
const infoExtraEl = document.querySelector('#info-extra');
const infoFileEl = document.querySelector('#info-file');
const infoFileButtonEl = document.querySelector('#info-file-button');
const infoFileNameEl = document.querySelector('#info-file-name');
const pageShellEl = document.querySelector('.page-shell');
const vrRootEl = document.querySelector('#vr-root');
let infoEditPresentationId = null;
let selectedPdfFile = null;
let selectedPdfFileName = '';
let selectedPdfPagesFullyLoaded = false;
let selectedPdfPages = [];

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

function renderPreview(item) {
  const firstPage = item.presentationPages?.[0];

  if (!firstPage) {
    return `<div class="thumb thumb-empty">${t('cards.preview')}</div>`;
  }

  const fileName = item.presentationFileName || t('cards.preview');

  return `
    <div class="thumb thumb-pdf">
      <img
        class="pdf-preview"
        src="${escapeHtml(firstPage)}"
        title="${escapeHtml(fileName)} ${t('cards.preview')}"
        alt="${escapeHtml(fileName)} ${t('cards.preview')}"
      />
    </div>
  `;
}

async function renderPdfPages(pdfSource, { pageLimit = Infinity } = {}) {
  const pdfData = new Uint8Array(await pdfSource.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const pages = [];

  try {
    const lastPage = Math.min(pdf.numPages, pageLimit);
    for (let pageNumber = 1; pageNumber <= lastPage; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1.5, 640 / baseViewport.width);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { alpha: false });

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: context, viewport }).promise;
      pages.push(canvas.toDataURL('image/png'));
      page.cleanup();
    }
  } finally {
    await pdf.destroy();
  }

  return pages;
}

async function hydrateStaticPresentationFiles() {
  await Promise.all(presentations.map((presentation) => hydratePresentationFile(presentation)));
}

async function hydratePresentationFile(presentation, { allPages = false } = {}) {
  const hasEnoughPages = allPages ? presentation.presentationPagesFullyLoaded : presentation.presentationPages?.length;
  if (hasEnoughPages || !presentation.presentationFilePath) {
    return;
  }

  if (presentation.presentationFileLoadPromise) {
    await presentation.presentationFileLoadPromise;
    return;
  }

  presentation.presentationFileLoadPromise = (async () => {
    try {
      const pdfUrl = new URL(presentation.presentationFilePath, window.location.href);
      const response = await fetch(pdfUrl.href, { cache: 'no-cache' });
      if (!response.ok) {
        console.warn(`Static presentation PDF not found: ${pdfUrl.href}`);
        return;
      }

      const pdfBlob = await response.blob();
      presentation.presentationFile = pdfBlob;
      presentation.presentationPages = await renderPdfPages(pdfBlob, {
        pageLimit: allPages ? Infinity : 1
      });
      presentation.presentationPagesFullyLoaded = allPages;
    } catch (error) {
      console.warn(`Could not load static presentation PDF: ${presentation.presentationFilePath}`, error);
    } finally {
      presentation.presentationFileLoadPromise = null;
    }
  })();

  await presentation.presentationFileLoadPromise;
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
        ${renderPreview(item)}
        <div class="card-main">
          <input class="title-input" value="${escapeHtml(item.title ?? '')}" aria-label="${t('cards.titleInputAria')}" />
          <div class="date">${escapeHtml(item.date ?? '')}</div>
          <div class="extra-info">${escapeHtml(item.extraInfo || t('cards.extraInfoFallback'))}</div>
          <div class="file-status">${escapeHtml(item.presentationFileName || t('cards.noPresentationFile'))}</div>
          <div class="card-buttons">
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

function normalizeTargetTime(value) {
  if (!value) {
    return '';
  }

  const minutes = Number.parseInt(value, 10);
  return Number.isFinite(minutes) && minutes > 0 ? String(minutes) : '';
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
  infoTargetTimeEl.value = entry.targetTime ?? '';
  infoExtraEl.value = entry.extraInfo ?? '';
  selectedPdfFile = entry.presentationFile ?? null;
  selectedPdfFileName = entry.presentationFileName ?? '';
  selectedPdfPagesFullyLoaded = entry.presentationPagesFullyLoaded ?? false;
  selectedPdfPages = entry.presentationPages ?? [];
  infoFileEl.value = '';
  infoFileNameEl.textContent = selectedPdfFileName || t('infoModal.noFileSelected');
  infoModalEl.hidden = false;
}

function closeInfoModal() {
  infoModalEl.hidden = true;
  infoEditPresentationId = null;
  selectedPdfFile = null;
  selectedPdfFileName = '';
  selectedPdfPagesFullyLoaded = false;
  selectedPdfPages = [];
  infoFileEl.value = '';
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
  entry.targetTime = normalizeTargetTime(infoTargetTimeEl.value);
  infoTargetTimeEl.value = entry.targetTime;
  entry.extraInfo = infoExtraEl.value.trim();
  entry.presentationFile = selectedPdfFile;
  entry.presentationFileName = selectedPdfFileName;
  entry.presentationPagesFullyLoaded = selectedPdfPagesFullyLoaded;
  entry.presentationPages = selectedPdfPages;
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

  await hydratePresentationFile(selectedPresentation, { allPages: true });

  closeStartModal();
  pageShellEl.hidden = true;
  vrRootEl.hidden = false;

  await startTrainingRoom({
    container: vrRootEl,
    presentationTitle: selectedPresentation.title,
    presentationPages: selectedPresentation.presentationPages ?? [],
    roomLabel: roomOptions.find((room) => room.id === roomId)?.label ?? roomId,
    roomModelUrl: roomOptions.find((room) => room.id === roomId)?.modelUrl ?? '',
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
    id: createId(),
    title: t('cards.defaultNewTitle'),
    date: dateLabel,
    targetTime: '',
    points: 0,
    streakDays: 0,
    extraInfo: '',
    presentationFile: null,
    presentationFileName: '',
    presentationFilePath: '',
    presentationPagesFullyLoaded: false,
    presentationPages: []
  });

  renderCards();
}

document.querySelector('#new-presentation-btn').addEventListener('click', addMockPresentation);
document.querySelector('#start-presentation-btn').addEventListener('click', openStartModal);
document.querySelector('#modal-cancel').addEventListener('click', closeStartModal);
document.querySelector('#modal-start').addEventListener('click', launchSelectedPresentation);
document.querySelector('#info-cancel').addEventListener('click', closeInfoModal);
document.querySelector('#info-save').addEventListener('click', saveInfoModal);
infoFileButtonEl.addEventListener('click', () => infoFileEl.click());
infoFileEl.addEventListener('change', async () => {
  const file = infoFileEl.files?.[0];
  if (!file) {
    return;
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    infoFileEl.value = '';
    infoFileNameEl.textContent = t('infoModal.invalidPdf');
    return;
  }

  infoFileNameEl.textContent = t('infoModal.readingPdf');

  try {
    const pages = await renderPdfPages(file);
    selectedPdfFileName = file.name;
    selectedPdfFile = file;
    selectedPdfPagesFullyLoaded = true;
    selectedPdfPages = pages;
    infoFileNameEl.textContent = `${file.name} (${pages.length} ${pages.length === 1 ? t('cards.page') : t('cards.pages')})`;
  } catch {
    infoFileEl.value = '';
    infoFileNameEl.textContent = t('infoModal.pdfReadError');
  }
});

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
renderRoomSelect();
renderCards();
renderPresentationSelect();
void hydrateStaticPresentationFiles().then(() => {
  renderCards();
});
