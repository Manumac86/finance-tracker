"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  CreditCard, 
  Wallet, 
  PiggyBank, 
  Landmark, 
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UIManualAccount } from '@/lib/db/schemas/manual-account';
import { useAccounts } from '@/contexts/accounts';
import { useToast } from '@/hooks/use-toast';

interface AccountCardProps {
  account: UIManualAccount;
  onEdit: () => void;
}

const accountTypeIcons = {
  checking: Landmark,
  savings: PiggyBank,
  credit: CreditCard,
  cash: Wallet,
  investment: TrendingUp,
};

const accountTypeColors = {
  checking: 'bg-blue-100 text-blue-800 border-blue-200',
  savings: 'bg-green-100 text-green-800 border-green-200',
  credit: 'bg-red-100 text-red-800 border-red-200',
  cash: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  investment: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function AccountCard({ account, onEdit }: AccountCardProps) {
  const t = useTranslations('accounts');
  const tCommon = useTranslations('common');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const { deleteAccount } = useAccounts();
  const { toast } = useToast();

  const Icon = accountTypeIcons[account.accountType as keyof typeof accountTypeIcons];
  const typeColorClass = accountTypeColors[account.accountType as keyof typeof accountTypeColors];

  const handleDelete = async () => {
    try {
      await deleteAccount(account.id!);
      toast({
        title: t('delete.success.title'),
        description: t('delete.success.description'),
      });
    } catch {
      toast({
        title: t('delete.error.title'),
        description: t('delete.error.description'),
        variant: 'destructive',
      });
    }
    setShowDeleteDialog(false);
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currencyCode,
    }).format(balance);
  };

  const isNegative = account.currentBalance < 0;
  const balanceColor = isNegative ? 'text-red-600' : 'text-green-600';

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${typeColorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{account.name}</h3>
              {account.institutionName && (
                <p className="text-sm text-muted-foreground truncate">
                  {account.institutionName}
                </p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {tCommon('edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBalance(!showBalance)}>
                {showBalance ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {showBalance ? t('hideBalance') : t('showBalance')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {tCommon('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Account Type */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={typeColorClass}>
              {t(`types.${account.accountType}`)}
            </Badge>
            
            {!account.isActive && (
              <Badge variant="secondary">{t('status.inactive')}</Badge>
            )}
          </div>

          {/* Balance */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('currentBalance')}</span>
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                {showBalance ? (
                  <span className={`font-semibold ${balanceColor}`}>
                    {formatBalance(account.currentBalance)}
                  </span>
                ) : (
                  <span className="font-semibold">••••••</span>
                )}
              </div>
            </div>
            
            {account.currentBalance !== account.initialBalance && (
              <div className="text-xs text-muted-foreground">
                {t('initialBalance')}: {showBalance ? formatBalance(account.initialBalance) : '••••••'}
              </div>
            )}
          </div>

          {/* Account Details */}
          <div className="space-y-1">
            {account.accountNumberLast4 && (
              <div className="text-xs text-muted-foreground">
                {t('accountNumber')}: ••••{account.accountNumberLast4}
              </div>
            )}
            
            {account.description && (
              <div className="text-xs text-muted-foreground line-clamp-2">
                {account.description}
              </div>
            )}
          </div>

          {/* Settings Indicators */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              {!account.includeInTotals && (
                <Badge variant="outline" className="text-xs">
                  {t('excludedFromTotals')}
                </Badge>
              )}
            </div>
            
            {account.color && (
              <div 
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: account.color }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.confirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.confirm.description', { name: account.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}