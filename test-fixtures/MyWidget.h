#pragma once

#include <string>
#include <vector>

class BaseWidget {
private:
    int m_id;
protected:
    std::string m_name;
public:
    BaseWidget();
    virtual ~BaseWidget();
    virtual void render() const = 0;
    int getId() const;
    void setName(const std::string& name);
};

class MyWidget : public BaseWidget {
private:
    int m_width;
    int m_height;
    bool m_visible;
    std::vector<std::string> m_items;
public:
    MyWidget(int width, int height);
    ~MyWidget() override;

    void render() const override;
    void addItem(const std::string& item);
    int getItemCount() const;

void MyWidget::m_width()
    {
    // TODO: implement
}

void MyWidget::m_height()
    {
    // TODO: implement
}

void MyWidget::m_visible()
    {
    // TODO: implement
}

void MyWidget::m_items()
    {
    // TODO: implement
}

void BaseWidget::m_id()
    {
    // TODO: implement
}

void BaseWidget::m_name()
    {
    // TODO: implement
}

void BaseWidget::render() const
    {
    // TODO: implement
}
    void setVisible(bool visible);
    bool isVisible() const;

    static int s_instanceCount;
};
