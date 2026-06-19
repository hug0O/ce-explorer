package com.example;

import java.util.List;
import java.util.ArrayList;

public class Animal {
    private String name;
    private int age;
    protected String species;

    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
        this.species = "Unknown";
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public String makeSound(int zz, int aa) {
        // TODO: implement
    }

    @Override
    public String toString() {
        return name + " (" + species + ", age " + age + ")";
    }

}

interface Speakable {
    String speak();
    int getVolume();
}

abstract class Mammal extends Animal {
    protected double bodyTemp;

    public Mammal(String name, int age, double bodyTemp) {
        super(name, age);
        this.bodyTemp = bodyTemp;
    }

    public abstract String getHabitat();
}
