const en = {
  meta: {
    title: 'Corporate stand-up comedian | Harri Muikkula',
    description:
      'Stand-up comedian for corporate and private events — Christmas parties, summer parties, and customer events. Request a quote today.',
  },

  brand: {
    name: 'Harri Muikkula',
    tagline: 'Stand-up comedian / Host',
    email: 'harri.muikkula@gmail.com',
    phone: '+358 41 431 6489',
  },

  common: {
    requestQuote: 'Request a quote',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    menu: 'Menu',
    language: 'Language',
    finnish: 'Finnish',
    english: 'English',
    email: 'Email',
    phone: 'Phone',
    sendAnotherMessage: 'Send another message',
    allRightsReserved: 'All rights reserved.',
    promoImage: 'Promo photo',
    promoImageHint:
      'Add an image by setting hero.imageSrc in the locale content file.',
  },

  navLinks: [
    { label: 'Home', href: '#hero' },
    { label: 'About', href: '#esittely' },
    { label: 'Calendar', href: '#kalenteri' },
    { label: 'From gigs', href: '#media' },
    { label: 'Feedback from gigs', href: '#referenssit' },
  ],

  hero: {
    eyebrow: 'Humour and laughter for private and corporate celebrations',
    title: 'Looking for guaranteed fun for your event?',
    subtitle:
      'I bring a professional stand-up show to Christmas parties, summer parties, weddings, and customer events. Comedy that is easy and safe to laugh at! I perform in both Finnish and English.',
    ctaPrimary: 'Check availability',
    ctaSecondary: 'View gig calendar',
    imageAlt: 'Comedian on stage at a corporate event',
    imageSrc: '/images/promo-2.png',
    photoCredit: 'Janne Oravisto',
  },

  about: {
    title: 'Who is Harri Muikkula?',
    paragraphs: [
      'Harri is an Oulu-born comedian who has planted his feet in Helsinki concrete. His stage energy outweighs rush-hour traffic and the sleep debt of two small children. His stories hook the audience into a laughter knot — hopefully one that loosens on the way home.',
    ],
  },

  intro: {
    title: 'Humour that works in every setting.',
    paragraphs: [
      'At private and corporate events, stand-up cannot be guesswork. You need a performer who can read the room, respect your brand, and bring sharp humour suited to the occasion.',
      'I have performed at corporate events and weddings, among others. Every gig is tailored to the audience and the mood of the occasion.',
      'I can also add a musical element with guitar. If you wish, I can write a song about your company’s year in review or the birthday guest of honour.',
      'I can also host your event (with or without a stand-up set). I have experience hosting several events with over 300 guests.',
    ],
    stats: [
      { value: '250+', label: 'Gigs' },
      { value: '9 years', label: 'On stage' },
    ],
  },

  media: {
    eyebrow: 'Media',
    title: 'News from gigs',
    subtitle: 'See what my stand-up looks like.',
    longVideosTitle: 'Full-length gig videos',
    shortClipsTitle: 'Short clips',
    imagesTitle: 'Gig photos',
    addVideoLink: 'Add a YouTube or Vimeo link',
    longGigVideos: [
      {
        id: 'lahden-seurahuone',
        title: 'Lahti Seurahuone, March 2026',
        platform: 'youtube',
        videoId: 'wi223QBiHZA',
      },
    ],
    shortClips: [
      {
        id: 'klippi-2',
        title: 'It matters to me to call my grandma',
        platform: 'youtube',
        videoId: 'https://youtube.com/shorts/ha3WgoWY0X0',
      },
      {
        id: 'klippi-3',
        title: 'I ended up in hospital in the Czech Republic',
        platform: 'youtube',
        videoId: 'https://youtube.com/shorts/LFWALrhQdUQ',
      },
      {
        id: 'klippi-4',
        title: 'A country person moving to Helsinki',
        platform: 'youtube',
        videoId: 'https://youtube.com/shorts/02A_5OmVSVI',
      },
    ],
    images: [
      {
        alt: 'Stand-up comedian laughing with a microphone in a pub',
        caption: 'Oulunkylän Jano, September 2023',
        src: '/images/gallery-1.png',
        photoCredit: 'Antti Akonniemi',
      },
      {
        alt: 'Comedian full body on stage with audience in front',
        caption: 'Kumpula village hall, December 2023',
        src: '/images/gallery-2.png',
        photoCredit: 'Henri Lehto',
      },
      {
        alt: 'Comedian performing with a microphone',
        caption: 'Maltainen Riekko, June 2025',
        src: '/images/gallery-3.png',
        photoCredit: 'Ville Vaarne',
      },
      {
        alt: 'Comedian in a suit at a private wedding celebration',
        caption: 'Private wedding celebration, February 2025',
        src: '/images/gallery-4.png',
        photoCredit: null,
      },
    ],
  },

  references: {
    eyebrow: 'Feedback from gigs',
    title: 'What people say',
    subtitle: '',
    logos: [],
    testimonials: [
      {
        quote:
          'Harri entertained our entire wedding crowd whether they were from Savo or Helsinki. A great set, brilliantly tailored to our celebration!',
        author: 'Private wedding celebration',
        role: '',
        company: '',
      },
    ],
  },

  contact: {
    eyebrow: 'Contact',
    title: 'Request a quote',
    subtitle:
      'Tell me about your event — I usually reply within 24 hours about availability and pricing.',
    fields: {
      name: 'Name',
      company: 'Company / organisation',
      date: 'Preferred date',
      message: 'Message',
    },
    messagePlaceholder:
      'Tell me about the event, audience size, and any wishes...',
    submitLabel: 'Send request',
    submittingLabel: 'Sending...',
    successMessage: 'Thank you for your message! We will be in touch soon.',
    errorMessage:
      'Sending failed. Please try again or contact us by email.',
    configErrorMessage:
      'The form is not connected to email yet. Add the Web3Forms key to the .env file.',
  },

  calendar: {
    eyebrow: 'Gig calendar',
    title: 'Upcoming gigs',
    subtitle: 'See where you can catch me live.',
    viewList: 'List',
    viewCalendar: 'Calendar',
    viewAriaLabel: 'Gig view',
    tickets: 'Tickets',
    private: 'Private',
    festival: 'Festival',
    event: 'Event',
    venue: 'Venue',
    city: 'Location',
    cityColumn: 'City',
    dateColumn: 'Date',
    placeColumn: 'Venue',
    ticketSales: 'Ticket sales',
    empty: 'No upcoming gigs at the moment.',
    otherGigs: 'Other gigs',
    moreCount: (n) => `+${n} more`,
    syncFailed:
      'Gig sync failed just now. Please check Firestore permissions.',
    unplacedGigs:
      'Some gigs could not be placed on the calendar — see the list view.',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    dateLocale: 'en-GB',
  },
}

export default en
