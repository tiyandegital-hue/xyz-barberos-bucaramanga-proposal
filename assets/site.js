/* ============================================================
   NOCHE BARBER — shared site logic
   Honesty gate: business name is ONE swappable constant.
   Change BUSINESS below and every [data-bname] slot updates.
   ============================================================ */
"use strict";

/* ---------- 1. Swappable constants ---------- */
const BUSINESS = "XYZ Barberos";          /* <-- change ONLY here */
const BUSINESS_CITY = "Bucaramanga";
const FOOTER_YEAR = "2026";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-bname]").forEach(el => { el.textContent = BUSINESS; });
  document.querySelectorAll("[data-bcity]").forEach(el => { el.textContent = BUSINESS_CITY; });
  document.querySelectorAll("[data-fyear]").forEach(el => { el.textContent = FOOTER_YEAR; });

  /* ---------- 2. Mobile nav ---------- */
  const burger = document.getElementById("burger");
  const links = document.getElementById("navLinks");
  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- 3. Active nav link ---------- */
  const here = document.body.getAttribute("data-page");
  if (here && links) {
    links.querySelectorAll("a[data-nav]").forEach(a => {
      if (a.getAttribute("data-nav") === here) a.classList.add("active");
    });
  }

  /* ---------- 4. Reveal on scroll ---------- */
  const els = document.querySelectorAll(".reveal");
  if (typeof IntersectionObserver !== "undefined" && els.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const i = Array.prototype.indexOf.call(els, e.target);
          e.target.style.transitionDelay = Math.min(i % 4, 3) * 0.12 + "s";
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  } else {
    els.forEach(el => el.classList.add("in"));
  }

  /* ---------- 5. Contact form (demo, no backend) ---------- */
  const form = document.getElementById("pilotForm");
  if (form) {
    // prefill plan from ?plan=
    try {
      const q = new URLSearchParams(window.location.search);
      const plan = q.get("plan");
      const sel = document.getElementById("fPlan");
      if (plan && sel) {
        const opt = sel.querySelector(`option[value="${plan}"]`);
        if (opt) sel.value = plan;
      }
    } catch (e) { /* ignore */ }

    const fields = {
      nombre: v => v.trim().length >= 2,
      whatsapp: v => /^[+\d][\d\s().-]{6,}$/.test(v.trim()),
      consent: () => document.getElementById("fConsent").checked
    };
    form.addEventListener("submit", ev => {
      ev.preventDefault();
      let ok = true;
      Object.keys(fields).forEach(id => {
        const input = document.getElementById("f" + id.charAt(0).toUpperCase() + id.slice(1));
        const wrap = input.closest(".field") || input.closest(".check");
        const valid = fields[id](input.type === "checkbox" ? "" : input.value);
        if (wrap) wrap.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        const bad = form.querySelector(".field.invalid input, .check.invalid input");
        if (bad) bad.focus();
        return;
      }
      const name = document.getElementById("fNombre").value.trim();
      form.style.display = "none";
      const done = document.getElementById("formOk");
      if (done) {
        const slot = done.querySelector("[data-okname]");
        if (slot && name) slot.textContent = name.split(" ")[0];
        done.classList.add("show");
      }
    });
    // clear invalid on input
    form.querySelectorAll("input,select,textarea").forEach(i => {
      i.addEventListener("input", () => {
        const wrap = i.closest(".field") || i.closest(".check");
        if (wrap) wrap.classList.remove("invalid");
      });
    });
  }

  /* ---------- 6. Financial simulator (cómo-funciona) ---------- */
  const simC = document.getElementById("simClientes");
  if (simC) {
    const simT = document.getElementById("simTicket");
    const fmt = n => new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Math.round(n));
    const update = () => {
      const clientes = parseInt(simC.value, 10);
      const ticket = parseInt(simT.value, 10);
      document.getElementById("simClientesVal").textContent = fmt(clientes) + " /semana";
      document.getElementById("simTicketVal").textContent = "$" + fmt(ticket) + " COP";
      // Model [EJEMPLO]: 15% of weekly clients are bookings lost to slow/no reply,
      // bot recovers 70% of them.
      const perdidas = clientes * 4 * 0.15;
      const recuperadas = perdidas * 0.70;
      const ingreso = recuperadas * ticket;
      const anual = ingreso * 12;
      document.getElementById("simCortes").textContent = fmt(recuperadas);
      document.getElementById("simIngreso").textContent = "$" + fmt(ingreso);
      document.getElementById("simAnual").textContent = "$" + fmt(anual);
    };
    simC.addEventListener("input", update);
    simT.addEventListener("input", update);
    update();
  }

  /* ---------- 7. WhatsApp demo-bot chat player (state machine) ---------- */
  initChat();
});

