"""Test tags tools (extended coverage beyond test_comments_tags.py)."""

import pytest


@pytest.fixture
def setup_data(db_session):
    from models import Organization, User, Team, Project, Section, Task, Tag

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Project", team_id="team_001", owner_id="usr_001"))
    db_session.add(Section(id="sec_001", name="Todo", project_id="prj_001", position=0))
    db_session.add(Task(id="tsk_001", title="Bug fix", project_id="prj_001", section_id="sec_001", position=0, created_by="usr_001"))
    db_session.add(Task(id="tsk_002", title="Feature work", project_id="prj_001", section_id="sec_001", position=1, created_by="usr_001"))
    db_session.add(Task(id="tsk_003", title="Completed task", project_id="prj_001", section_id="sec_001", position=2, completed=True, created_by="usr_001"))
    db_session.add(Tag(id="tag_001", name="Bug", color="#ff0000"))
    db_session.add(Tag(id="tag_002", name="Feature", color="#00ff00"))
    db_session.add(Tag(id="tag_003", name="Documentation", color="#0000ff"))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


class TestGetTags:
    def test_get_all_tags(self, client, setup_data):
        obs = _call(client, "get_tags", {})
        assert obs["is_error"] is False
        assert len(obs["structured_content"]["tags"]) == 3

    def test_search_tags(self, client, setup_data):
        obs = _call(client, "get_tags", {"search": "Bug"})
        assert len(obs["structured_content"]["tags"]) == 1
        assert obs["structured_content"]["tags"][0]["name"] == "Bug"

    def test_search_tags_case_insensitive(self, client, setup_data):
        obs = _call(client, "get_tags", {"search": "bug"})
        assert len(obs["structured_content"]["tags"]) == 1

    def test_search_tags_no_match(self, client, setup_data):
        obs = _call(client, "get_tags", {"search": "nonexistent"})
        assert len(obs["structured_content"]["tags"]) == 0


class TestRemoveTagFromTask:
    def test_remove_tag(self, client, setup_data):
        _login(client)
        _call(client, "add_tag_to_task", {"task_id": "tsk_001", "tag_id": "tag_001"})
        obs = _call(client, "remove_tag_from_task", {"task_id": "tsk_001", "tag_id": "tag_001"})
        assert obs["is_error"] is False

    def test_remove_tag_not_on_task(self, client, setup_data):
        _login(client)
        obs = _call(client, "remove_tag_from_task", {"task_id": "tsk_001", "tag_id": "tag_001"})
        assert obs["is_error"] is True

    def test_add_tag_idempotent(self, client, setup_data):
        _login(client)
        _call(client, "add_tag_to_task", {"task_id": "tsk_001", "tag_id": "tag_001"})
        obs = _call(client, "add_tag_to_task", {"task_id": "tsk_001", "tag_id": "tag_001"})
        assert obs["is_error"] is False
        assert "already" in obs["text"].lower()


class TestFilterTasksByTag:
    def test_filter_by_tag(self, client, setup_data):
        _login(client)
        _call(client, "add_tag_to_task", {"task_id": "tsk_001", "tag_id": "tag_001"})
        _call(client, "add_tag_to_task", {"task_id": "tsk_002", "tag_id": "tag_001"})

        obs = _call(client, "filter_tasks_by_tag", {"tag_id": "tag_001"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["total"] == 2

    def test_filter_by_tag_with_project(self, client, setup_data):
        _login(client)
        _call(client, "add_tag_to_task", {"task_id": "tsk_001", "tag_id": "tag_001"})

        obs = _call(client, "filter_tasks_by_tag", {"tag_id": "tag_001", "project_id": "prj_001"})
        assert obs["structured_content"]["total"] == 1

    def test_filter_by_tag_incomplete_only(self, client, setup_data):
        _login(client)
        _call(client, "add_tag_to_task", {"task_id": "tsk_001", "tag_id": "tag_002"})
        _call(client, "add_tag_to_task", {"task_id": "tsk_003", "tag_id": "tag_002"})  # completed task

        obs = _call(client, "filter_tasks_by_tag", {"tag_id": "tag_002", "completed": False})
        assert obs["structured_content"]["total"] == 1

    def test_filter_by_tag_no_results(self, client, setup_data):
        obs = _call(client, "filter_tasks_by_tag", {"tag_id": "tag_003"})
        assert obs["structured_content"]["total"] == 0

    def test_multiple_tags_on_task(self, client, setup_data):
        _login(client)
        _call(client, "add_tag_to_task", {"task_id": "tsk_001", "tag_id": "tag_001"})
        _call(client, "add_tag_to_task", {"task_id": "tsk_001", "tag_id": "tag_002"})

        detail = _call(client, "get_task_detail", {"task_id": "tsk_001"})
        assert len(detail["structured_content"]["tags"]) == 2
