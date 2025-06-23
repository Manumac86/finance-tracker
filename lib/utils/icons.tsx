import {
  ArrowDownLeft,
  ShoppingBag,
  Coffee,
  Home,
  Car,
  Gamepad2,
  Receipt,
  Heart,
  GraduationCap,
  Plane,
  PiggyBank,
  Gift,
  Scissors,
  Shield,
  Calculator,
  MoreHorizontal,
  DollarSign,
} from "lucide-react";

export const getCategoryIcon = (iconName: string, className: string = "h-6 w-6") => {
  switch (iconName) {
    case "ArrowDownLeft":
      return <ArrowDownLeft className={className} />;
    case "ShoppingBag":
      return <ShoppingBag className={className} />;
    case "Coffee":
      return <Coffee className={className} />;
    case "Home":
      return <Home className={className} />;
    case "Car":
      return <Car className={className} />;
    case "Gamepad2":
      return <Gamepad2 className={className} />;
    case "Receipt":
      return <Receipt className={className} />;
    case "Heart":
      return <Heart className={className} />;
    case "GraduationCap":
      return <GraduationCap className={className} />;
    case "Plane":
      return <Plane className={className} />;
    case "PiggyBank":
      return <PiggyBank className={className} />;
    case "Gift":
      return <Gift className={className} />;
    case "Scissors":
      return <Scissors className={className} />;
    case "Shield":
      return <Shield className={className} />;
    case "Calculator":
      return <Calculator className={className} />;
    case "MoreHorizontal":
      return <MoreHorizontal className={className} />;
    case "DollarSign":
      return <DollarSign className={className} />;
    default:
      return <MoreHorizontal className={className} />;
  }
};