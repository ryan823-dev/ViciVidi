'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Zap, ShoppingCart } from 'lucide-react';

interface CreditAlertProps {
  remaining: number;
  required: number;
  onBuyCredits: () => void;
}

export function CreditAlert({ remaining, required, onBuyCredits }: CreditAlertProps) {
  const [isOpen, setIsOpen] = useState(true);

  const shortage = required - remaining;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <DialogTitle>积分不足</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            您的账户积分不足以完成此操作
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">当前积分</span>
              <span className="font-semibold">{remaining} credits</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">需要积分</span>
              <span className="font-semibold text-destructive">{required} credits</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">还需购买</span>
              <span className="font-bold text-orange-600">{shortage} credits</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>建议：</strong>购买 Medium 数据包（400 credits）仅需 $249，
              足够完成 {Math.floor(400 / shortage)} 次类似操作
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            稍后再说
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)]"
            onClick={() => {
              setIsOpen(false);
              onBuyCredits();
            }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            购买积分
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 积分不足时的优雅降级 Hook
 */
export function useCreditGracefulDegradation() {
  const [showAlert, setShowAlert] = useState(false);
  const [creditInfo, setCreditInfo] = useState<{ remaining: number; required: number } | null>(null);

  /**
   * 检查积分是否足够，不足时显示提示
   */
  const checkAndAlert = (remaining: number, required: number): boolean => {
    if (remaining < required) {
      setCreditInfo({ remaining, required });
      setShowAlert(true);
      return false;
    }
    return true;
  };

  /**
   * 降级策略：根据积分余额调整功能
   */
  const getDegradedFeatures = (remaining: number) => {
    if (remaining <= 0) {
      return {
        aiSearch: false,
        intentDetection: false,
        webhookExport: false,
        message: '积分已用完，请购买积分包继续使用',
      };
    }

    if (remaining < 10) {
      return {
        aiSearch: false, // AI 搜索成本高，优先禁用
        intentDetection: true,
        webhookExport: true,
        message: '积分不足 10，建议仅使用基础功能',
      };
    }

    if (remaining < 50) {
      return {
        aiSearch: true,
        intentDetection: true,
        webhookExport: false, // Webhook 导出成本高
        message: '积分较少，建议谨慎使用高成本功能',
      };
    }

    return {
      aiSearch: true,
      intentDetection: true,
      webhookExport: true,
      message: null,
    };
  };

  return {
    showAlert,
    creditInfo,
    checkAndAlert,
    getDegradedFeatures,
    dismissAlert: () => setShowAlert(false),
  };
}

export default CreditAlert;
