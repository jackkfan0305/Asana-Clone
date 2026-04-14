"""Test section management tools."""

import pytest


@pytest.fixture
def setup_project(db_session):
    from models import Organization, User, Team, Project, Section, Task

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Website Redesign", team_id="team_001", owner_id="usr_001"))
    db_session.add(Section(id="sec_001", name="To do", project_id="prj_001", position=0))
    db_session.add(Section(id="sec_002", name="In progress", project_id="prj_001", position=1))
    db_session.add(Section(id="sec_003", name="Done", project_id="prj_001", position=2))
    db_session.add(Task(id="tsk_001", title="Task in Todo", project_id="prj_001", section_id="sec_001", position=0, created_by="usr_001"))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


class TestCreateSection:
    def test_create_section(self, client, setup_project):
        _login(client)
        obs = _call(client, "create_section", {"name": "Review", "project_id": "prj_001"})
        assert obs["is_error"] is False
        assert "sec_" in obs["structured_content"]["id"]
        assert obs["structured_content"]["name"] == "Review"

    def test_create_section_auto_position(self, client, setup_project):
        _login(client)
        obs = _call(client, "create_section", {"name": "New Section", "project_id": "prj_001"})
        # Should be appended at position 3 (after 0, 1, 2)
        assert obs["structured_content"]["position"] == 3

    def test_create_section_explicit_position(self, client, setup_project):
        _login(client)
        obs = _call(client, "create_section", {"name": "Inserted", "project_id": "prj_001", "position": 1})
        assert obs["structured_content"]["position"] == 1


class TestUpdateSection:
    def test_update_section_name(self, client, setup_project):
        _login(client)
        obs = _call(client, "update_section", {"section_id": "sec_001", "name": "Backlog"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["name"] == "Backlog"

    def test_update_section_not_found(self, client, setup_project):
        _login(client)
        obs = _call(client, "update_section", {"section_id": "sec_nonexistent", "name": "Nope"})
        assert obs["is_error"] is True


class TestDeleteSection:
    def test_delete_section(self, client, setup_project):
        _login(client)
        obs = _call(client, "delete_section", {"section_id": "sec_003"})
        assert obs["is_error"] is False

    def test_delete_section_not_found(self, client, setup_project):
        _login(client)
        obs = _call(client, "delete_section", {"section_id": "sec_nonexistent"})
        assert obs["is_error"] is True


class TestReorderSections:
    def test_reorder_sections(self, client, setup_project):
        _login(client)
        obs = _call(client, "reorder_sections", {"section_ids": ["sec_003", "sec_001", "sec_002"], "project_id": "prj_001"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["section_ids"] == ["sec_003", "sec_001", "sec_002"]

    def test_reorder_ignores_nonexistent(self, client, setup_project):
        _login(client)
        obs = _call(client, "reorder_sections", {"section_ids": ["sec_001", "sec_nonexistent"], "project_id": "prj_001"})
        assert obs["is_error"] is False


class TestMoveTaskToSection:
    def test_move_task_to_section(self, client, setup_project):
        _login(client)
        obs = _call(client, "move_task_to_section", {"task_id": "tsk_001", "section_id": "sec_002"})
        assert obs["is_error"] is False

        task = _call(client, "get_task", {"task_id": "tsk_001"})
        assert task["structured_content"]["section_id"] == "sec_002"

    def test_move_task_with_position(self, client, setup_project):
        _login(client)
        obs = _call(client, "move_task_to_section", {"task_id": "tsk_001", "section_id": "sec_002", "position": 5})
        assert obs["is_error"] is False

        task = _call(client, "get_task", {"task_id": "tsk_001"})
        assert task["structured_content"]["position"] == 5

    def test_move_task_not_found(self, client, setup_project):
        _login(client)
        obs = _call(client, "move_task_to_section", {"task_id": "tsk_nonexistent", "section_id": "sec_002"})
        assert obs["is_error"] is True

    def test_move_task_section_not_found(self, client, setup_project):
        _login(client)
        obs = _call(client, "move_task_to_section", {"task_id": "tsk_001", "section_id": "sec_nonexistent"})
        assert obs["is_error"] is True

    def test_move_task_updates_project_id(self, client, setup_project, db_session):
        """Moving to a section in another project should update task's project_id."""
        from models import Project, Section
        db_session.add(Project(id="prj_002", name="Other", team_id="team_001", owner_id="usr_001"))
        db_session.add(Section(id="sec_other", name="New", project_id="prj_002", position=0))
        db_session.commit()

        _login(client)
        _call(client, "move_task_to_section", {"task_id": "tsk_001", "section_id": "sec_other"})
        task = _call(client, "get_task", {"task_id": "tsk_001"})
        assert task["structured_content"]["project_id"] == "prj_002"
