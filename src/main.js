import './styles.css';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { startTrainingRoom } from './vr/room.js';
import { roomOptions } from './vr/rooms.js';
import { t } from './i18n/texts.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const TEST_PRESENTATION_PDF_PATH = `${import.meta.env.BASE_URL}presentations/test-presentation.pdf`;

const presentations = [
  {
    id: crypto.randomUUID(),
    title: 'Test Presentation',
    date: '12-02-2025',
    points: 120,
    streakDays: 3,
    extraInfo: 'Focus on clear transitions between ecosystems and genetics.',
    presentationFile: null,
    presentationFileName: 'test-presentation.pdf',
    presentationFilePath: TEST_PRESENTATION_PDF_PATH,
    presentationPages: []
  },
  {
    id: crypto.randomUUID(),
    title: 'English Presentation',
    date: '19-02-2025',
    points: 50,
    streakDays: 1,
    extraInfo: '',
    presentationFile: null,
    presentationFileName: '',
    presentationFilePath: '',
    presentationPages: []
  }
];

const listEl = document.querySelector('#presentation-list');
const modalEl = document.querySelector('#start-modal');
const infoModalEl = document.querySelector('#info-modal');
const presentationSelectEl = document.querySelector('#presentation-select');
const roomSelectEl = document.querySelector('#room-select');
const infoDateEl = document.querySelector('#info-date');
const infoExtraEl = document.querySelector('#info-extra');
const infoFileEl = document.querySelector('#info-file');
const infoFileButtonEl = document.querySelector('#info-file-button');
const infoFileNameEl = document.querySelector('#info-file-name');
const pageShellEl = document.querySelector('.page-shell');
const vrRootEl = document.querySelector('#vr-root');
let infoEditPresentationId = null;
let selectedPdfFile = null;
let selectedPdfFileName = '';
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

async function renderPdfPages(pdfSource) {
  const pdfData = new Uint8Array(await pdfSource.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const pages = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(2, 720 / baseViewport.width);
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

async function hydratePresentationFile(presentation) {
  if (presentation.presentationPages?.length || !presentation.presentationFilePath) {
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
      presentation.presentationPages = await renderPdfPages(pdfBlob);
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
  selectedPdfFile = entry.presentationFile ?? null;
  selectedPdfFileName = entry.presentationFileName ?? '';
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
  entry.extraInfo = infoExtraEl.value.trim();
  entry.presentationFile = selectedPdfFile;
  entry.presentationFileName = selectedPdfFileName;
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

  await hydratePresentationFile(selectedPresentation);

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
    id: crypto.randomUUID(),
    title: t('cards.defaultNewTitle'),
    date: dateLabel,
    points: 0,
    streakDays: 0,
    extraInfo: '',
    presentationFile: null,
    presentationFileName: '',
    presentationFilePath: '',
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
