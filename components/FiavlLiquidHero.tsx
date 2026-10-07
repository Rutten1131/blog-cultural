"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

// Quad de pantalla completa
const VERT = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;

// Trail shader con decaimiento rápido: perturbación reactiva que vuelve al instante
const TRAIL_FRAG = `precision mediump float;
varying vec2 v;uniform sampler2D prev;uniform vec2 m,vel;uniform float asp;
void main(){
  vec2 f = texture2D(prev, v).xy * 2. - 1.;
  f *= 0.88; // Se disipa rápido
  vec2 d = v - m;
  d.x *= asp;
  f += vel * exp(-dot(d, d) / 0.006);
  f = clamp(f, -1., 1.);
  if (length(f) < 0.005) f = vec2(0.);
  gl_FragColor = vec4(f * .5 + .5, 0., 1.);
}`;

// Main shader:
// 1. Degradación dual: el mouse degrada y transparenta la imagen actual revelando la siguiente debajo
// 2. Progreso continuo sin saltos ni cortes entre 1 -> 2 -> 3 -> 1
// 3. Proporciones cover perfectas para móvil y PC
const MAIN_FRAG = `precision mediump float;
varying vec2 v;
uniform sampler2D trail;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform float progress; // 0.0 (100% tex1) -> 1.0 (100% tex2)
uniform float t;
uniform vec2 uvScale1;
uniform vec2 uvOffset1;
uniform vec2 uvScale2;
uniform vec2 uvOffset2;

float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p*=2.04;a*=.5;}return s;}

void main(){
  vec2 fl = texture2D(trail, v).xy * 2. - 1.;
  float trailStrength = length(fl);

  // Distorsión óptica elástica instantánea que se recupera de inmediato
  vec2 uvDistorted = v - fl * 0.055;

  // Muestreo cover exacto para ambas imágenes
  vec2 uv1 = uvDistorted * uvScale1 + uvOffset1;
  vec2 uv2 = uvDistorted * uvScale2 + uvOffset2;

  uv1 = clamp(uv1, 0.001, 0.999);
  uv2 = clamp(uv2, 0.001, 0.999);

  vec4 col1 = texture2D(tex1, uv1);
  vec4 col2 = texture2D(tex2, uv2);

  // Mapa de ruido orgánico para el patrón de degradado
  float noise = fbm(v * 2.8 + t * 0.02);

  // El paso del cursor también degrada y abre ventanas directas hacia la siguiente imagen
  float cursorDissolve = trailStrength * 0.40;
  
  // Progresión global suave combinada con la interacción del cursor
  float effectiveProgress = clamp(progress + cursorDissolve, 0.0, 1.0);

  // Función matemática de transición suave garantizada:
  // Cuando progress == 0.0 -> blendMask == 1.0 (exactamente col1)
  // Cuando progress == 1.0 -> blendMask == 0.0 (exactamente col2)
  float pCurve = smoothstep(0.0, 1.0, effectiveProgress);
  float blendMask = smoothstep(pCurve - 0.35, pCurve + 0.35, noise);

  // Forzar continuidad matemática perfecta en los extremos para eliminar cualquier salto
  if (progress <= 0.001) {
    blendMask = 1.0 - cursorDissolve;
  } else if (progress >= 0.999) {
    blendMask = 0.0;
  }

  // Mezcla de imagen actual (col1) con la siguiente (col2) que se va asomando
  vec4 mixedImg = mix(col2, col1, clamp(blendMask, 0.0, 1.0));

  // Destello de borde escénico FIAVL en el frente donde se degrada la imagen
  float edge = 1.0 - abs(blendMask - 0.5) * 2.0;
  vec3 fiavlViolet = vec3(0.49, 0.16, 0.93);
  vec3 fiavlPink   = vec3(0.92, 0.28, 0.60);
  vec3 edgeColor   = mix(fiavlViolet, fiavlPink, sin(t * 0.6 + v.x * 2.0) * 0.5 + 0.5);

  // Resplandor vivo mientras se degrada la imagen
  mixedImg.rgb += edgeColor * (max(0.0, edge) * 0.20 * sin(progress * 3.14159) + trailStrength * 0.16);

  // Viñeta escénica limpia para contraste perfecto
  float vig = smoothstep(1.3, 0.4, length(v - 0.5) * 1.3);
  vec3 finalColor = mixedImg.rgb * mix(0.80, 1.0, vig);
  finalColor = mix(vec3(0.03, 0.02, 0.06), finalColor, 0.92);

  gl_FragColor = vec4(finalColor, 1.0);
}`;

