const axios = require('axios');

export function predict(date, time, lat, lon) {
        // เรียก API ทำนายค่า PM2.5
        axios.post('http://localhost:5000/predict', {
            date,
            time,
            lat,
            lon
        }).then(
            response => {
                if(response.status == 200) {
                    return response.data;
                }
            }
        ).catch(err => {
            alert(err);
        });
}
