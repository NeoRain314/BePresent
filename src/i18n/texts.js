const translations = {
  en: {
    appTitle: 'Be Present',
    brand: 'Be Present',
    tabs: {
      presentations: 'My Presentations',
      practice: 'Practice',
      customization: 'Customization'
    },
    actions: {
      startPresentation: 'Start Presentation',
      newPresentation: '+ New Presentation',
      cancel: 'Cancel',
      start: 'Start',
      back: 'Back',
      save: 'Save'
    },
    modal: {
      title: 'Presentation Selection',
      presentationLabel: 'Presentation',
      roomLabel: 'Room'
    },
    cards: {
      preview: 'Preview',
      titleInputAria: 'Presentation title',
      editFlashcards: 'Edit flashcards',
      editPresentationInfo: 'Edit presentation info',
      points: 'Points',
      streak: 'Streak',
      day: 'day',
      days: 'days',
      page: 'page',
      pages: 'pages',
      untitled: 'Untitled',
      defaultNewTitle: 'Title',
      extraInfoFallback: 'No extra information yet.',
      noPresentationFile: 'No presentation PDF uploaded.'
    },
    infoModal: {
      title: 'Edit presentation info',
      dateLabel: 'Date',
      extraInfoLabel: 'Extra information',
      extraInfoPlaceholder: 'Add notes, goals, or context for this presentation.',
      presentationFileLabel: 'Presentation file',
      uploadPdf: 'Upload PDF',
      noFileSelected: 'No PDF selected.',
      invalidPdf: 'Please select a PDF file.',
      readingPdf: 'Preparing PDF preview...',
      pdfReadError: 'Could not prepare a preview for this PDF.'
    },
    rooms: {
      classroomA: 'Classroom A',
      auditorium: 'Auditorium',
      seminarRoom: 'Seminar Room'
    },
    vr: {
      trainingRoom: 'WebXR Training Room'
    }
  }
};

const activeLocale = 'en';

export function t(path) {
  const value = path.split('.').reduce((acc, segment) => acc?.[segment], translations[activeLocale]);
  return value ?? path;
}
