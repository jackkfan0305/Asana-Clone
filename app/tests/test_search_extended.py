"""Test search tools (extended coverage)."""

import pytest


@pytest.fixture
def setup_search(db_session):
    from models import Organization, User, Team, Project, Section, Task, Tag, TaskTag

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin User", email="admin@acme.com", role="admin", organization_id="org_001"))
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah Chen", email="sarah@acme.com", role="standard", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Website Redesign", team_id="team_001", owner_id="usr_001"))
    db_session.add(Project(id="prj_002", name="Mobile App", team_id="team_001", owner_id="usr_001", archived=True))
    db_session.add(Section(id="sec_001", name="Todo", project_id="prj_001", position=0))
    db_session.add(Tag(id="tag_001", name="Bug", color="#ff0000"))
    db_session.add(Tag(id="tag_002", name="Feature", color="#00ff00"))

    from datetime import date
    db_session.add(Task(id="tsk_001", title="Fix login bug", description="Users cannot log in", project_id="prj_001",
                        section_id="sec_001", position=0, assignee_id="usr_001", priority="high",
                        due_date=date(2026, 3, 1), created_by="usr_001"))
    db_session.add(Task(id="tsk_002", title="Add signup page", description="New user registration",
                        project_id="prj_001", section_id="sec_001", position=1, assignee_id="usr_002",
                        priority="medium", due_date=date(2026, 4, 15), created_by="usr_001"))
    db_session.add(Task(id="tsk_003", title="Completed feature", project_id="prj_001", section_id="sec_001",
                        position=2, completed=True, created_by="usr_001"))
    db_session.add(TaskTag(task_id="tsk_001", tag_id="tag_001"))
    db_session.add(TaskTag(task_id="tsk_002", tag_id="tag_002"))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


class TestSearchTasks:
    def test_search_by_title(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "login"})
        assert obs["structured_content"]["total"] == 1
        assert obs["structured_content"]["tasks"][0]["title"] == "Fix login bug"

    def test_search_by_description(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "registration"})
        assert obs["structured_content"]["total"] == 1

    def test_search_case_insensitive(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "LOGIN"})
        assert obs["structured_content"]["total"] == 1

    def test_filter_by_assignee(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "", "assignee_id": "usr_002"})
        assert obs["structured_content"]["total"] == 1
        assert obs["structured_content"]["tasks"][0]["assignee_id"] == "usr_002"

    def test_filter_by_project(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "", "project_id": "prj_001"})
        assert obs["structured_content"]["total"] == 3

    def test_filter_completed(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "", "completed": True})
        assert all(t["completed"] for t in obs["structured_content"]["tasks"])

    def test_filter_incomplete(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "", "completed": False})
        assert all(not t["completed"] for t in obs["structured_content"]["tasks"])

    def test_filter_by_priority(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "", "priority": "high"})
        assert obs["structured_content"]["total"] == 1
        assert obs["structured_content"]["tasks"][0]["priority"] == "high"

    def test_filter_by_due_before(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "", "due_before": "2026-03-31"})
        assert obs["structured_content"]["total"] == 1

    def test_filter_by_due_after(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "", "due_after": "2026-04-01"})
        assert obs["structured_content"]["total"] == 1

    def test_filter_by_tags(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "", "tags": ["tag_001"]})
        assert obs["structured_content"]["total"] == 1
        assert obs["structured_content"]["tasks"][0]["id"] == "tsk_001"

    def test_combined_filters(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "Fix", "priority": "high", "assignee_id": "usr_001"})
        assert obs["structured_content"]["total"] == 1

    def test_no_results(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": "zzzznonexistent"})
        assert obs["structured_content"]["total"] == 0

    def test_empty_query_returns_all(self, client, setup_search):
        obs = _call(client, "search_tasks", {"query": ""})
        assert obs["structured_content"]["total"] == 3


class TestSearchProjects:
    def test_search_projects(self, client, setup_search):
        obs = _call(client, "search_projects", {"query": "Website"})
        assert len(obs["structured_content"]["projects"]) == 1

    def test_search_projects_archived_filter(self, client, setup_search):
        obs = _call(client, "search_projects", {"query": "", "archived": True})
        assert all(p["archived"] for p in obs["structured_content"]["projects"])

    def test_search_projects_not_archived(self, client, setup_search):
        obs = _call(client, "search_projects", {"query": "", "archived": False})
        assert all(not p["archived"] for p in obs["structured_content"]["projects"])


class TestSearchAll:
    def test_search_all_finds_tasks(self, client, setup_search):
        obs = _call(client, "search_all", {"query": "login"})
        assert len(obs["structured_content"]["tasks"]) >= 1

    def test_search_all_finds_projects(self, client, setup_search):
        obs = _call(client, "search_all", {"query": "Website"})
        assert len(obs["structured_content"]["projects"]) >= 1

    def test_search_all_finds_users(self, client, setup_search):
        obs = _call(client, "search_all", {"query": "Sarah"})
        assert len(obs["structured_content"]["users"]) >= 1

    def test_search_all_by_email(self, client, setup_search):
        obs = _call(client, "search_all", {"query": "admin@acme"})
        assert len(obs["structured_content"]["users"]) >= 1


class TestSaveSearchView:
    def test_save_search(self, client, setup_search):
        _login(client)
        obs = _call(client, "save_search_view", {
            "name": "My Bugs",
            "filters_json": {"tags": ["tag_001"], "completed": False},
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["name"] == "My Bugs"
        assert "ss_" in obs["structured_content"]["id"]
