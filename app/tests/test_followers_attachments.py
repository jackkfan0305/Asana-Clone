"""Test followers & attachments tools."""

import pytest


@pytest.fixture
def setup_data(db_session):
    from models import Organization, User, Team, Project, Section, Task

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah", email="s@a.com", role="standard", organization_id="org_001"))
    db_session.add(User(id="usr_003", username="bob", password_hash="pass", name="Bob", email="b@a.com", role="standard", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Project", team_id="team_001", owner_id="usr_001"))
    db_session.add(Section(id="sec_001", name="Todo", project_id="prj_001", position=0))
    db_session.add(Task(id="tsk_001", title="Test Task", project_id="prj_001", section_id="sec_001", position=0, created_by="usr_001"))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


class TestAddFollower:
    def test_add_follower(self, client, setup_data):
        _login(client)
        obs = _call(client, "add_follower", {"task_id": "tsk_001", "user_id": "usr_002"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["user_id"] == "usr_002"

    def test_add_follower_idempotent(self, client, setup_data):
        _login(client)
        _call(client, "add_follower", {"task_id": "tsk_001", "user_id": "usr_002"})
        obs = _call(client, "add_follower", {"task_id": "tsk_001", "user_id": "usr_002"})
        assert obs["is_error"] is False
        assert "already" in obs["text"].lower()

    def test_add_follower_creates_notification(self, client, setup_data):
        _login(client)
        _call(client, "add_follower", {"task_id": "tsk_001", "user_id": "usr_002"})
        notifs = _call(client, "get_notifications", {"user_id": "usr_002"})
        assert any(n["type"] == "follower_added" for n in notifs["structured_content"]["notifications"])

    def test_add_self_as_follower_no_notification(self, client, setup_data):
        _login(client)
        _call(client, "add_follower", {"task_id": "tsk_001", "user_id": "usr_001"})
        notifs = _call(client, "get_notifications", {"user_id": "usr_001"})
        # Should not self-notify
        assert not any(n["type"] == "follower_added" for n in notifs["structured_content"]["notifications"])

    def test_follower_visible_in_task_detail(self, client, setup_data):
        _login(client)
        _call(client, "add_follower", {"task_id": "tsk_001", "user_id": "usr_002"})
        detail = _call(client, "get_task_detail", {"task_id": "tsk_001"})
        assert any(f["user_id"] == "usr_002" for f in detail["structured_content"]["followers"])


class TestRemoveFollower:
    def test_remove_follower(self, client, setup_data):
        _login(client)
        _call(client, "add_follower", {"task_id": "tsk_001", "user_id": "usr_002"})
        obs = _call(client, "remove_follower", {"task_id": "tsk_001", "user_id": "usr_002"})
        assert obs["is_error"] is False

    def test_remove_nonexistent_follower(self, client, setup_data):
        _login(client)
        obs = _call(client, "remove_follower", {"task_id": "tsk_001", "user_id": "usr_003"})
        assert obs["is_error"] is True


class TestAddAttachment:
    def test_add_attachment(self, client, setup_data):
        _login(client)
        obs = _call(client, "add_attachment", {
            "task_id": "tsk_001",
            "filename": "design.png",
            "url": "/files/design.png",
            "mime_type": "image/png",
            "file_size": 1024,
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["filename"] == "design.png"
        assert "att_" in obs["structured_content"]["id"]

    def test_add_multiple_attachments(self, client, setup_data):
        _login(client)
        _call(client, "add_attachment", {"task_id": "tsk_001", "filename": "a.pdf", "url": "/a.pdf"})
        _call(client, "add_attachment", {"task_id": "tsk_001", "filename": "b.pdf", "url": "/b.pdf"})

        obs = _call(client, "get_attachments", {"task_id": "tsk_001"})
        assert len(obs["structured_content"]["attachments"]) == 2


class TestGetAttachments:
    def test_get_attachments_empty(self, client, setup_data):
        _login(client)
        obs = _call(client, "get_attachments", {"task_id": "tsk_001"})
        assert obs["is_error"] is False
        assert len(obs["structured_content"]["attachments"]) == 0

    def test_get_attachments_returns_metadata(self, client, setup_data):
        _login(client)
        _call(client, "add_attachment", {
            "task_id": "tsk_001",
            "filename": "report.pdf",
            "url": "/files/report.pdf",
            "mime_type": "application/pdf",
            "file_size": 2048,
        })
        obs = _call(client, "get_attachments", {"task_id": "tsk_001"})
        att = obs["structured_content"]["attachments"][0]
        assert att["filename"] == "report.pdf"
        assert att["mime_type"] == "application/pdf"
        assert att["file_size"] == 2048

    def test_attachments_visible_in_task_detail(self, client, setup_data):
        _login(client)
        _call(client, "add_attachment", {"task_id": "tsk_001", "filename": "spec.docx", "url": "/spec.docx"})
        detail = _call(client, "get_task_detail", {"task_id": "tsk_001"})
        assert len(detail["structured_content"]["attachments"]) == 1


class TestDeleteAttachment:
    def test_delete_attachment(self, client, setup_data):
        _login(client)
        att = _call(client, "add_attachment", {"task_id": "tsk_001", "filename": "delete.txt", "url": "/del.txt"})
        att_id = att["structured_content"]["id"]

        obs = _call(client, "delete_attachment", {"attachment_id": att_id})
        assert obs["is_error"] is False

        remaining = _call(client, "get_attachments", {"task_id": "tsk_001"})
        assert len(remaining["structured_content"]["attachments"]) == 0

    def test_delete_attachment_not_found(self, client, setup_data):
        _login(client)
        obs = _call(client, "delete_attachment", {"attachment_id": "att_nonexistent"})
        assert obs["is_error"] is True
