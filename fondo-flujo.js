/* Fondo de las páginas satélite: CAMPO DE FLUJO (misma familia visual que el
   hero de la landing). Partículas invisibles siguen un campo de ángulos suave
   (flowAngle) dejando estelas muy tenues de tinta; cada cuadro se repinta un
   velo crema translúcido, así las estelas se acumulan y forman esas líneas
   curvas y continuas que recorren la página. Sobrio y elegante: casi todo en
   tinta, con destellos de color escasísimos. Sin nodos ni pirámide.
   Crea su propio canvas fijo detrás del contenido. Respeta prefers-reduced-motion. */
(() => {
  const lienzo = document.createElement("canvas");
  lienzo.setAttribute("aria-hidden", "true");
  lienzo.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;";
  document.body.prepend(lienzo);
  // el contenido va por encima del lienzo
  for (const el of document.body.children) {
    if (el !== lienzo && el.style && !el.style.zIndex) {
      el.style.position = el.style.position || "relative";
      el.style.zIndex = "1";
    }
  }

  const ctx = lienzo.getContext("2d");
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // paleta: fondo crema original y destellos de acento muy escasos
  const CREMA = [231, 222, 203];              // #E7DECB
  const TINTA = "45,35,46";                    // ciruela
  const ACENTOS = ["77,77,250", "253,99,67", "119,118,207"]; // índigo, coral, perla

  // parámetros de estética. El campo está CONGELADO (sin tiempo): las partículas
  // siguen líneas de corriente fijas y sus estelas casi permanentes se acumulan
  // en curvas largas y continuas, como un mapa de flujo dibujado a lápiz.
  const VELO = 0.035;       // velo crema por cuadro: casi nulo = estelas casi permanentes
  const OP_TINTA = 0.018;    // opacidad de los trazos finos (estipulado de fondo)
  const OP_LIDER = 0.035;   // opacidad de los trazos líderes (curvas largas y visibles)
  const OP_ACENTO = 0.045;   // opacidad de los trazos con color
  const PROB_LIDER = 0.25;  // fracción de partículas líderes (barridos continuos)
  const PROB_ACENTO = 0.04; // fracción de partículas con destello de color
  const VIDA_MIN = 500, VIDA_MAX = 1300; // cuadros de vida: cada partícula traza una curva larga
    // presupuesto de cuadros dividido en dos fases
  // presupuesto por TIEMPO REAL, no por cuadros: así son siempre 10s exactos
  // sin importar si la pantalla del usuario va a 60Hz, 120Hz, etc.
  const DURACION_ANIMACION_MS = 10000;    // toda la animación cabe en los primeros 10s
  const DURACION_ENFRIAMIENTO_MS = 1500;  // de esos 10s, los últimos 1.5s solo aclaran (sin trazos nuevos)
  const DURACION_DIBUJO_MS = DURACION_ANIMACION_MS - DURACION_ENFRIAMIENTO_MS;
  let inicioMs = 0;
 
  let W = 0, H = 0, dpr = 1, particulas = [], t = 0, raf = 0;
 
  function medir() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    lienzo.width = W * dpr; lienzo.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // pintar el crema de base (arranque limpio, sin destellos bruscos)
    ctx.fillStyle = `rgb(${CREMA.join(",")})`;
    ctx.fillRect(0, 0, W, H);
  }
 
  // campo de flujo CONGELADO: ondas de muy baja frecuencia = canales laminares
  // amplios; al no depender del tiempo, las líneas de corriente son fijas y
  // las estelas se acumulan en curvas largas y limpias (no ruido disperso).
  function angulo(x, y) {
    return (
      Math.sin(x * 0.0015 + 0.6) * 2.0 +
      Math.cos(y * 0.0019 - 0.4) * 1.9 +
      Math.sin((x - y) * 0.0011) * 0.8
    );
  }
 
  function nace(p) {
    const acento = Math.random() < PROB_ACENTO;
    const lider = !acento && Math.random() < PROB_LIDER;
    p.x = Math.random() * W; p.y = Math.random() * H; p.px = p.x; p.py = p.y;
    p.vida = (VIDA_MIN + Math.random() * (VIDA_MAX - VIDA_MIN)) | 0;
    if (acento) { p.color = ACENTOS[(Math.random() * ACENTOS.length) | 0]; p.op = OP_ACENTO; p.vel = 40 + Math.random() * 90; p.ancho = 0.7; }
    else if (lider) { p.color = TINTA; p.op = OP_LIDER; p.vel = 80 + Math.random() * 120; p.ancho = 0.85; }
    else { p.color = TINTA; p.op = OP_TINTA; p.vel = 14 + Math.pow(Math.random(), 1.8) * 110; p.ancho = 0.6; }
    return p;
  }
 
  function siembra() {
    // densidad moderada: antes llegaba hasta 4200 partículas, lo que
    // cubría casi toda la pantalla de tinta en pocos cuadros. Se baja el
    // techo y se sube el divisor para reducir la cobertura por cuadro.
    const n = Math.round(Math.min(1800, Math.max(500, (W * H) / 900)));
    particulas = Array.from({ length: n }, () => nace({}));
    // arranque escalonado: reparte las vidas para que no renazcan todas a la vez
    particulas.forEach((p) => { p.vida = (p.vida * Math.random()) | 0; });
  }
 
  // dibujando=false → fase de enfriamiento: solo se aplica el velo, sin
  // añadir tinta nueva, así el fondo converge hacia un estado más claro
  // antes de congelarse.
  function paso(dt, dibujando) {
    // velo crema translúcido: hace que las estelas persistan pero no se
    // acumulen sin control
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${CREMA.join(",")},${VELO})`;
    ctx.fillRect(0, 0, W, H);
 
    if (!dibujando) return;
 
    ctx.lineCap = "round";
    for (const p of particulas) {
      p.px = p.x; p.py = p.y;
      const th = angulo(p.x, p.y);
      p.x += Math.cos(th) * p.vel * dt;
      p.y += Math.sin(th) * p.vel * dt;
      let saltó = false;
      if (p.x < -20) { p.x = W + 20; saltó = true; } else if (p.x > W + 20) { p.x = -20; saltó = true; }
      if (p.y < -20) { p.y = H + 20; saltó = true; } else if (p.y > H + 20) { p.y = -20; saltó = true; }
      if (--p.vida <= 0) { nace(p); continue; }
      if (saltó) { p.px = p.x; p.py = p.y; continue; }
      ctx.strokeStyle = `rgba(${p.color},${p.op})`;
      ctx.lineWidth = p.ancho;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }
 
  let ultimo = 0;
  function ciclo(ms) {
    const dt = Math.min(0.05, (ms - ultimo) / 1000 || 0.016);
    ultimo = ms;
    t += dt;
 
    const transcurrido = ms - inicioMs;
    const dibujando = transcurrido < DURACION_DIBUJO_MS;
    paso(dt, dibujando);
 
    if (transcurrido >= DURACION_ANIMACION_MS) {
      cancelAnimationFrame(raf);
      return; // se cumplieron los 10s: el último cuadro pintado queda fijo para siempre
    }
 
    raf = requestAnimationFrame(ciclo);
  }
 
  function arranca() {
    cancelAnimationFrame(raf);
    medir();
    siembra();
    if (quieto) {
      // sin animar: reproduce igual el presupuesto de 10s de golpe y se
      // queda en el estado final ya aclarado
      const dtFijo = 0.033;
      const cuadrosDibujo = Math.round(DURACION_DIBUJO_MS / (dtFijo * 1000));
      const cuadrosEnfriamiento = Math.round(DURACION_ENFRIAMIENTO_MS / (dtFijo * 1000));
      for (let i = 0; i < cuadrosDibujo; i++) paso(dtFijo, true);
      for (let i = 0; i < cuadrosEnfriamiento; i++) paso(dtFijo, false);
      return;
    }
    ultimo = performance.now();
    inicioMs = ultimo;
    raf = requestAnimationFrame(ciclo);
  }
 
  let temporizador;
  addEventListener("resize", () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(arranca, 200);
  });
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", arranca)
    : arranca();
})();
 
