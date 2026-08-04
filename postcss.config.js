import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import purgecss from '@fullhuman/postcss-purgecss';

const plugins = [tailwindcss(), autoprefixer()];

if (process.env.NODE_ENV === 'production') {
    plugins.push(
        purgecss({
            content: [
                './resources/js/**/*.jsx',
                './resources/views/**/*.blade.php',
            ],
            defaultExtractor: (content) => {
                const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
                const innerMatches = content.match(/[^=>\/\s'"\x60]+(?=\s*?=)/g) || [];
                return broadMatches.concat(innerMatches);
            },
            safelist: {
                standard: [
                    /^text-bg-/,
                    /^bg-/,
                    /^text-/,
                    /^border-/,
                    /^opacity-/,
                    /^shadow-/,
                    /^rounded/,
                    /^flex/,
                    /^grid/,
                    /^col-/,
                    /^row/,
                    /^gap-/,
                    /^p[trblxy]?-/,
                    /^m[trblxy]?-/,
                    /^w-/,
                    /^h-/,
                    /^min-/,
                    /^max-/,
                    /^font-/,
                    /^leading-/,
                    /^tracking-/,
                    /^align-/,
                    /^justify-/,
                    /^order-/,
                    /^z-/,
                    /^overflow-/,
                    /^position-/,
                    /^top-/,
                    /^bottom-/,
                    /^left-/,
                    /^right-/,
                    /^translate-/,
                    /^scale-/,
                    /^rotate-/,
                    /^skew-/,
                    /^cursor-/,
                    /^select-/,
                    /^pointer-events/,
                    /^appearance-/,
                    /^outline-/,
                    /^ring/,
                    /^divide-/,
                    /^decoration-/,
                    /^border-collapse/,
                    /^table-/,
                    /^animate-/,
                    /^from-/,
                    /^via-/,
                    /^to-/,
                    /^fill-/,
                    /^stroke-/,
                ],
                deep: [
                    /-(enter|leave)(-(active|from|to))?$/,
                    /^(dark|light):/,
                ],
            },
        })
    );
}

export default { plugins };
