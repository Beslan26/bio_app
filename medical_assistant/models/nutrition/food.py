from sqlalchemy import String, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column
from medical_assistant.database.base import Base



class FoodProducts(Base):
    """Пищевые продукты, их КБЖУ и Гликемический индекс"""

    __tablename__ = "food_products"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    calories: Mapped[int] = mapped_column(Integer, nullable=False)
    protein: Mapped[float] = mapped_column(Float, nullable=False)
    fats: Mapped[float] = mapped_column(Float, nullable=False)
    carbohydrates: Mapped[float] = mapped_column(Float, nullable=False)
    glycemic_index: Mapped[int] = mapped_column(Integer, nullable=False)


class MealIngredients(Base):
    """Состав блюд. Промежуточная таблица между food_products и meals"""

    __tablename__ = "meal_ingredients"

    id: Mapped[int] = mapped_column(primary_key=True)
    meal_id: Mapped[int] = mapped_column(ForeignKey("meals.id"))
    food_product_id:Mapped[int] = mapped_column(ForeignKey("food_products.id"))
    weight_grams: Mapped[int] = mapped_column(Integer, nullable=False)


class Meals(Base):
    """Блюда"""

    __tablename__ = "meals"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
