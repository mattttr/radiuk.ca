// =============================================================================
//  SITE CONTENT
//  Almost everything you'd want to tweak (copy, links, skills, photos, tips)
//  lives in this one file. Lines marked TODO are guesses worth double-checking.
// =============================================================================

export const profile = {
  name: 'Matt Radiuk',
  firstName: 'Matt',
  roles: ['Software Engineer', 'Problem Solver', 'Creative Developer', 'Backend Builder', 'Cloud Wrangler'],
  tagline: 'Backend · DevOps · AI · Creative coding',
  experience: '5+ years',
  location: 'British Columbia, Canada', // TODO: confirm (or remove)
  github: 'https://github.com/mattttr',
  githubUser: 'mattttr',
  linkedin: 'https://www.linkedin.com/in/matt-radiuk-089ba0170/',
  azureCredential: 'https://learn.microsoft.com/en-us/users/mattradiuk-6377/credentials/5aa7f8f49c4b2a5c',
  formspree: 'https://formspree.io/f/mqalqdrv',
  repo: 'https://github.com/mattttr/radiuk.ca',
  site: 'radiuk.ca',
};

// Assembled at runtime so the address isn't sitting in plain HTML for scrapers.
export const email = ['mattrdk2', 'gmail.com'].join('@');

export const bio = [
  "I'm a software engineer with 5+ years of experience building scalable SaaS products and crafting tailored solutions for clients. I specialize in backend development, DevOps, and AI, leveraging modern tools to create secure, performant applications.",
  "Whether you're building a new product from the ground up, modernizing legacy systems, or adding AI-powered features to enhance user experience, I can help deliver production-ready solutions that scale with your business. Please reach out if you have a project in mind or need assistance with anything tech!",
];

export const services = [
  { title: 'Backend', icon: 'computer', text: 'APIs, services and data models built to stay fast, secure and boring under load.' },
  { title: 'DevOps', icon: 'terminal', text: 'CI/CD pipelines, cloud infrastructure and observability on AWS and Azure.' },
  { title: 'AI', icon: 'sketch', text: 'Practical AI features and automation that ship to real users, not just demos.' },
];

// Shown in My Computer > Device Manager. "status" is the joke line under each device.
export const skills = [
  {
    group: 'Languages',
    icon: 'terminal',
    items: [
      { name: 'Java', detail: 'Production SaaS backends, services and APIs.', status: 'This device is working properly.' },
      { name: 'Python', detail: 'Services, automation, data wrangling and AI tooling.', status: 'This device is working properly.' },
      { name: 'Node.js', detail: 'APIs, tooling and the occasional creative-coding sketch.', status: 'This device is working properly.' },
    ],
  },
  {
    group: 'Cloud Platforms',
    icon: 'globe',
    items: [
      { name: 'Amazon Web Services', short: 'AWS', detail: 'Compute, serverless, storage and the glue in between. (This site is hosted on AWS Amplify.)', status: 'This device is working properly.' },
      { name: 'Microsoft Azure', short: 'Azure', detail: 'Certified. Click "View credential" to verify.', status: 'This device is certified and working properly.', link: profile.azureCredential },
    ],
  },
  {
    group: 'Specialties',
    icon: 'programs',
    items: [
      { name: 'Backend Development', detail: 'Designing services that scale with the business.', status: 'This device is working properly.' },
      { name: 'DevOps & CI/CD', detail: 'Pipelines, infrastructure as code, monitoring.', status: 'This device is working properly.' },
      { name: 'AI Integration', detail: 'Adding AI-powered features to real products.', status: 'This device is learning properly.' },
      { name: 'Legacy Modernization', detail: 'Untangling old systems without breaking the business.', status: 'This device is working properly.' },
    ],
  },
  {
    group: 'Peripherals',
    icon: 'mine',
    items: [
      { name: 'Coffee Maker (Primary)', detail: 'Mission critical.', status: 'This device is running hot.' },
      { name: 'Benji (Australian Shepherd)', detail: 'Chief Morale Officer. Requires walks at regular intervals.', status: 'This device is a very good boy.' },
    ],
  },
];

