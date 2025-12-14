import pourhubLogo from "@/assets/pourhub-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-8 h-8", 
  lg: "w-10 h-10",
  xl: "w-12 h-12"
};

export function Logo({ className, size = "md" }: LogoProps) {
  const baseClasses = sizeClasses[size];
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;
  
  return (
    <img 
      src={pourhubLogo} 
      alt="PourHub Logo" 
      className={combinedClasses}
    />
  );
}

export default Logo;
