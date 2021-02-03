/** Routes for Invoices */

const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

// Get / - returns {invoices: [{id, comp_code}, ...]}
router.get('/', async (req, res, next) => {
	try {
		const invoicesQuery = await db.query('SELECT id, comp_code FROM invoices');
		return res.json({ invoices: invoicesQuery.rows });
	} catch (error) {
		return next(err);
	}
});

/**
 * Get /[id]
 * 404 if not found
 * Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
 */
router.get('/:id', async (req, res, next) => {
	try {
		const id = req.params.id;
		const result = await db.query(
			`SELECT invoices.id,
            invoices.amt,
            invoices.comp_code,
            invoices.paid,
            invoices.add_date,
            invoices.paid_date,
            companies.name,
            companies.description FROM invoices
      INNER JOIN companies ON (invoices.comp_code = companies.code)
      WHERE id = $1`,
			[ id ]
		);

		if (result.rows.length === 0) {
			throw new ExpressError(`There is no company with code: ${id}`);
		}
		const d = result.rows[0];
		const invoice = {
			id        : d.id,
			amt       : d.amt,
			paid      : d.paid,
			add_date  : d.add_date,
			paid_data : d.paid_date,
			company   : {
				code        : d.comp_code,
				name        : d.name,
				description : d.description
			}
		};

		return res.json({ invoice });
	} catch (error) {
		return next(error);
	}
});

/**
 * POST /
 * Adds an invoice
 * Needs to be passed in JSON body of: {comp_code, amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post('/', async (req, res, next) => {
	try {
		const { comp_code, amt } = req.body;
		if (comp_code === '' || amt === '') {
			throw new ExpressError('Please provide valid parameters', 404);
		}
		// lowercase, just in case,for user
		const lowerCompCode = comp_code.toLowerCase();

		const result = await db.query(
			`INSERT INTO invoices (comp_code, amt)
      VALUES ($1,$2)
      RETURNING id, comp_code,amt,paid, add_date, paid_date`,
			[ lowerCompCode, amt ]
		);

		return res.json({ invoice: result.rows[0] });
	} catch (error) {
		return next(error);
	}
});

/**
 * PUT /[id]
 * Edit existing invoice
 * Return 404 if company not found
 * Needs to be passed in a JSON body of {amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put('/:id', async (req, res, next) => {
	try {
		const id = req.params.id;
		let { amt, paid } = req.body;

		let paidDate;
		if ('id' in req.body) {
			throw new ExpressError('Not Allowed', 400);
		} else if (req.body.amt === '') {
			throw new ExpressError("'amt' can not be blank.", 400);
		}

		const currResult = await db.query(
			`
      SELECT paid
      FROM invoices
      WHERE id = $1`,
			[ id ]
		);
		if (currResult.rows.length === 0) {
			throw new ExpressError(`There is no invoice with id of: ${id}`, 404);
		}

		const currPaidDate = currResult.rows[0].paid_date;

		if (!currPaidDate && paid) {
			paidDate = new Date();
		} else if (!paid) {
			paidDate = null;
		} else {
			paidDate = currPaidDate;
		}
		const result = await db.query(
			`
      UPDATE invoices
      SET amt = $1, paid = $2, paid_date= $3
      WHERE id = $4
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[ amt, paid, paidDate, id ]
		);

		return res.json({ invoice: result.rows[0] });
	} catch (error) {
		return next(error);
	}
});

/**
 * DELETE /[id]
 * Deletes an invoice
 * Should return 404 if company cannot be found
 * Returns {status:"deleted"}
 */
router.delete('/:id', async (req, res, next) => {
	try {
		const id = req.params.id;
		const result = await db.query(`DELETE FROM invoices WHERE id=$1`, [ id ]);
		if (result.rows.length === 0) {
			throw new ExpressError(`There's no company with code of: ${code}`, 404);
		}
		return res.json({ status: 'deleted' });
	} catch (error) {
		return next(error);
	}
});
module.exports = router;
