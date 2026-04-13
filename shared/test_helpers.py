import requests


class ToolServerClient:
    def __init__(self, base_url: str = "http://localhost:8030"):
        self.base_url = base_url

    def health(self):
        return requests.get(f"{self.base_url}/health").json()

    def tools(self):
        return requests.get(f"{self.base_url}/tools").json()

    def call_tool(self, tool_name: str, parameters: dict = None):
        r = requests.post(
            f"{self.base_url}/step",
            json={"action": {"tool_name": tool_name, "parameters": parameters or {}}},
        )
        return r.json()

    def reset(self):
        return requests.post(f"{self.base_url}/reset").json()

    def snapshot(self):
        return requests.get(f"{self.base_url}/snapshot").json()

    def login(self, username: str, password: str):
        return requests.post(
            f"{self.base_url}/auth/login",
            json={"username": username, "password": password},
        )

    def logout(self, token: str):
        return requests.post(
            f"{self.base_url}/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )
