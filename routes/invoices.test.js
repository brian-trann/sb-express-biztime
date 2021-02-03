process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');

let testInvoice;
let testCompany;

beforeEach(async () => {
	let resultCompany = await db.query(
		`INSERT INTO companies(code,name,description)
	    VALUES('abc','ABC','Sells the alphabet')
	    RETURNING code,name,description`
	);
	let resultInvoice = await db.query(
		`INSERT INTO invoices (comp_code ,amt , paid,add_date)
        VALUES ('abc','100','false', '2/2/2021')
        RETURNING comp_code, amt, paid, add_date, paid_date, id`
	);
	testInvoice = resultInvoice.rows[0];
	testCompany = resultCompany.rows[0];
});
afterEach(async () => {
	// delete any data created by test
	await db.query('DELETE FROM invoices');
	await db.query('DELETE FROM companies');
});

afterAll(async () => {
	// Close connection to db
	await db.end();
});

/**
 * GET / invoices
 */
describe('GET /invoices', () => {
	test('should get a list of all invoices', async () => {
		const res = await request(app).get('/invoices');

		expect(res.statusCode).toEqual(200);
		// expect(res.body).toEqual({ companies: [ { code: testCompany.code, name: testCompany.name } ] });
	});
});

/**
 * GET /invoices/[id]
 */
describe('GET /invoices/[id]', () => {
	test('should get a invoice by a given id', async () => {
		console.log(testInvoice.id);
		const res = await request(app).get(`/invoices/${testInvoice.id}`);
		expect(res.statusCode).toEqual(200);
		// expect(res.body).toEqual({ company: testCompany });
	});
	test('should return 404 if given a bad code', async () => {
		const res = await request(app).get('/invoices/0');
		expect(res.statusCode).toEqual(404);
	});
});

/**
 * POST /invoices
 */
describe('POST /invoices', () => {
	test('should insert a new invoice ', async () => {
		const res = await request(app).post('/invoices').send({ comp_code: testCompany.code, amt: 100 });
		expect(res.statusCode).toEqual(201);
		expect(res.body).toEqual({
			invoice : {
				id        : expect.any(Number),
				comp_code : testCompany.code,
				amt       : 100,
				paid      : false,
				add_date  : expect.any(String),
				paid_date : null
			}
		});
	});
});

/**
 * PUT /companies/[code]
 */
describe('PUT /invoices/:id', () => {
	test('should update a single invoice ', async () => {
		const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: 50, paid: true });
		expect(res.statusCode).toEqual(200);
	});
	test('should respond with 404 if invalid company code', async () => {
		const res = await request(app).put('/companies/0').send({ amt: 50, paid: true });
		expect(res.statusCode).toEqual(404);
	});
});

/**
 * DELETE /invoice/[id]
 */
describe('DELETE invoice', () => {
	test('should delete an invoice', async () => {
		const res = await request(app).delete(`/invoices/${testInvoice.id}`);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toEqual({ status: 'deleted' });
	});
	test('should respond with 404 if invalid invoice id', async () => {
		const res = await request(app).delete('/invoices/0');
		expect(res.statusCode).toEqual(404);
	});
});
