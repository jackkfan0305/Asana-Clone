"""Test dashboard & widget tools."""

import pytest
from datetime import date, timedelta


@pytest.fixture
def setup_dashboard(db_session):
    from models import Organization, User, Team, Project, Section, Task

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah", email="s@a.com", role="standard", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Project", team_id="team_001", owner_id="usr_001"))
    db_session.add(Section(id="sec_001", name="Todo", project_id="prj_001", position=0))

    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    # Incomplete task due today
    db_session.add(Task(id="tsk_001", title="Due today", project_id="prj_001", section_id="sec_001",
                        position=0, assignee_id="usr_001", due_date=today, created_by="usr_001"))
    # Overdue task
    db_session.add(Task(id="tsk_002", title="Overdue", project_id="prj_001", section_id="sec_001",
                        position=1, assignee_id="usr_001", due_date=yesterday, created_by="usr_001"))
    # Completed task
    db_session.add(Task(id="tsk_003", title="Done", project_id="prj_001", section_id="sec_001",
                        position=2, assignee_id="usr_001", completed=True, created_by="usr_001"))
    # Future task
    db_session.add(Task(id="tsk_004", title="Future", project_id="prj_001", section_id="sec_001",
                        position=3, assignee_id="usr_001", due_date=tomorrow, created_by="usr_001"))
    # Other user's task
    db_session.add(Task(id="tsk_005", title="Sarah's task", project_id="prj_001", section_id="sec_001",
                        position=4, assignee_id="usr_002", due_date=yesterday, created_by="usr_001"))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


class TestGetDashboardData:
    def test_dashboard_data(self, client, setup_dashboard):
        _login(client)
        obs = _call(client, "get_dashboard_data", {"user_id": "usr_001"})
        assert obs["is_error"] is False
        content = obs["structured_content"]
        assert "greeting" in content
        assert "Admin" in content["greeting"]
        assert "stats" in content
        assert "date" in content

    def test_dashboard_stats(self, client, setup_dashboard):
        _login(client)
        obs = _call(client, "get_dashboard_data", {"user_id": "usr_001"})
        stats = obs["structured_content"]["stats"]
        # usr_001 has: tsk_001 (due today, incomplete), tsk_002 (overdue, incomplete), tsk_004 (future, incomplete)
        assert stats["tasks_assigned"] == 3  # incomplete tasks
        assert stats["overdue"] == 1  # tsk_002
        assert stats["due_today"] == 1  # tsk_001
        assert stats["tasks_completed"] == 1  # tsk_003

    def test_dashboard_no_user(self, client, setup_dashboard):
        obs = _call(client, "get_dashboard_data", {})
        assert obs["is_error"] is True


class TestGetOverdueTasks:
    def test_get_overdue(self, client, setup_dashboard):
        _login(client)
        obs = _call(client, "get_overdue_tasks", {"user_id": "usr_001"})
        assert obs["is_error"] is False
        assert len(obs["structured_content"]["tasks"]) == 1
        assert obs["structured_content"]["tasks"][0]["id"] == "tsk_002"

    def test_overdue_other_user(self, client, setup_dashboard):
        _login(client)
        obs = _call(client, "get_overdue_tasks", {"user_id": "usr_002"})
        assert len(obs["structured_content"]["tasks"]) == 1
        assert obs["structured_content"]["tasks"][0]["id"] == "tsk_005"

    def test_overdue_by_project(self, client, setup_dashboard):
        _login(client)
        obs = _call(client, "get_overdue_tasks", {"user_id": "usr_001", "project_id": "prj_001"})
        assert len(obs["structured_content"]["tasks"]) == 1

    def test_overdue_empty(self, client, setup_dashboard, db_session):
        """User with no overdue tasks."""
        from models import User
        db_session.add(User(id="usr_003", username="clean", password_hash="pass", name="Clean", email="c@a.com", role="standard", organization_id="org_001"))
        db_session.commit()

        _login(client)
        obs = _call(client, "get_overdue_tasks", {"user_id": "usr_003"})
        assert len(obs["structured_content"]["tasks"]) == 0


class TestUpdateDashboardLayout:
    def test_update_layout(self, client, setup_dashboard):
        _login(client)
        obs = _call(client, "update_dashboard_layout", {
            "user_id": "usr_001",
            "widgets": [
                {"widget_type": "my_tasks", "position": 0},
                {"widget_type": "projects", "position": 1},
                {"widget_type": "recent", "position": 2},
            ],
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["widget_count"] == 3

    def test_update_layout_replaces_existing(self, client, setup_dashboard):
        _login(client)
        _call(client, "update_dashboard_layout", {
            "user_id": "usr_001",
            "widgets": [{"widget_type": "my_tasks"}],
        })
        obs = _call(client, "update_dashboard_layout", {
            "user_id": "usr_001",
            "widgets": [{"widget_type": "projects"}, {"widget_type": "notepad"}],
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["widget_count"] == 2

    def test_update_layout_empty(self, client, setup_dashboard):
        _login(client)
        obs = _call(client, "update_dashboard_layout", {
            "user_id": "usr_001",
            "widgets": [],
        })
        assert obs["structured_content"]["widget_count"] == 0


class TestGetRecentItems:
    def test_get_recent_items(self, client, setup_dashboard):
        _login(client)
        obs = _call(client, "get_recent_items", {"user_id": "usr_001"})
        assert obs["is_error"] is False
        assert "tasks" in obs["structured_content"]
        assert "projects" in obs["structured_content"]

    def test_recent_items_respects_limit(self, client, setup_dashboard):
        _login(client)
        obs = _call(client, "get_recent_items", {"user_id": "usr_001", "limit": 2})
        assert len(obs["structured_content"]["tasks"]) <= 2
