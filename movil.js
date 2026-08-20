/* Vértices · lo poco que la versión de teléfono necesita en JavaScript.

   La primera versión de teléfono armaba aquí una portada entera: movía los
   bloques de texto fuera de las capas del recorrido, construía los 27 temas
   como fichas y las 8 secciones como acordeón, y montaba una barra de
   pestañas. Ya no: el teléfono corre el mismo recorrido que el escritorio,
   con el mismo marcado y el mismo motor, y todo el trabajo de adaptación
   está en movil.css y en los ajustes de geometría de index.html.

   Queda sólo la salida de emergencia. */
(() => {
  if (!window.VERTICES_MOVIL) return;

  /* Las dos bajadas del recorrido invitan a pasar el cursor y a hacer clic.
     En un teléfono no hay ni cursor ni clic, hay dedo. Se reescriben aquí,
     antes de que idiomas.js recorra el DOM: los textos de la versión de
     teléfono están dados de alta en los cinco diccionarios, así que el
     traductor los alcanza igual que a los demás. */
  const rehace = (sel, texto) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = texto;
  };
  rehace("#capaTemas .temas-bloque .bajada",
    "Veintisiete áreas de la economía. Toca un tema para ver los artículos que orbitan a su alrededor.");
  rehace("#capaSecciones .secciones-bloque .bajada",
    "De la carta editorial al cierre en comunidad. Toca una sección para conocerla y ver sus artículos.");

  /* Los cuatro botones del riel son puntos: como columna discreta al margen
     derecho basta con eso, pero abajo, convertidos en barra de pestañas, un
     punto no dice nada. Reciben los iconos que tenía la barra anterior,
     dentro del mismo marcado y en el mismo orden que el riel. */
  const ICONOS = [
    '<path d="M12 3 20.5 19.5 3.5 19.5Z"/><path d="M12 3 12.8 13.2 3.5 19.5M12.8 13.2 20.5 19.5" opacity=".55"/>',
    '<circle cx="12" cy="5.4" r="2"/><circle cx="5" cy="16.5" r="2"/><circle cx="19" cy="16.5" r="2"/><path d="M10.7 7.1 6.3 14.8M13.3 7.1 17.7 14.8M7 16.5h10"/>',
    '<path d="M4 6.5h16M4 12h16M4 17.5h10"/>',
    '<path d="M12 15.5V4.5M8.2 8.3 12 4.5l3.8 3.8"/><path d="M4.5 14.5v3.4a1.6 1.6 0 0 0 1.6 1.6h11.8a1.6 1.6 0 0 0 1.6-1.6v-3.4"/>',
  ];
  const botones = document.querySelectorAll(".riel button");
  botones.forEach((boton, i) => {
    const hueco = boton.querySelector("i");
    if (!hueco || !ICONOS[i]) return;
    hueco.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONOS[i] + "</svg>";
  });
  // el último no es una parada del recorrido sino la acción: va en coral
  if (botones.length) botones[botones.length - 1].classList.add("riel--cta");

  const legal = document.querySelector(".pie-legal");
  if (!legal || typeof window.VERTICES_CAMBIA_VISTA !== "function") return;

  const cambio = document.createElement("button");
  cambio.type = "button";
  cambio.className = "m-cambia-vista";
  cambio.textContent = "Ver versión de escritorio";
  cambio.addEventListener("click", () => window.VERTICES_CAMBIA_VISTA("escritorio"));
  legal.append(cambio);
})();
