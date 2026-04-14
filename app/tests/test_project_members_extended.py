"""Test project members tools (extended)."""

import pytest


@pytest.fixture
def setup_data(db_session):
    from models import Organization, User, Team, Project

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah", email="s@a.com", role="standard", organization_id="org_001"))
    db_session.add(User(id="usr_003", username="bob", password_hash="pass", name="Bob", email="b@a.com", role="standard", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Project", team_id="team_001", owner_id="usr_001"))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


class TestAddProjectMember:
    def test_add_member(self, client, setup_data):
        _login(client)
        obs = _call(client, "add_project_member", {"project_id": "prj_001", "user_id": "usr_002", "role": "editor"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["role"] == "editor"

    def test_add_member_as_viewer(self, client, setup_data):
        _login(client)
        obs = _call(client, "add_project_member", {"project_id": "prj_001", "user_id": "usr_002", "role": "viewer"})
        assert obs["structured_content"]["role"] == "viewer"

    def test_add_existing_member_updates_role(self, client, setup_data):
        _login(client)
        _call(client, "add_project_member", {"project_id": "prj_001", "user_id": "usr_002", "role": "viewer"})
        obs = _call(client, "add_project_member", {"project_id": "prj_001", "user_id": "usr_002", "role": "editor"})
        assert obs["structured_content"]["role"] == "editor"


class TestRemoveProjectMember:
    def test_remove_member(self, client, setup_data):
        _login(client)
        _call(client, "add_project_member", {"project_id": "prj_001", "user_id": "usr_002", "role": "editor"})
        obs = _call(client, "remove_project_member", {"project_id": "prj_001", "user_id": "usr_002"})
        assert obs["is_error"] is False

    def test_remove_nonexistent_member(self, client, setup_data):
        _login(client)
        obs = _call(client, "remove_project_member", {"project_id": "prj_001", "user_id": "usr_003"})
        assert obs["is_error"] is True

    def test_remove_then_verify_gone(self, client, setup_data):
        _login(client)
        _call(client, "add_project_member", {"project_id": "prj_001", "user_id": "usr_002", "role": "editor"})
        _call(client, "remove_project_member", {"project_id": "prj_001", "user_id": "usr_002"})

        members = _call(client, "get_project_members", {"project_id": "prj_001"})
        assert not any(m["user_id"] == "usr_002" for m in members["structured_content"]["members"])


class TestGetProjectMembers:
    def test_get_members(self, client, setup_data):
        _login(client)
        _call(client, "add_project_member", {"project_id": "prj_001", "user_id": "usr_002", "role": "editor"})
        _call(client, "add_project_member", {"project_id": "prj_001", "user_id": "usr_003", "role": "viewer"})

        obs = _call(client, "get_project_members", {"project_id": "prj_001"})
        assert obs["is_error"] is False
        assert len(obs["structured_content"]["members"]) == 2

    def test_get_members_empty(self, client, setup_data):
        _login(client)
        obs = _call(client, "get_project_members", {"project_id": "prj_001"})
        assert len(obs["structured_content"]["members"]) == 0

    def test_member_includes_user_info(self, client, setup_data):
        _login(client)
        _call(client, "add_project_member", {"project_id": "prj_001", "user_id": "usr_002", "role": "editor"})

        obs = _call(client, "get_project_members", {"project_id": "prj_001"})
        member = obs["structured_content"]["members"][0]
        assert member["name"] == "Sarah"
        assert member["role"] == "editor"
