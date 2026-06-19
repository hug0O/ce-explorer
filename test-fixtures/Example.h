#pragma once
#include <string>

class Animal {
private:
    std::string name;
    int age;
protected:
    double weight;
public:
    Animal(const std::string& name, int age);
    virtual ~Animal();
    virtual std::string getName() const;
    void setAge(int age);
    virtual void makeSound() = 0;
};

class Dog : public Animal {
private:
    std::string breed;
public:
    Dog(const std::string& name, int age, const std::string& breed);
    void makeSound() override;
    std::string fetch();
};
