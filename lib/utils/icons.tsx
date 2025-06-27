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
  // New icons for expanded category support
  Utensils,
  Fuel,
  Pill,
  Film,
  Target,
  Laptop,
  Smartphone,
  Palmtree,
  BookOpen,
  Lightbulb,
  Wrench,
  Palette,
  Activity,
  BarChart3,
  MapPin,
  Music,
  Camera,
  Briefcase,
  CreditCard,
  Dumbbell,
} from "lucide-react";

// Available category icons for selection
export const AVAILABLE_CATEGORY_ICONS = [
  "Utensils", "Home", "Car", "Fuel", "ShoppingBag", "Pill", "Film", "Target", 
  "Laptop", "Smartphone", "Plane", "Palmtree", "GraduationCap", "BookOpen", 
  "Lightbulb", "Wrench", "Palette", "Activity", "DollarSign", "BarChart3",
  "Coffee", "Heart", "PiggyBank", "Gift", "Scissors", "Shield", "Calculator",
  "Receipt", "Gamepad2", "ArrowDownLeft", "MapPin", "Music", "Camera", 
  "Briefcase", "CreditCard", "Dumbbell", "MoreHorizontal"
];

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
    // New expanded icons
    case "Utensils":
      return <Utensils className={className} />;
    case "Fuel":
      return <Fuel className={className} />;
    case "Pill":
      return <Pill className={className} />;
    case "Film":
      return <Film className={className} />;
    case "Target":
      return <Target className={className} />;
    case "Laptop":
      return <Laptop className={className} />;
    case "Smartphone":
      return <Smartphone className={className} />;
    case "Palmtree":
      return <Palmtree className={className} />;
    case "BookOpen":
      return <BookOpen className={className} />;
    case "Lightbulb":
      return <Lightbulb className={className} />;
    case "Wrench":
      return <Wrench className={className} />;
    case "Palette":
      return <Palette className={className} />;
    case "Activity":
      return <Activity className={className} />;
    case "BarChart3":
      return <BarChart3 className={className} />;
    case "MapPin":
      return <MapPin className={className} />;
    case "Music":
      return <Music className={className} />;
    case "Camera":
      return <Camera className={className} />;
    case "Briefcase":
      return <Briefcase className={className} />;
    case "CreditCard":
      return <CreditCard className={className} />;
    case "Dumbbell":
      return <Dumbbell className={className} />;
    default:
      return <MoreHorizontal className={className} />;
  }
};