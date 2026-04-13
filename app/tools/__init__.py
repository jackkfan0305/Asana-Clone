"""Tool registry and dispatcher. Aggregates all 83 tools from 17 modules."""

from tools import (
    bulk,
    calendar,
    comments,
    custom_fields,
    dashboard,
    followers,
    notifications,
    project_members,
    project_status,
    projects,
    search,
    sections,
    subtasks,
    tags,
    tasks,
    teams,
    users,
)

# Collect all tools from all modules
ALL_MODULES = [
    users,
    tasks,
    projects,
    project_members,
    sections,
    subtasks,
    comments,
    custom_fields,
    tags,
    notifications,
    search,
    dashboard,
    project_status,
    teams,
    followers,
    bulk,
    calendar,
]

# Build tool registry: name -> {description, input_schema, mutates_state, handler}
TOOL_REGISTRY: dict = {}
TOOLS_LIST: list[dict] = []

for module in ALL_MODULES:
    for tool in module.TOOLS:
        name = tool["name"]
        TOOL_REGISTRY[name] = tool
        TOOLS_LIST.append({
            "name": name,
            "description": tool["description"],
            "input_schema": tool["input_schema"],
            "mutates_state": tool["mutates_state"],
        })


def get_tools() -> list[dict]:
    """Return the public tool list (without handlers) for GET /tools."""
    return TOOLS_LIST


def dispatch(tool_name: str, db, parameters: dict, current_user=None) -> dict:
    """Dispatch a tool call to the appropriate handler."""
    tool = TOOL_REGISTRY.get(tool_name)
    if not tool:
        return {
            "is_error": True,
            "text": f"Unknown tool: {tool_name}",
            "structured_content": None,
        }

    handler = tool["handler"]
    # Build the Args object from parameters
    # The handler signature is: handler(db, args, current_user)
    # We need to find the correct Args class from the module
    import inspect

    sig = inspect.signature(handler)
    params = list(sig.parameters.values())
    # params[1] is the args parameter
    args_type = params[1].annotation
    if args_type is inspect.Parameter.empty:
        # Fallback: try calling with raw dict
        args = parameters
    else:
        args = args_type(**parameters)

    return handler(db, args, current_user)
