pub struct Product {
    pub name: String,
    pub price: f64,
    quantity: i32,
}

impl Product {
    pub fn new(name: String, price: f64, quantity: i32) -> Self {
        Product { name, price, quantity }
    }

    pub fn total_value(&self) -> f64 {
        self.price * self.quantity as f64
    }

    pub fn restock(&mut self, amount: i32) {
        self.quantity += amount;
    }
}

pub struct Inventory {
    products: Vec<Product>,
}

impl Inventory {
    pub fn new() -> Self {
        Inventory { products: Vec::new() }
    }

    pub fn add(&mut self, product: Product) {
        self.products.push(product);
    }

    pub fn total_value(&self) -> f64 {
        self.products.iter().map(|p| p.total_value()).sum()
    }
}
