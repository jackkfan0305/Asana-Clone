"""Test notification tools."""

import pytest


@pytest.fixture
def setup_notifications(db_session):
    from models import Organization, User, Team, Project, Section, Task, Notification

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah", email="s@a.com", role="standard", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Project", team_id="team_001", owner_id="usr_001"))
    db_session.add(Section(id="sec_001", name="Todo", project_id="prj_001", position=0))
    db_session.add(Task(id="tsk_001", title="Test Task", project_id="prj_001", section_id="sec_001", position=0, created_by="usr_001"))

    # Pre-create some notifications
    for i in range(1, 6):
        db_session.add(Notification(
            id=f"ntf_{i:03d}",
            user_id="usr_001",
            type="task_assigned" if i % 2 else "comment_added",
            task_id="tsk_001",
            project_id="prj_001",
            actor_id="usr_002",
            title=f"Notification {i}",
            read=i > 3,  # ntf_004, ntf_005 are read
            archived=i == 5,  # ntf_005 is archived
        ))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


class TestGetNotifications:
    def test_get_all_notifications(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "get_notifications", {"user_id": "usr_001"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["total"] == 5

    def test_get_unread_notifications(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "get_notifications", {"user_id": "usr_001", "read": False})
        assert obs["is_error"] is False
        assert obs["structured_content"]["total"] == 3

    def test_get_read_notifications(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "get_notifications", {"user_id": "usr_001", "read": True})
        assert obs["structured_content"]["total"] == 2

    def test_filter_by_type(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "get_notifications", {"user_id": "usr_001", "type": "task_assigned"})
        assert obs["is_error"] is False
        for n in obs["structured_content"]["notifications"]:
            assert n["type"] == "task_assigned"

    def test_filter_archived(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "get_notifications", {"user_id": "usr_001", "archived": False})
        assert obs["structured_content"]["total"] == 4

    def test_no_user_specified(self, client, setup_notifications):
        obs = _call(client, "get_notifications", {})
        assert obs["is_error"] is True

    def test_empty_notifications(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "get_notifications", {"user_id": "usr_002"})
        assert obs["structured_content"]["total"] == 0


class TestMarkNotificationRead:
    def test_mark_read(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "mark_notification_read", {"notification_id": "ntf_001", "read": True})
        assert obs["is_error"] is False
        assert obs["structured_content"]["read"] is True

    def test_mark_unread(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "mark_notification_read", {"notification_id": "ntf_004", "read": False})
        assert obs["is_error"] is False
        assert obs["structured_content"]["read"] is False

    def test_mark_not_found(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "mark_notification_read", {"notification_id": "ntf_nonexistent", "read": True})
        assert obs["is_error"] is True


class TestArchiveNotification:
    def test_archive(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "archive_notification", {"notification_id": "ntf_001"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["archived"] is True
        assert obs["structured_content"]["read"] is True  # Archiving also marks as read

    def test_archive_not_found(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "archive_notification", {"notification_id": "ntf_nonexistent"})
        assert obs["is_error"] is True


class TestBulkArchiveNotifications:
    def test_bulk_archive(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "bulk_archive_notifications", {"notification_ids": ["ntf_001", "ntf_002", "ntf_003"]})
        assert obs["is_error"] is False
        assert obs["structured_content"]["archived_count"] == 3

    def test_bulk_archive_skips_nonexistent(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "bulk_archive_notifications", {"notification_ids": ["ntf_001", "ntf_nonexistent"]})
        assert obs["structured_content"]["archived_count"] == 1


class TestGetUnreadCount:
    def test_unread_count(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "get_unread_count", {"user_id": "usr_001"})
        assert obs["is_error"] is False
        # ntf_001, ntf_002, ntf_003 are unread & unarchived
        assert obs["structured_content"]["unread_count"] == 3

    def test_unread_count_no_user(self, client, setup_notifications):
        obs = _call(client, "get_unread_count", {})
        assert obs["is_error"] is True

    def test_unread_count_zero(self, client, setup_notifications):
        _login(client)
        obs = _call(client, "get_unread_count", {"user_id": "usr_002"})
        assert obs["structured_content"]["unread_count"] == 0

    def test_unread_count_after_marking_read(self, client, setup_notifications):
        _login(client)
        _call(client, "mark_notification_read", {"notification_id": "ntf_001", "read": True})
        obs = _call(client, "get_unread_count", {"user_id": "usr_001"})
        assert obs["structured_content"]["unread_count"] == 2


class TestNotificationIntegration:
    def test_task_assignment_creates_notification(self, client, setup_notifications):
        """Assigning a task should create a notification for the assignee."""
        _login(client)
        _call(client, "create_task", {
            "title": "Assigned to Sarah",
            "project_id": "prj_001",
            "assignee_id": "usr_002",
        })
        obs = _call(client, "get_notifications", {"user_id": "usr_002"})
        assert obs["structured_content"]["total"] >= 1
        assert any(n["type"] == "task_assigned" for n in obs["structured_content"]["notifications"])

    def test_reassignment_creates_notification(self, client, setup_notifications):
        """Reassigning a task should notify the new assignee."""
        _login(client)
        create = _call(client, "create_task", {
            "title": "Reassign me",
            "project_id": "prj_001",
            "assignee_id": "usr_001",
        })
        task_id = create["structured_content"]["id"]
        _call(client, "update_task", {"task_id": task_id, "assignee_id": "usr_002"})

        obs = _call(client, "get_notifications", {"user_id": "usr_002"})
        assert any(n["type"] == "task_assigned" for n in obs["structured_content"]["notifications"])
