/** BizTime express application. */

const express = require('express');

const app = express();
const companyRoutes = require('./routes/companies');
const invoiceRoutes = require('./routes/invoices');
const ExpressError = require('./expressError');

app.use(express.json());
app.use('/companies', companyRoutes);
app.use('/invoices', invoiceRoutes);

/** 404 handler */

app.use(function(req, res, next) {
	const err = new ExpressError('Not Found', 404);
	return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
	const status = err.status || 500;
	const message = err.message;
	return res.status(status).json({
		error : { message, status }
	});
});

module.exports = app;
