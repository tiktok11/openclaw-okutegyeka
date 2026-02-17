import type { DiscordGuildChannel } from "../lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export function Channels({
  discordGuildChannels,
  onRefresh,
}: {
  discordGuildChannels: DiscordGuildChannel[];
  onRefresh: () => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, { guildName: string; channels: DiscordGuildChannel[] }>();
    for (const gc of discordGuildChannels) {
      if (!map.has(gc.guildId)) {
        map.set(gc.guildId, { guildName: gc.guildName, channels: [] });
      }
      map.get(gc.guildId)!.channels.push(gc);
    }
    return Array.from(map.entries());
  }, [discordGuildChannels]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Channels</h2>
        <Button onClick={onRefresh}>
          Refresh Discord channels
        </Button>
      </div>

      {grouped.length === 0 ? (
        <p className="text-muted-foreground">
          No Discord channels cached. Click "Refresh Discord channels" to load.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([guildId, { guildName, channels }]) => (
            <Card key={guildId}>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <strong className="text-lg">{guildName}</strong>
                  <Badge variant="secondary">{guildId}</Badge>
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
                  {channels.map((ch) => (
                    <div
                      key={ch.channelId}
                      className="rounded-md border px-3 py-2"
                    >
                      <div className="text-sm font-medium">{ch.channelName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{ch.channelId}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
