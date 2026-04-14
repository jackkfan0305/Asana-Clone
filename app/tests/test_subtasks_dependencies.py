"""Test subtasks & dependencies tools."""

import pytest


@pytest.fixture
def setup_tasks(db_session):
    """Create org, user, team, project, section, and multiple tasks."""
    from models import Organization, User, Team, Project, Section, Task

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah", email="s@a.com", role="standard", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Website Redesign", team_id="team_001", owner_id="usr_001"))
    db_session.add(Section(id="sec_001", name="To do", project_id="prj_001", position=0))
    db_session.add(Section(id="sec_002", name="In progress", project_id="prj_001", position=1))
    db_session.add(Task(id="tsk_001", title="Parent Task", project_id="prj_001", section_id="sec_001", position=0, created_by="usr_001"))
    db_session.add(Task(id="tsk_002", title="Task A", project_id="prj_001", section_id="sec_001", position=1, created_by="usr_001"))
    db_session.add(Task(id="tsk_003", title="Task B", project_id="prj_001", section_id="sec_001", position=2, created_by="usr_001"))
    db_session.add(Task(id="tsk_004", title="Task C", project_id="prj_001", section_id="sec_001", position=3, created_by="usr_001"))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


# --- Subtask tests ---

class TestAddSubtask:
    def test_add_subtask_basic(self, client, setup_tasks):
        _login(client)
        obs = _call(client, "add_subtask", {"parent_task_id": "tsk_001", "title": "Subtask 1"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["parent_task_id"] == "tsk_001"
        assert obs["structured_content"]["title"] == "Subtask 1"

    def test_add_subtask_with_assignee(self, client, setup_tasks):
        _login(client)
        obs = _call(client, "add_subtask", {"parent_task_id": "tsk_001", "title": "Subtask assigned", "assignee_id": "usr_002"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["assignee_id"] == "usr_002"

    def test_add_multiple_subtasks_positions(self, client, setup_tasks):
        _login(client)
        obs1 = _call(client, "add_subtask", {"parent_task_id": "tsk_001", "title": "Sub 1"})
        obs2 = _call(client, "add_subtask", {"parent_task_id": "tsk_001", "title": "Sub 2"})
        assert obs1["structured_content"]["position"] == 0
        assert obs2["structured_content"]["position"] == 1

    def test_add_subtask_inherits_project(self, client, setup_tasks):
        _login(client)
        obs = _call(client, "add_subtask", {"parent_task_id": "tsk_001", "title": "Inherited"})
        assert obs["is_error"] is False
        # Subtask should inherit parent's project_id
        task_detail = _call(client, "get_task", {"task_id": obs["structured_content"]["id"]})
        assert task_detail["structured_content"]["project_id"] == "prj_001"

    def test_add_subtask_parent_not_found(self, client, setup_tasks):
        _login(client)
        obs = _call(client, "add_subtask", {"parent_task_id": "tsk_nonexistent", "title": "Orphan"})
        assert obs["is_error"] is True
        assert "not found" in obs["text"].lower()


class TestRemoveSubtask:
    def test_remove_subtask(self, client, setup_tasks):
        _login(client)
        sub = _call(client, "add_subtask", {"parent_task_id": "tsk_001", "title": "Detach me"})
        sub_id = sub["structured_content"]["id"]

        obs = _call(client, "remove_subtask", {"task_id": sub_id})
        assert obs["is_error"] is False
        assert obs["structured_content"]["parent_task_id"] is None

    def test_remove_subtask_not_a_subtask(self, client, setup_tasks):
        _login(client)
        obs = _call(client, "remove_subtask", {"task_id": "tsk_001"})
        assert obs["is_error"] is True
        assert "not a subtask" in obs["text"].lower()

    def test_remove_subtask_not_found(self, client, setup_tasks):
        _login(client)
        obs = _call(client, "remove_subtask", {"task_id": "tsk_nonexistent"})
        assert obs["is_error"] is True


class TestGetSubtaskTree:
    def test_subtask_tree_no_children(self, client, setup_tasks):
        _login(client)
        obs = _call(client, "get_subtask_tree", {"task_id": "tsk_001"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["subtasks"] == []

    def test_subtask_tree_with_children(self, client, setup_tasks):
        _login(client)
        _call(client, "add_subtask", {"parent_task_id": "tsk_001", "title": "Sub A"})
        _call(client, "add_subtask", {"parent_task_id": "tsk_001", "title": "Sub B"})

        obs = _call(client, "get_subtask_tree", {"task_id": "tsk_001"})
        assert obs["is_error"] is False
        assert len(obs["structured_content"]["subtasks"]) == 2

    def test_subtask_tree_not_found(self, client, setup_tasks):
        obs = _call(client, "get_subtask_tree", {"task_id": "tsk_nonexistent"})
        assert obs["is_error"] is True


class TestConvertSubtaskToTask:
    def test_convert_subtask_to_task(self, client, setup_tasks):
        _login(client)
        sub = _call(client, "add_subtask", {"parent_task_id": "tsk_001", "title": "Promote me"})
        sub_id = sub["structured_content"]["id"]

        obs = _call(client, "convert_subtask_to_task", {"task_id": sub_id})
        assert obs["is_error"] is False
        assert obs["structured_content"]["parent_task_id"] is None

    def test_convert_to_different_project(self, client, setup_tasks, db_session):
        from models import Project
        db_session.add(Project(id="prj_002", name="Other Project", team_id="team_001", owner_id="usr_001"))
        db_session.commit()

        _login(client)
        sub = _call(client, "add_subtask", {"parent_task_id": "tsk_001", "title": "Move me"})
        sub_id = sub["structured_content"]["id"]

        obs = _call(client, "convert_subtask_to_task", {"task_id": sub_id, "project_id": "prj_002", "section_id": "sec_002"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["parent_task_id"] is None

    def test_convert_not_found(self, client, setup_tasks):
        _login(client)
        obs = _call(client, "convert_subtask_to_task", {"task_id": "tsk_nonexistent"})
        assert obs["is_error"] is True


# --- Dependency tests ---

class TestSetDependency:
    def test_set_dependency(self, client, setup_tasks):
        _login(client)
        obs = _call(client, "set_dependency", {
            "task_id": "tsk_002",
            "depends_on_task_id": "tsk_003",
            "dependency_type": "blocking",
        })
        assert obs["is_error"] is False
        assert obs["structured_content"]["task_id"] == "tsk_002"
        assert obs["structured_content"]["depends_on_task_id"] == "tsk_003"

    def test_self_dependency_rejected(self, client, setup_tasks):
        _login(client)
        obs = _call(client, "set_dependency", {
            "task_id": "tsk_002",
            "depends_on_task_id": "tsk_002",
            "dependency_type": "blocking",
        })
        assert obs["is_error"] is True
        assert "self" in obs["text"].lower()

    def test_duplicate_dependency_rejected(self, client, setup_tasks):
        _login(client)
        _call(client, "set_dependency", {
            "task_id": "tsk_002",
            "depends_on_task_id": "tsk_003",
            "dependency_type": "blocking",
        })
        obs = _call(client, "set_dependency", {
            "task_id": "tsk_002",
            "depends_on_task_id": "tsk_003",
            "dependency_type": "blocking",
        })
        assert obs["is_error"] is True
        assert "already exists" in obs["text"].lower()

    def test_circular_dependency_detected(self, client, setup_tasks):
        _login(client)
        # A depends on B
        _call(client, "set_dependency", {
            "task_id": "tsk_002",
            "depends_on_task_id": "tsk_003",
            "dependency_type": "blocking",
        })
        # B depends on A → circular
        obs = _call(client, "set_dependency", {
            "task_id": "tsk_003",
            "depends_on_task_id": "tsk_002",
            "dependency_type": "blocking",
        })
        assert obs["is_error"] is True
        assert "circular" in obs["text"].lower()

    def test_transitive_circular_dependency(self, client, setup_tasks):
        _login(client)
        # A → B → C → A
        _call(client, "set_dependency", {"task_id": "tsk_002", "depends_on_task_id": "tsk_003", "dependency_type": "blocking"})
        _call(client, "set_dependency", {"task_id": "tsk_003", "depends_on_task_id": "tsk_004", "dependency_type": "blocking"})
        obs = _call(client, "set_dependency", {"task_id": "tsk_004", "depends_on_task_id": "tsk_002", "dependency_type": "blocking"})
        assert obs["is_error"] is True
        assert "circular" in obs["text"].lower()

    def test_dependency_task_not_found(self, client, setup_tasks):
        _login(client)
        obs = _call(client, "set_dependency", {
            "task_id": "tsk_nonexistent",
            "depends_on_task_id": "tsk_002",
            "dependency_type": "blocking",
        })
        assert obs["is_error"] is True

    def test_dependency_visible_in_task_detail(self, client, setup_tasks):
        _login(client)
        _call(client, "set_dependency", {"task_id": "tsk_002", "depends_on_task_id": "tsk_003", "dependency_type": "blocking"})
        detail = _call(client, "get_task_detail", {"task_id": "tsk_002"})
        assert any(d["depends_on_task_id"] == "tsk_003" for d in detail["structured_content"]["dependencies"])


class TestRemoveDependency:
    def test_remove_dependency(self, client, setup_tasks):
        _login(client)
        _call(client, "set_dependency", {"task_id": "tsk_002", "depends_on_task_id": "tsk_003", "dependency_type": "blocking"})
        obs = _call(client, "remove_dependency", {"task_id": "tsk_002", "depends_on_task_id": "tsk_003"})
        assert obs["is_error"] is False

    def test_remove_nonexistent_dependency(self, client, setup_tasks):
        _login(client)
        obs = _call(client, "remove_dependency", {"task_id": "tsk_002", "depends_on_task_id": "tsk_003"})
        assert obs["is_error"] is True
        assert "not found" in obs["text"].lower()
