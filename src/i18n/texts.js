const translations = {
  en: {
    appTitle: 'Be Present',
    brand: 'Be Present',
    tabs: {
      presentations: 'My Presentations',
      practice: 'Practice',
      customization: 'Customization',
      analyses: 'Your Analyses',
      vrheadset: 'Our VR-Headset',
      history: 'History',
      settings: 'Settings'
    },
    user: {
      username: 'Jasmin'
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
      targetTimeLabel: 'Target time (minutes)',
      targetTimePlaceholder: 'Duration in minutes',
      extraInfoLabel: 'Extra information',
      extraInfoPlaceholder: 'Add notes, goals, or context for this presentation. (for example Assessment guidelines of your teacher)',
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
      trainingRoom: 'WebXR Training Room',
      nextSlide: 'Next',
      previousSlide: 'Previous'
    }
  },
  de: {
    appTitle: 'Be Present',
    brand: 'Be Present',
    tabs: {
      presentations: 'Meine Präsentationen',
      practice: 'Üben',
      customization: 'Anpassen',
      analyses: 'Deine Analysen',
      vrheadset: 'Unser VR-Headset',
      history: 'Verlauf',
      settings: 'Einstellungen'
    },
    user: {
      username: 'Jasmin'
    },
    actions: {
      startPresentation: 'Präsentation starten',
      newPresentation: '+ Neue Präsentation',
      cancel: 'Abbrechen',
      start: 'Starten',
      back: 'Zurück',
      save: 'Speichern'
    },
    modal: {
      title: 'Präsentation auswählen',
      presentationLabel: 'Präsentation',
      roomLabel: 'Raum'
    },
    cards: {
      preview: 'Vorschau',
      titleInputAria: 'Präsentationstitel',
      editFlashcards: 'Karteikarten bearbeiten',
      editPresentationInfo: 'Präsentationsinfos bearbeiten',
      points: 'Punkte',
      streak: 'Streak',
      day: 'Tag',
      days: 'Tage',
      page: 'Seite',
      pages: 'Seiten',
      untitled: 'Ohne Titel',
      defaultNewTitle: 'Titel',
      extraInfoFallback: 'Noch keine zusätzlichen Informationen.',
      noPresentationFile: 'Noch keine Präsentations-PDF hochgeladen.'
    },
    infoModal: {
      title: 'Präsentationsinfos bearbeiten',
      dateLabel: 'Datum',
      targetTimeLabel: 'Zielzeit (Minuten)',
      targetTimePlaceholder: 'Dauer in Minuten',
      extraInfoLabel: 'Zusätzliche Informationen',
      extraInfoPlaceholder: 'Füge Notizen, Ziele oder Kontext zu dieser Präsentation hinzu. (zum Beispiel Bewertungskriterien deiner Lehrkraft)',
      presentationFileLabel: 'Präsentationsdatei',
      uploadPdf: 'PDF hochladen',
      noFileSelected: 'Keine PDF ausgewählt.',
      invalidPdf: 'Bitte wähle eine PDF-Datei aus.',
      readingPdf: 'PDF-Vorschau wird vorbereitet...',
      pdfReadError: 'Für diese PDF konnte keine Vorschau erstellt werden.'
    },
    rooms: {
      classroomA: 'Klassenzimmer A',
      auditorium: 'Aula',
      seminarRoom: 'Seminarraum'
    },
    vr: {
      trainingRoom: 'WebXR-Trainingsraum',
      nextSlide: 'Weiter',
      previousSlide: 'Zurück'
    }
  }
};

const activeLocale = 'de';

export function t(path) {
  const value = path.split('.').reduce((acc, segment) => acc?.[segment], translations[activeLocale]);
  return value ?? path;
}
