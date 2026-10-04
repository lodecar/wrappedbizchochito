import { createAudioController } from './audio.js';
import { setupFavorGame } from './minigame.js';

const app = document.getElementById('app');
const scenes = [...document.querySelectorAll('.scene')];
const tapZone = document.getElementById('tapZone');
const backButton = document.getElementById('backButton');
const progress = document.getElementById('progress');
const hint = document.getElementById('hint');
const daysElement = document.getElementById('days');
const audioButton = document.getElementById('audioButton');
const sceneAudio = document.getElementById('sceneAudio');
const songPlay = document.getElementById('songPlay');
const tvPhotos = [...document.querySelectorAll('[data-tv-photo]')];
const crtScreen = document.getElementById('crtScreen');
const crtStatic = document.getElementById('crtStatic');

let currentScene = 0;
let currentStep = 0;
let isAnimating = false;
let gameIsRunning = false;
let currentTvPhoto = -1;

const audio = createAudioController(sceneAudio, audioButton);

function getSteps(sceneIndex = currentScene) {
  return [...scenes[sceneIndex].querySelectorAll('[data-step]')];
}

function buildProgress() {
  scenes.forEach((_, index) => {
    const dot = document.createElement('i');
    dot.classList.toggle('on', index === 0);
    progress.appendChild(dot);
  });
}

function updateProgress() {
  [...progress.children].forEach((dot, index) => {
    dot.classList.toggle('on', index === currentScene);
  });
}

function calculateDaysTogether() {
  const start = Date.UTC(2024, 5, 25);
  const today = new Date();
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((now - start) / 86400000);
}

function animateDays() {
  const total = calculateDaysTogether();
  let startTime = null;

  function tick(time) {
    if (startTime === null) startTime = time;
    const progress = Math.min(1, (time - startTime) / 950);
    const eased = 1 - Math.pow(1 - progress, 3);
    daysElement.textContent = Math.round(total * eased).toLocaleString('es-ES');
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function showNextTvPhoto() {
  if (!tvPhotos.length) return false;

  const nextIndex = currentTvPhoto + 1;
  if (nextIndex >= tvPhotos.length) return false;

  tvPhotos.forEach(photo => photo.classList.remove('show'));
  crtStatic?.classList.remove('on');
  crtScreen?.classList.remove('flash');
  void crtScreen?.offsetWidth;
  crtStatic?.classList.add('on');
  crtScreen?.classList.add('flash');

  currentTvPhoto = nextIndex;
  window.setTimeout(() => tvPhotos[currentTvPhoto].classList.add('show'), 90);
  return true;
}

function revealStep(element) {
  element.classList.add('show');
  if (element === daysElement) animateDays();

  if (element.id === 'introTv') {
    window.setTimeout(() => showNextTvPhoto(), 260);
  }

  if (element.id === 'favors') {
    tapZone.style.pointerEvents = 'none';
    hint.textContent = 'ELIGE UN FAVOR';
  }
}


function revealSceneIntro() {
  const steps = getSteps();

  if (steps.length === 0) {
    currentStep = 0;
    return;
  }

  // Cada slide entra mostrando ya su primer texto. A partir de ahí,
  // cada clic/tap revela el siguiente elemento de forma interactiva.
  revealStep(steps[0]);
  currentStep = 1;
}

function goToScene(index) {
  if (index < 0 || index >= scenes.length) return;
  isAnimating = true;
  const oldScene = scenes[currentScene];
  oldScene.classList.add('leave');

  setTimeout(() => {
    oldScene.classList.remove('active', 'leave');
    currentScene = index;
    currentStep = 0;
    if (currentScene === 0) {
      currentTvPhoto = -1;
      tvPhotos.forEach(photo => photo.classList.remove('show'));
    }
    scenes[currentScene].classList.add('active');
    revealSceneIntro();
    updateProgress();
    audio.playScene(currentScene);
    isAnimating = false;
  }, 330);
}

function next() {
  if (isAnimating || gameIsRunning) return;
  const steps = getSteps();

  // En la portada, una vez encendida la tele, los siguientes clics
  // cambian de foto antes de abandonar la escena.
  if (currentScene === 0 && currentStep >= steps.length && showNextTvPhoto()) {
    return;
  }

  if (currentStep < steps.length) {
    revealStep(steps[currentStep]);
    currentStep++;
    return;
  }

  if (currentScene < scenes.length - 1) goToScene(currentScene + 1);
  else hint.textContent = 'FIN · POR AHORA';
}

function previous() {
  if (isAnimating || gameIsRunning) return;
  const steps = getSteps();

  if (currentStep > 0) {
    currentStep--;
    steps[currentStep].classList.remove('show');
    return;
  }

  if (currentScene === 0) return;
  scenes[currentScene].classList.remove('active');
  currentScene--;
  scenes[currentScene].classList.add('active');
  const previousSteps = getSteps();
  previousSteps.forEach(step => step.classList.add('show'));
  currentStep = previousSteps.length;
  updateProgress();
  audio.playScene(currentScene);
}

setupFavorGame({
  container: document.getElementById('favors'),
  result: document.getElementById('rigged'),
  onStart() {
    gameIsRunning = true;
    tapZone.style.pointerEvents = 'none';
    hint.textContent = 'EL SISTEMA ESTÁ DECIDIENDO…';
  },
  onFinish() {
    gameIsRunning = false;
    tapZone.style.pointerEvents = 'auto';
    hint.textContent = 'CLIC / TAP PARA CONTINUAR →';
  }
});

// Intentamos arrancar la música desde el primer momento.
// Los navegadores que permiten autoplay empezarán directamente.
audio.playScene(0);

// Chrome/Safari pueden bloquear audio con sonido hasta la primera interacción.
// En ese caso, el primer clic/tap/tecla desbloquea la música automáticamente,
// sin que Carla tenga que pulsar el botón AUDIO.
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  audio.playScene(currentScene);
}

document.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
document.addEventListener('keydown', unlockAudio, { once: true, capture: true });

tapZone.addEventListener('click', next);
backButton.addEventListener('click', previous);
audioButton.addEventListener('click', () => audio.toggle(currentScene));
songPlay.addEventListener('click', () => { audio.playMainSong(); songPlay.textContent = '♫'; });

app.tabIndex = 0;
app.addEventListener('keydown', (event) => {
  if (['ArrowRight', 'Enter', ' '].includes(event.key)) {
    event.preventDefault();
    next();
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    previous();
  }
});

buildProgress();
revealSceneIntro();
