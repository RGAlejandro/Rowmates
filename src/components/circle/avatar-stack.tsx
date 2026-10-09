import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

export function AvatarStack({
  people,
  max = 5,
  size = "sm",
  className,
}: {
  people: { id: string; displayName: string; avatarUrl: string | null }[];
  max?: number;
  size?: "xs" | "sm";
  className?: string;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className={cn("flex -space-x-2", className)}>
      {shown.map((person) => (
        <UserAvatar key={person.id} name={person.displayName} src={person.avatarUrl} size={size} className="ring-2 ring-background" />
      ))}
      {extra > 0 && (
        <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs ring-2 ring-background">+{extra}</span>
      )}
    </div>
  );
}
