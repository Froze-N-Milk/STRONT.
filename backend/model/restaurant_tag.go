package model

import "github.com/google/uuid"

type RestaurantTag struct {
	SearchTag    string      `gorm:"type:text;primaryKey"`
	RestaurantID uuid.UUID   `gorm:"primaryKey"`
	Restaurants  *Restaurant `gorm:"foreignKey:RestaurantID"`
}
