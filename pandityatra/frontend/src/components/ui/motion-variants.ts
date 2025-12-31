import type { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] } },
};

export const containerStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const subtleHover = { scale: 1.01 };

export default { fadeInUp, containerStagger, subtleHover };
