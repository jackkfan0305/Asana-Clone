import requests
import time
import sys


def wait_for_health(base_url: str, timeout: int = 60):
    """Wait for the tool server to be healthy."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(f"{base_url}/health", timeout=5)
            if r.status_code == 200:
                print("Server is healthy!")
                return True
        except requests.ConnectionError:
            pass
        time.sleep(1)
    print("Timeout waiting for server health")
    sys.exit(1)


def call_tool(base_url: str, tool_name: str, parameters: dict) -> dict:
    """Call a tool via POST /step."""
    r = requests.post(
        f"{base_url}/step",
        json={"action": {"tool_name": tool_name, "parameters": parameters}},
        timeout=30,
    )
    data = r.json()
    if data.get("observation", {}).get("is_error"):
        print(f"  ERROR: {data['observation']['text']}")
    return data


def verify_seed(base_url: str):
    """Quick verification that seed data was loaded."""
    r = requests.get(f"{base_url}/snapshot", timeout=30)
    data = r.json()
    counts = {table: len(rows) for table, rows in data.items() if isinstance(rows, list)}
    print("Seed verification:")
    for table, count in sorted(counts.items()):
        print(f"  {table}: {count} rows")
    total = sum(counts.values())
    print(f"  TOTAL: {total} rows")
    return total > 0
