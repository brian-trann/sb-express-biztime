/** Routes for Industries */

const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

/**
 * GET / 
 * Get all industries
 */
router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(
			`SELECT ind.code,ind.industry,c.name
      FROM industries AS ind
      LEFT JOIN 
        companies_industries AS ci
        ON ind.code = ci.industry_code
      LEFT JOIN
        companies AS c
        ON ci.comp_code = c.code`
		);

		const industriesArr = [];
		results.rows.forEach((row) => {
			if (!industriesArr.some((element) => element.code === row.code)) {
				industriesArr.push({ code: row.code, industry: row.industry, companies: [ row.name ] });
			} else {
				industriesArr.forEach((industry) => {
					if (industry.code === row.code) {
						industry.companies.push(row.name);
					}
				});
			}
		});

		return res.json({ industries: industriesArr });
	} catch (error) {
		return next(error);
	}
});

/**
 * GET /[code]
 */
router.get('/:code', async (req, res, next) => {
	try {
		const industryCode = req.params.code.toLowerCase();

		const result = await db.query(
			`SELECT comp_code
      FROM companies_industries
      WHERE industry_code = $1
      `,
			[ industryCode ]
		);
		if (result.rows.length === 0) {
			throw new ExpressError('No companies in that industry', 404);
		}
		const companies = result.rows.map((company) => company['comp_code']);
		return res.json({ industry: industryCode, companies: companies });
	} catch (error) {
		return next(error);
	}
});

/**
 * POST /
 * Adding an industry 
 * Accepts {code,industry}
 * Returns {industry:{code,industry}}
 */
router.post('/', async (req, res, next) => {
	try {
		Object.keys(req.body).some((key) => {
			if (req.body[key] === '') {
				throw new ExpressError('Please provide valid parameters', 404);
			}
		});
		const { code, industry } = req.body;
		const slugCode = code.replace(/[^\w]/g, '').toLowerCase();
		const results = await db.query(
			`
      INSERT INTO industries (code, industry)
      VALUES ($1,$2)
      RETURNING code, industry
    `,
			[ slugCode, industry ]
		);
		return res.status(201).json({ industry: results.rows[0] });
	} catch (error) {
		return next(error);
	}
});

/**
 * PUT /[code]
 * Accepts JSON {comp_code}
 */
router.put('/:code', async (req, res, next) => {
	try {
		const { comp_code } = req.body;
		const industryCode = req.params.code.toLowerCase();
		const slugCompCode = comp_code.replace(/[^\w]/g, '').toLowerCase();
		const currResult = await db.query(
			`SELECT comp_code
      FROM companies_industries
      WHERE industry_code = $1
      `,
			[ industryCode ]
		);
		console.log(currResult.rows);
		if (currResult.rows.some((element) => element['comp_code'] === slugCompCode)) {
			throw new ExpressError('Company already in the industry', 404);
		}
		const result = await db.query(
			`
      INSERT INTO companies_industries (comp_code,industry_code)
      VALUES ($1, $2)
      RETURNING comp_code,industry_code
    `,
			[ slugCompCode, industryCode ]
		);
		if (result.rows.length === 0) {
			throw new ExpressError(`There invalid company or industry code`, 404);
		}

		return res.json({ status: 'updated' });
	} catch (error) {
		return next(error);
	}
});

module.exports = router;
