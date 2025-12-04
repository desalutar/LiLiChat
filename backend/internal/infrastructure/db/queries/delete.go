package queries

const DeleteRecord = `
DELETE FROM %s
WHERE %s;
`
