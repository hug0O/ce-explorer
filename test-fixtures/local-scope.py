class Calc:
    def sum(self, a, b):
        result: int = a + b
        name: str = "x"
        return result
    

if __name__ == "__main__":
    calc = Calc()
    print(calc.sum(1, 2))