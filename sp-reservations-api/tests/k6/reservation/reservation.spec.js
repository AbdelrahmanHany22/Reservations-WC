const request = require('supertest');
const axios = require('axios');//import reservation from '../../../api/index';
const reservationApiStub = require('./reservation.api.Stub.json');
const BASE_URL = 'https://reservations-wc.vercel.app'

jest.mock('axios')

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

describe("Reservation process", ()=>{
  // tests
  test('Expected Reservation Response for good requests to be equal to preset', async () => {
    const data = {"email":"abdo@gmail.com","matchNumber":11,"tickets":{"category":1,"quantity":1,"price":75},
    "card":{"number":"4242 4242 4242 4242","expirationMonth":12,"expirationYear":2023,"cvc":"424"}
  }
  jest.setTimeout(12000)
  axios.post.mockResolvedValueOnce(data);
    const response = await request(BASE_URL).post('/api/v1/reservation').send(data)

    expect(response.statusCode).toBe(200);
    expect(response.body.doc.price).toEqual(reservationApiStub.data.doc.price);
    expect(response.body.doc.email).toEqual(reservationApiStub.data.doc.email);
    expect(response.body.message).toEqual(reservationApiStub.data.message);
  });

  test('Expected Reservation Response for Wrong category/price combination', async () => {
    const data = {"email":"abdo@gmail.com","matchNumber":11,"tickets":{"category":3,"quantity":1,"price":75},
    "card":{"number":"4242 4242 4242 4242","expirationMonth":12,"expirationYear":2023,"cvc":"424"}
  }
  jest.setTimeout(5000)
  axios.post.mockResolvedValueOnce(data);
    const response = await request(BASE_URL).post('/api/v1/reservation').send(data)

    expect(response.statusCode).toBe(403);

  });
  
  test('Expected Reservation Response missing input', async () => {
    const data = {"email":"","matchNumber":11,"tickets":{"category":1,"quantity":1,"price":75},
    "card":{"number":"4242 4242 4242 4242","expirationMonth":12,"expirationYear":2023,"cvc":"424"}
  }
  jest.setTimeout(5000)
  axios.post.mockResolvedValueOnce(data);
    const response = await request(BASE_URL).post('/api/v1/reservation').send(data)

    expect(response.statusCode).toBe(403);
    expect(response.text).toBe(`"email" is not allowed to be empty`);
  });

  test('Expected Reservation Response failed stripe', async () => {
    const data = {"email":"abdo@gmail.com","matchNumber":1,"tickets":{"category":1,"quantity":1,"price":75},
    "card":{"number":"3535 4242 4242 4242","expirationMonth":12,"expirationYear":2023,"cvc":"424"}
  }
  jest.setTimeout(5000)
  axios.post.mockResolvedValueOnce(data);
    const response = await request(BASE_URL).post('/api/v1/reservation').send(data)
    expect(response.statusCode).toBe(400);
    expect(response.text).toMatch(`could not process payment:`);
  });

  test('Expected Reservation Response for quantity more than 2', async () => {
    const data = {"email":"abdo@gmail.com","matchNumber":11,"tickets":{"category":1,"quantity":9,"price":75},
    "card":{"number":"4242 4242 4242 4242","expirationMonth":12,"expirationYear":2023,"cvc":"424"}
  }
  jest.setTimeout(5000)
  axios.post.mockResolvedValueOnce(data);
    const response = await request(BASE_URL).post('/api/v1/reservation').send(data)
    expect(response.statusCode).toBe(403);
    expect(response.text).toMatch(`"tickets.quantity" must be less than or equal to 2`);
  });

// get reserved matches endpoint

  test('Expectedresponse for existing email in the db', async () => {
    const response = await request(BASE_URL).post('/api/v1/tickets/reserved').send({"email":"abdo@gmail.com"})
    expect(response.body.status).toEqual('success');
    expect(response.body.data).toBeDefined() ;
  });

  
  test('Expectedresponse for none existing email in the db', async () => {
    const response = await request(BASE_URL).post('/api/v1/tickets/reserved').send({"email":"gogogogog@gmail.com"})
    expect(response.body.status).toEqual('failed');
    expect(response.body.data).toEqual('No tickets bought with this email from this website.') ;
  });

})