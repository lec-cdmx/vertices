/* Vértices · selector de versión (móvil o escritorio).

   El sitio tiene DOS experiencias distintas sobre un mismo contenido:
   la de escritorio (recorrido cinematográfico de scroll con el motor de
   partículas) y la de teléfono (navegación táctil por listas, sin recorrido).
   Este archivo decide cuál toca y lo anuncia de dos maneras:

     <html data-disp="movil">   → lo usa movil.css para tomar el control
     window.VERTICES_MOVIL      → lo usan movil.js, index.html y fondo-flujo.js

   Va SÍNCRONO en el <head>, antes de cualquier hoja de estilos y antes de
   pintar: si llegara tarde, el teléfono alcanzaría a dibujar un cuadro con la
   maqueta de escritorio y se vería el parpadeo.

   Criterio (ancho de la ventana, no "user agent": el user agent miente y no
   sobrevive a una tableta nueva):
     · móvil       ancho ≤ 820px  → teléfono, y tableta en vertical
     · móvil       pantalla táctil acostada y baja → teléfono en horizontal
     · escritorio  todo lo demás
   La persona manda sobre el criterio: ?vista=movil o ?vista=escritorio fija la
   versión y se recuerda; ?vista=auto devuelve la decisión automática. */
(() => {
  const CLAVE = "vertices_vista";
  const raiz = document.documentElement;

  function detecta() {
    const mq = (consulta) => matchMedia(consulta).matches;
    if (mq("(max-width:820px)")) return "movil";
    // teléfono en horizontal: táctil, ancho de teléfono y muy poca altura
    if (mq("(pointer:coarse)") && mq("(max-width:960px)") && mq("(max-height:520px)")) return "movil";
    return "escritorio";
  }

  function preferencia() {
    try {
      const pedida = new URLSearchParams(location.search).get("vista");
      if (pedida === "movil" || pedida === "escritorio") localStorage.setItem(CLAVE, pedida);
      else if (pedida === "auto") localStorage.removeItem(CLAVE);
      const guardada = localStorage.getItem(CLAVE);
      if (guardada === "movil" || guardada === "escritorio") return guardada;
    } catch {}
    return null;
  }

  const forzada = preferencia();
  function aplica(vista) {
    raiz.dataset.disp = vista;
    window.VERTICES_MOVIL = vista === "movil";
  }
  aplica(forzada || detecta());
  window.VERTICES_VISTA_FORZADA = forzada;

  /* Cambiar de versión a mano (el enlace del pie de página). Recarga porque
     las dos versiones son estructuralmente distintas: no se intercambian en
     caliente, se construyen desde cero. */
  window.VERTICES_CAMBIA_VISTA = (vista) => {
    try { localStorage.setItem(CLAVE, vista); } catch {}
    /* Si la URL trae ?vista=..., al recargar ese parámetro volvería a
       imponerse sobre lo que se acaba de guardar y el cambio no surtiría
       efecto: quien llegó con ?vista=escritorio se quedaría en escritorio por
       más que pidiera volver. Se quita el parámetro antes de recargar. */
    const url = new URL(location.href);
    if (url.searchParams.has("vista")) {
      url.searchParams.delete("vista");
      location.replace(url.toString());
    } else {
      location.reload();
    }
  };

  /* Cruzar el umbral redimensionando la ventana (o abriendo el inspector)
     también cambia de versión, con el mismo argumento: hay que reconstruir.
     Excepción: si hay algo escrito en un formulario no se recarga nunca,
     porque tirar un manuscrito a medio capturar es mucho peor que quedarse
     en la versión equivocada. */
  function hayTextoSinGuardar() {
    for (const campo of document.querySelectorAll("input, textarea")) {
      if (campo.type === "checkbox" || campo.type === "radio") { if (campo.checked) return true; }
      else if (campo.value.trim()) return true;
    }
    for (const sel of document.querySelectorAll("select")) if (sel.value) return true;
    return false;
  }

  let temporizador;
  addEventListener("resize", () => {
    if (forzada) return;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      if (detecta() === raiz.dataset.disp || hayTextoSinGuardar()) return;
      location.reload();
    }, 450);
  });

  /* La vuelta.

     Esta preferencia se recuerda, y eso convertía la elección manual en una
     puerta de un solo sentido: la versión de teléfono ofrece "Ver versión de
     escritorio" en el pie, y la de escritorio no ofrecía nada para volver.
     Quien fijara escritorio en un teléfono se quedaba con la maqueta ancha
     para siempre, sin saber que ?vista=auto existe.

     El ofrecimiento aparece sólo cuando hace falta: versión de escritorio,
     elegida a mano, y en una pantalla de teléfono. En una computadora no
     sale, y si la de escritorio se está viendo porque toca, tampoco. */
  function ofreceVolver() {
    if (raiz.dataset.disp !== "escritorio") return;
    if (forzada !== "escritorio") return;
    if (!matchMedia("(max-width:820px)").matches) return;

    const pie = document.querySelector(".pie-legal");
    if (!pie || pie.querySelector(".vuelve-movil")) return;

    const enlace = document.createElement("button");
    enlace.type = "button";
    enlace.className = "vuelve-movil";
    enlace.textContent = "Ver versión para teléfono";
    enlace.style.cssText =
      "display:inline-block;margin-top:4px;padding:10px 0;background:none;" +
      "border:0;cursor:pointer;font:500 11.5px inherit;letter-spacing:.14em;" +
      "text-transform:uppercase;color:inherit;opacity:.75;" +
      "text-decoration:underline;text-underline-offset:4px;";
    enlace.addEventListener("click", () => window.VERTICES_CAMBIA_VISTA("movil"));
    pie.append(enlace);
  }
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", ofreceVolver)
    : ofreceVolver();
})();
