package sqlutil

import (
    "fmt"
    "strings"
)

func ExtractColumnsAndPlaceholders(record map[string]interface{}) (columns string, placeholders string, args []interface{}) {
	cols := []string{}
	phs := []string{}
	args = []interface{}{}
	i := 1
	for k, v := range record {
		cols = append(cols, k)
		phs = append(phs, fmt.Sprintf("$%d", i))
		args = append(args, v)
		i++
	}
	columns = strings.Join(cols, ", ")
	placeholders = strings.Join(phs, ", ")
	return
}

func BuildWhereClause(filters map[string]interface{}) (string, []interface{}) {
    clauses := []string{}
    args := []interface{}{}
    i := 1
    for k, v := range filters {
        clauses = append(clauses, fmt.Sprintf("%s = $%d", k, i))
        args = append(args, v)
        i++
    }
    return strings.Join(clauses, " AND "), args
}

func BuildUpdateClause(updates map[string]interface{}, startIndex int) (string, []interface{}) {
	clauses := []string{}
	args := []interface{}{}
	i := startIndex
	for k, v := range updates {
		clauses = append(clauses, fmt.Sprintf("%s = $%d", k, i))
		args = append(args, v)
		i++
	}
	return strings.Join(clauses, ", "), args
}