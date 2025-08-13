import os
import httpx
from typing import Annotated
from pydantic import Field
from fastmcp import FastMCP
from fastmcp.auth import SimpleBearerAuthProvider
from fastmcp.types import RichToolDescription

# ========= CONFIG =========
TOKEN = os.environ.get("AUTH_TOKEN", "your-secure-token-here")  
MY_NUMBER = os.environ.get("MY_NUMBER", "+91XXXXXXXXXX")  

# ========= INIT MCP SERVER =========
mcp = FastMCP(
    "HealthGennie MCP Server",
    auth=SimpleBearerAuthProvider(TOKEN),
)

# ========= TOOLS =========

HealthTipsDescription = RichToolDescription(
    description="Provides AI-powered health tips, diet suggestions, and basic wellness advice.",
    use_when="Use this tool when a user asks about health, diet, fitness, or general wellness."
)

@mcp.tool(description=HealthTipsDescription.model_dump_json())
async def get_health_tips(
    topic: Annotated[str, Field(description="The health topic or condition the user wants advice about")],
) -> str:
    """
    Fetches health tips from your Render-hosted HealthGennie API.
    """
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://healthgenniebyansh-pandey.onrender.com/tips?topic={topic}",
                timeout=30
            )
        if resp.status_code != 200:
            return f"❌ Failed to fetch tips. Status: {resp.status_code}"
        return resp.text
    except Exception as e:
        return f"⚠️ Error: {str(e)}"


DietPlanDescription = RichToolDescription(
    description="Generates a custom diet plan for the user based on health goals.",
    use_when="Use this tool when a user asks for a diet plan."
)

@mcp.tool(description=DietPlanDescription.model_dump_json())
async def get_diet_plan(
    goal: Annotated[str, Field(description="The health goal, e.g., weight loss, muscle gain, diabetes control")],
) -> str:
    """
    Fetches diet plan from your Render-hosted HealthGennie API.
    """
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://healthgenniebyansh-pandey.onrender.com/diet?goal={goal}",
                timeout=30
            )
        if resp.status_code != 200:
            return f"❌ Failed to fetch diet plan. Status: {resp.status_code}"
        return resp.text
    except Exception as e:
        return f"⚠️ Error: {str(e)}"


@mcp.tool
async def about() -> dict:
    """
    Returns basic info about the HealthGennie MCP server.
    """
    return {
        "name": "HealthGennie MCP",
        "description": "Your AI-powered health assistant that gives personalized tips, diet plans, and wellness advice."
    }

# ========= RUN =========
if __name__ == "__main__":
    mcp.run()
