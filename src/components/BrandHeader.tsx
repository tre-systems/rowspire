import { motion } from 'framer-motion';
import { APP_NAME } from '@/lib/brand';
import { MOTION } from '@/lib/visuals/motion';

interface BrandHeaderProps {
  tagline: string;
}

export default function BrandHeader({ tagline }: BrandHeaderProps) {
  return (
    <motion.header
      className="brand-header"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={MOTION.entrance}
      data-testid="brand-header"
    >
      <div className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <h1 className="brand-title">{APP_NAME}</h1>
      <p className="brand-tagline">{tagline}</p>
    </motion.header>
  );
}
