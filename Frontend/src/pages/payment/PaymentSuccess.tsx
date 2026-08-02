import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const tranId = searchParams.get('tranId') || '';
  const nav = useNavigate();

  return (
    <div className="container min-h-[75vh] flex items-center justify-center py-10">
      <Card className="max-w-md w-full p-8 text-center border-none shadow-xl bg-card rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        
        <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">Payment Successful!</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Thank you for your purchase. Your payment has been securely verified and processed.
        </p>

        <div className="bg-muted/40 border border-border/50 rounded-2xl p-4 text-left space-y-2.5 mb-8 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">Order ID</span>
            <span className="font-mono font-bold text-xs uppercase">#{orderId.slice(-6)}</span>
          </div>
          <div className="flex justify-between border-t border-border/40 pt-2.5">
            <span className="text-muted-foreground font-medium">Transaction ID</span>
            <span className="font-mono text-xs truncate max-w-[200px]" title={tranId}>{tranId}</span>
          </div>
          <div className="flex justify-between border-t border-border/40 pt-2.5">
            <span className="text-muted-foreground font-medium">Payment Status</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">Paid</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => nav(`/orders/${orderId}`)} 
            className="w-full h-12 rounded-full font-bold shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            Track Order
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <Button 
            variant="outline" 
            onClick={() => nav('/')} 
            className="w-full h-12 rounded-full font-bold border-border/80"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </Card>
    </div>
  );
}
