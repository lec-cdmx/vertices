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

  const legal = document.querySelector(".pie-legal");
  if (!legal || typeof window.VERTICES_CAMBIA_VISTA !== "function") return;

  const cambio = document.createElement("button");
  cambio.type = "button";
  cambio.className = "m-cambia-vista";
  cambio.textContent = "Ver versión de escritorio";
  cambio.addEventListener("click", () => window.VERTICES_CAMBIA_VISTA("escritorio"));
  legal.append(cambio);
})();
