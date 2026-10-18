class Vehicle:
    def __init__(self, brand, model, year):
        self.brand = brand
        self.model = model
        self.year = year
        self._speed = 0

    @property
    def speed(self):
        return self._speed

    @speed.setter
    def speed(self, value):
        if value < 0:
            raise ValueError("Speed cannot be negative")
        self._speed = value

    def accelerate(self, amount):
        self._speed += amount
        return self._speed

    def brake(self, amount):
        self._speed = max(0, self._speed - amount)
        return self._speed

    def __str__(self):
        return f"{self.brand} {self.model} ({self.year})"

    @staticmethod
    def is_classic(year):
        return year < 2000

    @classmethod
    def from_dict(cls, data):
        return cls(data["brand"], data["model"], data["year"])

class ElectricVehicle(Vehicle):
    def __init__(self, brand, model, year, battery_kwh):
        super().__init__(brand, model, year)
        self.battery_kwh = battery_kwh
        self.__charge_level = 100

    def charge(self, amount):
        self.__charge_level = min(100, self.__charge_level + amount)

    def accelerate(self, amount):
        if self.__charge_level <= 0:
            print("No battery!")
            return 0
        self.__charge_level -= amount * 0.1
        return super().accelerate(amount)


def create_vehicle(brand, model, year):
    return Vehicle(brand, model, year)


async def fetch_data(url: str) -> dict:
    return {}
