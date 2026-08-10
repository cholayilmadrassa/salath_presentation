import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Home, SearchX } from 'lucide-react';

export default function NotFound({ message }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground font-ml">
      <div className="max-w-md w-full bg-card rounded-3xl p-8 text-center space-y-6 shadow-2xl border border-border animate-fade-in">
        {/* 404 Icon Header */}
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto bg-destructive/10 text-destructive border border-destructive/20 shadow-inner">
          <SearchX className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-destructive bg-destructive/10 px-3 py-1 rounded-full">
            404 Error
          </span>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Page or Subdomain Not Found
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto font-medium">
            {message || "The event campaign subdomain or page you are looking for does not exist or may have been removed."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Button asChild size="lg" className="w-full font-bold text-xs rounded-2xl shadow-md">
            <a
              href="/"
              onClick={() => {
                localStorage.removeItem('activeTenantSlug');
              }}
            >
              <Home className="w-4 h-4 mr-2" />
              <span>Return to Platform Home</span>
            </a>
          </Button>

          <Button variant="outline" asChild size="lg" className="w-full font-bold text-xs rounded-2xl">
            <Link to="/register-team">
              <Building2 className="w-4 h-4 mr-2 text-primary" />
              <span>Register New Swalath Campaign</span>
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
