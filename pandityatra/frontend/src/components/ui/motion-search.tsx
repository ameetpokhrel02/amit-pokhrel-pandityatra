import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, X } from 'lucide-react';

type MotionSearchProps = {
  onSearch?: (q: string) => void;
  placeholder?: string;
  className?: string;
};

export const MotionSearch: React.FC<MotionSearchProps> = ({ onSearch, placeholder = 'Search pandits, expertise...', className = '' }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (open) {
      // focus input when opening
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (onSearch) onSearch(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const containerVariants = {
    closed: { width: '0px', opacity: 0 },
    open: { width: '280px', opacity: 1 },
  } as const;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!open && (
        <button
          aria-label="Open search"
          className="p-2 rounded-md hover:bg-muted/40 transition-colors"
          onClick={() => setOpen(true)}
        >
          <Search size={18} />
        </button>
      )}

      <motion.div
        className="overflow-hidden flex items-center"
        initial={false}
        animate={open ? 'open' : 'closed'}
        variants={containerVariants}
        transition={{ duration: reduce ? 0 : 0.22, ease: 'easeOut' }}
      >
        <div className="flex items-center bg-popover/90 border border-transparent rounded-md px-2 py-1 shadow-sm">
          <Search className="text-muted-foreground mr-2" size={16} />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            placeholder={placeholder}
            aria-label="Search"
            className="bg-transparent outline-none w-full text-sm placeholder:text-muted-foreground"
          />
          <button
            aria-label="Close search"
            className="ml-2 p-1 rounded hover:bg-muted/40"
            onClick={() => {
              setValue('');
              setOpen(false);
            }}
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MotionSearch;
