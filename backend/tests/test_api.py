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

def test_api_dfa_input_and_convert(client):
    dfa_payload = {
        "type": "dfa",
        "states": [
            "q0", "q1", "q2", "q3", "q4",
            "q5", "q6", "q7", "q8", "q9"
        ],
        "alphabet": ["0", "1"],
        "initialState": "q0",
        "finalStates": ["q3", "q5", "q7", "q9"],
        "transitions": [
            {"from": "q0", "input": "0", "to": "q1"},
            {"from": "q0", "input": "1", "to": "q2"},
            {"from": "q1", "input": "0", "to": "q3"},
            {"from": "q1", "input": "1", "to": "q4"},
            {"from": "q2", "input": "0", "to": "q5"},
            {"from": "q2", "input": "1", "to": "q6"},
            {"from": "q3", "input": "0", "to": "q7"},
            {"from": "q3", "input": "1", "to": "q8"},
            {"from": "q4", "input": "0", "to": "q9"},
            {"from": "q4", "input": "1", "to": "q0"},
            {"from": "q5", "input": "0", "to": "q1"},
            {"from": "q5", "input": "1", "to": "q2"},
            {"from": "q6", "input": "0", "to": "q3"},
            {"from": "q6", "input": "1", "to": "q4"},
            {"from": "q7", "input": "0", "to": "q5"},
            {"from": "q7", "input": "1", "to": "q6"},
            {"from": "q8", "input": "0", "to": "q9"},
            {"from": "q8", "input": "1", "to": "q0"},
            {"from": "q9", "input": "0", "to": "q1"},
            {"from": "q9", "input": "1", "to": "q2"}
        ]
    }

    # 1. Test /api/validate on DFA
    res_val = client.post('/api/validate', json={"machine": dfa_payload})
    assert res_val.status_code == 200
    val_data = res_val.get_json()
    assert val_data["valid"] is True
    assert len(val_data["errors"]) == 0

    # 2. Test /api/convert on DFA -> Mealy
    res_conv = client.post('/api/convert', json={"machine": dfa_payload, "target_type": "mealy"})
    assert res_conv.status_code == 200
    conv_data = res_conv.get_json()
    assert "converted_machine" in conv_data
    assert conv_data["converted_machine"]["type"] == "mealy"
    assert len(conv_data["converted_machine"]["states"]) == 10
    assert len(conv_data["converted_machine"]["transitions"]) == 20

    # Transitions going to final states (q3, q5, q7, q9) must emit output '1'
    for tr in conv_data["converted_machine"]["transitions"]:
        if tr["to"] in ["q3", "q5", "q7", "q9"]:
            assert tr["output"] == "1"
        else:
            assert tr["output"] == "0"

    # 3. Test /api/simulate on DFA
    res_sim = client.post('/api/simulate', json={"machine": dfa_payload, "input_string": "00"})
    assert res_sim.status_code == 200
    sim_data = res_sim.get_json()
    # Path: q0 (output 0) --0--> q1 (output 0) --0--> q3 (output 1)
    assert sim_data["final_state"] == "q3"
    assert sim_data["output_string"] == "001"

    # 4. Test /api/batch_test between original DFA (as Moore) and converted Mealy
    res_batch = client.post('/api/batch_test', json={
        "original_machine": dfa_payload,
        "converted_machine": conv_data["converted_machine"],
        "test_strings": ["0", "1", "00", "01", "10", "11", "000", "010", "101", "010101"]
    })
    assert res_batch.status_code == 200
    batch_data = res_batch.get_json()
    assert batch_data["all_matched"] is True
    assert batch_data["passed"] == 10


