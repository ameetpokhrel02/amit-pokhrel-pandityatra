import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './card';
import type { Variants } from 'framer-motion';

type AnimatedCardProps = React.ComponentProps<typeof Card> & {
  variants?: Variants;
  hover?: any;
};

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(({ variants, hover, className = '', ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      variants={variants}
      whileHover={hover}
      className={className}
    >
      <Card {...props} />
    </motion.div>
  );
});

AnimatedCard.displayName = 'AnimatedCard';

export default AnimatedCard;
