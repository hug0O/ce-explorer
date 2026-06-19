from abc import ABC, abstractmethod
from typing import List


class Shape(ABC):
    def __init__(self, name: str):
        self._name = name
        self.__id = 0

    @property
    def name(self) -> str:
        return self._name

    @abstractmethod
    def area(self) -> float:
        pass

    @abstractmethod
    def perimeter(self) -> float:
        pass


class Circle(Shape):
    def __init__(self, name: str, radius: float):
        super().__init__(name)
        self._radius = radius

    def area(self) -> float:
        return 3.14159 * self._radius ** 2

    def perimeter(self) -> float:
        return 2 * 3.14159 * self._radius


class Rectangle(Shape):
    def __init__(self, name: str, width: float, height: float):
        super().__init__(name)
        self._width = width
        self._height = height

    def area(self) -> float:
        return self._width * self._height

    def perimeter(self) -> float:
        return 2 * (self._width + self._height)
