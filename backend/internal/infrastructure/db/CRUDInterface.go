package db

type Record map[string]interface{}

type Repository interface {
	Create(table string, record Record) error
	Get(table string, filters map[string]interface{}) ([]Record, error)
	Update(table string, filters map[string]interface{}, updates Record) error
	Delete(table string, filters map[string]interface{}) error
}