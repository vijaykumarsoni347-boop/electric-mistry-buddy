import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
}

/**
 * Camera se bar code scan karne wala dialog.
 * html5-qrcode ko sirf browser me dynamically import karta hai (SSR safe).
 */
export function BarcodeScannerDialog({ open, onOpenChange, onScan }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const start = async () => {
      setStarting(true);
      setError(null);
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode("barcode-camera-view");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            const code = decodedText.trim();
            const now = Date.now();
            // Same code ko 2 second ke andar dobara mat lo
            if (lastScanRef.current.code === code && now - lastScanRef.current.time < 2000) return;
            lastScanRef.current = { code, time: now };
            onScan(code);
          },
          () => {}
        );
      } catch {
        if (!cancelled) setError("Camera nahi khul paya. Camera ki ijazat dein aur dobara try karein.");
      } finally {
        if (!cancelled) setStarting(false);
      }
    };

    // Dialog ke render hone ka thoda time dein
    const t = setTimeout(start, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) s.stop().catch(() => {});
    };
  }, [open, onScan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> Camera se Scan Karein
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div
            id="barcode-camera-view"
            className="w-full overflow-hidden rounded-md border bg-muted min-h-[220px]"
          />
          {starting && <p className="text-sm text-muted-foreground">Camera khul raha hai, thoda rukiye...</p>}
          {error && (
            <div className="space-y-2">
              <p className="text-sm text-destructive flex items-center gap-2">
                <CameraOff className="h-4 w-4" /> {error}
              </p>
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Band Karein
              </Button>
            </div>
          )}
          {!error && (
            <p className="text-xs text-muted-foreground">
              Saman ka bar code camera ke saamne rakhein — scan hote hi saman jud jayega.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
