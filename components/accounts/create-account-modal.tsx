"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import {
  CreditCard,
  Wallet,
  PiggyBank,
  Landmark,
  TrendingUp,
  Plus,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  CreateManualAccount,
  CreateManualAccountSchema,
} from "@/lib/db/schemas/manual-account";
import { useAccounts } from "@/contexts/accounts";
import { useToast } from "@/hooks/use-toast";

interface CreateAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const accountTypes = [
  {
    value: "checking",
    label: "Checking",
    icon: Landmark,
    description: "Day-to-day spending account",
  },
  {
    value: "savings",
    label: "Savings",
    icon: PiggyBank,
    description: "Interest-earning savings account",
  },
  {
    value: "credit",
    label: "Credit Card",
    icon: CreditCard,
    description: "Credit card or line of credit",
  },
  {
    value: "cash",
    label: "Cash",
    icon: Wallet,
    description: "Physical cash or petty cash",
  },
  {
    value: "investment",
    label: "Investment",
    icon: TrendingUp,
    description: "Investment or brokerage account",
  },
];

const predefinedColors = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
];

export function CreateAccountModal({
  open,
  onOpenChange,
}: CreateAccountModalProps) {
  const t = useTranslations("accounts");
  const tCommon = useTranslations("common");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createAccount } = useAccounts();
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<CreateManualAccount>({
    resolver: zodResolver(CreateManualAccountSchema),
    defaultValues: {
      name: "",
      user_id: user?.id || "", // Set from Clerk user
      account_type: "checking" as const,
      institution_name: "",
      currency_code: "USD",
      initial_balance: 0,
      account_number_last_4: "",
      description: "",
      is_active: true,
      include_in_totals: true,
      color: predefinedColors[0],
      icon: "",
    },
    mode: "onChange",
  });

  // Debug logging (only log when modal state changes)
  useEffect(() => {
    console.log("CreateAccountModal state changed - open:", open);
  }, [open]);

  // Update user_id when user becomes available
  useEffect(() => {
    if (user?.id) {
      form.setValue("user_id", user.id);
    }
  }, [user?.id, form]);

  console.log("form:", form.getValues());
  console.log("form errors:", form.formState.errors);

  const [selectedColor, setSelectedColor] = useState(predefinedColors[0]);

  const onSubmit = async (data: CreateManualAccount) => {
    console.log("onSubmit called with data:", data);
    
    setIsSubmitting(true);
    try {
      await createAccount(data);
      toast({
        title: t("create.success.title"),
        description: t("create.success.description"),
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("create.error.title"),
        description:
          error instanceof Error
            ? error.message
            : t("create.error.description"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setSelectedColor(predefinedColors[0]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("add.title")}
          </DialogTitle>
          <DialogDescription>{t("add.description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t("form.basic.title")}</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.name.label")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("form.name.placeholder")}
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
                    <FormLabel>{t("form.type.label")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("form.type.placeholder")}
                          />
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
                                  <div className="font-medium">
                                    {type.label}
                                  </div>
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
                    <FormLabel>{t("form.institution.label")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("form.institution.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.institution.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {t("form.financial.title")}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currency_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.currency.label")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">
                            GBP - British Pound
                          </SelectItem>
                          <SelectItem value="CAD">
                            CAD - Canadian Dollar
                          </SelectItem>
                          <SelectItem value="AUD">
                            AUD - Australian Dollar
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="initial_balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.balance.label")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-9"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t("form.details.title")}</h3>

              <FormField
                control={form.control}
                name="account_number_last_4"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.accountNumber.label")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("form.accountNumber.placeholder")}
                        maxLength={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.accountNumber.description")}
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
                    <FormLabel>{t("form.description.label")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("form.description.placeholder")}
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
              <h3 className="text-lg font-medium">{t("form.display.title")}</h3>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.color.label")}</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              field.onChange(color);
                              setSelectedColor(color);
                            }}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              selectedColor === color
                                ? "border-foreground scale-110"
                                : "border-muted-foreground/20 hover:border-muted-foreground/50"
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
              <h3 className="text-lg font-medium">
                {t("form.settings.title")}
              </h3>

              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>{t("form.active.label")}</FormLabel>
                        <FormDescription>
                          {t("form.active.description")}
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
                        <FormLabel>{t("form.includeInTotals.label")}</FormLabel>
                        <FormDescription>
                          {t("form.includeInTotals.description")}
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
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("form.creating") : t("form.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
