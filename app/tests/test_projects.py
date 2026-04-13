"""Test project and section tools."""

import pytest


@pytest.fixture
def setup_base(db_session):
    from models import Organization, User, Team
    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


def test_create_project(client, setup_base):
    _login(client)
    obs = _call(client, "create_project", {"name": "New Project", "team_id": "team_001", "color": "#ff0000"})
    assert obs["is_error"] is False
    assert "prj_" in obs["structured_content"]["id"]
    assert obs["structured_content"]["name"] == "New Project"


def test_get_project_list(client, setup_base):
    _login(client)
    _call(client, "create_project", {"name": "P1"})
    _call(client, "create_project", {"name": "P2"})

    obs = _call(client, "get_project_list", {})
    assert obs["is_error"] is False
    assert obs["structured_content"]["total"] >= 2


def test_update_project(client, setup_base):
    _login(client)
    create = _call(client, "create_project", {"name": "Old Name"})
    pid = create["structured_content"]["id"]

    obs = _call(client, "update_project", {"project_id": pid, "name": "New Name", "status": "at_risk"})
    assert obs["is_error"] is False
    assert obs["structured_content"]["name"] == "New Name"
    assert obs["structured_content"]["status"] == "at_risk"


def test_delete_project(client, setup_base):
    _login(client)
    create = _call(client, "create_project", {"name": "Delete Me"})
    pid = create["structured_content"]["id"]

    obs = _call(client, "delete_project", {"project_id": pid})
    assert obs["is_error"] is False

    obs2 = _call(client, "get_project", {"project_id": pid})
    assert obs2["is_error"] is True


def test_create_section(client, setup_base):
    _login(client)
    proj = _call(client, "create_project", {"name": "Proj"})
    pid = proj["structured_content"]["id"]

    obs = _call(client, "create_section", {"name": "To Do", "project_id": pid})
    assert obs["is_error"] is False
    assert "sec_" in obs["structured_content"]["id"]


def test_board_view(client, setup_base):
    _login(client)
    proj = _call(client, "create_project", {"name": "Board Proj"})
    pid = proj["structured_content"]["id"]

    _call(client, "create_section", {"name": "Todo", "project_id": pid})
    _call(client, "create_section", {"name": "Done", "project_id": pid})

    obs = _call(client, "get_board_view", {"project_id": pid})
    assert obs["is_error"] is False
    assert len(obs["structured_content"]["columns"]) == 2


def test_project_members(client, setup_base, db_session):
    from models import User
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah", email="s@a.com", role="standard", organization_id="org_001"))
    db_session.commit()

    _login(client)
    proj = _call(client, "create_project", {"name": "Member Proj"})
    pid = proj["structured_content"]["id"]

    _call(client, "add_project_member", {"project_id": pid, "user_id": "usr_002", "role": "editor"})
    obs = _call(client, "get_project_members", {"project_id": pid})
    assert obs["is_error"] is False
    assert len(obs["structured_content"]["members"]) >= 1
