package com.example;

import java.util.List;

public class Person {
    private String name;
    private int age;
    protected String email;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
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

    protected void updateEmail(String email) {
        this.email = email;
    }
}

class Employee extends Person {
    private String department;
    private double salary;

    public Employee(String name, int age, String department) {
        super(name, age);
        this.department = department;
    }

    public double calculateBonus() {
        return salary * 0.1;
    }
}
