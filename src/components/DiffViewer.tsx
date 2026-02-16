import { ScrollArea } from "@/components/ui/scroll-area";

export function DiffViewer({ value }: { value: string }) {
  return (
    <ScrollArea className="max-h-[260px] rounded-lg bg-muted p-3">
      <pre className="text-sm whitespace-pre-wrap">{value}</pre>
    </ScrollArea>
  );
}
