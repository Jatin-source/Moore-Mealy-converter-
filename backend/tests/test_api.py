import pytest
from backend.app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'ok'

def test_api_validate(client):
    valid_moore = {
        "type": "moore",
        "states": ["q0", "q1"],
        "alphabet": ["0", "1"],
        "outputAlphabet": ["0", "1"],
        "initialState": "q0",
        "outputs": {"q0": "0", "q1": "1"},
        "transitions": [
            {"from": "q0", "input": "0", "to": "q1"},
            {"from": "q0", "input": "1", "to": "q0"},
            {"from": "q1", "input": "0", "to": "q1"},
            {"from": "q1", "input": "1", "to": "q0"}
        ]
    }
    res = client.post('/api/validate', json={"machine": valid_moore})
    assert res.status_code == 200
    assert res.get_json()["valid"] is True

def test_api_convert(client):
    moore = {
        "type": "moore",
        "states": ["q0", "q1"],
        "alphabet": ["0", "1"],
        "initialState": "q0",
        "outputs": {"q0": "0", "q1": "1"},
        "transitions": [
            {"from": "q0", "input": "0", "to": "q1"},
            {"from": "q0", "input": "1", "to": "q0"},
            {"from": "q1", "input": "0", "to": "q1"},
            {"from": "q1", "input": "1", "to": "q0"}
        ]
    }
    res = client.post('/api/convert', json={"machine": moore, "target_type": "mealy"})
    assert res.status_code == 200
    data = res.get_json()
    assert "converted_machine" in data
    assert "steps" in data
    assert data["converted_machine"]["type"] == "mealy"

def test_api_batch_test(client):
    moore = {
        "type": "moore",
        "states": ["q0", "q1"],
        "alphabet": ["0", "1"],
        "initialState": "q0",
        "outputs": {"q0": "0", "q1": "1"},
        "transitions": [
            {"from": "q0", "input": "0", "to": "q1"},
            {"from": "q0", "input": "1", "to": "q0"},
            {"from": "q1", "input": "0", "to": "q1"},
            {"from": "q1", "input": "1", "to": "q0"}
        ]
    }
    mealy = {
        "type": "mealy",
        "states": ["q0", "q1"],
        "alphabet": ["0", "1"],
        "initialState": "q0",
        "transitions": [
            {"from": "q0", "input": "0", "to": "q1", "output": "1"},
            {"from": "q0", "input": "1", "to": "q0", "output": "0"},
            {"from": "q1", "input": "0", "to": "q1", "output": "1"},
            {"from": "q1", "input": "1", "to": "q0", "output": "0"}
        ]
    }
    res = client.post('/api/batch_test', json={
        "original_machine": moore,
        "converted_machine": mealy,
        "test_strings": ["01", "101", "1100"]
    })
    assert res.status_code == 200
    report = res.get_json()
    assert report["all_matched"] is True
    assert report["total"] == 3
