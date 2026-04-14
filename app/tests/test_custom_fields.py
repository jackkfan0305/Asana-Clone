"""Test custom fields tools."""

import pytest


@pytest.fixture
def setup_data(db_session):
    from models import Organization, User, Team, Project, Section, Task

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
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


class TestCreateCustomField:
    def test_create_text_field(self, client, setup_data):
        _login(client)
        obs = _call(client, "create_custom_field", {"name": "Notes", "field_type": "text"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["name"] == "Notes"
        assert obs["structured_content"]["field_type"] == "text"
        assert "cf_" in obs["structured_content"]["id"]

    def test_create_dropdown_field_with_options(self, client, setup_data):
        _login(client)
        obs = _call(client, "create_custom_field", {
            "name": "Priority Level",
            "field_type": "dropdown",
            "options": [
                {"name": "Low", "color": "#00ff00"},
                {"name": "Medium", "color": "#ffff00"},
                {"name": "High", "color": "#ff0000"},
            ],
        })
        assert obs["is_error"] is False
        assert len(obs["structured_content"]["options"]) == 3
        assert obs["structured_content"]["options"][0]["name"] == "Low"

    def test_create_number_field(self, client, setup_data):
        _login(client)
        obs = _call(client, "create_custom_field", {"name": "Story Points", "field_type": "number"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["field_type"] == "number"

    def test_create_checkbox_field(self, client, setup_data):
        _login(client)
        obs = _call(client, "create_custom_field", {"name": "Approved", "field_type": "checkbox"})
        assert obs["is_error"] is False

    def test_create_field_linked_to_project(self, client, setup_data):
        _login(client)
        obs = _call(client, "create_custom_field", {
            "name": "Sprint",
            "field_type": "text",
            "project_id": "prj_001",
        })
        assert obs["is_error"] is False

        # Verify it shows up in project custom fields
        fields = _call(client, "get_project_custom_fields", {"project_id": "prj_001"})
        assert any(f["name"] == "Sprint" for f in fields["structured_content"]["fields"])


class TestUpdateCustomField:
    def test_rename_field(self, client, setup_data):
        _login(client)
        create = _call(client, "create_custom_field", {"name": "Old Name", "field_type": "text"})
        fid = create["structured_content"]["id"]

        obs = _call(client, "update_custom_field", {"field_id": fid, "name": "New Name"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["name"] == "New Name"

    def test_add_options_to_dropdown(self, client, setup_data):
        _login(client)
        create = _call(client, "create_custom_field", {
            "name": "Status",
            "field_type": "dropdown",
            "options": [{"name": "Draft"}],
        })
        fid = create["structured_content"]["id"]

        obs = _call(client, "update_custom_field", {
            "field_id": fid,
            "add_options": [{"name": "Published", "color": "#00ff00"}],
        })
        assert obs["is_error"] is False
        assert len(obs["structured_content"]["options"]) == 2

    def test_remove_options(self, client, setup_data):
        _login(client)
        create = _call(client, "create_custom_field", {
            "name": "Status",
            "field_type": "dropdown",
            "options": [{"name": "A"}, {"name": "B"}],
        })
        fid = create["structured_content"]["id"]
        option_id = create["structured_content"]["options"][0]["id"]

        obs = _call(client, "update_custom_field", {"field_id": fid, "remove_option_ids": [option_id]})
        assert obs["is_error"] is False
        assert len(obs["structured_content"]["options"]) == 1

    def test_update_not_found(self, client, setup_data):
        _login(client)
        obs = _call(client, "update_custom_field", {"field_id": "cf_nonexistent", "name": "Nope"})
        assert obs["is_error"] is True


class TestSetCustomFieldValue:
    def test_set_text_value(self, client, setup_data):
        _login(client)
        field = _call(client, "create_custom_field", {"name": "Notes", "field_type": "text"})
        fid = field["structured_content"]["id"]

        obs = _call(client, "set_custom_field_value", {"task_id": "tsk_001", "field_id": fid, "value": "Hello"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["value"] == "Hello"

    def test_set_number_value(self, client, setup_data):
        _login(client)
        field = _call(client, "create_custom_field", {"name": "Points", "field_type": "number"})
        fid = field["structured_content"]["id"]

        obs = _call(client, "set_custom_field_value", {"task_id": "tsk_001", "field_id": fid, "value": 8})
        assert obs["is_error"] is False
        assert obs["structured_content"]["value"] == 8

    def test_set_checkbox_value(self, client, setup_data):
        _login(client)
        field = _call(client, "create_custom_field", {"name": "Approved", "field_type": "checkbox"})
        fid = field["structured_content"]["id"]

        obs = _call(client, "set_custom_field_value", {"task_id": "tsk_001", "field_id": fid, "value": True})
        assert obs["is_error"] is False
        assert obs["structured_content"]["value"] is True

    def test_update_existing_value(self, client, setup_data):
        _login(client)
        field = _call(client, "create_custom_field", {"name": "Notes", "field_type": "text"})
        fid = field["structured_content"]["id"]

        _call(client, "set_custom_field_value", {"task_id": "tsk_001", "field_id": fid, "value": "First"})
        obs = _call(client, "set_custom_field_value", {"task_id": "tsk_001", "field_id": fid, "value": "Updated"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["value"] == "Updated"

    def test_set_value_field_not_found(self, client, setup_data):
        _login(client)
        obs = _call(client, "set_custom_field_value", {"task_id": "tsk_001", "field_id": "cf_nonexistent", "value": "x"})
        assert obs["is_error"] is True


class TestGetProjectCustomFields:
    def test_get_empty(self, client, setup_data):
        _login(client)
        obs = _call(client, "get_project_custom_fields", {"project_id": "prj_001"})
        assert obs["is_error"] is False
        assert len(obs["structured_content"]["fields"]) == 0

    def test_get_multiple_fields(self, client, setup_data):
        _login(client)
        _call(client, "create_custom_field", {"name": "F1", "field_type": "text", "project_id": "prj_001"})
        _call(client, "create_custom_field", {"name": "F2", "field_type": "number", "project_id": "prj_001"})

        obs = _call(client, "get_project_custom_fields", {"project_id": "prj_001"})
        assert len(obs["structured_content"]["fields"]) == 2
