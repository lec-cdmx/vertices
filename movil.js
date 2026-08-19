/* Vértices · portada de teléfono.

   Sólo actúa en index.html y sólo cuando dispositivo.js decidió "movil".
   Sustituye el recorrido cinematográfico —siete pantallas de scroll que
   gobiernan el motor de partículas— por una portada corta y navegación
   táctil: los 27 temas como fichas, las 8 secciones como acordeón (con la
   descripción que en escritorio sólo aparece al pasar el cursor, y que en
   teléfono se perdía), y una barra de pestañas fija al alcance del pulgar.

   Dos reglas mandan sobre cómo está escrito esto:

   1. MUEVE, no copia. Los bloques de texto de las capas del recorrido
      (etiqueta institucional, cejas, títulos, bajadas, carrusel) se trasladan
      con appendChild al nuevo esqueleto. Así no hay dos copias del mismo
      párrafo que se puedan desincronizar, y los detectores de eventos que ya
      les colgó index.html siguen funcionando.

   2. CORRE ANTES QUE idiomas.js. El traductor recorre el DOM una vez al
      arrancar, se queda con las referencias a los nodos de texto en español
      y luego los reescribe. Todo lo que este archivo construya tiene que
      existir antes de ese recorrido y no volver a reconstruirse, o el
      teléfono se quedaría en español al cambiar de idioma. Por eso el
      marcado se arma una sola vez y lo que cambia después son clases, no
      innerHTML. En el <body> este script va justo antes que idiomas.js.

   Los textos nuevos que introduce (los hay: en teléfono no se "hace clic en
   un nodo") están dados de alta en los cinco diccionarios de idiomas/. */
