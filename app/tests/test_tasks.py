"""Test task CRUD tools."""

import pytest


@pytest.fixture
def setup_project(db_session):
    """Create org, user, team, project, section for task tests."""
    from models import Organization, User, Team, Project, Section

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah", email="s@a.com", role="standard", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Website Redesign", team_id="team_001", owner_id="usr_001"))
    db_session.add(Section(id="sec_001", name="To do", project_id="prj_001", position=0))
    db_session.add(Section(id="sec_002", name="In progress", project_id="prj_001", position=1))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def test_create_task(client, setup_project):
    # Login first
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    token = login.json()["token"]
    client.headers["Authorization"] = f"Bearer {token}"

    obs = _call(client, "create_task", {
        "title": "Design homepage",
        "project_id": "prj_001",
        "section_id": "sec_001",
        "assignee_id": "usr_002",
        "priority": "high",
    })
    assert obs["is_error"] is False
    assert "tsk_" in obs["structured_content"]["id"]
    assert obs["structured_content"]["title"] == "Design homepage"
    assert obs["structured_content"]["assignee_id"] == "usr_002"


def test_get_task(client, setup_project):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"

    # Create then get
    create = _call(client, "create_task", {"title": "Test task", "project_id": "prj_001"})
    task_id = create["structured_content"]["id"]

    obs = _call(client, "get_task", {"task_id": task_id})
    assert obs["is_error"] is False
    assert obs["structured_content"]["title"] == "Test task"


def test_update_task(client, setup_project):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"

    create = _call(client, "create_task", {"title": "Original", "project_id": "prj_001"})
    task_id = create["structured_content"]["id"]

    obs = _call(client, "update_task", {"task_id": task_id, "title": "Updated", "priority": "medium"})
    assert obs["is_error"] is False
    assert obs["structured_content"]["title"] == "Updated"
    assert obs["structured_content"]["priority"] == "medium"


def test_complete_task(client, setup_project):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"

    create = _call(client, "create_task", {"title": "Complete me", "project_id": "prj_001"})
    task_id = create["structured_content"]["id"]

    obs = _call(client, "complete_task", {"task_id": task_id, "completed": True})
    assert obs["is_error"] is False
    assert obs["structured_content"]["completed"] is True
    assert obs["structured_content"]["completed_at"] is not None


def test_delete_task(client, setup_project):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"

    create = _call(client, "create_task", {"title": "Delete me", "project_id": "prj_001"})
    task_id = create["structured_content"]["id"]

    obs = _call(client, "delete_task", {"task_id": task_id})
    assert obs["is_error"] is False

    # Should be gone
    obs2 = _call(client, "get_task", {"task_id": task_id})
    assert obs2["is_error"] is True


def test_get_task_not_found(client, setup_project):
    obs = _call(client, "get_task", {"task_id": "tsk_nonexistent"})
    assert obs["is_error"] is True
    assert "not found" in obs["text"].lower()


def test_duplicate_task(client, setup_project):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"

    create = _call(client, "create_task", {"title": "Original task", "project_id": "prj_001", "section_id": "sec_001"})
    task_id = create["structured_content"]["id"]

    obs = _call(client, "duplicate_task", {"task_id": task_id})
    assert obs["is_error"] is False
    assert "(copy)" in obs["structured_content"]["title"]
    assert obs["structured_content"]["id"] != task_id


def test_get_my_tasks(client, setup_project):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"

    _call(client, "create_task", {"title": "My task 1", "assignee_id": "usr_001", "project_id": "prj_001"})
    _call(client, "create_task", {"title": "My task 2", "assignee_id": "usr_001", "project_id": "prj_001"})
    _call(client, "create_task", {"title": "Not mine", "assignee_id": "usr_002", "project_id": "prj_001"})

    obs = _call(client, "get_my_tasks", {"user_id": "usr_001"})
    assert obs["is_error"] is False
    assert obs["structured_content"]["total"] == 2


def test_move_task_to_section(client, setup_project):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"

    create = _call(client, "create_task", {"title": "Move me", "project_id": "prj_001", "section_id": "sec_001"})
    task_id = create["structured_content"]["id"]

    obs = _call(client, "move_task_to_section", {"task_id": task_id, "section_id": "sec_002"})
    assert obs["is_error"] is False

    task = _call(client, "get_task", {"task_id": task_id})
    assert task["structured_content"]["section_id"] == "sec_002"
