/* Vértices · la barra superior se aparta al leer.

   La barra SE ESCONDE al desplazarse hacia abajo —leyendo, no la necesitas y
   ocupa pantalla— y VUELVE al desplazarse hacia arriba, que es el gesto de
   quien va a navegar. Arriba del todo está siempre.

   Vale para las tres páginas con barra y para las dos versiones: es el mismo
   componente, así que no consulta VERTICES_MOVIL. */
(() => {
  const barra = document.querySelector(".marco");
  if (!barra) return;

  const nav = barra.querySelector("nav");

  /* Umbral: por debajo de esto no cuenta como cambio de dirección. En un
     teléfono la barra de URL del navegador entra y sale al desplazarse y
     mueve el scroll unos píxeles sin que nadie lo pida; sin umbral, la barra
     entraría y saldría sola en cada gesto. */
  const UMBRAL = 8;

  let ultimo = Math.max(0, window.scrollY);
  let escondida = false;
  let pendiente = false;

  function aplica(esconder) {
    if (esconder === escondida) return;
    escondida = esconder;
    barra.classList.toggle("marco--fuera", esconder);
  }

  function revisa() {
    pendiente = false;
    const y = Math.max(0, window.scrollY);
    const dy = y - ultimo;

    /* Arriba del todo la barra siempre está: es donde se la busca. Sin esta
       excepción, el primer tirón hacia abajo la escondería antes de que
       nadie la hubiera visto. El margen es su propio alto. */
    if (y <= (barra.offsetHeight || 64)) { ultimo = y; aplica(false); return; }

    if (Math.abs(dy) < UMBRAL) return;
    ultimo = y;

    /* Con el menú desplegado la barra no se mueve: el panel cuelga de ella y
       se iría con todo, dejando el menú abierto a medio aire. */
    if (nav && nav.classList.contains("abierto")) { aplica(false); return; }

    aplica(dy > 0);
  }

  addEventListener("scroll", () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(revisa);
  }, { passive: true });

  /* Abrir el menú trae la barra de vuelta pase lo que pase: el botón que lo
     abre vive en ella, así que si estuviera escondida el menú no se habría
     podido abrir, pero el estado puede cambiar por teclado o por un enlace. */
  if (nav && "MutationObserver" in window) {
    new MutationObserver(() => {
      if (nav.classList.contains("abierto")) aplica(false);
    }).observe(nav, { attributes: true, attributeFilter: ["class"] });
  }
})();