/* ============================================================
   CHAT ENGINE — scripted scenario player with typing indicator,
   quick-reply branches, play/replay/restart. Pure demo: nothing
   leaves the browser.
   ============================================================ */
const CHAT = (function () {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const NOW = "11:32 PM";

  // Steps: {t:'b'|'u', x, type, hold} · {chips:[{l, u, next:[steps]}]}
  const SCEN = {
    reservar: [
      { t: "u", x: "Buenas noches parce, ¿tienen cupo mañana viernes a las 4:00 PM con Yorguin?", hold: 700 },
      { t: "b", x: "¡Hola! Bienvenido a XYZ Barberos Bucaramanga 💈 Revisando la agenda de Yorguin Vargas…", type: 1100, hold: 500 },
      { t: "b", x: "✅ ¡Disponible a las 4:00 PM! ¿Qué servicio deseas?", type: 800, hold: 400 },
      { t: "b", x: "CORTE MID FADE — $25.000 [EJEMPLO]\nCOMBO FADE + BARBA — $35.000 [EJEMPLO]\nBARBA ESCULPIDA — $18.000 [EJEMPLO]", type: 1200, hold: 600 },
      { chips: [
        { l: "✅ CONFIRMAR", u: "El combo de Fade + Barba porfa con Yorguin.", next: [
          { t: "b", x: "Listo ✅ Reserva confirmada:\nCOMBO FADE + BARBA [EJEMPLO] — viernes 4:00 PM — Yorguin Vargas — Carrera 9 #42-69, Bucaramanga.", type: 1400, hold: 500 },
          { t: "b", x: "Te escribiremos un día antes para confirmar. ¡Nos vemos! 💈 [EJEMPLO]", type: 900, hold: 400 },
        ]},
        { l: "👤 CAMBIAR BARBERO", u: "¿Con quién más podría?", next: [
          { t: "b", x: "Revisando… también hay cupo mañana a las 4:30 PM con otro barbero del equipo [EJEMPLO]. ¿Te sirve?", type: 1100, hold: 500 },
          { chips: [
            { l: "✅ SÍ, 4:30 PM", u: "Sí, dale, 4:30 PM.", next: [
              { t: "b", x: "Perfecto ✅ Reserva confirmada: viernes 4:30 PM — Carrera 9 #42-69, Bucaramanga. [EJEMPLO]", type: 1100, hold: 400 },
            ]},
            { l: "⬅ VOLVER", u: "Mejor sigo con Yorguin.", next: [
              { t: "b", x: "¡De una! Quedas con Yorguin mañana viernes 4:00 PM 💈 [EJEMPLO]", type: 900, hold: 400 },
            ]},
          ]},
        ]},
        { l: "🕒 VER OTROS HORARIOS", u: "¿Qué otros horarios hay mañana?", next: [
          { t: "b", x: "Mañana viernes disponibles: 10:00 AM · 2:00 PM · 4:00 PM [EJEMPLO]", type: 1000, hold: 500 },
          { chips: [
            { l: "10:00 AM", u: "10:00 AM mejor.", next: [
              { t: "b", x: "Listo ✅ viernes 10:00 AM con Yorguin — Carrera 9 #42-69. [EJEMPLO]", type: 900, hold: 400 },
            ]},
            { l: "2:00 PM", u: "2:00 PM.", next: [
              { t: "b", x: "Listo ✅ viernes 2:00 PM con Yorguin — Carrera 9 #42-69. [EJEMPLO]", type: 900, hold: 400 },
            ]},
            { l: "4:00 PM", u: "Me quedo con las 4:00 PM.", next: [
              { t: "b", x: "Perfecto ✅ viernes 4:00 PM con Yorguin — Carrera 9 #42-69. [EJEMPLO]", type: 900, hold: 400 },
            ]},
          ]},
        ]},
      ]},
    ],
    recordatorio: [
      { t: "b", x: "Hola 👋 Te recordamos tu corte de mañana a las 4:00 PM en XYZ Barberos 💈 Responde SÍ para confirmar o CAMBIAR para reprogramar. [EJEMPLO]", type: 1400, hold: 600 },
      { chips: [
        { l: "SÍ", u: "SÍ", next: [
          { t: "b", x: "¡Confirmado! Te esperamos mañana a las 4:00 PM — Carrera 9 #42-69, Bucaramanga. 💈 [EJEMPLO]", type: 900, hold: 400 },
        ]},
        { l: "CAMBIAR", u: "CAMBIAR", next: [
          { t: "b", x: "Sin problema. Espacios libres: viernes 6:00 PM · sábado 10:00 AM · sábado 3:00 PM [EJEMPLO]", type: 1100, hold: 500 },
          { chips: [
            { l: "Viernes 6:00 PM", u: "Viernes 6:00 PM.", next: [
              { t: "b", x: "Listo ✅ Reprogramado para viernes 6:00 PM con Yorguin. [EJEMPLO]", type: 900, hold: 400 },
            ]},
            { l: "Sábado 10:00 AM", u: "Sábado 10:00 AM.", next: [
              { t: "b", x: "Listo ✅ Reprogramado para sábado 10:00 AM. [EJEMPLO]", type: 900, hold: 400 },
            ]},
          ]},
        ]},
      ]},
    ],
    reprogramar: [
      { t: "u", x: "Hola, ¿puedo pasar mi cita del viernes a otro día?", hold: 700 },
      { t: "b", x: "¡Claro que sí! Estos son los espacios libres [EJEMPLO]:", type: 900, hold: 300 },
      { t: "b", x: "Sábado 10:00 AM · Sábado 3:00 PM · Lunes 5:00 PM", type: 800, hold: 500 },
      { chips: [
        { l: "Sábado 10:00 AM", u: "Sábado 10:00 AM porfa.", next: [
          { t: "b", x: "Hecho ✅ Nueva cita: sábado 10:00 AM — Yorguin Vargas — Carrera 9 #42-69. Te recordaremos un día antes. [EJEMPLO]", type: 1200, hold: 400 },
        ]},
        { l: "Sábado 3:00 PM", u: "Sábado 3:00 PM.", next: [
          { t: "b", x: "Hecho ✅ Nueva cita: sábado 3:00 PM — Carrera 9 #42-69. [EJEMPLO]", type: 1100, hold: 400 },
        ]},
        { l: "Lunes 5:00 PM", u: "Lunes 5:00 PM.", next: [
          { t: "b", x: "Hecho ✅ Nueva cita: lunes 5:00 PM — Carrera 9 #42-69. [EJEMPLO]", type: 1100, hold: 400 },
        ]},
      ]},
    ],
    tarifas: [
      { t: "u", x: "¿Cuánto vale el corte y dónde están ubicados?", hold: 700 },
      { t: "b", x: "MID FADE $25.000 · BARBA ESCULPIDA $18.000 · COMBO FADE + BARBA $35.000 — todos [EJEMPLO].", type: 1200, hold: 400 },
      { t: "b", x: "Estamos en Carrera 9 #42-69, Bucaramanga 📍 Centro / García Rovira.", type: 900, hold: 500 },
      { chips: [
        { l: "🗓 RESERVAR", u: "Quiero reservar.", next: [
          { t: "b", x: "¡De una! ¿Qué día te sirve? [EJEMPLO]", type: 700, hold: 400 },
          { chips: [
            { l: "Mañana viernes", u: "Mañana viernes.", next: [
              { t: "b", x: "Cupos mañana: 10:00 AM · 2:00 PM · 4:00 PM [EJEMPLO]. Escríbeme el horario y lo agendamos ✅", type: 1100, hold: 400 },
            ]},
            { l: "Sábado", u: "El sábado.", next: [
              { t: "b", x: "Cupos sábado: 10:00 AM · 3:00 PM [EJEMPLO]. Escríbeme el horario y lo agendamos ✅", type: 1100, hold: 400 },
            ]},
          ]},
        ]},
        { l: "📍 CÓMO LLEGAR", u: "¿Cómo llego?", next: [
          { t: "b", x: "Carrera 9 #42-69 — Centro / García Rovira, Bucaramanga (7.1193° N, 73.1227° W). ¡Te esperamos! 💈", type: 1100, hold: 400 },
        ]},
      ]},
    ],
  };

  let token = 0;

  function el(tag, cls, text) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (text != null) d.textContent = text;
    return d;
  }

  function bubble(log, who, text) {
    const b = el("div", "bub " + (who === "b" ? "in" : "out"));
    text.split("\n").forEach((line, i, arr) => {
      b.appendChild(document.createTextNode(line));
      if (i < arr.length - 1) b.appendChild(document.createElement("br"));
    });
    const m = el("span", "meta", NOW + (who === "b" ? " · bot" : " · tú"));
    b.appendChild(m);
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
  }

  function typingOn(log) {
    const t = el("div", "typing");
    t.setAttribute("aria-hidden", "true");
    t.appendChild(el("i")); t.appendChild(el("i")); t.appendChild(el("i"));
    log.appendChild(t);
    log.scrollTop = log.scrollHeight;
    return t;
  }

  function setStatus(msg) {
    const s = document.getElementById("chatStatus");
    if (s) s.textContent = msg;
  }

  async function runSteps(steps, log, chipsBox, my) {
    for (const st of steps) {
      if (my !== token) return; // cancelled
      if (st.t) {
        if (st.t === "b" && st.type) {
          const tp = typingOn(log);
          await sleep(Math.min(st.type, 1600));
          if (my !== token) return;
          tp.remove();
        } else {
          await sleep(350);
          if (my !== token) return;
        }
        bubble(log, st.t, st.x);
        await sleep(st.hold || 500);
      } else if (st.chips) {
        setStatus("ELIGE UNA RESPUESTA RÁPIDA ↓");
        await waitForChip(st.chips, log, chipsBox, my);
        if (my !== token) return;
      }
    }
    setStatus("CONVERSACIÓN COMPLETA — REINICIA O CAMBIA DE ESCENARIO");
    showEndHint(log);
  }

  function waitForChip(chips, log, chipsBox, my) {
    return new Promise(resolve => {
      chipsBox.innerHTML = "";
      chips.forEach(c => {
        const b = el("button", "qchip", c.l);
        b.type = "button";
        b.addEventListener("click", () => {
          if (my !== token) return;
          bubble(log, "u", c.u);
          chipsBox.innerHTML = "";
          setStatus("EL BOT ESTÁ ESCRIBIENDO…");
          resolve(c.next);
        }, { once: true });
        chipsBox.appendChild(b);
      });
      // store resolver so restart can cancel cleanly
      chipsBox._resolver = resolve;
    }).then(next => runSteps(next, log, chipsBox, my));
  }

  function showEndHint(log) {
    const d = el("div", "bub in", "¿Quieres verlo otra vez? Pulsa ↺ REINICIAR o prueba otro escenario arriba. [DEMO INTERACTIVA — SIMULACIÓN]");
    const m = el("span", "meta", NOW + " · bot");
    d.appendChild(m);
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  function play(key) {
    const log = document.getElementById("chatLog");
    const chipsBox = document.getElementById("chipRow");
    if (!log || !chipsBox) return;
    token++;
    const my = token;
    log.innerHTML = "";
    chipsBox.innerHTML = "";
    setStatus("EL BOT ESTÁ ESCRIBIENDO…");
    const steps = SCEN[key] || SCEN.reservar;
    // queue microtask so cancel checks work
    setTimeout(() => { if (my === token) runSteps(steps, log, chipsBox, my); }, 60);
  }

  function stop() {
    token++;
    const chipsBox = document.getElementById("chipRow");
    if (chipsBox) chipsBox.innerHTML = "";
    setStatus("DEMO EN PAUSA — PULSA ▶ REPRODUCIR");
  }

  return { play, stop, keys: Object.keys(SCEN) };
})();

function initChat() {
  const tabs = document.querySelectorAll(".scen-tab");
  const btnPlay = document.getElementById("btnPlay");
  const btnRestart = document.getElementById("btnRestart");
  if (!tabs.length) return; // not on demo page
  const names = { reservar: "1 · RESERVAR CITA", recordatorio: "2 · RECORDATORIO 24H", reprogramar: "3 · REPROGRAMAR", tarifas: "4 · TARIFAS Y SEDE" };
  let current = "reservar";
  tabs.forEach(t => {
    t.addEventListener("click", () => {
      tabs.forEach(x => { x.classList.remove("active"); x.setAttribute("aria-selected", "false"); });
      t.classList.add("active");
      t.setAttribute("aria-selected", "true");
      current = t.getAttribute("data-scen");
      CHAT.play(current);
    });
  });
  if (btnPlay) btnPlay.addEventListener("click", () => CHAT.play(current));
  if (btnRestart) btnRestart.addEventListener("click", () => CHAT.play(current));
  // auto-start first scenario when visible
  CHAT.play("reservar");
}
