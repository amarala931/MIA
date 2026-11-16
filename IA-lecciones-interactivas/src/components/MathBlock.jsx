import React, { useMemo } from 'react';
import katex from 'katex';

/**
 * Componente para renderizar expresiones matemáticas con KaTeX.
 * Soporta displayMode (fórmulas en bloque) o modo inline.
 */
export default function MathBlock({ math, block = true, className = '' }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        strict: false
      });
    } catch (e) {
      console.error('KaTeX error:', e);
      return `<span class="text-rose-400 font-mono text-sm">${math}</span>`;
    }
  }, [math, block]);

  if (block) {
    return (
      <div 
        className={`my-3 overflow-x-auto text-center text-slate-100 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span 
      className={`inline-block align-middle ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
