import React, { useState, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import { Copy, Check, Download, Terminal } from 'lucide-react';
import { copyToClipboard, downloadPythonScript } from '../utils/exportPython';

export default function CodeBlock({ 
  code, 
  language = 'python', 
  highlightedLines = [], 
  filename = 'script_ml.py',
  title = 'scikit-learn Implementation'
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadPythonScript(filename, code);
  };

  // Divide code by lines to support selective line highlighting
  const lines = code.split('\n');

  return (
    <div className="rounded-xl border border-slate-700/70 bg-[#090d16] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-semibold text-slate-300 font-mono tracking-wide">{title}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-medium border border-brand-500/20">
            {filename}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
            title="Copiar código al portapapeles"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar código</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-sm shadow-brand-500/20"
            title="Descargar script Python ejecutable"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .py</span>
          </button>
        </div>
      </div>

      {/* Code body with line highlighting */}
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <div className="font-mono text-xs sm:text-sm">
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = highlightedLines.includes(lineNum);
            return (
              <div 
                key={idx} 
                className={`flex items-start py-0.5 leading-6 ${
                  isHighlighted 
                    ? 'bg-brand-500/20 -mx-4 px-4 border-l-4 border-brand-400 font-medium' 
                    : 'hover:bg-slate-800/40 -mx-4 px-4'
                }`}
              >
                <span className="w-10 select-none text-right pr-4 text-slate-600 text-xs shrink-0 pt-0.5 font-mono">
                  {lineNum}
                </span>
                <span 
                  className="flex-1 whitespace-pre overflow-x-auto font-mono text-slate-200"
                  dangerouslySetInnerHTML={{
                    __html: Prism.highlight(line || ' ', Prism.languages[language] || Prism.languages.markup, language)
                  }}
                />
                {isHighlighted && (
                  <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-brand-500/40 text-brand-300 font-sans uppercase font-bold tracking-wider select-none shrink-0 border border-brand-400/30">
                    Modificado
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
