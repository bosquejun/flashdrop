import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { cn } from "@repo/ui/lib/utils";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginModal({
  buttonProps,
}: {
  buttonProps?: {
    className?: string;
    label?: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setIsLoading(true);
    try {
      await login(identifier.trim());
      setOpen(false);
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  const modal = open && (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      <dialog
        open
        aria-labelledby="login-title"
        aria-describedby="login-description"
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-100 bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8 sm:mx-0 lg:p-10"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 rounded-lg opacity-70 hover:opacity-100"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === "Enter" && setOpen(false)}
          aria-label="Close"
        >
          <XIcon className="size-5" />
        </Button>

        <div className="mb-8 flex flex-col gap-0 text-left">
          <h2
            id="login-title"
            className="text-3xl font-black uppercase italic tracking-tighter text-zinc-900"
          >
            Welcome Back.
          </h2>
          <p id="login-description" className="mt-2 text-sm text-zinc-600">
            Sign in to complete your order.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="identifier"
              className="block text-[10px] font-bold uppercase italic tracking-widest text-zinc-900"
            >
              Username or Email
            </label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your username or email"
              autoFocus
              required
              disabled={isLoading}
              className="h-12 rounded-xl text-base"
            />
            <p className="text-[9px] italic text-zinc-500">
              You can use either your username or email address
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !identifier.trim()}
            className="bg-zinc-900 text-white h-12 w-full rounded-xl text-base font-bold uppercase italic tracking-widest"
          >
            {isLoading ? "Signing In..." : "Sign In Now"}
          </Button>
        </form>

        <div className="mt-8 border-t border-zinc-50 pt-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">
            New here?{" "}
            <Button type="button" variant="link" className="h-auto p-0 font-bold italic">
              Create an Account
            </Button>
          </p>
        </div>
      </dialog>
    </div>
  );

  const portalContainer =
    typeof document !== "undefined"
      ? (document.getElementById("portal-root") ?? document.body)
      : null;

  return (
    <>
      <Button
        type="button"
        className={cn(
          "rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] italic min-h-10 px-5 sm:px-8",
          buttonProps?.className
        )}
        onClick={() => setOpen(true)}
      >
        {buttonProps?.label ?? "Sign In"}
      </Button>
      {portalContainer && modal && createPortal(modal, portalContainer)}
    </>
  );
}
