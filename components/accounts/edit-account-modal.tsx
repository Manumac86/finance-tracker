"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { 
  CreditCard, 
  Wallet, 
  PiggyBank, 
  Landmark, 
  TrendingUp,
  Edit,
  DollarSign,
  History
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { UpdateManualAccountSchema, type UpdateManualAccount } from '@/lib/db/schemas/manual-account';
import { useAccounts, useAccount } from '@/contexts/accounts';
import { useToast } from '@/hooks/use-toast';

interface EditAccountModalProps {
  accountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const accountTypes = [
  { value: 'checking', label: 'Checking', icon: Landmark, description: 'Day-to-day spending account' },
  { value: 'savings', label: 'Savings', icon: PiggyBank, description: 'Interest-earning savings account' },
  { value: 'credit', label: 'Credit Card', icon: CreditCard, description: 'Credit card or line of credit' },
  { value: 'cash', label: 'Cash', icon: Wallet, description: 'Physical cash or petty cash' },
  { value: 'investment', label: 'Investment', icon: TrendingUp, description: 'Investment or brokerage account' },
];

const predefinedColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export function EditAccountModal({ accountId, open, onOpenChange }: EditAccountModalProps) {
  const t = useTranslations('accounts');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [balanceDescription, setBalanceDescription] = useState('');
  const { updateAccount, updateBalance } = useAccounts();
  const { account, history, isLoading } = useAccount(accountId);
  const { toast } = useToast();

  const form = useForm<UpdateManualAccount>({
    resolver: zodResolver(UpdateManualAccountSchema),
    defaultValues: {
      name: '',
      account_type: 'checking',
      institution_name: '',
      account_number_last_4: '',
      description: '',
      is_active: true,
      include_in_totals: true,
      color: predefinedColors[0],
      icon: '',
    },
  });

  // Update form when account data loads
  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        account_type: account.accountType,
        institution_name: account.institutionName || '',
        account_number_last_4: account.accountNumberLast4 || '',
        description: account.description || '',
        is_active: account.isActive,
        include_in_totals: account.includeInTotals,
        color: account.color || predefinedColors[0],
        icon: account.icon || '',
      });
      setNewBalance(account.currentBalance.toString());
    }
  }, [account, form]);

  const selectedColor = form.watch('color');

  const onSubmit = async (data: UpdateManualAccount) => {
    if (!account) return;
    
    setIsSubmitting(true);
    try {
      await updateAccount(account.id!, data);
      toast({
        title: t('edit.success.title'),
        description: t('edit.success.description'),
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('edit.error.title'),
        description: error instanceof Error ? error.message : t('edit.error.description'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!account) return;
    
    const balance = parseFloat(newBalance);
    if (isNaN(balance)) {
      toast({
        title: t('balance.error.title'),
        description: t('balance.error.invalid'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBalance(account.id!, balance, balanceDescription || undefined);
      toast({
        title: t('balance.success.title'),
        description: t('balance.success.description'),
      });
      setBalanceDescription('');
    } catch (error) {
      toast({
        title: t('balance.error.title'),
        description: error instanceof Error ? error.message : t('balance.error.description'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account?.currencyCode || 'USD',
    }).format(balance);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || !account) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {t('edit.title')}
          </DialogTitle>
          <DialogDescription>
            {t('edit.description', { name: account.name })}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
            <TabsTrigger value="balance">{t('tabs.balance')}</TabsTrigger>
            <TabsTrigger value="history">{t('tabs.history')}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('form.basic.title')}</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.name.label')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('form.name.placeholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="account_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.type.label')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accountTypes.map((type) => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <div>
                                      <div className="font-medium">{type.label}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {type.description}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="institution_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.institution.label')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('form.institution.placeholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t('form.institution.description')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Account Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('form.details.title')}</h3>
                  
                  <FormField
                    control={form.control}
                    name="account_number_last_4"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.accountNumber.label')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('form.accountNumber.placeholder')} 
                            maxLength={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t('form.accountNumber.description')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.description.label')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('form.description.placeholder')} 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Display Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('form.display.title')}</h3>
                  
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.color.label')}</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {predefinedColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => field.onChange(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                  selectedColor === color 
                                    ? 'border-foreground scale-110' 
                                    : 'border-muted-foreground/20 hover:border-muted-foreground/50'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Account Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('form.settings.title')}</h3>
                  
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>{t('form.active.label')}</FormLabel>
                            <FormDescription>
                              {t('form.active.description')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="include_in_totals"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>{t('form.includeInTotals.label')}</FormLabel>
                            <FormDescription>
                              {t('form.includeInTotals.description')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('form.updating') : t('form.update')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="balance" className="space-y-6">
            <div className="space-y-4">
              <div className="text-center py-6">
                <h3 className="text-2xl font-bold">{t('balance.current')}</h3>
                <p className="text-3xl font-bold text-primary mt-2">
                  {formatBalance(account.currentBalance)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('balance.initial')}: {formatBalance(account.initialBalance)}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-medium">{t('balance.update.title')}</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="newBalance">{t('balance.update.amount')}</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newBalance"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-9"
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="balanceDescription">{t('balance.update.description')}</Label>
                    <Textarea
                      id="balanceDescription"
                      placeholder={t('balance.update.descriptionPlaceholder')}
                      rows={2}
                      value={balanceDescription}
                      onChange={(e) => setBalanceDescription(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleBalanceUpdate}
                    disabled={isSubmitting || !newBalance}
                    className="w-full"
                  >
                    {isSubmitting ? t('balance.updating') : t('balance.update.button')}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                <h3 className="text-lg font-medium">{t('history.title')}</h3>
              </div>

              {history && history.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((entry: { balance_after: number; created_at: string; description?: string; balance_change: number }, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {formatBalance(entry.balance_after)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </p>
                        {entry.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {entry.description}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={entry.balance_change > 0 ? "default" : "destructive"}
                      >
                        {entry.balance_change > 0 ? '+' : ''}
                        {formatBalance(entry.balance_change)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('history.empty')}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}