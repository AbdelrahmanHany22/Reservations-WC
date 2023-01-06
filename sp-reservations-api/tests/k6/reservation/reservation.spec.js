// import http from 'k6/http';
// import { check, sleep } from 'k6';

// // Configure our test to run 50 virtual users continuously for one minute. 
// // Because of the sleep added, this will result in just below 50 iterations per second
// // resulting in a total of about 2900 iterations.
// export const options = {
//   duration: '10s',
//   vus: 50,
// };

// export default function () {
//   const res = http.get('http://localhost:3000/api/v1/health');
//   // assertions
//   check(res, { 'status was 200': (r) => r.status == 200 });
//   sleep(1);
// }
import axios from 'axios';
import reservation from '../../../api/index';

const BASE_URL = 'http://localhost:5005'

jest.mock('axios')

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

describe("Reservation process", ()=>{
  // Weather Endpoint
  test('Expected Reservation Response', async () => {
    const data = {"email":"abdo@gmail.com","matchNumber":11,"tickets":{"category":1,"quantity":1,"price":75},
    "card":{"number":"4242 4242 4242 4242","expirationMonth":12,"expirationYear":2023,"cvc":"424"}
  }
  axios.post.mockResolvedValueOnce(data);
    const response = await request(BASE_URL).post('/api/v1/reservation')
    .send(data)
    expect(response.body).toEqual(mockWeatherApiStub.data);
    expect(getWeather).toHaveBeenCalled();
  });
  test('Incorrect Weather Arguments', async () => {
    const response = await request(BASE_URL).get('/weather?state=istanbul')
    expect(response.error.text).toContain("Expected city argument");
  });
  test('No Weather Response', async () => {
    getWeather.mockImplementationOnce((location) => null);
    const response = await request(BASE_URL).get('/weather?city=Cairo')
    expect(response.error.text).toContain("Could not process request");
  }); 
})