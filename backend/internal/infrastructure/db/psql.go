package db

import (
	"database/sql"
	"fmt"
	"lilyChat/internal/infrastructure/db/queries"
	"lilyChat/internal/infrastructure/db/sqlutil"
)

type PostgresRepo struct {
	DB *sql.DB
}

func NewPostgresRepo(db *sql.DB) *PostgresRepo {
	return &PostgresRepo{DB: db}
}

func (r *PostgresRepo) Create(table string, record Record) error {
	columns, placeholders, args := sqlutil.ExtractColumnsAndPlaceholders(record)
	query := fmt.Sprintf(queries.Insert, table, columns, placeholders)

	_, err := r.DB.Exec(query, args...)
	return err
}


func (r *PostgresRepo) Get(table string, filters map[string]interface{}) ([]Record, error) {
	where, args := sqlutil.BuildWhereClause(filters)

	var query string
	if where == "" {
		query = fmt.Sprintf(queries.GetAll, table)
	} else {
		query = fmt.Sprintf(queries.GetByFilters, table, where)
	}

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Record
	cols, _ := rows.Columns()
	for rows.Next() {
		row := make([]interface{}, len(cols))
		rowPtrs := make([]interface{}, len(cols))
		for i := range row {
			rowPtrs[i] = &row[i]
		}
		rows.Scan(rowPtrs...)

		rec := make(Record)
		for i, col := range cols {
			rec[col] = row[i]
		}
		results = append(results, rec)
	}
	return results, nil
}


func (r *PostgresRepo) Update(table string, filters map[string]interface{}, updates Record) error {
	where, whereArgs := sqlutil.BuildWhereClause(filters)
	setClause, setArgs := sqlutil.BuildUpdateClause(updates, len(whereArgs)+1)

	query := fmt.Sprintf(queries.UpdateRecord, table, setClause, where)
	args := append(setArgs, whereArgs...)

	_, err := r.DB.Exec(query, args...)
	return err
}


func (r *PostgresRepo) Delete(table string, filters map[string]interface{}) error {
	where, args := sqlutil.BuildWhereClause(filters)
	query := fmt.Sprintf(queries.DeleteRecord, table, where)

	_, err := r.DB.Exec(query, args...)
	return err
}

