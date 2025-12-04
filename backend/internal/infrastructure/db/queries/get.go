package queries

const GetByFilters = `
SELECT * FROM %s
WHERE %s;
`