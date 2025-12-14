import pourhubLogo from "@/assets/pourhub-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-6 h-6", 
  lg: "w-8 h-8",
  xl: "w-10 h-10"
};

export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <img 
      src={pourhubLogo} 
      alt="PourHub Logo" 
      className={className || sizeClasses[size]}
    />
  );
}

export default Logo;
