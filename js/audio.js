/*
 * Música del Wrapped.
 *
 * El audio está activado por defecto.
 * Si el navegador bloquea el autoplay con sonido,
 * se inicia automáticamente con la primera interacción.
 */

const SONGS = {
  kissMe: {
    title: 'Kiss Me Thru The Phone',
    file: './audio/Kiss Me Thru The Phone.mp3',
    startAt: 13
  },

  trapQueen: {
    title: 'Trap Queen',
    file: './audio/Trap Queen.mp3',
    startAt: 11
  },

  meetMeHalfway: {
    title: 'Meet Me Halfway',
    file: './audio/Meet Me Halfway.mp3',
    startAt: 48
  },

  showGoesOn: {
    title: 'The Show Goes On',
    file: './audio/The Show Goes On.mp3',
    startAt: 70
  },

  pargoRojo: {
    title: 'LA GRAN PESCA DEL PARGO ROJO',
    file: './audio/LA GRAN PESCA DEL PARGO ROJO.mp3',
    startAt: 34
  }
};


/*
 * Distribución de música.
 *
 * Cada canción ocupa un bloque continuo.
 * Meet Me Halfway queda para las tres últimas escenas.
 */
const SCENE_MUSIC = [
  SONGS.showGoesOn,       // 01 · Intro
  SONGS.showGoesOn,       // 02 · Antes de ser nosotros
  SONGS.showGoesOn,       // 03 · Primera quedada
  SONGS.showGoesOn,       // 04 · 25.06.2024

  SONGS.kissMe,           // 05 · Días juntos
  SONGS.kissMe,           // 06 · Saona
  SONGS.kissMe,           // 07 · McDonald's

  SONGS.trapQueen,        // 08 · Introducción viajes
  SONGS.trapQueen,        // 09 · Florencia
  SONGS.trapQueen,        // 10 · Cine

  SONGS.pargoRojo,        // 11 · Películas
  SONGS.pargoRojo,        // 12 · Lloros
  SONGS.pargoRojo,        // 13 · Nata
  SONGS.pargoRojo,        // 14 · Minijuego

  SONGS.meetMeHalfway,    // 15 · Nuestra canción
  SONGS.meetMeHalfway,    // 16 · Carta
  SONGS.meetMeHalfway     // 17 · Final
];


export function createAudioController(audioElement, buttonElement) {
  let enabled = true;
  let currentSong = null;
  let currentSceneIndex = 0;
  let audioUnlocked = false;

  buttonElement.textContent = '♫ AUDIO: ON';


  /*
   * Reproduce el audio.
   * Devuelve true si el navegador permite reproducirlo.
   */
  async function tryToPlay() {
    if (!enabled || !currentSong) {
      return false;
    }

    try {
      await audioElement.play();
      audioUnlocked = true;
      return true;
    } catch (error) {
      /*
       * Netlify no es el problema aquí:
       * Chrome / Firefox / Safari pueden bloquear audio con sonido
       * antes de la primera interacción del usuario.
       */
      return false;
    }
  }


  /*
   * Carga una canción y salta al punto indicado.
   */
  function loadAndPlay(song) {
    if (!song) return;

    audioElement.pause();

    currentSong = song;
    audioElement.src = song.file;
    audioElement.load();

    const startSong = async () => {
      try {
        audioElement.currentTime = song.startAt;
      } catch (error) {
        // Esperamos a que el navegador permita cambiar currentTime.
      }

      await tryToPlay();
    };

    if (audioElement.readyState >= 1) {
      startSong();
    } else {
      audioElement.addEventListener(
        'loadedmetadata',
        startSong,
        { once: true }
      );
    }
  }


  /*
   * Música correspondiente a cada escena.
   */
  function playScene(sceneIndex) {
    currentSceneIndex = sceneIndex;

    const nextSong = SCENE_MUSIC[sceneIndex];

    if (!nextSong) return;

    /*
     * Si seguimos dentro del mismo bloque musical,
     * NO reiniciamos la canción.
     */
    if (currentSong === nextSong) {
      if (enabled && audioElement.paused && audioUnlocked) {
        tryToPlay();
      }

      return;
    }

    loadAndPlay(nextSong);
  }


  /*
   * ON / OFF manual.
   */
  function toggle(sceneIndex) {
    currentSceneIndex = sceneIndex;
    enabled = !enabled;

    buttonElement.textContent =
      enabled ? '♫ AUDIO: ON' : '♫ AUDIO: OFF';

    if (enabled) {
      const song = SCENE_MUSIC[currentSceneIndex];

      if (currentSong === song) {
        tryToPlay();
      } else {
        loadAndPlay(song);
      }
    } else {
      audioElement.pause();
    }
  }


  /*
   * Botón específico de Meet Me Halfway.
   */
  function playMainSong() {
    enabled = true;

    buttonElement.textContent = '♫ AUDIO: ON';

    loadAndPlay(SONGS.meetMeHalfway);
  }


  /*
   * DESBLOQUEO DEL AUDIO
   *
   * En cuanto el usuario hace su primer clic, tap o pulsa
   * una tecla, intentamos reproducir la música.
   */
  async function unlockAudio() {
    if (!enabled || audioUnlocked) {
      return;
    }

    const song = SCENE_MUSIC[currentSceneIndex];

    if (!song) return;

    if (currentSong !== song) {
      currentSong = song;
      audioElement.src = song.file;
      audioElement.load();

      await new Promise((resolve) => {
        if (audioElement.readyState >= 1) {
          resolve();
          return;
        }

        audioElement.addEventListener(
          'loadedmetadata',
          resolve,
          { once: true }
        );
      });

      try {
        audioElement.currentTime = song.startAt;
      } catch (error) {
        // No hacemos nada.
      }
    }

    const success = await tryToPlay();

    if (success) {
      removeUnlockListeners();
    }
  }


  function removeUnlockListeners() {
    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  }


  /*
   * Intentamos arrancar desde el principio.
   *
   * Si el navegador lo bloquea, el primer gesto
   * del usuario lo desbloqueará.
   */
  function initialise() {
    currentSceneIndex = 0;

    loadAndPlay(SCENE_MUSIC[0]);

    document.addEventListener(
      'pointerdown',
      unlockAudio,
      { passive: true }
    );

    document.addEventListener(
      'touchstart',
      unlockAudio,
      { passive: true }
    );

    document.addEventListener(
      'keydown',
      unlockAudio
    );
  }


  function getCurrentSongTitle() {
    return currentSong?.title ?? '';
  }


  initialise();


  return {
    playScene,
    toggle,
    playMainSong,
    getCurrentSongTitle
  };
}