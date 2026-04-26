type SmallIconProps = {
    icon: React.ElementType;
    className?: string;
    variant?: "default" | "sucess" | "danger";
};

const variants = {
    default: "text-white",
    sucess: "text-green-500",
    danger: "text-red-300",
};

export function SmallIcon({
    icon: Icon,
    className = "",
    variant = "default",
}: SmallIconProps) {
    return <Icon className={`w-5 h-5 ${variants[variant]} ${className}`} />;
}

export function NormalIcon({
    icon: Icon,
    className = "",
    variant = "default",
}: SmallIconProps) {
    return <Icon className={`w-8 h-8 ${variants[variant]} ${className}`} />;
}
