window.addEventListener('load', () => {
  const splashScreen = document.getElementById('splash-screen');
  const splashVideo = document.getElementById('splash-video');
  const mainContent = document.getElementById('app-content');

  // Tenta tocar o vídeo
  splashVideo.play().catch(error => {
    console.error("Autoplay do vídeo falhou:", error);
    hideSplashScreen();
  });

  // Função para esconder a splash screen
  function hideSplashScreen() {
    splashScreen.classList.add('hidden');
    mainContent.style.visibility = 'visible';

    setTimeout(() => {
      splashScreen.style.display = 'none';
    }, 800); // Mesmo tempo da transição CSS
  }

  // Ouve o evento de finalização do vídeo
  splashVideo.addEventListener('ended', hideSplashScreen);
});
