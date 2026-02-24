import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PurchaseFormProps {
  onPurchase: (userId: string) => void;
  loading: boolean;
  disabled: boolean;
}

export function PurchaseForm({ onPurchase, loading, disabled }: PurchaseFormProps) {
  const [userId, setUserId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userId.trim();
    if (trimmed) {
      onPurchase(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="userId" className="text-sm font-medium">
          Your Username or Email
        </label>
        <Input
          id="userId"
          type="text"
          placeholder="Enter your username or email"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          disabled={disabled || loading}
          className="h-12 text-base"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full h-12 text-base font-semibold"
        disabled={disabled || loading || !userId.trim()}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Processing...
          </span>
        ) : (
          "Buy Now"
        )}
      </Button>
    </form>
  );
}
