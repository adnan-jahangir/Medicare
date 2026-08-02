import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentFail() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const reason = searchParams.get('reason') || '';
  const nav = useNavigate();

  return (
    <div className="container min-h-[75vh] flex items-center justify-center py-10">
      <Card className="max-w-md w-full p-8 text-center border-none shadow-xl bg-card rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
        
        <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
          <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">Payment Failed</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {reason === 'cancelled' 
            ? 'The transaction was cancelled. If you encountered an issue, please try again.' 
            : 'We were unable to process your payment. Please check your card/wallet details and try again.'}
        </p>

        {orderId && (
          <div className="bg-muted/40 border border-border/50 rounded-2xl p-4 text-left space-y-2.5 mb-8 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Order ID</span>
              <span className="font-mono font-bold text-xs uppercase">#{orderId.slice(-6)}</span>
            </div>
            <div className="flex justify-between border-t border-border/40 pt-2.5">
              <span className="text-muted-foreground font-medium">Failure Reason</span>
              <span className="text-red-600 font-bold capitalize">{reason || 'Payment Refused'}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={() => nav('/cart')} 
            className="w-full h-12 rounded-full font-bold shadow-md bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Checkout
          </Button>

          <Button 
            variant="outline" 
            onClick={() => nav('/')} 
            className="w-full h-12 rounded-full font-bold border-border/80"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Go to Shop
          </Button>
        </div>
      </Card>
    </div>
  );
}
