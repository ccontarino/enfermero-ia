// Helpers de animación con Motion (Framer Motion).
// Se usa `m` + LazyMotion(domAnimation) en App.jsx para cargar solo las features necesarias.
import * as m from "motion/react-m";

export const ease = [0.23, 1, 0.32, 1]; // ease-out fuerte: entradas y respuestas
export const easeInOut = [0.65, 0, 0.35, 1]; // formas que cambian en pantalla
// Cambio de estado (pestañas, zona): entra rápido, sale más rápido todavía.
export const swap = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

export const stagger = (gap = 0.07, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

const viewport = { once: true, margin: "0px 0px -8% 0px" };

// Acceso estático a cada etiqueta para que el bundler descarte las que no se usan.
const TAGS = { div: m.div, p: m.p, h2: m.h2, ol: m.ol, li: m.li, fieldset: m.fieldset };

// Aparece al entrar en pantalla. `as` elige la etiqueta (div, h2, p, li, article...).
export function Reveal({ as = "div", delay = 0, children, ...props }) {
  const Comp = TAGS[as];
  return (
    <Comp
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      variants={{ hidden: fadeUp.hidden, show: { ...fadeUp.show, transition: { ...fadeUp.show.transition, delay } } }}
      {...props}
    >
      {children}
    </Comp>
  );
}

// Contenedor que escalona la aparición de sus hijos (que deben usar variants={fadeUp}).
export function Stagger({ as = "div", gap, delay, inView = true, children, ...props }) {
  const Comp = TAGS[as];
  const trigger = inView ? { whileInView: "show", viewport } : { animate: "show" };
  return (
    <Comp initial="hidden" {...trigger} variants={stagger(gap, delay)} {...props}>
      {children}
    </Comp>
  );
}
