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
      back: 'Back'
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
      untitled: 'Untitled',
      defaultNewTitle: 'Title'
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
