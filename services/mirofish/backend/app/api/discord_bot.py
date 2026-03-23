import os
import nextcord
from nextcord.ext import commands
from nextcord import Interaction, SlashOption
import json
import requests
from ..services.budget_guards import BudgetGuard
from ..utils.supabase_client import get_admin_client

# Load environment variables
DISCORD_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
GUILD_ID = int(os.getenv("DISCORD_GUILD_ID", 0))

# Department to Channel Mapping (IDs should be set in .env)
DEPARTMENTS = {
    "Commercial & Growth": int(os.getenv("DISCORD_CH_COMMERCIAL", 0)),
    "Design & Identity": int(os.getenv("DISCORD_CH_DESIGN", 0)),
    "Development & Engineering": int(os.getenv("DISCORD_CH_DEV", 0)),
    "Content & Strategy": int(os.getenv("DISCORD_CH_CONTENT", 0)),
    "Research & Intelligence": int(os.getenv("DISCORD_CH_RESEARCH", 0)),
    "Client Success": int(os.getenv("DISCORD_CH_SUPPORT", 0)),
    "Operations": int(os.getenv("DISCORD_CH_OPS", 0)),
    "Security & Compliance": int(os.getenv("DISCORD_CH_SECURITY", 0)),
    "Parallel Society": int(os.getenv("DISCORD_CH_SOCIETY", 0)),
}

class ParallelSocietyBot(commands.Bot):
    def __init__(self):
        intents = nextcord.Intents.default()
        intents.message_content = True
        super().__init__(intents=intents)
        self.budget_guard = BudgetGuard()
        self.supabase = get_admin_client()

    async def on_ready(self):
        print(f"Logged in as {self.user} (ID: {self.user.id})")
        print("MiroFish Discord Bridge Active.")

bot = ParallelSocietyBot()

@bot.slash_command(name="simulate", description="Trigger a deep simulation in a specific department", guild_ids=[GUILD_ID])
async def simulate(
    interaction: Interaction,
    goal: str = SlashOption(description="The simulation goal"),
    department: str = SlashOption(
        description="Target department",
        choices=list(DEPARTMENTS.keys())
    )
):
    await interaction.response.defer()

    # 1. Budget Check
    if not bot.budget_guard.can_use_gemini():
        await interaction.followup.send("⚠️ Daily simulation budget exhausted. Please try again tomorrow.")
        return

    # 2. Trigger MiroFish Simulation via Bridge
    # In production, this calls the internal agency/start API
    try:
        # Mocking the discovery/start process
        # We assume the Python backend is running and reachable
        API_BASE = "http://localhost:5001" 
        response = requests.post(f"{API_BASE}/api/agency/start", json={"goal": goal})
        project_data = response.json()
        project_id = project_data.get("project_id")

        # 3. Create Discord Thread
        channel_id = DEPARTMENTS.get(department)
        channel = bot.get_channel(channel_id)
        
        if not channel or not isinstance(channel, nextcord.TextChannel):
            await interaction.followup.send(f"❌ Channel for {department} not found or invalid.")
            return

        thread = await channel.create_thread(
            name=f"Sim: {goal[:50]}...",
            auto_archive_duration=1440,
            reason=f"Parallel Society Simulation {project_id}"
        )

        # 4. Map Thread in Supabase
        bot.supabase.table("discord_threads").insert({
            "project_id": project_id,
            "channel_id": str(channel_id),
            "thread_id": str(thread.id),
            "thread_type": "simulation_discussion"
        }).execute()

        # 5. Initial Embed
        embed = nextcord.Embed(
            title="Parallel Society Simulation Initiated",
            description=f"**Goal:** {goal}\n**Department:** {department}\n**Project ID:** `{project_id}`",
            color=nextcord.Color.blue()
        )
        embed.set_footer(text="Ardeno OS x MiroFish Native Integration")
        
        await thread.send(embed=embed)
        await interaction.followup.send(f"✅ Simulation started in <#{thread.id}>")

    except Exception as e:
        await interaction.followup.send(f"❌ Error starting simulation: {str(e)}")

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return

    # Handle commands/mentions to the Parallel Society Specialist (Agent #7)
    if bot.user.mentioned_in(message):
        # 1. Check if in a managed thread
        thread_data = bot.supabase.table("discord_threads").select("*").eq("thread_id", str(message.channel.id)).execute()
        
        if thread_data.data:
            project_id = thread_data.data[0]['project_id']
            # Forward to MiroFish backend
            # ... implementation of feedback loop ...
            await message.reply(f"Acknowledged. Routing to Parallel Society agents for Project `{project_id}`...")
        else:
            await message.reply("Please mention me within a simulation thread to interact with the Parallel Society.")

def run_bot():
    bot.run(DISCORD_TOKEN)

if __name__ == "__main__":
    run_bot()
