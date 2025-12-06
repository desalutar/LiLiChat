package queries

const GetAll = `
SELECT * FROM %s;
`

const GetByFilters = `
SELECT * FROM %s
WHERE %s;
`