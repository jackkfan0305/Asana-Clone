"""Test bulk operation tools."""

import pytest


@pytest.fixture
def setup_bulk(db_session):
    from models import Organization, User, Team, Project, Section, Task, Tag

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah", email="s@a.com", role="standard", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Project", team_id="team_001", owner_id="usr_001"))
    db_session.add(Section(id="sec_001", name="To do", project_id="prj_001", position=0))
    db_session.add(Section(id="sec_002", name="Done", project_id="prj_001", position=1))
    db_session.add(Tag(id="tag_001", name="Bug", color="#ff0000"))
    db_session.add(Tag(id="tag_002", name="Feature", color="#00ff00"))

    for i in range(1, 6):
        db_session.add(Task(
            id=f"tsk_{i:03d}",
            title=f"Task {i}",
            project_id="prj_001",
            section_id="sec_001",
            assignee_id="usr_001",
            position=i - 1,
            created_by="usr_001",
        ))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


class TestBulkUpdateTasks:
    def test_bulk_update_priority(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_update_tasks", {
            "task_ids": ["tsk_001", "tsk_002", "tsk_003"],
            "updates": {"priority": "high"},
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["updated_count"] == 3

        # Verify updates
        for tid in ["tsk_001", "tsk_002", "tsk_003"]:
            task = _call(client, "get_task", {"task_id": tid})
            assert task["structured_content"]["priority"] == "high"

    def test_bulk_update_assignee(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_update_tasks", {
            "task_ids": ["tsk_001", "tsk_002"],
            "updates": {"assignee_id": "usr_002"},
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["updated_count"] == 2

    def test_bulk_update_with_tags(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_update_tasks", {
            "task_ids": ["tsk_001", "tsk_002"],
            "updates": {"add_tags": ["tag_001"]},
        })
        assert obs["is_error"] is False

    def test_bulk_update_skips_nonexistent(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_update_tasks", {
            "task_ids": ["tsk_001", "tsk_nonexistent"],
            "updates": {"priority": "low"},
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["updated_count"] == 1

    def test_bulk_update_empty_list(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_update_tasks", {
            "task_ids": [],
            "updates": {"priority": "low"},
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["updated_count"] == 0


class TestBulkMoveTasks:
    def test_bulk_move(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_move_tasks", {
            "task_ids": ["tsk_001", "tsk_002", "tsk_003"],
            "section_id": "sec_002",
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["moved_count"] == 3

        for tid in ["tsk_001", "tsk_002", "tsk_003"]:
            task = _call(client, "get_task", {"task_id": tid})
            assert task["structured_content"]["section_id"] == "sec_002"

    def test_bulk_move_with_position_start(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_move_tasks", {
            "task_ids": ["tsk_001", "tsk_002"],
            "section_id": "sec_002",
            "position_start": 10,
        })
        assert obs["is_error"] is False

        t1 = _call(client, "get_task", {"task_id": "tsk_001"})
        t2 = _call(client, "get_task", {"task_id": "tsk_002"})
        assert t1["structured_content"]["position"] == 10
        assert t2["structured_content"]["position"] == 11


class TestBulkDeleteTasks:
    def test_bulk_delete(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_delete_tasks", {"task_ids": ["tsk_001", "tsk_002"]})
        assert obs["is_error"] is False
        assert obs["structured_content"]["deleted_count"] == 2

        # Verify deleted
        for tid in ["tsk_001", "tsk_002"]:
            task = _call(client, "get_task", {"task_id": tid})
            assert task["is_error"] is True

    def test_bulk_delete_skips_nonexistent(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_delete_tasks", {"task_ids": ["tsk_001", "tsk_nonexistent"]})
        assert obs["structured_content"]["deleted_count"] == 1

    def test_bulk_delete_empty(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_delete_tasks", {"task_ids": []})
        assert obs["structured_content"]["deleted_count"] == 0


class TestBulkCompleteTasks:
    def test_bulk_complete(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_complete_tasks", {
            "task_ids": ["tsk_001", "tsk_002", "tsk_003"],
            "completed": True,
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["count"] == 3

        for tid in ["tsk_001", "tsk_002", "tsk_003"]:
            task = _call(client, "get_task", {"task_id": tid})
            assert task["structured_content"]["completed"] is True
            assert task["structured_content"]["completed_at"] is not None

    def test_bulk_uncomplete(self, client, setup_bulk):
        _login(client)
        # Complete first
        _call(client, "bulk_complete_tasks", {"task_ids": ["tsk_001", "tsk_002"], "completed": True})
        # Uncomplete
        obs = _call(client, "bulk_complete_tasks", {"task_ids": ["tsk_001", "tsk_002"], "completed": False})
        assert obs["structured_content"]["completed"] is False

        for tid in ["tsk_001", "tsk_002"]:
            task = _call(client, "get_task", {"task_id": tid})
            assert task["structured_content"]["completed"] is False
            assert task["structured_content"]["completed_at"] is None


class TestBulkAssignTasks:
    def test_bulk_assign(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_assign_tasks", {
            "task_ids": ["tsk_001", "tsk_002", "tsk_003"],
            "assignee_id": "usr_002",
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["assigned_count"] == 3

        for tid in ["tsk_001", "tsk_002", "tsk_003"]:
            task = _call(client, "get_task", {"task_id": tid})
            assert task["structured_content"]["assignee_id"] == "usr_002"

    def test_bulk_assign_skips_nonexistent(self, client, setup_bulk):
        _login(client)
        obs = _call(client, "bulk_assign_tasks", {
            "task_ids": ["tsk_001", "tsk_nonexistent"],
            "assignee_id": "usr_002",
        })
        assert obs["structured_content"]["assigned_count"] == 1
