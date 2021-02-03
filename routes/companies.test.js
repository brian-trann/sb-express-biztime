process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');

let testCompany;

beforeEach(async () => {
	let result = await db.query(
		`INSERT INTO companies(code,name,description)
        VALUES('abc','ABC','Sells the alphabet')
        RETURNING code,name,description`
	);
	testCompany = result.rows[0];
});

/**
 * GET / companies
 */
describe('GET /companies', () => {
	test('should get a list of all companies', async () => {
		const res = await request(app).get('/companies');

		expect(res.statusCode).toEqual(200);
		expect(res.body).toEqual({ companies: [ { code: testCompany.code, name: testCompany.name } ] });
	});
});

/**
 * GET /companies/[code]
 */
describe('GET /companies/[code]', () => {
	test('should get a company by a given code', async () => {
		const res = await request(app).get(`/companies/${testCompany.code}`);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toEqual({ company: testCompany });
	});
	test('should return 404 if given a bad code', async () => {
		const res = await request(app).get(`/companies/0`);
		expect(res.statusCode).toEqual(404);
	});
});

/**
 * POST /companies
 */
describe('POST /companies', () => {
	test('should insert a company ', async () => {
		const res = await request(app)
			.post('/companies')
			.send({ name: 'TEST', code: 'test', description: 'thisisatest' });
		expect(res.statusCode).toEqual(201);
		expect(res.body).toEqual({
			company : {
				code        : 'test',
				name        : 'TEST',
				description : 'thisisatest'
			}
		});
	});
});

/**
 * PUT /companies/[code]
 */
describe('PUT /companies/:code', () => {
	test('should update a single company ', async () => {
		const res = await request(app)
			.put(`/companies/${testCompany.code}`)
			.send({ name: 'newName', description: 'newDescription' });
		expect(res.statusCode).toEqual(200);
		expect(res.body).toEqual({
			company : { code: testCompany.code, name: 'newName', description: 'newDescription' }
		});
	});
	test('should respond with 404 if invalid company code', async () => {
		const res = await request(app).put('/companies/0').send({ name: 'newName', description: 'newDescription' });
		expect(res.statusCode).toEqual(404);
	});
});

/**
 * DELETE /companies/[code]
 */
describe('DELETE company', () => {
	test('should delete a company', async () => {
		const res = await request(app).delete(`/companies/${testCompany.code}`);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toEqual({ status: 'deleted' });
	});
	test('should respond with 404 if invalid company code', async () => {
		const res = await request(app).delete('/companies/zzz');
		expect(res.statusCode).toEqual(404);
	});
});

afterEach(async () => {
	// delete any data created by test
	await db.query('DELETE FROM companies');
});

afterAll(async () => {
	// Close connection to db
	await db.end();
});
