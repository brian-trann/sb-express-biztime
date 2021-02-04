\c biztime

DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries(
  code text PRIMARY KEY,
  industry text NOT NULL
);

CREATE TABLE companies_industries(
  comp_code text NOT NULL REFERENCES companies,
  industry_code text NOT NULL REFERENCES industries,
  PRIMARY KEY (comp_code,industry_code)
);

INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.');

INSERT INTO invoices (comp_code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null);

INSERT INTO industries (code, industry)
  VALUES ('tech', 'Technology'),
        ('fruit', 'Fruit');

INSERT INTO companies_industries (comp_code, industry_code)
  VALUES ('apple','tech'),
        ('apple','fruit'),
        ('ibm','tech');

-- SELECT ind.code,ind.industry,c.name
-- FROM industries AS ind
-- LEFT JOIN 
--   companies_industries AS ci
--   ON ind.code = ci.industry_code
-- LEFT JOIN
--   companies AS c
--   ON ci.comp_code = c.code;