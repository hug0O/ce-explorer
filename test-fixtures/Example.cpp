#include "Example.h"
#include <iostream>

Animal::Animal(const std::string& name, int age) : name(name), age(age), weight(0.0) {
}

Animal::~Animal() {
}

std::string Animal::getName() const {
    return name;
}

void Animal::setAge(int age) {
    this->age = age;
}

void Animal::makeSound() {
}

Dog::Dog(const std::string& name, int age, const std::string& breed) : Animal(name, age), breed(breed) {
}

void Dog::makeSound() {
    std::cout << "Woof!" << std::endl;
}

std::string Dog::fetch() {
    return "Fetching...";
}

int add_numbers(int a, int b) {
    return a + b;
}

void free_helper(const std::string& msg);
