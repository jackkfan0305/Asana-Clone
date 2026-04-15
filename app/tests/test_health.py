"""Test health, tools, and basic server endpoints."""


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "healthy"}


def test_tools_endpoint(client):
    resp = client.get("/tools")
    assert resp.status_code == 200
    data = resp.json()
    assert "tools" in data
    tools = data["tools"]
    assert len(tools) == 84

    # Check structure
    tool = tools[0]
    assert "name" in tool
    assert "description" in tool
    assert "input_schema" in tool
    assert "mutates_state" in tool


def test_tools_have_unique_names(client):
    resp = client.get("/tools")
    tools = resp.json()["tools"]
    names = [t["name"] for t in tools]
    assert len(names) == len(set(names)), f"Duplicate tool names: {[n for n in names if names.count(n) > 1]}"


def test_unknown_tool_returns_error(client):
    resp = client.post("/step", json={"action": {"tool_name": "nonexistent_tool", "parameters": {}}})
    assert resp.status_code == 200
    data = resp.json()
    assert data["observation"]["is_error"] is True
    assert "Unknown tool" in data["observation"]["text"]


def test_step_response_format(client):
    resp = client.post("/step", json={"action": {"tool_name": "get_tags", "parameters": {}}})
    assert resp.status_code == 200
    data = resp.json()
    assert "observation" in data
    assert "reward" in data
    assert "done" in data
    assert "is_error" in data["observation"]
    assert "text" in data["observation"]
    assert "structured_content" in data["observation"]
