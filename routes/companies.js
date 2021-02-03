/** Routes for Companies */

const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

// Get / - returns {companies: [{code, name}, ...]}
router.get('/', async (req, res, next) => {
	try {
		const companiesQuery = await db.query('SELECT code, name FROM companies');
		return res.json({ companies: companiesQuery.rows });
	} catch (error) {
		return next(err);
	}
});

// GET /[code] - {company: {code, name, description}}
router.get('/:code', async (req, res, next) => {
	try {
		const code = req.params.code.toLowerCase();

		const companyQuery = await db.query(`SELECT code,name,description FROM companies WHERE code = $1`, [ code ]);
		if (companyQuery.rows.length === 0) {
			throw new ExpressError(`There is no company with code of: ${code}`, 404);
		}
		return res.json({ company: companyQuery.rows[0] });
	} catch (error) {
		return next(error);
	}
});

/**
 * POST /
 * Needs to be given JSON like: {code, name, description}
 * Returns obj of new company: {company: {code, name, description}}
 */
router.post('/', async (req, res, next) => {
	try {
		Object.keys(req.body).some((key) => {
			if (req.body[key] === '') {
				throw new ExpressError('Please provide valid parameters', 404);
			}
		});
		const lowerCode = req.body.code.toLowerCase();
		const result = await db.query(
			`INSERT INTO companies(code,name,description)
        VALUES($1,$2,$3)
        RETURNING code,name,description`,
			[ lowerCode, req.body.name, req.body.description ]
		);
		return res.status(201).json({ company: result.rows[0] });
	} catch (error) {
		next(error);
	}
});

/**
 * PUT /[code]
 * Edit Existing company
 * Return 404 if company not found
 * needs to be given JSON {name,description}
 * Returns update company object {company: {code,name,description}}
 */
router.put('/:code', async (req, res, next) => {
	try {
		if ('code' in req.body) {
			throw new ExpressError('Not Allowed', 400);
		}
		Object.keys(req.body).some((key) => {
			if (req.body[key] === '') {
				throw new ExpressError('Please provide valid parameters', 400);
			}
		});
		const code = req.params.code.toLowerCase();
		console.log('yes');
		const result = await db.query(
			`UPDATE companies
      SET name=$1, description=$2
      WHERE code=$3
      RETURNING code,name,description`,
			[ req.body.name, req.body.description, code ]
		);

		if (result.rows.length === 0) {
			throw new ExpressError(`There is no company with code of: ${code}`, 404);
		}

		return res.json({ company: result.rows[0] });
	} catch (error) {
		return next(error);
	}
});

/**
 * DELETE /[code]
 * Deletes company
 * Should return 404 if company cannot be found
 * Returns {status:"deleted"}
 */
router.delete('/:code', async (req, res, next) => {
	try {
		const code = req.params.code;
		const result = await db.query('DELETE FROM companies WHERE code = $1 RETURNING code', [ code ]);
		if (result.rows.length === 0) {
			throw new ExpressError(`There's no company with code of: ${code}`, 404);
		}
		return res.json({ status: 'deleted' });
	} catch (error) {
		return next(error);
	}
});

module.exports = router;
