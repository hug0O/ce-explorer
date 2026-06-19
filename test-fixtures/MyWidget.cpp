#include "MyWidget.h"
#include <iostream>

int MyWidget::s_instanceCount = 0;

BaseWidget::BaseWidget() : m_id(0) {
}

BaseWidget::~BaseWidget() {
}

int BaseWidget::getId() const {
    return m_id;
}

void BaseWidget::setName(const std::string& name) {
    m_name = name;
}

MyWidget::MyWidget(int width, int height)
    : m_width(width), m_height(height), m_visible(true) {
    s_instanceCount++;
}

MyWidget::~MyWidget() {
    s_instanceCount--;
}

void MyWidget::render() const {
    std::cout << "Rendering widget: " << m_name << std::endl;
}

void MyWidget::addItem(const std::string& item) {
    m_items.push_back(item);
}

int MyWidget::getItemCount() const {
    return static_cast<int>(m_items.size());
}

void MyWidget::setVisible(bool visible) {
    m_visible = visible;
}

bool MyWidget::isVisible() const {
    return m_visible;
}

