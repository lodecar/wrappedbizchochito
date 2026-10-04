export function setupFavorGame({ container, result, onStart, onFinish }) {
  const buttons = [...container.querySelectorAll('.favor')];
  let locked = false;

  container.addEventListener('click', (event) => {
    const selected = event.target.closest('.favor');
    if (!selected || locked) return;

    event.preventDefault();
    event.stopPropagation();
    locked = true;
    onStart();

    buttons.forEach(button => button.classList.remove('chosen'));
    selected.classList.add('chosen');
    result.textContent = 'Procesando una elección totalmente imparcial…';

    let index = 0;
    const roulette = setInterval(() => {
      buttons.forEach(button => button.classList.remove('chosen'));
      buttons[index % buttons.length].classList.add('chosen');
      index++;
    }, 120);

    setTimeout(() => {
      clearInterval(roulette);
      buttons.forEach(button => button.classList.remove('chosen'));
      const worstPrize = buttons[buttons.length - 1];
      worstPrize.classList.add('chosen');
      result.innerHTML = '🎉 HAS GANADO: <strong>CALIPO DE LOMO</strong>';
      onFinish();
    }, 1450);
  });

  return { isWaiting: () => container.classList.contains('show') && !result.textContent };
}
