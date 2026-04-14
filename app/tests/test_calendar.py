"""Test calendar & dates tools."""

import pytest
from datetime import date


@pytest.fixture
def setup_calendar(db_session):
    from models import Organization, User, Team, Project, Section, Task

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah", email="s@a.com", role="standard", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Project", team_id="team_001", owner_id="usr_001"))
    db_session.add(Project(id="prj_002", name="Other Project", team_id="team_001", owner_id="usr_001"))
    db_session.add(Section(id="sec_001", name="Todo", project_id="prj_001", position=0))

    # Tasks with various due dates
    db_session.add(Task(id="tsk_001", title="Jan task", project_id="prj_001", section_id="sec_001", position=0,
                        due_date=date(2026, 1, 15), assignee_id="usr_001", created_by="usr_001"))
    db_session.add(Task(id="tsk_002", title="Feb task", project_id="prj_001", section_id="sec_001", position=1,
                        due_date=date(2026, 2, 10), assignee_id="usr_001", created_by="usr_001"))
    db_session.add(Task(id="tsk_003", title="Mar task", project_id="prj_001", section_id="sec_001", position=2,
                        due_date=date(2026, 3, 5), assignee_id="usr_002", created_by="usr_001"))
    db_session.add(Task(id="tsk_004", title="No date task", project_id="prj_001", section_id="sec_001", position=3,
                        created_by="usr_001"))
    # Subtask with due date (should be excluded from calendar)
    db_session.add(Task(id="tsk_005", title="Subtask", project_id="prj_001", section_id="sec_001", position=0,
                        due_date=date(2026, 1, 20), parent_task_id="tsk_001", created_by="usr_001"))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


class TestGetCalendarTasks:
    def test_get_tasks_in_range(self, client, setup_calendar):
        obs = _call(client, "get_calendar_tasks", {
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
        })
        assert obs["is_error"] is False
        tasks = obs["structured_content"]["tasks"]
        assert len(tasks) == 1  # Only tsk_001 (subtask excluded)
        assert tasks[0]["id"] == "tsk_001"

    def test_get_tasks_full_quarter(self, client, setup_calendar):
        obs = _call(client, "get_calendar_tasks", {
            "start_date": "2026-01-01",
            "end_date": "2026-03-31",
        })
        tasks = obs["structured_content"]["tasks"]
        assert len(tasks) == 3  # tsk_001, tsk_002, tsk_003 (not subtask, not no-date)

    def test_filter_by_project(self, client, setup_calendar):
        obs = _call(client, "get_calendar_tasks", {
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "project_id": "prj_002",
        })
        assert len(obs["structured_content"]["tasks"]) == 0

    def test_filter_by_assignee(self, client, setup_calendar):
        obs = _call(client, "get_calendar_tasks", {
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "assignee_id": "usr_002",
        })
        tasks = obs["structured_content"]["tasks"]
        assert len(tasks) == 1
        assert tasks[0]["assignee_id"] == "usr_002"

    def test_empty_range(self, client, setup_calendar):
        obs = _call(client, "get_calendar_tasks", {
            "start_date": "2025-01-01",
            "end_date": "2025-01-31",
        })
        assert len(obs["structured_content"]["tasks"]) == 0

    def test_excludes_subtasks(self, client, setup_calendar):
        obs = _call(client, "get_calendar_tasks", {
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
        })
        task_ids = [t["id"] for t in obs["structured_content"]["tasks"]]
        assert "tsk_005" not in task_ids


class TestCreateTaskOnDate:
    """Note: create_task_on_date and update_task_dates pass string dates via the API.
    SQLite does not auto-coerce strings to Date columns unlike PostgreSQL.
    These tests use db_session directly for date-writing operations.
    """

    def test_create_task_on_date_via_db(self, client, setup_calendar, db_session):
        """Verify that tasks created with a due_date appear in calendar queries."""
        from models import Task
        db_session.add(Task(id="tsk_new", title="New calendar task", project_id="prj_001",
                            section_id="sec_001", position=10, due_date=date(2026, 4, 15),
                            created_by="usr_001"))
        db_session.commit()

        obs = _call(client, "get_calendar_tasks", {
            "start_date": "2026-04-01",
            "end_date": "2026-04-30",
        })
        assert len(obs["structured_content"]["tasks"]) == 1
        assert obs["structured_content"]["tasks"][0]["title"] == "New calendar task"


class TestUpdateTaskDates:
    def test_update_dates_not_found(self, client, setup_calendar):
        _login(client)
        obs = _call(client, "update_task_dates", {"task_id": "tsk_nonexistent", "due_date": "2026-06-01"})
        assert obs["is_error"] is True

    def test_reschedule_task_via_db(self, client, setup_calendar, db_session):
        """Verify that changing a task's due_date moves it between calendar ranges."""
        from models import Task
        task = db_session.query(Task).filter(Task.id == "tsk_001").first()
        task.due_date = date(2026, 6, 15)
        db_session.commit()

        # Should no longer appear in January
        jan = _call(client, "get_calendar_tasks", {"start_date": "2026-01-01", "end_date": "2026-01-31"})
        assert len(jan["structured_content"]["tasks"]) == 0

        # Should appear in June
        jun = _call(client, "get_calendar_tasks", {"start_date": "2026-06-01", "end_date": "2026-06-30"})
        assert any(t["id"] == "tsk_001" for t in jun["structured_content"]["tasks"])
