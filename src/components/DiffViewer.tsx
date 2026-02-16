import { ScrollArea } from "@/components/ui/scroll-area";

export function DiffViewer({ value }: { value: string }) {
  return (
    <ScrollArea className="max-h-[260px] rounded-lg bg-[#0b0f20] p-3">
      <pre className="text-sm text-text-main whitespace-pre-wrap">{value}</pre>
    </ScrollArea>
  );
}
