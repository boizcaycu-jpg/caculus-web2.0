'use client';

import React, { useEffect, useState } from 'react';

interface MathTextProps {
  content?: string;
  className?: string;
}

export default function MathText({ content = '', className = '' }: MathTextProps) {
  const [isKaTeXLoaded, setIsKaTeXLoaded] = useState(false);

  useEffect(() => {
    // Inject KaTeX CSS dynamically if not present
    if (!document.getElementById('katex-css')) {
      const link = document.createElement('link');
      link.id = 'katex-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
      document.head.appendChild(link);
    }

    // Inject KaTeX JS dynamically if not present
    if (window && !(window as any).katex) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
      script.async = true;
      script.onload = () => setIsKaTeXLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsKaTeXLoaded(true);
    }
  }, []);

  const renderMathContent = (text: string) => {
    if (!text) return null;

    const katex = typeof window !== 'undefined' ? (window as any).katex : null;

    // Helper to format LaTeX block or inline using katex if loaded, or fallback HTML
    const formatSegment = (str: string, isBlock: boolean = false) => {
      if (katex) {
        try {
          const html = katex.renderToString(str, {
            displayMode: isBlock,
            throwOnError: false,
          });
          return <span dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
          // Fallback
        }
      }

      // Simple HTML LaTeX fallback replacements
      let formatted = str
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        .replace(/\\Delta/g, 'Δ')
        .replace(/\\rightarrow|\\rightleftharpoons/g, '⇌')
        .replace(/\\le/g, '≤')
        .replace(/\\ge/g, '≥')
        .replace(/\\neq/g, '≠')
        .replace(/\\times/g, '×')
        .replace(/\\int/g, '∫')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\theta/g, 'θ')
        .replace(/\\pi/g, 'π');

      return <span className="font-mono text-crimson font-bold px-1">{formatted}</span>;
    };

    // Split text by $$...$$ or $...$ or \(...\) or \[...\]
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      if (!part) return null;

      if (part.startsWith('$$') && part.endsWith('$$')) {
        const mathStr = part.slice(2, -2).trim();
        return (
          <div key={idx} className="my-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-center overflow-x-auto">
            {formatSegment(mathStr, true)}
          </div>
        );
      }

      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        const mathStr = part.slice(2, -2).trim();
        return (
          <div key={idx} className="my-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-center overflow-x-auto">
            {formatSegment(mathStr, true)}
          </div>
        );
      }

      if (part.startsWith('$') && part.endsWith('$')) {
        const mathStr = part.slice(1, -1).trim();
        return <React.Fragment key={idx}>{formatSegment(mathStr, false)}</React.Fragment>;
      }

      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        const mathStr = part.slice(2, -2).trim();
        return <React.Fragment key={idx}>{formatSegment(mathStr, false)}</React.Fragment>;
      }

      // Normal markdown text lines
      return <span key={idx} className="whitespace-pre-line">{part}</span>;
    });
  };

  return <div className={`math-content leading-relaxed ${className}`}>{renderMathContent(content)}</div>;
}