type Props = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  images?: string[];
  mobileImages?: string[];
};

export default function FiavlLiquidHero({
  children,
  className = "",
  style,
  images = [
    "/hero fialv/desktop_01_teatro_urbano.webp",
    "/hero fialv/desktop_02_calle_viva.webp",
    "/hero fialv/desktop_03_imaginarios.webp",
  ],
  mobileImages = [
    "/hero fialv/mobile_01_teatro_urbano.webp",
    "/hero fialv/mobile_02_calle_viva.webp",
    "/hero fialv/mobile_03_imaginarios.webp",
  ],
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;

    const gl = cv.getContext("webgl", { alpha: false, antialias: true, powerPreference: "high-performance" });
    if (!gl) return;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const isMobile = window.innerWidth < 768;
    const activeImages = isMobile && mobileImages?.length ? mobileImages : images;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const program = (frag: string) => {
      const pr = gl.createProgram()!;
      gl.attachShader(pr, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(pr, compile(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(pr);
      return pr;
    };

    const trailP = program(TRAIL_FRAG);
    const mainP = program(MAIN_FRAG);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    // Framebuffers para la simulación del rastro
    const S = 256;
    const init = new Uint8Array(S * S * 4).fill(128);
    const targets = [0, 1].map(() => {
      const tx = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, init);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0);
      return { tx, fb };
    });

    // Cargar texturas con dimensiones reales
    type LoadedTex = { tex: WebGLTexture; width: number; height: number };
    const loadedTextures: LoadedTex[] = [];

    const defaultW = isMobile ? 1080 : 1920;
    const defaultH = isMobile ? 1920 : 1080;

    const loadTexture = (src: string) => {
      const tx = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([12, 10, 20, 255])
      );

      const entry: LoadedTex = { tex: tx, width: defaultW, height: defaultH };
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        entry.width = img.naturalWidth || img.width;
        entry.height = img.naturalHeight || img.height;
        gl.bindTexture(gl.TEXTURE_2D, tx);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };
      return entry;
    };

    activeImages.forEach((src) => {
      loadedTextures.push(loadTexture(src));
    });

    const use = (pr: WebGLProgram) => {
      gl.useProgram(pr);
      const l = gl.getAttribLocation(pr, "p");
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
    };

    const u = (pr: WebGLProgram, name: string) => gl.getUniformLocation(pr, name);

    let mx = 0.5,
      my = 0.5,
      vx = 0,
      vy = 0;
    let lx: number | null = null,
      ly = 0;
    let cur = 0,
      asp = 1,
      raf = 0;

    // ESTADO DEL DEGRADADO:
    // fromIdx: Imagen visible actualmente
    // toIdx: Imagen que se va revelando conforme se degrada la primera
    let fromIdx = 0;
    let toIdx = 1 % activeImages.length;
    let currentProgress = 0.0; // Progreso exacto de 0.0 a 1.0

    const resize = () => {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.max(1, Math.floor(cv.clientWidth * d));
      cv.height = Math.max(1, Math.floor(cv.clientHeight * d));
      asp = cv.width / cv.height;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // INTERACCIÓN: EL MOVIMIENTO DEL CURSOR ACELERA Y CONSUME LA DEGRADACIÓN
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      if (lx !== null) {
        const dx = (x - lx) * 16;
        const dy = (y - ly) * 16;
        vx = dx;
        vy = dy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Cada pasada del ratón degrada progresivamente la imagen y descubre la siguiente
        currentProgress += dist * 0.018;
      }
      lx = x;
      ly = y;
      mx = x;
      my = y;
    };
    window.addEventListener("pointermove", onMove);

    // Motor de avance en el tiempo:
    // Si el usuario no mueve el mouse, avanza a un ritmo suave para que no se detenga el flujo
    let lastTime = performance.now();

    const computeCoverTransform = (imgW: number, imgH: number, canvasW: number, canvasH: number) => {
      const imgRatio = (imgW || 1) / (imgH || 1);
      const canvasRatio = (canvasW || 1) / (canvasH || 1);

      let scaleX = 1.0;
      let scaleY = 1.0;

      if (canvasRatio > imgRatio) {
        scaleY = imgRatio / canvasRatio;
      } else {
        scaleX = canvasRatio / imgRatio;
      }

      const offsetX = (1.0 - scaleX) * 0.5;
      const offsetY = (1.0 - scaleY) * 0.5;

      return { scale: [scaleX, scaleY], offset: [offsetX, offsetY] };
    };

    const frame = (ms: number) => {
      const delta = Math.min(0.05, (ms - lastTime) / 1000);
      lastTime = ms;

      // Avance sutil constante de fondo (se degrada automáticamente si no tocan el mouse)
      currentProgress += delta * 0.12;

      // CICLO INFINITO Y TRANSICIÓN CONTINUA 1 -> 2 -> 3 -> 1:
      // Cuando la imagen actual se degrada totalmente (>= 1.0), la siguiente se convierte en la base
      // y la que le sigue entra en la cola para degradarse
      if (currentProgress >= 1.0) {
        fromIdx = toIdx;
        toIdx = (fromIdx + 1) % activeImages.length;
        currentProgress = 0.0;
        setActiveSlide(fromIdx);
      }

      const src = targets[cur];
      const dst = targets[1 - cur];

      // 1. Trail FBO
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
      gl.viewport(0, 0, S, S);
      use(trailP);
      gl.bindTexture(gl.TEXTURE_2D, src.tx);
      gl.uniform1i(u(trailP, "prev"), 0);
      gl.uniform2f(u(trailP, "m"), mx, my);
      gl.uniform2f(u(trailP, "vel"), vx, vy);
      gl.uniform1f(u(trailP, "asp"), asp);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      vx *= 0.78;
      vy *= 0.78;

      // 2. Render Principal
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, cv.width, cv.height);
      use(mainP);

      // Trail
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dst.tx);
      gl.uniform1i(u(mainP, "trail"), 0);

      // Textura 1 (Actual que se degrada)
      const t1 = loadedTextures[fromIdx];
      gl.activeTexture(gl.TEXTURE1);
      if (t1) gl.bindTexture(gl.TEXTURE_2D, t1.tex);
      gl.uniform1i(u(mainP, "tex1"), 1);

      // Textura 2 (Siguiente que aparece a través de la degradación)
      const t2 = loadedTextures[toIdx];
      gl.activeTexture(gl.TEXTURE2);
      if (t2) gl.bindTexture(gl.TEXTURE_2D, t2.tex);
      gl.uniform1i(u(mainP, "tex2"), 2);

      const tr1 = t1 ? computeCoverTransform(t1.width, t1.height, cv.width, cv.height) : { scale: [1, 1], offset: [0, 0] };
      const tr2 = t2 ? computeCoverTransform(t2.width, t2.height, cv.width, cv.height) : { scale: [1, 1], offset: [0, 0] };

      gl.uniform2f(u(mainP, "uvScale1"), tr1.scale[0], tr1.scale[1]);
      gl.uniform2f(u(mainP, "uvOffset1"), tr1.offset[0], tr1.offset[1]);
      gl.uniform2f(u(mainP, "uvScale2"), tr2.scale[0], tr2.scale[1]);
      gl.uniform2f(u(mainP, "uvOffset2"), tr2.offset[0], tr2.offset[1]);

      gl.uniform1f(u(mainP, "progress"), Math.min(1.0, Math.max(0.0, currentProgress)));
      gl.uniform1f(u(mainP, "t"), ms / 1000);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      cur = 1 - cur;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      targets.forEach((t) => {
        gl.deleteTexture(t.tx);
        gl.deleteFramebuffer(t.fb);
      });
      loadedTextures.forEach((t) => gl.deleteTexture(t.tex));
      gl.deleteProgram(trailP);
      gl.deleteProgram(mainP);
      gl.deleteBuffer(buf);
    };
  }, [images, mobileImages]);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{
        width: "100%",
        minHeight: "100vh",
        height: "100svh",
        ...style,
      }}
    >
      {/* Canvas WebGL a pantalla completa */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full block"
      />

      {/* Gradiente escénico suave para garantizar contraste de texto */}
      <div
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/80 via-black/25 to-slate-950/90"
        aria-hidden="true"
      />

      {/* Indicadores de diapositivas FIAVL */}
      <div className="pointer-events-none absolute bottom-6 right-6 z-20 hidden sm:flex items-center gap-2">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-700 ${
              i === activeSlide
                ? "w-8 bg-gradient-to-r from-violet-400 to-pink-500 shadow-md shadow-pink-500/50"
                : "w-2 bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Contenedor de contenido superpuesto */}
      <div className="relative z-20 flex h-full min-h-[100svh] w-full flex-col justify-between">
        {children}
      </div>
    </div>
  );
}
