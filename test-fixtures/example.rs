struct User {
    id: u64,
    name: String,
    email: String,
    active: bool,
}

impl User {
    pub fn new(id: u64, name: String, email: String) -> Self {
        Self {
            id,
            name,
            email,
            active: true,
        }
    }

    pub fn deactivate(&mut self) {
        self.active = false;
    }

    fn display_info(&self) -> String {
        format!("{} ({})", self.name, self.email)
    }
}

trait HasId {
    fn get_id(&self) -> u64;
}

impl HasId for User {
    fn get_id(&self) -> u64 {
        self.id
    }
}

enum Status {
    Active,
    Inactive,
    Pending,
}

pub fn free_add(a: i32, b: i32) -> i32 {
    a + b
}

fn free_helper(value: &str) -> String {
    value.to_string()
}
