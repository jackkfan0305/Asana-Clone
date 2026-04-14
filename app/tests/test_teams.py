"""Test teams & members tools."""

import pytest


@pytest.fixture
def setup_org(db_session):
    from models import Organization, User

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah", email="s@a.com", role="standard", organization_id="org_001"))
    db_session.add(User(id="usr_003", username="bob", password_hash="pass", name="Bob", email="b@a.com", role="standard", organization_id="org_001"))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


class TestCreateTeam:
    def test_create_team(self, client, setup_org):
        _login(client)
        obs = _call(client, "create_team", {"name": "Design Team"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["name"] == "Design Team"
        assert "team_" in obs["structured_content"]["id"]

    def test_create_team_with_description(self, client, setup_org):
        _login(client)
        obs = _call(client, "create_team", {"name": "Ops", "description": "Operations team"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["description"] == "Operations team"

    def test_creator_added_as_admin(self, client, setup_org):
        _login(client)
        team = _call(client, "create_team", {"name": "Auto Admin"})
        tid = team["structured_content"]["id"]

        members = _call(client, "get_team_members", {"team_id": tid})
        assert any(m["user_id"] == "usr_001" and m["role"] == "admin" for m in members["structured_content"]["members"])


class TestAddTeamMember:
    def test_add_member(self, client, setup_org):
        _login(client)
        team = _call(client, "create_team", {"name": "Test Team"})
        tid = team["structured_content"]["id"]

        obs = _call(client, "add_team_member", {"team_id": tid, "user_id": "usr_002", "role": "member"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["role"] == "member"

    def test_add_existing_member_updates_role(self, client, setup_org):
        _login(client)
        team = _call(client, "create_team", {"name": "Test Team"})
        tid = team["structured_content"]["id"]

        _call(client, "add_team_member", {"team_id": tid, "user_id": "usr_002", "role": "member"})
        obs = _call(client, "add_team_member", {"team_id": tid, "user_id": "usr_002", "role": "admin"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["role"] == "admin"


class TestRemoveTeamMember:
    def test_remove_member(self, client, setup_org):
        _login(client)
        team = _call(client, "create_team", {"name": "Test Team"})
        tid = team["structured_content"]["id"]

        _call(client, "add_team_member", {"team_id": tid, "user_id": "usr_002", "role": "member"})
        obs = _call(client, "remove_team_member", {"team_id": tid, "user_id": "usr_002"})
        assert obs["is_error"] is False

    def test_remove_nonexistent_member(self, client, setup_org):
        _login(client)
        team = _call(client, "create_team", {"name": "Test Team"})
        tid = team["structured_content"]["id"]

        obs = _call(client, "remove_team_member", {"team_id": tid, "user_id": "usr_003"})
        assert obs["is_error"] is True


class TestUpdateTeamMemberRole:
    def test_update_role(self, client, setup_org):
        _login(client)
        team = _call(client, "create_team", {"name": "Test Team"})
        tid = team["structured_content"]["id"]

        _call(client, "add_team_member", {"team_id": tid, "user_id": "usr_002", "role": "member"})
        obs = _call(client, "update_team_member_role", {"team_id": tid, "user_id": "usr_002", "role": "admin"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["role"] == "admin"

    def test_update_role_not_found(self, client, setup_org):
        _login(client)
        team = _call(client, "create_team", {"name": "Test Team"})
        tid = team["structured_content"]["id"]

        obs = _call(client, "update_team_member_role", {"team_id": tid, "user_id": "usr_003", "role": "admin"})
        assert obs["is_error"] is True


class TestGetTeamMembers:
    def test_get_members(self, client, setup_org):
        _login(client)
        team = _call(client, "create_team", {"name": "Full Team"})
        tid = team["structured_content"]["id"]

        _call(client, "add_team_member", {"team_id": tid, "user_id": "usr_002", "role": "member"})
        _call(client, "add_team_member", {"team_id": tid, "user_id": "usr_003", "role": "member"})

        obs = _call(client, "get_team_members", {"team_id": tid})
        assert obs["is_error"] is False
        # Creator (admin) + 2 members
        assert len(obs["structured_content"]["members"]) == 3

    def test_get_members_empty_team(self, client, setup_org):
        _login(client)
        team = _call(client, "create_team", {"name": "Solo Team"})
        tid = team["structured_content"]["id"]

        obs = _call(client, "get_team_members", {"team_id": tid})
        # Creator is auto-added as admin
        assert len(obs["structured_content"]["members"]) == 1

    def test_member_details_include_user_info(self, client, setup_org):
        _login(client)
        team = _call(client, "create_team", {"name": "Info Team"})
        tid = team["structured_content"]["id"]

        _call(client, "add_team_member", {"team_id": tid, "user_id": "usr_002", "role": "member"})
        obs = _call(client, "get_team_members", {"team_id": tid})
        sarah = next(m for m in obs["structured_content"]["members"] if m["user_id"] == "usr_002")
        assert sarah["name"] == "Sarah"
        assert sarah["email"] == "s@a.com"
