"""Test comments, tags, and search tools."""

import pytest


@pytest.fixture
def setup_task(db_session):
    from models import Organization, User, Team, Project, Section, Task
    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Eng", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Proj", team_id="team_001", owner_id="usr_001"))
    db_session.add(Section(id="sec_001", name="Todo", project_id="prj_001", position=0))
    db_session.add(Task(id="tsk_001", title="Test Task", project_id="prj_001", section_id="sec_001", position=0, created_by="usr_001"))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


def test_add_comment(client, setup_task):
    _login(client)
    obs = _call(client, "add_comment", {"task_id": "tsk_001", "body": "Hello world"})
    assert obs["is_error"] is False
    assert "cmt_" in obs["structured_content"]["id"]


def test_edit_comment(client, setup_task):
    _login(client)
    create = _call(client, "add_comment", {"task_id": "tsk_001", "body": "Original"})
    cid = create["structured_content"]["id"]

    obs = _call(client, "edit_comment", {"comment_id": cid, "body": "Edited"})
    assert obs["is_error"] is False
    assert obs["structured_content"]["body"] == "Edited"


def test_like_comment_toggle(client, setup_task):
    _login(client)
    create = _call(client, "add_comment", {"task_id": "tsk_001", "body": "Like me"})
    cid = create["structured_content"]["id"]

    # Like
    obs = _call(client, "like_comment", {"comment_id": cid})
    assert obs["structured_content"]["liked"] is True

    # Unlike
    obs = _call(client, "like_comment", {"comment_id": cid})
    assert obs["structured_content"]["liked"] is False


def test_create_tag(client, setup_task):
    _login(client)
    obs = _call(client, "create_tag", {"name": "Bug", "color": "#ff0000"})
    assert obs["is_error"] is False
    assert "tag_" in obs["structured_content"]["id"]


def test_tag_task(client, setup_task):
    _login(client)
    tag = _call(client, "create_tag", {"name": "Feature", "color": "#00ff00"})
    tag_id = tag["structured_content"]["id"]

    obs = _call(client, "add_tag_to_task", {"task_id": "tsk_001", "tag_id": tag_id})
    assert obs["is_error"] is False

    # Check task detail has tag
    detail = _call(client, "get_task_detail", {"task_id": "tsk_001"})
    assert any(t["id"] == tag_id for t in detail["structured_content"]["tags"])


def test_search_tasks(client, setup_task):
    obs = _call(client, "search_tasks", {"query": "Test"})
    assert obs["is_error"] is False
    assert obs["structured_content"]["total"] >= 1


def test_search_all(client, setup_task):
    obs = _call(client, "search_all", {"query": "Test"})
    assert obs["is_error"] is False
    assert len(obs["structured_content"]["tasks"]) >= 1


def test_activity_log(client, setup_task):
    _login(client)
    _call(client, "add_comment", {"task_id": "tsk_001", "body": "Activity test"})

    obs = _call(client, "get_activity_log", {"task_id": "tsk_001"})
    assert obs["is_error"] is False
    assert obs["structured_content"]["total"] >= 1
