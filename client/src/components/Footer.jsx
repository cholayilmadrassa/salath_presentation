import React from 'react';
import { FaWhatsapp, FaPhoneAlt } from 'react-icons/fa';
import { Sparkles, Heart } from 'lucide-react';

function Footer() {
  return (
    // Hidden on mobile (hidden md:block) as requested
    <footer className="hidden md:block bg-[#004022] text-white pt-10 pb-10 px-4 border-t border-[#00572e] font-ml">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Brand & Organization Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left pb-6 border-b border-[#00572e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-amber-500 text-stone-950 flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
              ☪
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
                <span>സ്വലാത്ത് സമർപ്പണം</span>
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              </h3>
              <p className="text-xs text-emerald-200">ഉമ്മുൽ ഖുറാ അക്കാദമി പടിഞ്ഞാറത്തറ</p>
            </div>
          </div>

          {/* Quick Contact Touch Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href="tel:+919747785512"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#00572e] border border-[#00703c] hover:bg-[#00703c] text-gold-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition"
            >
              <FaPhoneAlt style={{ color: '#67C090' }} />
              <span>Call Us</span>
            </a>

            <a
              href="https://wa.me/919747785512"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#00703c] border border-[#008a48] hover:bg-[#008a48] text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition"
            >
              <FaWhatsapp className="text-white text-sm" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Footer Bottom Note */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-300 text-center sm:text-left font-medium">
          <p>© 2026 Ummul Qura Academy. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>മുത്തുനബി ﷺ സ്നേഹത്തോടെ സമർപ്പിക്കുന്നു</span>
            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