(() => {
  if (!window.VERTICES_MOVIL) return;
  const recorrido = document.getElementById("recorrido");
  if (!recorrido) return; // no es la portada

  const $ = (sel) => document.querySelector(sel);
  const crea = (tag, clase, texto) => {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto != null) el.textContent = texto;
    return el;
  };

  /* index.html declara estos datos en el ámbito global del script clásico:
     TOPICS, SECTIONS, PALETA_NODOS son const de nivel superior y
     articulosDe/abrirPanel son declaraciones de función. */
  const temas = typeof TOPICS !== "undefined" ? TOPICS : [];
  const secciones = typeof SECTIONS !== "undefined" ? SECTIONS : [];
  const paleta = typeof PALETA_NODOS !== "undefined" ? PALETA_NODOS : [[77, 77, 250]];
  const cuentaDe = (tipo, valor) =>
    typeof articulosDe === "function" ? articulosDe(tipo, valor).length : 0;
  const abre = (tipo, valor) => {
    if (typeof abrirPanel === "function") abrirPanel(tipo, valor);
  };

  /* ---------------------------------------------------------------- *
     esqueleto
   * ---------------------------------------------------------------- */

  const inicio = crea("main", null);
  inicio.id = "movil";
  document.getElementById("portal").before(inicio);

  const seccion = (id, clase) => {
    const s = crea("section", "m-seccion" + (clase ? " " + clase : ""));
    s.id = id;
    inicio.append(s);
    return s;
  };

  /* --- portada --- */
  const portada = seccion("movil-portada", "m-portada");
  const etiqueta = $("#capaHero .hero-etq");
  const edicion = $("#capaHero .hero-edicion");
  if (etiqueta) portada.append(etiqueta);
  portada.append(crea("p", "m-palabra", "Vértices"));
  portada.append(crea("div", "m-regla"));
  portada.append(crea("p", "m-lema", "El punto donde las ideas se conectan"));
  if (edicion) portada.append(edicion);

  // el botón principal se clona del marco: mismo texto, mismo destino, y al
  // traductor no le estorban los duplicados (traduce por contenido)
  const publica = $('.marco nav a.boton--lleno[data-ir="envio"]');
  if (publica) {
    const acciones = crea("div", "m-acciones");
    acciones.append(publica.cloneNode(true));
    portada.append(acciones);
  }

  /* --- temas --- */
  const secTemas = seccion("temas");
  const bloqueTemas = $("#capaTemas .temas-bloque");
  if (bloqueTemas) {
    secTemas.append(bloqueTemas);
    // en escritorio la bajada dice "haz clic en cualquier nodo": aquí no hay
    // nodos ni clic, hay fichas y dedo
    const bajada = bloqueTemas.querySelector(".bajada");
    if (bajada) {
      bajada.textContent =
        "Veintisiete áreas de la economía. Toca un tema para ver los artículos que orbitan a su alrededor.";
    }
    const rejilla = crea("ul", "m-temas");
    for (const tema of temas) {
      const n = cuentaDe("tema", tema);
      const li = crea("li");
      const boton = crea("button", "m-tema");
      boton.type = "button";
      boton.dataset.vacio = n ? "no" : "si";
      boton.append(crea("span", "m-nombre-tema", tema));
      // el número va solo, sin la palabra "artículos": partirla en dos nodos
      // para que el traductor la alcance obliga a elegir un plural fijo, y en
      // ruso el plural cambia con la cifra. El panel que se abre al tocar ya
      // dice la cuenta completa y bien declinada. Oculto a lectores de
      // pantalla: el nombre del tema es el nombre del botón.
      const cuenta = crea("span", "m-cuenta", n || "—");
      cuenta.setAttribute("aria-hidden", "true");
      boton.append(cuenta);
      boton.addEventListener("click", () => abre("tema", tema));
      li.append(boton);
      rejilla.append(li);
    }
    // queda encima del botón "Ver índice completo", que cierra el bloque
    const indice = bloqueTemas.querySelector("#verIndice");
    indice ? indice.before(rejilla) : bloqueTemas.append(rejilla);
  }

  /* --- secciones --- */
  const secSecciones = seccion("secciones");
  const bloqueSecciones = $("#capaSecciones .secciones-bloque");
  if (bloqueSecciones) {
    secSecciones.append(bloqueSecciones);
    const bajada = bloqueSecciones.querySelector(".bajada");
    if (bajada) {
      bajada.textContent =
        "De la carta editorial al cierre en comunidad. Toca una sección para conocerla y ver sus artículos.";
    }
  }
  const acordeon = crea("div", "m-secs");
  secciones.forEach((s, i) => {
    const det = crea("details", "m-sec");
    // acordeón nativo: abrir una cierra la anterior. Con setAttribute
    // porque la propiedad .name sólo existe donde el comportamiento ya
    // está implementado; donde no, el atributo se ignora sin romper nada.
    det.setAttribute("name", "m-sec");
    const res = crea("summary");
    const punto = crea("i", "m-punto");
    punto.style.background = `rgb(${paleta[i % paleta.length].join(",")})`;
    res.append(punto);
    res.append(crea("span", "m-nombre", s.label));
    res.append(crea("i", "m-flecha"));
    const cuerpo = crea("div", "m-cuerpo");
    cuerpo.append(crea("p", "m-desc", s.desc));
    const ver = crea("button", "boton", "Ver artículos");
    ver.type = "button";
    ver.addEventListener("click", () => abre("seccion", s.label));
    cuerpo.append(ver);
    det.append(res, cuerpo);
    acordeon.append(det);
  });
  secSecciones.append(acordeon);

  // el carrusel de destacados ya es táctil (scroll-snap horizontal)
  const carrusel = $("#capaSecciones .carrusel-zona");
  if (carrusel) secSecciones.append(carrusel);

  /* --- cierre --- */
  const bloqueCierre = $("#capaCierre .cierre-bloque");
  if (bloqueCierre) seccion("movil-cierre", "m-cierre").append(bloqueCierre);

  /* ---------------------------------------------------------------- *
     navegación
   * ---------------------------------------------------------------- */

  /* Los enlaces del recorrido apuntan a una fracción del scroll (data-u):
     sin espaciador de 680vh eso ya no significa nada. Se reescriben como
     data-ir a las secciones nuevas, y así el manejador que index.html ya
     tiene montado los lleva al sitio correcto sin tocarlo. */
  const destinoU = { 0: "movil-portada", 0.48: "temas", 0.75: "secciones" };
  for (const el of document.querySelectorAll("[data-u]")) {
    const destino = destinoU[parseFloat(el.dataset.u)];
    if (!destino) continue;
    delete el.dataset.u;
    el.dataset.ir = destino;
  }

  /* --- barra de pestañas --- */
  const ICONOS = {
    inicio: '<path d="M12 3 20.5 19.5 3.5 19.5Z"/><path d="M12 3 12.8 13.2 3.5 19.5M12.8 13.2 20.5 19.5" opacity=".5"/>',
    temas: '<circle cx="12" cy="5.4" r="2"/><circle cx="5" cy="16.5" r="2"/><circle cx="19" cy="16.5" r="2"/><path d="M10.7 7.1 6.3 14.8M13.3 7.1 17.7 14.8M7 16.5h10"/>',
    secciones: '<path d="M4 6.5h16M4 12h16M4 17.5h10"/>',
    publica: '<path d="M12 15.5V4.5M8.2 8.3 12 4.5l3.8 3.8"/><path d="M4.5 14.5v3.4a1.6 1.6 0 0 0 1.6 1.6h11.8a1.6 1.6 0 0 0 1.6-1.6v-3.4"/>',
  };
  const PESTANAS = [
    { id: "movil-portada", texto: "Inicio", icono: "inicio" },
    { id: "temas", texto: "Temas", icono: "temas" },
    { id: "secciones", texto: "Secciones", icono: "secciones" },
    { id: "envio", texto: "Publica", icono: "publica", cta: true },
  ];
  const tabs = crea("nav", "m-tabs");
  // el <nav> del marco ya se llama "Navegación principal": dos landmarks
  // con el mismo nombre no se distinguen al navegar por regiones
  tabs.setAttribute("aria-label", "Navegación del sitio");
  const botones = PESTANAS.map((p) => {
    const b = crea("button", "m-tab" + (p.cta ? " m-tab--cta" : ""));
    b.type = "button";
    b.dataset.destino = p.id;
    b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[p.icono]}</svg>`;
    b.append(crea("span", null, p.texto));
    b.addEventListener("click", () => {
      if (typeof cerrarPanel === "function") cerrarPanel();
      document.getElementById(p.id)?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    });
    tabs.append(b);
    return b;
  });
  document.body.append(tabs);

  // la pestaña encendida sigue a la sección que se está leyendo
  const marca = (id) =>
    botones.forEach((b) => b.setAttribute("aria-current", String(b.dataset.destino === id)));
  marca("movil-portada");
  const vigiladas = PESTANAS.map((p) => document.getElementById(p.id)).filter(Boolean);
  if ("IntersectionObserver" in window && vigiladas.length) {
    const visibles = new Map();
    const vigia = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) visibles.set(e.target.id, e.intersectionRatio);
        let mejor = null, mayor = 0;
        for (const [id, ratio] of visibles) if (ratio > mayor) { mayor = ratio; mejor = id; }
        if (mejor) marca(mejor);
      },
      { threshold: [0, 0.15, 0.4, 0.7], rootMargin: "-72px 0px -45% 0px" }
    );
    vigiladas.forEach((s) => vigia.observe(s));
  }

  /* --- salida a la versión de escritorio --- */
  const legal = $(".pie-legal");
  if (legal && typeof window.VERTICES_CAMBIA_VISTA === "function") {
    const cambio = crea("button", "m-cambia-vista", "Ver versión de escritorio");
    cambio.type = "button";
    cambio.addEventListener("click", () => window.VERTICES_CAMBIA_VISTA("escritorio"));
    legal.append(cambio);
  }

  /* --- textura de fondo --- *
     el campo de flujo de las páginas satélite, en su modo estático de
     teléfono: da la misma familia visual que el hero de escritorio sin
     motor corriendo. Se pide en reposo para no retrasar el primer pintado. */
  const textura = () => {
    const s = document.createElement("script");
    s.src = "fondo-flujo.js?v=6";
    document.body.append(s);
  };
  "requestIdleCallback" in window
    ? requestIdleCallback(textura, { timeout: 2200 })
    : setTimeout(textura, 700);
})();
