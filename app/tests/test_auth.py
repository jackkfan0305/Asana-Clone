"""Test authentication endpoints."""

import pytest


def test_login_success(client, db_session):
    from models import Organization, User
    db_session.add(Organization(id="org_t", name="Test"))
    db_session.add(User(id="usr_t", username="testuser", password_hash="testpass", name="Test", email="t@t.com", role="standard", organization_id="org_t"))
    db_session.commit()

    resp = client.post("/auth/login", json={"username": "testuser", "password": "testpass"})
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["token"].startswith("sess_")
    assert data["user"]["username"] == "testuser"


def test_login_bad_password(client, db_session):
    from models import Organization, User
    db_session.add(Organization(id="org_t2", name="Test2"))
    db_session.add(User(id="usr_t2", username="user2", password_hash="correct", name="U2", email="u2@t.com", role="standard", organization_id="org_t2"))
    db_session.commit()

    resp = client.post("/auth/login", json={"username": "user2", "password": "wrong"})
    assert resp.status_code == 401


def test_auth_me_unauthenticated(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_auth_me_authenticated(client, db_session):
    from models import Organization, User
    db_session.add(Organization(id="org_t3", name="Test3"))
    db_session.add(User(id="usr_t3", username="me_user", password_hash="pass", name="Me", email="me@t.com", role="admin", organization_id="org_t3"))
    db_session.commit()

    login_resp = client.post("/auth/login", json={"username": "me_user", "password": "pass"})
    token = login_resp.json()["token"]

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["user"]["username"] == "me_user"


def test_logout(client, db_session):
    from models import Organization, User
    db_session.add(Organization(id="org_t4", name="Test4"))
    db_session.add(User(id="usr_t4", username="logout_user", password_hash="pass", name="Lo", email="lo@t.com", role="standard", organization_id="org_t4"))
    db_session.commit()

    login_resp = client.post("/auth/login", json={"username": "logout_user", "password": "pass"})
    token = login_resp.json()["token"]

    logout_resp = client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_resp.status_code == 200

    # Token should now be invalid
    me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 401
