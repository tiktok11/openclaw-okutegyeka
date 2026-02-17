export const builtinRecipes = [
  {
    id: "discord-channel-persona",
    name: "Discord channel persona",
    description: "Inject different system prompt for one Discord channel",
    version: "1.0.0",
    tags: ["discord", "persona", "beginner"],
    difficulty: "easy",
    params: [
      {
        id: "guild_id",
        label: "Guild",
        type: "discord_guild",
        required: true,
      },
      {
        id: "channel_id",
        label: "Channel",
        type: "discord_channel",
        required: true,
      },
      {
        id: "persona",
        label: "Persona description",
        type: "textarea",
        required: true,
        minLength: 1,
        placeholder: "You are...",
      },
    ],
    patchTemplate: `{
      "channels": {
        "discord": {
          "guilds": {
            "{{guild_id}}": {
              "channels": {
                "{{channel_id}}": {
                  "systemPrompt": "{{persona}}"
                }
              }
            }
          }
        }
      }
    }`,
    impactCategory: "low",
    impactSummary: "Add/modify channel persona",
  },
];
