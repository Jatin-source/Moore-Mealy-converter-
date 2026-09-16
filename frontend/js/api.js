const API = {
    async request(endpoint, payload) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'API Request Failed');
            }
            return data;
        } catch (error) {
            console.error(`API Error at ${endpoint}:`, error);
            throw error;
        }
    },

    async validate(machine) {
        return this.request('/api/validate', { machine });
    },

    async convert(machine, targetType) {
        return this.request('/api/convert', { machine, target_type: targetType });
    },

    async simulate(machine, inputString) {
        return this.request('/api/simulate', { machine, input_string: inputString });
    }
};

window.API = API;
