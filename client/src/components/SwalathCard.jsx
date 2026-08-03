import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, BookOpen, Image as ImageIcon, ZoomIn, X, Sparkles } from 'lucide-react';

const DEFAULT_ARABIC = 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ وَبَارِكْ وَسَلِّمْ';

export default function SwalathCard({ swalath, className = '' }) {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState('text-2xl sm:text-3xl');
  const [showImageModal, setShowImageModal] = useState(false);

  const title = swalath?.title || 'സ്വലാത്ത്';
  const arabicText = swalath?.arabicText || DEFAULT_ARABIC;
  const translation = swalath?.translation || '';
  const imageUrl = swalath?.imageUrl || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(arabicText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <Card className={`overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-card via-card to-emerald-950/10 shadow-xl rounded-3xl ${className}`}>
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-foreground leading-tight">
                {title}
              </h3>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Arabic Swalath
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Font Size Selector */}
            <div className="hidden sm:flex items-center bg-muted/50 rounded-xl p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setFontSize('text-lg sm:text-xl')}
                className={`px-2 py-1 rounded-lg transition-colors ${fontSize.includes('text-lg') ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize('text-2xl sm:text-3xl')}
                className={`px-2 py-1 rounded-lg transition-colors ${fontSize.includes('text-2xl') ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('text-3xl sm:text-4xl')}
                className={`px-2 py-1 rounded-lg transition-colors ${fontSize.includes('text-3xl') ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
              >
                A+
              </button>
            </div>

            {/* Copy Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="rounded-xl h-8 text-xs font-bold gap-1.5 border-primary/20 active:scale-95 transition-transform"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-primary" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Arabic Text Box */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#EAF5EF] via-[#EDF7F2] to-[#D9EFE3] text-[#07351F] shadow-sm border border-emerald-500/30 text-center overflow-hidden">
          {/* Decorative Calligraphy Ornaments */}
          <div className="absolute top-2 left-3 opacity-25 text-emerald-700 font-arabic text-3xl select-none pointer-events-none">
            &#1757;
          </div>
          <div className="absolute bottom-2 right-3 opacity-25 text-emerald-700 font-arabic text-3xl select-none pointer-events-none">
            &#1757;
          </div>
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

          {/* Arabic Text Display */}
          <p
            dir="rtl"
            className={`font-arabic ${fontSize} leading-relaxed text-[#064E2B] font-bold tracking-wide select-text py-2`}
          >
            {arabicText}
          </p>
        </div>

        {/* Translation Section */}
        {translation && (
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Meaning / വിവരണം</span>
            </span>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed font-medium">
              {translation}
            </p>
          </div>
        )}

        {/* Attached Image Preview if Present */}
        {imageUrl && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                <span>Swalath Document / Image</span>
              </span>
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="text-primary hover:underline text-[11px] flex items-center gap-1"
              >
                <ZoomIn className="w-3 h-3" /> View Fullscreen
              </button>
            </div>

            <div
              onClick={() => setShowImageModal(true)}
              className="relative cursor-pointer rounded-2xl overflow-hidden border border-border group max-h-56 bg-black/5"
            >
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-48 object-contain bg-black/20 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1 backdrop-blur-[2px]">
                <ZoomIn className="w-4 h-4" /> Click to enlarge
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Image Zoom Modal */}
      {showImageModal && imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-background rounded-3xl overflow-hidden border border-border p-2">
            <button
              type="button"
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full h-full max-h-[80vh] flex items-center justify-center overflow-auto p-2">
              <img
                src={imageUrl}
                alt={title}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
