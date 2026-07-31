import React from 'react';
import { FaWhatsapp, FaPhoneAlt } from 'react-icons/fa';
import { Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Footer() {
  return (
    <footer className="hidden md:block bg-card text-card-foreground pt-10 pb-10 px-4 border-t border-border font-ml">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Brand & Organization Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
              ☪
            </div>
            <div>
              <h3 className="font-extrabold text-foreground text-base tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
                <span>സ്വലാത്ത് സമർപ്പണം</span>
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </h3>
              <p className="text-xs text-muted-foreground">ഉമ്മുൽ ഖുറാ അക്കാദമി പടിഞ്ഞാറത്തറ</p>
            </div>
          </div>

          {/* Quick Contact Touch Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="soft" size="sm" asChild className="flex-1 sm:flex-initial">
              <a href="tel:+919747785512">
                <FaPhoneAlt className="mr-2 text-primary" />
                <span>Call Us</span>
              </a>
            </Button>

            <Button size="sm" asChild className="flex-1 sm:flex-initial">
              <a href="https://wa.me/919747785512" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp className="mr-2" />
                <span>WhatsApp</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Footer Bottom Note */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground text-center sm:text-left font-medium">
          <p>© 2026 Ummul Qura Academy. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>മുത്തുനബി ﷺ സ്നേഹത്തോടെ സമർപ്പിക്കുന്നു</span>
            <Heart className="w-3.5 h-3.5 text-destructive fill-destructive" />
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
