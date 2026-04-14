"""Test project status & charts tools."""

import pytest
from datetime import date


@pytest.fixture
def setup_project(db_session):
    from models import Organization, User, Team, Project, Section, Task

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah", email="s@a.com", role="standard", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Website Redesign", team_id="team_001", owner_id="usr_001", status="on_track"))
    db_session.add(Section(id="sec_001", name="Todo", project_id="prj_001", position=0))
    db_session.add(Section(id="sec_002", name="In Progress", project_id="prj_001", position=1))
    db_session.add(Section(id="sec_003", name="Done", project_id="prj_001", position=2))

    yesterday = date.today() - __import__("datetime").timedelta(days=1)

    # 3 tasks in Todo
    db_session.add(Task(id="tsk_001", title="Task 1", project_id="prj_001", section_id="sec_001", position=0,
                        assignee_id="usr_001", created_by="usr_001"))
    db_session.add(Task(id="tsk_002", title="Task 2", project_id="prj_001", section_id="sec_001", position=1,
                        assignee_id="usr_002", due_date=yesterday, created_by="usr_001"))  # overdue
    # 1 task in progress
    db_session.add(Task(id="tsk_003", title="Task 3", project_id="prj_001", section_id="sec_002", position=0,
                        assignee_id="usr_001", created_by="usr_001"))
    # 2 completed tasks in Done
    db_session.add(Task(id="tsk_004", title="Task 4", project_id="prj_001", section_id="sec_003", position=0,
                        completed=True, assignee_id="usr_001", created_by="usr_001"))
    db_session.add(Task(id="tsk_005", title="Task 5", project_id="prj_001", section_id="sec_003", position=1,
                        completed=True, assignee_id="usr_002", created_by="usr_001"))
    # Subtask (should be excluded from top-level counts)
    db_session.add(Task(id="tsk_006", title="Subtask", project_id="prj_001", section_id="sec_001", position=0,
                        parent_task_id="tsk_001", created_by="usr_001"))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


class TestGetProjectStats:
    def test_project_stats(self, client, setup_project):
        _login(client)
        obs = _call(client, "get_project_stats", {"project_id": "prj_001"})
        assert obs["is_error"] is False
        stats = obs["structured_content"]
        assert stats["total_tasks"] == 5  # excludes subtask
        assert stats["completed_tasks"] == 2
        assert stats["incomplete_tasks"] == 3
        assert stats["overdue_tasks"] == 1

    def test_completion_rate(self, client, setup_project):
        _login(client)
        obs = _call(client, "get_project_stats", {"project_id": "prj_001"})
        stats = obs["structured_content"]
        assert stats["completion_rate"] == 40.0  # 2/5 * 100

    def test_by_section(self, client, setup_project):
        _login(client)
        obs = _call(client, "get_project_stats", {"project_id": "prj_001"})
        by_section = obs["structured_content"]["by_section"]
        assert len(by_section) == 3
        todo = next(s for s in by_section if s["section_name"] == "Todo")
        assert todo["task_count"] == 2  # tsk_001, tsk_002 (subtask excluded)

    def test_by_assignee(self, client, setup_project):
        _login(client)
        obs = _call(client, "get_project_stats", {"project_id": "prj_001"})
        by_assignee = obs["structured_content"]["by_assignee"]
        assert len(by_assignee) == 2

    def test_project_not_found(self, client, setup_project):
        _login(client)
        obs = _call(client, "get_project_stats", {"project_id": "prj_nonexistent"})
        assert obs["is_error"] is True


class TestSetProjectStatus:
    def test_set_status(self, client, setup_project):
        _login(client)
        obs = _call(client, "set_project_status", {"project_id": "prj_001", "status": "at_risk"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["status"] == "at_risk"

    def test_set_status_off_track(self, client, setup_project):
        _login(client)
        obs = _call(client, "set_project_status", {"project_id": "prj_001", "status": "off_track"})
        assert obs["structured_content"]["status"] == "off_track"

    def test_set_status_project_not_found(self, client, setup_project):
        _login(client)
        obs = _call(client, "set_project_status", {"project_id": "prj_nonexistent", "status": "on_track"})
        assert obs["is_error"] is True


class TestPostStatusUpdate:
    def test_post_update(self, client, setup_project):
        _login(client)
        obs = _call(client, "post_status_update", {
            "project_id": "prj_001",
            "status": "at_risk",
            "text": "We are behind schedule due to API delays.",
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["status"] == "at_risk"
        assert "psu_" in obs["structured_content"]["id"]

    def test_post_update_changes_project_status(self, client, setup_project):
        _login(client)
        _call(client, "post_status_update", {"project_id": "prj_001", "status": "off_track", "text": "Blocked"})

        # Verify project status changed
        project = _call(client, "get_project", {"project_id": "prj_001"})
        assert project["structured_content"]["status"] == "off_track"

    def test_post_update_not_found(self, client, setup_project):
        _login(client)
        obs = _call(client, "post_status_update", {"project_id": "prj_nonexistent", "status": "on_track", "text": "N/A"})
        assert obs["is_error"] is True


class TestGetCompletionChartData:
    def test_chart_data_week(self, client, setup_project):
        _login(client)
        obs = _call(client, "get_completion_chart_data", {"project_id": "prj_001", "period": "week"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["period"] == "week"
        assert len(obs["structured_content"]["data"]) == 7

    def test_chart_data_month(self, client, setup_project):
        _login(client)
        obs = _call(client, "get_completion_chart_data", {"project_id": "prj_001", "period": "month"})
        assert len(obs["structured_content"]["data"]) == 30

    def test_chart_data_quarter(self, client, setup_project):
        _login(client)
        obs = _call(client, "get_completion_chart_data", {"project_id": "prj_001", "period": "quarter"})
        assert len(obs["structured_content"]["data"]) == 90

    def test_chart_data_has_dates(self, client, setup_project):
        _login(client)
        obs = _call(client, "get_completion_chart_data", {"project_id": "prj_001", "period": "week"})
        for point in obs["structured_content"]["data"]:
            assert "date" in point
            assert "completed" in point
            assert "total" in point
