import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

// Gera uma cor HSL baseada no nome do cliente
const getColorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Gera um matiz (hue) entre 0-360 baseado no hash
  const hue = Math.abs(hash % 360);
  
  // Saturação e luminosidade fixas para garantir boa legibilidade
  return `hsl(${hue}, 65%, 50%)`;
};

interface ClientAvatarProps {
  name?: string;
  imageUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function ClientAvatar({ 
  name = "Cliente", 
  imageUrl, 
  className = "h-10 w-10",
  fallbackClassName = ""
}: ClientAvatarProps) {
  const backgroundColor = getColorFromName(name);
  
  return (
    <Avatar className={className}>
      {imageUrl && (
        <AvatarImage
          src={imageUrl}
          alt={name}
        />
      )}
      <AvatarFallback 
        className={fallbackClassName}
        style={{ 
          backgroundColor,
          color: 'white',
          fontWeight: 600
        }}
      >
        <User className="h-[60%] w-[60%]" />
      </AvatarFallback>
    </Avatar>
  );
}