// Gallery: files live in /img/gallery/<file>.jpg with thumbnails in /img/gallery/thumbs/.
export const photos = [
  { file: 'dubai-marina', title: 'Dubai Marina', caption: 'Dubai Marina, underneath the twist of the Cayan Tower.' }, // TODO: confirm caption
  { file: 'benji-sunset', title: 'Benji at Sunset', caption: 'Benji, golden hour on the coast.' }, // TODO: confirm caption
  { file: 'pumpkin-patch', title: 'Pumpkin Patch', caption: 'Test-driving a vintage Case tractor at the pumpkin patch.' },
  { file: 'petra', title: 'Petra', caption: 'The Royal Tombs at Petra, Jordan.' },
  { file: 'rope-swing', title: 'Rope Swing', caption: 'Lake day. Rope swing 1, gravity 1.' }, // TODO: confirm caption
  { file: 'paddleboard', title: 'Paddleboard', caption: 'Post-paddle view of the Vancouver skyline.' }, // TODO: confirm caption
  { file: 'cenote', title: 'Cenote Dos Ojos', caption: 'A swing break at Cenote Dos Ojos, Mexico.' },
];

// "Did you know..." tips for the Welcome screen and Benji's balloons.
export const tips = [
  'Double-click a desktop icon to open it. On a phone, a single tap does the trick.',
  'Drag a window to the left or right edge of the screen to snap it there. Drag it to the top to maximize.',
  'Press Ctrl+K (or ⌘K) to open Run… and launch anything by name.',
  'Everything in the Projects folder is a live p5.js sketch, and most of them react to your mouse.',
  'Start → Settings → Display Properties has color schemes, live wallpapers and screen savers.',
  'Leave the computer alone for a couple of minutes and see what happens.',
  'Type HELP in the MS-DOS Prompt for a list of commands. Some of them aren’t on the list.',
  'There’s a cheat code hidden somewhere. Old-school console players will know it.',
  'Benji is an Australian Shepherd and the real boss of this website.',
  'Right-click the desktop, a title bar or a taskbar button for more options.',
  'Pablo.exe makes a "The Life of Pablo" style cover from any two photos.',
];

export const whatsNew = `WHAT'S NEW IN MATT RADIUK 95
============================

Thanks for upgrading! Highlights in this release:

* A brand new desktop shell. Draggable, resizable, snappable windows,
  a working Start menu and a taskbar with a clock that actually ticks.

* Projects folder: 18 interactive p5.js sketches, including the
  originals from the old site plus 3D Pipes, a Synthwave flyover,
  a live Julia set explorer, Fourier epicycles and more.

* MS-DOS Prompt with a real(ish) command line. Try HELP, NEOFETCH,
  DIR and a few commands that aren't documented anywhere.

* Minesweeper. You're welcome. Sorry about your afternoon.

* Pablo.exe: the cover generator from the old site, rebuilt.

* Display Properties: color schemes (including Midnight for the
  dark-mode crowd), live wallpapers and screen savers.

* Contact Me: an email client that actually delivers.

* Benji, our resident good boy, lives in the system tray.

Known issues:
  - Minesweeper may cause loss of productivity.
  - Screen saver may cause nostalgia.

`;

export const readme = `README.TXT
==========

Hi! I'm Matt, a software engineer who builds backend systems,
cloud infrastructure and AI-powered features for SaaS products.

This site is a tiny operating system written in plain JavaScript:
no frameworks and no build step, just HTML, CSS and ES modules
served straight from AWS Amplify.

Getting around:
  - Double-click icons on the desktop (single tap on a phone).
  - Start menu, bottom left. Ctrl+Esc opens it too.
  - Ctrl+K opens Run..., a command palette with extra steps.
  - Drag windows by their title bars. Snap them to screen edges.

Places worth visiting:
  - About_Me.doc     the short version of who I am
  - Projects         live generative art / creative coding
  - Contact Me       say hello, I read everything
  - MS-DOS Prompt    for the terminal people

Source code: ${profile.repo}
`;
