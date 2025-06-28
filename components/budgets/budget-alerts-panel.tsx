"use client";

import { useState } from "react";
import { Bell, X, AlertTriangle, Info, AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBudgetAlerts } from "@/contexts/budget-alerts";
import { BudgetAlert } from "@/lib/services/budget-alerts";
import { useTranslations } from "next-intl";

export function BudgetAlertsPanel() {
  const { alerts, isEnabled, setIsEnabled, dismissAlert, clearAllAlerts } = useBudgetAlerts();
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("budgets.alerts");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-400" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      default:
        return 'bg-muted/10 border-muted/20 text-muted-foreground';
    }
  };

  const AlertItem = ({ alert }: { alert: BudgetAlert }) => (
    <div className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          {getAlertIcon(alert.severity)}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{alert.message}</div>
            {alert.recommendation && (
              <div className="text-xs text-muted-foreground mt-1">{alert.recommendation}</div>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-muted-foreground">{formatTime(alert.timestamp)}</span>
              <Badge variant="outline" className="text-xs">
                {alert.budget.name}
              </Badge>
              <span className="text-muted-foreground">
                {alert.percentageUsed.toFixed(1)}% used
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dismissAlert(alert.id)}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  const hasAlerts = alerts.length > 0;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const warningAlerts = alerts.filter(a => a.severity === 'warning').length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative h-8 w-8 p-0 ${
            hasAlerts && isEnabled ? 'text-yellow-400 hover:text-yellow-300' : 'text-muted-foreground'
          }`}
        >
          <Bell className="h-4 w-4" />
          {hasAlerts && isEnabled && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">{alerts.length}</span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-popover border" align="end">
        <Card className="border-0 bg-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {t("title")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Alertas habilitadas</span>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                  size="sm"
                />
              </div>
              {hasAlerts && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllAlerts}
                  className="text-xs text-muted-foreground hover:text-foreground h-6"
                >
                  Limpiar todo
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isEnabled ? (
              <div className="text-center py-4 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Las alertas de presupuesto están deshabilitadas</p>
                <p className="text-xs">Habilita las alertas para ser notificado sobre límites de gastos</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("noAlerts")}</p>
                <p className="text-xs">Serás notificado cuando te acerques a los límites del presupuesto</p>
              </div>
            ) : (
              <>
                {/* Alert Summary */}
                {(criticalAlerts > 0 || warningAlerts > 0) && (
                  <div className="flex gap-2 text-xs">
                    {criticalAlerts > 0 && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        {criticalAlerts} Críticas
                      </Badge>
                    )}
                    {warningAlerts > 0 && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        {warningAlerts} Advertencias
                      </Badge>
                    )}
                  </div>
                )}

                {/* Alert List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {alerts.map((alert) => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}