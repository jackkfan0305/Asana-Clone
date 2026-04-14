"""Extended task tests: edge cases, grouping, reordering, notifications."""

import pytest


@pytest.fixture
def setup_project(db_session):
    from models import Organization, User, Team, Project, Section, Task, UserTaskSection

    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="admin", password_hash="admin", name="Admin", email="a@a.com", role="admin", organization_id="org_001"))
    db_session.add(User(id="usr_002", username="sarah", password_hash="pass", name="Sarah", email="s@a.com", role="standard", organization_id="org_001"))
    db_session.add(Team(id="team_001", name="Engineering", organization_id="org_001"))
    db_session.add(Project(id="prj_001", name="Website Redesign", team_id="team_001", owner_id="usr_001"))
    db_session.add(Section(id="sec_001", name="To do", project_id="prj_001", position=0))
    db_session.add(Section(id="sec_002", name="In progress", project_id="prj_001", position=1))
    db_session.add(UserTaskSection(id="uts_001", user_id="usr_001", name="Do today", position=0))
    db_session.add(UserTaskSection(id="uts_002", user_id="usr_001", name="Do later", position=1))
    db_session.commit()


def _call(client, tool_name, params=None):
    resp = client.post("/step", json={"action": {"tool_name": tool_name, "parameters": params or {}}})
    return resp.json()["observation"]


def _login(client):
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"


class TestCreateTaskEdgeCases:
    def test_create_task_minimal(self, client, setup_project):
        _login(client)
        obs = _call(client, "create_task", {"title": "Minimal"})
        assert obs["is_error"] is False
        assert obs["structured_content"]["title"] == "Minimal"

    def test_create_task_with_all_fields(self, client, setup_project):
        _login(client)
        obs = _call(client, "create_task", {
            "title": "Full task",
            "description": "A detailed description",
            "project_id": "prj_001",
            "section_id": "sec_001",
            "assignee_id": "usr_002",
            "priority": "high",
        })
        assert obs["is_error"] is False
        c = obs["structured_content"]
        assert c["description"] == "A detailed description"
        assert c["priority"] == "high"
        assert c["assignee_id"] == "usr_002"

    def test_self_assignment_no_notification(self, client, setup_project):
        _login(client)
        _call(client, "create_task", {
            "title": "Self assign",
            "project_id": "prj_001",
            "assignee_id": "usr_001",  # Same as logged-in user
        })
        notifs = _call(client, "get_notifications", {"user_id": "usr_001"})
        # Should not get a "task_assigned" notification for self
        assert not any(
            n["type"] == "task_assigned" and "Self assign" in n.get("title", "")
            for n in notifs["structured_content"]["notifications"]
        )

    def test_task_id_sequential(self, client, setup_project):
        _login(client)
        t1 = _call(client, "create_task", {"title": "First"})
        t2 = _call(client, "create_task", {"title": "Second"})
        id1 = int(t1["structured_content"]["id"].split("_")[1])
        id2 = int(t2["structured_content"]["id"].split("_")[1])
        assert id2 == id1 + 1


class TestUpdateTaskEdgeCases:
    def test_complete_via_update(self, client, setup_project):
        _login(client)
        create = _call(client, "create_task", {"title": "Complete me", "project_id": "prj_001"})
        tid = create["structured_content"]["id"]

        obs = _call(client, "update_task", {"task_id": tid, "completed": True})
        assert obs["structured_content"]["completed"] is True
        assert obs["structured_content"]["completed_at"] is not None

    def test_uncomplete_via_update(self, client, setup_project):
        _login(client)
        create = _call(client, "create_task", {"title": "Reopen me", "project_id": "prj_001"})
        tid = create["structured_content"]["id"]

        _call(client, "complete_task", {"task_id": tid, "completed": True})
        obs = _call(client, "update_task", {"task_id": tid, "completed": False})
        assert obs["structured_content"]["completed"] is False
        assert obs["structured_content"]["completed_at"] is None

    def test_update_nonexistent_task(self, client, setup_project):
        _login(client)
        obs = _call(client, "update_task", {"task_id": "tsk_nonexistent", "title": "Nope"})
        assert obs["is_error"] is True


class TestCompleteTaskEdgeCases:
    def test_uncomplete_task(self, client, setup_project):
        _login(client)
        create = _call(client, "create_task", {"title": "Toggle me", "project_id": "prj_001"})
        tid = create["structured_content"]["id"]

        _call(client, "complete_task", {"task_id": tid, "completed": True})
        obs = _call(client, "complete_task", {"task_id": tid, "completed": False})
        assert obs["structured_content"]["completed"] is False
        assert obs["structured_content"]["completed_at"] is None

    def test_complete_nonexistent(self, client, setup_project):
        _login(client)
        obs = _call(client, "complete_task", {"task_id": "tsk_nonexistent", "completed": True})
        assert obs["is_error"] is True


