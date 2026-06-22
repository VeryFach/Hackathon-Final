import { AppShell } from "@/components/app-shell";
import { incomingRequests } from "@/lib/mock-data";
import { MapPin, Check, X, Clock } from "lucide-react";

export default function RequestsPage() {
  return (
    <AppShell 
      title="Permintaan Masuk" 
      subtitle="Daftar pickup minyak jelantah yang menunggu konfirmasi."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        
        {incomingRequests.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-[var(--radius)]">
            Belum ada permintaan masuk saat ini.
          </div>
        ) : (
          incomingRequests.map((r) => (
            <div 
              key={r.id} 
              className="group relative rounded-[var(--radius)] border border-border bg-card p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)] transition-all duration-300 flex flex-col justify-between"
            >
              {/* Badge Status */}
              <div className="absolute -top-3 -right-3 bg-secondary text-secondary-foreground text-[10px] font-bold px-3 py-1 rounded-full border border-border shadow-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Menunggu
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="pr-4">
                  <h3 className="font-semibold text-foreground text-lg line-clamp-1">
                    {r.user}
                  </h3>
                  <div className="text-sm text-muted-foreground mt-1.5 flex flex-col gap-1">
                    <span className="flex items-start gap-1.5 line-clamp-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" /> 
                      <span>{r.lokasi}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 ml-5 font-mono text-xs text-accent">
                      • {r.jarak}
                    </span>
                  </div>
                </div>
                
                {/* Highlight Liter */}
                <div className="text-right shrink-0 bg-muted/50 px-3 py-2 rounded-lg border border-border/50">
                  <div className="text-2xl font-black bg-[image:var(--gradient-sage)] text-transparent bg-clip-text">
                    {r.liter}
                  </div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                    Liter
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto pt-4 flex gap-3 border-t border-border">
                <button 
                  className="flex-1 py-2.5 rounded-md border border-border text-sm font-medium text-foreground inline-flex items-center justify-center gap-2 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="w-4 h-4" /> 
                  Tolak
                </button>
                <button 
                  className="flex-1 py-2.5 rounded-md text-sm font-medium text-primary-foreground inline-flex items-center justify-center gap-2 bg-[image:var(--gradient-warm)] hover:opacity-90 shadow-sm transition-opacity"
                >
                  <Check className="w-4 h-4" /> 
                  Terima
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}