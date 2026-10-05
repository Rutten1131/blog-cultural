"use client";

import { useState } from "react";
import Link from "next/link";

export default function DemoHeaderOptionsPage() {
  const [selectedOption, setSelectedOption] = useState<number>(1);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 font-sans pb-24">
      {/* ── BARRA SELECTORA FLOTANTE FIJA ARRIBA ── */}
      <div className="sticky top-0 z-[100] bg-slate-950/95 backdrop-blur-xl border-b border-purple-500/20 px-4 py-3 shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-sm font-black text-white uppercase tracking-wider">
              Preview Headers Modernos & Minimalistas
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 1, label: "1. Ultra Minimal Blur (Limpio)" },
              { id: 2, label: "2. Barra Unificada Blanca (Elegante)" },
              { id: 3, label: "3. Dark Cinema Neón (Estilo Web3/Vercel)" },
              { id: 4, label: "4. Micro-Pill Flotante (Ultra Compacto)" },
            ].map((op) => (
              <button
                key={op.id}
                onClick={() => {
                  setSelectedOption(op.id);
                  setMenuOpen(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedOption === op.id
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/50 scale-105 ring-2 ring-purple-400"
                    : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>

          <Link
            href="/"
            className="text-xs text-purple-400 hover:text-purple-300 underline font-semibold"
          >
            ← Volver a Inicio
          </Link>
        </div>
      </div>

      {/* ── CONTENEDOR HERO DONDE EL HEADER SE RENDERIZA EN VIVO ── */}
      <div className="relative w-full overflow-hidden bg-slate-950 border-b border-white/10">
        
        {/* ========================================================
            OPCIÓN 1: ULTRA MINIMAL BLUR (ESTILO APPLE / VERCEL)
            - Translúcido oscuro refinado con borde sutil
            - Tipografía limpia sin saturación de texto
            - Menú desplegable para 'Disciplinas'
           ======================================================== */}
        {selectedOption === 1 && (
          <div className="absolute inset-x-0 top-6 z-40 px-4 sm:px-8 animate-in fade-in duration-300">
            <nav className="mx-auto max-w-5xl rounded-full bg-black/40 backdrop-blur-2xl border border-white/15 px-6 py-2.5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              {/* Logo Minimal */}
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-md">
                  AC
                </div>
                <span className="font-display font-black text-sm tracking-widest text-white uppercase">
                  Agenda <span className="text-violet-400">Loja</span>
                </span>
              </div>

              {/* Links principales espaciados */}
              <div className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-white/80">
                <span className="text-white hover:text-violet-400 transition-colors cursor-pointer border-b border-violet-400 pb-0.5">
                  Cartelera
                </span>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Esta semana
                </span>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Fin de semana
                </span>

                {/* Dropdown Disciplinas */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Disciplinas</span>
                    <span className="text-[9px] text-violet-400">▼</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute top-9 left-0 w-44 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 p-2 text-white shadow-2xl z-50 flex flex-col gap-1">
                      <span className="px-3 py-1.5 text-xs rounded-lg hover:bg-violet-600/30 cursor-pointer">🎨 Arte & Expo</span>
                      <span className="px-3 py-1.5 text-xs rounded-lg hover:bg-violet-600/30 cursor-pointer">🎭 Teatro</span>
                      <span className="px-3 py-1.5 text-xs rounded-lg hover:bg-violet-600/30 cursor-pointer">🎵 Música</span>
                      <span className="px-3 py-1.5 text-xs rounded-lg hover:bg-violet-600/30 cursor-pointer">🏮 Ferias</span>
                      <span className="px-3 py-1.5 text-xs rounded-lg hover:bg-violet-600/30 cursor-pointer">✨ Artes Vivas</span>
                    </div>
                  )}
                </div>

                <span className="hover:text-white transition-colors cursor-pointer">
                  Sobre el proyecto
                </span>
              </div>

              {/* Botón CTA moderno */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white/70 hover:text-white cursor-pointer px-2 py-1 rounded-full bg-white/5 border border-white/10">
                  ES
                </span>
                <button className="bg-white hover:bg-violet-100 text-slate-950 text-xs font-bold px-4 py-2 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                  + Publicar evento
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* ========================================================
            OPCIÓN 2: BARRA UNIFICADA BLANCA GLASS (UN SOLO BLOQUE SÓLIDO)
            - Corrige la fragmentación: Todo vive dentro de una sola barra blanca moderna
            - Los botones y logo están perfectamente alineados en un solo contenedor
           ======================================================== */}
        {selectedOption === 2 && (
          <div className="absolute inset-x-0 top-6 z-40 px-4 sm:px-8 animate-in fade-in duration-300">
            <nav className="mx-auto max-w-6xl rounded-2xl bg-white/95 backdrop-blur-xl border border-white/80 px-5 py-2.5 flex items-center justify-between shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-700 to-pink-500 flex items-center justify-center text-white font-black text-xs shadow-md">
                  AC
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-black text-sm uppercase tracking-tight text-slate-900 leading-tight">
                    Agenda Cultural
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-700">
                    Loja
                  </span>
                </div>
              </div>

              {/* Navegación elegante en chips suaves */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-900 cursor-pointer">
                  Cartelera
                </span>
                <span className="px-3 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer">
                  Esta semana
                </span>
                <span className="px-3 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer">
                  Fin de semana
                </span>
                <span className="px-3 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer">
                  Categorías ▾
                </span>
                <span className="px-3 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer">
                  Sobre el proyecto
                </span>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2.5">
                <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 cursor-pointer">
                  ES ▾
                </div>
                <button className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer">
                  + Publicar evento
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* ========================================================
            OPCIÓN 3: DARK CINEMA NEÓN (FUTURISTA / STREAMING)
            - Gradiente oscuro cinematográfico
            - Acentos de neón violeta y fucsia
           ======================================================== */}
        {selectedOption === 3 && (
          <div className="absolute inset-x-0 top-6 z-40 px-4 sm:px-8 animate-in fade-in duration-300">
            <nav className="mx-auto max-w-6xl rounded-2xl bg-gradient-to-r from-slate-950/80 via-purple-950/70 to-slate-950/80 backdrop-blur-2xl border border-purple-500/30 px-5 py-3 flex items-center justify-between shadow-[0_15px_40px_rgba(110,30,200,0.3)]">
              {/* Logo Neón */}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-violet-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-purple-500/50">
                  AC
                </div>
                <div>
                  <span className="block font-black text-sm text-white tracking-wider uppercase">
                    Agenda Cultural
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-fuchsia-400 font-bold">
                    Loja · Ecuador
                  </span>
                </div>
              </div>

              {/* Menú estilizado */}
              <div className="hidden lg:flex items-center gap-6 text-xs font-semibold tracking-wider uppercase text-slate-300">
                <span className="text-fuchsia-400 font-bold cursor-pointer">
                  Cartelera
                </span>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Esta semana
                </span>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Fin de semana
                </span>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Categorías
                </span>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Festival 2026
                </span>
              </div>

              {/* Botón con Glow */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/80 border border-purple-500/30 rounded-full px-2.5 py-1 bg-white/5">
                  ES
                </span>
                <button className="bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-lg shadow-purple-500/40 hover:brightness-110 transition-all cursor-pointer">
                  + Publicar evento
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* ========================================================
            OPCIÓN 4: MICRO-PILL FLOTANTE ULTRA COMPACTO
            - Header muy pequeño y discreto al centro
            - Despeja 100% la foto y la visión del evento
           ======================================================== */}
        {selectedOption === 4 && (
          <div className="absolute inset-x-0 top-6 z-40 px-4 sm:px-8 animate-in fade-in duration-300">
            <nav className="mx-auto max-w-3xl rounded-full bg-slate-900/90 backdrop-blur-xl border border-white/20 px-4 py-2 flex items-center justify-between shadow-2xl">
              {/* Logo super compacto */}
              <div className="flex items-center gap-2">
                <span className="text-lg">🎭</span>
                <span className="font-black text-xs uppercase tracking-wider text-white">
                  AgendaLoja
                </span>
              </div>

              {/* Links rápidos */}
              <div className="hidden sm:flex items-center gap-5 text-xs font-bold text-slate-300">
                <span className="text-purple-400 cursor-pointer">Cartelera</span>
                <span className="hover:text-white cursor-pointer">Esta semana</span>
                <span className="hover:text-white cursor-pointer">Fin de semana</span>
              </div>

              {/* Botón */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  ES
                </span>
                <button className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow transition-all cursor-pointer">
                  + Publicar
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* ── FOTO HERO SIMULADA CON TEXTO IDÉNTICO AL REAL ── */}
        <div className="relative h-[620px] w-full flex items-center justify-center pt-28 pb-12">
          {/* Imagen de fondo real de la Feria de Loja */}
          <img
            src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1600&q=80"
            alt="Fondo Feria de Loja"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.45]"
          />
          
          {/* Degradado oscuro para simular el Hero real */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-black/60 pointer-events-none" />

          {/* Contenido Hero idéntico a tu web */}
          <div className="relative z-10 text-center max-w-3xl px-4 mt-8">
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest border border-white/20 mb-4 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping" />
              DESTACADO
            </span>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white uppercase tracking-tight drop-shadow-2xl">
              FERIA DE LOJA #197
            </h2>
            <p className="text-sm sm:text-lg text-slate-200 mt-3 drop-shadow max-w-xl mx-auto font-medium">
              Feria de Loja #197 hasta el domingo 13 de septiembre
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-full shadow-2xl shadow-purple-600/50 flex items-center gap-2">
                <span>📅</span> VER EL CALENDARIO →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXPLICACIÓN DE POR QUÉ CADA OPCIÓN ES MÁS PROFESIONAL ── */}
      <div className="max-w-6xl mx-auto px-4 pt-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">
            Comparativa de Diseño UX/UI
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            ¿Por qué estos diseños se ven mucho más modernos?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div
            onClick={() => setSelectedOption(1)}
            className={`p-6 rounded-3xl border cursor-pointer transition-all ${
              selectedOption === 1
                ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/50 shadow-xl"
                : "bg-slate-900/60 border-white/10 hover:border-white/30"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">
                1. Ultra Minimal Blur (Recomendada)
              </h3>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full font-bold">
                Más Elegante
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Inspirado en el diseño moderno de Apple y Vercel. Al ser translúcido oscuro con desenfoque de cristal (`backdrop-blur-2xl`), se fusiona con cualquier fotografía del fondo.
            </p>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => setSelectedOption(2)}
            className={`p-6 rounded-3xl border cursor-pointer transition-all ${
              selectedOption === 2
                ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/50 shadow-xl"
                : "bg-slate-900/60 border-white/10 hover:border-white/30"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">
                2. Barra Unificada Blanca
              </h3>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full font-bold">
                Sin fragmentar
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Si prefieres que sea blanco, esta opción reúne todo en un único contenedor sin romper el diseño en 4 pedazos sueltos.
            </p>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => setSelectedOption(3)}
            className={`p-6 rounded-3xl border cursor-pointer transition-all ${
              selectedOption === 3
                ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/50 shadow-xl"
                : "bg-slate-900/60 border-white/10 hover:border-white/30"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">
                3. Dark Cinema Neón
              </h3>
              <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2.5 py-1 rounded-full font-bold">
                Impacto Visual
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enfocado en eventos nocturnos, conciertos y festivales. Su brillo de neón morado da una sensación premium tipo plataforma de streaming o festival internacional.
            </p>
          </div>

          {/* Card 4 */}
          <div
            onClick={() => setSelectedOption(4)}
            className={`p-6 rounded-3xl border cursor-pointer transition-all ${
              selectedOption === 4
                ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/50 shadow-xl"
                : "bg-slate-900/60 border-white/10 hover:border-white/30"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">
                4. Micro-Pill Flotante
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                Ultra Compacto
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ocupa el mínimo espacio posible. Despeja completamente el campo de visión para que la fotografía y el título del evento sean lo primero que impacte al usuario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