class TestGetMyTasksGrouping:
    def test_group_by_section(self, client, setup_project):
        _login(client)
        _call(client, "create_task", {"title": "T1", "assignee_id": "usr_001", "project_id": "prj_001", "section_id": "sec_001"})
        _call(client, "create_task", {"title": "T2", "assignee_id": "usr_001", "project_id": "prj_001", "section_id": "sec_002"})

        obs = _call(client, "get_my_tasks", {"user_id": "usr_001", "group_by": "section"})
        assert obs["is_error"] is False
        assert "sec_001" in obs["structured_content"]["tasks"]
        assert "sec_002" in obs["structured_content"]["tasks"]

    def test_group_by_priority(self, client, setup_project):
        _login(client)
        _call(client, "create_task", {"title": "High", "assignee_id": "usr_001", "priority": "high"})
        _call(client, "create_task", {"title": "Low", "assignee_id": "usr_001", "priority": "low"})

        obs = _call(client, "get_my_tasks", {"user_id": "usr_001", "group_by": "priority"})
        assert "high" in obs["structured_content"]["tasks"]
        assert "low" in obs["structured_content"]["tasks"]

    def test_include_completed(self, client, setup_project):
        _login(client)
        create = _call(client, "create_task", {"title": "Done task", "assignee_id": "usr_001", "project_id": "prj_001"})
        tid = create["structured_content"]["id"]
        _call(client, "complete_task", {"task_id": tid, "completed": True})

        # Without include_completed
        obs = _call(client, "get_my_tasks", {"user_id": "usr_001"})
        assert obs["structured_content"]["total"] == 0

        # With include_completed
        obs = _call(client, "get_my_tasks", {"user_id": "usr_001", "include_completed": True})
        assert obs["structured_content"]["total"] == 1

    def test_no_user_specified(self, client, setup_project):
        obs = _call(client, "get_my_tasks", {})
        assert obs["is_error"] is True


class TestReorderTasks:
    def test_reorder(self, client, setup_project):
        _login(client)
        t1 = _call(client, "create_task", {"title": "A", "project_id": "prj_001", "section_id": "sec_001"})
        t2 = _call(client, "create_task", {"title": "B", "project_id": "prj_001", "section_id": "sec_001"})
        t3 = _call(client, "create_task", {"title": "C", "project_id": "prj_001", "section_id": "sec_001"})

        ids = [t3["structured_content"]["id"], t1["structured_content"]["id"], t2["structured_content"]["id"]]
        obs = _call(client, "reorder_tasks", {"task_ids": ids})
        assert obs["is_error"] is False

        # Verify positions
        r3 = _call(client, "get_task", {"task_id": ids[0]})
        assert r3["structured_content"]["position"] == 0
        r1 = _call(client, "get_task", {"task_id": ids[1]})
        assert r1["structured_content"]["position"] == 1

    def test_reorder_with_section(self, client, setup_project):
        _login(client)
        t1 = _call(client, "create_task", {"title": "Move", "project_id": "prj_001", "section_id": "sec_001"})
        tid = t1["structured_content"]["id"]

        obs = _call(client, "reorder_tasks", {"task_ids": [tid], "section_id": "sec_002"})
        assert obs["is_error"] is False

        task = _call(client, "get_task", {"task_id": tid})
        assert task["structured_content"]["section_id"] == "sec_002"


class TestDuplicateTaskEdgeCases:
    def test_duplicate_preserves_fields(self, client, setup_project):
        _login(client)
        create = _call(client, "create_task", {
            "title": "Original",
            "project_id": "prj_001",
            "section_id": "sec_001",
            "priority": "high",
            "assignee_id": "usr_002",
        })
        tid = create["structured_content"]["id"]

        obs = _call(client, "duplicate_task", {"task_id": tid})
        dup = obs["structured_content"]
        assert "(copy)" in dup["title"]
        assert dup["priority"] == "high"
        assert dup["assignee_id"] == "usr_002"
        assert dup["project_id"] == "prj_001"
        assert dup["section_id"] == "sec_001"

    def test_duplicate_nonexistent(self, client, setup_project):
        _login(client)
        obs = _call(client, "duplicate_task", {"task_id": "tsk_nonexistent"})
        assert obs["is_error"] is True

    def test_duplicate_with_subtasks(self, client, setup_project):
        _login(client)
        parent = _call(client, "create_task", {"title": "Parent", "project_id": "prj_001", "section_id": "sec_001"})
        pid = parent["structured_content"]["id"]
        _call(client, "add_subtask", {"parent_task_id": pid, "title": "Sub 1"})
        _call(client, "add_subtask", {"parent_task_id": pid, "title": "Sub 2"})

        obs = _call(client, "duplicate_task", {"task_id": pid, "include_subtasks": True})
        assert obs["is_error"] is False

        # Check the duplicated task has subtasks
        dup_id = obs["structured_content"]["id"]
        tree = _call(client, "get_subtask_tree", {"task_id": dup_id})
        assert len(tree["structured_content"]["subtasks"]) == 2


class TestGetTaskDetail:
    def test_detail_includes_all_relations(self, client, setup_project):
        _login(client)
        create = _call(client, "create_task", {"title": "Detailed", "project_id": "prj_001", "section_id": "sec_001", "assignee_id": "usr_002"})
        tid = create["structured_content"]["id"]

        detail = _call(client, "get_task_detail", {"task_id": tid})
        assert detail["is_error"] is False
        c = detail["structured_content"]
        assert "subtasks" in c
        assert "comments" in c
        assert "followers" in c
        assert "tags" in c
        assert "dependencies" in c
        assert "attachments" in c
        assert c.get("assignee_name") == "Sarah"
        assert c.get("project_name") == "Website Redesign"

    def test_detail_not_found(self, client, setup_project):
        obs = _call(client, "get_task_detail", {"task_id": "tsk_nonexistent"})
        assert obs["is_error"] is True
